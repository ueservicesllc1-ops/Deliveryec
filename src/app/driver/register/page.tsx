'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { Camera, ChevronRight, ChevronLeft, Loader2, CheckCircle2, Bike, Car, Flame } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const steps = [
  { id: 1, title: "Tus Credenciales", desc: "Cómo entrarás a tu app" },
  { id: 2, title: "Quién eres", desc: "Datos personales para seguridad" },
  { id: 3, title: "Tu Nave", desc: "En qué harás las entregas" },
];

export default function DriverRegistration() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    lastName: '',
    phone: '',
    address: '',
    idNumber: '',
    idPhotoUrl: '',
    // Vehicle
    vehicleType: 'motocicleta', // auto, motocicleta, electrica, bicicleta
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    vehicleColor: '',
    vehiclePhotoUrl: '',
    licensePlateUrl: '',
  });

  const nextStep = () => {
    // Basic validations
    if (step === 1 && !user && (!formData.email || formData.password.length < 6)) return alert('Llena tu email y una contraseña de min 6 caracteres.');
    if (step === 2 && (!formData.name || !formData.lastName || !formData.phone || !formData.idNumber || !formData.idPhotoUrl)) return alert('Llena todos los campos e incluye foto de tu ID.');
    
    setDirection(1);
    setStep(s => s + 1);
  };


  const prevStep = () => {
    setDirection(-1);
    setStep(s => s - 1);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingField(fieldName);
    const data = new FormData();
    data.append('file', file);
    data.append('folder', 'driver_documents');
    
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: data });
      const { url } = await res.json();
      if (url) {
        setFormData(prev => ({ ...prev, [fieldName]: url }));
      }
    } catch (err) {
      console.error('Error al subir:', err);
      alert('Error al subir imagen. Intenta otra vez.');
    } finally {
      setUploadingField(null);
    }
  };

  const submitApplication = async () => {
    // Validations for step 2 (vehicle)
    if (!formData.vehiclePhotoUrl) return alert('Debes subir una foto de tu vehículo/bici.');
    if (['auto', 'motocicleta'].includes(formData.vehicleType)) {
      if (!formData.licensePlateUrl || !formData.vehicleMake || !formData.vehicleYear) {
        return alert('Para auto o moto necesitas Llenar Marca, Año, y adjuntar foto de la Matrícula.');
      }
    }

    if (!user) {
      if (!formData.email || !formData.password) return alert('No hay sesión. Inicia sesión primero o llena el paso 1.');
    }

    setIsSubmitting(true);
    try {
      let finalUser = user;
      
      if (!finalUser) {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        finalUser = userCredential.user as any;
      }

      await updateProfile(finalUser as any, { displayName: `${formData.name} ${formData.lastName}` });

      // Create Profile but lock it as 'pending_driver'
      const dataToSave = {
        uid: finalUser?.uid,
        email: finalUser?.email || formData.email,
        name: formData.name,
        lastName: formData.lastName,
        displayName: `${formData.name} ${formData.lastName}`,
        phone: formData.phone,
        address: formData.address,
        idNumber: formData.idNumber,
        idPhotoUrl: formData.idPhotoUrl,
        vehicle: {
          type: formData.vehicleType,
          make: formData.vehicleMake,
          model: formData.vehicleModel,
          year: formData.vehicleYear,
          color: formData.vehicleColor,
          photoUrl: formData.vehiclePhotoUrl,
          licensePlateUrl: formData.licensePlateUrl,
        },
        role: 'pending_driver',
        status: 'pending_approval',
        createdAt: serverTimestamp()
      };

      await setDoc(doc(db, 'profiles', finalUser!.uid), dataToSave);
      
      // Also copy to an "applications" collection for easier admin viewing
      await setDoc(doc(db, 'driver_applications', finalUser!.uid), dataToSave);

      setIsDone(true);
    } catch (err: any) {
      console.error(err);
      alert('Error al enviar solicitud: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir < 0 ? 300 : -300, opacity: 0 }),
  };

  if (isDone) {
    return (
      <div style={{ minHeight: '100vh', background: '#09090b', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'Inter' }}>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: '#1a1a1e', padding: '40px', borderRadius: '32px', textAlign: 'center', maxWidth: '400px', border: '1px solid rgba(255,87,34,0.3)' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <CheckCircle2 color="#22c55e" size={40} />
          </div>
          <h2 style={{ margin: '0 0 16px', fontSize: '24px', fontWeight: 900 }}>¡Solicitud Recibida!</h2>
          <p style={{ color: '#888', fontSize: '15px', lineHeight: 1.6, marginBottom: '32px' }}>
            Gracias por querer unirte a Delivery.ec. Tu aprobación está en proceso y nuestros administradores validarán tus datos. <strong style={{color:'white'}}>Podría tardar hasta 24 horas.</strong>
          </p>
          <button onClick={() => router.push('/login')} style={{ width: '100%', padding: '16px', borderRadius: '16px', background: '#FF5722', color: 'white', border: 'none', fontWeight: 800, fontSize: '16px', cursor: 'pointer' }}>
            Ir a inicio de sesión
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: 'white', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif' }}>
      
      {/* ── HEADER ── */}
      <div style={{ padding: '24px 24px 0', maxWidth: '500px', margin: '0 auto', width: '100%' }}>
        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 900, display: 'flex', alignItems:'center', gap:'12px' }}>
          Be a Driver <Flame color="#FF5722" />
        </h1>
        <p style={{ margin: '8px 0 0', color: '#666', fontSize: '15px' }}>Comienza a ganar dinero entregando</p>

        {/* Progress Bar */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '24px' }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ flex: 1, height: '4px', borderRadius: '4px', background: step >= i ? '#FF5722' : 'rgba(255,255,255,0.1)', transition: 'all 0.3s' }} />
          ))}
        </div>
        <p style={{ marginTop: '12px', fontSize: '13px', color: '#FF5722', fontWeight: 700 }}>
          Paso {step} de 3: {steps.find(s => s.id === step)?.title}
        </p>
      </div>

      {/* ── FORM CONTAINER ── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', maxWidth: '500px', margin: '0 auto', width: '100%' }}>
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{ position: 'absolute', width: '100%', padding: '24px', height: '100%', overflowY: 'auto', scrollbarWidth: 'none' }}
          >
            
            {/* STEP 1: CREDENTIALS */}
            {step === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {user ? (
                  <div style={{ background: '#1a1a1e', padding: '24px', borderRadius: '16px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#FF5722', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyItems: 'center', fontSize: '24px', fontWeight: 900 }}>
                      {user.email?.charAt(0).toUpperCase()}
                    </div>
                    <p style={{ margin: '0 0 8px', color: 'white', fontWeight: 800 }}>Sesión Encontrada</p>
                    <p style={{ color: '#aaa', fontSize: '14px', margin: 0 }}>Vinculando solicitud con la cuenta:<br/> <strong style={{color:'white'}}>{user.email}</strong></p>
                  </div>
                ) : (
                  <>
                    <Input label="Correo Electrónico" type="email" placeholder="tu@email.com" val={formData.email} onChange={v => setFormData({ ...formData, email: v })} />
                    <Input label="Contraseña" type="password" placeholder="Mínimo 6 caracteres" val={formData.password} onChange={v => setFormData({ ...formData, password: v })} />
                    
                    <div style={{ marginTop: '20px', background: '#1a1a1e', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <h4 style={{ margin: '0 0 8px', color: '#fff' }}>¿Por qué registrarse aquí?</h4>
                      <ul style={{ margin: 0, paddingLeft: '20px', color: '#888', fontSize: '13px', lineHeight: 1.6 }}>
                        <li>Esto creará tu cuenta maestra como Driver oficial.</li>
                      </ul>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* STEP 2: PERSONAL */}
            {step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}><Input label="Nombres" placeholder="Ej: Juan" val={formData.name} onChange={v => setFormData({ ...formData, name: v })} /></div>
                  <div style={{ flex: 1 }}><Input label="Apellidos" placeholder="Ej: Pérez" val={formData.lastName} onChange={v => setFormData({ ...formData, lastName: v })} /></div>
                </div>
                <Input label="Número de WhatsApp o Celular" type="tel" placeholder="099..." val={formData.phone} onChange={v => setFormData({ ...formData, phone: v })} />
                <Input label="Dirección de Domicilio" placeholder="Calle principal y secundaria" val={formData.address} onChange={v => setFormData({ ...formData, address: v })} />
                <Input label="Número de Cédula o Identidad" placeholder="1234567890" val={formData.idNumber} onChange={v => setFormData({ ...formData, idNumber: v })} />
                
                <UploadBox 
                  label="Foto Frontal de tu Cédula" 
                  url={formData.idPhotoUrl} 
                  loading={uploadingField === 'idPhotoUrl'} 
                  onChange={e => handleFileChange(e, 'idPhotoUrl')} 
                />
              </div>
            )}

            {/* STEP 3: VEHICLE */}
            {step === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#666', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Tipo de Vehículo</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {['motocicleta', 'auto', 'electrica', 'bicicleta'].map(t => (
                      <button 
                        key={t} onClick={() => setFormData({ ...formData, vehicleType: t })}
                        style={{ padding: '16px', background: formData.vehicleType === t ? 'rgba(255,87,34,0.1)' : 'transparent', border: formData.vehicleType === t ? '1px solid #FF5722' : '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: formData.vehicleType === t ? '#FF5722' : 'white', cursor: 'pointer', fontWeight: 800, textTransform: 'capitalize', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}
                      >
                        {t === 'motocicleta' && <Bike/>}
                        {t === 'auto' && <Car/>}
                        {t === 'electrica' && <Bike/>}
                        {t === 'bicicleta' && <Bike/>}
                        {t === 'electrica' ? 'Moto Eléctrica' : t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Only ask for brands if Car or Moto */}
                {['auto', 'motocicleta'].includes(formData.vehicleType) && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ display: 'flex', flexDirection: 'column', gap: '20px', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ flex: 1 }}><Input label="Marca" placeholder="Yamaha, Chevrolet..." val={formData.vehicleMake} onChange={v => setFormData({ ...formData, vehicleMake: v })} /></div>
                      <div style={{ width: '80px' }}><Input label="Año" placeholder="2022" val={formData.vehicleYear} onChange={v => setFormData({ ...formData, vehicleYear: v })} /></div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ flex: 1 }}><Input label="Modelo" placeholder="MT-09, Spark..." val={formData.vehicleModel} onChange={v => setFormData({ ...formData, vehicleModel: v })} /></div>
                      <div style={{ flex: 1 }}><Input label="Color" placeholder="Rojo" val={formData.vehicleColor} onChange={v => setFormData({ ...formData, vehicleColor: v })} /></div>
                    </div>
                    <UploadBox 
                      label="Foto de la Matrícula" 
                      url={formData.licensePlateUrl} 
                      loading={uploadingField === 'licensePlateUrl'} 
                      onChange={e => handleFileChange(e, 'licensePlateUrl')} 
                    />
                  </motion.div>
                )}

                <UploadBox 
                  label={`Foto de tu ${formData.vehicleType}`} 
                  url={formData.vehiclePhotoUrl} 
                  loading={uploadingField === 'vehiclePhotoUrl'} 
                  onChange={e => handleFileChange(e, 'vehiclePhotoUrl')} 
                />
              </div>
            )}
            
            {/* SPACING FOR BUTTONS */}
            <div style={{ height: '100px' }} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── FOOTER ACTIONS ── */}
      <div style={{ padding: '20px 24px', background: '#09090b', borderTop: '1px solid rgba(255,255,255,0.05)', maxWidth: '500px', margin: '0 auto', width: '100%', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
          {step > 1 ? (
            <button onClick={prevStep} style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#1a1a1e', border: '1px solid rgba(255,255,255,0.1)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <ChevronLeft />
            </button>
          ) : <div style={{ width: '56px' }} />}
          
          {step < 3 ? (
            <button onClick={nextStep} style={{ flex: 1, height: '56px', borderRadius: '16px', background: '#FF5722', color: 'white', border: 'none', fontWeight: 800, fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
              Siguiente <ChevronRight />
            </button>
          ) : (
            <button onClick={submitApplication} disabled={isSubmitting} style={{ flex: 1, height: '56px', borderRadius: '16px', background: '#22c55e', color: 'white', border: 'none', fontWeight: 800, fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : <><CheckCircle2 /> Finalizar Registro</>}
            </button>
          )}
        </div>
      </div>

    </div>
  );
}

/* ── REUSABLE UI COMPONENTS ── */
function Input({ label, type = 'text', placeholder, val, onChange }: { label:string, type?:string, placeholder?:string, val:string, onChange: (val:string)=>void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <label style={{ fontSize: '12px', fontWeight: 800, color: '#666', textTransform: 'uppercase' }}>{label}</label>
      <input 
        type={type} placeholder={placeholder} value={val} onChange={e => onChange(e.target.value)}
        style={{ width: '100%', padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', color: 'white', outline: 'none', fontSize: '15px' }} 
        onFocus={(e) => e.target.style.borderColor = '#FF5722'}
        onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
      />
    </div>
  );
}

function UploadBox({ label, url, loading, onChange }: { label:string, url:string, loading:boolean, onChange:(e: React.ChangeEvent<HTMLInputElement>)=>void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <label style={{ fontSize: '12px', fontWeight: 800, color: '#666', textTransform: 'uppercase' }}>{label}</label>
      <div style={{ position: 'relative', width: '100%', height: url ? '160px' : '100px', background: 'rgba(255,255,255,0.02)', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: 'pointer' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#888' }}>
            <Loader2 className="animate-spin" />
            <span style={{ fontSize: '12px', fontWeight: 700 }}>Subiendo...</span>
          </div>
        ) : url ? (
          <>
            <img src={url} alt="Uploaded" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = '1'} onMouseLeave={e => e.currentTarget.style.opacity = '0'}>
              <span style={{ color: 'white', fontWeight: 700, fontSize: '13px', background: 'rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: '8px' }}>Cambiar Foto</span>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#666' }}>
            <Camera opacity={0.5} />
            <span style={{ fontSize: '13px', fontWeight: 700 }}>Toca para subir foto</span>
          </div>
        )}
        <input type="file" onChange={onChange} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} accept="image/*" />
      </div>
    </div>
  );
}
