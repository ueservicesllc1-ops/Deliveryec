'use client';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Star } from 'lucide-react';

const testimonials = [
  { name: 'Valentina P.', role: 'Cliente frecuente', rating: 5, text: '"Pedí pizza a las 11pm y llegó en 22 minutos. El tracking en vivo es increíble, pude ver exactamente dónde estaba el repartidor."' },
  { name: 'Carlos M.', role: 'Usuario · Guayaquil', rating: 5, text: '"Llevo 6 meses usando Delivery.ec y nunca me ha fallado. Precios justos, entrega rápida y soporte al instante."' },
  { name: 'Diego R.', role: 'Repartidor · Ambato', rating: 5, text: '"Como repartidor llevo 8 meses y gano más que en mi trabajo anterior. La flexibilidad es lo mejor que tiene la app."' },
  { name: 'Sofía H.', role: 'Dueña de restaurante', rating: 5, text: '"Mi restaurante aumentó ventas un 40% desde que nos unimos. Los reportes me ayudan a entender qué platos son los favoritos."' },
];

const colors = ['#FF5722', '#E64A19', '#FF7043', '#D84315'];

export default function TestimonialsSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section ref={ref} style={{ background: 'var(--light-bg)', padding: '64px 24px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }}
          style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontFamily: 'Outfit,sans-serif', fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '8px' }}>
            Lo que dice nuestra <span className="gradient-text">comunidad</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>Miles de ecuatorianos ya confían en Delivery.ec</p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '16px' }}>
          {testimonials.map((t, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              style={{ background: 'white', borderRadius: '14px', padding: '24px', border: '1px solid var(--border-light)', transition: 'all 0.25s ease', boxShadow: 'var(--shadow-sm)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}>
              <div style={{ display: 'flex', gap: '3px', marginBottom: '14px' }}>
                {Array.from({ length: t.rating }).map((_, j) => <Star key={j} size={14} fill="var(--orange)" color="transparent" />)}
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.75, marginBottom: '20px', fontStyle: 'italic' }}>{t.text}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: colors[i % colors.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Outfit,sans-serif', fontWeight: 700, fontSize: '14px', color: 'white', flexShrink: 0 }}>
                  {t.name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 700, fontSize: '14px', color: 'var(--text-dark)' }}>{t.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-light)' }}>{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
