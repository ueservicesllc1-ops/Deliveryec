'use client';

import { useEffect, useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';

export default function MagicLoader() {
  const [status, setStatus] = useState('Verificando usuario...');
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          setStatus('Inyectando permisos permanentes...');
          await updateDoc(doc(db, 'profiles', user.uid), { isAdmin: true });
          setStatus('¡Éxito! Redirigiendo al Admin seguro...');
          setTimeout(() => {
            router.push('/admin');
          }, 1500);
        } catch (error: any) {
          setStatus('Error: ' + error.message);
        }
      } else {
        setStatus('Debes estar logueado. Redirigiendo a /login...');
        setTimeout(() => {
          router.push('/login');
        }, 1500);
      }
    });

    return () => unsub();
  }, [router]);

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0D0E12', color: 'white', fontFamily: 'sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>🔑 ZONA MÁGICA</h1>
        <p style={{ color: '#22C55E' }}>{status}</p>
      </div>
    </div>
  );
}
