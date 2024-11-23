import React, { useEffect, useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { useLocation } from '../hooks/useLocation';
import { useStore } from '../store';
import { findDestinationsAlongHeading } from '../services/geocoding';

interface LocationDetails {
  id: string;
  details: string;
}

export const LocationInfo: React.FC = () => {
  const { location, error } = useLocation();
  const { 
    heading, 
    isHeadingLocked, 
    destinations, 
    addDestination, 
    setLocation,
    distanceIncrement,
    setDistanceIncrement 
  } = useStore();
  const [currentLocationName, setCurrentLocationName] = useState<string>('');
  const [destinationDetails, setDestinationDetails] = useState<LocationDetails[]>([]);

  // Get current location details when location is available
  useEffect(() => {
    if (location) {
      setLocation(location);
      
      fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${location.latitude}&lon=${location.longitude}&format=json`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'OverYonder/1.0'
          }
        }
      )
        .then(response => response.json())
        .then(data => {
          if (data.display_name) {
            setCurrentLocationName(data.display_name);
            toast.success(
              <div>
                <div>Current Location:</div>
                <div className="text-sm mt-1">{data.display_name}</div>
              </div>,
              {
                duration: 5000,
                id: 'initial-location',
                icon: '📍'
              }
            );
          }
        })
        .catch(err => {
          console.error('Error fetching location details:', err);
          setCurrentLocationName('Location details unavailable');
        });
    }
  }, [location, setLocation]);

  useEffect(() => {
    destinations.forEach(dest => {
      const destId = `${dest.location.latitude},${dest.location.longitude}`;
      if (!destinationDetails.some(d => d.id === destId)) {
        fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${dest.location.latitude}&lon=${dest.location.longitude}&format=json`,
          {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'OverYonder/1.0'
            }
          }
        )
          .then(response => response.json())
          .then(data => {
            if (data.display_name) {
              setDestinationDetails(prev => [
                ...prev,
                { id: destId, details: data.display_name }
              ]);
            }
          })
          .catch(err => {
            console.error('Error fetching destination details:', err);
          });
      }
    });
  }, [destinations]);

  const findNextDestination = useCallback(async () => {
    if (!location) {
      toast.error('Location not available. Please enable GPS and try again.');
      return;
    }

    if (!isHeadingLocked) {
      toast.error('Please lock a heading first.');
      return;
    }

    if (!heading) {
      toast.error('No heading set. Using default heading (0°)');
    }

    try {
      toast.loading('Finding next destination...', { id: 'location-search' });
      
      const nextDistance = (destinations.length + 1) * distanceIncrement;
      const currentHeading = heading?.heading ?? 0;
      
      const destination = await findDestinationsAlongHeading(
        location,
        currentHeading,
        nextDistance
      );
      
      if (destination) {
        addDestination(destination);
        toast.success(`Found ${destination.name} at ${destination.distance}km`, { id: 'location-search' });
      } else {
        toast.error('No destination found in this direction', { id: 'location-search' });
      }
    } catch (err) {
      console.error('Error finding destination:', err);
      toast.error('Failed to find next destination', { id: 'location-search' });
    }
  }, [location, heading, isHeadingLocked, destinations.length, addDestination, distanceIncrement]);

  const handleIncrementChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setDistanceIncrement(value);
    }
  };

  if (error) {
    return (
      <div className="absolute bottom-32 left-4 bg-black/50 text-white p-2 rounded">
        <div className="text-red-500">Location Error: {error}</div>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 px-3 py-1 bg-white/20 rounded hover:bg-white/30 transition-colors w-full text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  const getDestinationDetails = (dest: { location: Location }) => {
    const destId = `${dest.location.latitude},${dest.location.longitude}`;
    return destinationDetails.find(d => d.id === destId)?.details;
  };

  return (
    <div className="absolute bottom-32 left-4 bg-black/50 text-white p-2 rounded max-w-sm">
      <div className="text-sm opacity-75 mb-1">OverYonder</div>
      {!location ? (
        <div>
          <div className="animate-pulse">Getting location...</div>
          <div className="text-sm text-gray-300 mt-1">Please ensure GPS is enabled</div>
        </div>
      ) : (
        <>
          <div className="font-semibold">Current Position:</div>
          <div className="text-sm bg-black/30 p-2 rounded mt-1">
            <div>Latitude: {location.latitude.toFixed(6)}°</div>
            <div>Longitude: {location.longitude.toFixed(6)}°</div>
            {location.accuracy && (
              <div className="text-gray-300">
                Accuracy: ±{location.accuracy.toFixed(1)}m
              </div>
            )}
          </div>
          
          {isHeadingLocked && (
            <div className="mt-2 bg-black/30 p-2 rounded">
              <label className="text-sm block mb-1">
                Distance Increment (km):
              </label>
              <input
                type="number"
                min="1"
                value={distanceIncrement}
                onChange={handleIncrementChange}
                className="w-full px-2 py-1 rounded bg-black/30 text-white border border-white/20 focus:outline-none focus:border-blue-500"
              />
            </div>
          )}
          
          <div className="mt-2 border-t border-white/20 pt-2">
            <div className="font-semibold mb-1">Destinations Found:</div>
            {/* Current location as first destination */}
            <div className="text-sm mb-2 animate-fade-in bg-black/20 p-2 rounded">
              <div className="font-medium">Current Location (0km)</div>
              {currentLocationName ? (
                <div className="text-xs text-gray-300 mt-1 break-words leading-relaxed">
                  {currentLocationName}
                </div>
              ) : (
                <div className="text-xs text-gray-300 mt-1 animate-pulse">
                  Fetching location details...
                </div>
              )}
              <div className="text-xs text-gray-400 mt-1">
                {location.latitude.toFixed(6)}°, {location.longitude.toFixed(6)}°
              </div>
            </div>
            {/* Other destinations */}
            {destinations.map((dest, index) => (
              <div key={index} className="text-sm mb-2 animate-fade-in bg-black/20 p-2 rounded">
                <div className="font-medium">
                  {dest.name} ({dest.distance}km)
                </div>
                {getDestinationDetails(dest) ? (
                  <div className="text-xs text-gray-300 mt-1 break-words leading-relaxed">
                    {getDestinationDetails(dest)}
                  </div>
                ) : (
                  <div className="text-xs text-gray-300 mt-1 animate-pulse">
                    Fetching location details...
                  </div>
                )}
                <div className="text-xs text-gray-400 mt-1">
                  {dest.location.latitude.toFixed(6)}°, {dest.location.longitude.toFixed(6)}°
                </div>
              </div>
            ))}
          </div>

          {isHeadingLocked && (
            <button
              onClick={findNextDestination}
              className="mt-2 px-3 py-1 bg-blue-500/50 rounded hover:bg-blue-500/70 transition-colors w-full"
            >
              Find Next Location
            </button>
          )}
        </>
      )}
    </div>
  );
};