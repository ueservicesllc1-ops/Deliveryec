'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { db, auth } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Loader2, CheckCircle2, Power, PowerOff, Star, ChevronDown, Bike } from 'lucide-react';
import { useRouter } from 'next/navigation';

const LiveMap = dynamic(() => import('@/components/LiveMap'), { ssr: false });

export default function DriverApp() {
  const { user, profile, loading: authLoading } = useAuth();
  const [orders, setOrders]               = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [online, setOnline]               = useState(false);
  const [myPos, setMyPos]                 = useState<[number, number] | null>(null);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [showMap, setShowMap]             = useState(false);
  const [earnings, setEarnings]           = useState(0);
  const watchId = useRef<number | null>(null);
  const [showSplash, setShowSplash]         = useState(true);
  const router = useRouter();

  // 3-second Splash Screen
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Dedicated Driver Login screen if no user
  if (showSplash) {
    return (
      <AnimatePresence>
        <motion.div
          key="splash"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#09090b', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [0.8, 1.1, 1], opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeOut", repeat: Infinity, repeatType: "reverse" }}
            style={{ width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <img src="/logo.png" alt="Delivery.ec" style={{ width: '100%', objectFit: 'contain' }} />
          </motion.div>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            style={{ marginTop: '24px', textAlign: 'center' }}
          >
            <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 900, letterSpacing: '-0.5px', margin: 0 }}>Driver Portal</h1>
            <p style={{ color: '#FF5722', fontSize: '14px', fontWeight: 600, letterSpacing: '2px', marginTop: '8px' }}>INICIANDO</p>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  if (authLoading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#09090b' }}><Loader2 className="animate-spin" color="#FF5722" size={32} /></div>;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError('');
    try {
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      const { auth: fbAuth } = await import('@/lib/firebase');
      await signInWithEmailAndPassword(fbAuth, email, password);
    } catch (err: any) {
      setLoginError('Correo o contraseña incorrectos.');
    } finally {
      setLoggingIn(false);
    }
  };

  if (!user || !profile) {
    return (
      <div style={{ minHeight: '100vh', background: '#09090b', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'Inter' }}>
        <div style={{ width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          {/* Logo */}
          <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'40px' }}>
            <div style={{ background:'transparent', height:'48px', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <img src="/logo.png" alt="Delivery.ec" style={{ height: '40px', objectFit: 'contain' }} />
            </div>
          </div>

          <h2 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '24px', textAlign: 'center' }}>Portal de Conductores</h2>

          {/* Login Form */}
          <form onSubmit={handleLogin} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ position: 'relative' }}>
              <input type="email" placeholder="Correo electrónico" required value={email} onChange={e=>setEmail(e.target.value)} style={{ width: '100%', padding: '16px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', outline: 'none', fontSize: '15px' }} />
            </div>
            <div style={{ position: 'relative' }}>
              <input type="password" placeholder="Contraseña" required value={password} onChange={e=>setPassword(e.target.value)} style={{ width: '100%', padding: '16px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', outline: 'none', fontSize: '15px' }} />
            </div>
            {loginError && <p style={{ color:'#EF4444', fontSize:'13px', margin:'0', textAlign: 'center', fontWeight: 600 }}>{loginError}</p>}
            
            <button type="submit" disabled={loggingIn} style={{ width: '100%', margin: '8px 0', padding: '16px', background: '#FF5722', color: 'white', border: 'none', borderRadius: '14px', fontWeight: 800, fontSize: '15px', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}>
              {loggingIn ? <Loader2 className="animate-spin" /> : 'Iniciar Sesión'}
            </button>
          </form>

          {/* Register Link */}
          <div style={{ marginTop: '32px', textAlign: 'center', paddingBottom: '24px' }}>
            <p style={{ color: '#888', fontSize: '14px', margin: '0 0 8px' }}>¿Aún no eres parte del equipo de drivers?</p>
            <button onClick={() => router.push('/driver/register')} style={{ background: 'transparent', color: '#FF5722', border: 'none', fontWeight: 800, fontSize: '15px', cursor: 'pointer' }}>
              Registrarme como Driver
            </button>
          </div>

        </div>
      </div>
    );
  }

  // Block users without proper driver approval
  if (profile.role !== 'driver') {
    return (
      <div style={{ minHeight: '100vh', background: '#09090b', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center', fontFamily: 'Inter' }}>
        <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#1a1a1e', padding: '40px 24px', borderRadius: '24px', border: '1px solid rgba(255,87,34,0.1)' }}>
          
          <div style={{ background:'transparent', height:'64px', display:'flex', alignItems:'center', justifyContent:'center', marginBottom: '24px' }}>
            <img src="/logo.png" alt="Delivery.ec" style={{ height: '48px', objectFit: 'contain' }} />
          </div>

          {profile.status === 'pending_approval' ? (
            <>
              <h2 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '12px' }}>Tu solicitud está en revisión</h2>
              <p style={{ color: '#888', fontSize: '15px', lineHeight: 1.6, marginBottom: '24px' }}>Nuestro equipo está verificando tus documentos de identidad y vehículo. Por favor espera, recibirás una respuesta oficial en las próximas 24 horas.</p>
              
              <button onClick={() => { auth.signOut(); window.location.reload(); }} style={{ padding: '12px 24px', borderRadius: '12px', background: 'transparent', color: '#666', fontWeight: 700, border: '1px solid rgba(255,255,255,0.1)', fontSize: '14px', cursor: 'pointer' }}>
                Cerrar Sesión
              </button>
            </>
          ) : (
            <>
              <h2 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '12px' }}>Acceso Denegado</h2>
              <p style={{ color: '#888', fontSize: '15px', marginBottom: '32px', lineHeight: 1.6 }}>Tu cuenta actual no tiene privilegios de Repartidor Independiente. Necesitas registrarte y pasar por el filtro administrativo.</p>
              <button onClick={() => router.push('/driver/register')} style={{ width: '100%', padding: '16px', borderRadius: '16px', background: '#FF5722', color: 'white', fontWeight: 800, border: 'none', fontSize: '16px', cursor: 'pointer', marginBottom: '16px', boxShadow: '0 8px 30px rgba(255,87,34,0.3)' }}>
                Aplicar como Driver
              </button>
              <button onClick={() => { auth.signOut(); window.location.reload(); }} style={{ fontSize: '14px', color: '#666', background: 'none', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                Cambiar de Cuenta
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  /* ── Real-time orders ── */
  useEffect(() => {
    if (authLoading || !user) return; // Wait for auth before querying

    const q = query(
      collection(db, 'orders'),
      where('status', 'in', ['ready', 'pending', 'cooking'])
    );
    return onSnapshot(q, (snap) => {
      const sorted = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setOrders(sorted);
      setOrdersLoading(false);
    }, (err) => {
      console.error('Orders query error:', err.code);
      setOrdersLoading(false);
    });
  }, [user, authLoading]);

  /* ── Go Online / GPS ── */
  const toggleOnline = () => {
    if (online) {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
      setOnline(false);
      setMyPos(null);
      setShowMap(false);
    } else {
      setOnline(true);
      setShowMap(true);
      watchId.current = navigator.geolocation.watchPosition(
        ({ coords }) => {
          const pos: [number, number] = [coords.latitude, coords.longitude];
          setMyPos(pos);
          if (activeOrderId) {
            updateDoc(doc(db, 'orders', activeOrderId), {
              driverLocation: { lat: coords.latitude, lng: coords.longitude },
              driverId: user?.uid,
            }).catch(() => {});
          }
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 3000 }
      );
    }
  };

  const acceptOrder = async (orderId: string) => {
    setActiveOrderId(orderId);
    await updateDoc(doc(db, 'orders', orderId), {
      status: 'ready',
      driverId: user?.uid,
      driverPickedAt: serverTimestamp(),
    });
  };

  const deliverOrder = async (orderId: string) => {
    await updateDoc(doc(db, 'orders', orderId), {
      status: 'delivered',
      deliveredAt: serverTimestamp(),
    });
    setActiveOrderId(null);
    setEarnings(e => e + 3.5); // placeholder commission
  };

  const name     = profile?.name?.split(' ')[0] || 'Driver';
  const initial  = name[0]?.toUpperCase();

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#0f0f11',
      color: '#fff',
      fontFamily: 'Inter, -apple-system, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      maxWidth: '480px',
      margin: '0 auto',
      position: 'relative',
    }}>

      {/* ── TOP STATUS BAR ── */}
      <div style={{
        padding: '16px 20px 12px',
        background: '#1a1a1e',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', background: '#FF5722', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '18px' }}>
            {initial}
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '16px', fontWeight: 800, letterSpacing: '-0.3px' }}>Hola, {name}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: online ? '#22c55e' : '#555', boxShadow: online ? '0 0 6px #22c55e' : 'none', transition: 'all 0.3s' }} />
              <p style={{ margin: 0, fontSize: '11px', color: online ? '#22c55e' : '#555', fontWeight: 700 }}>
                {online ? 'En línea' : 'Desconectado'}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={toggleOnline}
          style={{
            padding: '10px 18px',
            background: online ? 'rgba(255,87,34,0.12)' : 'rgba(34,197,94,0.12)',
            border: `1px solid ${online ? 'rgba(255,87,34,0.3)' : 'rgba(34,197,94,0.3)'}`,
            borderRadius: '14px',
            color: online ? '#FF5722' : '#22c55e',
            fontWeight: 800,
            fontSize: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {online ? <><PowerOff size={16}/> Salir</> : <><Power size={16}/> Conectar</>}
        </button>
      </div>

      {/* ── MAP SECTION ── */}
      <AnimatePresence>
        {online && showMap && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 240 }}
            exit={{ height: 0 }}
            style={{ overflow: 'hidden', flexShrink: 0, position: 'relative' }}
          >
            <LiveMap driverPosition={myPos} zoom={15} />
            <button
              onClick={() => setShowMap(false)}
              style={{ position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(15,15,17,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '99px', padding: '6px 16px', color: '#aaa', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', zIndex: 999, backdropFilter: 'blur(12px)' }}
            >
              <ChevronDown size={14}/> Ocultar mapa
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── EARNINGS STRIP ── */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        {[
          { v: `$${earnings.toFixed(2)}`, l: 'Hoy', c: '#FF5722' },
          { v: online ? (myPos ? '📍 Activo' : '⏳ GPS...') : '–', l: 'Estado', c: online ? '#22c55e' : '#555' },
          { v: activeOrderId ? '1' : '0', l: 'Activos', c: '#3b82f6' },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center', padding: '14px 8px', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
            <p style={{ margin: 0, fontWeight: 900, fontSize: '17px', color: s.c, letterSpacing: '-0.3px' }}>{s.v}</p>
            <p style={{ margin: '2px 0 0', fontSize: '10px', color: '#555', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.l}</p>
          </div>
        ))}
      </div>

      {/* ── ORDERS FEED ── */}
      <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <p style={{ margin: '0 0 4px', fontSize: '10px', fontWeight: 800, color: '#444', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
          {ordersLoading ? 'Conectando...' : !online ? 'Conéctate para ver pedidos' : orders.length === 0 ? 'Sin pedidos disponibles' : `${orders.length} pedido${orders.length > 1 ? 's' : ''} disponible${orders.length > 1 ? 's' : ''}`}
        </p>

        {ordersLoading && (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '40px' }}>
            <Loader2 className="animate-spin" size={32} color="#FF5722" />
          </div>
        )}

        {!ordersLoading && !online && (
          <div style={{ background: '#1a1a1e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '24px', padding: '40px 24px', textAlign: 'center' }}>
            <p style={{ fontSize: '48px', margin: '0 0 12px' }}>🏍️</p>
            <p style={{ color: '#555', fontWeight: 700, fontSize: '14px', margin: 0 }}>Presiona <strong style={{ color: '#22c55e' }}>Conectar</strong> para empezar a recibir pedidos</p>
          </div>
        )}

        {!ordersLoading && online && orders.length === 0 && (
          <div style={{ background: '#1a1a1e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '24px', padding: '40px 24px', textAlign: 'center' }}>
            <p style={{ fontSize: '48px', margin: '0 0 12px' }}>☕</p>
            <p style={{ color: '#555', fontWeight: 700, fontSize: '14px', margin: 0 }}>Esperando pedidos listos para entrega...</p>
          </div>
        )}

        <AnimatePresence>
          {online && orders.map((ord, i) => {
            const isActive = activeOrderId === ord.id;
            const commission = ((ord.total || 0) * 0.15).toFixed(2);
            return (
              <motion.div
                key={ord.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ delay: i * 0.04 }}
                style={{
                  background: isActive ? 'rgba(255,87,34,0.08)' : '#1a1a1e',
                  border: `1px solid ${isActive ? 'rgba(255,87,34,0.3)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: '22px',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                {/* Order header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '46px', height: '46px', background: isActive ? '#FF5722' : 'rgba(255,255,255,0.06)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
                      🍔
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '15px', fontWeight: 800, letterSpacing: '-0.3px' }}>{ord.restaurantName}</p>
                      <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#666' }}>Para: <strong style={{ color: '#aaa' }}>{ord.customerName}</strong></p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: '#FF5722', letterSpacing: '-0.5px' }}>${commission}</p>
                    <p style={{ margin: '1px 0 0', fontSize: '10px', color: '#555', fontWeight: 700 }}>COMISIÓN</p>
                  </div>
                </div>

                {/* Items */}
                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '14px', padding: '10px 14px' }}>
                  <p style={{ margin: 0, fontSize: '12px', color: '#666', lineHeight: 1.5 }}>
                    {ord.items?.map((it: any) => it.name).join(' · ') || 'Artículos del pedido'}
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: 800, color: 'white' }}>Total: ${ord.total?.toFixed(2)}</p>
                </div>

                {/* Action buttons */}
                {!isActive ? (
                  <button
                    onClick={() => acceptOrder(ord.id)}
                    style={{ width: '100%', height: '52px', background: 'linear-gradient(135deg, #FF6B35, #FF5722)', border: 'none', borderRadius: '16px', color: 'white', fontSize: '14px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 20px rgba(255,87,34,0.35)', letterSpacing: '-0.2px' }}
                  >
                    🏍️ Aceptar entrega — ${commission}
                  </button>
                ) : (
                  <button
                    onClick={() => deliverOrder(ord.id)}
                    style={{ width: '100%', height: '52px', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '16px', color: '#22c55e', fontSize: '14px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <CheckCircle2 size={20}/> Confirmar Entrega
                  </button>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* ── SHOW MAP button (when hidden) ── */}
      {online && !showMap && myPos && (
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <button
            onClick={() => setShowMap(true)}
            style={{ width: '100%', height: '44px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', color: '#888', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
          >
            🗺️ Ver mi ubicación
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        body { margin: 0; }
        .leaflet-container { background: #1a1a1e !important; }
      `}</style>
    </div>
  );
}
