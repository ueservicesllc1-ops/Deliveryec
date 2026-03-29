'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Navigation, 
  MapPin, 
  Phone, 
  MessageCircle, 
  ChevronRight, 
  Info, 
  Maximize2 
} from 'lucide-react';

export default function DriverMapPage() {
  return (
    <div className="absolute inset-0 bg-[#111] overflow-hidden flex flex-col pt-20 pb-24">
      
      {/* ── Mock Map ── */}
      <div className="flex-1 relative bg-[#1A1A1A] overflow-hidden">
         {/* Map Background Grid */}
         <div className="absolute inset-0 opacity-10" style={{ 
            backgroundImage: 'radial-gradient(#ffffff 0.5px, transparent 0.5px)', 
            backgroundSize: '30px 30px' 
         }} />
         
         {/* Mock Road Lines */}
         <svg className="absolute inset-0 w-full h-full opacity-5">
            <path d="M0,100 L1000,800 M200,0 L800,1000 M0,500 L1000,500" stroke="white" strokeWidth="40" fill="none" />
         </svg>

         {/* Driver Marker */}
         <motion.div 
           initial={{ x: 100, y: 100 }}
           animate={{ x: 250, y: 350 }}
           transition={{ duration: 10, repeat: Infinity, repeatType: 'reverse' }}
           className="absolute z-20 flex flex-col items-center gap-2"
         >
            <div className="bg-orange-500 p-3 rounded-full shadow-[0_0_30px_rgba(255,87,34,0.6)] border-4 border-[#111]">
               <Navigation size={24} className="text-white rotate-45" />
            </div>
            <div className="bg-[#111] px-3 py-1 rounded-lg border border-white/10 text-[10px] font-black uppercase tracking-widest text-white whitespace-nowrap">
              En movimiento
            </div>
         </motion.div>

         {/* Destination Marker */}
         <div className="absolute top-1/2 left-2/3 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center gap-2">
            <div className="bg-green-500 p-3 rounded-full shadow-[0_0_30px_rgba(34,197,94,0.4)] border-4 border-[#111]">
               <MapPin size={24} className="text-white" />
            </div>
            <div className="bg-[#111] px-3 py-1 rounded-lg border border-white/10 text-[10px] font-black uppercase tracking-widest text-white whitespace-nowrap">
              Av. De Los Shyris
            </div>
         </div>

         {/* Route Line */}
         <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
            <motion.path 
               d="M250,350 L500,500" 
               stroke="#FF5722" 
               strokeWidth="6" 
               strokeLinecap="round" 
               strokeDasharray="12,12"
               fill="none"
               animate={{ strokeDashoffset: -24 }}
               transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
         </svg>

         {/* Map Overlay Controls */}
         <div className="absolute top-6 right-6 flex flex-col gap-3">
            <button className="bg-[#1A1A1A]/80 backdrop-blur-md p-4 rounded-2xl border border-white/5 text-white hover:bg-[#2A2A2A] transition-all">
               <Maximize2 size={20} />
            </button>
            <button className="bg-orange-500 p-4 rounded-2xl text-white shadow-xl shadow-orange-500/20 hover:scale-105 transition-all">
               <Navigation size={20} />
            </button>
         </div>
      </div>

      {/* ── Active Delivery Info Panel (Floating) ── */}
      <div className="absolute bottom-28 left-6 right-6 z-30">
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-[#1A1A1A] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden relative"
        >
          <div className="flex items-center justify-between mb-8">
             <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/5 rounded-2xl overflow-hidden shadow-xl">
                   <img src="https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?q=80&w=200&auto=format&fit=crop" className="w-full h-full object-cover" alt="" />
                </div>
                <div>
                   <h4 className="text-lg font-black tracking-tight text-white uppercase leading-none">Burger Paradise</h4>
                   <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest bg-orange-500/10 px-2 py-0.5 rounded-full mt-2 inline-block">Pedido #45812</span>
                </div>
             </div>
             <div className="flex gap-2">
                <button className="w-14 h-14 bg-blue-500/10 hover:bg-blue-500 text-blue-500 hover:text-white rounded-2xl flex items-center justify-center transition-all border border-blue-500/20">
                   <MessageCircle size={22} />
                </button>
                <button className="w-14 h-14 bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-white rounded-2xl flex items-center justify-center transition-all border border-green-500/20">
                   <Phone size={22} />
                </button>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="bg-white/5 p-5 rounded-2xl border border-white/5 flex flex-col gap-1">
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Entrega en</span>
                <span className="text-xl font-black text-white">12 min <span className="text-orange-500 text-sm font-bold ml-1">2.4km</span></span>
             </div>
             <button className="bg-white text-[#111] font-black p-5 rounded-2xl text-[10px] uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all shadow-xl flex items-center justify-center gap-3">
                Finalizar pedido <ChevronRight size={18} />
             </button>
          </div>

          <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-orange-500/5 to-transparent pointer-events-none" />
        </motion.div>
      </div>

    </div>
  );
}
