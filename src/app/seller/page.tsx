'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, Clock, CheckCircle2, 
  ChefHat, Bike, TrendingUp, 
  MapPin, Zap, ChevronRight, Search, 
  Phone, User, Package, Filter, ClipboardList, Bell,
  Settings, Utensils, DollarSign, Tag, Star, Archive, Calendar, X, Download, BarChart3, PieChart, LineChart, Mail, Send
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import Link from 'next/link';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- TRADUCCIONES ---
const TRANSLATIONS: Record<string, any> = {
  Spanish: {
    reception: "RECEPCIÓN", kitchenView: "COCINA", injectOrder: "INYECTAR", dashboardTitle: "SELLER DASHBOARD", dashboardSubtitle: "GESTIONA TU NEGOCIO DELIVERY.EC", closeMenu: "CERRAR",
    tabs: { new: "NUEVOS", cooking: "COCINA", ready: "LISTOS", history: "HISTORIAL" },
    noOrders: "No hay pedidos", total: "TOTAL", sendToKitchen: "ENVIAR A COCINA", dispatch: "DESPACHAR", orderPos: "ORDEN POS",
    settings: { title: "AJUSTES DEL LOCAL", businessName: "NOMBRE COMERCIAL", phone: "TELÉFONO", address: "DIRECCIÓN", country: "PAÍS", city: "CIUDAD", language: "IDIOMA", save: "GUARDAR", saving: "GUARDANDO..." },
    reports: { title: "ANALÍTICA DE VENTAS", summary: "KPIs DE RENDIMIENTO", today: "Hoy", yesterday: "Ayer", month: "Mes", topItems: "PRODUCTOS TOP (RANKING 12)", sendEmail: "ENVIAR POR CORREO", close: "CERRAR", viewType: "VISTA", timeframe: "RANGO" },
    apps: { settings: "SETTINGS", reports: "REPORTES", stats: "STATS", inventory: "STOCK", menu: "MENÚ", pos: "POS", delivery: "DRIVERS", marketing: "PROMOS", reviews: "RESEÑAS", all_orders: "HISTORY", hours: "HOURS", help: "SOPORTE", config: "Configurar" }
  },
  English: {
    reception: "RECEPTION", kitchenView: "KITCHEN", injectOrder: "INJECT", dashboardTitle: "SELLER DASHBOARD", dashboardSubtitle: "MANAGE YOUR BUSINESS DELIVERY.EC", closeMenu: "CLOSE",
    tabs: { new: "NEW", cooking: "COOKING", ready: "READY", history: "HISTORY" },
    noOrders: "No orders", total: "TOTAL", sendToKitchen: "SEND TO KITCHEN", dispatch: "DISPATCH NOW", orderPos: "POS ORDER",
    settings: { title: "BUSINESS SETTINGS", businessName: "BUSINESS NAME", phone: "PHONE", address: "ADDRESS", country: "COUNTRY", city: "CITY", language: "LANGUAGE", save: "SAVE", saving: "SAVING..." },
    reports: { title: "SALES ANALYTICS", summary: "PERFORMANCE KPIs", today: "Today", yesterday: "Yesterday", month: "Month", topItems: "TOP SELLING (RANKING 12)", sendEmail: "SEND BY EMAIL", close: "CLOSE", viewType: "VIEW", timeframe: "TIMEFRAME" },
    apps: { settings: "SETTINGS", reports: "REPORTS", stats: "STATS", inventory: "STOCK", menu: "MENU", pos: "POS", delivery: "DRIVERS", marketing: "PROMOS", reviews: "RESEÑAS", all_orders: "HISTORY", hours: "HOURS", help: "SUPPORT", config: "Configure" }
  }
};

