'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search as SearchIcon, MapPin, Star, Bike, ChevronRight, Store, ChefHat, Loader2, Info } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
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
    <div className="flex flex-col gap-8 min-h-screen pb-24 md:pb-12 bg-[#F8F9FA] font-sans">
      
      {/* ── HEADER BÚSQUEDA ── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 md:top-[64px] z-40 p-4 md:px-8 py-6 shadow-sm">
        <h1 className="text-2xl md:text-3xl font-black text-[#111] tracking-tight mb-4 hidden md:block">Búsqueda Global</h1>
        <div className="relative max-w-2xl mx-auto md:mx-0">
          <SearchIcon size={22} className="absolute left-5 top-1/2 -translate-y-1/2 text-orange-500" strokeWidth={2.5} />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="¿Qué se te antoja hoy? (ej. Hamburguesa, Pizza, Sushi...)"
            className="w-full bg-[#F5F5F7] border-2 border-transparent focus:border-orange-200 outline-none rounded-2xl py-4 pl-14 pr-6 text-[15px] font-bold text-[#111] transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-7 h-7 bg-white rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 shadow-sm"
            >
              <ChevronRight size={14} className="rotate-45" /> {/* Close-like cross */}
            </button>
          )}
        </div>
      </div>

      <div className="px-4 md:px-8 max-w-6xl mx-auto w-full flex-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-orange-500" size={40} />
            <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">Buscando...</p>
          </div>
        ) : !queryLower ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
             <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
               <SearchIcon size={40} className="text-gray-300" />
             </div>
             <p className="text-gray-500 font-bold text-sm">Escribe algo para empezar a buscar</p>
          </div>
        ) : (filteredRestaurants.length === 0 && filteredProducts.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <Info size={40} className="text-gray-300 mb-2" />
            <h3 className="text-xl font-black text-[#111]">No encontramos resultados</h3>
            <p className="text-gray-500 font-medium text-sm">No hay restaurantes ni platos que coincidan con "{searchQuery}"</p>
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            
            {/* ── RESULTADOS CABAÑAS/RESTAURANTES ── */}
            {filteredRestaurants.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-blue-50 flex items-center justify-center rounded-lg text-blue-500"><Store size={18} /></div>
                  <h2 className="text-xl font-black tracking-tight" style={{ color: '#111' }}>Restaurantes ({filteredRestaurants.length})</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {filteredRestaurants.map(r => (
                    <Link key={r.id} href={`/order/restaurant/${r.id}`} className="block relative bg-white border border-gray-100 rounded-[20px] p-4 flex items-center gap-4 hover:shadow-xl hover:-translate-y-1 transition-all group">
                       <img src={r.image} alt={r.name} className="w-20 h-20 rounded-[14px] object-cover bg-gray-50" />
                       <div className="flex-1 min-w-0">
                         <h3 className="font-black text-[15px] text-[#111] truncate mb-1 group-hover:text-orange-500 transition-colors uppercase">{r.name}</h3>
                         <p className="text-[12px] text-gray-400 font-bold uppercase tracking-wider mb-2">{r.category}</p>
                         <div className="flex items-center gap-1.5 bg-orange-50 text-orange-600 w-fit px-2 py-1 rounded-md text-[11px] font-black">
                           <Star size={11} fill="currentColor" /> {r.rating}
                         </div>
                       </div>
                       <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white text-gray-400 transition-all flex-shrink-0">
                         <ChevronRight size={16} />
                       </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* ── RESULTADOS PLATOS ── */}
            {filteredProducts.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-orange-50 flex items-center justify-center rounded-lg text-orange-500"><ChefHat size={18} /></div>
                  <h2 className="text-xl font-black tracking-tight" style={{ color: '#111' }}>Platos y Productos ({filteredProducts.length})</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {filteredProducts.map(p => {
                    const r = restaurants.find(res => res.id === p.businessId);
                    return (
                      <Link key={p.id} href={`/order/restaurant/${p.businessId}`} className="block bg-white border border-gray-100 rounded-[20px] p-4 flex gap-4 hover:shadow-xl hover:-translate-y-1 transition-all group">
                        <div className="w-24 h-24 rounded-[16px] bg-gray-100 relative overflow-hidden flex-shrink-0">
                           {p.image ? (
                             <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                           ) : (
                             <ChefHat size={30} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-300" />
                           )}
                           <div className="absolute top-0 right-0 bg-white/90 backdrop-blur-sm text-[#111] font-black py-1 px-2 text-[10px] rounded-bl-[12px]">
                             ${p.price.toFixed(2)}
                           </div>
                        </div>
                        <div className="flex flex-col justify-center flex-1 min-w-0 pr-2">
                           <h4 className="font-bold text-[14px] leading-tight text-[#111] mb-1 group-hover:text-orange-500 transition-colors line-clamp-2">{p.name}</h4>
                           <p className="text-[11px] text-gray-400 font-medium line-clamp-1 mb-2">Vendidos aquí: <strong className="text-gray-600">{r?.name || 'Local'}</strong></p>
                           <button className="mt-auto self-start bg-orange-50 text-orange-600 font-bold px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider group-hover:bg-orange-500 group-hover:text-white transition-colors flex items-center gap-1">
                             Ir al local <ChevronRight size={12} />
                           </button>
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
