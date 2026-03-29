importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDazlZPW02awSp_Hmi9GwvBpN4ed7Rpo7k",
  authDomain: "deliveryec-e23c8.firebaseapp.com",
  projectId: "deliveryec-e23c8",
  storageBucket: "deliveryec-e23c8.firebasestorage.app",
  messagingSenderId: "1099119077736",
  appId: "1:1099119077736:web:d6c24ce9c2fcb55ec88edd",
  measurementId: "G-N6ECWCFRXZ"
});

const messaging = firebase.messaging();

// Manejo de notificaciones en background
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Recibido mensaje en background ', payload);
  const notificationTitle = payload.notification?.title || payload.data?.title || 'Nueva Notificación';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'Abre la app para ver más detalles.',
    icon: '/launcher/icon-192x192.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Click notification event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  // Puedes leer event.notification.data.url si pasas URL
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // si hay una ventana abierta, ponla en foco
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no, abre una nueva
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
