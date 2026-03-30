'use client';

import React from 'react';
import { User, LogOut, ChevronRight, History, Bell, Settings, CreditCard, LifeBuoy } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, profile } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/');
  };

  const menuItems = [
    { icon: <History size={20} color="#4B5563" />, label: 'Mis Pedidos', href: '/app/orders' },
    { icon: <CreditCard size={20} color="#4B5563" />, label: 'Métodos de pago', href: '#' },
    { icon: <Bell size={20} color="#4B5563" />, label: 'Notificaciones', href: '#' },
    { icon: <Settings size={20} color="#4B5563" />, label: 'Configuraciones', href: '#' },
    { icon: <LifeBuoy size={20} color="#4B5563" />, label: 'Ayuda y Soporte', href: '#' },
  ];

  return (
    <div style={{ minHeight: '100dvh', background: '#FAFAFA', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* ── HEADER ── */}
      <div style={{ background: 'white', padding: '24px 16px', borderBottom: '1px solid #F0F0F0', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ width: '64px', height: '64px', background: '#16A34A', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: '24px' }}>
          {profile?.name?.[0]?.toUpperCase() || 'U'}
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 800, color: '#111' }}>
            {profile?.name || 'Usuario Invitado'}
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: '#6B7280', fontWeight: 500 }}>
            {user?.email || 'Regístrate para más beneficios'}
          </p>
        </div>
        {!user && (
          <button 
            onClick={() => router.push('/login')}
            style={{ padding: '8px 16px', background: '#16A34A', color: 'white', border: 'none', borderRadius: '24px', fontWeight: 700, fontSize: '12px' }}
          >
            Entrar
          </button>
        )}
      </div>

      {/* ── MENÚ DE OPCIONES ── */}
      <div style={{ padding: '16px' }}>
        <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', border: '1px solid #F0F0F0' }}>
          {menuItems.map((item, idx) => (
            <Link key={item.label} href={item.href} style={{ textDecoration: 'none' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                padding: '16px',
                borderBottom: idx !== menuItems.length - 1 ? '1px solid #F0F0F0' : 'none'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', background: '#F9FAFB', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.icon}
                  </div>
                  <span style={{ fontSize: '15px', fontWeight: 600, color: '#111' }}>{item.label}</span>
                </div>
                <ChevronRight size={18} color="#D1D5DB" />
              </div>
            </Link>
          ))}
        </div>

        {/* ── CIERRE DE SESIÓN ── */}
        {user && (
          <button 
            onClick={handleSignOut}
            style={{ 
              marginTop: '24px', 
              width: '100%', 
              padding: '16px', 
              background: 'white', 
              border: '1px solid #FEE2E2', 
              borderRadius: '16px', 
              color: '#EF4444', 
              fontWeight: 700, 
              fontSize: '15px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '8px',
              cursor: 'pointer'
            }}
          >
            <LogOut size={18} /> Cerrar Sesión
          </button>
        )}
      </div>
    
    </div>
  );
}
