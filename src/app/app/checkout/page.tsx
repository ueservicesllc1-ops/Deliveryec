'use client';

import React, { useState, useEffect } from 'react';
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
  ShieldCheck, Loader2, CreditCard, Wallet, Building,
  ChevronLeft, MapPin, Clock, ShoppingBag, Check
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { useCart } from '@/lib/CartContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import AddressAutocomplete from '@/components/AddressAutocomplete';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const STRIPE_ELEMENT_STYLE = {
  style: {
    base: {
      fontSize: '16px',
      color: '#111',
      '::placeholder': { color: '#9CA3AF' },
    },
  },
};

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { user, profile } = useAuth();
  const { cart, restaurantId, restaurantName, restaurantOwnerId, clearCart, subtotal } = useCart();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [addressCoords, setAddressCoords] = useState<[number, number] | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash' | 'transfer'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);

  const deliveryFee = 2.50; // Simplified for this mobile demo
  const total = subtotal + deliveryFee;

  useEffect(() => {
    if (profile) {
      if (!name && profile.name) setName(profile.name);
      if (!phone && profile.phone) setPhone(profile.phone);
      if (!address && profile.defaultAddress) setAddress(profile.defaultAddress);
    }
  }, [profile, name, phone, address]);

  const handlePlaceOrder = async () => {
    if (!user) { router.push('/login'); return; }
    if (!address || !name || !phone) {
      alert('Por favor completa tus datos');
      return;
    }
    setIsProcessing(true);

    try {
      if (paymentMethod === 'card') {
        if (!stripe || !elements) return;
        const cardNumberEl = elements.getElement(CardNumberElement);
        if (!cardNumberEl) return;

        const res = await fetch('/api/pay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: total, email: user.email }),
        });
        const { clientSecret } = await res.json();

        const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: { card: cardNumberEl, billing_details: { name } },
        });

        if (error) {
          setStripeError(error.message || 'Error');
          setIsProcessing(false);
          return;
        }

        if (paymentIntent?.status === 'succeeded') {
          await addDoc(collection(db, 'orders'), {
            customerId: user.uid,
            customerName: name,
            customerPhone: phone,
            restaurantId,
            restaurantOwnerId,
            restaurantName,
            address,
            ...(addressCoords ? { customerLocation: { lat: addressCoords[0], lng: addressCoords[1] } } : {}),
            items: cart,
            subtotal,
            deliveryFee,
            total,
            status: 'created',
            paymentMethod,
            paymentIntentId: paymentIntent.id,
            createdAt: serverTimestamp(),
          });
          clearCart();
          router.push(`/app/orders`);
        }
      } else {
        await addDoc(collection(db, 'orders'), {
          customerId: user.uid,
          customerName: name,
          customerPhone: phone,
          restaurantId,
          restaurantOwnerId,
          restaurantName,
          address,
          ...(addressCoords ? { customerLocation: { lat: addressCoords[0], lng: addressCoords[1] } } : {}),
          items: cart,
          subtotal,
          deliveryFee,
          total,
          status: 'created',
          paymentMethod,
          createdAt: serverTimestamp(),
        });
        clearCart();
        router.push(`/app/orders`);
      }
    } catch (err) {
      setStripeError('Error al procesar');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ minHeight: '100dvh', background: '#FAFAFA', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* ── HEADER ── */}
      <div style={{ background: 'white', padding: '12px 16px', borderBottom: '1px solid #F0F0F0', display: 'flex', alignItems: 'center', gap: '16px', position: 'sticky', top: 0, zIndex: 100 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#111' }}>
          <ChevronLeft size={24} />
        </button>
        <h1 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#111' }}>Finalizar Pedido</h1>
      </div>

      <div style={{ padding: '12px 16px', maxWidth: '500px', margin: '0 auto' }}>
        
        {/* ── RESUMEN BREVE ── */}
        <div style={{ background: '#111', borderRadius: '12px', padding: '14px 18px', color: 'white', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: '12px', color: '#9CA3AF' }}>Pedido en</p>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>{restaurantName || 'Restaurante'}</h2>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: '0 0 2px', fontSize: '12px', color: '#9CA3AF' }}>Total</p>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: '#16A34A' }}>${total.toFixed(2)}</h2>
          </div>
        </div>

        {/* ── LISTA DE PRODUCTOS ── (Compacta) */}
        <section style={{ marginBottom: '16px' }}>
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #F3F4F6', overflow: 'hidden' }}>
            {cart.map((item, i) => (
              <div key={i} style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: i < cart.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#16A34A' }}>{item.qty}x</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>{item.name}</span>
                </div>
                <span style={{ fontSize: '13px', fontWeight: 700 }}>${(item.price * item.qty).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── DATOS DE ENTREGA ── */}
        <section style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Solo mostramos nombre/teléfono si faltan en el perfil o están vacíos */}
            {(!profile?.name || !profile?.phone || !name || !phone) && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <input 
                  value={name} onChange={e => setName(e.target.value)} 
                  placeholder="Tu nombre"
                  style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid #E5E7EB', fontSize: '13px', outline: 'none' }}
                />
                <input 
                  value={phone} onChange={e => setPhone(e.target.value)} 
                  placeholder="Tu teléfono"
                  style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid #E5E7EB', fontSize: '13px', outline: 'none' }}
                />
              </div>
            )}
            <AddressAutocomplete 
              initialValue={profile?.defaultAddress || address}
              onAddressSelect={(addr, coords) => {
                setAddress(addr);
                if (coords) setAddressCoords(coords as [number, number]);
              }}
              placeholder="Dirección de entrega..."
            />
          </div>
        </section>

        {/* ── MÉTODO DE PAGO ── */}
        <section style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 800, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CreditCard size={16} color="#16A34A" /> Pago
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            {[
              { id: 'card', icon: <CreditCard size={18} />, label: 'Tarjeta' },
              { id: 'cash', icon: <Wallet size={18} />, label: 'Efectivo' },
              { id: 'transfer', icon: <Building size={18} />, label: 'Transfer' },
            ].map(opt => (
              <button 
                key={opt.id}
                onClick={() => setPaymentMethod(opt.id as any)}
                style={{ 
                  padding: '8px', 
                  borderRadius: '10px', 
                  border: `1.5px solid ${paymentMethod === opt.id ? '#16A34A' : '#F3F4F6'}`,
                  background: paymentMethod === opt.id ? '#F0FDF4' : 'white',
                  color: paymentMethod === opt.id ? '#16A34A' : '#6B7280',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  fontWeight: 700, fontSize: '12px', cursor: 'pointer'
                }}
              >
                {opt.icon}
                <span>{opt.label}</span>
              </button>
            ))}
          </div>

          {paymentMethod === 'card' && (
            <div style={{ marginTop: '16px', background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '4px 0' }}><CardNumberElement options={STRIPE_ELEMENT_STYLE} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ padding: '4px 0' }}><CardExpiryElement options={STRIPE_ELEMENT_STYLE} /></div>
                <div style={{ padding: '4px 0' }}><CardCvcElement options={STRIPE_ELEMENT_STYLE} /></div>
              </div>
              {stripeError && <p style={{ margin: 0, color: '#EF4444', fontSize: '12px', fontWeight: 600 }}>{stripeError}</p>}
            </div>
          )}
        </section>

        {/* ── RESUMEN DE PAGO ── */}
        <section style={{ marginBottom: '24px', background: 'white', padding: '16px', borderRadius: '16px', border: '1px solid #F3F4F6' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '12px', color: '#111' }}>Resumen de Pago</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6B7280', fontSize: '14px' }}>
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6B7280', fontSize: '14px' }}>
              <span>Costo de envío</span>
              <span style={{ color: '#16A34A', fontWeight: 600 }}>+ ${deliveryFee.toFixed(2)}</span>
            </div>
            <div style={{ height: '1px', background: '#F3F4F6', margin: '4px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#111', fontSize: '16px', fontWeight: 800 }}>
              <span>Total a pagar</span>
              <span style={{ color: '#16A34A' }}>${total.toFixed(2)}</span>
            </div>
          </div>
        </section>

        {/* ── BOTÓN FINAL ── */}
        <button 
          onClick={handlePlaceOrder}
          disabled={isProcessing}
          style={{ 
            width: '100%', padding: '18px', background: '#16A34A', color: 'white',
            border: 'none', borderRadius: '16px', fontWeight: 800, fontSize: '16px',
            boxShadow: '0 10px 25px rgba(22,163,74,0.3)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
          }}
        >
          {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <ShieldCheck size={20} />}
          {isProcessing ? 'PROCESANDO...' : 'CONFIRMAR PEDIDO'}
        </button>

      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}
