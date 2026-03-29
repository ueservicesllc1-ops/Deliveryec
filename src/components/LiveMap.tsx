'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, OverlayView, DirectionsRenderer } from '@react-google-maps/api';
import { Bike, MapPin } from 'lucide-react';

const API_KEY = 'AIzaSyC-_aiyna5INqc4ag6_7Uo9zZCahojon2c';

interface LiveMapProps {
  driverPosition: [number, number] | null;
  customerPosition?: [number, number];
  zoom?: number;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: 'inherit',
};

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: true,
  styles: [
    {
      "elementType": "geometry",
      "stylers": [{ "color": "#212121" }]
    },
    {
      "elementType": "labels.icon",
      "stylers": [{ "visibility": "off" }]
    },
    {
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#757575" }]
    },
    {
      "elementType": "labels.text.stroke",
      "stylers": [{ "color": "#212121" }]
    },
    {
      "featureType": "administrative",
      "elementType": "geometry",
      "stylers": [{ "color": "#757575" }]
    },
    {
      "featureType": "poi",
      "elementType": "geometry",
      "stylers": [{ "color": "#181818" }]
    },
    {
      "featureType": "road",
      "elementType": "geometry.fill",
      "stylers": [{ "color": "#2c2c2c" }]
    },
    {
      "featureType": "water",
      "elementType": "geometry",
      "stylers": [{ "color": "#000000" }]
    }
  ]
};

export default function LiveMap({ driverPosition, customerPosition, zoom = 15 }: LiveMapProps) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: API_KEY
  });

  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const lastCoords = useRef<{d: string, c: string} | null>(null);

  // Calculate route
  useEffect(() => {
    if (!isLoaded || !driverPosition || !customerPosition) return;
    
    // Avoid redundant calls for minor movements
    const key = {
      d: `${driverPosition[0].toFixed(5)},${driverPosition[1].toFixed(5)}`,
      c: `${customerPosition[0].toFixed(5)},${customerPosition[1].toFixed(5)}`
    };
    if (lastCoords.current?.d === key.d && lastCoords.current?.c === key.c) return;
    lastCoords.current = key;

    const directionsService = new google.maps.DirectionsService();
    directionsService.route(
      {
        origin: { lat: driverPosition[0], lng: driverPosition[1] },
        destination: { lat: customerPosition[0], lng: customerPosition[1] },
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
          setDirections(result);
        } else {
          setDirections(null);
          if (status !== 'ZERO_RESULTS') {
            console.warn(`Directions request failed: ${status}`);
          }
        }
      }
    );
  }, [isLoaded, driverPosition, customerPosition]);

  // Center map on driver if no route or if map newly loaded
  useEffect(() => {
    if (map && driverPosition && !directions) {
      map.panTo({ lat: driverPosition[0], lng: driverPosition[1] });
    }
  }, [map, driverPosition, directions]);

  if (!isLoaded) return <div style={{ width: '100%', height: '100%', background: '#1a1a1e', borderRadius: 'inherit' }} />;

  const center = driverPosition 
    ? { lat: driverPosition[0], lng: driverPosition[1] }
    : { lat: -0.1807, lng: -78.4678 };

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={zoom}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={mapOptions}
    >
      {directions && (
        <DirectionsRenderer
          directions={directions}
          options={{
            suppressMarkers: true,
            polylineOptions: {
              strokeColor: '#FF5722',
              strokeOpacity: 0.8,
              strokeWeight: 6,
            }
          }}
        />
      )}

      {/* Driver Marker */}
      {driverPosition && (
        <OverlayView
          position={{ lat: driverPosition[0], lng: driverPosition[1] }}
          mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
        >
          <div style={{
            position: 'absolute',
            transform: 'translate(-50%, -100%)',
          }}>
            <div style={{
              width: '44px', height: '44px',
              background: '#FF5722',
              borderRadius: '50% 50% 50% 12%',
              transform: 'rotate(-45deg)',
              border: '3px solid white',
              boxShadow: '0 4px 16px rgba(255,87,34,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ transform: 'rotate(45deg)', color: 'white' }}>
                <Bike size={24} strokeWidth={2.5} />
              </div>
            </div>
          </div>
        </OverlayView>
      )}

      {/* Destination Marker */}
      {customerPosition && (
        <OverlayView
          position={{ lat: customerPosition[0], lng: customerPosition[1] }}
          mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
        >
          <div style={{
            position: 'absolute',
            transform: 'translate(-50%, -50%)',
          }}>
            <div style={{
              width: '36px', height: '36px',
              background: 'white',
              borderRadius: '50%',
              border: '3px solid #FF5722',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#FF5722',
            }}>
              <MapPin size={20} fill="#FF5722" fillOpacity={0.2} strokeWidth={2.5} />
            </div>
          </div>
        </OverlayView>
      )}
    </GoogleMap>
  );
}
