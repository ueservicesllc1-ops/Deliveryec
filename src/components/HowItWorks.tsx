'use client';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { MapPin, Smartphone, CheckCircle } from 'lucide-react';

const steps = [
  {
    num: 1,
    icon: <MapPin size={28} color="white" />,
    title: 'Busca tu restaurante',
    desc: 'Explora miles de opciones cerca de ti',
  },
  {
    num: 2,
    icon: <Smartphone size={28} color="white" />,
    title: 'Realiza tu pedido',
    desc: 'Elige tus platillos y paga fácil y seguro',
  },
  {
    num: 3,
    icon: <CheckCircle size={28} color="white" />,
    title: 'Recibe tu comida',
    desc: 'En la puerta de tu casa, rápido y caliente',
  },
];

export default function HowItWorks() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section id="how-it-works" ref={ref} className="section-dark" style={{ padding: '64px 24px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <motion.h2
          initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }}
          style={{ fontFamily: 'Outfit,sans-serif', fontSize: 'clamp(24px, 3vw, 34px)', fontWeight: 800, textAlign: 'center', marginBottom: '48px', letterSpacing: '-0.5px' }}>
          ¿Cómo <span className="gradient-text">funciona?</span>
        </motion.h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0', position: 'relative' }}>
          {/* Dashed connector */}
          <div style={{
            position: 'absolute', top: '26px', left: '16.66%', right: '16.66%', height: '2px',
            borderTop: '2px dashed rgba(255,87,34,0.4)',
            zIndex: 0,
          }} />

          {steps.map((step, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.45, delay: i * 0.15 }}
              style={{ textAlign: 'center', padding: '0 24px', position: 'relative', zIndex: 1 }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%',
                background: 'var(--orange)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px', boxShadow: '0 4px 20px rgba(255,87,34,0.4)',
              }}>
                {step.icon}
              </div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: '24px', height: '24px', borderRadius: '50%',
                background: 'rgba(255,87,34,0.2)', color: 'var(--orange)',
                fontWeight: 800, fontSize: '12px', marginBottom: '12px',
                fontFamily: 'Outfit,sans-serif',
              }}>{step.num}</div>
              <h3 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 700, fontSize: '18px', color: 'white', marginBottom: '8px' }}>
                {step.title}
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', lineHeight: 1.6 }}>{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
