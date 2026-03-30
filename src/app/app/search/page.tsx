'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search as SearchIcon, Star, ChevronRight, Store, ChefHat, Loader2, Info, X } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import Link from 'next/link';

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Focus input on mount
  const inputRef = React.useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  useEffect(() => {
    // Escuchar locales activos
    const qBiz = query(collection(db, 'business_requests'), where('status', '==', 'approved'));
    const unsubBiz = onSnapshot(qBiz, (snap) => {
      const bizList = snap.docs.map(d => ({
        id: d.id,
        name: d.data().businessName || d.data().name || 'Local',
        image: d.data().image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=800&auto=format&fit=crop',
        category: d.data().type || 'Restaurante',
        rating: d.data().rating || 4.5,
      }));
      setRestaurants(bizList);
      setLoading(false);
    });

    // Escuchar productos globales
    const qProd = query(collection(db, 'products'));
    const unsubProd = onSnapshot(qProd, (snap) => {
      const prodList = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
      setProducts(prodList);
    });

    return () => {
      unsubBiz();
      unsubProd();
    };
  }, []);

  const queryLower = searchQuery.toLowerCase().trim();

  // Filtrar
  const filteredRestaurants = queryLower ? restaurants.filter(r => 
    r.name.toLowerCase().includes(queryLower) || 
    r.category.toLowerCase().includes(queryLower)
  ) : [];

  const filteredProducts = queryLower ? products.filter(p => 
    p.name?.toLowerCase().includes(queryLower) || 
    p.category?.toLowerCase().includes(queryLower)
  ) : [];

  return (
    <div style={{ minHeight: '100dvh', background: '#FAFAFA', fontFamily: 'system-ui, -apple-system, sans-serif', paddingBottom: '100px' }}>
      
      {/* ── HEADER BÚSQUEDA ── */}
      <div style={{ background: 'white', padding: '16px', borderBottom: '1px solid #F0F0F0', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#F3F4F6', borderRadius: '12px', padding: '12px 16px' }}>
          <SearchIcon size={20} color="#9CA3AF" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar restaurantes o platos"
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: '15px', color: '#111', background: 'transparent' }}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', padding: 0, color: '#9CA3AF', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', itemsCenter: 'center', justifyContent: 'center', padding: '60px 0', gap: '16px' }}>
            <Loader2 className="animate-spin" color="#16A34A" size={32} style={{ margin: '0 auto' }} />
            <p style={{ textAlign: 'center', color: '#9CA3AF', fontSize: '13px', fontWeight: 600 }}>Buscando lo mejor para ti...</p>
          </div>
        ) : !queryLower ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: '16px', opacity: 0.5 }}>
             <SearchIcon size={48} color="#D1D5DB" />
             <p style={{ color: '#6B7280', fontSize: '14px', fontWeight: 600 }}>Escribe para buscar</p>
          </div>
        ) : (filteredRestaurants.length === 0 && filteredProducts.length === 0) ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: '16px', textAlign: 'center' }}>
            <Info size={48} color="#D1D5DB" />
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#111' }}>Sin resultados</h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#6B7280' }}>No encontramos coincidencias para "{searchQuery}"</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* ── RESULTADOS RESTAURANTES ── */}
            {filteredRestaurants.length > 0 && (
              <section>
                <h2 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 800, color: '#111' }}>Restaurantes</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {filteredRestaurants.map(r => (
                    <Link key={r.id} href={`/app/restaurant/${r.id}`} style={{ textDecoration: 'none' }}>
                      <div style={{ background: 'white', borderRadius: '16px', padding: '12px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid #F3F4F6' }}>
                        <img src={r.image} alt={r.name} style={{ width: '64px', height: '64px', borderRadius: '12px', objectFit: 'cover' }} />
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: '0 0 2px', fontSize: '15px', fontWeight: 700, color: '#111' }}>{r.name}</h4>
                          <p style={{ margin: '0 0 6px', fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>{r.category}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#F59E0B' }}>
                            <Star size={12} fill="#F59E0B" />
                            <span style={{ fontSize: '12px', fontWeight: 700 }}>{r.rating}</span>
                          </div>
                        </div>
                        <ChevronRight size={18} color="#D1D5DB" />
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* ── RESULTADOS PRODUCTOS ── */}
            {filteredProducts.length > 0 && (
              <section>
                <h2 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 800, color: '#111' }}>Platos</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {filteredProducts.map(p => {
                    const r = restaurants.find(res => res.id === p.businessId);
                    return (
                      <Link key={p.id} href={`/app/restaurant/${p.businessId}`} style={{ textDecoration: 'none' }}>
                        <div style={{ background: 'white', borderRadius: '16px', padding: '12px', display: 'flex', gap: '12px', border: '1px solid #F3F4F6' }}>
                          <div style={{ width: '80px', height: '80px', borderRadius: '12px', background: '#F3F4F6', overflow: 'hidden', flexShrink: 0 }}>
                             {p.image ? (
                               <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                             ) : (
                               <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                 <ChefHat size={32} color="#D1D5DB" />
                               </div>
                             )}
                          </div>
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                             <h4 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 700, color: '#111' }}>{p.name}</h4>
                             <p style={{ margin: '0 0 8px', fontSize: '11px', color: '#6B7280' }}>Local: <strong style={{ color: '#111' }}>{r?.name || 'Local'}</strong></p>
                             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '14px', fontWeight: 800, color: '#16A34A' }}>${p.price.toFixed(2)}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#16A34A', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>
                                  Ver plato <ChevronRight size={12} strokeWidth={3} />
                                </div>
                             </div>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </section>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
