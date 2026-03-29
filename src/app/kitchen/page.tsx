'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChefHat, Clock, CheckCircle2, History, X, Bike, Zap } from 'lucide-react';
import { db } from '@/lib/firebase';
import {
  collection, onSnapshot, query, where,
  doc, updateDoc, serverTimestamp, limit,
} from 'firebase/firestore';
import {
  KDS_ACTIVE_STATUSES,
  KDS_DONE_STATUSES,
  KDS_TRANSITIONS,
  STATUS_LABELS,
  STATUS_COLORS,
  TIMESTAMP_FIELDS,
  type OrderStatus,
} from '@/lib/orderStateMachine';

/* ─── Timer ──────────────────────────────────────────────────────────────── */
function useNow() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 20_000);
    return () => clearInterval(t);
  }, []);
  return now;
}
function mins(createdAt: any, now: number) {
  if (!createdAt?.seconds) return 0;
  return Math.floor((now / 1000 - createdAt.seconds) / 60);
}
function urgColor(m: number) {
  if (m >= 15) return '#EF4444';
  if (m >= 8)  return '#F59E0B';
  return '#22C55E';
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function KitchenDisplay() {
  const now = useNow();
  const [activeOrders,    setActiveOrders]    = useState<any[]>([]);
  const [completedOrders, setCompletedOrders] = useState<any[]>([]);
  const [selectedOrder,   setSelectedOrder]   = useState<any>(null);

  useEffect(() => {
    const qA = query(collection(db, 'orders'), where('status', 'in', KDS_ACTIVE_STATUSES));
    const uA = onSnapshot(qA, s =>
      setActiveOrders(
        s.docs.map(d => ({ id: d.id, ...d.data() }))
          .sort((a: any, b: any) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0))
      )
    );
    const qD = query(collection(db, 'orders'), where('status', 'in', KDS_DONE_STATUSES), limit(12));
    const uD = onSnapshot(qD, s =>
      setCompletedOrders(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return () => { uA(); uD(); };
  }, []);

  const advance = async (order: any) => {
    const next = KDS_TRANSITIONS[order.status as OrderStatus];
    if (!next) return;
    const tsf = TIMESTAMP_FIELDS[next];
    await updateDoc(doc(db, 'orders', order.id), {
      status: next,
      ...(tsf ? { [tsf]: serverTimestamp() } : {}),
    });
    setSelectedOrder(null);
  };

  const pending = activeOrders.filter(o => o.status === 'accepted');
  const cooking = activeOrders.filter(o => o.status === 'preparing');

  const columns = [
    { id: 'pending', label: 'PENDIENTE COCINA', color: '#F59E0B', orders: pending, btnLabel: 'COMENZAR', btnColor: '#FF5722' },
    { id: 'cooking', label: 'COCINANDO',        color: '#FF5722', orders: cooking, btnLabel: 'LISTO ✓',  btnColor: '#22C55E' },
  ];

  return (
    <div style={{
      height: '100dvh', background: '#0A0A0C', color: '#F4F4F5',
      fontFamily: '"Inter", "SF Pro Display", sans-serif',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <header style={{
        height: '48px', flexShrink: 0,
        background: '#111114', borderBottom: '1px solid #1F1F23',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ChefHat size={18} color="#FF5722" />
          <span style={{ fontWeight: 900, fontSize: '14px', letterSpacing: '0.14em' }}>KITCHEN DISPLAY</span>
          <span style={{ fontSize: '11px', fontWeight: 900, color: '#FF5722', letterSpacing: '0.1em' }}>[KDS]</span>
        </div>
        <div style={{ display: 'flex', gap: '20px' }}>
          {[
            { label: 'PENDIENTE', n: pending.length, c: '#F59E0B' },
            { label: 'COCINANDO', n: cooking.length, c: '#FF5722' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.c }} />
              <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 700 }}>{s.label}</span>
              <span style={{ fontSize: '16px', fontWeight: 900, color: s.c }}>{s.n}</span>
            </div>
          ))}
        </div>
      </header>

      {/* ── 2 VERTICAL COLUMNS (Left / Right) ──────────────────────────── */}
      <main style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {columns.map((col, ci) => (
          <div key={col.id} style={{
            flex: 1, 
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            borderRight: ci === 0 ? '2px solid #1A1A1E' : 'none',
          }}>
            {/* Column Label */}
            <div style={{
              height: '32px', flexShrink: 0,
              background: '#0D0D10', borderBottom: '1px solid #1F1F23',
              display: 'flex', alignItems: 'center', gap: '8px', padding: '0 16px',
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.color, display: 'inline-block', flexShrink: 0 }} />
              <span style={{ fontSize: '12px', fontWeight: 900, color: col.color, letterSpacing: '0.1em' }}>
                {col.label}
              </span>
              <span style={{ fontSize: '12px', color: '#4B5563', fontWeight: 700 }}>({col.orders.length})</span>
            </div>

            {/* Tickets Area — Horizontal Scroll */}
            <div style={{
              flex: 1, 
              display: 'flex', flexDirection: 'row', 
              overflowX: 'auto', overflowY: 'hidden',
              padding: '12px', gap: '12px',
              scrollbarWidth: 'thin', scrollbarColor: '#27272A #0A0A0C',
            }}>
              {col.orders.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', opacity: 0.35 }}>
                  {ci === 0 ? <Clock size={28} color="#6B7280" /> : <ChefHat size={28} color="#6B7280" />}
                  <span style={{ fontSize: '15px', fontWeight: 800, color: '#6B7280' }}>
                    {ci === 0 ? 'Sin pedidos pendientes' : 'Sin órdenes en cocina'}
                  </span>
                </div>
              ) : (
                col.orders.map((order, idx) => {
                  const m  = mins(order.createdAt, now);
                  const uc = urgColor(m);
                  return (
                    <Ticket
                      key={order.id}
                      order={order}
                      num={idx + 1}
                      m={m}
                      urgency={uc}
                      accentColor={col.color}
                      btnLabel={col.btnLabel}
                      btnColor={col.btnColor}
                      onAdvance={() => advance(order)}
                      onSelect={() => setSelectedOrder({ ...order, displayNum: idx + 1 })}
                    />
                  );
                })
              )}
            </div>
          </div>
        ))}
      </main>

      {/* ── FOOTER — recent done orders ────────────────────────────────── */}
      <footer style={{
        height: '60px', flexShrink: 0,
        background: '#0D0D10', borderTop: '1px solid #1F1F23',
        display: 'flex', alignItems: 'center', gap: '12px', padding: '0 20px', overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <History size={14} color="#4B5563" />
          <span style={{ fontSize: '11px', fontWeight: 900, color: '#4B5563', letterSpacing: '0.1em' }}>RECIENTES</span>
        </div>
        <div style={{ display: 'flex', gap: '10px', flex: 1, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {completedOrders.length === 0
            ? <span style={{ fontSize: '13px', color: '#2D2D34', fontWeight: 700 }}>Sin pedidos recientes</span>
            : completedOrders.map((o, idx) => {
                const sc = STATUS_COLORS[o.status as OrderStatus] || '#22C55E';
                return (
                  <div key={o.id}
                    onClick={() => setSelectedOrder({ ...o, displayNum: idx + 1 })}
                    style={{ flexShrink: 0, background: '#141416', border: `1px solid ${sc}33`, borderLeft: `3px solid ${sc}`, borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', minWidth: '130px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 900, color: sc }}>{STATUS_LABELS[o.status as OrderStatus] || o.status}</span>
                      {o.driverName && <span style={{ fontSize: '10px', color: '#3B82F6', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '3px' }}><Bike size={10} /> {o.driverName.split(' ')[0]}</span>}
                    </div>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', fontWeight: 800, color: '#D1D5DB', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.customerName || 'Cliente'}</p>
                  </div>
                );
              })}
        </div>
      </footer>

      {/* ── DETAIL MODAL ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelectedOrder(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#111114', width: '100%', maxWidth: '460px', borderRadius: '16px', border: '1px solid #27272A', overflow: 'hidden' }}>
              <div style={{ background: STATUS_COLORS[selectedOrder.status as OrderStatus] || '#FF5722', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '11px', fontWeight: 900, opacity: 0.8, letterSpacing: '0.1em' }}>ORDEN #{selectedOrder.displayNum}</p>
                  <h2 style={{ margin: '2px 0 0', fontSize: '20px', fontWeight: 900 }}>{selectedOrder.customerName || 'Cliente'}</h2>
                </div>
                <button onClick={() => setSelectedOrder(null)} style={{ background: 'rgba(0,0,0,0.2)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' }}><X size={18} /></button>
              </div>
              <div style={{ padding: '20px 24px', maxHeight: '55vh', overflowY: 'auto' }}>
                {selectedOrder.items?.map((item: any, idx: number) => (
                  <div key={idx} style={{ display: 'flex', gap: '14px', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #1F1F23' }}>
                    <div style={{ minWidth: '36px', height: '36px', background: STATUS_COLORS[selectedOrder.status as OrderStatus] || '#FF5722', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 900 }}>{item.quantity}</div>
                    <div>
                      <p style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>{item.name}</p>
                      {item.notes && <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#F59E0B', fontWeight: 700 }}>{item.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
              {KDS_TRANSITIONS[selectedOrder.status as OrderStatus] && (
                <div style={{ padding: '0 24px 24px' }}>
                  <button onClick={() => advance(selectedOrder)}
                    style={{ width: '100%', padding: '16px', background: selectedOrder.status === 'accepted' ? '#FF5722' : '#22C55E', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <CheckCircle2 size={20} />
                    {selectedOrder.status === 'accepted' ? 'COMENZAR A COCINAR' : 'MARCAR LISTO'}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Ticket — 100% height of parent, fixed width ────────────────────────── */
function Ticket({ order, num, m, urgency, accentColor, btnLabel, btnColor, onAdvance, onSelect }: {
  order: any; num: number; m: number; urgency: string;
  accentColor: string; btnLabel: string; btnColor: string;
  onAdvance: () => void; onSelect: () => void;
}) {
  const isUrgent = urgency === '#EF4444';
  const items: any[] = order.items || [];

  return (
    <div
      onClick={onSelect}
      style={{
        width: '260px',          /* Wider ticket for easier reading */
        height: '100%',          /* FULL HEIGHT OF THE CONTAINER ALWAYS */
        flexShrink: 0,
        background: '#141416',
        border: `1px solid ${isUrgent ? '#EF444450' : '#1F1F23'}`,
        borderTop: `4px solid ${accentColor}`,
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        transition: 'background 0.2s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = '#1A1A1E')}
      onMouseLeave={e => (e.currentTarget.style.background = '#141416')}
    >
      {/* ── Ticket Header ── */}
      <div style={{
        flexShrink: 0,
        background: '#0F0F12',
        borderBottom: '2px solid #1F1F23',
        padding: '12px 14px',
        display: 'flex', flexDirection: 'column', gap: '8px',
      }}>
        {/* Number + Urgency */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{
            background: accentColor, color: 'white',
            fontWeight: 900, fontSize: '20px',
            width: '38px', height: '38px', borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
          }}>
            {num}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {isUrgent && <Zap size={14} color="#EF4444" fill="#EF4444" />}
            <span style={{
              fontSize: '13px', fontWeight: 900, color: urgency,
              background: `${urgency}15`, padding: '4px 10px', borderRadius: '6px',
              border: `1px solid ${urgency}30`,
              display: 'flex', alignItems: 'center', gap: '5px',
            }}>
              <Clock size={12} /> {m < 1 ? '<1m' : `${m}m`}
            </span>
          </div>
        </div>
        {/* Customer Name */}
        <span style={{ fontWeight: 800, fontSize: '15px', color: '#E4E4E7', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {order.customerName || 'Cliente en local'}
        </span>
      </div>

      {/* ── Ticket Items — fills remaining space ── */}
      <div style={{ flex: 1, padding: '12px 14px', overflowY: 'auto', scrollbarWidth: 'none' }}>
        {items.map((item, i) => (
          <div key={i} style={{
            display: 'flex', gap: '10px', alignItems: 'flex-start',
            padding: '8px 0',
            borderBottom: i < items.length - 1 ? '1px dashed #27272A' : 'none',
          }}>
            <span style={{
              fontWeight: 900, fontSize: '18px', color: accentColor,
              minWidth: '28px', lineHeight: '1.2', flexShrink: 0,
            }}>
              {item.quantity}×
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '15px', fontWeight: 800, color: '#F4F4F5', lineHeight: '1.3' }}>
                {item.name}
              </span>
              {item.notes && (
                <span style={{ fontSize: '12px', color: '#F59E0B', fontWeight: 800, background: '#F59E0B10', padding: '2px 8px', borderRadius: '4px', display: 'inline-block' }}>
                  ⚠ {item.notes}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Footer Button ── */}
      <div style={{
        flexShrink: 0,
        background: '#0F0F12',
        borderTop: '1px solid #1F1F23',
        padding: '14px',
        display: 'flex', flexDirection: 'column', gap: '8px',
      }}>
        <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: 800, textAlign: 'center' }}>
          {items.length} {items.length === 1 ? 'ARTÍCULO' : 'ARTÍCULOS'}
        </span>
        <button
          onClick={e => { e.stopPropagation(); onAdvance(); }}
          style={{
            width: '100%', padding: '14px 0',
            background: btnColor, color: 'white',
            border: 'none', borderRadius: '8px',
            fontSize: '14px', fontWeight: 900,
            cursor: 'pointer', letterSpacing: '0.08em',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            boxShadow: `0 4px 15px ${btnColor}40`
          }}
        >
          <CheckCircle2 size={16} /> {btnLabel}
        </button>
      </div>
    </div>
  );
}
