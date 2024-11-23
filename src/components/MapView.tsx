import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, ZoomControl } from 'react-leaflet';
import { Icon } from 'leaflet';
import { useStore } from '../store';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const defaultIcon = new Icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

export const MapView: React.FC = () => {
  const { location, destinations, heading, isHeadingLocked } = useStore();

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
        {/* Add custom positioned zoom control to the right side, above the compass */}
        <ZoomControl position="topright" />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Current location */}
        <Marker 
          position={[location.latitude, location.longitude]} 
          icon={defaultIcon}
        >
          <Popup>
            Current Location
            <br />
            {location.latitude.toFixed(6)}°, {location.longitude.toFixed(6)}°
          </Popup>
        </Marker>

        {/* Destinations */}
        {destinations.map((dest, index) => (
          <Marker
            key={index}
            position={[dest.location.latitude, dest.location.longitude]}
            icon={defaultIcon}
          >
            <Popup>
              {dest.name}
              <br />
              {dest.distance}km
            </Popup>
          </Marker>
        ))}

        {/* Path line */}
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