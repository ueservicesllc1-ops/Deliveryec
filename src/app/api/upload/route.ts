import { NextRequest, NextResponse } from 'next/server';
import { s3Client, b2BucketName } from '@/lib/b2';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = (formData.get('folder') as string) || 'general';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.name.split('.').pop();
    const key = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: b2BucketName,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      },
    });

    await upload.done();

    // Return the proxy URL (goes through our /api/media route)
    const url = `/api/media/${key}`;
    return NextResponse.json({ url, key });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
