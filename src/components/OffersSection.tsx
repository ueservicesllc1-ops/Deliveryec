'use client';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';

export default function OffersSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section ref={ref} className="section-white" style={{ padding: '56px 0' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
          <h2 style={{ fontFamily: 'Outfit,sans-serif', fontSize: 'clamp(20px, 2.5vw, 26px)', fontWeight: 800, letterSpacing: '-0.5px' }}>
            Ofertas <span className="gradient-text">Especiales</span>
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Offer 1 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.5 }}
            style={{
              borderRadius: '16px', overflow: 'hidden', position: 'relative', minHeight: '200px',
              background: 'var(--dark)', cursor: 'pointer', display: 'flex', alignItems: 'center',
            }}>
            {/* Food image on right */}
            <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '55%' }}>
              <Image src="/offer-pizza.png" alt="Pizza oferta" fill style={{ objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, var(--dark) 0%, rgba(17,17,17,0.4) 100%)' }} />
            </div>
            {/* Text */}
            <div style={{ position: 'relative', zIndex: 1, padding: '32px 28px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--orange)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pizza</div>
              <div style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 900, fontSize: '42px', color: 'white', lineHeight: 1, marginBottom: '4px' }}>50%</div>
              <div style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 700, fontSize: '22px', color: 'white', marginBottom: '8px' }}>OFF en Pizzas</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '20px' }}>Válido hasta las 11:00 PM</div>
              <a href="#" className="btn-orange" style={{ padding: '10px 20px', fontSize: '13px', gap: '6px' }}>
                Ordenar con Descuento <ArrowRight size={14} />
              </a>
            </div>
          </motion.div>

          {/* Offer 2 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.5, delay: 0.1 }}
            style={{
              borderRadius: '16px', overflow: 'hidden', position: 'relative', minHeight: '200px',
              background: '#1C1008', cursor: 'pointer', display: 'flex', alignItems: 'center',
            }}>
            <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '50%' }}>
              <Image src="/cat-burger.png" alt="Burger oferta" fill style={{ objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, #1C1008 0%, rgba(28,16,8,0.3) 100%)' }} />
            </div>
            <div style={{ position: 'relative', zIndex: 1, padding: '32px 28px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#F59E0B', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Hamburguesas</div>
              <div style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 900, fontSize: '30px', color: 'white', lineHeight: 1.1, marginBottom: '8px' }}>Combo Burger<br /><span style={{ color: 'var(--orange)' }}>2x1</span></div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '20px' }}>Dos hamburguesas al precio de una</div>
              <a href="#" className="btn-orange" style={{ padding: '10px 20px', fontSize: '13px', gap: '6px' }}>
                Pedir Ahora <ArrowRight size={14} />
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
