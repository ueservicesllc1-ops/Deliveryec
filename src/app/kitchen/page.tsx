'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChefHat, Clock, CheckCircle2, 
  History, X, Info, Utensils
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, doc, updateDoc, limit } from 'firebase/firestore';

export default function KitchenDisplay() {
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [completedOrders, setCompletedOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  useEffect(() => {
    const qActive = query(collection(db, 'orders'), where('status', '==', 'cooking'));
    const unsubActive = onSnapshot(qActive, (snap) => {
      setActiveOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qDone = query(collection(db, 'orders'), where('status', 'in', ['ready', 'dispatched']), limit(10));
    const unsubDone = onSnapshot(qDone, (snap) => {
      setCompletedOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubActive(); unsubDone(); };
  }, []);

  const markAsReady = async (id: string) => {
    await updateDoc(doc(db, 'orders', id), { status: 'ready' });
    setSelectedOrder(null);
  };

  return (
    <div style={{ height: '100dvh', background: '#09090B', color: '#FAFAFA', fontFamily: '"Inter", sans-serif', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      <header style={{ background: '#18181B', padding: '16px 32px', borderBottom: '2px solid #27272A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <ChefHat size={32} color="#FF5722" />
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 900, letterSpacing: '-0.5px' }}>KITCHEN DISPLAY <span style={{ color: '#FF5722' }}>[KDS]</span></h1>
        </div>
        <div style={{ background: '#27272A', padding: '8px 16px', borderRadius: '12px', fontSize: '18px', fontWeight: 900, border: '1px solid #3F3F46' }}>
           EN COLA: <span style={{ color: '#FF5722' }}>{activeOrders.length}</span>
        </div>
      </header>

      <main style={{ flex: 1, padding: '32px', overflowX: 'auto', display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
        <AnimatePresence>
          {activeOrders.length === 0 ? (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ width: '100%', textAlign: 'center', marginTop: '60px' }}>
               <CheckCircle2 size={80} color="#27272A" style={{ marginBottom: '20px' }} />
               <h2 style={{ color: '#71717A', fontWeight: 800 }}>MESA LIMPIA: TODO COCINADO</h2>
             </motion.div>
          ) : (
            activeOrders
              .sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0))
              .map((order, idx) => {
                const orderNum = idx + 1;
                return (
                  <motion.div
                    key={order.id}
                    layout
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setSelectedOrder({ ...order, displayNum: orderNum })}
                    style={{ minWidth: '280px', maxWidth: '280px', background: '#18181B', borderRadius: '20px', overflow: 'hidden', border: '2px solid #27272A', cursor: 'pointer', maxHeight: '520px', display: 'flex', flexDirection: 'column' }}
                  >
                    <div style={{ background: '#FF5722', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <div>
                         <span style={{ fontSize: '28px', fontWeight: 900 }}>#{orderNum}</span>
                         <p style={{ margin: '2px 0 0', fontSize: '13px', fontWeight: 800, color: 'rgba(255,255,255,0.8)' }}>{order.customerName || 'Invitado'}</p>
                       </div>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 800 }}>
                          <Clock size={16} /> COCINANDO
                       </div>
                    </div>
                    <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
                       {order.items?.map((item: any, i: number) => (
                         <div key={i} style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                            <div style={{ minWidth: '36px', height: '36px', background: 'white', color: 'black', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 900 }}>{item.quantity}</div>
                            <p style={{ margin: 0, fontSize: '18px', fontWeight: 800, lineHeight: 1.2 }}>{item.name}</p>
                         </div>
                       ))}
                    </div>
                    <div style={{ padding: '20px', borderTop: '2px solid #27272A' }}>
                       <button onClick={(e) => { e.stopPropagation(); markAsReady(order.id); }} style={{ width: '100%', padding: '20px', background: '#22C55E', color: 'white', border: 'none', borderRadius: '16px', fontSize: '18px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                         <CheckCircle2 size={24} /> LISTO
                       </button>
                    </div>
                  </motion.div>
                );
              })
          )}
        </AnimatePresence>
      </main>

      <footer style={{ background: '#111', borderTop: '2px solid #27272A', padding: '16px 32px', minHeight: '120px' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', color: '#71717A' }}>
            <History size={18} />
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 900, textTransform: 'uppercase' }}>Recientes</h3>
         </div>
         <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
              {completedOrders.length === 0 ? (
                <p style={{ color: '#3F3F46', margin: 0, fontSize: '14px' }}>No hay pedidos recientes</p>
              ) : (
                completedOrders.map((o, idx) => (
                  <div 
                    key={o.id} 
                    onClick={() => setSelectedOrder({ ...o, displayNum: completedOrders.length - idx })} 
                    style={{ 
                      flexShrink: 0, 
                      minWidth: '220px', 
                      background: '#18181B', 
                      padding: '16px', 
                      borderRadius: '16px', 
                      borderLeft: '4px solid #22C55E', 
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 900, fontSize: '14px', color: '#22C55E' }}>ORDEN #{completedOrders.length - idx}</span>
                      <span style={{ fontSize: '11px', color: '#71717A' }}>
                         {o.createdAt?.seconds ? new Date(o.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#FAFAFA', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {o.customerName || 'Cliente Invitado'}
                    </p>
                  </div>
                ))
              )}
         </div>
      </footer>

      <AnimatePresence>
        {selectedOrder && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setSelectedOrder(null)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} onClick={e => e.stopPropagation()} style={{ background: '#18181B', width: '100%', maxWidth: '600px', borderRadius: '32px', border: '2px solid #3F3F46', overflow: 'hidden' }}>
              <div style={{ padding: '32px', background: '#27272A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <div>
                   <h2 style={{ margin: 0, fontSize: '32px', fontWeight: 900 }}>ORDEN #{selectedOrder.displayNum}</h2>
                   <p style={{ margin: 0, color: '#FF5722', fontWeight: 800 }}>ESTADO: {selectedOrder.status?.toUpperCase() || 'PAGADO'}</p>
                 </div>
                 <button onClick={() => setSelectedOrder(null)} style={{ background: '#3F3F46', border: 'none', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
              </div>

              <div style={{ padding: '32px' }}>
                 <p style={{ fontSize: '12px', fontWeight: 900, color: '#71717A', textTransform: 'uppercase', marginBottom: '20px', letterSpacing: '1px' }}>{selectedOrder.customerName || 'Invitado'}</p>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {selectedOrder.items?.map((item: any, idx: number) => (
                      <div key={idx} style={{ display: 'flex', gap: '20px' }}>
                         <div style={{ minWidth: '50px', height: '50px', background: '#FF5722', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 900 }}>{item.quantity}</div>
                         <div>
                            <h3 style={{ margin: 0, fontSize: '22px', fontWeight: 800 }}>{item.name}</h3>
                            {item.notes && <p style={{ margin: '8px 0 0', color: '#FF5722', fontWeight: 700 }}>{item.notes}</p>}
                         </div>
                      </div>
                    ))}
                 </div>
              </div>

              {selectedOrder.status === 'cooking' && (
                <div style={{ padding: '32px', borderTop: '2px solid #27272A' }}>
                  <button onClick={() => markAsReady(selectedOrder.id)} style={{ width: '100%', padding: '24px', background: '#22C55E', color: 'white', border: 'none', borderRadius: '20px', fontSize: '20px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                    <CheckCircle2 size={24} /> TERMINAR PEDIDO AHORA
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
