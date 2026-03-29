'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Star, Clock, Bike, ArrowRight, Heart, 
  Percent, Search, ChevronRight, Flame,
  Pizza, Beef, Fish, Drumstick, IceCream2,
  Leaf, Salad, GlassWater, Tag, Package, Loader2
} from 'lucide-react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, limit, doc, setDoc, getDocs } from 'firebase/firestore';
import { useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';

const initialRestaurants = [
  {
    id: 'burger-paradise',
    name: 'Burger Paradise',
    category: 'Burgers',
    rating: 4.8,
    reviews: 520,
    time: '20-30 min',
    delivery: 1.50,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop',
    isOpen: true,
    menu: [
      { id: 'm1', name: 'Paradise Special', description: 'Carne premium 200g, cheddar doble, tocino, cebolla caramelizada y salsa secreta.', price: 12.50, image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?q=80&w=800&auto=format&fit=crop', category: 'Populares' },
      { id: 'm2', name: 'Cheese Burger', description: 'Versión clásica con lechuga, tomate, pepinillos y queso fundido.', price: 8.99, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop', category: 'Individuales' }
    ]
  },
  {
    id: 'neo-tokyo-sushi',
    name: 'Neo Tokyo Sushi',
    category: 'Sushi',
    rating: 4.9,
    reviews: 310,
    time: '35-45 min',
    delivery: 0,
    image: 'https://images.unsplash.com/photo-1553621042-f6e147245754?q=80&w=800&auto=format&fit=crop',
    isOpen: true,
    menu: [
      { id: 's1', name: 'Dragon Roll', description: 'Langostino tempura, aguacate, masago y salsa anguila.', price: 14.00, image: 'https://images.unsplash.com/photo-1617196034738-26c5f7c977ce?q=80&w=800&auto=format&fit=crop', category: 'Populares' }
    ]
  }
];

const categories = [
  { name: 'Pizza',     icon: <Pizza size={28} strokeWidth={1.5}/>,         color: '#FFF0EB', iconColor: '#FF5722' },
  { name: 'Burgers',   icon: <Beef size={28} strokeWidth={1.5}/>,           color: '#EBF0FF', iconColor: '#3B82F6' },
  { name: 'Sushi',     icon: <Fish size={28} strokeWidth={1.5}/>,           color: '#EBFFF0', iconColor: '#22C55E' },
  { name: 'Pollo',     icon: <Drumstick size={28} strokeWidth={1.5}/>,      color: '#FFEBF4', iconColor: '#EC4899' },
  { name: 'Postres',   icon: <IceCream2 size={28} strokeWidth={1.5}/>,      color: '#F5EBFF', iconColor: '#A855F7' },
  { name: 'Vegano',    icon: <Leaf size={28} strokeWidth={1.5}/>,           color: '#EBFFF7', iconColor: '#10B981' },
  { name: 'Ensaladas', icon: <Salad size={28} strokeWidth={1.5}/>,          color: '#FFFAEB', iconColor: '#F59E0B' },
  { name: 'Bebidas',   icon: <GlassWater size={28} strokeWidth={1.5}/>,     color: '#EBFEFF', iconColor: '#06B6D4' },
];

export default function CustomerDashboard() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const { user } = useAuth();
  const [myBusinessRequest, setMyBusinessRequest] = useState<any>(null);

  useEffect(() => {
    // Escuchar si el usuario ya tiene una solicitud de local
    if (user) {
      const q = query(collection(db, 'business_requests'));
      const unsub = onSnapshot(q, (snap) => {
        const found = snap.docs.find(d => d.data().userId === user.uid);
        if (found) {
          setMyBusinessRequest({ id: found.id, ...found.data() });
        }
      });
      return () => unsub();
    }
  }, [user]);

  useEffect(() => {
    // Seed database if empty
    const checkAndSeed = async () => {
      const snap = await getDocs(collection(db, 'restaurants'));
      if (snap.empty) {
        for (const res of initialRestaurants) {
          await setDoc(doc(db, 'restaurants', res.id), res);
        }
      }
    };
    checkAndSeed();

    const q = query(collection(db, 'restaurants'), limit(20));
    return onSnapshot(q, (snapshot) => {
      setRestaurants(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>

      {/* ── Search Bar ── */}
      <div style={{ padding: '16px 16px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#F0F0F3', borderRadius: '16px', padding: '12px 16px' }}>
          <Search size={18} color="#999" strokeWidth={2} />
          <span style={{ fontSize: '15px', color: '#AAA', fontWeight: 500 }}>¿Qué se te antoja hoy?</span>
        </div>
      </div>

      {/* ── Promo Banner ── */}
      <div style={{ padding: '0 16px 20px' }}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'linear-gradient(135deg, #1A1A1A 0%, #2D1500 100%)',
            borderRadius: '24px',
            padding: '24px',
            position: 'relative',
            overflow: 'hidden',
            height: '160px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '180px', height: '180px', background: 'rgba(255,87,34,0.18)', borderRadius: '50%', filter: 'blur(50px)' }} />
          
          {/* Decorative icon - top right */}
          <div style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', opacity: 0.12 }}>
            <Beef size={90} color="white" strokeWidth={1} />
          </div>

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,87,34,0.25)', borderRadius: '99px', padding: '4px 12px', marginBottom: '10px' }}>
              <Flame size={12} color="#FF5722" />
              <span style={{ fontSize: '10px', fontWeight: 800, color: '#FF7A50', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Oferta del día</span>
            </div>
            <h2 style={{ margin: '0 0 14px', fontSize: '22px', fontWeight: 900, color: 'white', lineHeight: 1.2, letterSpacing: '-0.5px' }}>
              Burger <span style={{ color: '#FF5722' }}>50% OFF</span><br />en tu primer pedido
            </h2>
            <button style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#FF5722', border: 'none', borderRadius: '12px', padding: '10px 16px', color: 'white', fontSize: '12px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(255,87,34,0.4)' }}>
              Pedir ahora <ArrowRight size={14} />
            </button>
          </div>
        </motion.div>
      </div>

      {/* ── Categories ── */}
      <div style={{ paddingBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', marginBottom: '14px' }}>
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 900, color: '#111', letterSpacing: '-0.3px' }}>Categorías</h3>
          <button style={{ background: 'none', border: 'none', fontSize: '12px', fontWeight: 700, color: '#FF5722', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}>
            Ver todas <ChevronRight size={14} />
          </button>
        </div>
        <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', padding: '0 16px 4px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {categories.map((c, i) => (
            <motion.button
              key={c.name}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              whileTap={{ scale: 0.92 }}
              style={{
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0',
              }}
            >
              <div style={{ 
                width: '64px', height: '64px', 
                background: c.color, 
                borderRadius: '20px', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: c.iconColor,
              }}>
                {c.icon}
              </div>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#444', whiteSpace: 'nowrap' }}>{c.name}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── Restaurants ── */}
      <div style={{ padding: '0 16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 900, color: '#111', letterSpacing: '-0.3px' }}>Cerca de ti</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#E8FAF0', borderRadius: '99px', padding: '3px 10px' }}>
              <div style={{ width: '6px', height: '6px', background: '#22c55e', borderRadius: '50%' }} />
              <span style={{ fontSize: '10px', fontWeight: 800, color: '#22c55e' }}>Abiertos</span>
            </div>
          </div>
          <Link href="/app/all" style={{ fontSize: '12px', fontWeight: 700, color: '#FF5722', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '2px' }}>
            Ver todos <ChevronRight size={14} />
          </Link>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <Loader2 className="animate-spin" size={32} color="#FF5722" />
            </div>
          ) : restaurants.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
               No hay restaurantes disponibles en este momento.
            </div>
          ) : (
            restaurants.map((res, i) => (
              <Link key={res.id} href={`/app/restaurant/${res.id}`} style={{ textDecoration: 'none' }}>
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  whileTap={{ scale: 0.98 }}
                  style={{ background: 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
                >
                  {/* Restaurant Photo */}
                  <div style={{ position: 'relative', height: '160px' }}>
                    <img
                      src={res.image}
                      alt={res.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                    {res.discount && (
                      <div style={{ position: 'absolute', top: '12px', left: '12px', background: '#FF5722', color: 'white', borderRadius: '10px', padding: '5px 10px', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Tag size={11} /> {res.discount}
                      </div>
                    )}
                    <button
                      onClick={(e) => { 
                        e.preventDefault(); 
                        setFavorites(f => f.includes(res.id) ? f.filter(x => x !== res.id) : [...f, res.id]); 
                      }}
                      style={{ position: 'absolute', top: '12px', right: '12px', width: '36px', height: '36px', background: 'white', border: 'none', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                    >
                      <Heart 
                        size={18} 
                        fill={favorites.includes(res.id) ? '#FF5722' : 'none'} 
                        stroke={favorites.includes(res.id) ? '#FF5722' : '#999'} 
                      />
                    </button>
                  </div>

                  {/* Info */}
                  <div style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#FF5722', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{res.category}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Star size={13} fill="#FF5722" stroke="#FF5722" />
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#111' }}>{res.rating}</span>
                      </div>
                    </div>
                    <h4 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 900, color: '#111', letterSpacing: '-0.3px' }}>{res.name}</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={13} color="#CCC" strokeWidth={2} />
                        <span style={{ fontSize: '12px', color: '#888', fontWeight: 600 }}>{res.time}</span>
                      </div>
                      <div style={{ width: '3px', height: '3px', background: '#DDD', borderRadius: '50%' }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Bike size={13} color="#CCC" strokeWidth={2} />
                        <span style={{ fontSize: '12px', color: '#888', fontWeight: 600 }}>
                          {res.delivery === 0 ? 'Envío Gratis' : `$${res.delivery.toFixed(2)}`}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* ── Join CTA ── */}
      {(!myBusinessRequest || myBusinessRequest.status !== 'approved') ? (
        <div style={{ margin: '0 16px 20px', background: myBusinessRequest?.status === 'pending' ? '#F0F0F3' : '#FF5722', borderRadius: '24px', padding: '28px 24px', position: 'relative', overflow: 'hidden', border: myBusinessRequest?.status === 'pending' ? '1px solid #E0E0E0' : 'none' }}>
          <div style={{ position: 'absolute', bottom: '-20px', right: '-20px', opacity: 0.1 }}>
            <Package size={100} color={myBusinessRequest?.status === 'pending' ? '#111' : 'white'} strokeWidth={1} />
          </div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: 800, color: myBusinessRequest?.status === 'pending' ? '#999' : 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {myBusinessRequest?.status === 'pending' ? 'Estado de tu solicitud' : '¿Tienes un negocio?'}
            </p>
            <h3 style={{ margin: '0 0 16px', fontSize: '20px', fontWeight: 900, color: myBusinessRequest?.status === 'pending' ? '#111' : 'white', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
              {myBusinessRequest?.status === 'pending' ? '¡Estamos revisando tu negocio!' : 'Vende con Delivery.ec y llega a más clientes'}
            </h3>
            
            {myBusinessRequest?.status === 'pending' ? (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'white', padding: '10px 16px', borderRadius: '12px', color: '#888', fontSize: '12px', fontWeight: 700 }}>
                <Clock size={16} /> En revisión en menos de 24h
              </div>
            ) : (
              <Link href="/app/register-business" style={{ textDecoration: 'none' }}>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{ background: 'white', border: 'none', borderRadius: '14px', padding: '12px 24px', color: '#FF5722', fontWeight: 800, fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
                >
                  Registrar mi Local
                </motion.button>
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div style={{ margin: '0 16px 20px', background: 'linear-gradient(135deg, #1A1A1A 0%, #333 100%)', borderRadius: '24px', padding: '28px 24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: 800, color: '#FF5722', textTransform: 'uppercase', letterSpacing: '0.1em' }}>¡Felicidades, Partner!</p>
            <h3 style={{ margin: '0 0 16px', fontSize: '20px', fontWeight: 900, color: 'white' }}>{myBusinessRequest.businessName} ya es oficial</h3>
            <Link href="/seller" style={{ textDecoration: 'none' }}>
              <motion.button 
                whileHover={{ scale: 1.05 }} style={{ background: '#FF5722', border: 'none', borderRadius: '14px', padding: '12px 24px', color: 'white', fontWeight: 800, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                Ir a mi Panel de Negocio <ChevronRight size={16} />
              </motion.button>
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}
