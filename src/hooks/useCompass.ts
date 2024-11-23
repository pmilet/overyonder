import { useState, useEffect, useCallback } from 'react';
import { CompassReading } from '../types';

export const useCompass = () => {
  const [compass, setCompass] = useState<CompassReading | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
    if (event.alpha !== null) {
      setCompass({
        heading: 360 - event.alpha,
        accuracy: undefined
      });
    }
  }, []);

  useEffect(() => {
    if (!window.DeviceOrientationEvent) {
      setError('Compass not available');
      return;
    }

    let mounted = true;

    const requestPermission = async () => {
      try {
        // @ts-ignore: Typescript doesn't know about this API yet
        if (DeviceOrientationEvent.requestPermission) {
          // @ts-ignore
          const permission = await DeviceOrientationEvent.requestPermission();
          if (permission === 'granted' && mounted) {
            window.addEventListener('deviceorientation', handleOrientation, true);
          } else if (mounted) {
            setError('Permission denied');
          }
        } else if (mounted) {
          window.addEventListener('deviceorientation', handleOrientation, true);
        }
      } catch (err) {
        if (mounted) {
          setError('Error requesting compass permission');
        }
      }
    };

    requestPermission();

    return () => {
      mounted = false;
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, [handleOrientation]);

  return { compass, error };
};