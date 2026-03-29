'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Store, User, MapPin, Phone, ArrowLeft, 
  CheckCircle2, Loader2, Utensils, 
  ShoppingBag, Pill, Pizza, Coffee
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';

const businessTypes = [
  { id: 'restaurant', name: 'Restaurante', icon: <Utensils size={20} /> },
  { id: 'bakery',     name: 'Panadería',   icon: <Pizza size={20} /> },
  { id: 'pharmacy',   name: 'Farmacia',    icon: <Pill size={20} /> },
  { id: 'supermarket',name: 'Supermercado',icon: <ShoppingBag size={20} /> },
  { id: 'cafe',       name: 'Cafetería',   icon: <Coffee size={20} /> },
];

export default function RegisterBusiness() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    businessName: '',
    representative: '',
    type: '',
    phone: '',
    address: '',
    location: null as [number, number] | null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.businessName || !formData.address) {
       alert("Por favor completa los campos obligatorios.");
       return;
    }

    setIsSubmitting(true);
    try {
      // Guardamos la solicitud de negocio en Firebase
      const businessRef = doc(db, 'business_requests', `${user.uid}_${Date.now()}`);
      await setDoc(businessRef, {
        ...formData,
        userId: user.uid,
        userEmail: user.email,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      
      setIsSuccess(true);
      setTimeout(() => router.push('/order'), 3000);
    } catch (err) {
      console.error("Error al registrar negocio:", err);
      alert("Hubo un error al enviar tu solicitud. Inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '24px' }}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
          <CheckCircle2 color="#22C55E" size={64} strokeWidth={2.5} />
        </motion.div>
        <h2 style={{ marginTop: '20px', fontSize: '24px', fontWeight: 900, color: '#111' }}>¡Solicitud enviada!</h2>
        <p style={{ marginTop: '8px', color: '#666', fontSize: '15px' }}>
          Tu local está siendo revisado por nuestro equipo.<br />Te contactaremos pronto.
        </p>
        <p style={{ marginTop: '24px', fontSize: '12px', color: '#999', fontWeight: 700 }}>Redirigiendo al inicio...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '0 0 40px' }}>
      
      {/* Header */}
      <div style={{ padding: '20px 16px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #F0F0F0', background: 'white' }}>
        <button onClick={() => router.back()} style={{ background: '#F5F5F7', border: 'none', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <ArrowLeft size={18} color="#666" />
        </button>
        <h1 style={{ fontSize: '18px', fontWeight: 900, color: '#111', margin: 0 }}>Vende con Delivery<span style={{ color: '#FF5722' }}>.ec</span></h1>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Intro */}
        <div style={{ marginBottom: '8px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#111', lineHeight: 1.2, margin: '0 0 8px' }}>Registra tu negocio</h2>
          <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.5 }}>Únete a la plataforma de entregas más rápida de Ecuador y haz crecer tus ventas.</p>
        </div>

        {/* Name Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '13px', fontWeight: 800, color: '#444', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nombre del Local *</label>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#999' }}>
              <Store size={18} />
            </div>
            <input 
              type="text" 
              required
              placeholder="Ej: Pizzería El Gran Sabor"
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              style={{ width: '100%', padding: '14px 14px 14px 48px', borderRadius: '16px', border: '2px solid #F0F0F0', fontSize: '15px', outline: 'none', transition: 'border-color 0.2s' }}
            />
          </div>
        </div>

        {/* Representative */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '13px', fontWeight: 800, color: '#444', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Representante Legal</label>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#999' }}>
              <User size={18} />
            </div>
            <input 
              type="text" 
              placeholder="Nombre y Apellido"
              value={formData.representative}
              onChange={(e) => setFormData({ ...formData, representative: e.target.value })}
              style={{ width: '100%', padding: '14px 14px 14px 48px', borderRadius: '16px', border: '2px solid #F0F0F0', fontSize: '15px', outline: 'none' }}
            />
          </div>
        </div>

        {/* Type Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '13px', fontWeight: 800, color: '#444', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tipo de Negocio *</label>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            {businessTypes.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setFormData({ ...formData, type: t.id })}
                style={{
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 16px',
                  borderRadius: '12px',
                  border: formData.type === t.id ? '2px solid #FF5722' : '2px solid #F0F0F0',
                  background: formData.type === t.id ? '#FFF0EE' : 'white',
                  color: formData.type === t.id ? '#FF5722' : '#666',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {t.icon} {t.name}
              </button>
            ))}
          </div>
        </div>

        {/* Address Autocomplete */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '13px', fontWeight: 800, color: '#444', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dirección exacta del Local *</label>
          <AddressAutocomplete 
            onAddressSelect={(addr, coord) => setFormData({ ...formData, address: addr, location: coord })}
            placeholder="Introduce la ubicación del local"
          />
        </div>

        {/* Phone */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '13px', fontWeight: 800, color: '#444', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Teléfono de contacto</label>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#999' }}>
              <Phone size={18} />
            </div>
            <input 
              type="tel" 
              placeholder="099 999 9999"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              style={{ width: '100%', padding: '14px 14px 14px 48px', borderRadius: '16px', border: '2px solid #F0F0F0', fontSize: '15px', outline: 'none' }}
            />
          </div>
        </div>

        {/* Submit */}
        <motion.button
          type="submit"
          disabled={isSubmitting}
          whileTap={{ scale: 0.98 }}
          style={{
            marginTop: '12px',
            padding: '18px',
            borderRadius: '16px',
            background: '#FF5722',
            color: 'white',
            border: 'none',
            fontSize: '16px',
            fontWeight: 800,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            boxShadow: '0 8px 25px rgba(255,87,34,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}
        >
          {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
          {isSubmitting ? 'ENVIANDO...' : 'ENVIAR SOLICITUD'}
        </motion.button>

        <p style={{ textAlign: 'center', fontSize: '11px', color: '#999', padding: '0 20px', lineHeight: 1.5 }}>
          Al enviar, aceptas nuestros términos para comercios asociados.<br />Nos pondremos en contacto en menos de 24h laborables.
        </p>

      </form>
    </div>
  );
}
