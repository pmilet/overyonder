import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useCompass } from '../hooks/useCompass';
import { useStore } from '../store';

export const Compass: React.FC = () => {
  const { compass, error } = useCompass();
  const { heading, isHeadingLocked, setHeading, toggleHeadingLock, reset } = useStore();
  const [manualHeading, setManualHeading] = useState<string>(heading?.heading.toString() || '0');

  const displayHeading = isHeadingLocked ? heading : compass;

  const handleLockToggle = () => {
    if (!isHeadingLocked) {
      const headingValue = parseFloat(manualHeading);
      if (isNaN(headingValue) || headingValue < 0 || headingValue > 360) {
        toast.error('Please enter a valid heading between 0° and 360°');
        return;
      }
      setHeading({ heading: headingValue, accuracy: undefined });
      toast.success(`Heading set to ${headingValue}° (Manual)`);
    }
    toggleHeadingLock();
  };

  const handleManualHeadingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || (!isNaN(Number(value)) && Number(value) >= 0 && Number(value) <= 360)) {
      setManualHeading(value);
    }
  };

  return (
    <div className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded">
      <div className="mb-2">
        {error ? (
          <div className="text-yellow-400 text-sm mb-2">
            Device compass unavailable: {error}
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
          </div>
        )}
        
        <div>
          <label className="text-sm block mb-1">
            Manual Heading:
          </label>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              min="0"
              max="360"
              step="0.1"
              value={manualHeading}
              onChange={handleManualHeadingChange}
              placeholder="Enter heading (0-360°)"
              className="w-24 px-2 py-1 rounded bg-black/30 text-white border border-white/20 focus:outline-none focus:border-blue-500"
            />
            <span>°</span>
          </div>
        </div>
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
            Source: {compass ? 'Device Compass' : 'Manual Input'}
          </span>
        </div>
      )}
    </div>
  );
};