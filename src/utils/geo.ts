const EARTH_RADIUS = 6371; // Earth's radius in kilometers

export function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS * c;
}

export function calculateDestination(
  lat: number,
  lon: number,
  distance: number,
  heading: number
): { latitude: number; longitude: number } {
  // Convert to radians
  const R = 6371; // Earth's radius in km
  const d = distance / R;
  const lat1 = lat * Math.PI / 180;
  const lon1 = lon * Math.PI / 180;
  const brng = heading * Math.PI / 180;

  // Special case for due East/West (constant latitude)
  if (heading === 90 || heading === 270) {
    const dLon = (heading === 90 ? d : -d) / Math.cos(lat1);
    return {
      latitude: lat,
      longitude: ((lon + (dLon * 180 / Math.PI)) + 540) % 360 - 180 // Normalize longitude
    };
  }

  // Standard rhumb line calculation
  let lat2 = lat1 + d * Math.cos(brng);
  const dPhi = Math.log(Math.tan(lat2/2 + Math.PI/4) / Math.tan(lat1/2 + Math.PI/4));
  const q = Math.abs(dPhi) > 1e-10 ? (lat2 - lat1) / dPhi : Math.cos(lat1);
  const dLon = d * Math.sin(brng) / q;
  
  // Handle crossing the pole
  if (Math.abs(lat2) > Math.PI/2) lat2 = lat2 > 0 ? Math.PI - lat2 : -Math.PI - lat2;
  
  const lon2 = ((lon1 + dLon + Math.PI) % (2 * Math.PI)) - Math.PI;

  return {
    latitude: lat2 * 180 / Math.PI,
    longitude: lon2 * 180 / Math.PI
  };
}