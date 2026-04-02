'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { 
  Clock, CheckCircle2, Bike, Package, ChefHat, 
  ChevronLeft, Info, PhoneCall, MessageSquare, Star
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const LiveMap = dynamic(() => import('@/components/LiveMap'), { ssr: false });

const statusSteps = [
  { key: 'pending',    icon: <Package size={20}/>,       label: 'Pedido recibido',    sub: 'El restaurante está revisando tu orden' },
  { key: 'cooking',   icon: <ChefHat size={20}/>,        label: 'En preparación',     sub: 'Cocinando con todo el amor del mundo' },
  { key: 'ready',     icon: <Bike size={20}/>,           label: 'Driver en camino',   sub: 'Tu repartidor ya recogió tu pedido' },
  { key: 'delivered', icon: <CheckCircle2 size={20}/>,   label: '¡Entregado!',        sub: 'Disfruta tu comida 🎉' },
];

const statusIndex: Record<string, number> = {
  pending: 0, cooking: 1, ready: 2, delivered: 3
};

export default function TrackOrderPage({ params }: { params: Promise<{ orderId: string }> }) {
  const unwrappedParams = React.use(params);
  const orderId = unwrappedParams.orderId;
  const [order, setOrder]               = useState<any>(null);
  const [driverPos, setDriverPos]       = useState<[number,number]|null>(null);
  const [loading, setLoading]           = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!orderId) return;
    const unsub = onSnapshot(doc(db, 'orders', orderId), (snap) => {
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() };
        setOrder(data);
        if ((data as any).driverLocation) {
          setDriverPos([(data as any).driverLocation.lat, (data as any).driverLocation.lng]);
        }
      }
      setLoading(false);
    });
    return () => unsub();
  }, [orderId]);

  const currentStep = order ? (statusIndex[order.status] ?? 0) : 0;

  return (
    <div className="w-full min-h-[100dvh] bg-gray-50 font-sans flex flex-col relative">
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">
      
      {/* ── HEADER ── */}
      <div className="px-5 py-4 bg-white border-b border-gray-100 flex items-center gap-4 sticky top-0 z-50 shadow-sm">
        <button 
          onClick={() => router.back()}
          className="w-10 h-10 bg-gray-100 border-none rounded-xl flex items-center justify-center text-gray-900 cursor-pointer"
        >
          <ChevronLeft size={20} strokeWidth={2.5}/>
        </button>
        <div className="flex-1">
          <h1 className="text-[17px] font-black m-0 tracking-tight text-gray-900">Sigue tu pedido</h1>
          <p className="text-[10px] text-gray-400 m-0 font-bold uppercase tracking-wider">
            ID: {order?.id ? `#${order.id.slice(-6).toUpperCase()}` : 'Cargando...'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.4)] animate-pulse" />
          <span className="text-[10px] text-green-500 font-extrabold uppercase">VIVO</span>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center flex-col gap-4">
          <div className="animate-spin w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full" />
          <p className="text-gray-400 text-sm font-bold">Conectando...</p>
        </div>
      ) : !order ? (
        <div className="flex-1 flex items-center justify-center p-10 text-center">
          <p className="text-gray-500 font-semibold">Ups, no encontramos este pedido.</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">

          {/* ── LIVE MAP ── */}
          <div className="h-[35vh] relative bg-gray-200 min-h-[300px]">
            <LiveMap 
              driverPosition={driverPos}
              customerPosition={order.customerLocation ? [order.customerLocation.lat, order.customerLocation.lng] : undefined}
              zoom={14}
            />

            {/* Floating ETA */}
            {order.status === 'ready' && (
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-white px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2.5 border border-gray-100"
              >
                <div className="bg-orange-50 rounded-full w-7 h-7 flex items-center justify-center">
                   <Clock size={16} className="text-orange-500" />
                </div>
                <span className="text-[13px] font-extrabold text-gray-900 whitespace-nowrap">Llega en ~12 min</span>
              </motion.div>
            )}
          </div>

          {/* ── CONTENT PANEL ── */}
          <div className="flex-1 bg-white -mt-6 rounded-t-[32px] relative z-10 px-6 py-8 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] pb-24 lg:pb-8">

            {/* Restaurant Badge */}
            <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-orange-500 border border-gray-100">
                   <Package size={28} />
                </div>
                <div>
                   <h3 className="m-0 text-lg font-black text-gray-900">{order.restaurantName}</h3>
                   <p className="m-0 mt-0.5 text-xs text-gray-400 font-medium">Total: <strong className="text-gray-900">${order.total?.toFixed(2)}</strong></p>
                </div>
                <button className="ml-auto w-10 h-10 bg-gray-50 border-none rounded-xl flex items-center justify-center text-gray-400 cursor-pointer">
                   <Info size={18} />
                </button>
            </div>

            {/* Driver Contact Sheet */}
            {order.status === 'ready' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-orange-50/50 rounded-3xl p-5 mb-8 flex items-center gap-4 border border-orange-50"
              >
                <div className="relative">
                  <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                     <Bike size={28} className="text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-green-500 border-[3px] border-orange-50 rounded-full w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="m-0 text-[15px] font-extrabold text-gray-900">Carlos López</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                     <Star size={12} fill="currentColor" className="text-orange-500" />
                     <span className="text-xs font-bold text-orange-400">4.9 · Repartidor</span>
                  </div>
                </div>
                <div className="flex gap-2">
                   <a href={`tel:${order.customerPhone}`} className="w-11 h-11 bg-white rounded-xl flex items-center justify-center border border-gray-100 text-green-500 no-underline shadow-sm">
                      <PhoneCall size={18} />
                   </a>
                   <button className="w-11 h-11 bg-white rounded-xl flex items-center justify-center border border-gray-100 text-blue-500 cursor-pointer shadow-sm">
                      <MessageSquare size={18} />
                   </button>
                </div>
              </motion.div>
            )}

            {/* Progress Timeline */}
            <div className="flex flex-col gap-2">
               <h4 className="text-[11px] font-extrabold text-gray-300 uppercase tracking-widest mb-2">Progreso de entrega</h4>
               
               <div className="flex flex-col">
                 {statusSteps.map((step, i) => {
                   const done    = i < currentStep;
                   const active  = i === currentStep;
                   const future  = i > currentStep;
                   
                   return (
                     <div key={step.key} className={`flex gap-4 ${i === statusSteps.length - 1 ? 'h-auto' : 'h-16'}`}>
                        <div className="flex flex-col items-center w-10 shrink-0">
                           <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 z-10 
                             ${active || done ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-300'}
                             ${active ? 'scale-110 shadow-lg shadow-orange-500/40' : 'scale-100'}`}
                           >
                             {done ? <CheckCircle2 size={16} /> : step.icon}
                           </div>
                           {i < statusSteps.length - 1 && (
                             <div className={`w-[2px] flex-1 my-1 transition-colors duration-300 ${done ? 'bg-orange-500' : 'bg-gray-100'}`} />
                           )}
                        </div>
                        <div className="flex-1 pt-1">
                           <p className={`m-0 text-sm font-black tracking-tight ${future ? 'text-gray-300' : 'text-gray-900'}`}>{step.label}</p>
                           {(active || done) && (
                             <p className={`m-0 mt-0.5 text-[11px] font-medium leading-snug ${active ? 'text-orange-500' : 'text-gray-400'}`}>{step.sub}</p>
                           )}
                        </div>
                     </div>
                   );
                 })}
               </div>
            </div>

          </div>
        </div>
      )}
      </div>
    </div>
  );
}
