'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, X } from 'lucide-react';

const API_KEY = 'AIzaSyC-_aiyna5INqc4ag6_7Uo9zZCahojon2c';

/* ── Singleton loader ─────────────────────────────────────────────── */
let gmStatus: 'idle' | 'loading' | 'ready' | 'fail' = 'idle';
const gmWaiters: Array<(ok: boolean) => void> = [];

function ensureGoogleMaps(): Promise<boolean> {
  return new Promise((resolve) => {
    // Already loaded in this module instance
    if (gmStatus === 'ready') { resolve(true); return; }
    if (gmStatus === 'fail')  { resolve(false); return; }

    // Check if google.maps.places is already available in window (hot-reload safe)
    if (typeof window !== 'undefined' && (window as any).google?.maps?.places) {
      gmStatus = 'ready';
      resolve(true);
      return;
    }

    gmWaiters.push(resolve);
    if (gmStatus === 'loading') return;

    // Check if script tag already in DOM to avoid duplicates
    const existing = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existing) {
      // Script already injected by another instance — just wait
      gmStatus = 'loading';
      const check = setInterval(() => {
        if ((window as any).google?.maps?.places) {
          clearInterval(check);
          gmStatus = 'ready';
          gmWaiters.forEach(r => r(true));
          gmWaiters.length = 0;
        }
      }, 200);
      return;
    }

    gmStatus = 'loading';

    // Inject z-index fix for pac-container inside modals
    if (!document.getElementById('pac-z-fix')) {
      const s = document.createElement('style');
      s.id = 'pac-z-fix';
      s.textContent = '.pac-container { z-index: 99999 !important; }';
      document.head.appendChild(s);
    }

    (window as any).__gmapsReady = () => {
      gmStatus = 'ready';
      gmWaiters.forEach(r => r(true));
      gmWaiters.length = 0;
    };

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places&language=es&region=EC&callback=__gmapsReady`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      gmStatus = 'fail';
      gmWaiters.forEach(r => r(false));
      gmWaiters.length = 0;
    };
    document.head.appendChild(script);
  });
}

/* ── Nominatim fallback ──────────────────────────────────────────── */
interface NominatimResult { display_name: string; lat: string; lon: string; }

async function nominatimSearch(q: string, city?: string): Promise<NominatimResult[]> {
  const query = city ? `${q} ${city} Ecuador` : `${q} Ecuador`;
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=ec`,
      { headers: { 'Accept-Language': 'es' } }
    );
    return await r.json();
  } catch { return []; }
}

/* ── Component ───────────────────────────────────────────────────── */
interface Props {
  onAddressSelect: (address: string, coords?: [number, number]) => void;
  placeholder?: string;
  initialValue?: string;
  city?: string;
}

export default function AddressAutocomplete({ onAddressSelect, placeholder, initialValue, city }: Props) {
  const inputRef   = useRef<HTMLInputElement>(null);
  const acRef      = useRef<any>(null);
  const [query,    setQuery]    = useState(initialValue || '');
  const [loading,  setLoading]  = useState(true);
  const [useNom,   setUseNom]   = useState(false);   // fallback flag
  const [nomSuggestions, setNomSuggestions] = useState<NominatimResult[]>([]);
  const [showNom,  setShowNom]  = useState(false);

  /* ── Initialize Google Maps or fallback ── */
  useEffect(() => {
    let destroyed = false;
    ensureGoogleMaps().then((ok) => {
      if (destroyed) return;
      setLoading(false);
      if (!ok) { setUseNom(true); return; }

      if (!inputRef.current) return;
      const ac = new (window as any).google.maps.places.Autocomplete(inputRef.current, {
        fields: ['formatted_address', 'geometry', 'name'],
        types: ['geocode', 'establishment'],
        componentRestrictions: { country: 'ec' },
      });
      acRef.current = ac;
      ac.addListener('place_changed', () => {
        const place = ac.getPlace();
        if (place.geometry?.location) {
          const addr = place.formatted_address || place.name || '';
          const lat  = place.geometry.location.lat();
          const lng  = place.geometry.location.lng();
          setQuery(addr);
          onAddressSelect(addr, [lat, lng]);
        }
      });
    });
    return () => { destroyed = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Update bounds when city changes ── */
  useEffect(() => {
    if (!acRef.current || !city) return;
    try {
      const geocoder = new (window as any).google.maps.Geocoder();
      geocoder.geocode({ address: `${city}, Ecuador` }, (results: any[], status: string) => {
        if (status === 'OK' && results?.[0]?.geometry?.viewport) {
          acRef.current?.setBounds(results[0].geometry.viewport);
        }
      });
    } catch {}
  }, [city]);

  /* ── Nominatim search on type (fallback) ── */
  useEffect(() => {
    if (!useNom || !query || query.length < 3) { setNomSuggestions([]); return; }
    const t = setTimeout(async () => {
      const results = await nominatimSearch(query, city);
      setNomSuggestions(results);
      setShowNom(results.length > 0);
    }, 500);
    return () => clearTimeout(t);
  }, [query, city, useNom]);

  const selectNominatin = (r: NominatimResult) => {
    setQuery(r.display_name);
    onAddressSelect(r.display_name, [parseFloat(r.lat), parseFloat(r.lon)]);
    setShowNom(false);
    setNomSuggestions([]);
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        background: 'white', borderRadius: '12px', padding: '14px 18px',
        border: '2px solid #F3F4F6', transition: 'border-color 0.2s',
      }}>
        {loading
          ? <Loader2 size={18} color="#FF5722" style={{ flexShrink: 0, animation: 'gm-spin 1s linear infinite' }} />
          : <MapPin size={18} color="#FF5722" style={{ flexShrink: 0 }} />
        }
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={loading ? 'Cargando buscador...' : (placeholder || 'Escribe tu dirección...')}
          disabled={loading}
          autoComplete="off"
          style={{
            flex: 1, background: 'none', border: 'none', outline: 'none',
            fontSize: '14px', fontWeight: 600, color: '#111', minWidth: 0,
          }}
        />
        {query && (
          <button type="button" onClick={() => { setQuery(''); setShowNom(false); }}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#CBD5E1', flexShrink: 0 }}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* Nominatim fallback dropdown */}
      {useNom && showNom && nomSuggestions.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 99999,
          background: 'white', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          border: '1px solid #E5E7EB', marginTop: '4px', overflow: 'hidden',
        }}>
          {nomSuggestions.map((r, i) => (
            <button key={i} type="button" onClick={() => selectNominatin(r)}
              style={{
                width: '100%', padding: '12px 16px', background: 'none', border: 'none',
                textAlign: 'left', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                color: '#333', borderBottom: i < nomSuggestions.length - 1 ? '1px solid #F3F4F6' : 'none',
                display: 'flex', alignItems: 'flex-start', gap: '8px',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <MapPin size={14} color="#FF5722" style={{ flexShrink: 0, marginTop: '1px' }} />
              <span style={{ lineHeight: 1.4 }}>{r.display_name}</span>
            </button>
          ))}
        </div>
      )}

      <style>{`@keyframes gm-spin { to { transform: rotate(360deg); } } .pac-container { z-index: 99999 !important; }`}</style>
    </div>
  );
}
