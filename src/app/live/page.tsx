'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, X, Clock, ChefHat, CheckCircle2, Bike,
  AlertTriangle, Search, Package, 
  User, MapPin, Phone, Store, Lock, Eye, EyeOff,
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { useAuth } from '@/lib/AuthContext';

const LIVE_PIN = '1619';

/* ── Notification sound (Web Audio API — no files needed) ────────── */
function playOrderSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    // Three rising tones: ding-ding-DING
    [[660, 0], [880, 0.18], [1100, 0.36]].forEach(([freq, delay]) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + delay + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.5);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.5);
    });
  } catch {}
}

function playCancelAlertSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    // Urgent siren-like alternating tones
    ([[800, 0], [600, 0.2], [800, 0.4], [600, 0.6], [800, 0.8], [600, 1.0]] as [number, number][]).forEach(([freq, delay]) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      gain.gain.setValueAtTime(0, ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + delay + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.2);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.2);
    });
  } catch {}
}

/* ── Palette ───────────────────────────────────────────────────────── */
const BG    = '#07080A';
const SURF  = '#0F1014';
const BORD  = '#1A1D24';
const TEXT  = '#F0F1F3';
const SUB   = '#5A6070';
const MUTED = '#1E2128';

const STATUS: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  created:          { label: 'Nuevo',      color: '#F59E0B', bg: '#F59E0B18', icon: <Package size={14}/> },
  accepted:         { label: 'Aceptado',   color: '#3B82F6', bg: '#3B82F618', icon: <CheckCircle2 size={14}/> },
  preparing:        { label: 'Cocina',     color: '#FF6A00', bg: '#FF6A0018', icon: <ChefHat size={14}/> },
  ready_for_pickup: { label: 'Listo',      color: '#22C55E', bg: '#22C55E18', icon: <CheckCircle2 size={14}/> },
  driver_assigned:  { label: 'Driver',     color: '#8B5CF6', bg: '#8B5CF618', icon: <Bike size={14}/> },
  driver_arrived:   { label: 'En local',   color: '#8B5CF6', bg: '#8B5CF618', icon: <Bike size={14}/> },
  picked_up:        { label: 'Retirado',   color: '#8B5CF6', bg: '#8B5CF618', icon: <Bike size={14}/> },
  on_the_way:       { label: 'En Camino',  color: '#8B5CF6', bg: '#8B5CF618', icon: <Bike size={14}/> },
  delivered:        { label: 'Entregado',  color: '#10B981', bg: '#10B98118', icon: <CheckCircle2 size={14}/> },
  completed:        { label: 'Completado', color: '#10B981', bg: '#10B98118', icon: <CheckCircle2 size={14}/> },
  cancelled:        { label: 'Cancelado',  color: '#EF4444', bg: '#EF444418', icon: <X size={14}/> },
  // legacy fallbacks
  paid:             { label: 'Nuevo',      color: '#F59E0B', bg: '#F59E0B18', icon: <Package size={14}/> },
  cooking:          { label: 'Cocina',     color: '#FF6A00', bg: '#FF6A0018', icon: <ChefHat size={14}/> },
  ready:            { label: 'Listo',      color: '#22C55E', bg: '#22C55E18', icon: <CheckCircle2 size={14}/> },
  dispatched:       { label: 'En Camino',  color: '#8B5CF6', bg: '#8B5CF618', icon: <Bike size={14}/> },
};

function statusInfo(s: string) {
  return STATUS[s] || { label: s, color: '#5A6070', bg: '#5A607018', icon: <Activity size={14}/> };
}

function Chip({ status }: { status: string }) {
  const s = statusInfo(status);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      background: s.bg, color: s.color,
      padding: '4px 10px', borderRadius: '99px',
      fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em',
      whiteSpace: 'nowrap',
    }}>
      {s.icon} {s.label}
    </span>
  );
}

function timeAgo(seconds: number) {
  const diff = Math.floor(Date.now() / 1000 - seconds);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  return `${Math.floor(diff / 3600)}h`;
}

