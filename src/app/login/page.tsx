'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { auth, db } from '@/lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Mail, Lock, User, Loader2, Phone, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

declare global {
  interface Window { recaptchaVerifier: any; }
}

export default function AuthPage() {
  const [isLogin, setIsLogin]           = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [otpSent, setOtpSent]           = useState(false);
  const router = useRouter();

  const [email, setEmail]                       = useState('');
  const [password, setPassword]                 = useState('');
  const [phoneNumber, setPhoneNumber]           = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [name, setName]                         = useState('');
  const [role, setRole]                         = useState<'customer'|'driver'|'restaurant'>('customer');
  const [confirmResult, setConfirmResult]       = useState<ConfirmationResult|null>(null);

  const initRecaptcha = () => {
    if (!window.recaptchaVerifier)
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
  };

  // Redirect based on role stored in Firestore
  const redirectByRole = async (uid: string, fallbackRole?: string) => {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      const userRole = snap.exists() ? snap.data().role : (fallbackRole || 'customer');
      if (userRole === 'driver')     router.push('/driver');
      else if (userRole === 'restaurant') router.push('/portal');
      else router.push('/app');
    } catch {
      router.push('/app');
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      if (isLogin) {
        const { user } = await signInWithEmailAndPassword(auth, email, password);
        await redirectByRole(user.uid);
      } else {
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', user.uid), { uid: user.uid, name, email, role, createdAt: new Date().toISOString() });
        await redirectByRole(user.uid, role);
      }
    } catch { setError('Credenciales incorrectas.'); }
    finally { setLoading(false); }
  };

  const sendOTP = async () => {
    setLoading(true); initRecaptcha();
    try {
      const ph = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber.replace(/\D/g,'')}`;
      setConfirmResult(await signInWithPhoneNumber(auth, ph, window.recaptchaVerifier));
      setOtpSent(true);
    } catch { setError('Error al enviar código.'); }
    finally { setLoading(false); }
  };

  const verifyOTP = async () => {
    if (!confirmResult) return;
    setLoading(true);
    try {
      const { user } = await confirmResult.confirm(verificationCode);
      if (!(await getDoc(doc(db,'users',user.uid))).exists())
        await setDoc(doc(db,'users',user.uid), { uid: user.uid, name: name||'Usuario', role, createdAt: new Date().toISOString() });
      await redirectByRole(user.uid, role);
    } catch { setError('Código incorrecto.'); }
    finally { setLoading(false); }
  };

  const googleLogin = async () => {
    setLoading(true);
    try {
      const { user } = await signInWithPopup(auth, new GoogleAuthProvider());
      if (!(await getDoc(doc(db,'users',user.uid))).exists())
        await setDoc(doc(db,'users',user.uid), { uid: user.uid, name: user.displayName, email: user.email, role: 'customer', createdAt: new Date().toISOString() });
      await redirectByRole(user.uid);
    } catch { setError('Error con Google.'); }
    finally { setLoading(false); }
  };

  const InputRow = ({ icon, ...props }: any) => (
    <div style={{ display:'flex', alignItems:'center', height:'56px', background:'#1e1e22', borderRadius:'14px', border:'1px solid rgba(255,255,255,0.08)', gap:'0', overflow:'hidden' }}>
      <span style={{ width:'52px', display:'flex', alignItems:'center', justifyContent:'center', color:'#555', flexShrink:0 }}>{icon}</span>
      <input {...props} style={{ flex:1, background:'transparent', border:'none', outline:'none', color:'white', fontSize:'14px', fontWeight:500, paddingRight:'16px' }} />
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', fontFamily:'Inter, sans-serif', padding:'16px', overflow:'hidden', background:'#000' }}>
      
      {/* ── Background: orange highway light trails ── */}
      <img 
        src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=2400&auto=format&fit=crop"
        style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', opacity:0.45, filter:'brightness(0.5) saturate(1.4)' }}
        alt=""
      />
      {/* Dark vignette overlay */}
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.85) 100%)' }} />
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.7))' }} />

      <div id="recaptcha-container" />

      {/* ── Auth Card ── */}
      <motion.div
        initial={{ opacity:0, y:24 }}
        animate={{ opacity:1, y:0 }}
        transition={{ duration:0.5, ease:[0.16,1,0.3,1] }}
        style={{
          position:'relative', zIndex:10,
          width:'100%', maxWidth:'420px',
          background:'rgba(18,18,22,0.92)',
          backdropFilter:'blur(28px)',
          border:'1px solid rgba(255,255,255,0.1)',
          borderRadius:'32px',
          padding:'40px 36px',
          boxShadow:'0 32px 80px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.05)',
          display:'flex', flexDirection:'column', gap:'0'
        }}
      >
        {/* Top orange accent line */}
        <div style={{ position:'absolute', top:0, left:'20%', right:'20%', height:'2px', background:'linear-gradient(to right, transparent, #FF5722, transparent)', borderRadius:'99px' }} />

        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'12px', marginBottom:'32px' }}>
          <div style={{ width:'40px', height:'40px', background:'linear-gradient(135deg, #FF6B35, #FF5722)', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:900, fontSize:'20px', fontStyle:'italic', boxShadow:'0 4px 20px rgba(255,87,34,0.4)' }}>D</div>
          <span style={{ fontSize:'22px', fontWeight:900, color:'white', letterSpacing:'-0.5px' }}>Deliveryy</span>
        </div>

        {/* Google Button */}
        <button
          onClick={googleLogin}
          style={{ width:'100%', height:'52px', background:'white', border:'none', borderRadius:'14px', display:'flex', alignItems:'center', justifyContent:'center', gap:'12px', fontSize:'15px', fontWeight:600, color:'#111', cursor:'pointer', marginBottom:'28px', boxShadow:'0 2px 12px rgba(0,0,0,0.3)' }}
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" style={{ width:'20px', height:'20px' }} alt="G" />
          Continuar con Google
        </button>

        {/* Divider */}
        <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'28px' }}>
          <div style={{ width:'100%', height:'1px', background:'rgba(255,255,255,0.08)' }} />
          <div style={{ position:'absolute', width:'10px', height:'10px', background:'#FF5722', borderRadius:'50%', boxShadow:'0 0 12px rgba(255,87,34,0.8)' }} />
        </div>

        {/* Form */}
        <form onSubmit={(e) => { e.preventDefault(); otpSent ? verifyOTP() : handleAuth(e); }} style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
          
          {!isLogin && (
            <InputRow
              icon={<User size={18}/>}
              type="text"
              placeholder="Nombre completo"
              value={name}
              onChange={(e:any) => setName(e.target.value)}
              required
            />
          )}

          <InputRow
            icon={<Mail size={18}/>}
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e:any) => setEmail(e.target.value)}
            required
          />

          <div style={{ display:'flex', alignItems:'center', height:'56px', background:'#1e1e22', borderRadius:'14px', border:'1px solid rgba(255,255,255,0.08)', overflow:'hidden' }}>
            <span style={{ width:'52px', display:'flex', alignItems:'center', justifyContent:'center', color:'#555', flexShrink:0 }}><Lock size={18}/></span>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ flex:1, background:'transparent', border:'none', outline:'none', color:'white', fontSize:'14px', fontWeight:500 }}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ paddingRight:'16px', color:'#555', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center' }}>
              {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
            </button>
          </div>

          <InputRow
            icon={<Phone size={18}/>}
            type="text"
            placeholder="Teléfono (opcional)"
            value={phoneNumber}
            onChange={(e:any) => setPhoneNumber(e.target.value)}
          />

          {otpSent && (
            <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} style={{ display:'flex', alignItems:'center', height:'56px', background:'rgba(255,87,34,0.1)', borderRadius:'14px', border:'1px solid rgba(255,87,34,0.3)', overflow:'hidden' }}>
              <span style={{ width:'52px', display:'flex', alignItems:'center', justifyContent:'center', color:'#FF5722' }}><CheckCircle2 size={18}/></span>
              <input
                type="text"
                placeholder="Código SMS"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                style={{ flex:1, background:'transparent', border:'none', outline:'none', color:'#FF5722', fontSize:'18px', fontWeight:700, letterSpacing:'0.5em', textAlign:'center' }}
              />
            </motion.div>
          )}

          {error && <p style={{ color:'#f87171', fontSize:'12px', textAlign:'center', margin:'4px 0' }}>{error}</p>}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{ width:'100%', height:'56px', background:'linear-gradient(135deg, #FF6B35, #FF5722)', border:'none', borderRadius:'14px', color:'white', fontSize:'16px', fontWeight:700, cursor:'pointer', marginTop:'8px', boxShadow:'0 4px 24px rgba(255,87,34,0.4)', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', transition:'opacity 0.2s', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? <Loader2 className="animate-spin" size={22}/> : (isLogin ? 'Iniciar Sesión' : 'Registrarse')}
          </button>
        </form>

        {/* Toggle Login/Register */}
        <div style={{ marginTop:'24px', textAlign:'center' }}>
          <button
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            style={{ background:'none', border:'none', cursor:'pointer', fontSize:'13px', color:'rgba(255,255,255,0.45)', fontWeight:500 }}
          >
            {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
            <span style={{ color:'#FF5722', fontWeight:700 }}>{isLogin ? 'Regístrate' : 'Entra aquí'}</span>
          </button>
        </div>

      </motion.div>
    </div>
  );
}
