import { Location, DestinationInfo } from '../types';
import toast from 'react-hot-toast';
import { config } from '../config';
import { calculateDistance, calculateDestination } from '../utils/geo';

interface GeocodingError extends Error {
  type: 'NETWORK_ERROR' | 'API_ERROR' | 'RATE_LIMIT' | 'PARSE_ERROR';
  status?: number;
}

const API_DELAY = 1000; // 1 second delay between API calls
let lastApiCall = 0;

interface NominatimFeature {
  display_name: string;
  address: {
    country?: string;
    state?: string;
    city?: string;
    water?: string;
    ocean?: string;
    sea?: string;
    bay?: string;
  };
  lat: string;
  lon: string;
}

export const fetchLocationDetailsNominatim = async function(lat: number, lon: number, retryCount = 0): Promise<any> {
  try {
    // Rate limiting
    const now = Date.now();
    const timeSinceLastCall = now - lastApiCall;
    
    if (timeSinceLastCall < API_DELAY) {
      await new Promise(resolve => setTimeout(resolve, API_DELAY - timeSinceLastCall));
    }
    
    lastApiCall = Date.now();

    // Set up request timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse` +
      `?lat=${lat}&lon=${lon}` +
      `&format=json`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'YourAppName' // Replace with your app name
        },
        signal: controller.signal,
        cache: 'no-cache'
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = new Error(`API error: ${response.status}`) as GeocodingError;
      error.type = response.status === 429 ? 'RATE_LIMIT' : 'API_ERROR';
      error.status = response.status;
      throw error;
    }

    const data: NominatimFeature = await response.json();
    
    if (!data) {
      const error = new Error('No location found') as GeocodingError;
      error.type = 'API_ERROR';
      throw error;
    }

    // Enhanced water detection
    const isWater = Boolean(
      data.address?.ocean ||
      data.address?.sea ||
      data.address?.water ||
      data.address?.bay ||
      /ocean|sea|gulf|bay|strait|channel/i.test(data.display_name)
    );

    return {
      display_name: data.display_name,
      address: {
        natural: isWater ? 'water' : undefined,
        water: isWater ? 'yes' : undefined,
        country: data.address?.country,
        state: data.address?.state,
        city: data.address?.city
      },
      isWater,
      location: {
        latitude: lat,
        longitude: lon
      }
    };

  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      const error = new Error('Request timed out') as GeocodingError;
      error.type = 'NETWORK_ERROR';
      throw error;
    }

    if (retryCount < config.maxRetries) {
      console.log(`Retrying... Attempt ${retryCount + 1} of ${config.maxRetries}`);
      await new Promise(resolve => setTimeout(resolve, config.retryDelay));
      return fetchLocationDetailsNominatim(lat, lon, retryCount + 1);
    }

    if (err instanceof Error) {
      if ((err as GeocodingError).type) {
        throw err;
      }
      
      const error = new Error(err.message) as GeocodingError;
      error.type = err instanceof TypeError ? 'NETWORK_ERROR' : 'PARSE_ERROR';
      throw error;
    }
    
    const error = new Error('Unknown error occurred') as GeocodingError;
    error.type = 'NETWORK_ERROR';
    throw error;
  }
};

// Optional: Helper function to format the display name
export function formatDisplayName(feature: NominatimFeature): string {
  const parts = [];
  
  if (feature.display_name) parts.push(feature.display_name.split(',')[0]);
  if (feature.address?.city) parts.push(feature.address.city);
  if (feature.address?.state) parts.push(feature.address.state);
  if (feature.address?.country) parts.push(feature.address.country);
  
  return parts.join(', ');
}

async function findDestinationsAlongHeading(
  start: Location,
  heading: number,
  initialDistance: number,
  increment = config.distanceIncrement
): Promise<DestinationInfo | null> {
  let currentDistance = initialDistance;
  let attempts = 0;

  while (attempts < config.maxSearchAttempts) {
    try {
      // Calculate next point to check using rhumb line (loxodromic) calculation
      const dest = calculateDestination(
        start.latitude,
        start.longitude,
        currentDistance,
        heading
      );

      // Get location data
      const osmData = await fetchLocationDetailsNominatim(dest.latitude, dest.longitude);
      const isWater = osmData.isWater;

      if (osmData.display_name && !isWater) {
        // Found a land location - return it
        const actualDistance = calculateDistance(
          start.latitude,
          start.longitude,
          dest.latitude,
          dest.longitude
        );

        return {
          name: osmData.display_name.split(',')[0] || 'Unknown Location',
          distance: Math.round(actualDistance * 10) / 10,
          location: {
            latitude: dest.latitude,
            longitude: dest.longitude
          },
          isMaritime: false
        };
      }

      // Location was water or invalid - try next distance
      currentDistance += increment;
      attempts++;
      
      // Add small delay between API calls
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error('Error finding destination:', error);
      currentDistance += increment;
      attempts++;
    }
  }

  toast.error('No destination found in the given direction.');
  return null;
}

export const isMaritimeLocation = (data: NominatimFeature): boolean => {
  return Boolean(
    data.address?.ocean ||
    data.address?.sea ||
    data.address?.water ||
    data.address?.bay ||
    /ocean|sea|gulf|bay|strait|channel/i.test(data.display_name)
  );
};

// Then create the alias export
export const fetchLocationDetails = fetchLocationDetailsNominatim;

// Finally, export other functions
export { 
  findDestinationsAlongHeading
};