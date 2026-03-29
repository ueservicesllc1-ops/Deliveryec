'use client';
import { Mail, Phone } from 'lucide-react';
import type { ReactNode } from 'react';

const socialLinks = [
  { label: 'IG', color: '#E1306C', href: '#' },
  { label: 'FB', color: '#1877F2', href: '#' },
  { label: 'TW', color: '#1DA1F2', href: '#' },
  { label: 'TT', color: 'white', href: '#' },
];

const contactItems: { icon: ReactNode; text: string }[] = [
  { icon: <Mail size={13} />, text: 'info@delivery.ec' },
  { icon: <Phone size={13} />, text: '+593 99 000 0000' },
  { icon: null, text: 'Disponible 24/7' },
];

const footerLinks: Record<string, string[]> = {
  'Enlaces': ['Inicio', 'Restaurantes', 'Categorías', 'Ofertas'],
  'Soporte': ['Ayuda', 'Mis Pedidos', 'Términos y Condiciones', 'Privacidad'],
};

export default function Footer() {
  return (
    <footer style={{ background: 'var(--dark)', color: 'white', padding: '56px 24px 28px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '200px repeat(4, 1fr)', gap: '40px', marginBottom: '48px' }}>

          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <img src="/logo.png" style={{ height: '28px', objectFit: 'contain' }} alt="Deliveryy" />
            </div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', lineHeight: 1.7, marginBottom: '18px' }}>
              Comida rápida, segura y deliciosa.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              {socialLinks.map((s, i) => (
                <a key={i} href={s.href} style={{
                  width: '34px', height: '34px', borderRadius: '8px',
                  background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'rgba(255,255,255,0.5)', transition: 'all 0.2s', textDecoration: 'none',
                  fontSize: '11px', fontWeight: 700,
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = s.color; (e.currentTarget as HTMLElement).style.borderColor = s.color; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'; }}>
                  {s.label}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([label, items]) => (
            <div key={label}>
              <h4 style={{ fontFamily: 'Outfit,sans-serif', fontSize: '14px', fontWeight: 700, color: 'white', marginBottom: '16px' }}>{label}</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {items.map((l, i) => (
                  <a key={i} href="#" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', textDecoration: 'none', transition: 'color 0.15s' }}
                    onMouseEnter={e => (e.target as HTMLElement).style.color = 'white'}
                    onMouseLeave={e => (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.4)'}>{l}</a>
                ))}
              </div>
            </div>
          ))}

          {/* Contact */}
          <div>
            <h4 style={{ fontFamily: 'Outfit,sans-serif', fontSize: '14px', fontWeight: 700, color: 'white', marginBottom: '16px' }}>Contacto</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {contactItems.map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '7px', color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
                  {c.icon && <span style={{ opacity: 0.6 }}>{c.icon}</span>}
                  {c.text}
                </div>
              ))}
            </div>
          </div>

          {/* Delivery zone */}
          <div>
            <h4 style={{ fontFamily: 'Outfit,sans-serif', fontSize: '14px', fontWeight: 700, color: 'white', marginBottom: '16px' }}>Zona de Entrega</h4>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginBottom: '14px' }}>Cobertura en toda la ciudad</p>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '7px 14px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)',
              borderRadius: '6px', fontSize: '12px', fontWeight: 600, color: '#22c55e',
            }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} />
              Entrega en 25–35 min
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '24px', textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '13px' }}>
            © 2026 <span style={{ color: 'var(--orange)' }}>Delivery.ec</span> Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
