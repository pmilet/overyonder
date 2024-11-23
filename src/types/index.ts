export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface CompassReading {
  heading: number;
  accuracy?: number;
}

export interface DestinationInfo {
  name: string;
  distance: number;
  location: {
    latitude: number;
    longitude: number;
  };
  isMaritime?: boolean;
}