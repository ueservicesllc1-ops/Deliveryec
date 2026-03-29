'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, ChevronLeft, ChevronDown, Check, Lock, 
  CreditCard, Wallet, Landmark, Plus, Minus,
  ShoppingBag, Info, ShieldCheck, MapPin, Phone, User,
  Bike, Loader2, X
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { useCart } from '@/lib/CartContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import AddressAutocomplete from '@/components/AddressAutocomplete';

export default function CheckoutPage() {
  const { user, profile } = useAuth();
  const { cart, restaurantId, restaurantName, removeFromCart, addToCart, clearCart, subtotal } = useCart();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [observations, setObservations] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (profile) {
      if (!name && profile.name) setName(profile.name);
      if (!phone && profile.phone) setPhone(profile.phone);
      if (!address && profile.defaultAddress) setAddress(profile.defaultAddress);
    }
  }, [profile]);

  const deliveryFee = 20;
  const total = subtotal + deliveryFee;

  const handlePlaceOrder = async () => {
    if (!user) { router.push('/login'); return; }
    if (!address || !name || !phone) { alert('Por favor completa todos los datos del pedido'); return; }

    setIsProcessing(true);
    try {
      const orderData = {
        customerId: user.uid,
        customerName: name,
        customerPhone: phone,
        observations,
        restaurantId,
        restaurantName,
        address,
        items: cart,
        total,
        status: 'pending',
        paymentMethod,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'orders'), orderData);
      clearCart();
      router.push(`/order/track/${docRef.id}`);
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-20 selection:bg-orange-100">
      
      {/* ── HEADER ── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-[100] h-20 shadow-sm">
        <div className="max-w-[1280px] mx-auto px-10 h-full flex items-center justify-between gap-12">
           <div className="flex items-center gap-3 cursor-pointer group" onClick={() => router.push('/order')}>
             <div className="bg-orange-500 p-2 rounded-xl group-hover:scale-110 transition-transform">
               <Bike className="text-white" size={24} />
             </div>
             <span className="text-2xl font-black tracking-tighter text-slate-900 leading-none">Delivery<span className="text-orange-500 italic">Go</span></span>
           </div>

           <div className="flex-1 max-w-xl relative flex items-center">
             <div className="absolute left-4 z-10"><Search size={18} className="text-slate-300" /></div>
             <input 
               type="text" 
               placeholder="Busca comida, tiendas o productos..." 
               className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 pl-12 pr-12 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/30 text-sm font-semibold transition-all placeholder:text-slate-400 outline-none"
             />
             <div className="absolute right-4 text-slate-300"><ChevronDown size={18} /></div>
           </div>

           <button 
             onClick={handlePlaceOrder}
             disabled={isProcessing}
             className="bg-[#5A9E1F] hover:bg-[#4D881B] text-white font-black py-4 px-10 rounded-2xl transition-all shadow-xl shadow-green-600/20 text-xs uppercase tracking-widest flex items-center gap-3 whitespace-nowrap active:scale-95 disabled:opacity-50 border-none"
           >
             {isProcessing ? <Loader2 className="animate-spin" size={18} /> : null}
             Finalizar Compra
           </button>
        </div>
      </header>

      {/* ── STEPPER ── */}
      <div className="max-w-[1280px] mx-auto py-12 px-10">
         <div className="flex items-center justify-center gap-8 relative">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-[#5A9E1F] text-white flex items-center justify-center shadow-lg shadow-green-200">
                 <Check size={20} strokeWidth={4} />
               </div>
               <span className="font-black text-slate-400 text-xs uppercase tracking-widest">Datos del Pedido</span>
            </div>
            <div className="h-0.5 w-24 bg-slate-100 rounded-full" />
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-[#5A9E1F] text-white flex items-center justify-center shadow-lg shadow-green-200">
                 <Check size={20} strokeWidth={4} />
               </div>
               <span className="font-black text-slate-400 text-xs uppercase tracking-widest">Método de Pago</span>
            </div>
            <div className="h-0.5 w-24 bg-orange-500/30 rounded-full" />
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-xl shadow-orange-200 ring-4 ring-orange-50">
                 <span className="font-black text-xs">3</span>
               </div>
               <span className="font-black text-orange-500 text-xs uppercase tracking-widest">Resumen</span>
            </div>
         </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <main className="max-w-[1280px] mx-auto px-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
         
         <div className="lg:col-span-8 space-y-12">
            
            {/* 📍 DATOS DEL PEDIDO CARD */}
            <section className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
               <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-8">Datos del Pedido</h3>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Nombre</label>
                    <input 
                      value={name} onChange={e => setName(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-4 px-6 focus:border-orange-500 focus:bg-white focus:outline-none transition-all font-bold text-slate-700"
                      placeholder="Tu nombre completo"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Teléfono</label>
                    <input 
                      value={phone} onChange={e => setPhone(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-4 px-6 focus:border-orange-500 focus:bg-white focus:outline-none transition-all font-bold text-slate-700"
                      placeholder="(593) 09..."
                    />
                  </div>

                  <div className="md:col-span-1 space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Dirección de Entrega</label>
                    <AddressAutocomplete 
                      initialValue={address} 
                      onAddressSelect={(addr) => setAddress(addr)} 
                    />
                  </div>

                  <div className="md:col-span-1 space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Observaciones</label>
                    <textarea 
                      value={observations} onChange={e => setObservations(e.target.value)}
                      placeholder="Ej: Sin cebolla, llamar al llegar..."
                      className="w-full h-[100px] bg-slate-50 border-2 border-slate-50 rounded-2xl py-4 px-6 focus:border-orange-500 focus:bg-white focus:outline-none transition-all font-bold text-slate-700 resize-none"
                    />
                  </div>
               </div>

               <div className="mt-10 flex items-center justify-between p-5 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <div className="flex items-center gap-3">
                    <div className="bg-white rounded-full p-1 shadow-sm"><Check className="text-emerald-500" size={16} strokeWidth={4} /></div>
                    <span className="text-[11px] font-black text-emerald-700 uppercase tracking-widest">Datos guardados y verificados</span>
                  </div>
                  <Check className="text-emerald-500" size={24} strokeWidth={4} />
               </div>
            </section>

            {/* 💳 METODO DE PAGO CARD */}
            <section className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
               <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-8">Método de Pago</h3>
               
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                  {[
                    { id: 'cash', label: 'Efectivo', icon: <Wallet size={20} /> },
                    { id: 'card', label: 'Tarjeta Crédito/Débito', icon: <CreditCard size={20} /> },
                    { id: 'transfer', label: 'Transferencia', icon: <Landmark size={20} /> }
                  ].map((m) => (
                    <button 
                      key={m.id}
                      onClick={() => setPaymentMethod(m.id)}
                      className={`flex flex-col gap-4 p-8 rounded-3xl border-2 transition-all text-left ${
                        paymentMethod === m.id 
                        ? 'border-orange-500 bg-orange-50/50 shadow-lg shadow-orange-500/5' 
                        : 'border-slate-50 hover:border-slate-200'
                      }`}
                    >
                      <div className={paymentMethod === m.id ? 'text-orange-500' : 'text-slate-300'}>{m.icon}</div>
                      <span className={`text-[11px] font-black uppercase tracking-widest ${paymentMethod === m.id ? 'text-orange-600' : 'text-slate-400'}`}>{m.label}</span>
                    </button>
                  ))}
               </div>

               {paymentMethod === 'card' && (
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 p-8 bg-slate-50 rounded-[2rem] border-2 border-slate-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-3">
                          <div className="flex justify-between items-center px-1">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Número</label>
                             <div className="flex gap-2 opacity-50"><CreditCard size={14} /></div>
                          </div>
                          <input type="text" placeholder="XXXX XXXX XXXX XXXX" className="w-full bg-white border-none rounded-2xl py-4 px-6 text-sm font-black shadow-sm focus:ring-2 focus:ring-orange-500/20" />
                       </div>
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">Nombre</label>
                          <div className="relative">
                            <input type="text" placeholder="JUAN PEREZ" className="w-full bg-white border-none rounded-2xl py-4 px-6 text-sm font-black shadow-sm focus:ring-2 focus:ring-orange-500/20" />
                            <Check className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500 bg-emerald-50 rounded-full p-1" size={20} strokeWidth={4} />
                          </div>
                       </div>
                       <div className="grid grid-cols-2 gap-6 md:col-span-2">
                          <div className="space-y-3">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">Vencimiento</label>
                             <div className="flex gap-4">
                                <select className="flex-1 bg-white border-none rounded-2xl py-4 px-6 text-sm font-black cursor-pointer shadow-sm"><option>12</option></select>
                                <select className="flex-1 bg-white border-none rounded-2xl py-4 px-6 text-sm font-black cursor-pointer shadow-sm"><option>/ 26</option></select>
                             </div>
                          </div>
                          <div className="space-y-3">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">CVC</label>
                             <div className="relative">
                                <input type="text" placeholder="123" className="w-full bg-white border-none rounded-2xl py-4 px-6 text-sm font-black shadow-sm focus:ring-2 focus:ring-orange-500/20" />
                                <Check className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500 bg-emerald-50 rounded-full p-1" size={20} strokeWidth={4} />
                             </div>
                          </div>
                       </div>
                    </div>
                 </motion.div>
               )}

               <div className="mt-12 flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none border-t border-slate-50 pt-8">
                  <Lock size={14} className="text-slate-300" /> Pagos seguros con encriptación SSL
               </div>
            </section>
         </div>

         {/* ── SIDEBAR RESUMEN CARD ── */}
         <aside className="lg:col-span-4 lg:sticky lg:top-24 h-fit">
            <div className="bg-[#1E293B] rounded-[3rem] p-10 shadow-2xl shadow-slate-900/10 text-white flex flex-col">
               <div className="flex items-center justify-between mb-12">
                 <h2 className="text-2xl font-black uppercase tracking-tighter">Resumen</h2>
                 <button className="text-slate-600 hover:text-white transition-colors"><Plus size={20} className="rotate-45" /></button>
               </div>

               <div className="space-y-8 mb-12 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                  {cart.map((item) => (
                    <div key={item.id} className="flex gap-5 group">
                       <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 border-2 border-white/5 group-hover:border-orange-500/30 transition-colors">
                         <img src={item.image} className="w-full h-full object-cover" alt="" />
                       </div>
                       <div className="flex-1 py-1">
                          <h4 className="font-bold text-[13px] tracking-tight leading-tight mb-2 uppercase">{item.name}</h4>
                          <span className="text-[10px] text-slate-500 font-black uppercase block mb-2">Queso Extra</span>
                          <span className="font-black text-orange-400 text-lg tracking-tighter">${item.price.toFixed(2)}</span>
                       </div>
                    </div>
                  ))}
               </div>

               <div className="py-10 border-t border-white/5 space-y-5">
                  <div className="flex justify-between items-center text-slate-400 font-black uppercase text-[10px] tracking-widest">
                    <span>Subtotal</span>
                    <span className="text-white text-sm font-black">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400 font-black uppercase text-[10px] tracking-widest">
                    <span>Envío</span>
                    <span className="text-emerald-400 text-sm font-black">${deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-end pt-6 border-t border-white/5">
                    <span className="text-lg font-black uppercase tracking-tight">Total</span>
                    <span className="text-5xl font-black text-orange-500 tracking-tighter leading-none">${total.toFixed(2)}</span>
                  </div>
               </div>

               <div className="mt-8 flex gap-3">
                  <input 
                    type="text" 
                    placeholder="CUPÓN" 
                    className="flex-1 bg-white/5 border-none rounded-2xl py-4 px-6 text-xs font-black text-white focus:ring-2 focus:ring-orange-500/50 uppercase tracking-widest outline-none transition-all placeholder:text-slate-600"
                  />
                  <button className="bg-[#5A9E1F] text-white font-black py-4 px-8 rounded-2xl text-[10px] uppercase tracking-widest hover:bg-[#4D881B] transition-all hover:scale-105 active:scale-95 shadow-lg shadow-green-900/20">Aplicar</button>
               </div>

               <div className="mt-12 flex items-center justify-center gap-4 py-5 px-6 bg-white/5 rounded-3xl border border-white/10 ring-1 ring-white/5">
                  <ShieldCheck size={20} className="text-emerald-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pagos Seguros Garantizados</span>
               </div>
            </div>
         </aside>

      </main>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
