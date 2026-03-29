'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  auth, db 
} from '@/lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  Mail, 
  Lock, 
  User, 
  Loader2, 
  ArrowRight, 
  ChefHat, 
  CheckCircle2, 
  ShieldCheck,
  Globe
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NewAuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'customer'|'driver'|'restaurant'>('customer');

  // Check if session exists on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log("Sesión persistente detectada:", user.email);
        await handleRoleRedirect(user.uid);
      } else {
        setInitialLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleRoleRedirect = async (uid: string) => {
    try {
      const snap = await getDoc(doc(db, 'profiles', uid));
      if (snap.exists()) {
        const userRole = snap.data().role;
        console.log("Redirigiendo por rol:", userRole);
        
        switch(userRole) {
          case 'admin':      router.push('/admin'); break;
          case 'driver':     router.push('/driver'); break;
          case 'restaurant': router.push('/portal'); break;
          default:           router.push('/order'); break;
        }
      } else {
        // Fallback or complete profile if it's missing but auth exists
        console.warn("Perfil de firestore no encontrado para UID:", uid);
        router.push('/order');
      }
    } catch (err) {
      console.error("Error en redirectByRole:", err);
      router.push('/order'); // Fallback safe
    }
  };

  const syncProfile = async (user: any, customName?: string, customRole?: string) => {
    const profileRef = doc(db, 'profiles', user.uid);
    const snap = await getDoc(profileRef);
    
    if (!snap.exists()) {
      await setDoc(profileRef, {
        uid: user.uid,
        name: customName || user.displayName || 'Usuario',
        email: user.email,
        role: customRole || 'customer',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'active'
      });
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await syncProfile(result.user);
      await handleRoleRedirect(result.user.uid);
    } catch (err: any) {
      console.error(err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Error al autenticar con Google. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (isLogin) {
        // LOGIN
        const result = await signInWithEmailAndPassword(auth, email, password);
        await handleRoleRedirect(result.user.uid);
      } else {
        // REGISTER
        if (!name) throw new Error("Por favor ingresa tu nombre.");
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await syncProfile(result.user, name, role);
        await handleRoleRedirect(result.user.uid);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Correo o contraseña incorrectos.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Este correo ya está registrado.');
      } else {
        setError(err.message || 'Error en el proceso. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div style={{ height:'100vh', background:'#09090b', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'20px' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
          <ChefHat size={48} color="#FF5722" />
        </motion.div>
        <p style={{ color:'#666', fontSize:'14px', fontWeight:600, letterSpacing:'2px' }}>CONECTANDO...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: 'white', display: 'flex', justifyContent: 'center', fontFamily: 'Inter' }}>
      
      {/* ── Left Side: Visual Experience ── */}
      <div className="login-visual-side" style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <img 
          src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop"
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }}
          alt="Delivery Background"
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, #09090b 0%, transparent 50%, #09090b 100%)' }} />
        
        <div style={{ position: 'absolute', top: '50%', left: '10%', transform: 'translateY(-50%)', maxWidth: '500px' }}>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'24px' }}>
              <div style={{ background:'transparent', height:'40px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <img src="/logo.png" alt="Delivery.ec" style={{ height: '36px', objectFit: 'contain' }} />
              </div>
            </div>
            <h1 style={{ fontSize: '48px', fontWeight: 900, lineHeight: 1.1, marginBottom: '20px' }}>
              La red de entregas <br />
              <span style={{ color: '#FF5722' }}>más rápida</span> de Ecuador.
            </h1>
            <p style={{ fontSize: '18px', color: '#888', lineHeight: 1.6, marginBottom: '32px' }}>
              Únete a miles de personas que ya disfrutan de rapidez, seguridad y los mejores locales en un solo lugar.
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <CheckCircle2 size={24} color="#FF5722" style={{ marginBottom: '12px' }} />
                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Rápido & Seguro</h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>Entregas en menos de 30 min.</p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <ShieldCheck size={24} color="#22C55E" style={{ marginBottom: '12px' }} />
                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Confianza Total</h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>Soporte local garantizado.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .login-visual-side { display: none !important; }
        }
      `}</style>

      {/* ── Right Side: Auth Form ── */}
      <div style={{ width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: '#09090b', padding: '40px', borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
        
        <div style={{ maxWidth: '360px', margin: '0 auto', width: '100%' }}>
          
          {/* Logo visible only on mobile (since desktop has it on the left) */}
          <div className="login-mobile-logo" style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'40px', justifyContent: 'center' }}>
            <img src="/logo.png" alt="Delivery.ec" style={{ height: '40px', objectFit: 'contain' }} />
          </div>

          <style>{`
            @media (min-width: 1025px) {
              .login-mobile-logo { display: none !important; }
            }
          `}</style>

          <div style={{ width: '100%', background: 'transparent' }}>
            <div style={{ marginBottom: '40px', textAlign: 'center' }}>
              <h2 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '12px' }}>
                {isLogin ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
              </h2>
            <p style={{ color: '#666', fontSize: '15px' }}>
              {isLogin ? 'Ingresa tus credenciales para continuar.' : 'Únete gratis a la comunidad de Delivery.ec'}
            </p>
          </div>

          {/* Social Auth */}
          <button
            onClick={handleGoogleAuth}
            disabled={loading}
            style={{ 
              width: '100%', 
              padding: '16px', 
              borderRadius: '16px', 
              background: 'white', 
              color: 'black', 
              border: 'none', 
              fontWeight: 700, 
              fontSize: '15px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '12px', 
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              transition: 'all 0.2s'
            }}
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="20" height="20" alt="G" />
            Continuar con Google
          </button>

          <div style={{ margin: '32px 0', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
            <span style={{ fontSize: '12px', color: '#444', fontWeight: 700, textTransform: 'uppercase' }}>O con email</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
          </div>

          <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div 
                  initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
                >
                  <label style={{ fontSize:'12px', fontWeight:800, color:'#444', textTransform:'uppercase' }}>Nombre Completo</label>
                  <div style={{ position:'relative' }}>
                    <User size={18} color="#444" style={{ position:'absolute', left:'16px', top:'50%', transform:'translateY(-50%)' }} />
                    <input 
                      type="text" required value={name} onChange={(e)=>setName(e.target.value)}
                      placeholder="Ej: Juan Pérez"
                      style={{ width:'100%', padding:'16px 16px 16px 48px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'14px', color:'white', outline:'none' }} 
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize:'12px', fontWeight:800, color:'#444', textTransform:'uppercase' }}>Email</label>
              <div style={{ position:'relative' }}>
                <Mail size={18} color="#444" style={{ position:'absolute', left:'16px', top:'50%', transform:'translateY(-50%)' }} />
                <input 
                  type="email" required value={email} onChange={(e)=>setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  style={{ width:'100%', padding:'16px 16px 16px 48px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'14px', color:'white', outline:'none' }} 
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label style={{ fontSize:'12px', fontWeight:800, color:'#444', textTransform:'uppercase' }}>Contraseña</label>
                {isLogin && <button type="button" style={{ fontSize:'12px', fontWeight:700, color:'#FF5722', background:'none', border:'none', cursor:'pointer' }}>Recuperar</button>}
              </div>
              <div style={{ position:'relative' }}>
                <Lock size={18} color="#444" style={{ position:'absolute', left:'16px', top:'50%', transform:'translateY(-50%)' }} />
                <input 
                  type="password" required value={password} onChange={(e)=>setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ width:'100%', padding:'16px 16px 16px 48px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'14px', color:'white', outline:'none' }} 
                />
              </div>
            </div>

            <AnimatePresence>
              {!isLogin && (
                <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ marginTop: '4px' }}>
                  <label style={{ fontSize:'12px', fontWeight:800, color:'#444', textTransform:'uppercase', display:'block', marginBottom:'8px' }}>Tipo de cuenta</label>
                  <div style={{ display:'flex', gap:'8px' }}>
                    {['customer', 'driver', 'restaurant'].map((r) => (
                      <button 
                        key={r} type="button" onClick={() => setRole(r as any)}
                        style={{ flex:1, padding:'10px', borderRadius:'10px', fontSize:'11px', fontWeight:800, textTransform:'uppercase', border: role === r ? '1px solid #FF5722' : '1px solid rgba(255,255,255,0.08)', background: role === r ? 'rgba(255,87,34,0.1)' : 'transparent', color: role === r ? '#FF5722' : '#666', cursor:'pointer' }}
                      >
                        {r === 'customer' ? 'Cliente' : r === 'driver' ? 'Driver' : 'Local'}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {error && <p style={{ color:'#f87171', fontSize:'13px', fontWeight:600, margin:0 }}>{error}</p>}

            <button
              type="submit"
              disabled={loading}
              style={{ 
                width: '100%', 
                padding: '18px', 
                borderRadius: '16px', 
                background: '#FF5722', 
                color: 'white', 
                border: 'none', 
                fontWeight: 800, 
                fontSize: '16px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '12px', 
                marginTop: '12px',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 8px 30px rgba(255,87,34,0.3)'
              }}
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight size={20} />}
              {isLogin ? 'ENTRAR AHORA' : 'CREAR MI CUENTA'}
            </button>

          </form>

          <div style={{ marginTop: '32px', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', color: '#666', fontWeight: 600 }}>
              {isLogin ? '¿No tienes una cuenta todavía?' : '¿Ya eres parte de Delivery.ec?'}
              <button 
                onClick={() => setIsLogin(!isLogin)}
                style={{ marginLeft: '8px', color: '#FF5722', fontWeight: 800, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {isLogin ? 'Regístrate gratis' : 'Inicia sesión'}
              </button>
            </p>
          </div>

        </div>
        </div>

        <div style={{ marginTop: 'auto', textAlign: 'center', padding: '20px 0' }}>
          <p style={{ fontSize: '11px', color: '#333', fontWeight: 700, letterSpacing: '1px' }}>
            &copy; 2026 DELIVERY.EC - TODO EL ECUADOR EN TU MANO
          </p>
        </div>

      </div>

    </div>
  );
}
