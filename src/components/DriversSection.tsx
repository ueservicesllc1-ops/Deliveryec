'use client';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { DollarSign, Clock, Map, Shield, TrendingUp, Zap } from 'lucide-react';

const benefits = [
  { icon: <DollarSign size={18} />, title: 'Hasta $800 al mes', desc: 'Gana en tus horas libres sin compromisos ni contratos.' },
  { icon: <Clock size={18} />, title: 'Horarios flexibles', desc: 'Activa y desactiva tu disponibilidad con un solo clic.' },
  { icon: <Map size={18} />, title: 'Navegación optimizada', desc: 'GPS inteligente con rutas eficientes para Ecuador.' },
  { icon: <Zap size={18} />, title: 'Pago instantáneo', desc: 'Retira tus ganancias en cualquier momento del día.' },
  { icon: <TrendingUp size={18} />, title: 'Bonos por demanda', desc: 'Gana hasta 40% más en zonas y horarios de alta demanda.' },
  { icon: <Shield size={18} />, title: 'Seguro incluido', desc: 'Cobertura de accidentes mientras estás activo en la app.' },
];

export default function DriversSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section id="drivers" ref={ref} className="section-alt" style={{ padding: '120px 24px', position: 'relative', overflow: 'hidden' }}>
      {/* Side glow */}
      <div style={{ position: 'absolute', top: '50%', left: '-150px', transform: 'translateY(-50%)', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,87,34,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '80px', alignItems: 'center' }}>

          {/* Left */}
          <motion.div initial={{ opacity: 0, x: -30 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.5 }}>
            <div className="label-tag" style={{ display: 'inline-flex', marginBottom: '20px' }}>Para repartidores</div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'clamp(30px, 4.5vw, 48px)', fontWeight: 800, letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: '18px' }}>
              Gana dinero<br />en tus <span className="gradient-text">tiempos libres</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '16px', lineHeight: 1.75, marginBottom: '36px', maxWidth: '420px' }}>
              Únete a miles de repartidores en Ecuador que generan ingresos extras desde su moto o bicicleta. Sin contrato, sin mínimo de horas.
            </p>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '48px' }}>
              <a href="#" className="btn-primary">Registrarme como repartidor</a>
              <a href="#" className="btn-ghost">Conocer más</a>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', paddingTop: '32px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {[
                { value: '5,000+', label: 'Drivers activos' },
                { value: '$800', label: 'Promedio/mes' },
                { value: '2 hrs', label: 'Para empezar' },
              ].map((s, i) => (
                <div key={i}>
                  <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '22px', fontWeight: 800, color: 'white', letterSpacing: '-0.5px' }}>{s.value}</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginTop: '3px' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right: benefits */}
          <motion.div initial={{ opacity: 0, x: 30 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.5, delay: 0.15 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {benefits.map((b, i) => (
                <motion.div key={i} className="glass-card"
                  initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.35, delay: 0.25 + i * 0.07 }}
                  style={{ padding: '20px' }}>
                  <div className="icon-box" style={{ marginBottom: '14px', width: '36px', height: '36px' }}>{b.icon}</div>
                  <h4 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '14px', fontWeight: 700, color: 'white', marginBottom: '6px' }}>{b.title}</h4>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.38)', lineHeight: 1.65 }}>{b.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
