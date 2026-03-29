'use client';

import React from 'react';
import { 
  Store, 
  LayoutDashboard, 
  ClipboardList, 
  UtensilsCrossed, 
  TrendingUp, 
  Settings, 
  Bell, 
  Search, 
  LogOut 
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RestaurantPortalLayout({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex font-sans">
      
      {/* ── Desktop Sidebar ── */}
      <aside className="w-[300px] h-screen bg-[#1A1A1A] text-white flex flex-col sticky top-0 py-10 px-6 z-50">
        <div className="flex items-center gap-3 mb-12 px-4">
          <div className="bg-orange-500 p-2 rounded-xl">
             <Store size={22} />
          </div>
          <span className="text-xl font-black tracking-tighter uppercase leading-none">Portal <span className="text-orange-500">Local</span></span>
        </div>

        <div className="flex flex-col gap-2 flex-1">
          <Link href="/portal" className="flex items-center gap-4 p-4 bg-orange-500/10 text-orange-500 rounded-2xl group transition-all shadow-lg shadow-orange-500/5">
            <LayoutDashboard size={20} />
            <span className="font-bold text-sm tracking-tight">Escritorio</span>
          </Link>
          <Link href="/portal/orders" className="flex items-center gap-4 p-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-2xl transition-all font-bold text-sm tracking-tight group">
            <ClipboardList size={20} className="group-hover:text-orange-500" />
            Pedidos <div className="ml-auto bg-orange-500 text-white text-[10px] px-2 py-1 rounded-full">3</div>
          </Link>
          <Link href="/portal/menu" className="flex items-center gap-4 p-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-2xl transition-all font-bold text-sm tracking-tight group">
            <UtensilsCrossed size={20} className="group-hover:text-orange-500" />
            Gestión de Menú
          </Link>
          <Link href="/portal/analytics" className="flex items-center gap-4 p-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-2xl transition-all font-bold text-sm tracking-tight group">
            <TrendingUp size={20} className="group-hover:text-orange-500" />
            Ventas / Reportes
          </Link>
        </div>

        <div className="flex flex-col gap-2 mt-auto">
          <Link href="/portal/settings" className="flex items-center gap-4 p-4 text-gray-500 hover:text-white hover:bg-white/5 rounded-2xl transition-all font-bold text-sm tracking-tight group">
            <Settings size={20} className="group-hover:text-orange-500" />
            Ajustes
          </Link>
          <button 
            onClick={handleSignOut}
            className="flex items-center gap-4 p-4 text-red-400 hover:bg-red-500 hover:text-white rounded-2xl transition-all font-bold text-sm tracking-tight"
          >
            <LogOut size={20} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top bar */}
        <header className="h-24 bg-white/60 backdrop-blur-md sticky top-0 px-10 flex items-center justify-between z-40 border-b border-gray-100">
          <div className="flex-1 max-w-[400px] relative">
            <div className="absolute inset-y-0 left-4 flex items-center shadow-sm">
                <Search className="text-gray-300" size={18} />
            </div>
            <input 
              type="text" 
              placeholder="Buscar pedido, cliente..." 
              className="w-full bg-white border border-gray-100 focus:border-orange-500/30 outline-none rounded-2xl py-3 pl-12 pr-4 text-xs font-semibold"
            />
          </div>

          <div className="flex items-center gap-6">
            <button className="relative w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-gray-100 shadow-sm hover:border-orange-500/20 transition-all">
               <Bell size={20} className="text-gray-400" />
               <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            <div className="flex items-center gap-4 pl-6 border-l border-gray-100">
               <div className="flex flex-col items-end">
                  <span className="text-sm font-black text-[#111] leading-none uppercase tracking-tighter">Burger Paradise</span>
                  <span className="text-[10px] text-green-500 font-black uppercase tracking-widest mt-1 underline decoration-green-500/30 decoration-2">Local Online</span>
               </div>
               <div className="w-12 h-12 bg-orange-500 rounded-2xl shadow-xl shadow-orange-500/20 flex items-center justify-center text-white font-black text-xl border-2 border-white">
                 B
               </div>
            </div>
          </div>
        </header>

        <main className="p-10 flex-1">
          {children}
        </main>

      </div>
    </div>
  );
}
