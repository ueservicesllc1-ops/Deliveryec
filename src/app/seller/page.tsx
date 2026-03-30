'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, CheckCircle2, ShoppingCart,
  ChefHat, Bike, TrendingUp, 
  ChevronRight,
  Phone, Package, ClipboardList, Bell,
  Settings, Utensils, DollarSign, Tag, Star, Archive, Calendar, X, Send,
  BarChart3, PieChart, LineChart,
  Image as ImageIcon, Upload as UploadIcon, Loader2, MoreVertical, Plus, Monitor,
  Search, CreditCard, Smartphone, Check, MoreHorizontal, AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, onSnapshot, doc, updateDoc, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import {
  STATUS_LABELS, STATUS_COLORS, SELLER_TRANSITIONS, TIMESTAMP_FIELDS,
  SELLER_ACTIVE_STATUSES, filterBySellerTab, getSellerTab,
  type OrderStatus, type SellerTab,
} from '@/lib/orderStateMachine';

const TRANSLATIONS: Record<string, any> = {
  Spanish: {
    reception: "RECEPCIÓN", kitchenView: "COCINA", dashboardSubtitle: "GESTIONA TU NEGOCIO DELIVERY.EC", closeMenu: "CERRAR",
    tabs: { new: "NUEVOS", cooking: "COCINA", ready: "LISTOS", history: "HISTORIAL" },
    noOrders: "No hay pedidos", total: "TOTAL", sendToKitchen: "ENVIAR A COCINA", dispatch: "DESPACHAR", orderPos: "ORDEN POS",
    settings: { title: "AJUSTES DEL LOCAL", businessName: "NOMBRE COMERCIAL", phone: "TELÉFONO", address: "DIRECCIÓN", country: "PAÍS", city: "CIUDAD", language: "IDIOMA", save: "GUARDAR", saving: "GUARDANDO..." },
    reports: { title: "ANALÍTICA DE VENTAS", summary: "KPIs DE RENDIMIENTO", today: "Hoy", yesterday: "Ayer", month: "Mes", topItems: "PRODUCTOS TOP (RANKING 12)", sendEmail: "ENVIAR POR CORREO", close: "CERRAR" },
    menu: { title: "GESTIÓN DE CARTA", addDish: "NUEVO PLATO", editDish: "EDITAR PLATO", dishName: "Nombre del Plato", price: "Precio ($)", category: "Categoría", photo: "Cargar Foto", save: "Guardar", uploadInfo: "Subiendo imagen...", actionEdit: "Editar", actionDelete: "Borrar", cancel: "Cancelar", menuMgr: "MENU MGR" },
    apps: { settings: "SETTINGS", reports: "REPORTES", stats: "STATS", inventory: "STOCK", menu: "MENÚ", pos: "POS", delivery: "DRIVERS", marketing: "PROMOS", reviews: "RESEÑAS", all_orders: "HISTORY", hours: "HOURS", help: "SOPORTE", config: "Configurar" }
  },
  English: {
    reception: "RECEPTION", kitchenView: "KITCHEN", dashboardSubtitle: "MANAGE YOUR BUSINESS DELIVERY.EC", closeMenu: "CLOSE",
    tabs: { new: "NEW", cooking: "COOKING", ready: "READY", history: "HISTORY" },
    noOrders: "No orders", total: "TOTAL", sendToKitchen: "SEND TO KITCHEN", dispatch: "DISPATCH NOW", orderPos: "POS ORDER",
    settings: { title: "BUSINESS SETTINGS", businessName: "BUSINESS NAME", phone: "PHONE", address: "ADDRESS", country: "COUNTRY", city: "CITY", language: "LANGUAGE", save: "SAVE", saving: "SAVING..." },
    reports: { title: "SALES ANALYTICS", summary: "PERFORMANCE KPIs", today: "Today", yesterday: "Yesterday", month: "Month", topItems: "TOP SELLING (RANKING 12)", sendEmail: "SEND BY EMAIL", close: "CLOSE" },
    menu: { title: "MENU MANAGEMENT", addDish: "NEW DISH", editDish: "EDIT DISH", dishName: "Dish Name", price: "Price ($)", category: "Category", photo: "Upload Photo", save: "Save", uploadInfo: "Uploading...", actionEdit: "Edit", actionDelete: "Delete", cancel: "Cancel", menuMgr: "MENU MGR" },
    apps: { settings: "SETTINGS", reports: "REPORTS", stats: "STATS", inventory: "STOCK", menu: "MENU", pos: "POS", delivery: "DRIVERS", marketing: "PROMOS", reviews: "REVIEWS", all_orders: "HISTORY", hours: "HOURS", help: "SUPPORT", config: "Configure" }
  }
};

