'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  History, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Star, 
  ArrowRight, 
  ChevronRight, 
  RefreshCcw, 
  Navigation, 
  MoreVertical,
  Loader2,
  Inbox
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

  return (
    <div className="flex flex-col gap-10">
      
      {/* ── Page Header ── */}
      <section className="flex flex-col md:flex-row md:items-end justify-between px-2 gap-6">
        <div>
          <div className="flex items-center gap-3 bg-orange-50 text-orange-500 font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-widest w-fit mb-4 border border-orange-100">
            <History size={14} />
            Mis Compras
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-[#111] tracking-tighter">Historial de <br /> <span className="text-orange-500">Pedidos</span></h1>
        </div>
      </section>

      {/* ── Orders List ── */}
      <section className="flex flex-col gap-6 min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-orange-500" size={40} />
            <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">Cargando tus pedidos...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-6 bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
             <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-200">
                <Inbox size={40} />
             </div>
             <div className="text-center">
                <h3 className="text-xl font-black text-[#111] uppercase tracking-tight mb-2">No tienes pedidos aún</h3>
                <p className="text-gray-400 text-sm font-medium">¡Anímate a realizar tu primera compra!</p>
             </div>
             <button onClick={() => window.location.href='/order'} className="bg-orange-500 text-white font-black py-4 px-8 rounded-2xl shadow-xl shadow-orange-500/20 hover:scale-105 transition-all text-xs uppercase tracking-widest">
               Ver Restaurantes
             </button>
          </div>
        ) : (
          <AnimatePresence>
            {orders.map((ord, i) => (
              <motion.div 
                key={ord.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border border-gray-100 rounded-[2.5rem] p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-10 shadow-sm hover:shadow-2xl hover:shadow-black/5 transition-all group overflow-hidden relative"
              >
                <div className="flex items-center gap-8 relative z-10">
                  <div className="w-20 h-20 md:w-24 md:h-24 bg-gray-50 rounded-[2rem] flex items-center justify-center text-3xl group-hover:scale-110 group-hover:rotate-6 transition-transform border border-gray-100 shadow-sm">
                     {ord.restaurantName?.includes('Pizza') ? '🍕' : ord.restaurantName?.includes('Sushi') ? '🍣' : '🍔'}
                  </div>
                  <div className="flex flex-col gap-1.5 text-left">
                    <div className="flex items-center gap-3">
                       <h4 className="text-xl font-black text-[#111] tracking-tight group-hover:text-orange-500 transition-colors uppercase leading-none">{ord.restaurantName || 'Restaurante'}</h4>
                       <span className="text-[10px] bg-gray-50 text-gray-400 font-bold px-3 py-1 rounded-full uppercase tracking-tighter border border-gray-100">{ord.id.slice(-5).toUpperCase()}</span>
                    </div>
                    <div className="flex items-center gap-4 text-gray-400 font-bold text-xs uppercase tracking-tight">
                      <div className="flex items-center gap-1.5"><Clock size={14} /> {ord.createdAt?.toDate().toLocaleString() || 'Reciente'}</div>
                    </div>
                    <p className="text-xs text-gray-400 font-medium mt-1 line-clamp-1">
                      {ord.items?.map((it: any) => it.name).join(', ')}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center gap-8 md:gap-14 relative z-10">
                   <div className="flex flex-col md:items-end">
                      <span className="text-2xl font-black text-[#111] tracking-tighter">${ord.total?.toFixed(2)}</span>
                      <div className={`flex items-center gap-1.5 font-black text-[9px] uppercase tracking-widest mt-1 ${
                        ord.status === 'pending' ? 'text-orange-500' :
                        ord.status === 'cooking' ? 'text-blue-500' :
                        ord.status === 'delivered' ? 'text-green-500' : 'text-gray-400'
                      }`}>
                        {ord.status === 'pending' ? <Navigation size={12} className="rotate-45" /> : 
                         ord.status === 'delivered' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                        {ord.status === 'pending' ? 'Pendiente' : ord.status === 'cooking' ? 'En cocina' : ord.status === 'delivered' ? 'Entregado' : ord.status}
                      </div>
                   </div>
                   
                   <div className="flex items-center gap-3">
                      {ord.status !== 'delivered' && (
                        <Link
                          href={`/order/track/${ord.id}`}
                          className="bg-orange-500 text-white p-4 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-orange-500/20 hover:bg-orange-600"
                        >
                          <Navigation size={14} /> Seguir
                        </Link>
                      )}
                      <button className="flex-1 md:w-40 bg-gray-50 hover:bg-orange-500 hover:text-white p-4 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all shadow-sm">
                        Ver detalles <ChevronRight size={14} />
                      </button>
                   </div>
                </div>

                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                  ord.status === 'pending' ? 'bg-orange-500' :
                  ord.status === 'cooking' ? 'bg-blue-500' :
                  ord.status === 'delivered' ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </section>

    </div>
  );
}
