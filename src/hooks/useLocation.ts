import { useState, useEffect, useCallback } from 'react';
import { Location } from '../types';

export const useLocation = () => {
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePosition = useCallback((position: GeolocationPosition) => {
    setLocation({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy
    });
    setError(null);
  }, []);

  const handleError = useCallback((error: GeolocationPositionError) => {
    switch (error.code) {
      case error.TIMEOUT:
        setError('Location request timed out. Please try again.');
        break;
      case error.PERMISSION_DENIED:
        setError('Please enable location services to use this app.');
        break;
      case error.POSITION_UNAVAILABLE:
        setError('Unable to determine your location. Please check your GPS signal.');
        break;
      default:
        setError('Error getting location: ' + error.message);
    }
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    let watchId: number;

    const startWatching = () => {
      watchId = navigator.geolocation.watchPosition(
        handlePosition,
        handleError,
        {
          enableHighAccuracy: true,
          timeout: 10000, // 10 seconds timeout
          maximumAge: 0
        }
      );
    };

    // Get initial position quickly
    navigator.geolocation.getCurrentPosition(
      handlePosition,
      handleError,
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 30000
      }
    );

    // Then start watching with high accuracy
    startWatching();

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [handlePosition, handleError]);

  return { location, error };
};