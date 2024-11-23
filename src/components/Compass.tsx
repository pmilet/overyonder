import React from 'react';
import toast from 'react-hot-toast';
import { useCompass } from '../hooks/useCompass';
import { useStore } from '../store';
import { config } from '../config';

export const Compass: React.FC = () => {
  const { compass, error } = useCompass();
  const { heading, isHeadingLocked, setHeading, toggleHeadingLock, reset } = useStore();

  const handleLockToggle = () => {
    if (!isHeadingLocked) {
      const headingValue = compass?.heading ?? config.defaultHeading;
      setHeading({ heading: headingValue, accuracy: compass?.accuracy });
      toast.success(`Heading set to ${headingValue.toFixed(1)}° ${compass ? '(Device Compass)' : '(Default)'}`);
    }
    toggleHeadingLock();
  };

  return (
    <div className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded">
      <div className="mb-2">
        {error ? (
          <div className="text-yellow-400 text-sm mb-2">
            Device compass unavailable: {error}
            <div className="text-white text-xs mt-1">
              Using default heading: {config.defaultHeading}°
            </div>
          </div>
        ) : compass ? (
          <div className="mb-2">
            <div className="text-sm text-green-400">Device Compass Active</div>
            <div>
              Heading: {compass.heading.toFixed(1)}°
              {compass.accuracy && <span className="text-sm"> (±{compass.accuracy}°)</span>}
            </div>
          </div>
        ) : (
          <div className="text-yellow-400 text-sm mb-2">
            Device compass not available
            <div className="text-white text-xs mt-1">
              Using default heading: {config.defaultHeading}°
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleLockToggle}
          className="px-3 py-1 bg-white/20 rounded hover:bg-white/30 transition-colors flex-1"
        >
          {isHeadingLocked ? 'Unlock' : 'Lock'}
        </button>
        
        {isHeadingLocked && (
          <button
            onClick={reset}
            className="px-3 py-1 bg-red-500/50 rounded hover:bg-red-500/70 transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      {isHeadingLocked && heading && (
        <div className="mt-2 text-sm text-center border-t border-white/20 pt-2">
          Locked Heading: {heading.heading.toFixed(1)}°
          <br />
          <span className="text-xs opacity-75">
            Source: {compass ? 'Device Compass' : 'Default Configuration'}
          </span>
        </div>
      )}
    </div>
  );
};