'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ChevronDown, Check, Lock,
  CreditCard, Wallet, Building,
  ShieldCheck, Loader2, MoreHorizontal, AlertCircle,
  MapPin, Clock, Bike,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { useCart } from '@/lib/CartContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import AddressAutocomplete from '@/components/AddressAutocomplete';

/* ── Haversine distance (km) ── */
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

/* ── Geocode address via Nominatim ── */
async function geocode(address: string): Promise<[number,number] | null> {
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`, { headers: { 'Accept-Language': 'es' } });
    const d = await r.json();
    if (d[0]) return [parseFloat(d[0].lat), parseFloat(d[0].lon)];
  } catch {}
  return null;
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

/* ─────────────────────────────────────────────
   Stripe element appearance/style options
───────────────────────────────────────────── */
const STRIPE_ELEMENT_STYLE = {
  style: {
    base: {
      fontSize: '14px',
      fontFamily: 'Inter, -apple-system, sans-serif',
      color: '#333',
      fontWeight: '500',
      '::placeholder': { color: '#AAA' },
    },
    invalid: { color: '#E53E3E' },
  },
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '12px 16px',
  border: '1.5px solid #E5E5E5',
  borderRadius: '10px',
  fontSize: '14px',
  fontWeight: 500,
  color: '#333',
  outline: 'none',
  background: 'white',
  transition: 'border-color 0.2s',
  fontFamily: 'Inter, -apple-system, sans-serif',
};

const stripeWrapperStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '12px 16px',
  border: '1.5px solid #E5E5E5',
  borderRadius: '10px',
  background: 'white',
  transition: 'border-color 0.2s',
};

/* ─────────────────────────────────────────────
   INNER FORM (has access to useStripe / useElements)
───────────────────────────────────────────── */
function CheckoutForm() {
  const stripe     = useStripe();
  const elements   = useElements();
  const router     = useRouter();
  const { user, profile } = useAuth();
  const { cart, restaurantId, restaurantName, clearCart, subtotal } = useCart();

  const [name, setName]               = useState('');
  const [phone, setPhone]             = useState('');
  const [address, setAddress]         = useState('');
  const [addressCoords, setAddressCoords] = useState<[number,number] | null>(null);
  const [observations, setObservations] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('card');
  const [coupon, setCoupon]           = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [stripeError, setStripeError]     = useState<string | null>(null);
  const [cardholderName, setCardholderName] = useState('');

  // Delivery config from Firestore
  const [deliveryConfig, setDeliveryConfig] = useState({
    baseDeliveryFee: 1.50,
    costPerKm: 0.40,
    timePerKm: 3,
    basePrepTime: 15,
    minFee: 1.50,
  });
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [calcLoading, setCalcLoading] = useState(false);

  // Load settings from Firestore
  useEffect(() => {
    getDoc(doc(db, 'settings', 'global')).then(snap => {
      if (snap.exists()) {
        const d = snap.data();
        setDeliveryConfig({
          baseDeliveryFee: d.baseDeliveryFee ?? 1.50,
          costPerKm: d.costPerKm ?? 0.40,
          timePerKm: d.timePerKm ?? 3,
          basePrepTime: d.basePrepTime ?? 15,
          minFee: d.baseDeliveryFee ?? 1.50,
        });
      }
    }).catch(() => {});
  }, []);

  // Calculate delivery fee when address changes
  useEffect(() => {
    if (!address || !restaurantId) return;
    const calc = async () => {
      setCalcLoading(true);
      try {
        // Get restaurant coords
        let restCoords: [number,number] | null = null;
        const restSnap = await getDoc(doc(db, 'business_requests', restaurantId));
        if (restSnap.exists()) {
          const d = restSnap.data();
          if (d.location?.lat && d.location?.lng) {
            restCoords = [d.location.lat, d.location.lng];
          } else if (d.address) {
            restCoords = await geocode(d.address);
          }
        }
        // Get delivery coords
        const destCoords = addressCoords || await geocode(address);
        if (restCoords && destCoords) {
          const km = haversineKm(restCoords[0], restCoords[1], destCoords[0], destCoords[1]);
          setDistanceKm(km);
        }
      } catch {}
      setCalcLoading(false);
    };
    const timeout = setTimeout(calc, 800);
    return () => clearTimeout(timeout);
  }, [address, addressCoords, restaurantId, deliveryConfig]);

  // Dynamic delivery fee
  const deliveryFee = distanceKm !== null
    ? Math.max(
        deliveryConfig.baseDeliveryFee + distanceKm * deliveryConfig.costPerKm,
        deliveryConfig.minFee
      )
    : deliveryConfig.baseDeliveryFee;

  const estimatedTime = distanceKm !== null
    ? deliveryConfig.basePrepTime + Math.round(distanceKm * deliveryConfig.timePerKm)
    : deliveryConfig.basePrepTime;
  const total = subtotal + deliveryFee;

  useEffect(() => {
    if (profile) {
      if (!name && profile.name) setName(profile.name);
      if (!phone && profile.phone) setPhone(profile.phone);
      if (!address && profile.defaultAddress) setAddress(profile.defaultAddress);
    }
  }, [profile]);

  const saveOrderToFirestore = async (paymentIntentId?: string) => {
    let loc = addressCoords;
    if (!loc && address) {
      try { loc = await geocode(address); } catch(e) { console.error('Geocode fail:', e); }
    }

    const docRef = await addDoc(collection(db, 'orders'), {
      customerId:      user!.uid,
      customerName:    name,
      customerPhone:   phone,
      observations,
      restaurantId,
      restaurantName,
      address,
      customerLocation: loc ? { lat: loc[0], lng: loc[1] } : null,
      items:          cart,
      total,
      status:          'pending',
      paymentMethod,
      paymentIntentId: paymentIntentId || null,
      createdAt:       serverTimestamp(),
    });
    return docRef.id;
  };

  const handlePlaceOrder = async () => {
    if (!user)            { router.push('/login'); return; }
    if (!address || !name || !phone) {
      alert('Por favor completa todos los datos del pedido');
      return;
    }
    setStripeError(null);
    setIsProcessing(true);

    try {
      /* ── CARD PAYMENT ── */
      if (paymentMethod === 'card') {
        if (!stripe || !elements) {
          setStripeError('Stripe no está listo. Espera un momento.');
          setIsProcessing(false);
          return;
        }

        const cardNumberEl = elements.getElement(CardNumberElement);
        if (!cardNumberEl) {
          setStripeError('Por favor ingresa los datos de tu tarjeta.');
          setIsProcessing(false);
          return;
        }

        // 1. Create PaymentIntent on server
        const res = await fetch('/api/pay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: total,
            email: user.email || '',
            orderDetails: `${restaurantName} - ${cart.length} item(s)`,
          }),
        });
        const { clientSecret, error: serverError } = await res.json();
        if (serverError) { setStripeError(serverError); setIsProcessing(false); return; }

        // 2. Confirm card payment
        const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardNumberEl,
            billing_details: { name: cardholderName || name },
          },
        });

        if (error) {
          setStripeError(error.message || 'Error al procesar el pago.');
          setIsProcessing(false);
          return;
        }

        if (paymentIntent?.status === 'succeeded') {
          const orderId = await saveOrderToFirestore(paymentIntent.id);
          clearCart();
          router.push(`/order/track/${orderId}`);
        }

      } else {
        /* ── CASH / TRANSFER ── */
        const orderId = await saveOrderToFirestore();
        clearCart();
        router.push(`/order/track/${orderId}`);
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setStripeError('Error inesperado. Intenta de nuevo.');
    } finally {
      setIsProcessing(false);
    }
  };

  const paymentOptions = [
    { id: 'cash',     label: 'Efectivo',                    icon: <Wallet size={22} /> },
    { id: 'card',     label: 'Tarjeta de Crédito\no Débito', icon: <CreditCard size={22} /> },
    { id: 'transfer', label: 'Transferencia\nBancaria',      icon: <Building size={22} /> },
  ] as const;

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F5', fontFamily: 'Inter, -apple-system, sans-serif' }}>

      {/* ══ HEADER ══ */}
      <header style={{ background: 'white', borderBottom: '1px solid #EBEBEB', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px' }}>
          <div onClick={() => router.push('/order')} style={{ cursor: 'pointer', flexShrink: 0 }}>
            <img src="/order-logo.png" alt="Delivery" style={{ height: '36px', width: 'auto', objectFit: 'contain' }} />
          </div>
          <div style={{ flex: 1, maxWidth: '480px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#AAA' }} />
            <input type="text" placeholder="Busca comida, tiendas o productos..." style={{ ...inputStyle, padding: '10px 40px', border: '1px solid #EBEBEB', background: '#F5F5F5', fontSize: '13px' }} />
            <ChevronDown size={16} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#AAA' }} />
          </div>
        </div>
      </header>

      {/* ══ STEPPER ══ */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '28px 32px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#5A9E1F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={14} color="white" strokeWidth={3} />
            </div>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#5A9E1F' }}>Datos del Pedido</span>
          </div>
          <div style={{ width: '80px', height: '2px', background: '#5A9E1F', margin: '0 8px' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#5A9E1F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={14} color="white" strokeWidth={3} />
            </div>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#5A9E1F' }}>Método de Pago</span>
          </div>
          <div style={{ width: '80px', height: '2px', background: '#FF5722', margin: '0 8px', opacity: 0.5 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#FF5722', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 900, color: 'white' }}>3</span>
            </div>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#FF5722' }}>Resumen</span>
          </div>
        </div>
      </div>

      {/* ══ MAIN GRID ══ */}
      <div style={{ maxWidth: '1200px', margin: '24px auto 0', padding: '0 32px 60px', display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>

        {/* ── LEFT ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* DATOS DEL PEDIDO */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '28px', border: '1px solid #EBEBEB' }}>
            <h3 style={{ margin: '0 0 24px', fontSize: '16px', fontWeight: 800, color: '#222' }}>Datos del Pedido</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#888', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nombre</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre completo" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#888', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Teléfono</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(593) 09..." style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#888', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dirección de Entrega</label>
                <AddressAutocomplete
                  initialValue={address}
                  onAddressSelect={(addr, coords) => {
                    setAddress(addr);
                    if (coords) setAddressCoords(coords);
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#888', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Observaciones</label>
                <div style={{ position: 'relative' }}>
                  <textarea
                    value={observations} onChange={e => setObservations(e.target.value)}
                    placeholder="Ej: Sin cebolla, llamar al llegar..."
                    style={{ ...inputStyle, height: '80px', resize: 'none', paddingRight: observations ? '44px' : '16px' }}
                  />
                  {observations && (
                    <div style={{ position: 'absolute', right: '12px', bottom: '12px', width: '22px', height: '22px', borderRadius: '50%', background: '#5A9E1F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={12} color="white" strokeWidth={3} />
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div style={{ marginTop: '20px', padding: '14px 20px', background: '#F0FDE4', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Check size={16} color="#5A9E1F" strokeWidth={3} />
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#3A7A0A' }}>Datos guardados y verificados</span>
              </div>
              <Check size={20} color="#5A9E1F" strokeWidth={3} />
            </div>
          </div>

          {/* MÉTODO DE PAGO */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '28px', border: '1px solid #EBEBEB' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 800, color: '#222' }}>Método de Pago</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              {paymentOptions.map((opt) => {
                const selected = paymentMethod === opt.id;
                return (
                  <button key={opt.id} onClick={() => setPaymentMethod(opt.id)} style={{
                    padding: '16px 12px', border: selected ? '2px solid #FF5722' : '2px solid #EBEBEB',
                    borderRadius: '12px', background: selected ? '#FF5722' : 'white',
                    color: selected ? 'white' : '#555', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
                    fontWeight: 700, fontSize: '12px', textAlign: 'center', lineHeight: 1.3,
                    transition: 'all 0.2s', whiteSpace: 'pre-line',
                  }}>
                    {React.cloneElement(opt.icon, { color: selected ? 'white' : '#888' })}
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {/* ── STRIPE CARD FORM ── */}
            <AnimatePresence>
              {paymentMethod === 'card' && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  style={{ background: '#F9F9F9', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                  {/* Card Number */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#888', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Número de Tarjeta
                    </label>
                    <div style={{ ...stripeWrapperStyle, position: 'relative' }}>
                      <CardNumberElement options={STRIPE_ELEMENT_STYLE} />
                      <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: 900, color: '#1A1F71', fontStyle: 'italic' }}>VISA</span>
                        <div style={{ position: 'relative', width: '22px', height: '15px' }}>
                          <div style={{ position: 'absolute', left: 0, width: '15px', height: '15px', borderRadius: '50%', background: '#EB001B' }}/>
                          <div style={{ position: 'absolute', right: 0, width: '15px', height: '15px', borderRadius: '50%', background: '#F79E1B', opacity: 0.85 }}/>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                    {/* Cardholder Name */}
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#888', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nombre</label>
                      <input
                        type="text" placeholder="JUAN PEREZ"
                        value={cardholderName} onChange={e => setCardholderName(e.target.value.toUpperCase())}
                        style={{ ...inputStyle, textTransform: 'uppercase', fontSize: '13px' }}
                      />
                    </div>
                    {/* Expiry */}
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#888', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Vencimiento</label>
                      <div style={stripeWrapperStyle}>
                        <CardExpiryElement options={STRIPE_ELEMENT_STYLE} />
                      </div>
                    </div>
                    {/* CVC */}
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#888', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CVC</label>
                      <div style={stripeWrapperStyle}>
                        <CardCvcElement options={STRIPE_ELEMENT_STYLE} />
                      </div>
                    </div>
                  </div>

                  {/* Stripe error */}
                  {stripeError && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: '#FEF2F2', borderRadius: '10px', border: '1px solid #FECACA' }}>
                      <AlertCircle size={16} color="#E53E3E" />
                      <span style={{ fontSize: '13px', color: '#E53E3E', fontWeight: 600 }}>{stripeError}</span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {paymentMethod === 'cash' && (
              <div style={{ background: '#F0FDF4', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Wallet size={20} color="#5A9E1F" />
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#3A7A0A' }}>Pagarás en efectivo al recibir tu pedido.</span>
              </div>
            )}

            {paymentMethod === 'transfer' && (
              <div style={{ background: '#EFF6FF', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Building size={20} color="#2563EB" />
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#1E40AF' }}>Te enviaremos los datos bancarios por WhatsApp.</span>
              </div>
            )}

            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lock size={12} color="#AAA" />
              <span style={{ fontSize: '11px', color: '#AAA', fontWeight: 600 }}>Pagos seguros con encriptación SSL</span>
            </div>
          </div>
        </div>

        {/* ── SIDEBAR RESUMEN ── */}
        <div style={{ background: '#2B2B2B', borderRadius: '16px', padding: '24px', color: 'white', position: 'sticky', top: '84px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Resumen</h2>
            <button style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}>
              <MoreHorizontal size={18} />
            </button>
          </div>

          {/* Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px', maxHeight: '280px', overflowY: 'auto' }}>
            {cart.length === 0
              ? <p style={{ fontSize: '13px', color: '#888', textAlign: 'center', padding: '20px 0' }}>No hay productos en el carrito</p>
              : cart.map((item) => (
                <div key={item.id} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0 }}>
                    <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: 700, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</p>
                    <p style={{ margin: 0, fontSize: '11px', color: '#888' }}>x{(item as any).quantity || 1}</p>
                  </div>
                  <span style={{ fontSize: '15px', fontWeight: 800, color: 'white', flexShrink: 0 }}>
                    ${(item.price * ((item as any).quantity || 1)).toFixed(2)}
                  </span>
                </div>
              ))
            }
          </div>

          {/* Totals */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: '#AAA' }}>Subtotal</span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>${subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontSize: '13px', color: '#AAA' }}>Envío</span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#FF5722' }}>${deliveryFee.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '18px', fontWeight: 800, color: 'white' }}>Total</span>
              <span style={{ fontSize: '36px', fontWeight: 900, color: '#FF5722', lineHeight: 1 }}>${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Cupón */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <input type="text" value={coupon} onChange={e => setCoupon(e.target.value)} placeholder="Cupón de descuento..."
              style={{ flex: 1, padding: '11px 14px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', fontSize: '12px', color: 'white', outline: 'none', fontFamily: 'inherit' }}
            />
            <button style={{ background: '#5A9E1F', border: 'none', borderRadius: '10px', padding: '11px 16px', color: 'white', fontWeight: 800, fontSize: '12px', cursor: 'pointer', flexShrink: 0 }}>
              Aplicar
            </button>
          </div>

          {/* Shield */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '16px' }}>
            <ShieldCheck size={16} color="#5A9E1F" />
            <span style={{ fontSize: '11px', color: '#AAA', fontWeight: 600 }}>Pagos Seguros Garantizados</span>
          </div>

          {/* Finalizar Compra */}
          <button onClick={handlePlaceOrder} disabled={isProcessing || !stripe}
            style={{
              width: '100%', background: isProcessing ? '#7EBF3F' : '#5A9E1F', color: 'white',
              border: 'none', borderRadius: '12px', padding: '16px',
              fontWeight: 800, fontSize: '15px', cursor: isProcessing ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              boxShadow: '0 4px 20px rgba(90,158,31,0.4)', transition: 'all 0.2s',
            }}
          >
            {isProcessing
              ? <><Loader2 size={18} className="spin" /> Procesando...</>
              : <><ShieldCheck size={18} /> Finalizar Compra</>
            }
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        input:focus, textarea:focus { border-color: #FF5722 !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; }
      `}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────
   OUTER PAGE: wraps with Stripe Elements provider
───────────────────────────────────────────── */
export default function CheckoutPage() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}
