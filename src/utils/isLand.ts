import axios from 'axios';

interface LocationResponse {
  address?: {
    country?: string;
    state?: string;
    city?: string;
    ocean?: string;
    sea?: string;
    water?: string;
    bay?: string;
    strait?: string;
    municipality?: string;
    county?: string;
  };
  display_name?: string;
}

export interface LocationResult {
  isLand: boolean;
  details: {
    displayName: string;
    type: 'land' | 'territorial_waters' | 'international_waters';
    description: string;
  };
}

export async function isLand(latitude: number, longitude: number): Promise<LocationResult> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;
    const response = await axios.get<LocationResponse>(url, {
      headers: { 'User-Agent': 'LandSeaChecker/1.0' }
    });
    const data = response.data;
    const address = data.address || {};

    // Check for water bodies first
    const waterFeatures = [
      address.ocean,
      address.sea,
      address.water,
      address.bay,
      address.strait
    ].filter(Boolean);

    if (waterFeatures.length > 0) {
      // Even if we have a country, if there are water features, it's water
      return {
        isLand: false,
        details: {
          displayName: data.display_name || 'Unknown location',
          type: 'international_waters',
          description: waterFeatures.join(', ')
        }
      };
    }

    // It's land only if we have detailed address information
    if (address.city || address.municipality || address.county) {
      return {
        isLand: true,
        details: {
          displayName: data.display_name || 'Unknown location',
          type: 'land',
          description: [
            address.city || address.municipality,
            address.county,
            address.state,
            address.country
          ].filter(Boolean).join(', ') || 'Land area'
        }
      };
    }

    // If we only have country without detailed info, it's territorial waters
    return {
      isLand: false,
      details: {
        displayName: data.display_name || 'Unknown location',
        type: 'territorial_waters',
        description: `Territorial waters of ${address.country || 'unknown country'}`
      }
    };
  } catch (error) {
    console.error("Error checking land or sea:", error);
    throw new Error("Could not determine land or sea for the provided coordinates.");
  }
}


