'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClipboardCheck, 
  Clock, 
  MapPin, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Search, 
  LayoutList, 
  ChevronRight, 
  Plus, 
  History,
  CheckCircle2,
  Loader2,
  BellRing
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy, doc, updateDoc } from 'firebase/firestore';

export default function RestaurantDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Stats calculation
  const totalSales = orders.reduce((acc, ord) => acc + (ord.total || 0), 0);
  const totalOrders = orders.length;

  useEffect(() => {
    const q = query(
      collection(db, 'orders'),
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
  }, []);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus
      });
    } catch (err) {
      console.error('Update status error:', err);
    }
  };

  return (
    <div className="flex flex-col gap-10 min-w-0 text-left">
      
      {/* ── Stats Header ── */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-8 rounded-[2rem] border border-gray-100 flex flex-col gap-4 shadow-sm group hover:shadow-xl transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-2xl bg-orange-50 text-orange-500">
                <DollarSign size={20} />
              </div>
              <span className="text-[10px] font-black text-orange-500 bg-orange-50 px-2 py-1 rounded-full uppercase tracking-widest">
                +15%
              </span>
            </div>
            <div>
              <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-1">Ventas Totales</p>
              <h4 className="text-3xl font-black text-[#111] tracking-tighter">${totalSales.toFixed(2)}</h4>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-8 rounded-[2rem] border border-gray-100 flex flex-col gap-4 shadow-sm group hover:shadow-xl transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-2xl bg-blue-50 text-blue-500">
                <ClipboardCheck size={20} />
              </div>
              <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-1 rounded-full uppercase tracking-widest">
                Real-time
              </span>
            </div>
            <div>
              <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-1">Pedidos Hoy</p>
              <h4 className="text-3xl font-black text-[#111] tracking-tighter">{totalOrders}</h4>
            </div>
          </motion.div>
          {/* ... other stats cards ... */}
      </section>

      <div className="flex flex-col xl:flex-row gap-10">
        
        {/* Active Orders Section */}
        <section className="flex-1 flex flex-col gap-6 min-w-0">
          <div className="flex items-center justify-between px-2">
             <h3 className="text-xl font-black text-[#111] tracking-tight uppercase text-xs flex items-center gap-3 underline decoration-orange-500/20 decoration-4">
               <BellRing className="text-orange-500 animate-bounce" size={18} />
               Recepción de Pedidos
             </h3>
          </div>

          <div className="flex flex-col gap-4">
             {loading ? (
               <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white rounded-[3rem] border border-gray-100 shadow-sm">
                  <Loader2 className="animate-spin text-orange-500" size={32} />
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Conectando con la cocina...</p>
               </div>
             ) : orders.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white rounded-[3rem] border border-gray-100 shadow-sm">
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Esperando nuevos pedidos...</p>
               </div>
             ) : (
               <AnimatePresence>
                 {orders.map((ord, i) => (
                   <motion.div 
                     key={ord.id}
                     initial={{ opacity: 0, x: -20, scale: 0.98 }}
                     animate={{ opacity: 1, x: 0, scale: 1 }}
                     exit={{ opacity: 0, scale: 0.95 }}
                     className="bg-white border border-gray-100 p-8 rounded-[2.5rem] flex items-center justify-between shadow-sm group hover:border-orange-500/20 transition-all overflow-hidden relative"
                   >
                     <div className="flex items-center gap-6 relative z-10 w-full">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black ${
                          ord.status === 'pending' ? 'bg-orange-50 text-orange-500 shadow-lg shadow-orange-500/10 active-glow' :
                          ord.status === 'cooking' ? 'bg-blue-50 text-blue-500' :
                          ord.status === 'ready' ? 'bg-green-50 text-green-500' :
                          'bg-gray-50 text-gray-400'
                        }`}>
                          {ord.id.slice(-3).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <h5 className="font-black text-[#111] uppercase text-sm tracking-tight">{ord.customerName}</h5>
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                            {ord.items?.length} productos • ${ord.total?.toFixed(2)}
                          </span>
                        </div>

                        <div className="flex items-center gap-4">
                          {ord.status === 'pending' && (
                             <button
                               onClick={() => updateOrderStatus(ord.id, 'cooking')}
                               className="bg-orange-500 text-white font-black px-6 py-3 rounded-2xl text-[10px] uppercase tracking-widest shadow-xl shadow-orange-500/20 hover:scale-105 transition-all"
                             >
                               Aceptar
                             </button>
                          )}
                          {ord.status === 'cooking' && (
                             <button
                               onClick={() => updateOrderStatus(ord.id, 'ready')}
                               className="bg-blue-500 text-white font-black px-6 py-3 rounded-2xl text-[10px] uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-105 transition-all"
                             >
                               Listo para Driver
                             </button>
                          )}
                          {ord.status === 'ready' && (
                             <div className="text-green-500 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                                <CheckCircle2 size={16} /> Esperando Driver
                             </div>
                          )}
                          <button className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 hover:text-orange-500 transition-colors">
                             <ChevronRight size={20} />
                          </button>
                        </div>
                     </div>

                     <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                        ord.status === 'pending' ? 'bg-orange-500' :
                        ord.status === 'cooking' ? 'bg-blue-500' :
                        'bg-green-500'
                     }`} />
                   </motion.div>
                 ))}
               </AnimatePresence>
             )}
          </div>
        </section>
      </div>
    </div>
  );
}
