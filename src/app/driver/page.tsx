'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { db, auth } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { 
  Loader2, CheckCircle2, Power, Star, 
  Bike, MapPin, Menu, X, History, BarChart3, Camera, LayoutDashboard 
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  DRIVER_OFFER_STATUSES,
  DRIVER_ACTIVE_STATUSES,
  DRIVER_TRANSITIONS,
  TIMESTAMP_FIELDS,
  STATUS_LABELS,
  STATUS_COLORS,
  type OrderStatus,
} from '@/lib/orderStateMachine';

const LiveMap = dynamic(() => import('@/components/LiveMap'), { ssr: false });

export default function DriverApp() {
  const { user, profile, loading: authLoading } = useAuth();
  
  // -- Core State --
  const [orders, setOrders]               = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [online, setOnline]               = useState(false);
  const [myPos, setMyPos]                 = useState<[number, number] | null>(null);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [showMap, setShowMap]             = useState(false);
  const [earnings, setEarnings]           = useState(0);
  const [historyOrders, setHistoryOrders] = useState<any[]>([]);
  
  // -- UI State --
  const [activeView, setActiveView]       = useState<'dashboard' | 'history' | 'stats'>('dashboard');
  const [sidebarOpen, setSidebarOpen]     = useState(false);
  const [showSplash, setShowSplash]       = useState(true);
  const [isUploading, setIsUploading]     = useState(false);
  
  // -- Offer Logic State --
  const [dismissedOrders, setDismissedOrders] = useState<Set<string>>(new Set());
  const [acceptedIds, setAcceptedIds]         = useState<Set<string>>(new Set());
  const [currentOffer, setCurrentOffer]       = useState<any | null>(null);
  const [offerTimer, setOfferTimer]           = useState(0);

  // -- Auth/Form State --
  const [email, setEmail]                 = useState('');
  const [password, setPassword]           = useState('');
  const [loginError, setLoginError]       = useState('');
  const [loggingIn, setLoggingIn]         = useState(false);

  const watchId = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // 3-second Splash Screen
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  /* ── Real-time Active Orders ── */
  useEffect(() => {
    if (authLoading || !user || profile?.role !== 'driver') return; 

    // Offers: orders ready_for_pickup without an assigned driver
    const allStatuses = [...DRIVER_OFFER_STATUSES, ...DRIVER_ACTIVE_STATUSES, 'delivered', 'completed'] as OrderStatus[];
    const q = query(
      collection(db, 'orders'),
      where('status', 'in', allStatuses)
    );
    return onSnapshot(q, (snap) => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Check if this driver has an active order
      const myActive = all.find((o: any) =>
        o.assignedDriverId === user?.uid &&
        (DRIVER_ACTIVE_STATUSES as string[]).includes(o.status)
      );
      if (myActive) {
        setActiveOrderId(myActive.id);
        setShowMap(true);
      } else {
        setActiveOrderId(prev => {
          if (prev && acceptedIds.has(prev)) return prev;
          return null;
        });
      }

      setOrders(all);
      setOrdersLoading(false);
    }, (err) => {
      console.error('Orders query error:', err.code);
      setOrdersLoading(false);
    });
  }, [user, authLoading, profile?.role, acceptedIds]);

  /* ── Real-time History & Earnings ── */
  useEffect(() => {
    if (authLoading || !user || profile?.role !== 'driver') return; 

    const q = query(
      collection(db, 'orders'),
      where('status', 'in', ['delivered', 'completed']),
      where('assignedDriverId', '==', user?.uid)
    );
    return onSnapshot(q, (snap) => {
      const h = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setHistoryOrders(h.sort((a:any, b:any) => (b.deliveredAt?.seconds || 0) - (a.deliveredAt?.seconds || 0)));
      
      const total = h.reduce((acc, o: any) => acc + (Number(o.total || 0) * 0.15), 0);
      setEarnings(total);
    });
  }, [user, authLoading, profile?.role]);

  /* ── Incoming Offer Logic ── */
  useEffect(() => {
    if (!online || activeOrderId || currentOffer || activeView !== 'dashboard') return;

    // Available offers: ready_for_pickup WITHOUT an assigned driver
    const available = orders.filter((o: any) =>
      (DRIVER_OFFER_STATUSES as string[]).includes(o.status) &&
      !o.assignedDriverId &&
      !dismissedOrders.has(o.id) &&
      !acceptedIds.has(o.id)
    );
    if (available.length > 0) {
      setCurrentOffer(available[0]);
      setOfferTimer(20);
    }
  }, [orders, online, activeOrderId, currentOffer, dismissedOrders, acceptedIds, activeView]);

  useEffect(() => {
    if (!currentOffer || offerTimer <= 0) return;
    const t = setInterval(() => {
      setOfferTimer(prev => {
        if (prev <= 1) {
          handleDismissOffer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [currentOffer, offerTimer]);

  const handleDismissOffer = () => {
    if (currentOffer) {
      setDismissedOrders(prev => new Set(prev).add(currentOffer.id));
      setCurrentOffer(null);
    }
  };

  const handleAcceptOffer = async () => {
    if (currentOffer) {
      const id = currentOffer.id;
      setAcceptedIds(prev => new Set(prev).add(id));
      setActiveOrderId(id); // Block the UI immediately
      setCurrentOffer(null);
      await acceptOrder(id);
    }
  };

  /* ── Actions ── */
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
    try {
      // ── CRITICAL: set driver_assigned (not 'accepted') so Seller Panel KEEPS the order ──
      await updateDoc(doc(db, 'orders', orderId), {
        assignedDriverId: user?.uid,             // new canonical field
        driverId:         user?.uid,             // kept for backward compat
        driverName:       profile?.name || 'Motorizado',
        driverPhone:      profile?.phone || '',
        status:           'driver_assigned',
        driverAssignedAt: serverTimestamp(),
      });
      setActiveOrderId(orderId);
      setShowMap(true);
    } catch (err) { console.error(err); }
  };

  // Generic driver transition helper
  const advanceOrder = async (orderId: string, currentStatus: OrderStatus) => {
    const next = DRIVER_TRANSITIONS[currentStatus];
    if (!next) return;
    const tsField = TIMESTAMP_FIELDS[next];
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: next,
        ...(tsField ? { [tsField]: serverTimestamp() } : {}),
      });
      // When delivered, clear active order
      if (next === 'delivered' || next === 'completed') {
        setActiveOrderId(null);
        setShowMap(false);
      }
    } catch (err) { console.error(err); }
  };

  const pickUpOrder = async (orderId: string) => {
    // Seller must confirm driver_arrived → picked_up first;
    // here driver marks on_the_way after pickup
    await advanceOrder(orderId, 'picked_up');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeOrderId) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'deliveries');

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      const { url } = await res.json();

      await updateDoc(doc(db, 'orders', activeOrderId), {
        status: 'delivered',
        deliveredAt: serverTimestamp(),
        evidenceUrl: url,
      });
      
      setActiveOrderId(null);
      setShowMap(false);
      alert('✅ Entrega confirmada con éxito.');
    } catch (err) {
      console.error(err);
      alert('❌ Error al subir evidencia. Intenta de nuevo.');
    } finally {
      setIsUploading(false);
    }
  };

  const deliverOrder = () => fileInputRef.current?.click();

  // -- Render Logic --
  if (showSplash) return (
    <div style={{ height: '100dvh', background: '#09090b', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <img src="/logo.png" alt="Logo" style={{ height: '72px', objectFit: 'contain' }} />
      </motion.div>
      <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ color: '#FF5722', marginTop: '20px', fontWeight: 900, fontSize: '11px', letterSpacing: '0.25em' }}>REPARTIDORES</motion.p>
    </div>
  );

  if (!user || profile?.role !== 'driver') {
    if (user && profile && profile.role !== 'driver') {
      return (
        <div style={{ minHeight: '100dvh', background: '#09090b', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center' }}>
          <div style={{ maxWidth: '400px', background: '#1a1a1e', padding: '40px 24px', borderRadius: '24px', border: '1px solid #FF5722' }}>
             <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'white' }}>Acceso Restringido</h2>
             <p style={{ color: '#888', margin: '16px 0 24px' }}>Tu cuenta no tiene permisos de repartidor. Contacta al administrador para habilitar tu cuenta.</p>
             <button onClick={() => auth.signOut()} style={{ background: '#333', color: 'white', padding: '14px 24px', borderRadius: '14px', border: 'none', fontWeight: 700 }}>Cerrar Sesión</button>
          </div>
        </div>
      );
    }
    return (
      <div style={{ minHeight: '100dvh', background: '#09090b', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ width: '100%', maxWidth: '400px', background: '#1a1a1e', borderRadius: '32px', padding: '40px 32px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <img src="/logo.png" alt="Logo" style={{ height: '52px', objectFit: 'contain', marginBottom: '16px' }} />
            <p style={{ margin: 0, fontSize: '12px', fontWeight: 800, color: '#FF5722', letterSpacing: '0.12em' }}>PORTAL REPARTIDORES</p>
          </div>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required style={{ background: '#0f0f12', border: '1px solid #222', borderRadius: '16px', padding: '16px', color: 'white', fontSize: '15px' }} />
            <input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} required style={{ background: '#0f0f12', border: '1px solid #222', borderRadius: '16px', padding: '16px', color: 'white', fontSize: '15px' }} />
            {loginError && <p style={{ color: '#ef4444', fontSize: '13px', margin: 0 }}>{loginError}</p>}
            <button type="submit" disabled={loggingIn} style={{ height: '56px', background: '#FF5722', border: 'none', borderRadius: '18px', color: 'white', fontSize: '16px', fontWeight: 900, cursor: 'pointer' }}>{loggingIn ? 'Ingresando...' : 'Iniciar Sesión'}</button>
          </form>
        </div>
      </div>
    );
  }

  const name     = profile?.name?.split(' ')[0] || 'Driver';
  const initial  = name[0]?.toUpperCase();
  const activeOrder = orders.find(o => o.id === activeOrderId);
  
  // Use active order for map, otherwise use current offer if showing it
  const targetMapOrder = activeOrder || currentOffer;
  const customerPos = targetMapOrder?.customerLocation 
    ? [targetMapOrder.customerLocation.lat, targetMapOrder.customerLocation.lng] as [number, number] 
    : undefined;

  return (
    <div style={{ minHeight: '100dvh', background: '#09090b', color: 'white', display: 'flex', flexDirection: 'column' }}>
      
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" capture="environment" style={{ display: 'none' }} />

      {/* ── SIDEBAR ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div key="sidebar-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 4000, backdropFilter: 'blur(4px)' }} />
            <motion.div key="sidebar" initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: '280px', background: '#121214', zIndex: 4001, boxShadow: '10px 0 40px rgba(0,0,0,0.5)', padding: '32px 24px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: '32px' }}>
                <img src="/logo.png" alt="Logo" style={{ height: '36px', objectFit: 'contain', marginBottom: '20px' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '44px', height: '44px', background: '#FF5722', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 900, flexShrink: 0 }}>{initial}</div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 900, fontSize: '15px' }}>Hola, {name}</p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#FF5722', fontWeight: 700 }}>Driver Verificado</p>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                {[
                  { id: 'dashboard', label: 'Escritorio', icon: LayoutDashboard },
                  { id: 'history', label: 'Historial', icon: History },
                  { id: 'stats', label: 'Estadísticas', icon: BarChart3 },
                ].map((item: any) => (
                  <button key={item.id} onClick={() => { setActiveView(item.id); setSidebarOpen(false); }} style={{ background: activeView === item.id ? 'rgba(255,87,34,0.1)' : 'transparent', border: 'none', padding: '16px', borderRadius: '16px', color: activeView === item.id ? '#FF5722' : '#888', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', textAlign: 'left', fontWeight: 700 }}><item.icon size={20} /> {item.label}</button>
                ))}
              </div>
              <button onClick={() => auth.signOut()} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', padding: '16px', borderRadius: '16px', color: '#888', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', fontWeight: 700 }}><Power size={20} /> Salir</button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── HEADER ── */}
      <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', background: '#111' }}>
        <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '4px' }}><Menu size={22} /></button>
        <img src="/logo.png" alt="Logo" style={{ height: '28px', objectFit: 'contain' }} />
        <button
          onClick={toggleOnline}
          style={{
            background: online ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${online ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: '20px', padding: '6px 14px',
            color: online ? '#22c55e' : '#555',
            fontSize: '11px', fontWeight: 900, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}
        >
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: online ? '#22c55e' : '#444', display: 'inline-block', flexShrink: 0, boxShadow: online ? '0 0 6px #22c55e' : 'none' }} />
          {online ? 'EN LÍNEA' : 'OFFLINE'}
        </button>
      </div>

      {activeView === 'dashboard' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <AnimatePresence>
            {online && showMap && (
              <motion.div initial={{ height: 0 }} animate={{ height: 300 }} exit={{ height: 0 }} style={{ overflow: 'hidden', flexShrink: 0 }}>
                {customerPos ? (
                  <LiveMap driverPosition={myPos} customerPosition={customerPos} zoom={15} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: '#1a1a1e', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                    <MapPin size={32} color="#FF5722" />
                    <p style={{ margin: 0, color: '#888', fontSize: '13px', fontWeight: 700, textAlign: 'center', padding: '0 24px' }}>
                      {activeOrder?.address || 'Dirección no disponible'}
                    </p>
                    {activeOrder?.address && (
                      <a 
                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(activeOrder.address)}`}
                        target="_blank" rel="noreferrer"
                        style={{ background: '#FF5722', color: 'white', padding: '8px 20px', borderRadius: '12px', fontSize: '12px', fontWeight: 900, textDecoration: 'none' }}
                      >
                        Abrir en Google Maps
                      </a>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{ padding: '20px', flex: 1 }}>
            <AnimatePresence mode="wait">
              {/* 1. NEW OFFER OVERLAY (Uber Style) */}
              {currentOffer && (
                <motion.div
                  key={`offer-${currentOffer.id}`}
                  initial={{ opacity: 0, y: '100%' }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: '100%' }}
                  style={{
                    position: 'fixed', inset: 0, zIndex: 3000,
                    background: '#f8f9fa',
                    display: 'flex', flexDirection: 'column',
                  }}
                >
                  {/* Top Map Section */}
                  <div style={{ height: '40%', position: 'relative' }}>
                    <LiveMap driverPosition={myPos} customerPosition={customerPos} zoom={14} />
                    {/* Labels on map - fixed pins style */}
                    <div style={{ position: 'absolute', top: '20px', left: '20px', background: '#dc3545', color: 'white', padding: '4px 12px', borderRadius: '8px', fontSize: '14px', fontWeight: 900, boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>Recoger</div>
                    <div style={{ position: 'absolute', bottom: '20px', right: '20px', background: '#28a745', color: 'white', padding: '4px 12px', borderRadius: '8px', fontSize: '14px', fontWeight: 900, boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>Entregar</div>
                  </div>

                  {/* Offer Card */}
                  <div style={{ flex: 1, background: 'white', borderTopLeftRadius: '32px', borderTopRightRadius: '32px', marginTop: '-32px', position: 'relative', padding: '24px', display: 'flex', flexDirection: 'column', boxShadow: '0 -10px 40px rgba(0,0,0,0.1)' }}>
                    {/* Timer Pill */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                      <div style={{ background: '#ffc107', borderRadius: '24px', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 900, color: '#212529', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                        <div style={{ animation: 'pulse 1s infinite' }}>⏱️ 00:{offerTimer < 10 ? `0${offerTimer}` : offerTimer}</div>
                        <span>Responder</span>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderBottom: '1px solid #f0f0f0', paddingBottom: '20px', marginBottom: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '18px', fontWeight: 700, color: '#333' }}>
                        <div style={{ width: '32px', height: '32px', background: '#f8f9fa', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>💰</div>
                        <span>Ganar: <strong style={{ fontSize: '20px', marginLeft: '4px' }}>${(Number(currentOffer.total || 0) * 0.15).toFixed(2)}</strong></span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '16px', fontWeight: 600, color: '#666' }}>
                        <div style={{ width: '32px', height: '32px', background: '#f8f9fa', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📍</div>
                        <span>Distancia: <strong>4.8 km</strong></span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '16px', fontWeight: 600, color: '#666' }}>
                        <div style={{ width: '32px', height: '32px', background: '#f8f9fa', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🕒</div>
                        <span>Tiempo Estimado: <strong>12 min</strong></span>
                      </div>
                    </div>

                    {/* Items Section */}
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: '0 0 12px', fontWeight: 900, color: '#333', fontSize: '16px' }}>Pedido:</p>
                      <div style={{ background: '#f8f9fa', borderRadius: '16px', padding: '16px' }}>
                        {currentOffer.items?.map((it: any, k: number) => (
                          <p key={k} style={{ margin: k > 0 ? '8px 0 0' : 0, fontSize: '15px', color: '#444', fontWeight: 700 }}>
                            • <strong>{it.quantity}x</strong> {it.name}
                          </p>
                        ))}
                        {!currentOffer.items && <p style={{ color: '#888' }}>Detalles del pedido...</p>}
                      </div>
                    </div>

                    {/* Buttons Section */}
                    <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
                      <button
                        onClick={handleDismissOffer}
                        style={{
                          flex: 1, padding: '20px', borderRadius: '20px',
                          background: 'linear-gradient(180deg, #dc3545 0%, #c82333 100%)',
                          color: 'white', border: 'none', fontWeight: 900, fontSize: '18px',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                          boxShadow: '0 8px 0 #bd2130, 0 10px 20px rgba(0,0,0,0.2)'
                        }}
                      >
                        <X size={24} strokeWidth={4} /> Rechazar
                      </button>
                      <button
                        onClick={handleAcceptOffer}
                        style={{
                          flex: 1, padding: '20px', borderRadius: '20px',
                          background: 'linear-gradient(180deg, #28a745 0%, #218838 100%)',
                          color: 'white', border: 'none', fontWeight: 900, fontSize: '18px',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                          boxShadow: '0 8px 0 #1e7e34, 0 10px 20px rgba(0,0,0,0.2)'
                        }}
                      >
                        <CheckCircle2 size={24} strokeWidth={4} /> Aceptar
                      </button>
                    </div>
                  </div>

                  <style>{`
                    @keyframes pulse {
                      0% { transform: scale(1); }
                      50% { transform: scale(1.05); }
                      100% { transform: scale(1); }
                    }
                  `}</style>
                </motion.div>
              )}

              {/* 2. ACTIVE DELIVERY VIEW */}
              {activeOrderId && activeOrder && (
                <motion.div
                  key={`active-order-${activeOrder.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ background: '#1a1a1e', border: `2px solid ${STATUS_COLORS[activeOrder.status as OrderStatus] || '#FF5722'}`, borderRadius: '32px', padding: '24px' }}
                >
                  {/* Status badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <span style={{ background: STATUS_COLORS[activeOrder.status as OrderStatus] || '#FF5722', color: 'white', padding: '4px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 900 }}>
                      {STATUS_LABELS[activeOrder.status as OrderStatus]?.toUpperCase() || activeOrder.status?.toUpperCase()}
                    </span>
                    <span style={{ fontWeight: 900 }}>${(Number(activeOrder.total || 0) * 0.15).toFixed(2)}</span>
                  </div>
                  <h3 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 900 }}>{activeOrder.restaurantName}</h3>
                  <p style={{ margin: '0 0 24px', color: '#888', fontSize: '14px' }}>{activeOrder.address}</p>

                  {/* ── STATE MACHINE action buttons ── */}
                  {activeOrder.status === 'driver_assigned' && (
                    <button
                      onClick={() => advanceOrder(activeOrder.id, 'driver_assigned')}
                      style={{ width: '100%', padding: '20px', background: '#06B6D4', borderRadius: '20px', border: 'none', color: 'white', fontWeight: 900, fontSize: '16px', marginBottom: '12px' }}
                    >
                      Llegue al local
                    </button>
                  )}

                  {activeOrder.status === 'driver_arrived' && (
                    <div style={{ padding: '16px', background: 'rgba(6,182,212,0.1)', borderRadius: '16px', marginBottom: '12px', textAlign: 'center' }}>
                      <p style={{ margin: 0, color: '#06B6D4', fontWeight: 800, fontSize: '14px' }}>Esperando que el restaurante confirme la entrega...</p>
                      <p style={{ margin: '8px 0 0', color: '#555', fontSize: '12px' }}>El restaurante debe presionar &ldquo;Entregar al driver&rdquo;</p>
                    </div>
                  )}

                  {activeOrder.status === 'picked_up' && (
                    <button
                      onClick={() => advanceOrder(activeOrder.id, 'picked_up')}
                      style={{ width: '100%', padding: '20px', background: '#8B5CF6', borderRadius: '20px', border: 'none', color: 'white', fontWeight: 900, fontSize: '16px', marginBottom: '12px' }}
                    >
                      Iniciar navegación al cliente
                    </button>
                  )}

                  {activeOrder.status === 'on_the_way' && (
                    <button
                      onClick={deliverOrder}
                      disabled={isUploading}
                      style={{ width: '100%', padding: '20px', background: '#22c55e', borderRadius: '20px', border: 'none', color: 'white', fontWeight: 900, fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}
                    >
                      {isUploading ? <Loader2 className="animate-spin" /> : <Camera />} Confirmar entrega con foto
                    </button>
                  )}
                </motion.div>
              )}

              {online && !activeOrderId && !currentOffer && (
                <div style={{ textAlign: 'center', padding: '60px 20px', opacity: 0.5 }}><div style={{ width: '80px', height: '80px', margin: '0 auto 24px', borderRadius: '50%', border: '4px solid #22c55e', borderTopColor: 'transparent', animation: 'spin 2s linear infinite' }} /><h3 style={{ fontWeight: 900 }}>Buscando pedidos...</h3></div>
              )}
              {!online && (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}><p style={{ fontSize: '64px', margin: '0 0 20px' }}>💤</p><h3 style={{ fontWeight: 900 }}>Estás desconectado</h3><p style={{ color: '#555' }}>Conéctate para recibir pedidos</p></div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {activeView === 'history' && (
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
           <h2 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '24px' }}>Historial</h2>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
             {historyOrders.map((h, i) => (
               <div key={i} style={{ background: '#1a1a1e', padding: '20px', borderRadius: '24px', border: '1px solid #222' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}><p style={{ margin: 0, fontWeight: 800 }}>{h.restaurantName}</p><p style={{ margin: 0, color: '#22c55e', fontWeight: 900 }}>+${(Number(h.total || 0) * 0.15).toFixed(2)}</p></div>
                 <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#555' }}>{h.deliveredAt?.toDate?.().toLocaleString() || 'Reciente'}</p>
               </div>
             ))}
           </div>
        </div>
      )}

      {activeView === 'stats' && (
        <div style={{ flex: 1, padding: '24px' }}>
           <h2 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '24px' }}>Ganancias</h2>
           <div style={{ background: '#FF5722', padding: '32px', borderRadius: '32px', marginBottom: '24px' }}><p style={{ margin: 0, fontSize: '14px', fontWeight: 700, opacity: 0.8 }}>TOTAL GENERADO</p><p style={{ margin: '8px 0 0', fontSize: '48px', fontWeight: 900 }}>${earnings.toFixed(2)}</p></div>
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}><div style={{ background: '#1a1a1e', padding: '24px', borderRadius: '24px', textAlign: 'center' }}><p style={{ margin: 0, fontSize: '24px', fontWeight: 900 }}>{historyOrders.length}</p><p style={{ margin: 0, fontSize: '11px', color: '#555' }}>ENTREGAS</p></div><div style={{ background: '#1a1a1e', padding: '24px', borderRadius: '24px', textAlign: 'center' }}><p style={{ margin: 0, fontSize: '24px', fontWeight: 900 }}>4.9</p><p style={{ margin: 0, fontSize: '11px', color: '#555' }}>RATING</p></div></div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        body { margin: 0; overflow: hidden; background: #09090b; }
      `}</style>
    </div>
  );
}
