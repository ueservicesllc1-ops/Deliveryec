'use client';

import React from 'react';
import { Home, Search, ClipboardList, User } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useCart } from '@/lib/CartContext';
import { useRouter, usePathname } from 'next/navigation';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();
  const { cartCount, subtotal } = useCart();
  const router = useRouter();
  const pathname = usePathname();

  // If we are in checkout, don't show the bottom nav
  const isCheckout = pathname.includes('/checkout');

  const navItems = [
    { href: '/app',         icon: <Home size={24} />,          label: 'Inicio' },
    { href: '/app/search',  icon: <Search size={24} />,        label: 'Buscar' },
    { href: '/app/orders',  icon: <ClipboardList size={24} />, label: 'Pedidos' },
    { href: '/app/profile', icon: <User size={24} />,          label: 'Cuenta' },
  ];

  const isActive = (href: string) => {
    if (href === '/app' && pathname === '/app') return true;
    if (href !== '/app' && pathname.includes(href)) return true;
    return false;
  };

  return (
    <div style={{
      width: '100%',
      minHeight: '100dvh',
      background: '#FAFAFA',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* ── PAGE CONTENT ── */}
      <main style={{ 
        flex: 1, 
        width: '100%', 
        margin: '0 auto', 
        paddingBottom: isCheckout ? '0' : '80px', 
      }}>
        {children}
      </main>

      {/* ── BOTTOM NAV (Green Theme) ── */}
      {!isCheckout && (
        <nav style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'white',
          borderTop: '1px solid #F0F0F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '70px',
          padding: '0 16px',
          zIndex: 50,
          paddingBottom: 'env(safe-area-inset-bottom)'
        }}>
          <div style={{ display: 'flex', gap: '8px', flex: 1, justifyContent: 'space-between', paddingRight: '16px' }}>
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <button
                  key={item.label}
                  onClick={() => router.push(item.href)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: active ? '#16A34A' : '#A3A3A3',
                    minWidth: '60px'
                  }}
                >
                  {React.cloneElement(item.icon, { 
                    strokeWidth: active ? 2.5 : 2,
                    fill: active ? '#16A34A' : 'none',
                    color: active ? '#16A34A' : '#A3A3A3'
                  })}
                  <span style={{ fontSize: '10px', fontWeight: active ? 600 : 500 }}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Cart Integrated Button */}
          <button 
            onClick={() => router.push('/app/checkout')}
            style={{
              background: '#4CAF50',
              border: 'none',
              borderRadius: '24px',
              height: '40px',
              padding: '0 16px',
              color: 'white',
              fontWeight: 800,
              fontSize: '15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              cursor: 'pointer',
              minWidth: '80px'
            }}
          >
            ${subtotal.toFixed(0)}
            
            {cartCount > 0 && (
              <div style={{
                position: 'absolute',
                top: '-6px',
                right: '-6px',
                background: '#4CAF50',
                border: '2px solid white',
                color: 'white',
                fontSize: '10px',
                fontWeight: 800,
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {cartCount}
              </div>
            )}
          </button>
        </nav>
      )}
    </div>
  );
}
