'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Star, Clock, Bike, ArrowRight, Heart,
  Search, ChevronRight, Flame,
  Pizza, Beef, Fish, Drumstick, IceCream2,
  Leaf, Salad, GlassWater, Tag, Package, Loader2,
  SlidersHorizontal, MapPin, X
} from 'lucide-react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, limit, where, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/lib/AuthContext';
import AddressAutocomplete from '@/components/AddressAutocomplete';

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
  const { user, profile } = useAuth();
  const [myBusinessRequest, setMyBusinessRequest] = useState<any>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);

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

  return (    <div style={{ padding: '0 0 100px', fontFamily: 'system-ui, -apple-system, sans-serif', background: '#FAFAFA' }}>

      {/* ── TOP SEARCH INPUT (Inside Page, App-like) ── */}
      <div style={{ padding: '16px 16px', background: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#FFFFFF', borderRadius: '12px', padding: '12px 16px', border: '1px solid #E5E5E5', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <Search size={20} color="#A3A3A3" strokeWidth={2} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar restaurantes o platos"
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: '15px', color: '#111', background: 'transparent' }}
          />
          <SlidersHorizontal size={20} color="#16A34A" strokeWidth={2} />
        </div>
      </div>

      {/* ── INFO BAR (Location & Delivery Data) ── */}
      <div style={{ padding: '0 16px 16px', background: 'white', borderBottom: '1px solid #F0F0F0' }}>
        <div 
          onClick={() => setShowAddressModal(true)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={18} color="#16A34A" strokeWidth={2.5} />
            <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: 500 }}>Envío a:</span>
            <span style={{ fontSize: '14px', fontWeight: 800, color: '#111', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile?.defaultAddress || 'Seleccionar dirección...'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#6B7280' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#16A34A', background: '#F0FDF4', padding: '2px 8px', borderRadius: '4px' }}>
              CAMBIAR
            </span>
            <ChevronRight size={14} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F9FAFB', borderRadius: '8px', padding: '10px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#16A34A' }}>
            <Clock size={16} strokeWidth={2.5} />
            <span style={{ fontSize: '13px', fontWeight: 800 }}>{profile?.defaultAddress ? '15-20 min' : 'Calculando...'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: 600 }}>Costo de envío:</span>
            <span style={{ fontSize: '14px', fontWeight: 900, color: '#111' }}>
              {profile?.defaultAddress ? '$1.50' : '---'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#16A34A', background: '#DCFCE7', padding: '4px 8px', borderRadius: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 900 }}>PROMO</span>
          </div>
        </div>
      </div>

      {/* ── PILL HORIZONTAL MENU ── */}
      <div style={{ padding: '16px', background: 'white' }}>
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', scrollbarWidth: 'none' }}>
          <button style={{ flexShrink: 0, padding: '8px 16px', borderRadius: '24px', border: '1px solid #16A34A', background: 'white', color: '#16A34A', fontSize: '13px', fontWeight: 700 }}>
            Entrega Gratis
          </button>
          <button style={{ flexShrink: 0, padding: '8px 16px', borderRadius: '24px', border: '1px solid #E5E5E5', background: 'white', color: '#4B5563', fontSize: '13px', fontWeight: 600 }}>
            Promociones
          </button>
          <button style={{ flexShrink: 0, padding: '8px 16px', borderRadius: '24px', border: '1px solid #E5E5E5', background: 'white', color: '#4B5563', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            Más Populares <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* ── HERO BANNER ── */}
      <div style={{ padding: '0 16px 24px', background: 'white' }}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1600&auto=format&fit=crop")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderRadius: '16px',
            position: 'relative',
            overflow: 'hidden',
            minHeight: '180px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
          }}
        >
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)' }} />
          
          <div style={{ position: 'relative', zIndex: 1, padding: '24px 20px', width: '60%' }}>
            <h2 style={{ margin: '0 0 8px', fontSize: '26px', fontWeight: 900, color: 'white', lineHeight: 1.1, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              2x1 en <br/> Burgers Hoy! <Flame size={24} color="#4CAF50" fill="#4CAF50" />
            </h2>
            <p style={{ margin: '0 0 16px', fontSize: '12px', color: 'rgba(255,255,255,0.9)', fontWeight: 500, lineHeight: 1.3 }}>
              Pide una burger y la segunda sale gratis
            </p>
            <button style={{ 
              background: 'linear-gradient(to bottom, #4CAF50, #2E7D32)', 
              border: 'none', 
              borderRadius: '8px', 
              padding: '10px 20px', 
              color: 'white', 
              fontSize: '13px', 
              fontWeight: 800, 
              cursor: 'pointer', 
              boxShadow: '0 4px 12px rgba(76,175,80,0.4)',
              width: 'fit-content'
            }}>
              Pedir ahora
            </button>
          </div>
        </motion.div>
      </div>

      {/* ── LISTA DE RECOMENDADOS ── */}
      <div style={{ padding: '0 16px', background: 'white', paddingBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#111', letterSpacing: '-0.3px' }}>
            Recomendados
          </h3>
          <ChevronRight size={18} color="#9CA3AF" />
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <Loader2 className="animate-spin" size={32} color="#16A34A" />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filtered.map((res, i) => (
              <Link key={res.id} href={`/app/restaurant/${res.id}`} style={{ textDecoration: 'none' }}>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  style={{ 
                    background: 'white', 
                    borderRadius: '16px', 
                    border: '1px solid #F3F4F6',
                    overflow: 'hidden', 
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <div style={{ display: 'flex', height: '140px' }}>
                    {/* Left Image */}
                    <div style={{ width: '130px', flexShrink: 0, position: 'relative' }}>
                      <img src={res.image} alt={res.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    
                    {/* Right Content */}
                    <div style={{ padding: '12px 16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <h4 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 800, color: '#111' }}>{res.name}</h4>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', color: '#F59E0B' }}>
                          <Star size={12} fill="#F59E0B" />
                          <Star size={12} fill="#F59E0B" />
                          <Star size={12} fill="#F59E0B" />
                          <Star size={12} fill="#F59E0B" />
                          <Star size={12} fill="#F59E0B" />
                        </div>
                        <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: 500 }}>({res.reviews || '1.1k'}) ({res.reviews || '1.1k'})</span>
                      </div>
                      
                      <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>
                        {res.category} · {res.time || '15-25 min'}
                      </p>
                      
                      <div style={{ display: 'inline-flex', alignItems: 'center', background: '#DCFCE7', color: '#16A34A', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, width: 'fit-content' }}>
                        Entrega Gratis
                      </div>
                    </div>
                  </div>
                  
                  {/* Bottom Strip */}
                  <div style={{ borderTop: '1px solid #F3F4F6', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#374151' }}>Ver Menú Completo</span>
                    <ChevronRight size={16} color="#16A34A" strokeWidth={3} />
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </div>
      {/* ── ADDRESS SELECTION MODAL ── */}
      {showAddressModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            style={{ width: '100%', maxWidth: '500px', background: 'white', borderRadius: '24px 24px 0 0', padding: '24px', boxShadow: '0 -10px 25px rgba(0,0,0,0.1)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>¿A dónde enviamos?</h3>
              <button onClick={() => setShowAddressModal(false)} style={{ background: '#F3F4F6', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X size={20} color="#6B7280" />
              </button>
            </div>
            
            <AddressAutocomplete 
              onAddressSelect={async (addr) => {
                if (user && addr) {
                  try {
                    await updateDoc(doc(db, 'users', user.uid), {
                      defaultAddress: addr
                    });
                  } catch (e) { console.error("Error updating address", e); }
                }
                setShowAddressModal(false);
              }}
              placeholder="Escribe tu calle o sector..."
            />
            
            <p style={{ marginTop: '16px', fontSize: '12px', color: '#9CA3AF', textAlign: 'center', fontWeight: 500 }}>
              El costo de envío se calculará según tu ubicación.
            </p>
          </motion.div>
        </div>
      )}
    </div>
  );
}
