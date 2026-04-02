import * as admin from 'firebase-admin';

// Initialize the Firebase Admin App if not already initialized
if (!admin.apps.length) {
  try {
    // Para simplificar, si no hay clave de cuenta de servicio, la inicializamos solo con el project ID
    // Firebase Admin intentará utilizar las Application Default Credentials (ADC) en la nube o local.
    // Si estás localmente, necesitarás descargar un archivo serviceAccountKey.json y definir:
    // process.env.GOOGLE_APPLICATION_CREDENTIALS = "path/to/serviceAccountKey.json"
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
      admin.initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        credential: admin.credential.cert(serviceAccount)
      });
    } else {
      admin.initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        credential: admin.credential.applicationDefault()
      });
    }
  } catch (error) {
    console.error('Firebase Admin Initialization Error:', error);
  }
}

export const adminDb = admin.firestore();
export const adminMessaging = admin.messaging();
export const adminAuth = admin.auth();
