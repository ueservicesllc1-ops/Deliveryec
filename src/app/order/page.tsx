'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Star, Clock, Bike, ArrowRight, Heart,
  Search, ChevronRight, Flame,
  Pizza, Beef, Fish, Drumstick, IceCream2,
  Leaf, Salad, GlassWater, Tag, Package, Loader2,
  SlidersHorizontal, MapPin
} from 'lucide-react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, limit, where } from 'firebase/firestore';
import { useAuth } from '@/lib/AuthContext';

const categories = [
  { name: 'Todos',     icon: <SlidersHorizontal size={18} strokeWidth={1.8}/>, color: '#FF5722', iconColor: '#fff' },
  { name: 'Pizza',     icon: <Pizza size={18} strokeWidth={1.8}/>,         color: '#FFF0EB', iconColor: '#FF5722' },
  { name: 'Burgers',   icon: <Beef size={18} strokeWidth={1.8}/>,           color: '#EBF0FF', iconColor: '#3B82F6' },
  { name: 'Sushi',     icon: <Fish size={18} strokeWidth={1.8}/>,           color: '#EBFFF0', iconColor: '#22C55E' },
  { name: 'Pollo',     icon: <Drumstick size={18} strokeWidth={1.8}/>,      color: '#FFEBF4', iconColor: '#EC4899' },
  { name: 'Postres',   icon: <IceCream2 size={18} strokeWidth={1.8}/>,      color: '#F5EBFF', iconColor: '#A855F7' },
  { name: 'Vegano',    icon: <Leaf size={18} strokeWidth={1.8}/>,           color: '#EBFFF7', iconColor: '#10B981' },
  { name: 'Ensaladas', icon: <Salad size={18} strokeWidth={1.8}/>,          color: '#FFFAEB', iconColor: '#F59E0B' },
  { name: 'Bebidas',   icon: <GlassWater size={18} strokeWidth={1.8}/>,     color: '#EBFEFF', iconColor: '#06B6D4' },
];

