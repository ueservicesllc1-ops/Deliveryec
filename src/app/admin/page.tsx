'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Bike, Store, Bell, CheckCircle2, XCircle, MapPin, Phone,
  TrendingUp, Package, MoreVertical, Search, ShieldCheck, DollarSign,
  BarChart3, Settings, AlertTriangle, Eye, Trash2, Ban, Star,
  ChevronUp, ChevronDown, RefreshCw, LogOut, X, Filter, ChevronRight,
  Mail, Clock, Activity, ArrowUpRight, ArrowDownRight, Layers, Delete,
} from 'lucide-react';
import {
  collection, onSnapshot, query, doc, updateDoc, deleteDoc, getDoc, setDoc,
  orderBy, limit, where,
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

// ΓöÇΓöÇ Colour palette ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
const C = {
  bg: '#0D0E12',
  surface: '#16181E',
  border: '#1E2028',
  muted: '#3A3D48',
  text: '#F1F3F9',
  sub: '#7C8192',
  accent: '#FF5722',
  blue: '#3B82F6',
  green: '#22C55E',
  yellow: '#F59E0B',
  red: '#EF4444',
  purple: '#8B5CF6',
};

// ΓöÇΓöÇ Status helpers ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
const statusChip = (s: string) => {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    approved:  { bg: '#16301E', color: C.green,  label: 'Aprobado' },
    rejected:  { bg: '#2D1515', color: C.red,    label: 'Rechazado' },
    pending:   { bg: '#2A2510', color: C.yellow, label: 'Pendiente' },
    active:    { bg: '#16301E', color: C.green,  label: 'Activo' },
    blocked:   { bg: '#2D1515', color: C.red,    label: 'Bloqueado' },
    delivered: { bg: '#1B1F35', color: C.blue,   label: 'Entregado' },
    cooking:   { bg: '#2A1A0A', color: C.yellow, label: 'Cocina' },
    cancelled: { bg: '#2D1515', color: C.red,    label: 'Cancelado' },
  };
  const m = map[s] || { bg: '#1E2028', color: C.sub, label: s };
  return (
    <span style={{ background: m.bg, color: m.color, padding: '4px 10px', borderRadius: '99px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
      {m.label}
    </span>
  );
};

// ΓöÇΓöÇ Tiny KPI card ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function KpiCard({ label, value, icon, color, delta }: { label: string; value: number | string; icon: React.ReactNode; color: string; delta?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: '20px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ width: '44px', height: '44px', background: `${color}18`, color, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </div>
        {delta !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: delta >= 0 ? C.green : C.red }}>
            {delta >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {Math.abs(delta)}%
          </div>
        )}
      </div>
      <div>
        <p style={{ margin: 0, fontSize: '11px', color: C.sub, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
        <h3 style={{ margin: '4px 0 0', fontSize: '28px', fontWeight: 900, color: C.text, letterSpacing: '-0.5px' }}>{value}</h3>
      </div>
    </motion.div>
  );
}

// ΓöÇΓöÇ Nav item ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function NavItem({ icon, label, active, onClick, badge }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void; badge?: number }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '11px 16px', borderRadius: '12px',
        background: active ? `${C.accent}18` : 'transparent',
        border: active ? `1px solid ${C.accent}30` : '1px solid transparent',
        color: active ? C.accent : C.sub,
        fontWeight: active ? 800 : 600,
        fontSize: '14px',
        cursor: 'pointer',
        transition: 'all 0.15s',
        width: '100%',
        textAlign: 'left',
        position: 'relative',
      }}
    >
      {icon}
      {label}
      {badge != null && badge > 0 && (
        <span style={{ marginLeft: 'auto', background: C.accent, color: 'white', fontSize: '10px', fontWeight: 900, padding: '2px 7px', borderRadius: '99px', minWidth: '20px', textAlign: 'center' }}>
          {badge}
        </span>
      )}
    </button>
  );
}

// ΓöÇΓöÇ PIN Gate ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
const ADMIN_PIN = '1619';

