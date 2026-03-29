'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, User, Bike, Store, Bell, CheckCircle2, 
  XCircle, MapPin, Phone, Mail, ChevronRight,
  TrendingUp, Clock, Package, MoreVertical,
  Search, ShieldCheck
} from 'lucide-react';
import { collection, onSnapshot, query, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'requests' | 'users' | 'drivers'>('requests');
  const [requests, setRequests] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Stats
  const stats = [
    { label: 'Negocios', value: requests.length, icon: <Store size={20} />, color: '#FF5722' },
    { label: 'Usuarios', value: users.length, icon: <Users size={20} />, color: '#3B82F6' },
    { label: 'Drivers', value: drivers.length, icon: <Bike size={20} />, color: '#22C55E' },
    { label: 'Pedidos Hoy', value: 0, icon: <Package size={20} />, color: '#F59E0B' },
  ];

  useEffect(() => {
    // Listen for business requests
    const qRequests = query(collection(db, 'business_requests'));
    const unsubReq = onSnapshot(qRequests, (snap) => {
      setRequests(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setIsLoading(false);
    });

    // Listen for users
    const qUsers = query(collection(db, 'profiles'));
    const unsubUsers = onSnapshot(qUsers, (snap) => {
      setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubReq();
      unsubUsers();
    };
  }, []);

  const handleApprove = async (id: string) => {
    try {
      const bizRef = doc(db, 'business_requests', id);
      await updateDoc(bizRef, { status: 'approved' });
      alert("Negocio aprobado con éxito.");
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (id: string) => {
    if (confirm("¿Estás seguro de rechazar esta solicitud?")) {
      try {
        const bizRef = doc(db, 'business_requests', id);
        await updateDoc(bizRef, { status: 'rejected' });
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div style={{ minHeight: '100dvh', background: '#F8F9FA', fontFamily: 'Inter, sans-serif' }}>
      
      {/* ── Sidebar Desktop / Topbar Mobile ── */}
      <nav style={{ background: '#111', color: 'white', padding: '20px 24px', position: 'sticky', top: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: '#FF5722', width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '16px' }}>D</div>
          <span style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '-0.5px' }}>DeliveryEC <span style={{ color: '#FF5722', fontSize: '12px', fontWeight: 700, marginLeft: '4px', textTransform: 'uppercase' }}>Admin</span></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Bell size={20} color="#999" />
          <div style={{ width: '36px', height: '36px', background: '#333', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={18} />
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
        
        {/* ── Quick Stats ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          {stats.map((s) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ background: 'white', padding: '24px', borderRadius: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', gap: '20px' }}
            >
              <div style={{ width: '48px', height: '48px', background: `${s.color}15`, color: s.color, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {s.icon}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '13px', color: '#999', fontWeight: 600 }}>{s.label}</p>
                <h4 style={{ margin: 0, fontSize: '24px', fontWeight: 900, color: '#111' }}>{s.value}</h4>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Tabs Navigator ── */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
          {[
            { id: 'requests', label: 'Solicitudes Negocios', icon: <Store size={18} /> },
            { id: 'users',    label: 'Clientes Registrados', icon: <Users size={18} /> },
            { id: 'drivers',  label: 'Repartidores',        icon: <Bike size={18} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '12px 20px',
                borderRadius: '16px',
                border: 'none',
                background: activeTab === tab.id ? '#1A1A1A' : 'white',
                color: activeTab === tab.id ? 'white' : '#666',
                fontWeight: 700,
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: activeTab === tab.id ? '0 10px 20px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ── List Content ── */}
        <div style={{ background: 'white', borderRadius: '28px', padding: '24px', boxShadow: '0 8px 30px rgba(0,0,0,0.04)' }}>
          <AnimatePresence mode="wait">
            {activeTab === 'requests' && (
              <motion.div key="requests" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 900 }}>Solicitudes de Registro</h3>
                {requests.length === 0 ? (
                  <p style={{ color: '#999', textAlign: 'center', padding: '40px' }}>No hay solicitudes pendientes.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {requests.map((req) => (
                      <div key={req.id} style={{ padding: '20px', borderRadius: '20px', border: '1px solid #F0F0F0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', gap: '16px' }}>
                            <div style={{ width: '56px', height: '56px', background: '#F5F5F7', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111' }}>
                              <Store size={24} />
                            </div>
                            <div>
                              <h4 style={{ margin: '0 0 4px', fontSize: '17px', fontWeight: 900 }}>{req.businessName}</h4>
                              <p style={{ margin: 0, fontSize: '13px', color: '#666', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <ShieldCheck size={14} color="#FF5722" /> Tipo: {req.type || 'N/A'}
                              </p>
                            </div>
                          </div>
                          <div style={{
                            padding: '6px 12px',
                            borderRadius: '10px',
                            fontSize: '11px',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            background: req.status === 'approved' ? '#E8FAF0' : req.status === 'rejected' ? '#FFF0EE' : '#F0F0F3',
                            color: req.status === 'approved' ? '#22C55E' : req.status === 'rejected' ? '#FF5722' : '#999'
                          }}>
                            {req.status || 'pendiente'}
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666', fontSize: '13px' }}>
                            <User size={14} /> {req.representative || 'No especificado'}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666', fontSize: '13px' }}>
                            <MapPin size={14} /> <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{req.address}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666', fontSize: '13px' }}>
                            <Phone size={14} /> {req.phone || 'No celular'}
                          </div>
                        </div>

                        {req.status !== 'approved' && req.status !== 'rejected' && (
                          <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                            <button
                              onClick={() => handleApprove(req.id)}
                              style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#22C55E', color: 'white', fontWeight: 800, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                            >
                              <CheckCircle2 size={16} /> Aprobar Local
                            </button>
                            <button
                              onClick={() => handleReject(req.id)}
                              style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#FFF0EE', color: '#FF5722', fontWeight: 800, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                            >
                              <XCircle size={16} /> Rechazar
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'users' && (
               <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                 <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 900 }}>Lista de Usuarios</h3>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {users.map((u) => (
                      <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderRadius: '16px', background: '#F8F9FA' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '40px', height: '40px', background: '#FF5722', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900 }}>
                            {u.name?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>{u.name || 'Usuario'}</p>
                            <p style={{ margin: 0, fontSize: '11px', color: '#999' }}>ID: {u.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                        <ChevronRight size={18} color="#CCC" />
                      </div>
                    ))}
                 </div>
               </motion.div>
            )}
            
            {activeTab === 'drivers' && (
               <motion.div key="drivers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                 <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 900 }}>Panel de Drivers</h3>
                 <p style={{ color: '#999', textAlign: 'center', padding: '40px' }}>Esta sección requiere integración con LiveMap de conductores.</p>
               </motion.div>
            )}
          </AnimatePresence>
        </div>

      </main>
    </div>
  );
}
