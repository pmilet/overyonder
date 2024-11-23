import { Toaster } from 'react-hot-toast';
import { Camera } from './components/Camera';
import { Compass } from './components/Compass';
import { CompassRose } from './components/CompassRose';
import { LocationInfo } from './components/LocationInfo';
import { MapView } from './components/MapView';
import { useStore } from './store';

export default function App() {
  const { isMapView, toggleMapView } = useStore();

  return (
    <div className="h-screen w-screen overflow-hidden relative">
      {!isMapView && <Camera />}
      {isMapView && <MapView />}
      <CompassRose />
      <div className="absolute inset-0 flex flex-col pointer-events-none">
        <div className="absolute top-4 left-4 z-[1000] pointer-events-auto">
          <button
            onClick={toggleMapView}
            className="px-4 py-2 bg-black/50 text-white rounded hover:bg-black/60 transition-colors"
          >
            {isMapView ? 'Camera View' : 'Map View'}
          </button>
        </div>
        <div className="z-[1000] pointer-events-auto">
          <Compass />
        </div>
        <div className="z-[1000] pointer-events-auto">
          <LocationInfo />
        </div>
      </div>
      <Toaster position="top-center" containerClassName="z-[1100]" />
    </div>
  );
}