import React, { useEffect, useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { useLocation } from '../hooks/useLocation';
import { useStore } from '../store';
import { findDestinationsAlongHeading, fetchLocationDetails } from '../services/geocoding';
import { isLand } from '../utils/isLand';
import type { DestinationInfo } from '../types';

interface LocationDetails {
  id: string;
  details: string;
  error?: string;
  isLoading?: boolean;
  isMaritime?: boolean;
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
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [destinationDetails, setDestinationDetails] = useState<LocationDetails[]>([]);

  useEffect(() => {
    if (location) {
      setLocation(location);
      setIsLoadingLocation(true);
      
      fetchLocationDetails(location.latitude, location.longitude)
        .then(data => {
          if (data.display_name) {
            setCurrentLocationName(data.display_name);
          }
        })
        .catch(err => {
          console.error('Error fetching location details:', err);
          setCurrentLocationName('Location details unavailable');
          toast.error('Unable to fetch location details. Please try again later.');
        })
        .finally(() => {
          setIsLoadingLocation(false);
        });
    }
  }, [location, setLocation]);

  useEffect(() => {
    // Only fetch details for the last destination
    const lastDestination = destinations[destinations.length - 1];
    if (lastDestination) {
      const destId = `${lastDestination.location.latitude},${lastDestination.location.longitude}`;
      if (!destinationDetails.some(d => d.id === destId)) {
        setDestinationDetails(prev => [
          ...prev,
          { id: destId, details: '', isLoading: true }
        ]);

        fetchLocationDetails(lastDestination.location.latitude, lastDestination.location.longitude)
          .then(async data => {
            if (data.display_name) {
              const isLandLocation = await isLand(
                lastDestination.location.latitude,
                lastDestination.location.longitude
              );
              setDestinationDetails(prev => 
                prev.map(d => 
                  d.id === destId 
                    ? { 
                        id: destId, 
                        details: data.display_name, 
                        isLoading: false, 
                        isMaritime: !isLandLocation 
                      }
                    : d
                )
              );
            }
          })
          .catch(err => {
            console.error('Error fetching destination details:', err);
            setDestinationDetails(prev => 
              prev.map(d => 
                d.id === destId 
                  ? { 
                      id: destId, 
                      details: 'Location details unavailable',
                      error: 'Failed to load location details',
                      isLoading: false 
                    }
                  : d
              )
            );
          });
      }
    }
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
      toast.loading('Finding next destination...', { 
        id: 'location-search',
        style: {
          background: '#1a1a1a',
          color: '#fff',
          borderRadius: '8px'
        }
      });
      
      const nextDistance = (destinations.length + 1) * distanceIncrement;
      const currentHeading = heading?.heading ?? 0;
      
      const destination = await findDestinationsAlongHeading(
        location,
        currentHeading,
        nextDistance
      );
      
      if (destination) {
        addDestination(destination);
        toast.success(
          <div className="flex items-start gap-2">
            <span className="text-xl">{destination.isMaritime ? '🌊' : '🎯'}</span>
            <div>
              <div className="font-medium">Destination Found!</div>
              <div className="text-sm mt-1 opacity-90">
                {destination.name} at {destination.distance}km
              </div>
            </div>
          </div>,
          {
            id: 'location-search',
            style: {
              background: '#1a1a1a',
              color: '#fff',
              borderRadius: '8px',
              padding: '12px'
            }
          }
        );
      } else {
        toast.error('No destination found in this direction', { 
          id: 'location-search',
          style: {
            background: '#1a1a1a',
            color: '#fff',
            borderRadius: '8px'
          }
        });
      }
    } catch (err) {
      console.error('Error finding destination:', err);
      toast.error('Failed to find next destination', { 
        id: 'location-search',
        style: {
          background: '#1a1a1a',
          color: '#fff',
          borderRadius: '8px'
        }
      });
    }
  }, [location, heading, isHeadingLocked, destinations.length, addDestination, distanceIncrement]);

  const handleIncrementChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setDistanceIncrement(value);
    }
  };

  const getDestinationDetails = (dest: DestinationInfo) => {
    const destId = `${dest.location.latitude},${dest.location.longitude}`;
    return destinationDetails.find(d => d.id === destId);
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

  const lastDestination = destinations[destinations.length - 1];

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
            <div className="font-semibold mb-1">Current Location:</div>
            <div className="text-sm mb-2 animate-fade-in bg-black/20 p-2 rounded">
              {isLoadingLocation ? (
                <div className="text-xs text-gray-300 mt-1 animate-pulse">
                  Fetching location details...
                </div>
              ) : currentLocationName ? (
                <div className="text-xs text-gray-300 mt-1 break-words leading-relaxed">
                  {currentLocationName}
                </div>
              ) : (
                <div className="text-xs text-red-300 mt-1">
                  Location details unavailable
                </div>
              )}
              <div className="text-xs text-gray-400 mt-1">
                {location.latitude.toFixed(6)}°, {location.longitude.toFixed(6)}°
              </div>
            </div>

            {lastDestination && (
              <div className="text-sm mb-2 animate-fade-in bg-black/20 p-2 rounded">
                <div className="font-medium">
                  Last Found: {lastDestination.name} ({lastDestination.distance}km)
                </div>
                {(() => {
                  const details = getDestinationDetails(lastDestination);
                  if (!details) {
                    return (
                      <div className="text-xs text-gray-300 mt-1 animate-pulse">
                        Fetching location details...
                      </div>
                    );
                  } else if (details.isLoading) {
                    return (
                      <div className="text-xs text-gray-300 mt-1 animate-pulse">
                        Loading location details...
                      </div>
                    );
                  } else if (details.error) {
                    return (
                      <div className="text-xs text-red-300 mt-1">
                        {details.error}
                      </div>
                    );
                  } else {
                    return (
                      <div className="text-xs text-gray-300 mt-1 break-words leading-relaxed">
                        {details.isMaritime ? '🌊 ' : ''}{details.details}
                      </div>
                    );
                  }
                })()}
                <div className="text-xs text-gray-400 mt-1">
                  {lastDestination.location.latitude.toFixed(6)}°, {lastDestination.location.longitude.toFixed(6)}°
                </div>
              </div>
            )}
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