export default function CustomerDashboard() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const [myBusinessRequest, setMyBusinessRequest] = useState<any>(null);

  // Track current user's own business request
  useEffect(() => {
    if (user) {
      const q = query(collection(db, 'business_requests'));
      const unsub = onSnapshot(q, (snap) => {
        const found = snap.docs.find(d => d.data().userId === user.uid);
        if (found) setMyBusinessRequest({ id: found.id, ...found.data() });
      });
      return () => unsub();
    }
  }, [user]);

  // Load restaurants: merge colección restaurants + business_requests aprobados
  useEffect(() => {
    let unsubBiz: (() => void) | undefined;

    const qRes = query(collection(db, 'restaurants'), limit(30));
    const unsubRes = onSnapshot(qRes, (resSnap) => {
      const fromRestaurants = resSnap.docs.map(d => ({
        id: d.id,
        _source: 'restaurants',
        ...d.data(),
      }));

      // También escuchar business_requests con status = approved
      const qBiz = query(
        collection(db, 'business_requests'),
        where('status', '==', 'approved')
      );
      if (unsubBiz) unsubBiz();
      unsubBiz = onSnapshot(qBiz, (bizSnap) => {
        const fromBiz = bizSnap.docs.map(d => {
          const data = d.data();
          const typeName = data.type
            ? data.type.charAt(0).toUpperCase() + data.type.slice(1)
            : 'Restaurante';
          return {
            id: d.id,
            _source: 'business',
            name: data.businessName || data.name || 'Local',
            category: typeName,
            rating: data.rating || 4.5,
            reviews: data.reviews || 0,
            time: data.deliveryTime || '30-45 min',
            delivery: data.deliveryFee ?? 1.50,
            image: data.image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=800&auto=format&fit=crop',
            isOpen: true,
            menu: data.menu || [],
            address: data.address || '',
          };
        });

        // Merge evitando duplicados por ID
        const bizIds = new Set(fromBiz.map(b => b.id));
        const merged = [
          ...fromRestaurants.filter(r => !bizIds.has(r.id)),
          ...fromBiz,
        ];
        setRestaurants(merged);
        setLoading(false);
      });
    });

    return () => {
      unsubRes();
      if (unsubBiz) unsubBiz();
    };
  }, []);

  const filtered = restaurants.filter(r => {
    const matchCat = activeCategory === 'Todos' || r.category === activeCategory;
    const matchSearch = (r.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div style={{ padding: '24px 0 100px', fontFamily: 'Inter, -apple-system, sans-serif' }}>

      {/* ── HERO BANNER ── */}
      <div style={{ padding: '0 32px 28px' }}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'linear-gradient(135deg, #1A1A1A 0%, #2D1500 100%)',
            borderRadius: '24px',
            padding: '32px 40px',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: '160px',
          }}
        >
          <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '250px', height: '250px', background: 'rgba(255,87,34,0.15)', borderRadius: '50%', filter: 'blur(60px)' }} />
          <div style={{ position: 'absolute', right: '40px', top: '50%', transform: 'translateY(-50%)', opacity: 0.08 }}>
            <Beef size={140} color="white" strokeWidth={1} />
          </div>

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,87,34,0.25)', borderRadius: '99px', padding: '4px 14px', marginBottom: '14px' }}>
              <Flame size={12} color="#FF5722" />
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#FF7A50', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Oferta del día</span>
            </div>
            <h2 style={{ margin: '0 0 6px', fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 900, color: 'white', lineHeight: 1.15, letterSpacing: '-0.5px' }}>
              Burger <span style={{ color: '#FF5722' }}>50% OFF</span>
              <br />en tu primer pedido
            </h2>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>Solo por hoy · Válido en todos los locales</p>
            <button style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#FF5722', border: 'none', borderRadius: '12px', padding: '12px 20px', color: 'white', fontSize: '13px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 16px rgba(255,87,34,0.4)' }}>
              Pedir ahora <ArrowRight size={15} />
            </button>
          </div>

          <div className="hidden md:flex" style={{ position: 'relative', zIndex: 1, gap: '32px', flexShrink: 0 }}>
            {[
              { label: 'Locales activos', value: `${restaurants.length}+` },
              { label: 'Entrega promedio', value: '28 min' },
              { label: 'Pedidos hoy', value: '3.4k' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '28px', fontWeight: 900, color: 'white', letterSpacing: '-1px' }}>{s.value}</p>
                <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── SEARCH BAR ── */}
      <div style={{ padding: '0 32px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'white', borderRadius: '16px', padding: '14px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)' }}>
          <Search size={18} color="#AAA" strokeWidth={2} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar restaurantes, comidas..."
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: '15px', color: '#111', background: 'transparent', fontFamily: 'Inter, sans-serif' }}
          />
        </div>
      </div>

      {/* ── MAIN: sidebar + grid ── */}
      <div style={{ display: 'flex', gap: '0', padding: '0 32px' }}>

        {/* Sidebar desktop */}
        <aside className="hidden md:flex" style={{ flexDirection: 'column', gap: '6px', width: '210px', flexShrink: 0, marginRight: '32px' }}>
          <p style={{ fontSize: '11px', fontWeight: 800, color: '#AAA', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Categorías</p>
          {categories.map((c) => {
            const active = activeCategory === c.name;
            return (
              <button
                key={c.name}
                onClick={() => setActiveCategory(c.name)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 14px', borderRadius: '14px', border: 'none',
                  background: active ? '#FF5722' : 'white',
                  color: active ? 'white' : '#444',
                  fontWeight: 700, fontSize: '13px', cursor: 'pointer', textAlign: 'left',
                  transition: 'all 0.15s',
                  boxShadow: active ? '0 4px 12px rgba(255,87,34,0.3)' : '0 1px 4px rgba(0,0,0,0.04)',
                }}
              >
                <span style={{ color: active ? 'white' : c.iconColor }}>{c.icon}</span>
                {c.name}
              </button>
            );
          })}
        </aside>

        {/* Mobile category scroll */}
        <div className="flex md:hidden" style={{ width: '100%', overflowX: 'auto', gap: '8px', paddingBottom: '16px', scrollbarWidth: 'none' }}>
          {categories.map((c) => {
            const active = activeCategory === c.name;
            return (
              <button
                key={c.name}
                onClick={() => setActiveCategory(c.name)}
                style={{
                  flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 14px', borderRadius: '12px', border: 'none',
                  background: active ? '#FF5722' : 'white',
                  color: active ? 'white' : '#444',
                  fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                  boxShadow: active ? '0 4px 12px rgba(255,87,34,0.3)' : '0 1px 4px rgba(0,0,0,0.04)',
                }}
              >
                <span style={{ color: active ? 'white' : c.iconColor }}>{c.icon}</span>
                {c.name}
              </button>
            );
          })}
        </div>

        {/* ── GRID ── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#111', letterSpacing: '-0.3px' }}>
                {activeCategory === 'Todos' ? 'Todos los locales' : activeCategory}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#E8FAF0', borderRadius: '99px', padding: '3px 10px' }}>
                <div style={{ width: '6px', height: '6px', background: '#22c55e', borderRadius: '50%' }} />
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#22c55e' }}>{filtered.length} abiertos</span>
              </div>
            </div>
            <span style={{ fontSize: '12px', color: '#AAA', fontWeight: 600 }}>{filtered.length} resultados</span>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <Loader2 className="animate-spin" size={36} color="#FF5722" />
              <p style={{ color: '#AAA', fontSize: '13px', fontWeight: 600 }}>Cargando restaurantes...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999', background: 'white', borderRadius: '24px' }}>
              <Search size={40} color="#DDD" style={{ marginBottom: '12px' }} />
              <h4 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 800, color: '#333' }}>Sin resultados</h4>
              <p style={{ margin: 0, fontSize: '13px' }}>Prueba con otra categoría o búsqueda.</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '20px',
            }}>
              {filtered.map((res, i) => (
                <Link key={res.id} href={`/order/restaurant/${res.id}`} style={{ textDecoration: 'none' }}>
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(0,0,0,0.12)' }}
                    style={{ background: 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', cursor: 'pointer' }}
                  >
                    <div style={{ position: 'relative', height: '175px' }}>
                      <img src={res.image} alt={res.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 50%)' }} />
                      {res.discount && (
                        <div style={{ position: 'absolute', top: '12px', left: '12px', background: '#FF5722', color: 'white', borderRadius: '10px', padding: '5px 10px', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Tag size={11} /> {res.discount}
                        </div>
                      )}
                      <button
                        onClick={(e) => { e.preventDefault(); setFavorites(f => f.includes(res.id) ? f.filter(x => x !== res.id) : [...f, res.id]); }}
                        style={{ position: 'absolute', top: '12px', right: '12px', width: '34px', height: '34px', background: 'white', border: 'none', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                      >
                        <Heart size={16} fill={favorites.includes(res.id) ? '#FF5722' : 'none'} stroke={favorites.includes(res.id) ? '#FF5722' : '#999'} />
                      </button>
                      <div style={{ position: 'absolute', bottom: '10px', left: '12px', background: 'white', borderRadius: '8px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Bike size={12} color="#FF5722" />
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#111' }}>
                          {res.delivery === 0 ? 'Gratis' : `$${Number(res.delivery || 0).toFixed(2)}`}
                        </span>
                      </div>
                    </div>
                    <div style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#FF5722', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{res.category}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Star size={13} fill="#FF5722" stroke="#FF5722" />
                          <span style={{ fontSize: '13px', fontWeight: 800, color: '#111' }}>{res.rating}</span>
                          <span style={{ fontSize: '11px', color: '#AAA', fontWeight: 500 }}>({res.reviews || 0})</span>
                        </div>
                      </div>
                      <h4 style={{ margin: '0 0 10px', fontSize: '15px', fontWeight: 900, color: '#111', letterSpacing: '-0.3px' }}>{res.name}</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} color="#CCC" strokeWidth={2} />
                          <span style={{ fontSize: '12px', color: '#888', fontWeight: 600 }}>{res.time || '30-45 min'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={12} color="#CCC" />
                          <span style={{ fontSize: '12px', color: '#888', fontWeight: 600 }}>Cerca de ti</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          )}

          {/* ── CTA ── */}
          <div style={{ marginTop: '40px' }}>
            {(!myBusinessRequest || myBusinessRequest.status !== 'approved') ? (
              <div style={{
                background: myBusinessRequest?.status === 'pending' ? '#F8F9FA' : 'linear-gradient(135deg, #FF5722 0%, #FF8A65 100%)',
                borderRadius: '24px', padding: '32px 40px', position: 'relative', overflow: 'hidden',
                border: myBusinessRequest?.status === 'pending' ? '1px solid #E0E0E0' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px',
              }}>
                <div style={{ position: 'absolute', bottom: '-20px', right: '-20px', opacity: 0.07 }}>
                  <Package size={160} color={myBusinessRequest?.status === 'pending' ? '#111' : 'white'} strokeWidth={1} />
                </div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: 800, color: myBusinessRequest?.status === 'pending' ? '#999' : 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {myBusinessRequest?.status === 'pending' ? 'Estado de tu solicitud' : '¿Tienes un negocio?'}
                  </p>
                  <h3 style={{ margin: '0 0 16px', fontSize: 'clamp(18px, 2vw, 24px)', fontWeight: 900, color: myBusinessRequest?.status === 'pending' ? '#111' : 'white', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
                    {myBusinessRequest?.status === 'pending' ? '¡Estamos revisando tu negocio!' : 'Vende con Deliveryy y llega a más clientes'}
                  </h3>
                  {myBusinessRequest?.status === 'pending' ? (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'white', padding: '10px 16px', borderRadius: '12px', color: '#888', fontSize: '12px', fontWeight: 700 }}>
                      <Clock size={16} /> En revisión en menos de 24h
                    </div>
                  ) : (
                    <Link href="/order/register-business" style={{ textDecoration: 'none' }}>
                      <button style={{ background: 'white', border: 'none', borderRadius: '14px', padding: '12px 24px', color: '#FF5722', fontWeight: 800, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                        Registrar mi Local <ChevronRight size={16} />
                      </button>
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ background: 'linear-gradient(135deg, #1A1A1A 0%, #333 100%)', borderRadius: '24px', padding: '32px 40px' }}>
                <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: 800, color: '#FF5722', textTransform: 'uppercase', letterSpacing: '0.1em' }}>¡Felicidades, Partner!</p>
                <h3 style={{ margin: '0 0 16px', fontSize: '20px', fontWeight: 900, color: 'white' }}>{myBusinessRequest.businessName} ya es oficial</h3>
                <Link href="/seller" style={{ textDecoration: 'none' }}>
                  <button style={{ background: '#FF5722', border: 'none', borderRadius: '14px', padding: '12px 24px', color: 'white', fontWeight: 800, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Ir a mi Panel de Negocio <ChevronRight size={16} />
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
