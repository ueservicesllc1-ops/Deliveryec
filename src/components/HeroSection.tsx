'use client';
import { motion } from 'framer-motion';
import { MapPin, ArrowRight, Clock, Bike, Store } from 'lucide-react';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';

const stats = [
  { icon: <Clock size={15} />, label: 'Entrega en 25–35 min', sub: 'Promedio en tu zona' },
  { icon: <Bike size={15} />, label: 'Envío Gratis', sub: 'En pedidos desde $10' },
  { icon: <Store size={15} />, label: '+2,500 Restaurantes', sub: 'En toda la ciudad' },
];

const API_KEY = 'AIzaSyC-_aiyna5INqc4ag6_7Uo9zZCahojon2c';

let gmReady = false;
function loadGMaps(): Promise<void> {
  return new Promise((resolve) => {
    if (gmReady || (window as any).google?.maps?.places) { gmReady = true; resolve(); return; }
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      const t = setInterval(() => { if ((window as any).google?.maps?.places) { clearInterval(t); gmReady = true; resolve(); } }, 200);
      return;
    }
    (window as any).__heroGmReady = () => { gmReady = true; resolve(); };
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places&language=es&region=EC&callback=__heroGmReady`;
    s.async = true; s.defer = true;
    document.head.appendChild(s);
  });
}

export default function HeroSection() {
  const inputRef = useRef<HTMLInputElement>(null);
  const acRef    = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const [address, setAddress] = useState('');

  useEffect(() => {
    loadGMaps().then(() => {
      setIsLoaded(true);
      if (!inputRef.current) return;
      const ac = new (window as any).google.maps.places.Autocomplete(inputRef.current, {
        fields: ['formatted_address'], types: ['geocode', 'establishment'], componentRestrictions: { country: 'ec' },
      });
      acRef.current = ac;
      ac.addListener('place_changed', () => {
        const place = ac.getPlace();
        if (place?.formatted_address) setAddress(place.formatted_address);
      });

      // Geolocation bias
      navigator.geolocation?.getCurrentPosition(({ coords }) => {
        ac.setBounds(new (window as any).google.maps.LatLngBounds(
          { lat: coords.latitude - 0.1, lng: coords.longitude - 0.1 },
          { lat: coords.latitude + 0.1, lng: coords.longitude + 0.1 }
        ));
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePlaceChanged = () => {};

  return (
    <section id="hero" style={{
      background: '#111111',
      paddingTop: '64px',
      minHeight: '680px',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* ── 1. Rider image: positioned bottom-right, sized by HEIGHT ── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/hero-rider.png"
        alt=""
        style={{
          position: 'absolute',
          top: '50%',
          right: 0,
          transform: 'translateY(-50%)',
          width: '62%',        /* adjusted for better balance */
          height: 'auto',
          display: 'block',
          zIndex: 1,
          userSelect: 'none',
          pointerEvents: 'none',
          /* Sharper fade on the left edge so the moto (on the left of the image) stays visible */
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.4) 5%, black 12%)',
          maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.4) 5%, black 12%)',
        }}
      />

      {/* ── 2. Gradient overlays ── */}

      {/* Left fade: solid dark on the text side, fades to transparent */}
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 2,
        pointerEvents: 'none',
        background: `linear-gradient(
          to right,
          #111111 0%,
          #111111 30%,
          rgba(17,17,17,0.8) 50%,
          rgba(17,17,17,0.3) 70%,
          transparent 85%
        )`,
      }} />

      {/* Orange ambient glow behind the rider */}
      <div style={{
        position: 'absolute',
        top: '50%', right: '15%',
        transform: 'translateY(-50%)',
        width: '500px', height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(255,87,34,0.15) 0%, transparent 70%)',
        zIndex: 2,
        pointerEvents: 'none',
      }} />

      {/* Bottom fade: dark ← transparent (blends into next section) */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: '160px',
        zIndex: 2,
        pointerEvents: 'none',
        background: 'linear-gradient(to top, #111111 0%, transparent 100%)',
      }} />

      {/* Top fade: covers navbar edge */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: '60px',
        zIndex: 2,
        pointerEvents: 'none',
        background: 'linear-gradient(to bottom, #111111 0%, transparent 100%)',
      }} />

      {/* Right-edge fade: keeps far-right from looking cut off */}
      <div style={{
        position: 'absolute',
        top: 0, bottom: 0, right: 0,
        width: '80px',
        zIndex: 2,
        pointerEvents: 'none',
        background: 'linear-gradient(to left, #111111 0%, transparent 100%)',
      }} />

      {/* ── 3. Content: z-index 3 — above image + gradients ── */}
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0 24px',
        position: 'relative',
        zIndex: 3,
        display: 'flex',
        alignItems: 'center',
        minHeight: '616px',
      }}>
        <div style={{ maxWidth: '680px', paddingTop: '48px', paddingBottom: '72px', marginLeft: '-200px' }}>

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,87,34,0.12)', border: '1px solid rgba(255,87,34,0.3)', borderRadius: '6px', padding: '5px 12px', marginBottom: '24px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--orange)', boxShadow: '0 0 8px var(--orange)' }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,167,53,0.95)', letterSpacing: '0.3px' }}>
              Disponible en todo Ecuador
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.08 }}
            style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: 'clamp(48px, 6.5vw, 84px)',
              fontWeight: 900,
              lineHeight: 1.05,
              letterSpacing: '-2.5px',
              color: 'white',
              marginBottom: '20px',
            }}>
            Tu comida favorita,<br />
            <span style={{
              background: 'linear-gradient(135deg, #FF5722 0%, #FF8A65 60%, #FFB347 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              rápida y segura.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.4 }}
            style={{ fontSize: '18px', color: 'rgba(255,255,255,0.5)', marginBottom: '32px', lineHeight: 1.65 }}>
            Pide en minutos. Recibe en la puerta de tu casa.
          </motion.p>

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.27, duration: 0.4 }}
            style={{
              display: 'flex',
              background: 'white',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)',
              marginBottom: '20px',
            }}>
            <div style={{ display: 'flex', alignItems: 'center', flex: 1, padding: '0 16px', gap: '10px' }}>
              <MapPin size={17} color="var(--orange)" style={{ flexShrink: 0 }} />
              {isLoaded ? (
                <div style={{ flex: 1, width: '100%' }}>
                  <input
                    ref={inputRef}
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ingresa tu dirección de entrega..."
                    autoComplete="off"
                    style={{
                      width: '100%', border: 'none', outline: 'none',
                      fontSize: '14px', color: 'var(--text-dark)',
                      padding: '15px 0', background: 'transparent',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  />
                </div>
              ) : (
                <input
                  type="text"
                  placeholder="Cargando mapa..."
                  disabled
                  style={{
                    flex: 1, border: 'none', outline: 'none',
                    fontSize: '14px', color: 'var(--text-dark)',
                    padding: '15px 0', background: 'transparent',
                    fontFamily: 'Inter, sans-serif',
                  }}
                />
              )}
            </div>
            <Link href="/order" className="btn-orange" style={{ margin: '6px', padding: '11px 22px', borderRadius: '8px', fontSize: '14px', flexShrink: 0, gap: '7px', border: 'none', cursor: 'pointer', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              Buscar Comida <ArrowRight size={15} />
            </Link>
          </motion.div>

          {/* Stats pills */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.38 }}
            style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {stats.map((s, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                padding: '7px 12px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: '8px',
              }}>
                <span style={{ color: 'var(--orange)', display: 'flex', flexShrink: 0 }}>{s.icon}</span>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'white', lineHeight: 1.2 }}>{s.label}</div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.2, marginTop: '1px' }}>{s.sub}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
