'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, Clock, Bike, ChevronLeft, Plus, 
  Info, ShoppingBag, Loader2, Share2, Heart,
  UtensilsCrossed
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
  const [activeCategory, setActiveCategory] = useState('All');
  const [addedId, setAddedId] = useState<string | null>(null);
  const [cartBounce, setCartBounce] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Try restaurants collection first
    const unsub = onSnapshot(doc(db, 'restaurants', id), async (snap) => {
      if (snap.exists()) {
        setRestaurant({ id: snap.id, ...snap.data() });
        const menu = (snap.data().menu || []).map((m: any) => ({ ...m, _cat: m.category || 'Main' }));
        setMenuItems(menu);
        setLoading(false);
      } else {
        // Fallback: try business_requests
        try {
          const bizSnap = await getDoc(doc(db, 'business_requests', id));
          if (bizSnap.exists()) {
            const data = bizSnap.data();
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
    addItemToCart(item, { id, name: restaurant?.name || 'Restaurante' });
    setAddedId(item.id);
    setCartBounce(true);
    setTimeout(() => setAddedId(null), 1200);
    setTimeout(() => setCartBounce(false), 400);
  };

  const goToCheckout = () => {
    router.push('/order/checkout');
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
    <div className="w-full min-h-[100dvh] bg-gray-50 font-sans flex flex-col relative overflow-x-hidden">
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col relative">
      
      {/* ── TOP NAV (Over Cover) ── */}
      <div className="absolute top-0 left-0 right-0 z-20 px-5 py-4 flex items-center justify-between pointer-events-none">
        <button 
          onClick={() => router.back()}
          className="w-10 h-10 bg-white/20 backdrop-blur-md border-none rounded-xl flex items-center justify-center text-white cursor-pointer pointer-events-auto hover:bg-white/30 transition-colors"
        >
          <ChevronLeft size={20} strokeWidth={2.5}/>
        </button>
        <div className="flex gap-2.5 items-center pointer-events-auto">
          <button className="w-10 h-10 bg-white/20 backdrop-blur-md border-none rounded-xl flex items-center justify-center text-white cursor-pointer hover:bg-white/30 transition-colors">
            <Heart size={20} strokeWidth={2.5}/>
          </button>
          <button className="w-10 h-10 bg-white/20 backdrop-blur-md border-none rounded-xl flex items-center justify-center text-white cursor-pointer hover:bg-white/30 transition-colors">
            <Share2 size={20} strokeWidth={2.5}/>
          </button>
          
          {/* ── HEADER CART ICON ── */}
          {cart.length > 0 && (
            <motion.button 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: cartBounce ? 1.1 : 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              onClick={goToCheckout}
              className="h-10 px-4 bg-orange-500 rounded-xl flex items-center gap-2 text-white cursor-pointer font-extrabold text-[13px] border-[1.5px] border-white/30 hover:bg-orange-600 outline-none"
              style={{ boxShadow: cartBounce ? '0 6px 25px rgba(255,87,34,0.7)' : '0 4px 15px rgba(255,87,34,0.4)' }}
            >
              <ShoppingBag size={18} strokeWidth={2.5} />
              <span>{cartCount}</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* ── RESTAURANT COVER ── */}
      <div className="relative h-[320px] overflow-hidden bg-gray-900">
        <img 
          src={restaurant?.image || "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=1600&auto=format&fit=crop"} 
          className="w-full h-full object-cover opacity-80"
          alt={restaurant?.name || "Restaurant Cover"}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/90 pointer-events-none" />
        
        <div className="absolute bottom-8 left-8 right-8">
          <div className="flex items-end gap-5">
            <div className="w-[100px] h-[100px] bg-white rounded-3xl flex items-center justify-center text-orange-500 shadow-[0_12px_40px_rgba(0,0,0,0.3)] shrink-0">
              <UtensilsCrossed size={48} />
            </div>
            <div className="pb-2">
              <h1 className="m-0 mb-2 text-[40px] font-black text-white tracking-[-1.5px] leading-none drop-shadow-md">{restaurant?.name || 'Cargando...'}</h1>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl shadow-sm">
                  <Star size={14} fill="#FF5722" className="text-orange-500" />
                  <span className="text-[13px] font-black text-gray-900">{restaurant?.rating || '0.0'}</span>
                </div>
                <span className="text-[13px] text-white/90 font-bold drop-shadow-sm">{restaurant?.reviews || 0}+ reseñas</span>
                <span className="text-white/40">•</span>
                <span className="text-[13px] text-white/90 font-bold drop-shadow-sm">{restaurant?.category}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── INFO BAR ── */}
      <div className="px-5 md:px-8 -mt-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                <Clock size={20} />
              </div>
              <div>
                <p className="m-0 text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Tiempo Estimado</p>
                <p className="m-0 text-[15px] font-black text-gray-800">{restaurant?.time || '30-45 min'}</p>
              </div>
           </div>
           <div className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex items-center gap-4">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                <Bike size={20} />
              </div>
              <div>
                <p className="m-0 text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Costo de Envío</p>
                <p className="m-0 text-[15px] font-black text-gray-800">{restaurant?.delivery === 0 ? '¡GRATIS!' : `$${restaurant?.delivery?.toFixed(2)}`}</p>
              </div>
           </div>
           <div className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex items-center gap-4">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
                <Info size={20} />
              </div>
              <div>
                <p className="m-0 text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Información</p>
                <p className="m-0 text-[15px] font-black text-gray-800 line-clamp-1">Vendido por {restaurant?.name}</p>
              </div>
           </div>
        </div>
      </div>

      {/* ── CATEGORY BAR ── */}
      <div className="sticky top-0 z-30 bg-gray-50/90 backdrop-blur-xl py-4 mt-6 border-b border-gray-100">
        <div className="flex gap-3 overflow-x-auto px-5 md:px-8 no-scrollbar">
          {menuCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 px-6 py-3 rounded-2xl text-[13px] font-extrabold cursor-pointer transition-all uppercase tracking-[0.02em] ${
                activeCategory === cat 
                  ? 'bg-orange-500 text-white border-2 border-orange-500 shadow-md shadow-orange-500/20' 
                  : 'bg-white text-gray-600 border-2 border-gray-200 hover:border-gray-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── MENU ITEMS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative px-5 md:px-8 py-8 pb-[140px]">
        {menuItems.filter((item: any) => item.category === activeCategory || activeCategory === 'All').map((item: any, i: number) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-[32px] p-4 flex flex-col gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 group hover:border-gray-200 transition-colors"
          >
            <div className="h-[200px] rounded-[24px] overflow-hidden relative bg-gray-100">
              <img src={item.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={item.name} />
              <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl text-[15px] font-black text-gray-900 shadow-sm border border-white/20">
                ${item.price.toFixed(2)}
              </div>
            </div>
            <div className="flex flex-col flex-1">
              <h5 className="m-0 mb-1.5 text-lg font-black text-gray-800 uppercase tracking-[-0.5px] leading-tight">{item.name}</h5>
              <p className="m-0 mb-5 text-[13px] text-gray-500 leading-relaxed font-medium line-clamp-2 flex-1">{item.description}</p>
              
              <motion.button 
                onClick={() => handleAddToCart(item)}
                animate={addedId === item.id ? { scale: [1, 0.95, 1] } : { scale: 1 }}
                transition={{ duration: 0.2 }}
                className={`w-full p-3.5 rounded-2xl flex items-center justify-center gap-3 font-extrabold text-[13px] transition-all duration-300 outline-none
                  ${addedId === item.id 
                    ? 'bg-green-500 border-2 border-green-500 text-white shadow-[0_4px_15px_rgba(34,197,94,0.35)]' 
                    : 'bg-gray-50 border-2 border-gray-100 text-gray-800 hover:border-orange-500 hover:bg-orange-50 hover:text-orange-600'
                  }`}
              >
                {addedId === item.id 
                  ? <><span className="text-[16px] leading-none">✓</span> ¡AGREGADO!</>
                  : <><Plus size={18} strokeWidth={3} className="text-orange-500 group-hover:scale-110 transition-transform" /> AGREGAR AL CARRITO</>}
              </motion.button>
            </div>
          </motion.div>
        ))}
        {menuItems.filter((i) => i.category === activeCategory || activeCategory === 'All').length === 0 && (
          <div className="col-span-full py-10 flex flex-col items-center justify-center text-center opacity-50">
            <UtensilsCrossed size={40} className="mb-4 text-gray-400" />
            <h3 className="text-lg font-bold text-gray-700">Sin productos disponibles</h3>
            <p className="text-sm text-gray-500">Pronto agregaremos más platillos deliciosos.</p>
          </div>
        )}
      </div>

      {/* ── FLOATING CART ACTION (Mobile) ── */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="md:hidden fixed bottom-6 left-6 right-6 h-16 bg-gray-900 rounded-[28px] flex items-center justify-between px-6 text-white shadow-2xl cursor-pointer z-[60] active:scale-95 transition-transform"
            onClick={goToCheckout}
          >
            <div className="flex items-center gap-4">
               <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center font-black text-sm">
                 {cartCount}
               </div>
               <span className="font-extrabold text-[15px] tracking-tight uppercase">Ir a Pagar</span>
            </div>
            <span className="font-black text-lg">${subtotal.toFixed(2)}</span>
          </motion.div>
        )}
      </AnimatePresence>

      </div>
      
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
