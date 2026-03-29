'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import { MapPin, Loader2, X } from 'lucide-react';

interface AddressAutocompleteProps {
  onAddressSelect: (address: string, coords: [number, number]) => void;
  placeholder?: string;
  initialValue?: string;
}

const libraries: ("places" | "drawing" | "geometry" | "visualization")[] = ["places"];

export default function AddressAutocomplete({ onAddressSelect, placeholder, initialValue }: AddressAutocompleteProps) {
  const [query, setQuery] = useState(initialValue || '');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: 'AIzaSyC-_aiyna5INqc4ag6_7Uo9zZCahojon2c',
    libraries,
    language: 'es',
    region: 'EC'
  });

  const getAddressFromCoords = (lat: number, lng: number) => {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const fullAddress = results[0].formatted_address;
        setQuery(fullAddress);
        onAddressSelect(fullAddress, [lat, lng]);
      }
    });
  };

  useEffect(() => {
    if (isLoaded && !initialValue) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            setUserLocation({ lat, lng }); // Guardamos la ubicación para priorizar búsquedas
            getAddressFromCoords(lat, lng);
          },
          (error) => {
            console.error("Error obteniendo ubicación:", error);
          }
        );
      }
    }
  }, [isLoaded, initialValue]);

  const onLoad = (auto: google.maps.places.Autocomplete) => {
    setAutocomplete(auto);
  };

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        const fullAddress = place.formatted_address || '';
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        
        setQuery(fullAddress);
        onAddressSelect(fullAddress, [lat, lng]);
      }
    }
  };

  if (loadError) {
    return (
      <div style={{ padding: '12px', background: '#FFF3EE', borderRadius: '12px', border: '1px solid #FF5722', color: '#FF5722', fontSize: '13px' }}>
        ⚠️ Error cargando Google Maps. Revisa tu API Key.
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: '#F5F5F7',
        borderRadius: '16px',
        padding: '14px 16px',
        border: '1px solid #E5E5E5',
        transition: 'all 0.2s',
      }}>
        <MapPin size={18} color="#FF5722" />
        
        {isLoaded ? (
          <Autocomplete 
            onLoad={onLoad} 
            onPlaceChanged={onPlaceChanged}
            options={{
              fields: ["formatted_address", "geometry", "name"],
              types: ["geocode", "establishment"],
              // Define un área de búsqueda alrededor del usuario (aprox 10-15km)
              bounds: userLocation ? {
                north: userLocation.lat + 0.1,
                south: userLocation.lat - 0.1,
                east: userLocation.lng + 0.1,
                west: userLocation.lng - 0.1,
              } : undefined,
              strictBounds: false // No limita solo a esa zona, pero le da prioridad
            }}
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder || 'Escribe tu dirección exacta...'}
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                outline: 'none',
                fontSize: '14px',
                fontWeight: 600,
                color: '#111',
              }}
            />
          </Autocomplete>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', color: '#999', fontSize: '14px' }}>
            <Loader2 size={14} className="animate-spin" /> Cargando buscador...
          </div>
        )}

        {query && (
          <button 
            onClick={() => setQuery('')}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#999' }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      <style>{`.animate-spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
