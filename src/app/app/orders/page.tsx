'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  History, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  Loader2,
  Inbox,
  Navigation
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import Link from 'next/link';

export default function MyOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'orders'),
      where('customerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(ordersList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'cooking': return '#3B82F6';
      case 'delivered': return '#16A34A';
      default: return '#9CA3AF';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'cooking': return 'En cocina';
      case 'delivered': return 'Entregado';
      default: return status;
    }
  };

  return (
    <div style={{ minHeight: '100dvh', background: '#FAFAFA', fontFamily: 'system-ui, -apple-system, sans-serif', paddingBottom: '100px' }}>
      
      {/* ── HEADER ── */}
      <div style={{ background: 'white', padding: '24px 16px', borderBottom: '1px solid #F0F0F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <History size={20} color="#16A34A" />
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#16A34A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mis Compras</span>
        </div>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#111' }}>Historial de Pedidos</h1>
      </div>

      {/* ── ORDERS LIST ── */}
      <div style={{ padding: '16px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: '60px', gap: '16px' }}>
            <Loader2 className="animate-spin" color="#16A34A" size={32} />
            <p style={{ color: '#9CA3AF', fontSize: '13px', fontWeight: 600 }}>Cargando tus pedidos...</p>
          </div>
        ) : orders.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 16px', gap: '16px', background: 'white', borderRadius: '24px', textAlign: 'center', border: '1px solid #F0F0F0' }}>
             <Inbox size={48} color="#D1D5DB" />
             <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#111' }}>Aún no hay pedidos</h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#6B7280' }}>¡Pide algo rico hoy mismo!</p>
             </div>
             <Link href="/app" style={{ textDecoration: 'none' }}>
               <button style={{ background: '#16A34A', color: 'white', border: 'none', borderRadius: '12px', padding: '12px 24px', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
                 Ver Restaurantes
               </button>
             </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {orders.map((ord, i) => (
              <Link key={ord.id} href={`/app/track/${ord.id}`} style={{ textDecoration: 'none' }}>
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  style={{ background: 'white', borderRadius: '20px', padding: '16px', border: '1px solid #F3F4F6', position: 'relative', overflow: 'hidden' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', border: '1px solid #F0F0F0' }}>
                       {ord.restaurantName?.includes('Pizza') ? '🍕' : ord.restaurantName?.includes('Sushi') ? '🍣' : '🍔'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 2px', fontSize: '15px', fontWeight: 800, color: '#111' }}>{ord.restaurantName || 'Restaurante'}</h4>
                      <p style={{ margin: 0, fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>
                        {ord.createdAt?.toDate().toLocaleDateString() || 'Hoy'} · {ord.items?.length || 0} items
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ display: 'block', fontSize: '14px', fontWeight: 800, color: '#111' }}>${ord.total?.toFixed(2)}</span>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: getStatusColor(ord.status), textTransform: 'uppercase' }}>
                        {getStatusLabel(ord.status)}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid #F9FAFB' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                       {ord.items?.slice(0, 3).map((it: any, idx: number) => (
                         <div key={idx} style={{ padding: '4px 8px', background: '#F3F4F6', borderRadius: '4px', fontSize: '10px', color: '#4B5563', fontWeight: 600 }}>
                           {it.name}
                         </div>
                       ))}
                    </div>
                    <ChevronRight size={18} color="#D1D5DB" />
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
