'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { 
  Clock, Phone, MessageCircle, Star, 
  CheckCircle2, Bike, Package, ChefHat, 
  ChevronLeft, MapPin, Navigation, Info,
  PhoneCall, MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Leaflet must be loaded client-side only
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

export default function TrackOrderPage({ params }: { params: { orderId: string } }) {
  const [order, setOrder]               = useState<any>(null);
  const [driverPos, setDriverPos]       = useState<[number,number]|null>(null);
  const [loading, setLoading]           = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!params.orderId) return;
    const unsub = onSnapshot(doc(db, 'orders', params.orderId), (snap) => {
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
  }, [params.orderId]);

  const currentStep = order ? (statusIndex[order.status] ?? 0) : 0;

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#F8F9FA',
      fontFamily: 'Inter, -apple-system, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      maxWidth: '480px',
      margin: '0 auto',
      position: 'relative',
    }}>
      
      {/* ── HEADER ── */}
      <div style={{ 
        padding: '16px 20px', 
        background: 'white', 
        borderBottom: '1px solid #F0F0F0',
        display: 'flex', 
        alignItems: 'center', 
        gap: '16px', 
        position: 'sticky', 
        top: 0, 
        zIndex: 50,
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
      }}>
        <button 
          onClick={() => router.back()}
          style={{ width: '40px', height: '40px', background: '#F5F5F7', border: 'none', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111', cursor: 'pointer' }}
        >
          <ChevronLeft size={20} strokeWidth={2.5}/>
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '17px', fontWeight: 900, margin: 0, letterSpacing: '-0.3px', color: '#111' }}>Sigue tu pedido</h1>
          <p style={{ fontSize: '10px', color: '#999', margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            ID: {order?.id ? `#${order.id.slice(-6).toUpperCase()}` : 'Cargando...'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', background: '#22c55e', borderRadius: '50%', boxShadow: '0 0 8px rgba(34,197,94,0.4)', animation: 'pulse 1.5s infinite' }} />
          <span style={{ fontSize: '10px', color: '#22c55e', fontWeight: 800, textTransform: 'uppercase' }}>VIVO</span>
        </div>
      </div>

      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
          <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid #FF5722', borderTopColor: 'transparent', borderRadius: '50%' }} />
          <p style={{ color: '#999', fontSize: '13px', fontWeight: 700 }}>Conectando...</p>
        </div>
      ) : !order ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', textAlign: 'center' }}>
          <p style={{ color: '#666', fontWeight: 600 }}>Ups, no encontramos este pedido.</p>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

          {/* ── LIVE MAP ── */}
          <div style={{ height: '35vh', position: 'relative', background: '#E5E7EB', minHeight: '300px' }}>
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
                style={{
                  position: 'absolute',
                  top: '16px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 100,
                  background: 'white',
                  padding: '10px 18px',
                  borderRadius: '99px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  border: '1px solid #F0F0F0'
                }}
              >
                <div style={{ background: '#FFF0EB', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <Clock size={16} color="#FF5722" />
                </div>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#111', whiteSpace: 'nowrap' }}>Llega en ~12 min</span>
              </motion.div>
            )}
          </div>

          {/* ── CONTENT PANEL ── */}
          <div style={{ 
            flex: 1, 
            background: 'white', 
            marginTop: '-24px', 
            borderRadius: '32px 32px 0 0', 
            position: 'relative', 
            zIndex: 10,
            padding: '32px 24px 40px',
            boxShadow: '0 -10px 30px rgba(0,0,0,0.03)'
          }}>

            {/* Restaurant Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                <div style={{ width: '56px', height: '56px', background: '#F8F9FA', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF5722', border: '1px solid #F0F0F0' }}>
                   <Package size={28} />
                </div>
                <div>
                   <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#111' }}>{order.restaurantName}</h3>
                   <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#888', fontWeight: 500 }}>Total: <strong style={{ color: '#111' }}>${order.total?.toFixed(2)}</strong></p>
                </div>
                <button style={{ marginLeft: 'auto', width: '40px', height: '40px', background: '#F8F9FA', border: 'none', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#AAA' }}>
                   <Info size={18} />
                </button>
            </div>

            {/* Driver Contact Sheet */}
            {order.status === 'ready' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ 
                  background: '#FFF8F6', 
                  borderRadius: '24px', 
                  padding: '20px', 
                  marginBottom: '32px',
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '16px',
                  border: '1px solid #FFEBE6'
                }}
              >
                <div style={{ position: 'relative' }}>
                  <div style={{ width: '56px', height: '56px', background: '#FF5722', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(255,87,34,0.2)' }}>
                     <Bike size={28} color="white" />
                  </div>
                  <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', background: '#22C55E', border: '3px solid #FFF8F6', borderRadius: '50%', width: '16px', height: '16px' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#111' }}>Carlos López</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                     <Star size={12} fill="#FF5722" stroke="#FF5722" />
                     <span style={{ fontSize: '12px', fontWeight: 700, color: '#FF8A65' }}>4.9 · Repartidor</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                   <a href={`tel:${order.customerPhone}`} style={{ width: '44px', height: '44px', background: 'white', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #F0F0F0', color: '#22C55E', textDecoration: 'none' }}>
                      <PhoneCall size={18} />
                   </a>
                   <button style={{ width: '44px', height: '44px', background: 'white', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #F0F0F0', color: '#3B82F6', cursor: 'pointer' }}>
                      <MessageSquare size={18} />
                   </button>
                </div>
              </motion.div>
            )}

            {/* Progress Timeline */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
               <h4 style={{ fontSize: '11px', fontWeight: 800, color: '#BBB', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Progreso de entrega</h4>
               
               <div style={{ display: 'flex', flexDirection: 'column' }}>
                 {statusSteps.map((step, i) => {
                   const done    = i < currentStep;
                   const active  = i === currentStep;
                   const future  = i > currentStep;
                   
                   return (
                     <div key={step.key} style={{ display: 'flex', gap: '16px', height: i === statusSteps.length - 1 ? 'auto' : '72px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '40px', flexShrink: 0 }}>
                           <div style={{ 
                             width: '32px', 
                             height: '32px', 
                             borderRadius: '10px', 
                             background: active || done ? '#FF5722' : '#F5F5F7', 
                             color: active || done ? 'white' : '#CCC',
                             display: 'flex', 
                             alignItems: 'center', 
                             justifyContent: 'center',
                             transition: 'all 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28)',
                             transform: active ? 'scale(1.2)' : 'scale(1)',
                             zIndex: 2,
                             boxShadow: active ? '0 4px 16px rgba(255,87,34,0.4)' : 'none'
                           }}>
                             {done ? <CheckCircle2 size={16} /> : step.icon}
                           </div>
                           {i < statusSteps.length - 1 && (
                             <div style={{ 
                               width: '2px', 
                               flex: 1, 
                               background: done ? '#FF5722' : '#F0F0F0',
                               margin: '4px 0',
                               transition: 'background 0.3s'
                             }} />
                           )}
                        </div>
                        <div style={{ flex: 1, paddingTop: '2px' }}>
                           <p style={{ 
                             margin: 0, 
                             fontSize: '14px', 
                             fontWeight: 900, 
                             color: future ? '#CCC' : '#111',
                             letterSpacing: '-0.2px'
                           }}>{step.label}</p>
                           {(active || done) && (
                             <p style={{ margin: '2px 0 0', fontSize: '11px', color: active ? '#FF5722' : '#999', fontWeight: 500, lineHeight: 1.4 }}>{step.sub}</p>
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

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.1); } }
        .animate-spin { animation: spin 1s linear infinite; }
        .leaflet-container { background: #F8F9FA !important; border-radius: 0 0 32px 32px !important; }
      `}</style>
    </div>
  );
}
