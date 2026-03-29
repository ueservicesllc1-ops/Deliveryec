'use client';

import { useEffect, useState } from 'react';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { doc, setDoc } from 'firebase/firestore';
import { app, db } from './firebase';

export function usePushNotification(uid?: string) {
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) return;
    
    // Request permission automatically if supported and logged in
    const enablePush = async () => {
      try {
        const support = await isSupported();
        if (!support) return;

        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const messaging = getMessaging(app);
          // Wait for service worker
          const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          
          const token = await getToken(messaging, {
            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY, // Opcional, pero recomendado
            serviceWorkerRegistration: registration
          });

          if (token) {
            setFcmToken(token);
            // Save token to profile
            await setDoc(doc(db, 'profiles', uid), { fcmToken: token }, { merge: true });
          }

          // Handle incoming messages gracefully if app is in foreground
          onMessage(messaging, (payload) => {
            console.log('Mensaje en primer plano:', payload);
            // En el futuro podemos usar una tostada/notificación in-app si es necesario
          });
        }
      } catch (err) {
        console.warn('Push Notifications fallaron o fueron denegadas:', err);
      }
    };
    
    enablePush();
  }, [uid]);

  return { fcmToken };
}
