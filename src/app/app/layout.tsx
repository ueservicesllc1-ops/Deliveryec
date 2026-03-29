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
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Si la carga terminó y no hay usuario, mandarlo al login de inmediato
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  // Auto-detect city via GPS + OpenStreetMap Nominatim (free, no key needed)
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

  // Si no hay usuario y no está cargando (ya se ejecutó el push(login)), no renderizamos nada privado
  if (!user && !loading) return null;

  const navItems = [
    { href: '/app',         icon: <Home size={22} />,          label: 'Inicio' },
    { href: '/app/orders',  icon: <ClipboardList size={22} />, label: 'Pedidos' },
    { href: '/app/search',  icon: <Search size={22} />,        label: 'Buscar' },
    { href: '#profile',     icon: <User size={22} />,          label: 'Perfil', onClick: () => setProfileOpen(true) },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#F5F5F7',
      fontFamily: 'Inter, -apple-system, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      maxWidth: '480px',
      margin: '0 auto',
      position: 'relative',
    }}>

      {/* ── TOP HEADER ── */}
      <header style={{
        background: 'white',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
      }}>
        {/* Logo */}
        <Link href="/app" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <div style={{ background: '#FF5722', width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: '16px', fontStyle: 'italic' }}>D</div>
          <span style={{ fontSize: '18px', fontWeight: 900, color: '#111', letterSpacing: '-0.5px' }}>
            Delivery<span style={{ color: '#FF5722' }}>.ec</span>
          </span>
        </Link>

        {/* Location + Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#F5F5F7', borderRadius: '10px', padding: '6px 10px', cursor: 'pointer' }}>
            <MapPin size={14} color="#FF5722" />
            {gpsLoading ? (
              <Loader2 size={12} color="#999" className="animate-spin" />
            ) : (
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#333', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
      </header>

      {/* ── PAGE CONTENT ── */}
      <main style={{ flex: 1, overflowY: 'auto', paddingBottom: '80px' }}>
        {children}
      </main>

      {/* ── BOTTOM NAV ── */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '480px',
        background: 'white',
        borderTop: '1px solid rgba(0,0,0,0.06)',
        display: 'flex',
        alignItems: 'stretch',
        height: '68px',
        zIndex: 50,
        boxShadow: '0 -4px 20px rgba(0,0,0,0.06)',
      }}>
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

      {/* ── PROFILE SLIDE-UP SHEET ── */}
      {profileOpen && (
        <>
          <div
            onClick={() => setProfileOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, backdropFilter: 'blur(4px)' }}
          />
          <div style={{
            position: 'fixed',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '100%',
            maxWidth: '480px',
            background: 'white',
            borderRadius: '28px 28px 0 0',
            zIndex: 101,
            padding: '8px 24px 36px',
            boxShadow: '0 -8px 40px rgba(0,0,0,0.2)',
          }}>
            {/* Drag handle */}
            <div style={{ width: '40px', height: '4px', background: '#E5E5E5', borderRadius: '99px', margin: '12px auto 24px' }} />

            <button onClick={() => setProfileOpen(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: '#F5F5F7', border: 'none', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={18} color="#666" />
            </button>

            {/* Avatar + Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #F0F0F0' }}>
              <div style={{ width: '60px', height: '60px', background: '#FF5722', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: '24px', flexShrink: 0 }}>
                {profile?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#111', letterSpacing: '-0.3px' }}>{profile?.name || 'Usuario'}</p>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#999', fontWeight: 500 }}>{user?.email || user?.phoneNumber}</p>
                <div style={{ marginTop: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#FFF3EE', borderRadius: '99px', padding: '3px 10px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: '#FF5722', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{profile?.role || 'Cliente'}</span>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {[
                { icon: <Home size={20} />, label: 'Inicio',      href: '/app' },
                { icon: <ClipboardList size={20} />, label: 'Mis Pedidos', href: '/app/orders' },
                { icon: <Bike size={20} />, label: 'Quiero ser Driver', href: '/driver' },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setProfileOpen(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 16px', borderRadius: '16px', textDecoration: 'none', color: '#111', background: 'transparent' }}
                >
                  <div style={{ width: '40px', height: '40px', background: '#F5F5F7', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                    {item.icon}
                  </div>
                  <span style={{ fontSize: '15px', fontWeight: 700 }}>{item.label}</span>
                </Link>
              ))}

              {/* Default Address Section */}
              <div style={{ marginTop: '20px', padding: '16px', borderRadius: '24px', background: '#F8F9FA', border: '1px solid #F0F0F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ width: '36px', height: '36px', background: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF5722', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <MapPin size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: '11px', fontWeight: 800, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dirección Guardada</p>
                    <p style={{ margin: '2px 0 0', fontSize: '13px', fontWeight: 700, color: '#333', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {profile?.defaultAddress || 'No configurada'}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p style={{ margin: 0, fontSize: '10px', fontWeight: 800, color: '#BBB', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cambiar dirección</p>
                  <AddressAutocomplete 
                    onAddressSelect={(addr, coord) => {
                      setTempAddress(addr);
                      setTempCoords(coord);
                    }}
                    placeholder="Casa, Oficina, Departamento..."
                    initialValue={profile?.defaultAddress}
                  />

                  {tempAddress && (
                    <button
                      onClick={async () => {
                        const currentUser = user || auth.currentUser;
                        console.log("Intentando guardar dirección:", tempAddress, "Usuario:", currentUser?.uid);
                        
                        if (!currentUser) {
                          console.error("DEBUG: No hay usuario en el Context ni en Auth directo.");
                          alert("Error de sesión. Por favor, cierra sesión y vuelve a entrar.");
                          return;
                        }

                        setIsSaving(true);
                        try {
                          const profileRef = doc(db, 'profiles', currentUser.uid);
                          await setDoc(profileRef, {
                            defaultAddress: tempAddress,
                            defaultLocation: { lat: tempCoords?.[0], lng: tempCoords?.[1] }
                          }, { merge: true });
                          
                          console.log("¡Dirección guardada con éxito!");
                          // Recargamos para ver los cambios
                          window.location.reload();
                        } catch (err) {
                          console.error("Error al guardar en Firestore:", err);
                          alert("Error al guardar la dirección. Revisa la consola.");
                        } finally {
                          setIsSaving(false);
                        }
                      }}
                      disabled={isSaving}
                      style={{
                        width: '100%',
                        padding: '16px',
                        background: '#FF5722',
                        color: 'white',
                        border: 'none',
                        borderRadius: '16px',
                        fontWeight: 900,
                        fontSize: '14px',
                        cursor: isSaving ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        marginTop: '8px',
                        boxShadow: '0 4px 15px rgba(255,87,34,0.3)',
                        transition: 'all 0.2s',
                        opacity: isSaving ? 0.7 : 1,
                        transform: isSaving ? 'scale(0.98)' : 'scale(1)'
                      }}
                    >
                      {isSaving ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <MapPin size={18} fill="white" />
                      )}
                      {isSaving ? 'GUARDANDO...' : 'GUARDAR ESTA DIRECCIÓN'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              style={{ width: '100%', marginTop: '16px', padding: '16px', background: '#FFF0EE', border: 'none', borderRadius: '16px', color: '#FF5722', fontWeight: 800, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <LogOut size={18} /> Cerrar Sesión
            </button>
          </div>
        </>
      )}
    </div>
  );
}
