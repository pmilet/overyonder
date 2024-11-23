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

function isMaritimeLocation(name: string): boolean {
  const maritimeTerms = ['ocean', 'sea', 'gulf', 'bay', 'strait', 'channel'];
  return maritimeTerms.some(term => name.toLowerCase().includes(term));
}

async function fetchLocationDetails(lat: number, lon: number, retryCount = 0): Promise<any> {
  try {
    const now = Date.now();
    const timeSinceLastCall = now - lastApiCall;
    
    if (timeSinceLastCall < API_DELAY) {
      await new Promise(resolve => setTimeout(resolve, API_DELAY - timeSinceLastCall));
    }
    
    lastApiCall = Date.now();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=en`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'OverYonder/1.0'
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

    const data = await response.json();
    
    if (data.error) {
      const error = new Error(data.error) as GeocodingError;
      error.type = 'API_ERROR';
      throw error;
    }

    return data;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      const error = new Error('Request timed out') as GeocodingError;
      error.type = 'NETWORK_ERROR';
      throw error;
    }

    if (retryCount < config.maxRetries) {
      await new Promise(resolve => setTimeout(resolve, config.retryDelay));
      return fetchLocationDetails(lat, lon, retryCount + 1);
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
}

export async function findDestinationsAlongHeading(
  start: Location,
  heading: number,
  initialDistance: number,
  increment = config.distanceIncrement
): Promise<DestinationInfo | null> {
  let attempts = 0;
  let currentDistance = initialDistance;
  let lastToastId = '';
  let retryCount = 0;

  while (attempts < config.maxSearchAttempts) {
    try {
      const dest = calculateDestination(
        start.latitude,
        start.longitude,
        currentDistance,
        heading
      );

      lastToastId = `search-${attempts}`;
      toast.loading(
        `Searching at ${currentDistance}km (Attempt ${attempts + 1}/${config.maxSearchAttempts})...`, 
        { id: lastToastId }
      );

      const data = await fetchLocationDetails(dest.latitude, dest.longitude);
      
      if (data.display_name) {
        const isMaritime = isMaritimeLocation(data.display_name);
        const actualDistance = calculateDistance(
          start.latitude,
          start.longitude,
          dest.latitude,
          dest.longitude
        );

        if (!isMaritime) {
          toast.dismiss(lastToastId);
          
          return {
            name: data.display_name.split(',')[0] || 'Unknown Location',
            distance: Math.round(actualDistance * 10) / 10,
            location: {
              latitude: dest.latitude,
              longitude: dest.longitude
            },
            isMaritime: false
          };
        }
      }

      retryCount = 0; // Reset retry count for new distance
      attempts++;
      currentDistance += increment;
      
      await new Promise(resolve => setTimeout(resolve, config.apiDelay));

    } catch (error) {
      const geocodingError = error as GeocodingError;
      console.error('Error finding destination:', geocodingError);
      
      if (geocodingError.type === 'RATE_LIMIT' || geocodingError.type === 'NETWORK_ERROR') {
        if (retryCount < config.maxRetries) {
          retryCount++;
          toast.loading(
            `Network error, retrying (${retryCount}/${config.maxRetries})...`,
            { id: lastToastId }
          );
          await new Promise(resolve => setTimeout(resolve, config.retryDelay));
          continue;
        }
      }
      
      attempts++;
      retryCount = 0;
      currentDistance += increment;
    }
  }

  toast.dismiss(lastToastId);
  toast.error(`No land locations found within ${currentDistance}km`, { duration: 3000 });
  return null;
}

export { fetchLocationDetails, isMaritimeLocation };