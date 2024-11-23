import { create } from 'zustand';
import { CompassReading, Location, DestinationInfo } from '../types';

interface AppState {
  heading: CompassReading | null;
  location: Location | null;
  isHeadingLocked: boolean;
  destinations: DestinationInfo[];
  distanceIncrement: number;
  isMapView: boolean;
  setHeading: (heading: CompassReading | null) => void;
  setLocation: (location: Location | null) => void;
  toggleHeadingLock: () => void;
  setDestinations: (destinations: DestinationInfo[]) => void;
  addDestination: (destination: DestinationInfo) => void;
  setDistanceIncrement: (increment: number) => void;
  toggleMapView: () => void;
  reset: () => void;
}

export const useStore = create<AppState>((set) => ({
  heading: null,
  location: null,
  isHeadingLocked: false,
  destinations: [],
  distanceIncrement: 10,
  isMapView: false,
  setHeading: (heading) => set({ heading }),
  setLocation: (location) => set({ location }),
  toggleHeadingLock: () => set((state) => ({ isHeadingLocked: !state.isHeadingLocked })),
  setDestinations: (destinations) => set({ destinations }),
  addDestination: (destination) => set((state) => ({
    destinations: [...state.destinations, destination]
  })),
  setDistanceIncrement: (increment) => set({ distanceIncrement: increment }),
  toggleMapView: () => set((state) => ({ isMapView: !state.isMapView })),
  reset: () => set({
    heading: null,
    isHeadingLocked: false,
    destinations: [],
    distanceIncrement: 10
  })
}));