export default function OrderReceptionManager() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('new');
  const [orders, setOrders] = useState<any[]>([]);
  const [myBusiness, setMyBusiness] = useState<any>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [chartType, setChartType] = useState('bars');
  const [timeframe, setTimeframe] = useState('week');

  const t = TRANSLATIONS[myBusiness?.language || 'Spanish'];

  useEffect(() => {
    if (!user) return;
    const fetchBusiness = async () => {
      const q = query(collection(db, 'business_requests'), where('userId', '==', user.uid), where('status', '==', 'approved'));
      const snap = await getDocs(q);
      if (!snap.empty) setMyBusiness({ id: snap.docs[0].id, ...snap.docs[0].data() });
    };
    fetchBusiness();
    const qOrders = query(collection(db, 'orders'));
    const unsub = onSnapshot(qOrders, (snap) => setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    return () => unsub();
  }, [user]);

  const updateStatus = async (id: string, s: string) => {
    await updateDoc(doc(db, 'orders', id), { status: s });
  };

  const closeApp = () => {
    setSelectedApp(null);
    setShowMenu(true); // RE-OPEN MENU ON CLOSE
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (myBusiness?.id) {
        await updateDoc(doc(db, 'business_requests', myBusiness.id), { ...myBusiness });
        closeApp();
      }
    } catch (err) { console.error(err); }
    setIsSaving(false);
  };

  const salesStats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const stats = { today: 0, yesterday: 0, month: 0, topProducts: {} as Record<string, number>, history: [450, 680, 520, 890, 740, 1100, 950] };
    orders.forEach(o => {
      const created = (o.createdAt?.seconds || 0) * 1000;
      const total = Number(o.total) || 0;
      if (created >= today) stats.today += total;
      if (new Date(created).getMonth() === now.getMonth()) stats.month += total;
      o.items?.forEach((item: any) => { stats.topProducts[item.name] = (stats.topProducts[item.name] || 0) + item.quantity; });
    });
    const topItems = Object.entries(stats.topProducts).sort((a,b) => b[1] - a[1]).slice(0, 12);
    return { ...stats, topItems };
  }, [orders]);

  const sendReport = async () => {
    const doc = new jsPDF();
    const title = `REPORTE: ${myBusiness.businessName.toUpperCase()}`;
    doc.setFontSize(22); doc.text(title, 20, 20);
    doc.setFontSize(10); doc.text(`FECHA CIERRE: ${new Date().toLocaleString()}`, 20, 30);
    autoTable(doc, {
      startY: 40, head: [['CATEGORIA', 'VALOR USD']],
      body: [[t.reports.today, salesStats.today.toFixed(2)], [t.reports.yesterday, salesStats.yesterday.toFixed(2)], [t.reports.month, salesStats.month.toFixed(2)]],
      theme: 'grid', headStyles: { fillColor: [59, 130, 246] }
    });
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['RANK', 'PRODUCTO ⭐', 'TOTAL UNIDADES']],
      body: salesStats.topItems.map(([name, qty], i) => [i+1, name, qty as any]),
      theme: 'striped', headStyles: { fillColor: [17, 17, 17] }
    });
    const pdfBlob = doc.output('blob');
    const pdfFile = new File([pdfBlob], `REPORTE_VENTAS.pdf`, { type: 'application/pdf' });
    if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        try { await navigator.share({ files: [pdfFile], title: `Reporte ${myBusiness.businessName}`, text: 'Check the delivery report.' }); } catch (err) { doc.save(`REPORTE_VENTAS.pdf`); }
    } else { doc.save(`REPORTE_VENTAS.pdf`); }
  };

  const injectTestOrder = async () => {
    try {
      await addDoc(collection(db, 'orders'), {
        userId: user?.uid, customerName: "Test Order Client",
        items: [{ name: 'Paradise Burger XXL', quantity: 1, price: 15.50 }, { name: 'Super Wings 12pcs', quantity: 1, price: 12.00 }],
        total: 27.50, status: 'paid', createdAt: serverTimestamp()
      });
    } catch (err) { console.error(err); }
  };

  if (!myBusiness) return <div style={{ background: '#F8F9FA', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChefHat className="animate-spin" color="#FF5722" /></div>;

  const filteredOrders = orders.filter(o => activeTab === 'new' ? (!o.status || o.status === 'paid') : (o.status === activeTab || (activeTab === 'history' && o.status === 'dispatched')));
  const tabCount = (s: string) => orders.filter(o => s === 'new' ? (!o.status || o.status === 'paid') : (s === 'history' ? o.status === 'dispatched' : o.status === s)).length;

  const SELLER_APPS = [
    { id: 'settings', label: t.apps.settings, icon: <Settings />, color: '#71717A' },
    { id: 'reports',  label: t.apps.reports, icon: <ClipboardList />, color: '#3B82F6' },
    { id: 'stats',    label: t.apps.stats, icon: <TrendingUp />, color: '#22C55E' },
    { id: 'inventory',label: t.apps.inventory, icon: <Package />, color: '#FF5722' },
    { id: 'menu',     label: t.apps.menu, icon: <Utensils />, color: '#EF4444' },
    { id: 'pos',      label: t.apps.pos, icon: <DollarSign />, color: '#06B6D4' },
    { id: 'delivery', label: t.apps.delivery, icon: <Bike />, color: '#A855F7' },
    { id: 'marketing',label: t.apps.marketing, icon: <Tag />, color: '#E91E63' },
    { id: 'reviews',  label: t.apps.reviews, icon: <Star />, color: '#FFB300' },
    { id: 'all_orders', label: t.apps.all_orders, icon: <Archive />, color: '#795548' },
    { id: 'hours',    label: t.apps.hours, icon: <Calendar />, color: '#00BCD4' },
    { id: 'help',     label: t.apps.help, icon: <Phone />, color: '#F1C40F' },
  ];

  return (
    <div style={{ height: '100vh', width: '100vw', background: '#F4F7FE', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* ── TOPBAR ── */}
      <nav style={{ height: '70px', background: 'white', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E9EDF7', zIndex: 100, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: '#FF5722', fontWeight: 900, color: 'white', padding: '6px 10px', borderRadius: '10px' }}>D</div>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>{t.reception}: {myBusiness.businessName.toUpperCase()}</h1>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setShowMenu(true)} style={{ padding: '8px 16px', background: '#F4F7FE', borderRadius: '12px', border: '1px solid #E9EDF7', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}>MENU</button>
            <button onClick={injectTestOrder} style={{ padding: '8px 16px', background: '#F4F7FE', color: '#3B82F6', borderRadius: '12px', border: '1px solid #E9EDF7', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}>TEST ORDER</button>
            <Link href="/kitchen" style={{ padding: '10px 18px', background: '#111', color: 'white', borderRadius: '12px', fontSize: '12px', fontWeight: 800, textDecoration: 'none' }}>{t.kitchenView} 👩‍🍳</Link>
        </div>
      </nav>

      <AnimatePresence>
        {showMenu && (
          <motion.div key="launcher-menu-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(30px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowMenu(false)}>
             <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} style={{ width: '100%', maxWidth: '1400px', padding: '40px' }} onClick={e => e.stopPropagation()}>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                   <h2 style={{ fontSize: '42px', fontWeight: 900 }}>SELLER <span style={{ color: '#FF5722' }}>DASHBOARD</span></h2>
                   <p style={{ color: '#666', fontWeight: 800, fontSize: '16px' }}>{t.dashboardSubtitle}</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', maxWidth: '1300px', margin: '0 auto' }}>
                   {SELLER_APPS.map((app) => (
                      <motion.button key={`app-${app.id}`} onClick={() => { setSelectedApp(app.id); setShowMenu(false); }} whileHover={{ scale: 1.04, y: -5, boxShadow: `0 30px 60px ${app.color}50` }} style={{ padding: '24px 32px', background: app.color, borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '24px', color: 'white', minHeight: '110px', border: 'none', cursor: 'pointer' }}>
                         <div style={{ padding: '12px', background: 'rgba(255,255,255,0.25)', borderRadius: '18px', display: 'flex' }}>{React.cloneElement(app.icon as any, { size: 32 })}</div>
                         <div style={{ textAlign: 'left' }}><span style={{ fontSize: '18px', fontWeight: 900, display: 'block' }}>{app.label}</span><span style={{ fontSize: '10px', fontWeight: 700, opacity: 0.8 }}>{t.apps.config}</span></div>
                         <ChevronRight size={28} style={{ marginLeft: 'auto', opacity: 0.3 }} />
                      </motion.button>
                   ))}
                </div>
                <button onClick={() => setShowMenu(false)} style={{ display: 'block', margin: '32px auto 0', padding: '16px 32px', borderRadius: '16px', background: '#111', color: 'white', border: 'none', fontWeight: 900, cursor: 'pointer' }}>{t.closeMenu}</button>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedApp === 'settings' && (
          <motion.div key="settings-modal-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(15px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={closeApp}>
             <motion.div initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} style={{ background: 'white', width: '100%', maxWidth: '750px', borderRadius: '32px', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
                <div style={{ padding: '32px', background: '#71717A', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 900 }}>{t.settings.title}</h2>
                   <button onClick={closeApp} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', width: '40px', height: '40px', borderRadius: '50%', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} /></button>
                </div>
                <form onSubmit={saveSettings} style={{ padding: '32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                   <input type="text" value={myBusiness.businessName} placeholder={t.settings.businessName} onChange={e => setMyBusiness({...myBusiness, businessName: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #E9EDF7', fontWeight: 700 }} />
                   <input type="text" value={myBusiness.phone || ''} placeholder={t.settings.phone} onChange={e => setMyBusiness({...myBusiness, phone: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #E9EDF7', fontWeight: 700 }} />
                   <input type="text" value={myBusiness.address || ''} placeholder={t.settings.address} style={{ gridColumn: 'span 2', padding: '14px', borderRadius: '12px', border: '1px solid #E9EDF7', fontWeight: 700 }} onChange={e => setMyBusiness({...myBusiness, address: e.target.value})} />
                   <select value={myBusiness.language || 'Spanish'} style={{ gridColumn: 'span 2', padding: '14px', borderRadius: '12px', border: '1px solid #E9EDF7', fontWeight: 700 }} onChange={e => setMyBusiness({...myBusiness, language: e.target.value})}>
                      <option value="Spanish">Español</option><option value="English">English</option>
                   </select>
                   <button type="submit" style={{ gridColumn: 'span 2', padding: '20px', background: '#111', color: 'white', borderRadius: '20px', fontWeight: 900, cursor: 'pointer' }}>{isSaving ? t.settings.saving : t.settings.save}</button>
                </form>
             </motion.div>
          </motion.div>
        )}

        {selectedApp === 'reports' && (
          <motion.div key="reports-modal-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={closeApp}>
             <motion.div initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} style={{ background: '#F4F7FE', width: '100%', maxWidth: '1200px', height: '95vh', borderRadius: '48px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
                <div style={{ padding: '24px 40px', background: '#111', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                   <div><h2 style={{ margin: 0, fontSize: '24px', fontWeight: 900 }}>{t.reports.title}</h2><p style={{ margin: 0, opacity: 0.7, fontWeight: 700, fontSize: '13px' }}>{t.reports.summary} 📊</p></div>
                   <div style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ background: 'rgba(255,255,255,0.1)', padding: '6px', borderRadius: '14px', display: 'flex', gap: '4px' }}>
                         <button onClick={() => setChartType('bars')} style={{ background: chartType === 'bars' ? '#3B82F6' : 'transparent', border: 'none', padding: '8px', borderRadius: '10px', color: 'white', cursor: 'pointer' }}><BarChart3 size={18}/></button>
                         <button onClick={() => setChartType('line')} style={{ background: chartType === 'line' ? '#3B82F6' : 'transparent', border: 'none', padding: '8px', borderRadius: '10px', color: 'white', cursor: 'pointer' }}><LineChart size={18}/></button>
                         <button onClick={() => setChartType('pie')} style={{ background: chartType === 'pie' ? '#3B82F6' : 'transparent', border: 'none', padding: '8px', borderRadius: '10px', color: 'white', cursor: 'pointer' }}><PieChart size={18}/></button>
                      </div>
                      <button onClick={sendReport} style={{ background: '#22C55E', border: 'none', padding: '0 20px', borderRadius: '12px', color: 'white', fontWeight: 900, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                         <Send size={16} /> {t.reports.sendEmail}
                      </button>
                      <button onClick={closeApp} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', width: '40px', height: '40px', borderRadius: '10px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} /></button>
                   </div>
                </div>
                
                <div style={{ flex: 1, padding: '24px 40px', overflowY: 'auto' }}>
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                      {[{ label: t.reports.today, val: salesStats.today, col: '#3B82F6' }, { label: t.reports.yesterday, val: salesStats.yesterday, col: '#111' }, { label: t.reports.month, val: salesStats.month, col: '#22C55E' }].map((k, i) => (
                         <div key={`stat-${i}`} style={{ background: 'white', padding: '16px', borderRadius: '20px', boxShadow: '0 10px 20px rgba(0,0,0,0.02)' }}>
                            <p style={{ margin: 0, fontSize: '11px', fontWeight: 800, color: '#A3AED0' }}>{k.label}</p>
                            <h4 style={{ margin: '4px 0 0', fontSize: '24px', fontWeight: 900, color: k.col }}>${k.val.toFixed(2)}</h4>
                         </div>
                      ))}
                   </div>

                   <div style={{ background: 'white', padding: '24px', borderRadius: '28px', boxShadow: '0 20px 40px rgba(0,0,0,0.03)', marginBottom: '24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                         <h3 style={{ margin: 0, fontWeight: 900, fontSize: '16px' }}>PERFORMANCE ANALYTICS</h3>
                         <div style={{ display: 'flex', gap: '6px', background: '#F4F7FE', padding: '4px', borderRadius: '10px' }}>
                            {['day','week','month'].map(tf => (
                               <button key={`tf-${tf}`} onClick={() => setTimeframe(tf)} style={{ background: timeframe === tf ? 'white' : 'transparent', border: 'none', padding: '4px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: 800, color: timeframe === tf ? '#111' : '#A3AED0', cursor: 'pointer' }}>{tf.toUpperCase()}</button>
                            ))}
                         </div>
                      </div>
                      <div style={{ height: '160px', width: '100%', display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
                         {chartType === 'bars' && salesStats.history.map((val, i) => (
                            <div key={`bar-${i}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                               <motion.div initial={{ height: 0 }} animate={{ height: `${(val/1200)*100}%` }} style={{ width: '100%', background: '#3B82F6', borderRadius: '8px 8px 3px 3px' }} />
                               <span style={{ fontSize: '9px', fontWeight: 800, color: '#A3AED0' }}>{i+1}</span>
                            </div>
                         ))}
                         {chartType === 'line' && (
                            <svg width="100%" height="100%" viewBox="0 0 1000 160" preserveAspectRatio="none">
                               <motion.path initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} d={`M 0 ${160 - (salesStats.history[0]/1200)*160} ${salesStats.history.map((v, i) => `L ${(i*166)} ${160 - (v/1200)*160}`).join(' ')}`} fill="none" stroke="#3B82F6" strokeWidth="5" strokeLinecap="round" />
                            </svg>
                         )}
                         {chartType === 'pie' && (
                            <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                               <div style={{ width: '150px', height: '150px', borderRadius: '50%', background: `conic-gradient(#3B82F6 0% 45%, #FF5722 45% 75%, #22C55E 75% 100%)` }} />
                            </div>
                         )}
                      </div>
                   </div>

                   <div style={{ background: 'white', padding: '24px', borderRadius: '28px', boxShadow: '0 15px 30px rgba(0,0,0,0.03)' }}>
                      <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 900 }}>{t.reports.topItems} ⭐</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                         {salesStats.topItems.map(([name, qty], idx) => (
                            <div key={`item-${idx}`} style={{ padding: '12px 16px', background: '#F4F7FE', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #E9EDF7' }}>
                               <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                                  <div style={{ flexShrink: 0, width: '26px', height: '26px', background: '#3B82F6', borderRadius: '7px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '11px' }}>{idx+1}</div>
                                  <span style={{ fontWeight: 800, fontSize: '12.5px', color: '#1B2559', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
                               </div>
                               <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                  <span style={{ fontWeight: 900, color: '#3B82F6', fontSize: '14px' }}>{qty as any}</span>
                                  <span style={{ fontSize: '9px', fontWeight: 800, color: '#A3AED0', display: 'block' }}>UNS</span>
                               </div>
                            </div>
                         ))}
                      </div>
                   </div>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main style={{ flex: 1, padding: '20px 32px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', padding: '8px', marginBottom: '16px', flexShrink: 0, justifyContent: 'center', scrollbarWidth: 'none' }}>
           {[ { id: 'new', label: t.tabs.new, color: '#3B82F6', icon: <Bell size={18} /> }, { id: 'cooking', label: t.tabs.cooking, color: '#FF5722', icon: <ChefHat size={18} /> }, { id: 'ready', label: t.tabs.ready, color: '#22C55E', icon: <CheckCircle2 size={18} /> }, { id: 'history', label: t.tabs.history, color: '#71717A', icon: <Archive size={18} /> } ].map(tab => (
             <motion.button key={`tab-${tab.id}`} onClick={() => setActiveTab(tab.id)} whileHover={{ y: -4, scale: 1.02 }} style={{ flexShrink: 0, minWidth: '200px', padding: '16px 24px', background: tab.color, color: 'white', border: 'none', borderRadius: '22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', boxShadow: activeTab === tab.id ? `0 15px 30px ${tab.color}50` : '0 4px 12px rgba(0,0,0,0.1)', position: 'relative', overflow: 'hidden', transform: activeTab === tab.id ? 'translateY(-4px)' : 'none', transition: 'all 0.3s' }}>
                {activeTab === tab.id && ( <motion.div layoutId="tab-glow-effect" style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }} /> )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative', zIndex: 1 }}>{tab.icon}<span style={{ fontWeight: 900, fontSize: '15px' }}>{tab.label}</span></div>
                <span style={{ background: 'rgba(0,0,0,0.2)', padding: '4px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: 900 }}>{tabCount(tab.id)}</span>
             </motion.button>
           ))}
        </div>

        <div style={{ flex: 1, display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '16px', scrollbarWidth: 'thin' }}>
           {filteredOrders.length === 0 ? (
             <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#A3AED0' }}><ShoppingBag size={48} style={{ opacity: 0.2, marginBottom: '12px' }} /><p style={{ fontWeight: 800, fontSize: '14px' }}>{t.noOrders}</p></div>
           ) : (
             filteredOrders.map((order, idx) => (
               <motion.div key={`order-${order.id || idx}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ minWidth: '310px', maxWidth: '310px', background: 'white', borderRadius: '28px', border: '1px solid #E9EDF7', display: 'flex', flexDirection: 'column', boxShadow: '0 15px 30px rgba(0,0,0,0.02)', height: '100%', overflow: 'hidden' }}>
                  <div style={{ padding: '18px', borderBottom: '1px dashed #E9EDF7' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{ fontSize: '18px', fontWeight: 900 }}>#{idx+1}</span>
                        <div style={{ background: '#F4F7FE', padding: '5px 10px', borderRadius: '8px', fontSize: '9px', fontWeight: 900, color: '#3B82F6' }}>{t.orderPos}</div>
                     </div>
                     <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 900 }}>{order.customerName || 'Client'}</h3>
                  </div>
                  <div style={{ flex: 1, padding: '18px', overflowY: 'auto', scrollbarWidth: 'none' }}>{order.items?.map((item: any, i: number) => ( <div key={`item-${order.id}-${i}`} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><div style={{ display: 'flex', gap: '10px' }}><span style={{ fontWeight: 900, color: '#FF5722', fontSize: '13px' }}>{item.quantity}x</span><span style={{ fontWeight: 700, fontSize: '13px' }}>{item.name}</span></div><span style={{ fontWeight: 700, color: '#A3AED0', fontSize: '13px' }}>${item.price}</span></div> ))}</div>
                  <div style={{ padding: '18px', background: '#F4F7FE' }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}><span style={{ fontWeight: 800, color: '#A3AED0', fontSize: '13px' }}>{t.total}</span><span style={{ fontWeight: 900, fontSize: '17px' }}>${order.total}</span></div>
                     {activeTab === 'new' && ( <button onClick={() => updateStatus(order.id, 'cooking')} style={{ width: '100%', padding: '12px', background: '#FF5722', color: 'white', border: 'none', borderRadius: '14px', fontWeight: 900, fontSize: '14px', cursor: 'pointer' }}>{t.sendToKitchen}</button> )}
                     {activeTab === 'ready' && ( <button onClick={() => updateStatus(order.id, 'dispatched')} style={{ width: '100%', padding: '12px', background: '#22C55E', color: 'white', border: 'none', borderRadius: '14px', fontWeight: 900, fontSize: '14px', cursor: 'pointer' }}>{t.dispatch}</button> )}
                  </div>
               </motion.div>
             ))
           )}
        </div>
      </main>
    </div>
  );
}
