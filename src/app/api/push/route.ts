import { NextResponse } from 'next/server';
import { adminMessaging, adminDb } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const { userId, title, body, url } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'Falta el userId' }, { status: 400 });
    }

    // Obtener el fcmToken del usuario desde la colección de perfiles
    const profileSnap = await adminDb.collection('profiles').doc(userId).get();
    const profile = profileSnap.data();

    if (!profile || !profile.fcmToken) {
      return NextResponse.json({ error: 'Usuario no tiene fcmToken activo' }, { status: 404 });
    }

    const payload = {
      token: profile.fcmToken,
      notification: {
        title: title || 'Notificación',
        body: body || 'Tienes un nuevo mensaje.',
      },
      data: {
        click_action: 'FLUTTER_NOTIFICATION_CLICK', // Compatible con Flutter u otras PWA
        url: url || '/'
      }
    };

    const response = await adminMessaging.send(payload);
    
    return NextResponse.json({ success: true, messageId: response }, { status: 200 });
  } catch (error: any) {
    console.error('Error enviando Push:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
