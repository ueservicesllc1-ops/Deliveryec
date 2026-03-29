'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Bike, MapPin } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';

// Fix default Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom orange driver marker
const driverIcon = L.divIcon({
  html: `
    <div style="
      width: 44px; height: 44px;
      background: #FF5722;
      border-radius: 50% 50% 50% 12%;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 4px 16px rgba(255,87,34,0.5);
      display: flex; align-items: center; justify-content: center;
    ">
      <div style="transform: rotate(45deg); color: white;">
        ${renderToStaticMarkup(<Bike size={24} strokeWidth={2.5} />)}
      </div>
    </div>
  `,
  className: '',
  iconSize: [44, 44],
  iconAnchor: [22, 44],
});

// Custom destination marker
const destIcon = L.divIcon({
  html: `
    <div style="
      width: 36px; height: 36px;
      background: white;
      border-radius: 50%;
      border: 3px solid #FF5722;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      display: flex; align-items: center; justify-content: center;
      color: #FF5722;
    ">
      ${renderToStaticMarkup(<MapPin size={20} fill="#FF5722" fillOpacity={0.2} strokeWidth={2.5} />)}
    </div>
  `,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

// Auto-pan map to driver position
function AutoPan({ position }: { position: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(position, map.getZoom(), { animate: true });
  }, [position, map]);
  return null;
}

interface LiveMapProps {
  driverPosition: [number, number] | null;
  customerPosition?: [number, number];
  zoom?: number;
}

export default function LiveMap({ driverPosition, customerPosition, zoom = 15 }: LiveMapProps) {
  const [route, setRoute] = useState<[number, number][]>([]);
  const defaultCenter: [number, number] = driverPosition || [-0.1807, -78.4678];

  // Fetch road route from OSRM
  useEffect(() => {
    if (!driverPosition || !customerPosition) return;
    
    const fetchRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${driverPosition[1]},${driverPosition[0]};${customerPosition[1]},${customerPosition[0]}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.routes && data.routes[0]) {
          const coords = data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]]);
          setRoute(coords);
        }
      } catch (err) {
        console.error('OSRM Error:', err);
      }
    };

    fetchRoute();
  }, [driverPosition, customerPosition]);

  return (
    <MapContainer
      center={defaultCenter}
      zoom={zoom}
      style={{ width: '100%', height: '100%', borderRadius: 'inherit' }}
      zoomControl={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap'
      />

      {route.length > 0 && (
        <Polyline 
          positions={route} 
          color="#FF5722" 
          weight={4} 
          opacity={0.6} 
          lineJoin="round" 
        />
      )}

      {driverPosition && (
        <>
          <AutoPan position={driverPosition} />
          <Marker position={driverPosition} icon={driverIcon}>
            <Popup>Driver en camino</Popup>
          </Marker>
        </>
      )}

      {customerPosition && (
        <Marker position={customerPosition} icon={destIcon}>
          <Popup>Entrega</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
