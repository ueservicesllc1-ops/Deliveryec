import * as admin from 'firebase-admin';

// Initialize the Firebase Admin App if not already initialized
if (!admin.apps.length) {
  try {
    // Para simplificar, si no hay clave de cuenta de servicio, la inicializamos solo con el project ID
    // Firebase Admin intentará utilizar las Application Default Credentials (ADC) en la nube o local.
    // Si estás localmente, necesitarás descargar un archivo serviceAccountKey.json y definir:
    // process.env.GOOGLE_APPLICATION_CREDENTIALS = "path/to/serviceAccountKey.json"
    admin.initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      credential: process.env.FIREBASE_SERVICE_ACCOUNT_KEY 
        ? admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)) 
        : admin.credential.applicationDefault()
    });
  } catch (error) {
    console.error('Firebase Admin Initialization Error:', error);
  }
}

export const adminDb = admin.firestore();
export const adminMessaging = admin.messaging();
export const adminAuth = admin.auth();
