'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, Clock, Bike, ChevronLeft, Plus, 
  Minus, Info, ShoppingBag, 
  Loader2, Share2, Heart,
  UtensilsCrossed, ChevronRight,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { useCart } from '@/lib/CartContext';
import { db } from '@/lib/firebase';
import { onSnapshot, doc, query, collection, where, getDoc } from 'firebase/firestore';

export default function RestaurantPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = React.use(params);
  const id = unwrappedParams.id;
  const { user } = useAuth();
  const { cart, addToCart: addItemToCart, cartCount, subtotal } = useCart();
  const [restaurant, setRestaurant] = useState<any>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [restaurantOwnerId, setRestaurantOwnerId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [addedId, setAddedId] = useState<string | null>(null);
  const [cartBounce, setCartBounce] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Try restaurants collection first
    const unsub = onSnapshot(doc(db, 'restaurants', id), async (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setRestaurant({ id: snap.id, ...data });
        // restaurants collection may have ownerId or userId field
        setRestaurantOwnerId(data.ownerId || data.userId || null);
        const menu = (data.menu || []).map((m: any) => ({ ...m, _cat: m.category || 'Main' }));
        setMenuItems(menu);
        setLoading(false);
      } else {
        // Fallback: try business_requests
        try {
          const bizSnap = await getDoc(doc(db, 'business_requests', id));
          if (bizSnap.exists()) {
            const data = bizSnap.data();
            // In business_requests, the document ID IS the restaurantId
            // and data.userId is the seller's UID
            setRestaurantOwnerId(data.userId || null);
            setRestaurant({
              id: bizSnap.id,
              name: data.businessName || data.name,
              category: data.type,
              rating: data.rating || 4.5,
              reviews: data.reviews || 0,
              time: data.deliveryTime || '30-45 min',
              delivery: data.deliveryFee ?? 1.50,
              image: data.image,
              ...data,
            });
          }
        } catch (e) { console.error(e); }
        setLoading(false);
      }
    });

    // Listen to products from the products collection for this businessId
    const qProducts = query(collection(db, 'products'), where('businessId', '==', id));
    const unsubProducts = onSnapshot(qProducts, (snap) => {
      if (!snap.empty) {
        const prods = snap.docs.map(d => ({ id: d.id, ...d.data(), _cat: d.data().category || 'Main' }));
        setMenuItems(prods);
        if (prods.length > 0) setActiveCategory('All');
      }
    });

    return () => { unsub(); unsubProducts(); };
  }, [id]);

  const menuCategories = ['All', ...Array.from(new Set(menuItems.map((i: any) => i.category || 'Main')))];

  const handleAddToCart = (item: any) => {
    addItemToCart(item, { id, name: restaurant?.name || 'Restaurante', ownerId: restaurantOwnerId || undefined });
    setAddedId(item.id);
    setCartBounce(true);
    setTimeout(() => setAddedId(null), 1200);
    setTimeout(() => setCartBounce(false), 400);
  };

  const goToCheckout = () => {
    router.push('/app/checkout');
  };

  if (loading) {
    return (
       <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
          <Loader2 className="animate-spin text-orange-500" size={40} />
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Abriendo cocina...</p>
       </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      minHeight: '100dvh',
      background: '#F8F9FA',
      fontFamily: 'Inter, -apple-system, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        width: '100%',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
      }}>
      
      {/* ── TOP NAV (Over Cover) ── */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <button 
          onClick={() => router.back()}
          style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(12px)', border: 'none', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' }}
        >
          <ChevronLeft size={20} strokeWidth={2.5}/>
        </button>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(12px)', border: 'none', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' }}>
            <Heart size={20} strokeWidth={2.5}/>
          </button>
          <button style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(12px)', border: 'none', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' }}>
            <Share2 size={20} strokeWidth={2.5}/>
          </button>
          
          {/* ── HEADER CART ICON ── */}
          {cart.length > 0 && (
            <motion.button 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: cartBounce ? 1.2 : 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              onClick={goToCheckout}
              style={{
                height: '40px', 
                padding: '0 16px',
                background: '#FF5722', 
                borderRadius: '12px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 800,
                fontSize: '13px',
                boxShadow: cartBounce ? '0 6px 25px rgba(255,87,34,0.7)' : '0 4px 15px rgba(255,87,34,0.4)',
                border: '1.5px solid rgba(255,255,255,0.3)'
              }}
            >
              <ShoppingBag size={18} strokeWidth={2.5} />
              <span>{cartCount}</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* ── RESTAURANT COVER ── */}
      <div style={{ position: 'relative', height: '320px', overflow: 'hidden' }}>
        <img 
          src={restaurant?.image || "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=1600&auto=format&fit=crop"} 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          alt={restaurant?.name || "Restaurant Cover"}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.8))' }} />
        
        <div style={{ position: 'absolute', bottom: '32px', left: '32px', right: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px' }}>
            <div style={{ width: '100px', height: '100px', background: 'white', borderRadius: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF5722', boxShadow: '0 12px 40px rgba(0,0,0,0.3)', flexShrink: 0 }}>
              <UtensilsCrossed size={48} />
            </div>
            <div style={{ paddingBottom: '8px' }}>
              <h1 style={{ margin: '0 0 8px', fontSize: '40px', fontWeight: 900, color: 'white', letterSpacing: '-1.5px', lineHeight: 1 }}>{restaurant?.name || 'Cargando...'}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'white', padding: '4px 10px', borderRadius: '10px' }}>
                  <Star size={14} fill="#FF5722" stroke="#FF5722" />
                  <span style={{ fontSize: '13px', fontWeight: 900, color: '#111' }}>{restaurant?.rating || '0.0'}</span>
                </div>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', fontWeight: 700 }}>{restaurant?.reviews || 0}+ reseñas</span>
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>•</span>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', fontWeight: 700 }}>{restaurant?.category}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── INFO BAR ── */}
      <div style={{ padding: '0 32px', marginTop: '-32px', position: 'relative', zIndex: 11 }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div style={{ background: 'white', borderRadius: '24px', padding: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '40px', height: '40px', background: '#F0F9FF', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0369A1' }}>
                <Clock size={20} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '10px', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tiempo Estimado</p>
                <p style={{ margin: 0, fontSize: '15px', fontWeight: 900, color: '#1E293B' }}>{restaurant?.time || '30-45 min'}</p>
              </div>
           </div>
           <div style={{ background: 'white', borderRadius: '24px', padding: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '40px', height: '40px', background: '#F0FDF4', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#15803D' }}>
                <Bike size={20} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '10px', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Costo de Envío</p>
                <p style={{ margin: 0, fontSize: '15px', fontWeight: 900, color: '#1E293B' }}>{restaurant?.delivery === 0 ? '¡GRATIS!' : `$${restaurant?.delivery?.toFixed(2)}`}</p>
              </div>
           </div>
           <div style={{ background: 'white', borderRadius: '24px', padding: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '40px', height: '40px', background: '#FFF7ED', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C2410C' }}>
                <Info size={20} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '10px', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Información</p>
                <p style={{ margin: 0, fontSize: '15px', fontWeight: 900, color: '#1E293B' }}>Vendido por {restaurant?.name}</p>
              </div>
           </div>
        </div>
      </div>

      {/* ── CATEGORY BAR ── */}
      <div style={{ 
        position: 'sticky', 
        top: '0px', 
        zIndex: 30, 
        background: 'rgba(248,249,250,0.9)', 
        backdropFilter: 'blur(16px)',
        padding: '24px 0 16px',
        marginTop: '24px'
      }}>
        <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', padding: '0 32px', scrollbarWidth: 'none' }}>
          {menuCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                flexShrink: 0,
                padding: '12px 24px',
                borderRadius: '16px',
                border: activeCategory === cat ? 'none' : '2px solid #E5E7EB',
                background: activeCategory === cat ? '#FF5722' : 'white',
                color: activeCategory === cat ? 'white' : '#4B5563',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.2s',
                textTransform: 'uppercase',
                letterSpacing: '0.02em'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── MENU ITEMS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" style={{ padding: '32px', paddingBottom: '140px' }}>
        {menuItems.filter((item: any) => item.category === activeCategory || activeCategory === 'All').map((item: any, i: number) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            style={{
              background: 'white',
              borderRadius: '32px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
              border: '1px solid #F1F5F9',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ height: '200px', borderRadius: '24px', overflow: 'hidden', position: 'relative' }}>
              <img src={item.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={item.name} />
              <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', padding: '6px 12px', borderRadius: '12px', fontSize: '15px', fontWeight: 900, color: '#111' }}>
                ${item.price.toFixed(2)}
              </div>
            </div>
            <div>
              <h5 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 900, color: '#1E293B', textTransform: 'uppercase', letterSpacing: '-0.5px' }}>{item.name}</h5>
              <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#64748B', lineHeight: 1.5, fontWeight: 500 }}>{item.description}</p>
              
              <motion.button 
                onClick={() => handleAddToCart(item)}
                animate={addedId === item.id ? { scale: [1, 0.95, 1] } : { scale: 1 }}
                transition={{ duration: 0.2 }}
                style={{ 
                  width: '100%', 
                  padding: '14px', 
                  background: addedId === item.id ? '#22C55E' : '#F8F9FA', 
                  border: addedId === item.id ? '2px solid #22C55E' : '2px solid #F1F5F9', 
                  borderRadius: '16px', 
                  color: addedId === item.id ? 'white' : '#1E293B', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '12px',
                  fontWeight: 800,
                  fontSize: '13px',
                  transition: 'background 0.3s, border 0.3s, color 0.3s',
                  boxShadow: addedId === item.id ? '0 4px 15px rgba(34,197,94,0.35)' : 'none'
                }}
              >
                {addedId === item.id 
                  ? <><span style={{ fontSize: '16px' }}>✓</span> ¡AGREGADO!</>
                  : <><Plus size={18} strokeWidth={3} style={{ color: '#FF5722' }} /> AGREGAR AL CARRITO</>}
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── FLOATING CART ACTION (Mobile) ── */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="md:hidden fixed bottom-[24px] left-[24px] right-[24px] h-[64px] bg-[#111] rounded-[24px] flex items-center justify-between px-[24px] text-white shadow-2xl cursor-pointer z-[60]"
            onClick={goToCheckout}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
               <div style={{ width: '32px', height: '32px', background: '#FF5722', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '14px' }}>
                 {cartCount}
               </div>
               <span style={{ fontWeight: 800, fontSize: '15px', letterSpacing: '-0.3px', textTransform: 'uppercase' }}>Ir a Pagar</span>
            </div>
            <span style={{ fontWeight: 900, fontSize: '18px' }}>${subtotal.toFixed(2)}</span>
          </motion.div>
        )}
      </AnimatePresence>

      </div>
      
      <style>{`
        ::-webkit-scrollbar { display: none; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
