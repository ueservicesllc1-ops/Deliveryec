'use client';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Smartphone, MapPin, Bell, Tag } from 'lucide-react';

const features = [
  { icon: <MapPin size={15} />, text: 'Seguimiento en tiempo real' },
  { icon: <Bell size={15} />, text: 'Ofertas exclusivas para la app' },
  { icon: <Tag size={15} />, text: 'Paga en la app de forma segura' },
];

export default function AppDownloadSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section ref={ref} className="section-dark" style={{ padding: '64px 24px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '80px', alignItems: 'center' }}>

          {/* Phone mockup */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}
            style={{ display: 'flex', gap: '16px', flexShrink: 0 }}>
            {/* Phone 1 */}
            <motion.div
              animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
              style={{ width: '160px', height: '320px', background: 'var(--dark-3)', borderRadius: '28px', border: '2px solid rgba(255,255,255,0.1)', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', position: 'relative', marginTop: '30px' }}>
              <div style={{ height: '100%', padding: '20px 12px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ height: '3px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', width: '50%', margin: '0 auto 10px' }} />
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 700, fontSize: '12px', color: 'white' }}>
                    Delivery<span style={{ color: 'var(--orange)' }}>.ec</span>
                  </div>
                  <div style={{ width: '18px', height: '18px', background: 'var(--orange)', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Smartphone size={10} color="white" />
                  </div>
                </div>
                {/* Mini cards */}
                {['La Paella D...', 'Tokyo Sushi', 'Burger King'].map((n, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '8px', padding: '8px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'rgba(255,87,34,0.15)', border: '1px solid rgba(255,87,34,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '11px', color: 'var(--orange)', flexShrink: 0 }}>
                      {n.charAt(0)}
                    </div>
                    <div style={{ fontSize: '10px', fontWeight: 600, color: 'white' }}>{n}</div>
                  </div>
                ))}
                {/* Order status */}
                <div style={{ background: 'rgba(255,87,34,0.15)', border: '1px solid rgba(255,87,34,0.25)', borderRadius: '8px', padding: '10px', marginTop: 'auto' }}>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--orange)', marginBottom: '4px', textTransform: 'uppercase' }}>Tu pedido llega en</div>
                  <div style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800, fontSize: '18px', color: 'white' }}>12 min</div>
                  <div style={{ height: '3px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', marginTop: '6px' }}>
                    <div style={{ height: '100%', width: '65%', background: 'var(--orange)', borderRadius: '3px' }} />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Phone 2 (slightly taller, behind) */}
            <motion.div
              animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut', delay: 0.5 }}
              style={{ width: '160px', height: '320px', background: '#1a1a2e', borderRadius: '28px', border: '2px solid rgba(255,87,34,0.2)', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', position: 'relative' }}>
              <div style={{ padding: '20px 12px 12px', display: 'flex', flexDirection: 'column', gap: '8px', height: '100%' }}>
                <div style={{ height: '3px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', width: '50%', margin: '0 auto 10px' }} />
                <div style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 700, fontSize: '12px', color: 'white', marginBottom: '10px' }}>Mis Pedidos</div>
                {[{ s: 'Entregado', c: '#22c55e' }, { s: 'En camino', c: 'var(--orange)' }, { s: 'Preparando', c: '#3b82f6' }].map((o, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '10px', fontWeight: 600, color: 'white' }}>Pedido #00{i + 1}</div>
                      <div style={{ fontSize: '9px', fontWeight: 700, color: o.c, padding: '2px 6px', background: o.c + '20', borderRadius: '4px' }}>{o.s}</div>
                    </div>
                    <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)' }}>hace {(i + 1) * 15} min · $12.{i * 3 + 5}0</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* Right: text */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.5, delay: 0.15 }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
              Descarga la App
            </div>
            <h2 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 900, fontSize: 'clamp(28px, 4vw, 42px)', color: 'white', letterSpacing: '-1px', lineHeight: 1.1, marginBottom: '16px' }}>
              ¡Descarga la App <span className="gradient-text">y pide más fácil!</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '15px', lineHeight: 1.7, marginBottom: '24px' }}>
              Disponible en iOS y Android. Seguimiento en tiempo real, ofertas exclusivas y más.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '28px' }}>
              {features.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>
                  <span style={{ color: 'var(--orange)' }}>{f.icon}</span>
                  {f.text}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {/* App Store */}
              <a href="#" className="store-btn light">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="black"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                <div>
                  <div style={{ fontSize: '10px', color: '#666', lineHeight: 1, fontWeight: 400 }}>Descárgala en el</div>
                  <div style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 700, fontSize: '17px', lineHeight: 1.2 }}>App Store</div>
                </div>
              </a>
              {/* Google Play */}
              <a href="#" className="store-btn light">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M3.18 23.76c.37.2.8.22 1.18.06l11.88-6.87-2.61-2.61-10.45 9.42Z" fill="#EA4335"/>
                  <path d="M20.85 10.1 17.26 8 14.4 10.87l2.88 2.87 3.59-2.1c.97-.56.97-2 0-2.54Z" fill="#FBBC04"/>
                  <path d="M4.36.18C3.98.02 3.55.04 3.18.24L14.4 11.5 17.01 8.87 5.54.24C5.17.04 4.73.02 4.36.18Z" fill="#4285F4"/>
                  <path d="M3.18.24c-.99.57-.99 2.02 0 2.59L3.18 21.31c0 .01 0 .01-.01.01l.01.01V.24Z" fill="#34A853"/>
                </svg>
                <div>
                  <div style={{ fontSize: '10px', color: '#666', lineHeight: 1, fontWeight: 400 }}>DISPONIBLE EN</div>
                  <div style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 700, fontSize: '17px', lineHeight: 1.2 }}>Google Play</div>
                </div>
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