export default function OrderReceptionManager() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SellerTab>('new');
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [myBusiness, setMyBusiness] = useState<any>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showAddDish, setShowAddDish] = useState(false);
  const [editingDishId, setEditingDishId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [dishToDelete, setDishToDelete] = useState<any>(null);
  const [newDish, setNewDish] = useState({ name: '', price: '', category: 'Main', image: '' });
  const [cancelReqOrder, setCancelReqOrder] = useState<any>(null); // modal de solicitud
  const [cancelReason, setCancelReason] = useState('Producto agotado');
  const [cancelOtherText, setCancelOtherText] = useState('');
  const [sendingCancelReq, setSendingCancelReq] = useState(false);
  const [chartType, setChartType] = useState('bars');
  const [timeframe, setTimeframe] = useState('week');
  const [posCart, setPosCart] = useState<any[]>([]);
  const [posCategory, setPosCategory] = useState<string>('All');
  const [posCustomer, setPosCustomer] = useState<string>('');

  const t = TRANSLATIONS[myBusiness?.language || 'Spanish'];

  // ── 1. Load business & redirect if not found ──
  useEffect(() => {
    if (!user) {
      const timeout = setTimeout(() => { if (!user) router.push('/login'); }, 2000);
      return () => clearTimeout(timeout);
    }
    const q = query(collection(db, 'business_requests'), where('userId', '==', user.uid));
    getDocs(q).then(snap => {
      if (!snap.empty) {
        setMyBusiness({ id: snap.docs[0].id, ...snap.docs[0].data() });
      } else {
        router.push('/order/register-business');
      }
    });
  }, [user]);

  // ── 2. Subscribe to orders & products once both uid and businessId are known ──
  // Stable single-key dependency avoids React's "array size changed" HMR error
  const subKey = user?.uid && myBusiness?.id ? `${user.uid}_${myBusiness.id}` : null;

  useEffect(() => {
    if (!subKey || !user?.uid || !myBusiness?.id) return;

    // Primary: filter by restaurantOwnerId (seller's Firebase UID) — most reliable
    const q1 = query(collection(db, 'orders'), where('restaurantOwnerId', '==', user.uid));
    // Fallback: filter by restaurantId (document ID) — covers legacy orders
    const q2 = query(collection(db, 'orders'), where('restaurantId', '==', myBusiness.id));

    const allOrders = new Map<string, any>();
    const flush = () => setOrders(Array.from(allOrders.values()));

    const unsub1 = onSnapshot(q1, (snap) => {
      snap.docs.forEach(d => allOrders.set(d.id, { id: d.id, ...d.data() }));
      flush();
    });
    const unsub2 = onSnapshot(q2, (snap) => {
      snap.docs.forEach(d => allOrders.set(d.id, { id: d.id, ...d.data() }));
      flush();
    });

    const productsQuery = query(collection(db, 'products'), where('businessId', '==', myBusiness.id));
    const unsub3 = onSnapshot(productsQuery, (snap) =>
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    return () => { unsub1(); unsub2(); unsub3(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subKey]);


  // ── Advance order to the next seller-side state ──
  const updateStatus = async (id: string, nextStatus: OrderStatus) => {
    const tsField = TIMESTAMP_FIELDS[nextStatus];
    await updateDoc(doc(db, 'orders', id), {
      status: nextStatus,
      ...(tsField ? { [tsField]: serverTimestamp() } : {}),
    });
    const order = orders.find(o => o.id === id);
    if (order && order.userId) {
      const pushMap: Partial<Record<OrderStatus, { title: string; body: string }>> = {
        accepted:         { title: '¡Pedido Aceptado!',       body: 'Tu pedido fue aceptado por el restaurante.' },
        preparing:        { title: '¡En Cocina!',             body: 'Tu pedido está siendo preparado.' },
        ready_for_pickup: { title: '¡Pedido Listo!',          body: 'Tu pedido está listo y esperando al repartidor.' },
        picked_up:        { title: '¡Pedido Recogido!',       body: 'El repartidor recogió tu pedido.' },
        on_the_way:       { title: '¡En Camino!',             body: 'Tu pedido ya va en camino.' },
      };
      const push = pushMap[nextStatus];
      if (push) {
        try {
          await fetch('/api/push', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: order.userId, ...push, url: '/user/orders' }),
          });
        } catch (err) { console.warn('Push error:', err); }
      }
    }
  };


  const closeApp = () => { setSelectedApp(null); setShowMenu(true); setShowAddDish(false); setEditingDishId(null); setActiveMenuId(null); setDishToDelete(null); };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSaving(true);
    try { if (myBusiness?.id) { await updateDoc(doc(db, 'business_requests', myBusiness.id), { ...myBusiness }); closeApp(); } }
    catch (err) { console.error(err); }
    setIsSaving(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setIsUploading(true);
    const formData = new FormData(); formData.append('file', file); formData.append('folder', 'products');
    try { const res = await fetch('/api/upload', { method: 'POST', body: formData }); const data = await res.json(); if (data.url) setNewDish(prev => ({ ...prev, image: data.url })); }
    catch (err) { console.error(err); }
    setIsUploading(false);
  };

  const addDishToMenu = async (e: React.FormEvent) => {
    e.preventDefault(); if (!newDish.name || !newDish.price) return; setIsSaving(true);
    try {
      if (editingDishId) { await updateDoc(doc(db, 'products', editingDishId), { ...newDish, price: Number(newDish.price), updatedAt: serverTimestamp() }); }
      else { await addDoc(collection(db, 'products'), { ...newDish, price: Number(newDish.price), businessId: myBusiness.id, createdAt: serverTimestamp() }); }
      setNewDish({ name: '', price: '', category: 'Main', image: '' }); setShowAddDish(false); setEditingDishId(null);
    } catch (err) { console.error(err); }
    setIsSaving(false);
  };

  const startEdit = (p: any) => { setNewDish({ name: p.name, price: p.price.toString(), category: p.category, image: p.image || '' }); setEditingDishId(p.id); setShowAddDish(true); setActiveMenuId(null); };
  const executeDelete = async () => { if (dishToDelete) { await deleteDoc(doc(db, 'products', dishToDelete.id)); setDishToDelete(null); setActiveMenuId(null); } };

  const injectTestOrder = async () => {
    try { await addDoc(collection(db, 'orders'), { userId: user?.uid, customerName: "Test Order Client", items: [{ name: 'Paradise Burger XXL', quantity: 1, price: 15.50 }, { name: 'Super Wings 12pcs', quantity: 1, price: 12.00 }], total: 27.50, status: 'created', createdAt: serverTimestamp() }); }
    catch (err) { console.error(err); }
  };

  const addToCart = (product: any) => {
    const existing = posCart.find(item => item.id === product.id);
    if (existing) {
      setPosCart(posCart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setPosCart([...posCart, { ...product, quantity: 1 }]);
    }
  };

  const updateCartQty = (id: string, delta: number) => {
    setPosCart(posCart.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }).filter(item => item.id !== id || item.quantity + delta > 0)); // Actually filter handles removal if <=0
  };

  const removeFromCart = (id: string) => setPosCart(posCart.filter(item => item.id !== id));
  
  const posTotal = posCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const chargePosOrder = async () => {
    if (posCart.length === 0) return;
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'orders'), {
        userId: user?.uid,
        customerName: posCustomer || "POS Client",
        items: posCart.map(i => ({ name: i.name, quantity: i.quantity, price: i.price, category: i.category })),
        total: posTotal.toFixed(2),
        status: 'paid',
        createdAt: serverTimestamp(),
        source: 'pos'
      });
      setPosCart([]);
      setPosCustomer('');
      closeApp();
    } catch (err) { console.error(err); }
    setIsSaving(false);
  };


  const sendCancelRequest = async () => {
    if (!cancelReqOrder) return;
    const reason = cancelReason === 'Otro' ? (cancelOtherText.trim() || 'Otro') : cancelReason;
    setSendingCancelReq(true);
    try {
      await updateDoc(doc(db, 'orders', cancelReqOrder.id), {
        cancelRequest: {
          reason,
          requestedAt: serverTimestamp(),
          status: 'pending',
          restaurantName: myBusiness?.businessName || '',
        },
      });
      setCancelReqOrder(null);
      setCancelReason('Producto agotado');
      setCancelOtherText('');
    } catch (e) { console.error(e); }
    setSendingCancelReq(false);
  };

  const salesStats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const stats = { today: 0, yesterday: 0, month: 0, topProducts: {} as Record<string, number>, history: [450, 680, 520, 890, 740, 1100, 950] };
    orders.forEach(o => {
      const created = (o.createdAt?.seconds || 0) * 1000; const total = Number(o.total) || 0;
      if (created >= today) stats.today += total;
      if (new Date(created).getMonth() === now.getMonth()) stats.month += total;
      o.items?.forEach((item: any) => { stats.topProducts[item.name] = (stats.topProducts[item.name] || 0) + item.quantity; });
    });
    const topItems = Object.entries(stats.topProducts).sort((a, b) => b[1] - a[1]).slice(0, 12);
    return { ...stats, topItems };
  }, [orders]);

  const sendReport = async () => {
    const pdfdoc = new jsPDF(); pdfdoc.setFontSize(22); pdfdoc.text(`REPORTE: ${myBusiness.businessName.toUpperCase()}`, 20, 20);
    pdfdoc.setFontSize(10); pdfdoc.text(`FECHA: ${new Date().toLocaleString()}`, 20, 30);
    autoTable(pdfdoc, { startY: 40, head: [['CATEGORIA', 'VALOR USD']], body: [[t.reports.today, salesStats.today.toFixed(2)], [t.reports.month, salesStats.month.toFixed(2)]], theme: 'grid', headStyles: { fillColor: [59, 130, 246] } });
    autoTable(pdfdoc, { startY: (pdfdoc as any).lastAutoTable.finalY + 10, head: [['RANK', 'PRODUCTO', 'UNIDADES']], body: salesStats.topItems.map(([name, qty], i) => [i + 1, name, qty as any]), theme: 'striped', headStyles: { fillColor: [17, 17, 17] } });
    const pdfFile = new File([pdfdoc.output('blob')], 'REPORTE_VENTAS.pdf', { type: 'application/pdf' });
    if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) { try { await navigator.share({ files: [pdfFile], title: `Reporte ${myBusiness.businessName}` }); } catch { pdfdoc.save('REPORTE_VENTAS.pdf'); } }
    else { pdfdoc.save('REPORTE_VENTAS.pdf'); }
  };

  if (!myBusiness) return <div style={{ background: '#F8F9FA', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChefHat className="animate-spin" color="#FF5722" /></div>;

  const sendTestOrder = async () => {
    const testItems = [
      { name: 'Churrasco Completo', price: 8.50, quantity: 1, category: 'Main' },
      { name: 'Jugo Natural Grande', price: 2.00, quantity: 2, category: 'Drinks' },
    ];
    const subtotal = testItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const deliveryFee = 1.81;
    try {
      await addDoc(collection(db, 'orders'), {
        userId: 'test-user-001',
        customerName: 'Cliente Test 🧪',
        phone: '0991234567',
        address: myBusiness.address || 'Av. de las Américas, Guayaquil',
        location: { lat: -2.1894, lng: -79.8891 }, // Restaurant location
        customerLocation: { lat: -2.1700, lng: -79.9220 }, // Sample Destination
        restaurantId: myBusiness.userId || user?.uid,
        restaurantName: myBusiness.businessName,
        items: testItems,
        subtotal: subtotal.toFixed(2),
        deliveryFee: deliveryFee.toFixed(2),
        total: (subtotal + deliveryFee).toFixed(2),
        status: 'created',
        paymentMethod: 'card',
        createdAt: serverTimestamp(),
        source: 'test',
      });
      alert('✅ Pedido test enviado a Firestore — revisa /live');
    } catch (err) {
      console.error(err);
      alert('❌ Error al enviar pedido test');
    }
  };

  // ── Use state machine for filtering — orders NEVER disappear when driver accepts ──
  const filteredOrders = filterBySellerTab(orders, activeTab);
  const tabCount = (tab: SellerTab) => filterBySellerTab(orders, tab).length;

  const SELLER_APPS = [
    { id: 'settings',  label: t.apps.settings,   icon: <Settings />,     color: '#71717A' },
    { id: 'reports',   label: t.apps.reports,    icon: <ClipboardList />, color: '#3B82F6' },
    { id: 'stats',     label: t.apps.stats,      icon: <TrendingUp />,   color: '#22C55E' },
    { id: 'inventory', label: t.apps.inventory,  icon: <Package />,      color: '#FF5722' },
    { id: 'menu',      label: t.apps.menu,       icon: <Utensils />,     color: '#EF4444' },
    { id: 'pos',       label: t.apps.pos,        icon: <DollarSign />,   color: '#06B6D4' },
    { id: 'delivery',  label: t.apps.delivery,   icon: <Bike />,         color: '#A855F7' },
    { id: 'marketing', label: t.apps.marketing,  icon: <Tag />,          color: '#E91E63' },
    { id: 'reviews',   label: t.apps.reviews,    icon: <Star />,         color: '#FFB300' },
    { id: 'all_orders',label: t.apps.all_orders, icon: <Archive />,      color: '#795548' },
    { id: 'hours',     label: t.apps.hours,      icon: <Calendar />,     color: '#00BCD4' },
    { id: 'help',      label: t.apps.help,       icon: <Phone />,        color: '#F1C40F' },
  ];

  return (
    <div style={{ height: '100vh', width: '100vw', background: '#F4F5F7', display: 'flex', fontFamily: '"Inter", sans-serif', overflow: 'hidden' }}>
      {/* SIDEBAR */}
      <aside style={{ width: '260px', background: '#121317', color: 'white', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '32px 24px', display: 'flex', alignItems: 'center' }}>
          <img src="/logo.png" style={{ height: '32px', objectFit: 'contain' }} alt="Deliveryy Logo" />
        </div>
        
        <div style={{ padding: '0 20px 24px' }}>
          <div style={{ background: '#1A1C21', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#F7F7F8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChefHat size={24} color="#111827" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800 }}>{myBusiness.businessName}</h3>
              <span style={{ fontSize: '12px', color: '#A7ADB7' }}>Administrador</span>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '0 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {[
            { id: 'dashboard', label: 'Escritorio', icon: <Monitor size={20} /> },
            { id: 'orders', label: 'Pedidos', icon: <ShoppingBag size={20} /> },
            { id: 'menu', label: 'Menú', icon: <Utensils size={20} /> },
            { id: 'reports', label: 'Finanzas', icon: <ClipboardList size={20} /> },
            { id: 'stats', label: 'Estadísticas', icon: <BarChart3 size={20} /> },
            { id: 'settings', label: 'Configuración', icon: <Settings size={20} /> }
          ].map(item => {
            const isActive = selectedApp === item.id || (!selectedApp && item.id === 'dashboard');
            return (
              <button key={item.id} onClick={() => { if(item.id==='dashboard'||item.id==='orders') setSelectedApp(null); else setSelectedApp(item.id); }} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 20px', background: isActive ? '#1A1C21' : 'transparent', border: 'none', color: isActive ? 'white' : '#A7ADB7', fontWeight: isActive ? 800 : 700, fontSize: '15px', cursor: 'pointer', textAlign: 'left', borderRadius: '8px' }}>
                {isActive && <div style={{ position: 'absolute', left: '-12px', top: '10%', bottom: '10%', width: '4px', background: '#FF6A00', borderRadius: '0 4px 4px 0' }} />}
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </nav>
        
        <div style={{ padding: '24px' }}>
          {/* TEST LIVE */}
          <button
            onClick={sendTestOrder}
            style={{
              width: '100%', padding: '10px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #FF6A00, #F59E0B)',
              border: 'none', color: 'white', fontWeight: 900,
              fontSize: '11px', letterSpacing: '0.08em', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              boxShadow: '0 4px 16px rgba(255,106,0,0.35)', marginBottom: '12px',
            }}
          >
            🧪 TEST LIVE
          </button>
          <Link href="/kitchen" style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid #2A2D34', padding: '12px 20px', borderRadius: '8px', color: '#FFFFFF', fontWeight: 800, fontSize: '14px', cursor: 'pointer', textDecoration: 'none', marginBottom: '16px', transition: 'background 0.2s' }}>
            <Monitor size={18} color="#FF6A00" /> Pantalla Cocina
          </Link>
          <button style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'none', border: 'none', color: '#EF4444', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
            <X size={18} /> Cerrar Sesión
          </button>
        </div>

      </aside>

      {/* MAIN CONTENT AREA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      
      <AnimatePresence>

        {/* SETTINGS MODAL */}
        {selectedApp === 'settings' && (
          <motion.div key="settings-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(15px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={closeApp}>
            <motion.div initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} style={{ background: 'white', width: '100%', maxWidth: '750px', borderRadius: '4px', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
              <div style={{ padding: '32px', background: '#71717A', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 900 }}>{t.settings.title}</h2>
                <button onClick={closeApp} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', width: '40px', height: '40px', borderRadius: '50%', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} /></button>
              </div>
              <form onSubmit={saveSettings} style={{ padding: '32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <input type="text" value={myBusiness.businessName} placeholder={t.settings.businessName} onChange={e => setMyBusiness({ ...myBusiness, businessName: e.target.value })} style={{ width: '100%', padding: '14px', borderRadius: '4px', border: '1px solid #E9EDF7', fontWeight: 700 }} />
                <input type="text" value={myBusiness.phone || ''} placeholder={t.settings.phone} onChange={e => setMyBusiness({ ...myBusiness, phone: e.target.value })} style={{ width: '100%', padding: '14px', borderRadius: '4px', border: '1px solid #E9EDF7', fontWeight: 700 }} />
                <div style={{ gridColumn: 'span 2' }}>
                  <AddressAutocomplete
                    initialValue={myBusiness.address || ''}
                    placeholder={t.settings.address}
                    city={myBusiness.city || ''}
                    onAddressSelect={(addr, coords) => {
                      setMyBusiness({ 
                        ...myBusiness, 
                        address: addr,
                        location: coords ? { lat: coords[0], lng: coords[1] } : myBusiness.location
                      });
                    }}
                  />
                </div>
                {/* País fijo: Ecuador */}
                <div style={{ padding: '14px', borderRadius: '4px', border: '1px solid #E9EDF7', fontWeight: 700, background: '#F9FAFB', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🇪🇨</span> Ecuador
                </div>
                {/* Ciudad: lista de ciudades ecuatorianas */}
                <select
                  value={myBusiness.city || ''}
                  onChange={e => setMyBusiness({ ...myBusiness, city: e.target.value, country: 'Ecuador' })}
                  style={{ padding: '14px', borderRadius: '4px', border: '1px solid #E9EDF7', fontWeight: 700, color: myBusiness.city ? '#111' : '#9CA3AF' }}
                >
                  <option value="">{t.settings.city}</option>
                  {[
                    'Guayaquil','Quito','Cuenca','Santo Domingo','Machala',
                    'Durán','Manta','Portoviejo','Loja','Ambato',
                    'Esmeraldas','Quevedo','Riobamba','Milagro','Ibarra',
                    'Babahoyo','Sangolquí','Latacunga','Tulcán','Azogues',
                    'Salinas','Libertad','Daule','Samborondón','Nueva Loja'
                  ].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={myBusiness.language || 'Spanish'} onChange={e => setMyBusiness({ ...myBusiness, language: e.target.value })} style={{ gridColumn: 'span 2', padding: '14px', borderRadius: '4px', border: '1px solid #E9EDF7', fontWeight: 700 }}>
                  <option value="Spanish">Español</option><option value="English">English</option>
                </select>
                <button type="submit" style={{ gridColumn: 'span 2', padding: '20px', background: '#111', color: 'white', borderRadius: '4px', fontWeight: 900, cursor: 'pointer', border: 'none' }}>{isSaving ? t.settings.saving : t.settings.save}</button>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* REPORTS MODAL */}
        {selectedApp === 'reports' && (
          <motion.div key="reports-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={closeApp}>
            <motion.div initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} style={{ background: '#F4F7FE', width: '100%', maxWidth: '1200px', height: '95vh', borderRadius: '4px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
              <div style={{ padding: '24px 40px', background: '#111', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <div><h2 style={{ margin: 0, fontSize: '24px', fontWeight: 900 }}>{t.reports.title}</h2><p style={{ margin: 0, opacity: 0.7, fontWeight: 700, fontSize: '13px' }}>{t.reports.summary}</p></div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.1)', padding: '6px', borderRadius: '4px', display: 'flex', gap: '4px' }}>
                    <button onClick={() => setChartType('bars')} style={{ background: chartType === 'bars' ? '#3B82F6' : 'transparent', border: 'none', padding: '8px', borderRadius: '4px', color: 'white', cursor: 'pointer' }}><BarChart3 size={18} /></button>
                    <button onClick={() => setChartType('line')} style={{ background: chartType === 'line' ? '#3B82F6' : 'transparent', border: 'none', padding: '8px', borderRadius: '4px', color: 'white', cursor: 'pointer' }}><LineChart size={18} /></button>
                    <button onClick={() => setChartType('pie')} style={{ background: chartType === 'pie' ? '#3B82F6' : 'transparent', border: 'none', padding: '8px', borderRadius: '4px', color: 'white', cursor: 'pointer' }}><PieChart size={18} /></button>
                  </div>
                  <button onClick={sendReport} style={{ background: '#22C55E', border: 'none', padding: '0 20px', borderRadius: '4px', color: 'white', fontWeight: 900, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}><Send size={16} /> {t.reports.sendEmail}</button>
                  <button onClick={closeApp} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', width: '40px', height: '40px', borderRadius: '4px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} /></button>
                </div>
              </div>
              <div style={{ flex: 1, padding: '24px 40px', overflowY: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                  {[{ label: t.reports.today, val: salesStats.today, col: '#3B82F6' }, { label: t.reports.yesterday, val: salesStats.yesterday, col: '#111' }, { label: t.reports.month, val: salesStats.month, col: '#22C55E' }].map((k, i) => (
                    <div key={`stat-${i}`} style={{ background: 'white', padding: '16px', borderRadius: '4px', boxShadow: '0 10px 20px rgba(0,0,0,0.02)' }}>
                      <p style={{ margin: 0, fontSize: '11px', fontWeight: 800, color: '#A3AED0' }}>{k.label}</p>
                      <h4 style={{ margin: '4px 0 0', fontSize: '24px', fontWeight: 900, color: k.col }}>${k.val.toFixed(2)}</h4>
                    </div>
                  ))}
                </div>
                <div style={{ background: 'white', padding: '24px', borderRadius: '4px', boxShadow: '0 20px 40px rgba(0,0,0,0.03)', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontWeight: 900, fontSize: '16px' }}>PERFORMANCE ANALYTICS</h3>
                    <div style={{ display: 'flex', gap: '6px', background: '#F4F7FE', padding: '4px', borderRadius: '4px' }}>
                      {['day', 'week', 'month'].map(tf => (
                        <button key={`tf-${tf}`} onClick={() => setTimeframe(tf)} style={{ background: timeframe === tf ? 'white' : 'transparent', border: 'none', padding: '4px 10px', borderRadius: '4px', fontSize: '10px', fontWeight: 800, color: timeframe === tf ? '#111' : '#A3AED0', cursor: 'pointer' }}>{tf.toUpperCase()}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{ height: '160px', width: '100%', display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
                    {chartType === 'bars' && salesStats.history.map((val, i) => (
                      <div key={`bar-${i}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <motion.div initial={{ height: 0 }} animate={{ height: `${(val / 1200) * 100}%` }} style={{ width: '100%', background: '#3B82F6', borderRadius: '2px' }} />
                        <span style={{ fontSize: '9px', fontWeight: 800, color: '#A3AED0' }}>{i + 1}</span>
                      </div>
                    ))}
                    {chartType === 'line' && (
                      <svg width="100%" height="100%" viewBox="0 0 1000 160" preserveAspectRatio="none">
                        <motion.path initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} d={`M 0 ${160 - (salesStats.history[0] / 1200) * 160} ${salesStats.history.map((v, i) => `L ${i * 166} ${160 - (v / 1200) * 160}`).join(' ')}`} fill="none" stroke="#3B82F6" strokeWidth="5" strokeLinecap="round" />
                      </svg>
                    )}
                    {chartType === 'pie' && (
                      <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                        <div style={{ width: '150px', height: '150px', borderRadius: '50%', background: 'conic-gradient(#3B82F6 0% 45%, #FF5722 45% 75%, #22C55E 75% 100%)' }} />
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ background: 'white', padding: '24px', borderRadius: '4px', boxShadow: '0 15px 30px rgba(0,0,0,0.03)' }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 900 }}>{t.reports.topItems}</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                    {salesStats.topItems.map(([name, qty], idx) => (
                      <div key={`item-${idx}`} style={{ padding: '12px 16px', background: '#F4F7FE', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #E9EDF7' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                          <div style={{ flexShrink: 0, width: '26px', height: '26px', background: '#3B82F6', borderRadius: '2px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '11px' }}>{idx + 1}</div>
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

        {/* MENU CRUD MODAL */}
        {selectedApp === 'menu' && (
          <motion.div key="menu-manager-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(244,247,254,0.95)', backdropFilter: 'blur(30px)', zIndex: 1400, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={closeApp}>
            <motion.div initial={{ scale: 0.95, y: 50 }} animate={{ scale: 1, y: 0 }} style={{ background: '#F4F7FE', width: '100%', maxWidth: '1500px', height: '100vh', borderRadius: '4px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
              <div style={{ padding: '24px 40px', background: 'white', borderBottom: '1px solid #E9EDF7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 900 }}>{t.menu.title}</h2>
                  <motion.button whileHover={{ scale: 1.05 }} onClick={() => { setNewDish({ name: '', price: '', category: 'Main', image: '' }); setEditingDishId(null); setShowAddDish(true); }} style={{ padding: '12px 24px', background: '#EF4444', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 900, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Plus size={18} /> {t.menu.addDish}
                  </motion.button>
                </div>
                <motion.button whileHover={{ rotate: 90 }} onClick={closeApp} style={{ background: '#111', border: 'none', width: '48px', height: '48px', borderRadius: '4px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={28} /></motion.button>
              </div>
              <div style={{ flex: 1, padding: '32px 40px', overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', alignContent: 'start' }}>
                {products.map((p) => (
                  <motion.div key={p.id} whileHover={{ y: -6, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }} style={{ background: 'white', borderRadius: '4px', border: '1px solid #E9EDF7', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
                    <div style={{ height: '180px', background: '#F4F7FE', position: 'relative', borderRadius: '4px 4px 0 0', overflow: 'hidden' }}>
                      {p.image ? <img src={p.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ImageIcon size={40} color="#A3AED0" /></div>}
                      <div style={{ position: 'absolute', top: 10, right: 10, background: '#FF5722', color: 'white', padding: '6px 14px', fontWeight: 900, fontSize: '15px', borderRadius: '4px' }}>${p.price?.toFixed(2)}</div>
                    </div>
                    <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ overflow: 'hidden', paddingRight: '10px' }}>
                          <span style={{ fontSize: '10px', fontWeight: 900, color: '#3B82F6', textTransform: 'uppercase' }}>{p.category}</span>
                          <h4 style={{ margin: '4px 0 12px', fontSize: '17px', fontWeight: 900, color: '#1B2559', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</h4>
                        </div>
                        <div style={{ position: 'relative' }}>
                          <button onClick={() => setActiveMenuId(activeMenuId === p.id ? null : p.id)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: '4px' }}><MoreVertical size={20} /></button>
                          <AnimatePresence>
                            {activeMenuId === p.id && (
                              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ position: 'absolute', top: '100%', right: 0, background: 'white', borderRadius: '4px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', border: '1px solid #E9EDF7', zIndex: 10, minWidth: '160px' }}>
                                <button onClick={() => startEdit(p)} style={{ width: '100%', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '10px', background: 'none', border: 'none', textAlign: 'left', fontWeight: 800, fontSize: '12px', cursor: 'pointer', color: '#1B2559' }}>{t.menu.actionEdit.toUpperCase()}</button>
                                <button onClick={() => { setDishToDelete(p); setActiveMenuId(null); }} style={{ width: '100%', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '10px', background: 'none', border: 'none', textAlign: 'left', fontWeight: 800, fontSize: '12px', cursor: 'pointer', color: '#EF4444', borderTop: '1px solid #E9EDF7' }}>{t.menu.actionDelete.toUpperCase()}</button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ADD/EDIT DISH FORM */}
        {showAddDish && (
          <motion.div key="add-dish-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)', zIndex: 1500, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowAddDish(false)}>
            <motion.div initial={{ scale: 0.9, y: 60 }} animate={{ scale: 1, y: 0 }} style={{ background: 'white', width: '100%', maxWidth: '520px', borderRadius: '4px', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
              <div style={{ padding: '28px 32px', background: '#111', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 900 }}>{editingDishId ? t.menu.editDish : t.menu.addDish}</h2>
                <button onClick={() => setShowAddDish(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', width: '40px', height: '40px', borderRadius: '4px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} /></button>
              </div>
              <form onSubmit={addDishToMenu} style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div><label style={{ fontSize: '11px', fontWeight: 900, color: '#A3AED0', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '1px' }}>{t.menu.dishName}</label><input type="text" required value={newDish.name} onChange={e => setNewDish({ ...newDish, name: e.target.value })} style={{ width: '100%', padding: '14px', borderRadius: '4px', border: '1px solid #E9EDF7', fontWeight: 700, fontSize: '15px' }} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div><label style={{ fontSize: '11px', fontWeight: 900, color: '#A3AED0', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '1px' }}>{t.menu.price}</label><input type="number" step="0.01" required value={newDish.price} onChange={e => setNewDish({ ...newDish, price: e.target.value })} style={{ width: '100%', padding: '14px', borderRadius: '4px', border: '1px solid #E9EDF7', fontWeight: 700 }} /></div>
                  <div><label style={{ fontSize: '11px', fontWeight: 900, color: '#A3AED0', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '1px' }}>{t.menu.category}</label>
                    <select value={newDish.category} onChange={e => setNewDish({ ...newDish, category: e.target.value })} style={{ width: '100%', padding: '14px', borderRadius: '4px', border: '1px solid #E9EDF7', fontWeight: 700 }}>
                      <option value="Main">MAIN COURSE</option><option value="Apps">APPETIZERS</option><option value="Drinks">DRINKS</option><option value="Desserts">DESSERTS</option>
                    </select>
                  </div>
                </div>
                <div style={{ border: '2px dashed #E9EDF7', borderRadius: '4px', padding: '32px', textAlign: 'center', position: 'relative', cursor: 'pointer' }}>
                  {newDish.image ? <img src={newDish.image} style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '2px' }} /> : <div style={{ color: '#A3AED0' }}><UploadIcon size={36} style={{ marginBottom: '12px' }} /><p style={{ margin: 0, fontWeight: 800, fontSize: '13px' }}>{isUploading ? t.menu.uploadInfo : t.menu.photo}</p></div>}
                  <input type="file" accept="image/*" onChange={handleFileUpload} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                  {isUploading && <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }}><Loader2 className="animate-spin" color="#FF5722" size={36} /></div>}
                </div>
                <motion.button whileHover={{ scale: 1.02 }} type="submit" disabled={isSaving || isUploading} style={{ padding: '18px', background: '#FF5722', color: 'white', borderRadius: '4px', border: 'none', fontWeight: 900, fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                  {isSaving ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />} {t.menu.save}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* DELETE CONFIRM */}
        {dishToDelete && (
          <motion.div key="delete-confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div initial={{ scale: 0.85 }} animate={{ scale: 1 }} style={{ background: 'white', padding: '40px', borderRadius: '4px', maxWidth: '420px', width: '100%', textAlign: 'center' }}>
              <div style={{ width: '60px', height: '60px', background: '#FEF2F2', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}><X size={28} color="#EF4444" /></div>
              <h3 style={{ margin: '0 0 8px', fontWeight: 900, fontSize: '20px' }}>¿Eliminar {dishToDelete.name}?</h3>
              <p style={{ color: '#A3AED0', fontWeight: 700, margin: '0 0 28px' }}>Esta acción no se puede deshacer.</p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setDishToDelete(null)} style={{ flex: 1, padding: '14px', background: '#F4F7FE', border: '1px solid #E9EDF7', borderRadius: '4px', fontWeight: 800, cursor: 'pointer' }}>{t.menu.cancel}</button>
                <button onClick={executeDelete} style={{ flex: 1, padding: '14px', background: '#EF4444', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 900, cursor: 'pointer' }}>{t.menu.actionDelete}</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* POS MODAL */}
        {selectedApp === 'pos' && (
          <motion.div key="pos-manager-modal" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} style={{ position: 'absolute', inset: 0, background: '#0B0B0D', zIndex: 50, display: 'flex' }}>
            
            {/* Left Side: Products Catalog Context */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              
              {/* Header */}
              <div style={{ padding: '32px 40px', display: 'flex', alignItems: 'center', gap: '40px' }}>
                <h2 style={{ margin: 0, fontSize: '32px', fontWeight: 900, color: 'white' }}>Menú</h2>
                <div style={{ flex: 1, maxWidth: '500px', position: 'relative' }}>
                  <Search size={20} color="#6B7280" style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input type="text" placeholder="Buscar productos..." style={{ width: '100%', padding: '16px 20px 16px 56px', background: '#121317', border: '1px solid #1A1C21', borderRadius: '12px', color: 'white', fontSize: '15px', fontWeight: 700, outline: 'none' }} />
                </div>
              </div>

              {/* Tabs */}
              <div style={{ padding: '0 40px', display: 'flex', gap: '8px', marginBottom: '32px' }}>
                {['Recomendados', 'Pizzas', 'Hamburguesas', 'Combos'].map(cat => {
                   const isActive = posCategory === (cat==='Recomendados' ? 'All' : cat);
                   return (
                     <button key={cat} onClick={() => setPosCategory(cat==='Recomendados' ? 'All' : cat)} style={{ padding: '12px 28px', background: isActive ? '#FF6A00' : 'transparent', color: isActive ? 'white' : '#A7ADB7', border: isActive ? 'none' : '1px solid #2A2D34', borderRadius: '12px', fontWeight: 800, fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s' }}>{cat}</button>
                   );
                })}
              </div>

              {/* Product Grid */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '0 40px 40px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '20px', alignContent: 'start', scrollbarWidth: 'none' }}>
                {products.filter(p => posCategory === 'All' || p.category === posCategory).map(p => (
                  <motion.button key={`pos-p-${p.id}`} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }} onClick={() => addToCart(p)} style={{ background: '#121317', border: '1px solid #1A1C21', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', padding: '8px', textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ height: '130px', width: '100%', position: 'relative', background: '#1A1C21', borderRadius: '8px', overflow: 'hidden', marginBottom: '12px' }}>
                      {p.image ? <img src={p.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ChefHat size={32} color="#2A2D34" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />}
                    </div>
                    <div style={{ padding: '0 4px 4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
                        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: 'white', lineHeight: '1.2' }}>{p.name}</h4>
                        <span style={{ fontWeight: 900, color: 'white', fontSize: '14px', flexShrink: 0 }}>${p.price.toFixed(2)}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '12px', color: '#FF6A00', fontWeight: 700 }}>+ Extra</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Right Side: Payment Context */}
            <div style={{ width: '420px', background: '#121317', borderLeft: '1px solid #1A1C21', display: 'flex', flexDirection: 'column', position: 'relative' }}>
              
              <div style={{ padding: '32px 32px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '24px', fontWeight: 900, color: 'white' }}>Pago</h3>
                <button onClick={closeApp} style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={24} /></button>
              </div>

              {/* Quick Amount Buttons */}
              <div style={{ padding: '0 32px 24px', display: 'flex', gap: '8px' }}>
                {['10', '20', '50', '100'].map(amt => (
                  <button key={amt} style={{ flex: 1, padding: '14px 0', background: '#0B0B0D', color: '#A7ADB7', border: '1px solid #1A1C21', borderRadius: '12px', fontWeight: 900, fontSize: '16px', cursor: 'pointer', transition: 'all 0.2s' }}>{amt}</button>
                ))}
              </div>

              {/* Total Display */}
              <div style={{ padding: '0 32px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: '20px', color: 'white' }}>Total</span>
                <span style={{ fontWeight: 900, fontSize: '36px', color: 'white' }}>${posTotal.toFixed(2)}</span>
              </div>

              {/* Payment Method Toggle */}
              <div style={{ padding: '0 32px 24px', display: 'flex', gap: '12px' }}>
                {[{id:'cash', label:'Efectivo', icon:<DollarSign size={18}/>, active: true}, {id:'card', label:'Tarjeta', icon:<CreditCard size={18}/>}, {id:'transfer', label:'Transferencia', icon:<Smartphone size={18}/>}].map(method => (
                  <button key={method.id} style={{ flex: 1, padding: '16px 8px', background: method.active ? 'rgba(255,106,0,0.1)' : '#0B0B0D', color: method.active ? '#FF6A00' : '#6B7280', border: method.active ? '1px solid #FF6A00' : '1px solid #1A1C21', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s' }}>
                    {method.icon}
                    <span style={{ fontSize: '12px', fontWeight: 800 }}>{method.label}</span>
                  </button>
                ))}
              </div>

              {/* Cart Items */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '0 32px', scrollbarWidth: 'none', borderTop: '1px solid #1A1C21', borderBottom: '1px solid #1A1C21' }}>
                {posCart.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#6B7280' }}>
                    <ShoppingCart size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                    <span style={{ fontWeight: 800, fontSize: '14px' }}>Carrito vacío</span>
                  </div>
                ) : (
                  posCart.map(item => (
                    <div key={`cart-${item.id}`} style={{ display: 'flex', gap: '16px', padding: '20px 0', borderBottom: '1px solid #1A1C21' }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: 900, color: 'white' }}>{item.name}</h4>
                        <span style={{ fontWeight: 900, color: '#A7ADB7' }}>${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#0B0B0D', padding: '6px 12px', borderRadius: '12px', border: '1px solid #1A1C21' }}>
                        <button onClick={() => updateCartQty(item.id, -1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 900, fontSize: '18px', color: '#A7ADB7' }}>-</button>
                        <span style={{ fontWeight: 900, fontSize: '15px', minWidth: '16px', textAlign: 'center', color: 'white' }}>{item.quantity}</span>
                        <button onClick={() => updateCartQty(item.id, 1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 900, fontSize: '18px', color: '#A7ADB7' }}>+</button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Checkout Input and Button */}
              <div style={{ padding: '32px', background: '#121317' }}>
                <input type="text" placeholder="Nombre del cliente (opcional)..." value={posCustomer} onChange={e => setPosCustomer(e.target.value)} style={{ width: '100%', padding: '16px', background: '#0B0B0D', border: '1px solid #1A1C21', borderRadius: '12px', fontWeight: 700, fontSize: '14px', color: 'white', marginBottom: '24px', outline: 'none' }} />
                
                <motion.button whileHover={posCart.length > 0 ? { scale: 1.02 } : {}} onClick={chargePosOrder} disabled={posCart.length === 0 || isSaving} style={{ width: '100%', padding: '24px', background: posCart.length > 0 ? '#FF6A00' : '#2A2D34', color: posCart.length > 0 ? 'white' : '#6B7280', border: 'none', borderRadius: '16px', fontWeight: 900, fontSize: '20px', cursor: posCart.length > 0 ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', boxShadow: posCart.length > 0 ? '0 10px 30px rgba(255,106,0,0.3)' : 'none' }}>
                  {isSaving ? <Loader2 className="animate-spin" size={28} /> : <Check size={28} />} 
                  COBRAR TICKET
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CANCEL REQUEST MODAL */}
      <AnimatePresence>
        {cancelReqOrder && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
            onClick={() => setCancelReqOrder(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
              style={{ background: 'white', border: `1px solid #E9EAEC`, borderRadius: '24px', width: '100%', maxWidth: '420px', padding: '32px' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ width: '48px', height: '48px', background: '#EF444415', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', color: '#EF4444' }}>
                <AlertTriangle size={24} />
              </div>
              <h3 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 900, color: '#111827' }}>Solicitar Cancelación</h3>
              <p style={{ margin: '0 0 24px', fontSize: '13px', color: '#6B7280', lineHeight: 1.5 }}>
                El pedido <b>#{cancelReqOrder.id.slice(0,6).toUpperCase()}</b> requiere autorización del Centro LIVE para ser cancelado. Selecciona el motivo:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                {['Producto agotado', 'Local cerrado', 'Driver no llegó', 'Otro'].map(r => (
                  <button
                    key={r}
                    onClick={() => setCancelReason(r)}
                    style={{
                      padding: '14px 16px', background: cancelReason === r ? '#EF444410' : '#F7F7F8', border: `2px solid ${cancelReason === r ? '#EF4444' : 'transparent'}`,
                      borderRadius: '12px', textAlign: 'left', fontWeight: 700, fontSize: '14px', color: cancelReason === r ? '#EF4444' : '#111827', cursor: 'pointer'
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>

              {cancelReason === 'Otro' && (
                <div style={{ marginBottom: '24px' }}>
                  <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 800, color: '#111827' }}>Especificar otro motivo:</p>
                  <input
                    type="text"
                    value={cancelOtherText}
                    onChange={e => setCancelOtherText(e.target.value)}
                    placeholder="Escribe el motivo..."
                    autoFocus
                    style={{ width: '100%', padding: '14px', background: '#F7F7F8', border: 'none', borderRadius: '12px', outline: 'none', fontSize: '14px', fontWeight: 600 }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={sendCancelRequest}
                  disabled={sendingCancelReq || (cancelReason === 'Otro' && !cancelOtherText.trim())}
                  style={{ flex: 1, padding: '16px', background: '#EF4444', color: 'white', border: 'none', borderRadius: '14px', fontWeight: 900, fontSize: '14px', cursor: 'pointer', opacity: sendingCancelReq ? 0.7 : 1 }}
                >
                  {sendingCancelReq ? 'Enviando...' : 'Enviar Solicitud'}
                </button>
                <button
                  onClick={() => setCancelReqOrder(null)}
                  style={{ padding: '16px 24px', background: 'transparent', color: '#6B7280', border: 'none', fontWeight: 800, fontSize: '14px', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main style={{ flex: 1, padding: '32px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* TOP STATUS BARS — usando nueva máquina de estados */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {([
            { id: 'new' as SellerTab,       label: 'Nuevos',       color: '#F59E0B', icon: <Bell size={24}/> },
            { id: 'kitchen' as SellerTab,   label: 'En cocina',    color: '#FF6A00', icon: <ChefHat size={24}/> },
            { id: 'driver' as SellerTab,    label: 'Con driver',   color: '#3B82F6', icon: <Bike size={24}/> },
            { id: 'history' as SellerTab,   label: 'Entregados',   color: '#8B5CF6', icon: <Archive size={24}/> },
            { id: 'cancelled' as SellerTab, label: 'Cancelados',   color: '#EF4444', icon: <X size={24}/> },
          ] as const).map(tab => (
            <motion.button key={`status-${tab.id}`} onClick={() => setActiveTab(tab.id)} whileHover={{ y: -4, scale: 1.02 }}
              style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 24px', background: tab.color, color: 'white', border: activeTab === tab.id ? '2px solid rgba(255,255,255,0.8)' : '2px solid transparent', borderRadius: '12px', boxShadow: activeTab === tab.id ? `0 15px 30px ${tab.color}80` : '0 4px 10px rgba(0,0,0,0.1)', cursor: 'pointer', flex: 1, minWidth: '180px', transition: 'all 0.3s' }}>
              <div style={{ background: 'rgba(255,255,255,0.25)', color: 'white', padding: '10px', borderRadius: '8px', backdropFilter: 'blur(4px)' }}>{tab.icon}</div>
              <div style={{ textAlign: 'left' }}>
                <span style={{ display: 'block', fontSize: '15px', fontWeight: 800 }}>{tab.label}</span>
                <span style={{ display: 'block', fontSize: '22px', fontWeight: 900 }}>{tabCount(tab.id)}</span>
              </div>
            </motion.button>
          ))}
          <motion.button onClick={() => setSelectedApp('pos')} whileHover={{ scale: 1.02 }} style={{ padding: '16px 24px', background: '#FF6A00', color: 'white', border: 'none', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 800, fontSize: '16px', cursor: 'pointer', boxShadow: '0 10px 20px rgba(255,106,0,0.3)' }}>
            <Plus size={24} /> Nuevo Pedido
          </motion.button>
        </div>

        {/* ORDER PANEL / TABS */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px 24px', marginBottom: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: 900, color: '#111827' }}>Panel de Pedidos</h2>
            <div style={{ display: 'flex', gap: '24px' }}>
              {([{id:'all' as SellerTab, label:'Todos'}, {id:'new' as SellerTab, label:'Nuevos'}, {id:'kitchen' as SellerTab, label:'Cocina'}, {id:'driver' as SellerTab, label:'Con driver'}, {id:'history' as SellerTab, label:'Entregados'}, {id:'cancelled' as SellerTab, label:'Cancelados'}]).map(t => (
                <button key={`subtab-${t.id}`} onClick={() => setActiveTab(t.id)} style={{ background: 'none', border: 'none', padding: '0 0 8px 0', fontSize: '14px', fontWeight: activeTab === t.id ? 800 : 700, color: activeTab === t.id ? '#111827' : '#6B7280', borderBottom: activeTab === t.id ? '3px solid #FF6A00' : '3px solid transparent', cursor: 'pointer' }}>
                  {t.label} <span style={{ background: '#F7F7F8', padding: '2px 6px', borderRadius: '12px', fontSize: '11px', color: '#111827' }}>{tabCount(t.id)}</span>
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6B7280', fontWeight: 700, fontSize: '14px' }}>
            Hoy: <select style={{ background: '#F7F7F8', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 800, outline: 'none', color: '#111827' }}><option>Todos</option></select>
          </div>
        </div>

        {/* ORDERS GRID */}
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '24px', scrollbarWidth: 'none' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px', alignContent: 'start' }}>
            {filteredOrders.length === 0 && <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: '#A3AED0', fontWeight: 800 }}><ShoppingBag size={48} style={{ opacity: 0.2, marginBottom: '16px' }} /><br/>No hay pedidos en esta vista</div>}
            
            {filteredOrders.map((order, idx) => {
              // ── State machine colors and labels ──
              // ── Normalize legacy Firestore statuses to new state machine ──
              const rawStatus = order.status || 'created';
              const oStatus: OrderStatus = (
                rawStatus === 'paid' || rawStatus === 'new' ? 'created' :
                rawStatus === 'cooking'    ? 'preparing' :
                rawStatus === 'ready'      ? 'ready_for_pickup' :
                rawStatus === 'dispatched' ? 'on_the_way' :
                rawStatus
              ) as OrderStatus;
              const oColor   = STATUS_COLORS[oStatus]  || '#F59E0B';
              const oTitle   = STATUS_LABELS[oStatus]  || 'Nuevo';
              let sellerNext = SELLER_TRANSITIONS[oStatus];
              // If a driver is assigned, the seller should NOT manually dispatch or deliver.
              // They ONLY do the handoff to the driver (driver_arrived -> picked_up).
              if (order.assignedDriverId) {
                if (sellerNext === 'on_the_way' || sellerNext === 'delivered') {
                  sellerNext = undefined;
                }
              }
              
              return (
                <motion.div key={`order-${order.id || idx}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', border: `1px solid ${oColor}22` }}>
                  
                  {/* Card Header Colored */}
                  <div style={{ background: oColor, padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '15px' }}>
                      {['driver_assigned','driver_arrived','picked_up','on_the_way','delivered','completed'].includes(oStatus) && <Bike size={16} />}
                      {['ready_for_pickup','accepted','preparing'].includes(oStatus) && <ChefHat size={16} />}
                      {oTitle}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 10px', borderRadius: '12px', fontSize: '10px', fontWeight: 800 }}>
                        #{order.id?.slice(0,6)?.toUpperCase()}
                      </div>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div style={{ padding: '20px', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#F7F7F8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: oColor, fontWeight: 900 }}>
                           {order.customerName ? order.customerName.charAt(0).toUpperCase() : 'C'}
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 900, color: '#111827' }}>{order.customerName || 'Cliente Local'}</h4>
                          <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: 700 }}>{order.address || ''}</span>
                        </div>
                      </div>
                      <span style={{ fontSize: '12px', color: '#A7ADB7', fontWeight: 800 }}>
                        {order.createdAt?.seconds ? new Date(order.createdAt.seconds*1000).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) : '--'}
                      </span>
                    </div>

                    {/* ── DRIVER BADGE — always shown when assigned, NEVER hidden ── */}
                    {order.assignedDriverId ? (
                      <div style={{ marginBottom: '12px', padding: '10px 14px', background: '#EFF6FF', borderRadius: '10px', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Bike size={14} color="#3B82F6" />
                        <span style={{ fontSize: '12px', fontWeight: 800, color: '#1E40AF' }}>
                          Driver: <span style={{ color: '#3B82F6' }}>{order.driverName || order.assignedDriverId}</span>
                          {order.driverPhone && <span style={{ color: '#6B7280', marginLeft: '8px' }}>· {order.driverPhone}</span>}
                        </span>
                        <div style={{ marginLeft: 'auto', width: '8px', height: '8px', borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 6px #22C55E' }} />
                      </div>
                    ) : (oStatus === 'ready_for_pickup') ? (
                      <div style={{ marginBottom: '12px', padding: '10px 14px', background: '#FFF7ED', borderRadius: '10px', border: '1px solid #FED7AA', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Bike size={14} color="#F97316" />
                        <span style={{ fontSize: '12px', fontWeight: 800, color: '#C2410C' }}>
                          Esperando asignación de driver...
                        </span>
                        <div style={{ marginLeft: 'auto', width: '8px', height: '8px', borderRadius: '50%', background: '#F97316', animation: 'spin 2s linear infinite' }} />
                      </div>
                    ) : null}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                      {order.items?.map((item: any, i: number) => (
                        <div key={`item-${i}`} style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '14px', fontWeight: 700, color: '#111827' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: oColor, flexShrink: 0 }} />
                          <span>{item.quantity}x {item.name}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '14px', borderTop: '1px solid #E9EAEC' }}>
                      <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: 700 }}>
                        <span style={{ color: '#111827', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <DollarSign size={14} color="#FF6A00" /> {order.total} USD
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        {/* ── STATE MACHINE: seller can only do specific transitions ── */}
                        {sellerNext && (
                          <button
                            onClick={() => updateStatus(order.id, sellerNext)}
                            style={{ padding: '10px 20px', background: STATUS_COLORS[sellerNext], color: 'white', border: 'none', borderRadius: '12px', fontWeight: 900, cursor: 'pointer', fontSize: '13px' }}
                          >
                          {sellerNext === 'accepted'         ? '✅ Aceptar pedido' :
                           sellerNext === 'preparing'        ? '👨‍🍳 A cocina' :
                           sellerNext === 'ready_for_pickup' ? '🔔 Marcar listo' :
                           sellerNext === 'on_the_way'       ? '🛵 Despachar sin driver' :
                           sellerNext === 'picked_up'        ? '🤝 Entregar al driver' :
                           sellerNext === 'delivered'        ? '✅ Confirmar entrega' :
                           STATUS_LABELS[sellerNext]}
                          </button>
                        )}
                        {!sellerNext && oStatus === 'accepted' && (
                          <span style={{ fontSize: '13px', fontWeight: 800, color: '#FF6A00', padding: '10px 0', border: '1px solid #FF6A0033', borderRadius: '12px', paddingLeft: '16px', paddingRight: '16px', background: '#FF6A0011' }}>
                            ⏳ Esperando al chef...
                          </span>
                        )}
                        {/* Cancel request — only for non-terminal active orders */}
                        {['created','accepted','preparing','ready_for_pickup'].includes(oStatus) && !order.cancelRequest && (
                          <button
                            onClick={() => { setCancelReqOrder(order); setCancelReason('Producto agotado'); setCancelOtherText(''); }}
                            style={{ padding: '10px 16px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: '12px', fontWeight: 800, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                            title="Solicitar cancelación al administrador"
                          >
                            <X size={16} strokeWidth={3} /> Cancelar
                          </button>
                        )}
                        {order.cancelRequest?.status === 'pending' && (
                          <span style={{ padding: '6px 10px', background: '#EF444415', color: '#EF4444', border: '1px solid #EF444430', borderRadius: '10px', fontSize: '11px', fontWeight: 800 }}>⏳ Solicitud enviada</span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  </div>
);
}
