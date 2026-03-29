import { NextRequest, NextResponse } from 'next/server';
import { s3Client, b2BucketName } from '@/lib/b2';
import { GetObjectCommand } from '@aws-sdk/client-s3';

// GET /api/media/path/to/file.jpg
// Proxies the request to Backblaze B2 with correct CORS headers
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const key = params.path.join('/');

    const command = new GetObjectCommand({
      Bucket: b2BucketName,
      Key: key,
    });

    const response = await s3Client.send(command);

    if (!response.Body) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const chunks: Uint8Array[] = [];
    const reader = (response.Body as AsyncIterable<Uint8Array>);
    for await (const chunk of reader) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': response.ContentType || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('Media proxy error:', error);
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
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
