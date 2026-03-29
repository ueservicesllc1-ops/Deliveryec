'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingCart, Menu, X } from 'lucide-react';

const navLinks = ['Inicio', 'Restaurantes', 'Categorías', 'Ofertas', 'Seguimiento'];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        background: scrolled ? 'rgba(17,17,17,0.97)' : 'var(--dark)',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.06)',
        transition: 'all 0.3s ease',
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', gap: '32px' }}>
          {/* Logo */}
          <a href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <img src="/logo.png" style={{ height: '32px', objectFit: 'contain' }} alt="Deliveryy" />
          </a>

          {/* Nav links */}
          <div className="desktop-only" style={{ display: 'flex', gap: '4px', flex: 1 }}>
            {navLinks.map((l, i) => (
              <a key={i} href="#" style={{
                color: i === 0 ? 'var(--orange)' : 'rgba(255,255,255,0.6)',
                textDecoration: 'none', fontSize: '14px', fontWeight: 500,
                padding: '7px 13px', borderRadius: '7px', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { (e.target as HTMLElement).style.color = 'white'; (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.07)'; }}
              onMouseLeave={e => { (e.target as HTMLElement).style.color = i === 0 ? 'var(--orange)' : 'rgba(255,255,255,0.6)'; (e.target as HTMLElement).style.background = 'transparent'; }}
              >{l}</a>
            ))}
          </div>

          {/* Right side */}
          <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' }}>
            <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: '6px', borderRadius: '6px', transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'white')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}>
              <Search size={18} />
            </button>
            <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: '6px', borderRadius: '6px', transition: 'color 0.15s', position: 'relative' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'white')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}>
              <ShoppingCart size={18} />
              <span style={{ position: 'absolute', top: '2px', right: '2px', width: '8px', height: '8px', background: 'var(--orange)', borderRadius: '50%', border: '1.5px solid var(--dark)' }} />
            </button>
            <a href="/login" style={{ color: 'rgba(255,255,255,0.75)', textDecoration: 'none', fontSize: '14px', fontWeight: 500, padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', transition: 'all 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.3)'; (e.currentTarget as HTMLElement).style.color = 'white'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.75)'; }}>
              Iniciar Sesión
            </a>
            <a href="/login" className="btn-orange" style={{ padding: '8px 18px', fontSize: '13px' }}>Registrarse</a>
          </div>

          {/* Mobile */}
          <button className="mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'none' }}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            style={{ position: 'fixed', top: '64px', left: 0, right: 0, zIndex: 999, background: 'var(--dark)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '16px 24px 24px' }}>
            {navLinks.map((l, i) => (
              <a key={i} href="#" onClick={() => setMobileOpen(false)}
                style={{ display: 'block', color: i === 0 ? 'var(--orange)' : 'rgba(255,255,255,0.75)', textDecoration: 'none', fontSize: '16px', fontWeight: 600, padding: '13px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {l}
              </a>
            ))}
            <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
              <a href="#" className="btn-outline-dark" style={{ flex: 1, justifyContent: 'center' }}>Iniciar Sesión</a>
              <a href="#" className="btn-orange" style={{ flex: 1, justifyContent: 'center' }}>Registrarse</a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
