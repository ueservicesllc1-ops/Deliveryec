import { NextRequest, NextResponse } from 'next/server';
import { s3Client, b2BucketName } from '@/lib/b2';
import { GetObjectCommand } from '@aws-sdk/client-s3';

// GET /api/media/path/to/file.jpg
// Proxies the request to Backblaze B2 with correct CORS headers
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    // IMPORTANTE: En versiones nuevas de Next.js params es una promesa
    const resolvedParams = await params;
    const key = resolvedParams.path.join('/');

    console.log('--- EXTRACCION B2 ---');
    console.log('Buscando Key:', key);

    const command = new GetObjectCommand({
      Bucket: b2BucketName,
      Key: key,
    });

    const response = await s3Client.send(command);

    if (!response.Body) {
      return NextResponse.json({ error: 'File body empty' }, { status: 404 });
    }

    // Convertir el stream de B2 a un buffer legible
    const bytes = await response.Body.transformToByteArray();
    const buffer = Buffer.from(bytes);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': response.ContentType || 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('CRITICAL: Media proxy error:', error);
    return NextResponse.json({ error: 'Media not found in storage' }, { status: 404 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
