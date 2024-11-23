import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, ZoomControl } from 'react-leaflet';
import { Icon } from 'leaflet';
import { useStore } from '../store';
import 'leaflet/dist/leaflet.css';

// Create custom icons for different location types
const landIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const currentLocationIcon = new Icon({
  ...landIcon.options,
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconSize: [25, 41]
});

export const MapView: React.FC = () => {
  const { location, destinations } = useStore();

  if (!location) return null;

  const positions = [
    [location.latitude, location.longitude],
    ...destinations.map(dest => [dest.location.latitude, dest.location.longitude])
  ];

  return (
    <div className="absolute inset-0">
      <MapContainer
        center={[location.latitude, location.longitude]}
        zoom={13}
        className="h-full w-full"
        zoomControl={false}
      >
        <ZoomControl position="topright" />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <Marker 
          position={[location.latitude, location.longitude]} 
          icon={currentLocationIcon}
        >
          <Popup>
            <div className="text-sm">
              <div className="font-medium mb-1">Current Location</div>
              <div className="opacity-75">
                {location.latitude.toFixed(6)}°, {location.longitude.toFixed(6)}°
              </div>
            </div>
          </Popup>
        </Marker>

        {destinations.map((dest, index) => (
          <Marker
            key={index}
            position={[dest.location.latitude, dest.location.longitude]}
            icon={landIcon}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-medium mb-1">
                  {dest.isMaritime ? '🌊 ' : ''}{dest.name}
                </div>
                <div className="opacity-75">Distance: {dest.distance}km</div>
                <div className="opacity-75 text-xs mt-1">
                  {dest.location.latitude.toFixed(6)}°, {dest.location.longitude.toFixed(6)}°
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {destinations.length > 0 && (
          <Polyline
            positions={positions as [number, number][]}
            color="#3B82F6"
            weight={3}
            opacity={0.7}
          />
        )}
      </MapContainer>
    </div>
  );
};