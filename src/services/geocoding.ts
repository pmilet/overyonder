import * as turf from '@turf/turf';
import { Location, DestinationInfo } from '../types';
import toast from 'react-hot-toast';

const MAX_ATTEMPTS = 20; // Maximum search attempts

export async function findDestinationsAlongHeading(
  start: Location,
  heading: number,
  initialDistance: number,
  increment = 50 // Default increment if not specified
): Promise<DestinationInfo | null> {
  let attempts = 0;
  let currentDistance = initialDistance;
  let lastToastId = '';

  while (attempts < MAX_ATTEMPTS) {
    try {
      const startPoint = turf.point([start.longitude, start.latitude]);
      const destination = turf.destination(startPoint, currentDistance, heading, { units: 'kilometers' });
      const [lon, lat] = destination.geometry.coordinates;

      // Update search status toast
      lastToastId = `search-${attempts}`;
      toast.loading(
        `Searching at ${currentDistance}km (Attempt ${attempts + 1}/${MAX_ATTEMPTS})...`, 
        { id: lastToastId }
      );

      // Use Nominatim API (OpenStreetMap) to find places
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'OverYonder/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch location data');
      }

      const data = await response.json();
      
      // Check if we got a valid location (not water/ocean)
      if (!data.error && !data.display_name.toLowerCase().includes('ocean') && 
          !data.display_name.toLowerCase().includes('sea')) {
        // Calculate actual distance using turf
        const actualDistance = turf.distance(
          startPoint,
          turf.point([lon, lat]),
          { units: 'kilometers' }
        );

        // Clear the loading toast
        toast.dismiss(lastToastId);
        
        return {
          name: data.display_name.split(',')[0] || 'Unknown Location',
          distance: Math.round(actualDistance * 10) / 10,
          location: {
            latitude: lat,
            longitude: lon
          }
        };
      }

      // If we're over water, increment distance and try again
      attempts++;
      currentDistance += increment;
      
      // Add a small delay to prevent API rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error('Error finding destination:', error);
      attempts++;
      currentDistance += increment;
      
      // Clear the previous toast
      toast.dismiss(lastToastId);
    }
  }

  // Clear any remaining loading toasts
  toast.dismiss(lastToastId);
  toast.error(`No land locations found within ${currentDistance}km`, { duration: 3000 });
  return null;
}