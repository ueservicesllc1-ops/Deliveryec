'use client';

import React, { useState, useEffect } from 'react';
import { Home, Search, ClipboardList, User, LogOut, X, ChevronDown, MapPin, Bike, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [city, setCity]               = useState<string | null>(null);
  const [gpsLoading, setGpsLoading]   = useState(false);
  const [tempAddress, setTempAddress] = useState<string | null>(null);
  const [tempCoords, setTempCoords]   = useState<[number, number] | null>(null);
  const [isSaving, setIsSaving]       = useState(false);
  const [persistentAddress, setPersistentAddress] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Load address from Profile or LocalStorage (for guests)
  useEffect(() => {
    if (profile?.defaultAddress) {
      setPersistentAddress(profile.defaultAddress);
    } else if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('guestAddress');
      if (stored) setPersistentAddress(stored);
    }
  }, [profile]);

  // Removed forced login redirect for public browsing
  useEffect(() => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`,
            { headers: { 'Accept-Language': 'es' } }
          );
          const data = await res.json();
          const detected =
            data.address?.city        ||
            data.address?.town        ||
            data.address?.village     ||
            data.address?.county      ||
            'Mi ubicación';
          setCity(detected);
        } catch {
          setCity('Mi ubicación');
        } finally {
          setGpsLoading(false);
        }
      },
      () => {
        setCity('Quito'); // fallback if user denies GPS
        setGpsLoading(false);
      },
      { timeout: 6000 }
    );
  }, []);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/');
  };

  if (loading) {
    return (
      <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'white' }}>
        <Loader2 className="animate-spin" color="#FF5722" size={40} />
      </div>
    );
  }

  // Pure blank layout for checkout to avoid any mounting/clashing issues
  if (pathname.includes('/checkout')) {
    return <div className="min-h-screen bg-[#F1F5F9]">{children}</div>;
  }

  const navItems = [
    { href: '/order',         icon: <Home size={22} />,          label: 'Inicio' },
    { href: '/order/orders',  icon: <ClipboardList size={22} />, label: 'Pedidos' },
    { href: '/order/search',  icon: <Search size={22} />,        label: 'Buscar' },
    { href: '#profile',     icon: <User size={22} />,          label: 'Perfil', onClick: () => setProfileOpen(true) },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <div style={{
      width: '100%',
      minHeight: '100dvh',
      background: '#F5F5F7',
      fontFamily: 'Inter, -apple-system, sans-serif',
      display: 'flex',
      flexDirection: 'column',
    }}>

      {/* ── TOP HEADER (Light Premium aesthetic) ── */}
      {!pathname.includes('/checkout') && (
        <header style={{
          background: 'white',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
          width: '100%',
        }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '14px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '24px',
        }}>
          {/* Logo */}
          <Link href="/order" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', flexShrink: 0 }}>
            <img src="/logo2.png" alt="Delivery" style={{ height: '32px', width: 'auto', objectFit: 'contain' }} />
          </Link>

          {/* Desktop nav tabs (Light Premium) */}
          <nav className="hidden md:flex" style={{ gap: '4px', alignItems: 'center', flex: 1, justifyContent: 'center' }}>
            {navItems.filter(n => n.href !== '#profile').map(item => {
              const active = isActive(item.href);
              return (
                <button
                  key={item.label}
                  onClick={() => router.push(item.href)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 16px', borderRadius: '12px', border: 'none',
                    background: active ? '#FFF0EE' : 'transparent',
                    color: active ? '#FF5722' : '#666',
                    fontWeight: active ? 700 : 600,
                    fontSize: '14px', cursor: 'pointer',
                  }}
                >
                  {React.cloneElement(item.icon, { size: 16 })}
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Location + Avatar (Light Version) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#F5F5F7', borderRadius: '10px', padding: '6px 10px', cursor: 'pointer' }}>
              <MapPin size={14} color="#FF5722" />
              {gpsLoading ? (
                <Loader2 size={12} color="#999" className="animate-spin" />
              ) : (
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#333', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {city || '...'}
                </span>
              )}
              <ChevronDown size={12} color="#999" />
            </div>
            <button
              onClick={() => setProfileOpen(true)}
              style={{ width: '36px', height: '36px', background: '#FF5722', borderRadius: '50%', border: 'none', color: 'white', fontWeight: 900, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            >
              {profile?.name?.[0]?.toUpperCase() || 'U'}
            </button>
          </div>
        </div>
      </header>
    )}

      {/* ── PAGE CONTENT ── */}
      <main style={{ 
        flex: 1, 
        width: '100%', 
        maxWidth: pathname.includes('/checkout') ? 'none' : '1280px', 
        margin: '0 auto', 
        paddingBottom: pathname.includes('/checkout') ? '0' : '80px', 
        boxSizing: 'border-box' 
      }}>
        {children}
      </main>

      {/* ── BOTTOM NAV (mobile only) ── */}
      {!pathname.includes('/checkout') && (
        <nav className="md:hidden fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-black/5 flex items-stretch h-[68px] z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <button
                key={item.label}
                onClick={item.onClick || (() => router.push(item.href))}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '3px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: active ? '#FF5722' : '#BBBBC0',
                  transition: 'color 0.2s',
                  padding: '8px 0',
                  position: 'relative',
                }}
              >
                {active && (
                  <div style={{ position: 'absolute', top: 0, left: '25%', right: '25%', height: '2px', background: '#FF5722', borderRadius: '0 0 4px 4px' }} />
                )}
                {React.cloneElement(item.icon, { size: 22, strokeWidth: active ? 2.5 : 1.8 })}
                <span style={{ fontSize: '10px', fontWeight: active ? 800 : 600, letterSpacing: '0.02em' }}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      )}

      {/* ── PROFILE DROP-DOWN (Square Premium) ── */}
      {profileOpen && (
        <>
          <div
            onClick={() => setProfileOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.05)', zIndex: 100 }}
          />
          <div 
            className="fixed bottom-0 left-0 w-full bg-white border border-black/10 z-[101] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.1)] md:top-[80px] md:bottom-auto md:left-auto md:w-[400px] md:rounded-[4px] md:border md:border-black/5"
            style={{ 
              maxHeight: 'calc(100vh - 100px)', 
              overflowY: 'auto',
              right: 'max(32px, calc(50vw - 640px + 32px))'
            }}
          >
            {/* Minimal drag handle for mobile */}
            <div className="md:hidden" style={{ width: '32px', height: '2px', background: '#EEE', margin: '0 auto 32px' }} />

            <button onClick={() => setProfileOpen(false)} style={{ position: 'absolute', top: '24px', right: '24px', background: '#F8F9FA', border: 'none', width: '32px', height: '32px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={16} color="#999" />
            </button>

            {/* Avatar + Name (Loose Layout) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px', paddingBottom: '32px', borderBottom: '1px solid #F0F0F0' }}>
              <div style={{ width: '56px', height: '56px', background: '#FF5722', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: '20px', flexShrink: 0 }}>
                {profile?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <p style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#111', letterSpacing: '-0.3px' }}>{profile?.name || 'Usuario'}</p>
                <p style={{ margin: 0, fontSize: '13px', color: '#888', fontWeight: 500 }}>{user?.email || user?.phoneNumber}</p>
              </div>
            </div>

            {/* Menu Items (More Spaced) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { icon: <Home size={20} />, label: 'Inicio',      href: '/order' },
                { icon: <ClipboardList size={20} />, label: 'Mis Pedidos', href: '/order/orders' },
                { icon: <Bike size={20} />, label: 'Quiero ser Driver', href: '/driver' },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setProfileOpen(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', borderRadius: '4px', textDecoration: 'none', color: '#333', transition: 'all 0.2s', background: 'transparent' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#F8F9FA'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ color: '#BBB' }}>{item.icon}</div>
                  <span style={{ fontSize: '15px', fontWeight: 700 }}>{item.label}</span>
                </Link>
              ))}

              {/* Default Address Section (Loose & Square) */}
              <div style={{ marginTop: '24px', padding: '24px', background: '#F8F9FA', borderRadius: '4px', border: '1px solid #EEE' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ width: '40px', height: '40px', background: 'white', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF5722', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <MapPin size={20} />
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <p style={{ margin: 0, fontSize: '11px', fontWeight: 800, color: '#AAA', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dirección Guardada</p>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#333', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {persistentAddress || 'No configurada'}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p style={{ margin: 0, fontSize: '11px', fontWeight: 800, color: '#AAA', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cambiar dirección</p>
                  <AddressAutocomplete 
                    onAddressSelect={(addr, coord) => {
                      setTempAddress(addr);
                      setTempCoords(coord || null);
                    }}
                    placeholder="Casa, Oficina, Departamento..."
                    initialValue={persistentAddress || ''}
                  />

                  {tempAddress && (
                    <button
                      onClick={async () => {
                        const currentUser = user || auth.currentUser;
                        setIsSaving(true);
                        try {
                          if (currentUser) {
                            const profileRef = doc(db, 'profiles', currentUser.uid);
                            await setDoc(profileRef, {
                              defaultAddress: tempAddress,
                              defaultLocation: { lat: tempCoords?.[0], lng: tempCoords?.[1] }
                            }, { merge: true });
                          } else {
                            // Guest mode: save to localStorage
                            localStorage.setItem('guestAddress', tempAddress);
                            if (tempCoords) localStorage.setItem('guestCoords', JSON.stringify(tempCoords));
                          }
                          setPersistentAddress(tempAddress);
                          setTempAddress(null); // Clear input after saving
                        } catch (err) {
                          alert("Error al guardar.");
                        } finally {
                          setIsSaving(false);
                        }
                      }}
                      disabled={isSaving}
                      style={{
                        width: '100%', padding: '16px', background: '#FF5722', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 900, fontSize: '14px', cursor: isSaving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '8px'
                      }}
                    >
                      {isSaving ? <Loader2 size={18} className="animate-spin" /> : <MapPin size={18} fill="white" />}
                      {isSaving ? 'GUARDANDO...' : 'ACTUALIZAR DIRECCIÓN'}
                    </button>
                  )}
                </div>
              </div>

              {/* Authentication Actions */}
              <div style={{ marginTop: '24px' }}>
                {user ? (
                  <button onClick={() => auth.signOut()} style={{ width: '100%', padding: '18px', borderRadius: '4px', background: 'transparent', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)', fontWeight: 800, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}>
                    <LogOut size={18} /> Cerrar Sesión
                  </button>
                ) : (
                  <button onClick={() => router.push('/login')} style={{ width: '100%', padding: '18px', borderRadius: '4px', background: '#FF5722', color: 'white', border: 'none', fontWeight: 900, fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <User size={18} /> Iniciar Sesión / Registrarse
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
