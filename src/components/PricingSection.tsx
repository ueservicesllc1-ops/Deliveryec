'use client';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Check, ArrowRight } from 'lucide-react';

const plans = [
  {
    name: 'Básico',
    price: '$0',
    period: 'para siempre',
    desc: 'Para probar la plataforma',
    features: ['Hasta 30 pedidos / mes', 'Menú digital básico', '5 fotos de productos', 'Soporte por email', 'Reportes básicos'],
    cta: 'Empezar gratis',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$49',
    period: '/ mes',
    desc: 'El más popular para negocios en crecimiento',
    features: ['Pedidos ilimitados', 'Menú con fotos y videos', 'Posicionamiento prioritario', 'Analytics avanzados', 'Chat con clientes', 'Soporte 24 / 7', 'Promociones y descuentos'],
    cta: 'Comenzar gratis 14 días',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: '$99',
    period: '/ mes',
    desc: 'Para cadenas y multi-locales',
    features: ['Todo lo del plan Pro', 'Múltiples sucursales', 'API personalizada', 'Manager dedicado', 'Campañas de marketing', 'Integración con POS', 'SLA garantizado'],
    cta: 'Contactar ventas',
    popular: false,
  },
];

export default function PricingSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section id="pricing" ref={ref} style={{ padding: '120px 24px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }}
          style={{ textAlign: 'center', marginBottom: '64px' }}>
          <div className="label-tag" style={{ display: 'inline-flex', marginBottom: '20px' }}>Para restaurantes</div>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'clamp(28px, 4.5vw, 48px)', fontWeight: 800, letterSpacing: '-1.5px', marginBottom: '14px' }}>
            Planes simples y <span className="gradient-text">transparentes</span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '16px', maxWidth: '440px', margin: '0 auto' }}>
            Sin contratos de permanencia. Sin costos de instalación. Cancela cuando quieras.
          </p>
        </motion.div>

        {/* Plans */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', alignItems: 'start' }}>
          {plans.map((plan, i) => (
            <motion.div key={i}
              className={`pricing-card${plan.popular ? ' popular' : ''}`}
              initial={{ opacity: 0, y: 32 }} animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.45, delay: i * 0.1 }}
              style={{ position: 'relative' }}
            >
              {plan.popular && (
                <div style={{
                  position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
                  background: 'var(--orange)', color: 'white',
                  padding: '4px 14px', borderRadius: '6px',
                  fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', whiteSpace: 'nowrap',
                }}>
                  MÁS POPULAR
                </div>
              )}

              <div style={{ marginBottom: '6px' }}>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 600, color: plan.popular ? 'var(--orange-light)' : 'rgba(255,255,255,0.4)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  {plan.name}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px', marginBottom: '6px' }}>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '44px', fontWeight: 900, color: 'white', letterSpacing: '-2px', lineHeight: 1 }}>{plan.price}</span>
                <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '14px' }}>{plan.period}</span>
              </div>

              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', marginBottom: '24px' }}>{plan.desc}</p>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '22px', marginBottom: '24px' }}>
                {plan.features.map((f, j) => (
                  <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '11px' }}>
                    <div style={{
                      width: '18px', height: '18px', borderRadius: '5px',
                      background: plan.popular ? 'rgba(255,87,34,0.15)' : 'rgba(255,255,255,0.05)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Check size={11} color={plan.popular ? 'var(--orange-light)' : 'rgba(255,255,255,0.35)'} strokeWidth={2.5} />
                    </div>
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)' }}>{f}</span>
                  </div>
                ))}
              </div>

              <a href="#"
                className={plan.popular ? 'btn-primary' : 'btn-ghost'}
                style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '7px' }}>
                {plan.cta}
                <ArrowRight size={14} />
              </a>
            </motion.div>
          ))}
        </div>

        <motion.p initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.5 }}
          style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '13px', marginTop: '32px' }}>
          Sin compromisos · Soporte en español · Facturas SRI
        </motion.p>
      </div>
    </section>
  );
}
