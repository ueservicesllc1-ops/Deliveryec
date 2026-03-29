'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, Clock, Bike, ChevronLeft, Plus, 
  Minus, Info, ShoppingBag, CreditCard, 
  Loader2, Share2, Heart, Search,
  UtensilsCrossed, X, ChevronRight,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, onSnapshot, doc } from 'firebase/firestore';
import AddressAutocomplete from '@/components/AddressAutocomplete';

export default function RestaurantPage({ params }: { params: { id: string } }) {
  const { user, profile } = useAuth();
  const [restaurant, setRestaurant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Populares');
  const [cart, setCart] = useState<any[]>([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (profile?.defaultAddress && !address) {
      setAddress(profile.defaultAddress);
    }
    if (profile?.defaultLocation && !coords) {
      setCoords([profile.defaultLocation.lat, profile.defaultLocation.lng]);
    }
  }, [profile]);

  useEffect(() => {
    return onSnapshot(doc(db, 'restaurants', params.id), (snap: any) => {
      if (snap.exists()) {
        setRestaurant({ id: snap.id, ...snap.data() });
      }
      setLoading(false);
    });
  }, [params.id]);

  const menuItems = restaurant?.menu || [];
  const menuCategories = ['Populares', ...new Set((menuItems as any[]).map(i => i.category))];

  const addToCart = (item: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, qty: (i.qty || 1) + 1 } : i);
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => {
      const item = prev.find(i => i.id === id);
      if (item && item.qty > 1) {
        return prev.map(i => i.id === id ? { ...i, qty: i.qty - 1 } : i);
      }
      return prev.filter(i => i.id !== id);
    });
  };

  const handleCheckout = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (cart.length === 0) return;

    setIsCheckingOut(true);
    try {
      const totalAmount = cart.reduce((acc, curr) => acc + (curr.price * curr.qty), 0) + 1.50;
      
      const orderData = {
        customerId: user.uid,
        customerName: profile?.name || user.displayName || 'Anónimo',
        customerPhone: user.phoneNumber || '',
        restaurantId: params.id,
        restaurantName: restaurant?.name || 'Restaurante',
        address: address,
        customerLocation: coords ? { lat: coords[0], lng: coords[1] } : null,
        items: cart,
        total: totalAmount,
        status: 'pending',
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'orders'), orderData);
      
      setCart([]);
      setShowCart(false);
      router.push('/app/orders');
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
      setIsCheckingOut(false);
    }
  };

  const subtotal = cart.reduce((acc, current) => acc + (current.price * (current.qty || 1)), 0);
  const cartCount = cart.reduce((acc, curr) => acc + (curr.qty || 1), 0);

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
        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(12px)', border: 'none', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <Heart size={20} strokeWidth={2.5}/>
          </button>
          <button style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(12px)', border: 'none', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <Share2 size={20} strokeWidth={2.5}/>
          </button>
        </div>
      </div>

      {/* ── RESTAURANT COVER ── */}
      <div style={{ position: 'relative', height: '240px', overflow: 'hidden' }}>
        <img 
          src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=1600&auto=format&fit=crop" 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          alt="Cover"
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.7))' }} />
        
        <div style={{ position: 'absolute', bottom: '24px', left: '24px', right: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ width: '64px', height: '64px', background: 'white', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF5722', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
              <UtensilsCrossed size={32} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 900, color: 'white', letterSpacing: '-0.5px' }}>{restaurant?.name || 'Cargando...'}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Star size={14} fill="#FF5722" stroke="#FF5722" />
                <span style={{ fontSize: '13px', fontWeight: 800, color: 'white' }}>{restaurant?.rating || '0.0'}</span>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>({restaurant?.reviews || 0}+ reseñas)</span>
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
             <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', borderRadius: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={14} color="rgba(255,255,255,0.8)" />
                <span style={{ fontSize: '12px', color: 'white', fontWeight: 700 }}>{restaurant?.time || '--'}</span>
             </div>
             <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', borderRadius: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Bike size={14} color="rgba(255,255,255,0.8)" />
                <span style={{ fontSize: '12px', color: 'white', fontWeight: 700 }}>
                  {restaurant?.delivery === 0 ? 'Gratis' : `$${restaurant?.delivery?.toFixed(2)}`} envío
                </span>
             </div>
          </div>
        </div>
      </div>

      {/* ── INFO PILL ── */}
      <div style={{ padding: '0 24px', marginTop: '-20px', position: 'relative', zIndex: 11 }}>
        <div style={{ background: 'white', borderRadius: '20px', padding: '16px 20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Info size={20} color="#FF5722" />
            <p style={{ margin: 0, fontSize: '13px', color: '#666', fontWeight: 500 }}>Vendido por {restaurant?.name || 'Cargando...'}</p>
          </div>
          <ChevronRight size={18} color="#CCC" />
        </div>
      </div>

      {/* ── CATEGORY BAR ── */}
      <div style={{ 
        position: 'sticky', 
        top: '68px', 
        zIndex: 30, 
        background: 'rgba(248,249,250,0.8)', 
        backdropFilter: 'blur(12px)',
        padding: '16px 0 8px',
      }}>
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '0 24px', scrollbarWidth: 'none' }}>
          {menuCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                flexShrink: 0,
                padding: '8px 16px',
                borderRadius: '12px',
                border: activeCategory === cat ? 'none' : '1px solid #E5E5E5',
                background: activeCategory === cat ? '#FF5722' : 'white',
                color: activeCategory === cat ? 'white' : '#666',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── MENU ITEMS ── */}
      <div style={{ padding: '8px 24px 100px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {menuItems.filter((item: any) => item.category === activeCategory || activeCategory === 'Populares').map((item: any, i: number) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            style={{
              background: 'white',
              borderRadius: '24px',
              padding: '12px',
              display: 'flex',
              gap: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ width: '90px', height: '90px', borderRadius: '18px', overflow: 'hidden', flexShrink: 0 }}>
              <img src={item.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={item.name} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <h5 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 800, color: '#111' }}>{item.name}</h5>
              <p style={{ margin: '0 0 8px', fontSize: '11px', color: '#888', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.description}</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '15px', fontWeight: 900, color: '#FF5722' }}>${item.price.toFixed(2)}</span>
                <button 
                  onClick={() => addToCart(item)}
                  style={{ width: '32px', height: '32px', background: '#FF5722', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Plus size={18} strokeWidth={3} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── BOTTOM CART BAR (On Mobile) ── */}
      <AnimatePresence>
        {cart.length > 0 && !showCart && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            style={{
              position: 'fixed',
              bottom: '84px', // Above bottom nav
              left: '50%',
              transform: 'translateX(-50%)',
              width: 'calc(100% - 32px)',
              maxWidth: '448px',
              height: '56px',
              background: '#FF5722',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 20px',
              color: 'white',
              boxShadow: '0 8px 32px rgba(255,87,34,0.3)',
              cursor: 'pointer',
              zIndex: 60,
            }}
            onClick={() => setShowCart(true)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
               <div style={{ width: '28px', height: '28px', background: 'rgba(255,255,255,0.2)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '13px' }}>
                 {cartCount}
               </div>
               <span style={{ fontWeight: 800, fontSize: '14px', letterSpacing: '-0.3px' }}>Ver carrito</span>
            </div>
            <span style={{ fontWeight: 900, fontSize: '16px' }}>${subtotal.toFixed(2)}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FULL SCREEN CART DRAWER ── */}
      <AnimatePresence>
        {showCart && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCart(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, backdropFilter: 'blur(8px)' }}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{
                position: 'fixed',
                bottom: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '100%',
                maxWidth: '480px',
                height: '85dvh',
                background: 'white',
                borderRadius: '32px 32px 0 0',
                zIndex: 101,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 -10px 40px rgba(0,0,0,0.2)',
              }}
            >
              {/* Drawer Header */}
              <div style={{ padding: '12px 24px 20px', borderBottom: '1px solid #F0F0F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ width: '40px', height: '4px', background: '#E5E5E5', borderRadius: '4px', position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)' }} />
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#111' }}>Tu Carrito</h3>
                <button onClick={() => setShowCart(false)} style={{ background: '#F5F5F7', border: 'none', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={18} color="#666" />
                </button>
              </div>

              {/* Cart Items List */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                
                {/* Delivery Address Section */}
                <div style={{ marginBottom: '32px' }}>
                   <p style={{ margin: '0 0 12px', fontSize: '11px', fontWeight: 800, color: '#BBB', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Dirección de Entrega</p>
                   <AddressAutocomplete 
                     initialValue={address} 
                     onAddressSelect={(addr, coord) => { setAddress(addr); setCoords(coord); }} 
                     placeholder="¿A dónde enviamos?"
                   />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {cart.map((item) => (
                    <div key={item.id} style={{ display: 'flex', gap: '16px' }}>
                      <div style={{ width: '64px', height: '64px', borderRadius: '16px', overflow: 'hidden', flexShrink: 0 }}>
                        <img src={item.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h5 style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: 800 }}>{item.name}</h5>
                        <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 800, color: '#FF5722' }}>${item.price.toFixed(2)}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                           <button onClick={() => removeFromCart(item.id)} style={{ width: '28px', height: '28px', background: '#F5F5F7', border: 'none', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                             <Minus size={14} color="#666" />
                           </button>
                           <span style={{ fontSize: '14px', fontWeight: 900 }}>{item.qty}</span>
                           <button onClick={() => addToCart(item)} style={{ width: '28px', height: '28px', background: '#F5F5F7', border: 'none', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                             <Plus size={14} color="#666" />
                           </button>
                        </div>
                      </div>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: 900 }}>${(item.price * item.qty).toFixed(2)}</p>
                    </div>
                  ))}
                </div>

                {/* Totals Summary */}
                <div style={{ marginTop: '32px', paddingTop: '32px', borderTop: '2px dashed #F0F0F0' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ fontSize: '13px', color: '#888', fontWeight: 600 }}>Subtotal</span>
                      <span style={{ fontSize: '13px', color: '#111', fontWeight: 800 }}>${subtotal.toFixed(2)}</span>
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ fontSize: '13px', color: '#888', fontWeight: 600 }}>Tarifa de envío</span>
                      <span style={{ fontSize: '13px', color: '#3B82F6', fontWeight: 800 }}>$1.50</span>
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px' }}>
                      <span style={{ fontSize: '18px', color: '#111', fontWeight: 900 }}>Total</span>
                      <span style={{ fontSize: '22px', color: '#FF5722', fontWeight: 900, letterSpacing: '-1px' }}>${(subtotal + 1.50).toFixed(2)}</span>
                   </div>
                </div>
              </div>

              {/* Checkout Button */}
              <div style={{ padding: '24px', background: 'white', borderTop: '1px solid #F0F0F0' }}>
                <button 
                  onClick={handleCheckout}
                  disabled={isCheckingOut || !address}
                  style={{
                    width: '100%',
                    padding: '18px',
                    background: (!address || isCheckingOut) ? '#CCC' : '#FF5722',
                    border: 'none',
                    borderRadius: '18px',
                    color: 'white',
                    fontSize: '15px',
                    fontWeight: 900,
                    cursor: address ? 'pointer' : 'default',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    boxShadow: address ? '0 8px 32px rgba(255,87,34,0.25)' : 'none',
                    transition: 'all 0.3s'
                  }}
                >
                  {isCheckingOut ? (
                    <><Loader2 className="animate-spin" size={20} /> Procesando...</>
                  ) : (
                    <><CreditCard size={20} /> Realizar Pedido</>
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        ::-webkit-scrollbar { display: none; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