function PinGate({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState('');
  const [shake, setShake] = useState(false);
  const [error, setError] = useState(false);

  const push = (d: string) => {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    if (next.length === 4) {
      if (next === ADMIN_PIN) {
        sessionStorage.setItem('admin_unlocked', '1');
        onUnlock();
      } else {
        setShake(true);
        setError(true);
        setTimeout(() => { setShake(false); setError(false); setPin(''); }, 700);
      }
    }
  };

  const del = () => setPin(p => p.slice(0, -1));

  return (
    <div style={{
      minHeight: '100dvh', background: C.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Inter, -apple-system, sans-serif',
    }}>
      <motion.div
        animate={shake ? { x: [-12, 12, -10, 10, -6, 6, 0] } : {}}
        transition={{ duration: 0.5 }}
        style={{ width: '320px', textAlign: 'center' }}
      >
        {/* Icon */}
        <div style={{ width: '68px', height: '68px', background: `${C.accent}18`, border: `1px solid ${C.accent}30`, borderRadius: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <ShieldCheck size={32} color={C.accent} />
        </div>

        <h2 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 900, color: C.text }}>Acceso Admin</h2>
        <p style={{ margin: '0 0 32px', fontSize: '13px', color: C.sub }}>Ingresa tu PIN de 4 d├¡gitos</p>

        {/* PIN dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '36px' }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{
              width: '18px', height: '18px',
              borderRadius: '50%',
              background: i < pin.length ? (error ? C.red : C.accent) : 'transparent',
              border: `2px solid ${i < pin.length ? (error ? C.red : C.accent) : C.muted}`,
              transition: 'all 0.15s',
              boxShadow: i < pin.length && !error ? `0 0 10px ${C.accent}60` : 'none',
            }} />
          ))}
        </div>

        {/* Numpad */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          {['1','2','3','4','5','6','7','8','9','','0','Γî½'].map((k, i) => (
            <button
              key={i}
              onClick={() => k === 'Γî½' ? del() : k !== '' ? push(k) : undefined}
              disabled={k === ''}
              style={{
                height: '64px',
                background: k === 'Γî½' ? `${C.red}18` : k === '' ? 'transparent' : C.surface,
                border: k === '' ? 'none' : `1px solid ${k === 'Γî½' ? C.red + '40' : C.border}`,
                borderRadius: '16px',
                color: k === 'Γî½' ? C.red : C.text,
                fontSize: '22px',
                fontWeight: 700,
                cursor: k === '' ? 'default' : 'pointer',
                transition: 'all 0.12s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseDown={e => { if (k !== '') (e.currentTarget as HTMLElement).style.background = k === 'Γî½' ? `${C.red}30` : C.muted + '80'; }}
              onMouseUp={e => { if (k !== '') (e.currentTarget as HTMLElement).style.background = k === 'Γî½' ? `${C.red}18` : C.surface; }}
            >
              {k === 'Γî½' ? <Delete size={20} /> : k}
            </button>
          ))}
        </div>

        {error && (
          <p style={{ marginTop: '20px', fontSize: '12px', color: C.red, fontWeight: 700 }}>PIN incorrecto. Intenta de nuevo.</p>
        )}

        <button 
          onClick={async () => {
            if (auth.currentUser) {
              try {
                await updateDoc(doc(db, 'profiles', auth.currentUser.uid), { isAdmin: true });
                alert('┬íListo! Ya eres Super-Admin en la base de datos.');
                window.location.reload();
              } catch (err: any) {
                alert('Inicia sesi├│n en la plataforma primero para poder darte permisos de Admin.');
                window.location.href = '/login';
              }
            } else {
              alert('Debes estar iniciado sesi├│n para hacerte admin.');
              window.location.href = '/login';
            }
          }}
          style={{ 
            marginTop: '30px', background: C.accent, color: 'white', border: 'none', 
            borderRadius: '12px', padding: '12px 24px', fontSize: '12px', fontWeight: 900,
            cursor: 'pointer', zIndex: 10, position: 'relative'
          }}
        >
          Darme Poder de Super-Admin ≡ƒÜÇ
        </button>
      </motion.div>
    </div>
  );
}

// ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export default function AdminDashboard() {
  const [unlocked, setUnlocked] = useState(false);

  // Keep session across same-tab refreshes
  useEffect(() => {
    if (sessionStorage.getItem('admin_unlocked') === '1') setUnlocked(true);
  }, []);

  if (!unlocked) return <PinGate onUnlock={() => setUnlocked(true)} />;

  return <AdminApp />;
}

function AdminApp() {
  const [tab, setTab] = useState<'overview' | 'businesses' | 'users' | 'drivers' | 'orders' | 'settings'>('overview');
  const [businesses, setBusinesses]   = useState<any[]>([]);
  const [users, setUsers]             = useState<any[]>([]);
  const [orders, setOrders]           = useState<any[]>([]);
  const [driverApps, setDriverApps]   = useState<any[]>([]);
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading]         = useState(true);
  const [permissionError, setPermError] = useState(false);

  const [commissionRate, setCommRate] = useState(15); // %
  const [baseDeliveryFee, setBaseDeliveryFee] = useState(1.50); // flat USD base
  const [costPerKm, setCostPerKm] = useState(0.40); // per Km
  const [timePerKm, setTimePerKm] = useState(3); // minutes per km
  const [basePrepTime, setBasePrepTime] = useState(15); // base prep + delivery margin
  const [driverCommission, setDriverComm] = useState(30); // % Platform stays with

  const [confirmModal, setConfirmModal] = useState<{ action: () => Promise<void>; title: string; sub: string } | null>(null);
  const [saving, setSaving]           = useState(false);

  // ΓöÇΓöÇ Real-time listeners ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  useEffect(() => {
    const handleErr = (err: any) => {
      console.error(err);
      if (err.code === 'permission-denied') setPermError(true);
    };

    const u1 = onSnapshot(collection(db, 'business_requests'), snap => {
      setBusinesses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, handleErr);
    
    const u2 = onSnapshot(collection(db, 'profiles'), snap =>
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() }))), handleErr);
      
    const u3 = onSnapshot(query(collection(db, 'orders')), snap =>
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() }))), handleErr);
      
    const u4 = onSnapshot(collection(db, 'driver_applications'), snap =>
      setDriverApps(snap.docs.map(d => ({ id: d.id, ...d.data() }))), handleErr);
      
    // Fetch global settings
    getDoc(doc(db, 'settings', 'global')).then(snap => {
      if (snap.exists()) {
        const d = snap.data();
        if (d.commissionRate !== undefined) setCommRate(d.commissionRate);
        if (d.baseDeliveryFee !== undefined) setBaseDeliveryFee(d.baseDeliveryFee);
        if (d.costPerKm !== undefined) setCostPerKm(d.costPerKm);
        if (d.timePerKm !== undefined) setTimePerKm(d.timePerKm);
        if (d.basePrepTime !== undefined) setBasePrepTime(d.basePrepTime);
        if (d.driverCommission !== undefined) setDriverComm(d.driverCommission);
      }
    }).catch(console.error);

    return () => { u1(); u2(); u3(); u4(); };
  }, []);

  if (permissionError) {
    return (
      <div style={{ padding: '50px', textAlign: 'center', color: C.text, background: C.bg, height: '100vh' }}>
        <ShieldCheck size={60} color={C.red} style={{ margin: '0 auto 20px' }} />
        <h1>Acceso Denegado</h1>
        <p style={{ color: C.sub, maxWidth: '400px', margin: '0 auto 30px' }}>
          Tu cuenta no tiene rango de Administrador. Por seguridad, Firestore bloque├│ la lectura de datos.
        </p>
        <button 
          onClick={async () => {
            if (auth.currentUser) {
              try {
                await updateDoc(doc(db, 'profiles', auth.currentUser.uid), { isAdmin: true });
                alert('┬íSuper-Admin activado!');
                window.location.reload();
              } catch (err) { alert('Error: ' + err); }
            } else { alert('Debes iniciar sesi├│n.'); window.location.href='/login'; }
          }}
          style={{ background: C.accent, color: 'white', border: 'none', borderRadius: '12px', padding: '15px 30px', fontWeight: 900, cursor: 'pointer' }}
        >
          Darme Poder de Super-Admin ≡ƒÜÇ
        </button>
      </div>
    );
  }


  // ΓöÇΓöÇ Derived stats ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  const today = useMemo(() => {
    const start = new Date(); start.setHours(0,0,0,0);
    return orders.filter(o => (o.createdAt?.seconds || 0) * 1000 >= start.getTime());
  }, [orders]);

  const totalRevenue = useMemo(() =>
    orders.filter(o => o.status === 'dispatched' || o.status === 'delivered')
      .reduce((s, o) => s + (Number(o.total) || 0), 0),
  [orders]);

  const platformStats = useMemo(() => {
    let salesComm = 0;
    let deliveryComm = 0;
    orders.forEach(o => {
      if (o.status === 'dispatched' || o.status === 'delivered') {
        salesComm += (Number(o.total) || 0) * commissionRate / 100;
        const dFee = Number(o.deliveryFee || o.delivery) || 0;
        deliveryComm += dFee * driverCommission / 100;
      }
    });
    return { salesComm, deliveryComm, total: salesComm + deliveryComm };
  }, [orders, commissionRate, driverCommission]);

  const saveSettings = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'global'), {
        commissionRate,
        baseDeliveryFee,
        costPerKm,
        timePerKm,
        basePrepTime,
        driverCommission,
        updatedAt: new Date()
      }, { merge: true });
      alert('Configuraci├│n guardada correctamente.');
    } catch (e: any) {
      alert('Error guardando configuraci├│n: ' + e.message);
    }
    setSaving(false);
  };

  const pendingBiz = businesses.filter(b => !b.status || b.status === 'pending').length;

  // ΓöÇΓöÇ Actions ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  const ask = (title: string, sub: string, action: () => Promise<void>) =>
    setConfirmModal({ title, sub, action });

  const approveBiz = (id: string) => ask(
    '┬┐Aprobar este negocio?',
    'El restaurante podr├í acceder al panel de ventas inmediatamente.',
    async () => { await updateDoc(doc(db, 'business_requests', id), { status: 'approved' }); }
  );

  const rejectBiz = (id: string) => ask(
    '┬┐Rechazar solicitud?',
    'El negocio no podr├í operar en la plataforma.',
    async () => { await updateDoc(doc(db, 'business_requests', id), { status: 'rejected' }); }
  );

  const blockUser = (id: string, currently: boolean) => ask(
    currently ? '¿Desbloquear usuario?' : '¿Bloquear usuario?',
    'Este cambio se aplica inmediatamente.',
    async () => { await updateDoc(doc(db, 'profiles', id), { blocked: !currently }); }
  );

  const approveDriver = (id: string) => ask(
    '¿Aprobar a este Driver?',
    'Tendrá acceso inmediato al portal de repartidores GPS y recibirá pedidos.',
    async () => { 
      await updateDoc(doc(db, 'profiles', id), { role: 'driver', status: 'approved' });
      await updateDoc(doc(db, 'driver_applications', id), { role: 'driver', status: 'approved' });
    }
  );

  const rejectDriver = (id: string) => ask(
    '¿Rechazar a este Driver?',
    'No podrá acceder al portal de repartidores.',
    async () => { 
      await updateDoc(doc(db, 'profiles', id), { role: 'customer', status: 'rejected' });
      await updateDoc(doc(db, 'driver_applications', id), { role: 'customer', status: 'rejected' });
    }
  );

  const deleteUser = (id: string) => ask(
    '┬┐Eliminar usuario permanentemente?',
    'Se borrar├í su perfil. Esta acci├│n no se puede deshacer.',
    async () => { await deleteDoc(doc(db, 'profiles', id)); }
  );

  const runConfirm = async () => {
    if (!confirmModal) return;
    setSaving(true);
    await confirmModal.action().catch(console.error);
    setSaving(false);
    setConfirmModal(null);
  };

  // ΓöÇΓöÇ Filtered lists ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  const bizFiltered = useMemo(() => businesses.filter(b => {
    const matchSearch = !search || b.businessName?.toLowerCase().includes(search.toLowerCase()) || b.city?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || b.status === statusFilter || (!b.status && statusFilter === 'pending');
    return matchSearch && matchStatus;
  }), [businesses, search, statusFilter]);

  const usersFiltered = useMemo(() => users.filter(u =>
    !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
  ), [users, search]);

  const ordersFiltered = useMemo(() => orders.filter(o =>
    !search || o.customerName?.toLowerCase().includes(search.toLowerCase()) || o.restaurantName?.toLowerCase().includes(search.toLowerCase())
  ), [orders, search]);

  // ΓöÇΓöÇ Chart data (last 7 days) ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  const chartData = useMemo(() => {
    const days: { label: string; revenue: number; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate() - i);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      const dayOrders = orders.filter(o => {
        const t = (o.createdAt?.seconds || 0) * 1000;
        return t >= d.getTime() && t < next.getTime();
      });
      days.push({ label: d.toLocaleDateString('es-EC', { weekday: 'short' }), revenue: dayOrders.reduce((s, o) => s + (Number(o.total) || 0), 0), count: dayOrders.length });
    }
    return days;
  }, [orders]);
  const maxRev = Math.max(...chartData.map(d => d.revenue), 1);

  return (
    <div style={{ display: 'flex', minHeight: '100dvh', background: C.bg, fontFamily: 'Inter, -apple-system, sans-serif', color: C.text }}>

      {/* ΓöÇΓöÇ SIDEBAR ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
      <aside style={{ width: '240px', background: C.surface, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'sticky', top: 0, height: '100dvh' }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', background: `linear-gradient(135deg,#FF6B35,${C.accent})`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '16px' }}>D</div>
            <div>
              <p style={{ margin: 0, fontWeight: 900, fontSize: '15px', letterSpacing: '-0.3px' }}>DeliveryEC</p>
              <p style={{ margin: 0, fontSize: '10px', color: C.accent, fontWeight: 700, textTransform: 'uppercase' }}>Super Admin</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
          <NavItem icon={<BarChart3 size={18}/>} label="Resumen" active={tab==='overview'} onClick={() => { setTab('overview'); setSearch(''); }} />
          <NavItem icon={<Store size={18}/>} label="Negocios" active={tab==='businesses'} onClick={() => { setTab('businesses'); setSearch(''); }} badge={pendingBiz} />
          <NavItem icon={<Users size={18}/>} label="Usuarios" active={tab==='users'} onClick={() => { setTab('users'); setSearch(''); }} />
          <NavItem icon={<Bike size={18}/>} label="Drivers" active={tab==='drivers'} onClick={() => { setTab('drivers'); setSearch(''); }} badge={driverApps.filter((d:any)=>d.status==='pending_approval').length} />
          <NavItem icon={<Package size={18}/>} label="Pedidos" active={tab==='orders'} onClick={() => { setTab('orders'); setSearch(''); }} />
          <div style={{ height: '1px', background: C.border, margin: '8px 4px' }} />
          <NavItem icon={<Settings size={18}/>} label="Configuraci├│n" active={tab==='settings'} onClick={() => setTab('settings')} />
        </nav>

        {/* Commission widget */}
        <div style={{ padding: '16px', borderTop: `1px solid ${C.border}` }}>
          <div style={{ background: `${C.accent}12`, border: `1px solid ${C.accent}28`, borderRadius: '14px', padding: '14px' }}>
            <p style={{ margin: '0 0 2px', fontSize: '10px', color: C.accent, fontWeight: 800, textTransform: 'uppercase' }}>Configuraci├│n activa</p>
            <p style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: C.text }}>{commissionRate}% / {driverCommission}%</p>
            <p style={{ margin: 0, fontSize: '11px', color: C.sub, fontWeight: 700 }}>Sales / Delivery</p>
          </div>
        </div>
      </aside>

      {/* ΓöÇΓöÇ MAIN ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Top bar */}
        <header style={{ padding: '16px 32px', background: C.surface, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
          <div style={{ flex: 1, maxWidth: '420px', position: 'relative' }}>
            <Search size={16} color={C.muted} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar negocios, usuarios, pedidos..."
              style={{ width: '100%', padding: '10px 14px 10px 40px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: '12px', color: C.text, fontSize: '13px', fontWeight: 600, outline: 'none' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
            <div style={{ background: `${C.green}18`, padding: '6px 12px', borderRadius: '99px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '7px', height: '7px', background: C.green, borderRadius: '50%', boxShadow: `0 0 8px ${C.green}` }} />
              <span style={{ fontSize: '11px', fontWeight: 700, color: C.green }}>Sistema en l├¡nea</span>
            </div>
            <div style={{ width: '38px', height: '38px', background: C.muted, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={18} color={C.accent} />
            </div>
          </div>
        </header>

        {/* Scrollable content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
          <AnimatePresence mode="wait">

            {/* ΓöÇΓöÇ OVERVIEW ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
            {tab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <h1 style={{ margin: '0 0 8px', fontSize: '26px', fontWeight: 900, letterSpacing: '-0.5px' }}>Panel de Control</h1>
                <p style={{ margin: '0 0 32px', color: C.sub, fontSize: '13px', fontWeight: 500 }}>
                  {new Date().toLocaleDateString('es-EC', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>

                {/* KPI grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                  <KpiCard label="Negocios Totales" value={businesses.length} icon={<Store size={20}/>} color={C.accent} delta={5} />
                  <KpiCard label="Usuarios Registrados" value={users.length} icon={<Users size={20}/>} color={C.blue} delta={12} />
                  <KpiCard label="Pedidos Hoy" value={today.length} icon={<Package size={20}/>} color={C.yellow} />
                  <KpiCard label="Revenue Total" value={`$${totalRevenue.toFixed(2)}`} icon={<DollarSign size={20}/>} color={C.green} delta={8} />
                  <KpiCard label="Comisi├│n Ganada" value={`$${platformStats.total.toFixed(2)}`} icon={<TrendingUp size={20}/>} color={C.purple} />
                  <KpiCard label="Pendientes Revisi├│n" value={pendingBiz} icon={<AlertTriangle size={20}/>} color={C.red} />
                </div>

                {/* Revenue chart */}
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '28px', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                    <h3 style={{ margin: 0, fontWeight: 900, fontSize: '16px' }}>Ingresos ΓÇö ├║ltimos 7 d├¡as</h3>
                    <span style={{ fontSize: '11px', color: C.sub, fontWeight: 700, textTransform: 'uppercase' }}>USD</span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', height: '140px' }}>
                    {chartData.map((d, i) => (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '10px', color: C.sub, fontWeight: 700 }}>${d.revenue.toFixed(0)}</span>
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${(d.revenue / maxRev) * 100}%` }}
                          transition={{ delay: i * 0.06, type: 'spring', stiffness: 200 }}
                          style={{ width: '100%', background: `linear-gradient(to top, ${C.accent}, #FF8C65)`, borderRadius: '6px', minHeight: '4px' }}
                        />
                        <span style={{ fontSize: '10px', color: C.sub, fontWeight: 700, textTransform: 'capitalize' }}>{d.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent orders */}
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '28px' }}>
                  <h3 style={{ margin: '0 0 20px', fontWeight: 900, fontSize: '16px' }}>Pedidos Recientes</h3>
                  {orders.slice(0, 6).map((o, i) => (
                    <div key={o.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < 5 ? `1px solid ${C.border}` : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', background: C.muted, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 900, color: C.accent }}>
                          {o.customerName?.[0]?.toUpperCase() || 'C'}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: '13px' }}>{o.customerName || 'Cliente'}</p>
                          <p style={{ margin: 0, fontSize: '11px', color: C.sub }}>{o.restaurantName || 'Local'}</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {statusChip(o.status || 'pending')}
                        <span style={{ fontWeight: 900, color: C.accent, fontSize: '14px' }}>${(Number(o.total) || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                  {orders.length === 0 && <p style={{ color: C.sub, textAlign: 'center', padding: '20px 0', margin: 0 }}>Sin pedidos a├║n.</p>}
                </div>
              </motion.div>
            )}

            {/* ΓöÇΓöÇ BUSINESSES ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
            {tab === 'businesses' && (
              <motion.div key="biz" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
                  <div>
                    <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 900 }}>Negocios</h1>
                    <p style={{ margin: '4px 0 0', color: C.sub, fontSize: '13px' }}>{businesses.length} registrados ┬╖ {pendingBiz} pendientes</p>
                  </div>
                  {/* Status filter */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {['all', 'pending', 'approved', 'rejected'].map(s => (
                      <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: '8px 16px', borderRadius: '10px', border: 'none', background: statusFilter === s ? C.accent : C.surface, color: statusFilter === s ? 'white' : C.sub, fontWeight: 700, fontSize: '12px', cursor: 'pointer', textTransform: 'capitalize' }}>
                        {s === 'all' ? 'Todos' : s === 'pending' ? 'Pendientes' : s === 'approved' ? 'Aprobados' : 'Rechazados'}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {bizFiltered.map(biz => (
                    <motion.div key={biz.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '18px', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                      {/* Avatar */}
                      <div style={{ width: '52px', height: '52px', background: `${C.accent}18`, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.accent, flexShrink: 0 }}>
                        <Store size={24} />
                      </div>
                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{biz.businessName}</h3>
                          {statusChip(biz.status || 'pending')}
                        </div>
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                          {biz.city && <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: C.sub }}><MapPin size={12}/> {biz.city}</span>}
                          {biz.phone && <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: C.sub }}><Phone size={12}/> {biz.phone}</span>}
                          {biz.type && <span style={{ fontSize: '12px', color: C.sub }}>{biz.type}</span>}
                        </div>
                      </div>
                      {/* Actions */}
                      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                        {(!biz.status || biz.status === 'pending') && (
                          <>
                            <button onClick={() => approveBiz(biz.id)} style={{ padding: '8px 18px', background: `${C.green}18`, border: `1px solid ${C.green}30`, borderRadius: '10px', color: C.green, fontWeight: 800, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <CheckCircle2 size={14}/> Aprobar
                            </button>
                            <button onClick={() => rejectBiz(biz.id)} style={{ padding: '8px 18px', background: `${C.red}12`, border: `1px solid ${C.red}25`, borderRadius: '10px', color: C.red, fontWeight: 800, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <XCircle size={14}/> Rechazar
                            </button>
                          </>
                        )}
                        {biz.status === 'approved' && (
                          <button onClick={() => rejectBiz(biz.id)} style={{ padding: '8px 16px', background: C.muted + '44', border: `1px solid ${C.border}`, borderRadius: '10px', color: C.sub, fontWeight: 700, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Ban size={14}/> Suspender
                          </button>
                        )}
                        {biz.status === 'rejected' && (
                          <button onClick={() => approveBiz(biz.id)} style={{ padding: '8px 16px', background: `${C.green}12`, border: `1px solid ${C.green}25`, borderRadius: '10px', color: C.green, fontWeight: 700, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <CheckCircle2 size={14}/> Reactivar
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  {bizFiltered.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: C.sub }}>
                      <Store size={40} style={{ opacity: 0.2, marginBottom: '12px' }} />
                      <p style={{ margin: 0, fontWeight: 700 }}>No se encontraron negocios</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ΓöÇΓöÇ USERS ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
            {tab === 'users' && (
              <motion.div key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div style={{ marginBottom: '28px' }}>
                  <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 900 }}>Usuarios</h1>
                  <p style={{ margin: '4px 0 0', color: C.sub, fontSize: '13px' }}>{users.length} registrados en la plataforma</p>
                </div>

                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: C.bg }}>
                        {['Usuario', 'ID', 'Tel├⌐fono', 'Estado', 'Acciones'].map(h => (
                          <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: '10px', fontWeight: 800, color: C.sub, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {usersFiltered.map((u, i) => (
                        <tr key={u.id} style={{ borderTop: `1px solid ${C.border}` }}>
                          <td style={{ padding: '14px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ width: '36px', height: '36px', background: `${C.blue}20`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.blue, fontWeight: 900, fontSize: '14px' }}>
                                {u.name?.[0]?.toUpperCase() || 'U'}
                              </div>
                              <div>
                                <p style={{ margin: 0, fontWeight: 700, fontSize: '13px' }}>{u.name || 'Sin nombre'}</p>
                                {u.email && <p style={{ margin: 0, fontSize: '11px', color: C.sub }}>{u.email}</p>}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '14px 20px' }}>
                            <span style={{ fontSize: '11px', color: C.sub, fontFamily: 'monospace' }}>{u.id.slice(0, 10)}ΓÇª</span>
                          </td>
                          <td style={{ padding: '14px 20px', fontSize: '13px', color: C.sub }}>{u.phone || 'ΓÇö'}</td>
                          <td style={{ padding: '14px 20px' }}>{statusChip(u.blocked ? 'blocked' : 'active')}</td>
                          <td style={{ padding: '14px 20px' }}>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button onClick={() => blockUser(u.id, !!u.blocked)} style={{ padding: '6px 12px', background: u.blocked ? `${C.green}18` : `${C.yellow}18`, border: 'none', borderRadius: '8px', color: u.blocked ? C.green : C.yellow, fontWeight: 700, fontSize: '11px', cursor: 'pointer' }}>
                                {u.blocked ? 'Desbloquear' : 'Bloquear'}
                              </button>
                              <button onClick={() => deleteUser(u.id)} style={{ width: '30px', height: '30px', background: `${C.red}12`, border: 'none', borderRadius: '8px', color: C.red, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Trash2 size={13}/>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {usersFiltered.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '60px', color: C.sub }}>
                      <Users size={40} style={{ opacity: 0.2, marginBottom: '12px' }} />
                      <p style={{ margin: 0, fontWeight: 700 }}>Sin usuarios encontrados</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ΓöÇΓöÇ DRIVERS ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
            {tab === 'drivers' && (
              <motion.div key="drivers" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                
                {/* Driver Applications Section */}
                <div style={{ marginBottom: '40px' }}>
                  <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 900 }}>Solicitudes de Conductores</h1>
                  <p style={{ margin: '4px 0 20px', color: C.sub, fontSize: '13px' }}>Revisa la identidad y los vehículos de los aplicantes</p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {driverApps.filter((a:any) => !search || a.name?.toLowerCase().includes(search.toLowerCase())).map((app: any) => (
                      <div key={app.uid} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '24px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                        <div style={{ flexShrink: 0 }}>
                          <div style={{ width: '60px', height: '60px', background: `${C.accent}18`, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.accent, fontWeight: 900, fontSize: '20px' }}>
                            {app.name?.[0]}
                          </div>
                        </div>
                        <div style={{ flex: 1, minWidth: '240px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900 }}>{app.name} {app.lastName}</h3>
                            {statusChip(app.status)}
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', color: C.sub, fontSize: '13px' }}>
                            <div><strong>Email:</strong> {app.email}</div>
                            <div><strong>Teléfono:</strong> {app.phone}</div>
                            <div><strong>Cédula:</strong> {app.idNumber}</div>
                            <div><strong>Dirección:</strong> {app.address}</div>
                          </div>
                        </div>
                        
                        <div style={{ flex: 1, minWidth: '240px', background: C.bg, padding: '16px', borderRadius: '16px', border: `1px solid ${C.border}` }}>
                          <p style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: C.text }}>Detalles de {app.vehicle?.type || 'Nave'}</p>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', color: C.sub, fontSize: '13px' }}>
                            {app.vehicle?.make && <div><strong>Marca:</strong> {app.vehicle.make}</div>}
                            {app.vehicle?.model && <div><strong>Modelo:</strong> {app.vehicle.model}</div>}
                            {app.vehicle?.year && <div><strong>Año:</strong> {app.vehicle.year}</div>}
                            {app.vehicle?.color && <div><strong>Color:</strong> {app.vehicle.color}</div>}
                          </div>
                          
                          <div style={{ display: 'flex', gap: '8px', marginTop: '16px', overflowX: 'auto' }}>
                            {app.idPhotoUrl && <a href={app.idPhotoUrl} target="_blank" rel="noreferrer"><img src={app.idPhotoUrl} alt="ID" style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '8px', border: `1px solid ${C.border}` }} title="Ver Documento ID" /></a>}
                            {app.vehicle?.photoUrl && <a href={app.vehicle.photoUrl} target="_blank" rel="noreferrer"><img src={app.vehicle.photoUrl} alt="Vehículo" style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '8px', border: `1px solid ${C.border}` }} title="Ver Vehículo" /></a>}
                            {app.vehicle?.licensePlateUrl && <a href={app.vehicle.licensePlateUrl} target="_blank" rel="noreferrer"><img src={app.vehicle.licensePlateUrl} alt="Placa" style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '8px', border: `1px solid ${C.border}` }} title="Ver Placa" /></a>}
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
                          {app.status === 'pending_approval' ? (
                            <>
                              <button onClick={() => approveDriver(app.uid)} style={{ padding: '12px 24px', background: `${C.green}18`, border: `1px solid ${C.green}30`, borderRadius: '12px', color: C.green, fontWeight: 800, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={16}/> Aprobar Ingreso</button>
                              <button onClick={() => rejectDriver(app.uid)} style={{ padding: '12px 24px', background: `${C.red}12`, border: `1px solid ${C.red}25`, borderRadius: '12px', color: C.red, fontWeight: 800, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><XCircle size={16}/> Rechazar</button>
                            </>
                          ) : (
                            <button onClick={app.status === 'approved' ? () => rejectDriver(app.uid) : () => approveDriver(app.uid)} style={{ padding: '12px 24px', background: C.muted + '44', border: `1px solid ${C.border}`, borderRadius: '12px', color: C.sub, fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <RefreshCw size={16}/> {app.status === 'approved' ? 'Revocar Acceso' : 'Re-Aprobar'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {driverApps.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '40px', color: C.sub, border: `1px solid ${C.border}`, borderRadius: '20px', background: C.surface }}>
                        <Bike size={32} style={{ opacity: 0.2, marginBottom: '12px' }} />
                        <p style={{ margin: 0, fontWeight: 700 }}>No hay solicitudes pendientes.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ height: '1px', background: C.border, margin: '40px 0' }} />

                <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 900 }}>Reporte Financiero Drivers</h1>
                    <p style={{ margin: '4px 0 0', color: C.sub, fontSize: '13px' }}>Ganancias y actividad por repartidor</p>
                  </div>
                </div>

                {/* Per-driver earnings cards */}
                {(() => {
                  // Build driver stats from orders
                  const driverMap: Record<string, {
                    uid: string; name: string;
                    orders: any[];
                    totalDeliveryFee: number;
                    driverEarnings: number;
                    platformCut: number;
                  }> = {};

                  orders.forEach(o => {
                    if (!o.driverId) return;
                    const dFee = Number(o.deliveryFee || 0);
                    const driverEarn = dFee * (1 - driverCommission / 100);
                    const platCut   = dFee * (driverCommission / 100);
                    if (!driverMap[o.driverId]) {
                      const profile = users.find(u => u.id === o.driverId);
                      driverMap[o.driverId] = {
                        uid: o.driverId,
                        name: o.driverName || profile?.name || `Driver ${o.driverId.slice(0,6)}`,
                        orders: [],
                        totalDeliveryFee: 0,
                        driverEarnings: 0,
                        platformCut: 0,
                      };
                    }
                    driverMap[o.driverId].orders.push(o);
                    driverMap[o.driverId].totalDeliveryFee += dFee;
                    driverMap[o.driverId].driverEarnings   += driverEarn;
                    driverMap[o.driverId].platformCut      += platCut;
                  });

                  const list = Object.values(driverMap).sort((a, b) => b.driverEarnings - a.driverEarnings);

                  if (list.length === 0) return (
                    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '60px', textAlign: 'center', color: C.sub }}>
                      <Bike size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                      <p style={{ margin: 0, fontWeight: 700 }}>No hay drivers con pedidos asignados aún.</p>
                      <p style={{ margin: '8px 0 0', fontSize: '12px' }}>Cuando un driver acepte un pedido, aparecerá aquí con sus ganancias.</p>
                    </div>
                  );

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {/* Summary KPIs */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                        {[
                          { label: 'Drivers Activos', value: list.length, color: C.accent, icon: <Bike size={18}/> },
                          { label: 'Total Pagado a Drivers', value: `$${list.reduce((s,d)=>s+d.driverEarnings,0).toFixed(2)}`, color: C.green, icon: <DollarSign size={18}/> },
                          { label: 'Ganancia Plataforma (Envíos)', value: `$${list.reduce((s,d)=>s+d.platformCut,0).toFixed(2)}`, color: C.purple, icon: <TrendingUp size={18}/> },
                        ].map((k,i) => (
                          <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '20px', display: 'flex', gap: '14px', alignItems: 'center' }}>
                            <div style={{ width: '40px', height: '40px', background: `${k.color}18`, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: k.color, flexShrink: 0 }}>{k.icon}</div>
                            <div>
                              <p style={{ margin: 0, fontSize: '11px', color: C.sub, fontWeight: 700, textTransform: 'uppercase' }}>{k.label}</p>
                              <p style={{ margin: '2px 0 0', fontSize: '22px', fontWeight: 900, color: C.text }}>{k.value}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Per-driver cards */}
                      {list.map(driver => (
                        <div key={driver.uid} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                          {/* Driver header */}
                          <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ width: '48px', height: '48px', background: `${C.purple}20`, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.purple, fontWeight: 900, fontSize: '18px', flexShrink: 0 }}>
                              {driver.name[0].toUpperCase()}
                            </div>
                            <div style={{ flex: 1 }}>
                              <p style={{ margin: 0, fontWeight: 900, fontSize: '16px' }}>{driver.name}</p>
                              <p style={{ margin: 0, fontSize: '11px', color: C.sub, fontFamily: 'monospace' }}>{driver.uid.slice(0,16)}...</p>
                            </div>
                            <div style={{ display: 'flex', gap: '24px', textAlign: 'right' }}>
                              <div>
                                <p style={{ margin: 0, fontSize: '10px', color: C.sub, fontWeight: 700, textTransform: 'uppercase' }}>Entregas</p>
                                <p style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: C.accent }}>{driver.orders.length}</p>
                              </div>
                              <div>
                                <p style={{ margin: 0, fontSize: '10px', color: C.sub, fontWeight: 700, textTransform: 'uppercase' }}>Cobrado al cliente</p>
                                <p style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: C.blue }}>${driver.totalDeliveryFee.toFixed(2)}</p>
                              </div>
                              <div>
                                <p style={{ margin: 0, fontSize: '10px', color: C.sub, fontWeight: 700, textTransform: 'uppercase' }}>Driver recibe ({100-driverCommission}%)</p>
                                <p style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: C.green }}>${driver.driverEarnings.toFixed(2)}</p>
                              </div>
                              <div>
                                <p style={{ margin: 0, fontSize: '10px', color: C.sub, fontWeight: 700, textTransform: 'uppercase' }}>Plataforma ({driverCommission}%)</p>
                                <p style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: C.purple }}>${driver.platformCut.toFixed(2)}</p>
                              </div>
                            </div>
                          </div>

                          {/* Orders table for this driver */}
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ background: C.bg }}>
                                {['Orden #', 'Restaurante', 'Cliente', 'Total Pedido', 'Envío Cobrado', 'Driver Gana', 'Estado', 'Aceptado'].map(h => (
                                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '10px', fontWeight: 800, color: C.sub, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {driver.orders.map(o => {
                                const dFee = Number(o.deliveryFee || 0);
                                const driverPay = dFee * (1 - driverCommission / 100);
                                const acceptedAt = o.driverAcceptedAt?.seconds ? new Date(o.driverAcceptedAt.seconds * 1000).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }) : '—';
                                return (
                                  <tr key={o.id} style={{ borderTop: `1px solid ${C.border}` }}>
                                    <td style={{ padding: '10px 16px' }}><span style={{ fontSize: '11px', color: C.sub, fontFamily: 'monospace' }}>#{o.id.slice(0,6).toUpperCase()}</span></td>
                                    <td style={{ padding: '10px 16px', fontSize: '12px', fontWeight: 700, maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.restaurantName || '—'}</td>
                                    <td style={{ padding: '10px 16px', fontSize: '12px', color: C.sub }}>{o.customerName || '—'}</td>
                                    <td style={{ padding: '10px 16px', fontWeight: 900, color: C.accent, fontSize: '13px' }}>${(Number(o.total)||0).toFixed(2)}</td>
                                    <td style={{ padding: '10px 16px', fontWeight: 700, color: C.blue, fontSize: '13px' }}>${dFee.toFixed(2)}</td>
                                    <td style={{ padding: '10px 16px', fontWeight: 900, color: C.green, fontSize: '13px' }}>${driverPay.toFixed(2)}</td>
                                    <td style={{ padding: '10px 16px' }}>{statusChip(o.status || 'pending')}</td>
                                    <td style={{ padding: '10px 16px', fontSize: '11px', color: C.sub }}>{acceptedAt}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </motion.div>
            )}

            {/* ── ORDERS ────────────────────────────────────────────────── */}
            {tab === 'orders' && (
              <motion.div key="orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 900 }}>Registro Diario de Pedidos</h1>
                    <p style={{ margin: '4px 0 0', color: C.sub, fontSize: '13px' }}>{orders.length} pedidos · Revenue total: ${totalRevenue.toFixed(2)}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    {[
                      { label: 'Hoy', value: today.length, color: C.accent },
                      { label: 'Con Driver', value: orders.filter((o:any)=>!!o.driverId).length, color: C.purple },
                      { label: 'Despachado', value: orders.filter((o:any)=>o.status==='dispatched'||o.status==='delivered').length, color: C.green },
                    ].map((s,i) => (
                      <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '12px 18px', textAlign: 'center' }}>
                        <p style={{ margin: 0, fontSize: '9px', color: C.sub, fontWeight: 700, textTransform: 'uppercase' }}>{s.label}</p>
                        <p style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: s.color }}>{s.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
                      <thead>
                        <tr style={{ background: C.bg }}>
                          {['ID', 'Fecha', 'Cliente', 'Restaurante', 'Total', 'Envío', 'Driver', 'Driver Gana', 'Plataforma', 'Estado'].map(h => (
                            <th key={h} style={{ padding: '14px 14px', textAlign: 'left', fontSize: '10px', fontWeight: 800, color: C.sub, textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {ordersFiltered.slice(0, 100).map((o:any) => {
                          const oDate      = o.createdAt?.seconds ? new Date(o.createdAt.seconds * 1000) : null;
                          const dFee       = Number(o.deliveryFee || 0);
                          const driverPay  = dFee * (1 - driverCommission / 100);
                          const platCut    = dFee * (driverCommission / 100);
                          const driverName = o.driverName || (o.driverId ? users.find((u:any)=>u.id===o.driverId)?.name || `#${o.driverId.slice(0,6)}` : null);
                          return (
                            <tr key={o.id} style={{ borderTop: `1px solid ${C.border}` }}>
                              <td style={{ padding: '11px 14px' }}><span style={{ fontSize: '11px', color: C.sub, fontFamily: 'monospace' }}>#{o.id.slice(0,6).toUpperCase()}</span></td>
                              <td style={{ padding: '11px 14px', fontSize: '11px', color: C.sub, whiteSpace: 'nowrap' }}>
                                {oDate ? oDate.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                              </td>
                              <td style={{ padding: '11px 14px', fontSize: '13px', fontWeight: 700, maxWidth: '110px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.customerName || 'Cliente'}</td>
                              <td style={{ padding: '11px 14px', fontSize: '12px', color: C.sub, maxWidth: '110px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.restaurantName || '—'}</td>
                              <td style={{ padding: '11px 14px', fontWeight: 900, color: C.accent, fontSize: '14px' }}>${(Number(o.total)||0).toFixed(2)}</td>
                              <td style={{ padding: '11px 14px', fontWeight: 700, color: C.blue, fontSize: '13px' }}>{dFee > 0 ? `$${dFee.toFixed(2)}` : '—'}</td>
                              <td style={{ padding: '11px 14px' }}>
                                {driverName
                                  ? <span style={{ background: `${C.purple}18`, color: C.purple, padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800, whiteSpace: 'nowrap' }}>{driverName}</span>
                                  : <span style={{ color: C.muted, fontSize: '11px' }}>Sin asignar</span>
                                }
                              </td>
                              <td style={{ padding: '11px 14px', fontWeight: 900, color: C.green, fontSize: '13px' }}>{dFee > 0 ? `$${driverPay.toFixed(2)}` : '—'}</td>
                              <td style={{ padding: '11px 14px', fontWeight: 700, color: C.purple, fontSize: '13px' }}>{platCut > 0 ? `$${platCut.toFixed(2)}` : '—'}</td>
                              <td style={{ padding: '11px 14px' }}>{statusChip(o.status || 'pending')}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {ordersFiltered.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '60px', color: C.sub }}>
                      <Package size={40} style={{ opacity: 0.2, marginBottom: '12px' }} />
                      <p style={{ margin: 0, fontWeight: 700 }}>Sin pedidos encontrados</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ΓöÇΓöÇ SETTINGS ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
            {tab === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <h1 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: 900 }}>Configuraci├│n de Plataforma</h1>
                <p style={{ margin: '0 0 32px', color: C.sub, fontSize: '13px' }}>Ajusta las comisiones y tarifas globales del sistema</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', maxWidth: '700px' }}>
                  {/* Commission rate */}
                  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '28px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                      <div style={{ width: '44px', height: '44px', background: `${C.purple}18`, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.purple }}>
                        <TrendingUp size={20}/>
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: 900, fontSize: '14px' }}>Comisi├│n por Venta</p>
                        <p style={{ margin: 0, fontSize: '11px', color: C.sub }}>% que cobra la plataforma</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <input
                        type="range" min={1} max={40} value={commissionRate}
                        onChange={e => setCommRate(Number(e.target.value))}
                        style={{ flex: 1, accentColor: C.purple }}
                      />
                      <span style={{ fontWeight: 900, fontSize: '22px', color: C.purple, minWidth: '50px' }}>{commissionRate}%</span>
                    </div>
                    <p style={{ margin: '12px 0 0', fontSize: '11px', color: C.sub }}>
                      En un pedido de $20 ΓåÆ comisi├│n: <strong style={{ color: C.purple }}>${(20 * commissionRate / 100).toFixed(2)}</strong>
                    </p>
                  </div>

                  {/* Delivery fee (Base + Km) */}
                  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '28px', gridColumn: 'span 2' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                      <div style={{ width: '44px', height: '44px', background: `${C.blue}18`, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.blue }}>
                        <Bike size={20}/>
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: 900, fontSize: '14px' }}>Par├ímetros de C├ílculo de Env├¡o (Rutas)</p>
                        <p style={{ margin: 0, fontSize: '11px', color: C.sub }}>Tarifa Base de Arranque y Costo por Kil├│metro (USD)</p>
                      </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      {/* Base fee */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                         <span style={{ fontSize: '13px', fontWeight: 700, minWidth: '80px' }}>Base ($)</span>
                         <input
                           type="range" min={0.5} max={5} step={0.25} value={baseDeliveryFee}
                           onChange={e => setBaseDeliveryFee(Number(e.target.value))}
                           style={{ flex: 1, accentColor: C.blue }}
                         />
                         <span style={{ fontWeight: 900, fontSize: '16px', color: C.blue, minWidth: '50px' }}>${baseDeliveryFee.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Per Km */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                         <span style={{ fontSize: '13px', fontWeight: 700, minWidth: '80px' }}>Por Km ($)</span>
                         <input
                           type="range" min={0.10} max={2.0} step={0.05} value={costPerKm}
                           onChange={e => setCostPerKm(Number(e.target.value))}
                           style={{ flex: 1, accentColor: C.blue }}
                         />
                         <span style={{ fontWeight: 900, fontSize: '16px', color: C.blue, minWidth: '50px' }}>${costPerKm.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ height: '1px', background: C.border, margin: '20px 0' }} />

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                      <div style={{ width: '44px', height: '44px', background: `${C.yellow}18`, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.yellow }}>
                        <Clock size={20}/>
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: 900, fontSize: '14px' }}>Estimaciones de Tiempo Geogr├ífico</p>
                        <p style={{ margin: 0, fontSize: '11px', color: C.sub }}>Tiempo base de preparaci├│n, m├ís los minutos por cada kil├│metro de viaje</p>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      {/* Base Time */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                         <span style={{ fontSize: '13px', fontWeight: 700, minWidth: '80px' }}>Base (Min)</span>
                         <input
                           type="range" min={5} max={45} step={5} value={basePrepTime}
                           onChange={e => setBasePrepTime(Number(e.target.value))}
                           style={{ flex: 1, accentColor: C.yellow }}
                         />
                         <span style={{ fontWeight: 900, fontSize: '16px', color: C.yellow, minWidth: '50px' }}>{basePrepTime}m</span>
                        </div>
                      </div>

                      {/* Min Per Km */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                         <span style={{ fontSize: '13px', fontWeight: 700, minWidth: '80px' }}>Min / Km</span>
                         <input
                           type="range" min={1} max={10} step={1} value={timePerKm}
                           onChange={e => setTimePerKm(Number(e.target.value))}
                           style={{ flex: 1, accentColor: C.yellow }}
                         />
                         <span style={{ fontWeight: 900, fontSize: '16px', color: C.yellow, minWidth: '50px' }}>{timePerKm}m</span>
                        </div>
                      </div>
                    </div>

                    <p style={{ margin: '16px 0 0', fontSize: '12px', color: C.sub }}>
                      Ejemplo 5 km: Costo env├¡o <strong style={{ color: C.blue }}>${(baseDeliveryFee + (5 * costPerKm)).toFixed(2)}</strong> | Tiempo Estimado <strong style={{ color: C.yellow }}>{basePrepTime + (5 * timePerKm)} mins</strong>
                    </p>
                  </div>

                  {/* Driver Delivery Commission */}
                  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '28px', gridColumn: 'span 2' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                      <div style={{ width: '44px', height: '44px', background: `${C.accent}18`, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.accent }}>
                        <DollarSign size={20}/>
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: 900, fontSize: '14px' }}>Comisi├│n por Env├¡o (Plataforma)</p>
                        <p style={{ margin: 0, fontSize: '11px', color: C.sub }}>% que se queda la plataforma del costo de env├¡o</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <input
                        type="range" min={0} max={100} step={5} value={driverCommission}
                        onChange={e => setDriverComm(Number(e.target.value))}
                        style={{ flex: 1, accentColor: C.accent }}
                      />
                      <span style={{ fontWeight: 900, fontSize: '22px', color: C.accent, minWidth: '60px' }}>{driverCommission}%</span>
                    </div>
                    <p style={{ margin: '12px 0 0', fontSize: '11px', color: C.sub }}>
                      En un env├¡o de $2.50: 
                      Plataforma se queda: <strong style={{ color: C.accent }}>${(2.5 * driverCommission / 100).toFixed(2)}</strong> | 
                      Driver recibe: <strong style={{ color: C.green }}>${(2.5 * (100 - driverCommission) / 100).toFixed(2)}</strong>
                    </p>
                  </div>

                  {/* Revenue projection */}
                  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '28px', gridColumn: 'span 2' }}>
                    <h3 style={{ margin: '0 0 20px', fontWeight: 900, fontSize: '15px' }}>Proyecci├│n de Ganancias Globales</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                      {[
                        { label: 'Revenue Total Procesado', value: `$${totalRevenue.toFixed(2)}`, color: C.accent },
                        { label: `Comisi├│n Ventas (${commissionRate}%)`, value: `$${(totalRevenue * commissionRate / 100).toFixed(2)}`, color: C.purple },
                        { label: `${orders.length} pedidos hist├│rico`, value: `Ver Dashboard`, color: C.blue },
                      ].map((k, i) => (
                        <div key={i} style={{ background: C.bg, borderRadius: '14px', padding: '20px' }}>
                          <p style={{ margin: '0 0 8px', fontSize: '11px', color: C.sub, fontWeight: 700 }}>{k.label}</p>
                          <p style={{ margin: 0, fontSize: '24px', fontWeight: 900, color: k.color }}>{k.value}</p>
                        </div>
                      ))}
                    </div>

                    <button 
                      onClick={saveSettings} 
                      disabled={saving}
                      style={{ width: '100%', padding: '16px', background: C.green, border: 'none', borderRadius: '14px', color: 'white', fontWeight: 900, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      {saving ? <RefreshCw className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                      Guardar Configuraci├│n Global de Delivery y Algoritmos
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </div>

      {/* ΓöÇΓöÇ CONFIRM MODAL ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
      <AnimatePresence>
        {confirmModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
            onClick={() => setConfirmModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
              style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '24px', padding: '32px', maxWidth: '420px', width: '100%' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ width: '52px', height: '52px', background: `${C.yellow}18`, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <AlertTriangle size={24} color={C.yellow} />
              </div>
              <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 900 }}>{confirmModal.title}</h2>
              <p style={{ margin: '0 0 28px', color: C.sub, fontSize: '14px', lineHeight: 1.5 }}>{confirmModal.sub}</p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setConfirmModal(null)} style={{ flex: 1, padding: '14px', background: C.muted + '33', border: `1px solid ${C.border}`, borderRadius: '12px', color: C.sub, fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}>
                  Cancelar
                </button>
                <button onClick={runConfirm} disabled={saving} style={{ flex: 1, padding: '14px', background: C.accent, border: 'none', borderRadius: '12px', color: 'white', fontWeight: 900, cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {saving ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle2 size={16}/>}
                  Confirmar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.muted}; border-radius: 99px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
        input[type=range] { cursor: pointer; }
      `}</style>
    </div>
  );
}