/* ── Order Detail Modal ────────────────────────────────────────────── */
const CANCEL_PIN = '2014';

function OrderModal({ order, onClose, onCancelled }: { order: any; onClose: () => void; onCancelled: () => void }) {
  const hasIssue   = !!order.issue;
  const isCancelled = order.status === 'cancelled';
  const [showCancel, setShowCancel] = useState(false);
  const [cPin, setCPin]     = useState('');
  const [cErr, setCErr]     = useState(false);
  const [shake, setShake]   = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const confirmCancel = async () => {
    if (cPin !== CANCEL_PIN) {
      setCErr(true); setCPin('');
      setShake(true); setTimeout(() => setShake(false), 500);
      setTimeout(() => setCErr(false), 2000);
      return;
    }
    setCancelling(true);
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'orders', order.id), { status: 'cancelled', cancelledAt: new Date() });
      onCancelled();
      onClose();
    } catch (e) { console.error(e); }
    setCancelling(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
        style={{ background: SURF, border: `1px solid ${hasIssue ? '#EF4444' : BORD}`, borderRadius: '24px', width: '100%', maxWidth: '480px', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${BORD}`, display: 'flex', alignItems: 'center', gap: '12px', background: hasIssue ? '#EF444410' : 'transparent' }}>
          {hasIssue && <AlertTriangle size={20} color="#EF4444" />}
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontWeight: 900, fontSize: '16px', color: TEXT }}>
              Orden #{order.id.slice(0,6).toUpperCase()}
            </p>
            <p style={{ margin: 0, fontSize: '11px', color: SUB }}>
              {order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000).toLocaleString('es-EC') : '—'}
            </p>
          </div>
          <Chip status={order.status || 'paid'} />
          <button onClick={onClose} style={{ background: MUTED, border: 'none', width: '36px', height: '36px', borderRadius: '10px', color: SUB, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={18} />
          </button>
        </div>

        {/* Cancel Request Banner */}
        {order.cancelRequest?.status === 'pending' && (
          <div style={{ background: '#EF4444', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <AlertTriangle size={18} color="white" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <p style={{ margin: 0, fontSize: '14px', color: 'white', fontWeight: 900, lineHeight: 1.2 }}>Solicitud de Cancelación</p>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>Motivo: {order.cancelRequest.reason}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button
                onClick={async () => {
                  try {
                    const { doc, updateDoc } = await import('firebase/firestore');
                    await updateDoc(doc(db, 'orders', order.id), { status: 'cancelled', cancelledAt: new Date(), 'cancelRequest.status': 'approved' });
                    onCancelled();
                    onClose();
                  } catch (e) { console.error(e); }
                }}
                style={{ flex: 1, padding: '10px', background: 'white', color: '#EF4444', border: 'none', borderRadius: '10px', fontWeight: 900, fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              >
                Aprobar Cancelación
              </button>
              <button
                onClick={async () => {
                  try {
                    const { doc, updateDoc } = await import('firebase/firestore');
                    await updateDoc(doc(db, 'orders', order.id), { 'cancelRequest.status': 'rejected' });
                  } catch (e) { console.error(e); }
                }}
                style={{ flex: 1, padding: '10px', background: 'rgba(0,0,0,0.2)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}
              >
                Rechazar
              </button>
            </div>
          </div>
        )}

        {/* Issue banner */}
        {hasIssue && (
          <div style={{ background: '#EF444418', borderBottom: `1px solid #EF444430`, padding: '12px 24px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <AlertTriangle size={16} color="#EF4444" style={{ flexShrink: 0, marginTop: '1px' }} />
            <p style={{ margin: 0, fontSize: '13px', color: '#EF4444', fontWeight: 700, lineHeight: 1.4 }}>{order.issue}</p>
          </div>
        )}

        {/* Body */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            { icon: <Store size={15}/>, label: 'Restaurante', value: order.restaurantName || '—' },
            { icon: <User size={15}/>, label: 'Cliente', value: order.customerName || '—' },
            { icon: <Phone size={15}/>, label: 'Teléfono', value: order.phone || '—' },
            { icon: <MapPin size={15}/>, label: 'Dirección', value: order.address || '—' },
            { icon: <Bike size={15}/>, label: 'Driver', value: order.driverName || 'Sin asignar' },
          ].map((row, i) => (
            <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ width: '32px', height: '32px', background: MUTED, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: SUB, flexShrink: 0 }}>{row.icon}</div>
              <div>
                <p style={{ margin: 0, fontSize: '10px', color: SUB, fontWeight: 700, textTransform: 'uppercase' }}>{row.label}</p>
                <p style={{ margin: 0, fontSize: '14px', color: TEXT, fontWeight: 700, lineHeight: 1.4 }}>{row.value}</p>
              </div>
            </div>
          ))}

          {/* Items */}
          <div style={{ background: MUTED, borderRadius: '14px', padding: '16px' }}>
            <p style={{ margin: '0 0 12px', fontSize: '11px', color: SUB, fontWeight: 700, textTransform: 'uppercase' }}>Items del Pedido</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(order.items || []).map((item: any, i: number) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FF6A00', flexShrink: 0 }} />
                    <span style={{ fontSize: '13px', color: TEXT, fontWeight: 600 }}>{item.quantity || 1}× {item.name}</span>
                  </div>
                  <span style={{ fontSize: '13px', color: '#FF6A00', fontWeight: 800 }}>${(item.price * (item.quantity || 1)).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 4px' }}>
            <div>
              <p style={{ margin: 0, fontSize: '11px', color: SUB }}>Subtotal</p>
              <p style={{ margin: 0, fontWeight: 900, color: TEXT, fontSize: '18px' }}>${(Number(order.subtotal) || 0).toFixed(2)}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '11px', color: SUB }}>Envío</p>
              <p style={{ margin: 0, fontWeight: 900, color: '#8B5CF6', fontSize: '18px' }}>${(Number(order.deliveryFee) || 0).toFixed(2)}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '11px', color: SUB }}>TOTAL</p>
              <p style={{ margin: 0, fontWeight: 900, color: '#22C55E', fontSize: '22px' }}>${(Number(order.total) || 0).toFixed(2)}</p>
            </div>
          </div>

          {/* ── CANCEL SECTION ── */}
          {!isCancelled && !showCancel && (
            <button
              onClick={() => setShowCancel(true)}
              style={{ width: '100%', padding: '12px', background: '#EF444412', border: '1px solid #EF444430', borderRadius: '14px', color: '#EF4444', fontWeight: 800, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <X size={16} /> Cancelar este Pedido
            </button>
          )}

          {/* PIN CONFIRM PANEL */}
          <AnimatePresence>
            {showCancel && !isCancelled && (
              <motion.div
                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <motion.div
                  animate={shake ? { x: [-8, 8, -6, 6, -4, 4, 0] } : {}}
                  transition={{ duration: 0.4 }}
                  style={{ background: '#EF444412', border: `1px solid ${cErr ? '#EF4444' : '#EF444430'}`, borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={16} color="#EF4444" />
                    <p style={{ margin: 0, fontSize: '13px', color: '#EF4444', fontWeight: 800 }}>Confirmar cancelación</p>
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', color: SUB, lineHeight: 1.5 }}>
                    Esta acción no se puede deshacer. Ingresa el PIN de autorización para cancelar el pedido.
                  </p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="password"
                      value={cPin}
                      onChange={e => setCPin(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && confirmCancel()}
                      placeholder="PIN de autorización"
                      autoFocus
                      maxLength={6}
                      style={{ flex: 1, padding: '10px 14px', background: MUTED, border: `1px solid ${cErr ? '#EF4444' : BORD}`, borderRadius: '10px', color: TEXT, fontSize: '15px', fontWeight: 700, outline: 'none', letterSpacing: '0.25em' }}
                    />
                    <button
                      onClick={confirmCancel}
                      disabled={cancelling || cPin.length === 0}
                      style={{ padding: '10px 18px', background: '#EF4444', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 800, fontSize: '13px', cursor: 'pointer', opacity: cancelling ? 0.7 : 1 }}
                    >
                      {cancelling ? '...' : 'Confirmar'}
                    </button>
                    <button
                      onClick={() => { setShowCancel(false); setCPin(''); setCErr(false); }}
                      style={{ padding: '10px 14px', background: MUTED, border: 'none', borderRadius: '10px', color: SUB, fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
                    >
                      Volver
                    </button>
                  </div>
                  {cErr && <p style={{ margin: 0, fontSize: '11px', color: '#EF4444', fontWeight: 700 }}>PIN incorrecto. Inténtalo de nuevo.</p>}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}


/* ── Main Live Page ───────────────────────────────────────────────── */
export default function LivePage() {
  const { user } = useAuth();
  const [pin, setPin]         = useState('');
  const [pinOk, setPinOk]     = useState(false);
  const [pinErr, setPinErr]   = useState(false);
  const [showPin, setShowPin] = useState(false);

  const [orders, setOrders]   = useState<any[]>([]);
  const [filter, setFilter]   = useState('all');
  const [filterRest, setFilterRest] = useState('all');
  const [filterDriver, setFilterDriver] = useState('all');
  const [search, setSearch]   = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [pulse, setPulse]     = useState(false);
  const [newIds, setNewIds]   = useState<Set<string>>(new Set());
  const prevIdsRef            = useRef<Set<string>>(new Set());
  const prevCancelIdsRef      = useRef<Set<string>>(new Set());
  const [tick, setTick]       = useState(0);

  const [newCount, setNewCount]   = useState(0);   // for toast
  const [showToast, setShowToast] = useState<'new' | 'cancel' | null>(null);

  const authed = user && pinOk;

  // PIN submit
  const submitPin = () => {
    if (pin === LIVE_PIN) { setPinOk(true); setPinErr(false); }
    else { setPinErr(true); setPin(''); setTimeout(() => setPinErr(false), 2000); }
  };

  // Live clock tick
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  // Real-time Firestore — only subscribe when authed
  useEffect(() => {
    if (!authed) return;
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(200));
    const unsub = onSnapshot(q, snap => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Detect new orders over network
      const currentIds = new Set(docs.map((d: any) => d.id));
      const fresh = new Set<string>();
      currentIds.forEach(id => {
        if (!prevIdsRef.current.has(id as string)) fresh.add(id as string);
      });

      // Detect new cancel requests
      const currentCancels = new Set(docs.filter((d: any) => d.cancelRequest?.status === 'pending').map((d: any) => d.id));
      const freshCancels = new Set<string>();
      currentCancels.forEach(id => {
        if (!prevCancelIdsRef.current.has(id as string)) freshCancels.add(id as string);
      });

      if (fresh.size > 0 && prevIdsRef.current.size > 0) {
        // 🔔 Sound + toast
        playOrderSound();
        setNewIds(fresh);
        setNewCount(fresh.size);
        setShowToast('new');
        setPulse(true);
        setTimeout(() => setPulse(false), 2000);
        setTimeout(() => setNewIds(new Set()), 5000);
        setTimeout(() => setShowToast(null), 5000);  // toast auto-dismiss
      }

      if (freshCancels.size > 0 && prevIdsRef.current.size > 0) {
        // 🚨 Cancel Alert Sound
        playCancelAlertSound();
        setShowToast('cancel');
        setTimeout(() => setShowToast(null), 8000);
      }

      prevIdsRef.current = currentIds as Set<string>;
      prevCancelIdsRef.current = currentCancels as Set<string>;
      setOrders(docs);
    });
    return () => unsub();
  }, [authed]);

  /* ── PIN / Login gate ── */
  if (!user) {
    return (
      <div style={{ minHeight: '100dvh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ background: SURF, border: `1px solid ${BORD}`, borderRadius: '24px', padding: '40px', textAlign: 'center', maxWidth: '360px', width: '100%' }}>
          <div style={{ width: '56px', height: '56px', background: '#FF6A0018', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#FF6A00' }}>
            <Activity size={28} />
          </div>
          <p style={{ margin: '0 0 6px', fontWeight: 900, fontSize: '20px', color: TEXT }}>Centro LIVE</p>
          <p style={{ margin: '0 0 24px', color: SUB, fontSize: '13px' }}>Debes iniciar sesión para acceder.</p>
          <a href="/login" style={{ display: 'block', padding: '14px', background: '#FF6A00', color: 'white', borderRadius: '14px', fontWeight: 800, textDecoration: 'none', fontSize: '14px' }}>
            Iniciar Sesión
          </a>
        </div>
      </div>
    );
  }

  if (!pinOk) {
    return (
      <div style={{ minHeight: '100dvh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', padding: '20px' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: SURF, border: `1px solid ${pinErr ? '#EF4444' : BORD}`, borderRadius: '24px', padding: '40px', textAlign: 'center', maxWidth: '360px', width: '100%', transition: 'border-color 0.2s' }}>
          <div style={{ width: '56px', height: '56px', background: '#FF6A0018', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#FF6A00' }}>
            <Lock size={26} />
          </div>
          <p style={{ margin: '0 0 4px', fontWeight: 900, fontSize: '20px', color: TEXT }}>Centro LIVE</p>
          <p style={{ margin: '0 0 24px', color: SUB, fontSize: '13px' }}>Panel de operaciones en tiempo real</p>

          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <input
              type={showPin ? 'text' : 'password'}
              value={pin}
              onChange={e => setPin(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitPin()}
              placeholder="Ingresa el PIN de acceso"
              autoFocus
              style={{ width: '100%', padding: '14px 44px 14px 16px', background: MUTED, border: `1px solid ${pinErr ? '#EF4444' : BORD}`, borderRadius: '14px', color: TEXT, fontSize: '15px', fontWeight: 700, outline: 'none', letterSpacing: showPin ? 'normal' : '0.2em' }}
            />
            <button onClick={() => setShowPin(!showPin)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: SUB, cursor: 'pointer', padding: 0 }}>
              {showPin ? <EyeOff size={18}/> : <Eye size={18}/>}
            </button>
          </div>

          {pinErr && <p style={{ color: '#EF4444', fontSize: '12px', fontWeight: 700, marginBottom: '12px' }}>PIN incorrecto</p>}

          <button onClick={submitPin} style={{ width: '100%', padding: '14px', background: '#FF6A00', color: 'white', border: 'none', borderRadius: '14px', fontWeight: 800, fontSize: '14px', cursor: 'pointer' }}>
            Acceder al LIVE
          </button>
        </motion.div>
      </div>
    );
  }


  const filtered = orders.filter(o => {
    // Normalization mapping
    const legacyStatus = o.status || 'paid';
    const oStatus = (
        legacyStatus === 'paid' ? 'created' :
        legacyStatus === 'new' ? 'created' :
        legacyStatus === 'cooking' ? 'preparing' :
        legacyStatus === 'ready' ? 'ready_for_pickup' :
        legacyStatus === 'dispatched' ? 'on_the_way' :
        legacyStatus
    );

    const matchStatus = filter === 'all' || 
      (filter === 'created' && (oStatus === 'created' || oStatus === 'accepted')) ||
      (filter === 'preparing' && oStatus === 'preparing') ||
      (filter === 'ready' && oStatus === 'ready_for_pickup') ||
      (filter === 'on_the_way' && ['driver_assigned','driver_arrived','picked_up','on_the_way'].includes(oStatus)) ||
      (filter === 'delivered' && ['delivered','completed'].includes(oStatus)) ||
      (filter === 'cancelled' && oStatus === 'cancelled');

    const matchRest = filterRest === 'all' || o.restaurantName === filterRest;
    const matchDriver = filterDriver === 'all' || o.driverName === filterDriver;

    const matchSearch = !search || 
      o.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      o.restaurantName?.toLowerCase().includes(search.toLowerCase()) ||
      o.driverName?.toLowerCase().includes(search.toLowerCase()) ||
      o.id.slice(0,6).toLowerCase().includes(search.toLowerCase());

    return matchStatus && matchRest && matchDriver && matchSearch;
  });

  const getMappedStatus = (raw: string) => {
    const s = raw || 'paid';
    if (s === 'paid' || s === 'new' || s === 'accepted') return 'created';
    if (s === 'cooking') return 'preparing';
    if (s === 'ready_for_pickup') return 'ready';
    if (['driver_assigned','driver_arrived','picked_up','on_the_way','dispatched'].includes(s)) return 'on_the_way';
    if (s === 'completed') return 'delivered';
    return s;
  };

  const counts: Record<string, number> = { all: orders.length };
  orders.forEach(o => {
    const s = getMappedStatus(o.status);
    counts[s] = (counts[s] || 0) + 1;
  });
  const issues = orders.filter(o => !!o.issue).length;

  const FILTERS = [
    { id: 'all',       label: 'Todos' },
    { id: 'created',   label: 'Nuevos' },
    { id: 'preparing', label: 'Cocina' },
    { id: 'ready',     label: 'Listos' },
    { id: 'on_the_way',label: 'En Camino' },
    { id: 'delivered', label: 'Entregados' },
    { id: 'cancelled', label: 'Cancelados' },
  ];

  const restaurants = Array.from(new Set(orders.map(o => o.restaurantName).filter(Boolean))).sort() as string[];
  const drivers = Array.from(new Set(orders.map(o => o.driverName).filter(Boolean))).sort() as string[];

  return (
    <div style={{ minHeight: '100dvh', background: BG, fontFamily: 'Inter, -apple-system, sans-serif', color: TEXT }}>

      {/* ── Top bar ── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 100, background: `${BG}E8`, backdropFilter: 'blur(20px)', borderBottom: `1px solid ${BORD}`, padding: '0 32px' }}>
        <div style={{ maxWidth: '1600px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '20px', height: '60px' }}>

          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <motion.div
              animate={{ scale: pulse ? [1, 1.3, 1] : 1, opacity: pulse ? [1, 0.5, 1] : 1 }}
              transition={{ duration: 0.6 }}
              style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 12px #22C55E' }}
            />
            <span style={{ fontWeight: 900, fontSize: '15px', letterSpacing: '-0.3px' }}>LIVE</span>
            <span style={{ fontSize: '11px', color: SUB, fontWeight: 700 }}>· Operaciones en tiempo real</span>
          </div>

          {/* Status pills */}
          <div style={{ display: 'flex', gap: '8px', flex: 1, overflowX: 'auto', padding: '2px 0' }}>
            {FILTERS.map(f => {
              const count = f.id === 'all' ? orders.length : (counts[f.id] || 0);
              const s = statusInfo(f.id === 'all' ? 'paid' : f.id);
              const isActive = filter === f.id;
              return (
                <button key={f.id} onClick={() => setFilter(f.id)} style={{
                  flexShrink: 0, padding: '5px 12px', borderRadius: '99px',
                  background: isActive ? (f.id === 'all' ? '#FF6A0020' : s.bg) : 'transparent',
                  border: `1px solid ${isActive ? (f.id === 'all' ? '#FF6A0040' : s.color + '40') : BORD}`,
                  color: isActive ? (f.id === 'all' ? '#FF6A00' : s.color) : SUB,
                  fontSize: '12px', fontWeight: 800, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}>
                  {f.label}
                  {count > 0 && <span style={{ background: isActive ? (f.id==='all'?'#FF6A00':s.color)+'30' : MUTED, padding: '1px 6px', borderRadius: '99px', fontSize: '10px', fontWeight: 900 }}>{count}</span>}
                </button>
              );
            })}
          </div>

          {/* Issues warning */}
          {issues > 0 && (
            <motion.div animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#EF444418', border: '1px solid #EF444430', padding: '5px 12px', borderRadius: '99px', flexShrink: 0 }}>
              <AlertTriangle size={13} color="#EF4444" />
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#EF4444' }}>{issues} problema{issues > 1 ? 's' : ''}</span>
            </motion.div>
          )}

          {/* Filters: Restaurant & Driver */}
          <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
            <select
              value={filterRest}
              onChange={e => setFilterRest(e.target.value)}
              style={{ background: MUTED, border: `1px solid ${BORD}`, borderRadius: '10px', padding: '6px 10px', color: TEXT, fontSize: '12px', fontWeight: 600, outline: 'none', cursor: 'pointer' }}
            >
              <option value="all">Todas las marcas</option>
              {restaurants.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <select
              value={filterDriver}
              onChange={e => setFilterDriver(e.target.value)}
              style={{ background: MUTED, border: `1px solid ${BORD}`, borderRadius: '10px', padding: '6px 10px', color: TEXT, fontSize: '12px', fontWeight: 600, outline: 'none', cursor: 'pointer' }}
            >
              <option value="all">Todos los drivers</option>
              {drivers.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <Search size={14} color={SUB} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar (ej. Juan)..."
              style={{ background: MUTED, border: `1px solid ${BORD}`, borderRadius: '10px', padding: '7px 12px 7px 30px', color: TEXT, fontSize: '12px', fontWeight: 600, outline: 'none', width: '150px' }}
            />
          </div>
        </div>
      </header>

      {/* ── NEW ORDER TOAST ── */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            style={{
              position: 'fixed', top: '72px', left: '50%', transform: 'translateX(-50%)',
              zIndex: 9999,
              background: showToast === 'cancel' 
                ? 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)'
                : 'linear-gradient(135deg, #FF6A00 0%, #F59E0B 100%)',
              borderRadius: '99px',
              padding: '14px 28px',
              display: 'flex', alignItems: 'center', gap: '12px',
              boxShadow: showToast === 'cancel'
                ? '0 8px 40px rgba(239,68,68,0.5), 0 0 0 2px rgba(239,68,68,0.3)'
                : '0 8px 40px rgba(255,106,0,0.5), 0 0 0 2px rgba(255,106,0,0.3)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
            onClick={() => { setShowToast(null); setFilter('all'); }}
          >
            <motion.div
              animate={{ scale: [1, 1.3, 1], rotate: [0, -15, 15, 0] }}
              transition={{ repeat: 2, duration: 0.4 }}
              style={{ fontSize: '20px' }}
            >
              {showToast === 'cancel' ? '🚨' : '🔔'}
            </motion.div>
            <div>
              <p style={{ margin: 0, fontWeight: 900, fontSize: '15px', color: 'white', lineHeight: 1 }}>
                {showToast === 'cancel' 
                  ? 'SOLICITUD DE CANCELACIÓN' 
                  : (newCount > 1 ? `${newCount} NUEVOS PEDIDOS` : '¡NUEVO PEDIDO!')}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
                Toca para ver
              </p>
            </div>
            <button onClick={e => { e.stopPropagation(); setShowToast(null); }}
              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Grid ── */}
      <main style={{ maxWidth: '1600px', margin: '0 auto', padding: '24px 32px' }}>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: SUB }}>
            <Activity size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
            <p style={{ margin: 0, fontWeight: 700, fontSize: '16px' }}>Sin pedidos activos</p>
            <p style={{ margin: '6px 0 0', fontSize: '13px' }}>Esperando en tiempo real...</p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px' }}>
          <AnimatePresence>
            {filtered.map(order => {
              const s       = statusInfo(order.status || 'paid');
              const hasIssue = !!order.issue;
              const hasCancelReq = order.cancelRequest?.status === 'pending';
              const isNew   = newIds.has(order.id);
              const elapsed = order.createdAt?.seconds ? timeAgo(order.createdAt.seconds) : '—';
              const isActive = order.status === 'paid' || order.status === 'cooking' || order.status === 'ready' || !order.status;

              return (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9, y: -10 }}
                  animate={{
                    opacity: 1, scale: 1, y: 0,
                    boxShadow: isNew ? [`0 0 0 2px ${s.color}`, `0 0 20px ${s.color}60`, `0 0 0 2px ${s.color}00`] : 'none',
                  }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.25 }}
                  onClick={() => setSelected(order)}
                  style={{
                    background: SURF,
                    border: `1px solid ${hasCancelReq ? '#EF4444' : hasIssue ? '#EF4444' : isActive ? s.color + '30' : BORD}`,
                    borderRadius: '16px',
                    padding: '16px 18px',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Cancel Request flash overlay */}
                  {hasCancelReq && (
                    <motion.div
                      animate={{ opacity: [0.1, 0.3, 0.1] }}
                      transition={{ repeat: Infinity, duration: 1.2 }}
                      style={{ position: 'absolute', inset: 0, background: '#EF4444', borderRadius: '16px' }}
                    />
                  )}

                  {/* Issue flash overlay */}
                  {!hasCancelReq && hasIssue && (
                    <motion.div
                      animate={{ opacity: [0.06, 0.12, 0.06] }}
                      transition={{ repeat: Infinity, duration: 1.8 }}
                      style={{ position: 'absolute', inset: 0, background: '#EF4444', borderRadius: '16px' }}
                    />
                  )}

                  {/* Colored top bar */}
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: (hasIssue || hasCancelReq) ? '#EF4444' : s.color, borderRadius: '16px 16px 0 0' }} />

                  {/* Row 1: ID + status + time */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '12px', color: SUB, fontWeight: 700 }}>
                      #{order.id.slice(0,6).toUpperCase()}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {hasCancelReq && <span style={{ background: '#EF4444', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 900 }}>CANCEL REQ</span>}
                      {hasIssue && !hasCancelReq && <AlertTriangle size={14} color="#EF4444" />}
                      <Chip status={order.status || 'paid'} />
                    </div>
                  </div>

                  {/* Row 2: Restaurant */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <Store size={13} color={s.color} />
                    <span style={{ fontSize: '13px', fontWeight: 800, color: TEXT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {order.restaurantName || 'Restaurante'}
                    </span>
                  </div>

                  {/* Row 3: Customer */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                    <User size={13} color={SUB} />
                    <span style={{ fontSize: '12px', color: SUB, fontWeight: 600 }}>
                      {order.customerName || 'Cliente'}
                    </span>
                  </div>

                  {/* Items preview */}
                  {order.items?.length > 0 && (
                    <div style={{ background: MUTED, borderRadius: '8px', padding: '8px 10px', marginBottom: '12px' }}>
                      {order.items.slice(0, 2).map((item: any, i: number) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: SUB, fontWeight: 600 }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                            {item.quantity || 1}× {item.name}
                          </span>
                          <span style={{ color: '#FF6A00', fontWeight: 800 }}>${(item.price * (item.quantity || 1)).toFixed(2)}</span>
                        </div>
                      ))}
                      {order.items.length > 2 && (
                        <p style={{ margin: '4px 0 0', fontSize: '10px', color: SUB }}>+{order.items.length - 2} más</p>
                      )}
                    </div>
                  )}

                  {/* Row: total + time */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '18px', fontWeight: 900, color: TEXT }}>${(Number(order.total) || 0).toFixed(2)}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: SUB }}>
                      <Clock size={11} />
                      {elapsed}
                    </div>
                  </div>

                  {/* Driver badge */}
                  {order.driverName && (
                    <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Bike size={11} color="#8B5CF6" />
                      <span style={{ fontSize: '11px', color: '#8B5CF6', fontWeight: 700 }}>{order.driverName}</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </main>

      {/* ── Detail Modal ── */}
      <AnimatePresence>
        {selected && <OrderModal order={selected} onClose={() => setSelected(null)} onCancelled={() => setSelected(null)} />}
      </AnimatePresence>

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${BORD}; border-radius: 99px; }
        input::placeholder { color: ${SUB}; }
      `}</style>
    </div>
  );
}
