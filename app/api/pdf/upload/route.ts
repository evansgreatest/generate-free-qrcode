import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';
import { getSafeErrorMessage, logError } from '@/app/utils/errors';

// Request timeout (30 seconds)
const REQUEST_TIMEOUT = 30000;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  const timeoutId = setTimeout(() => {
    // Request will be aborted by Next.js if it takes too long
  }, REQUEST_TIMEOUT);

  try {
    const authResult = await auth();
    const userId = authResult.userId;
    
    if (!userId) {
      clearTimeout(timeoutId);
      return NextResponse.json(
        { error: getSafeErrorMessage('Unauthorized', 'authentication') },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      clearTimeout(timeoutId);
      return NextResponse.json(
        { error: getSafeErrorMessage('No file provided', 'validation') },
        { status: 400 }
      );
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      clearTimeout(timeoutId);
      return NextResponse.json(
        { error: getSafeErrorMessage('Only PDF files are allowed', 'validation') },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      clearTimeout(timeoutId);
      return NextResponse.json(
        { error: getSafeErrorMessage(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`, 'validation') },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate unique file name
    const fileExtension = file.name.split('.').pop() || 'pdf';
    const fileName = `${userId}/${uuidv4()}.${fileExtension}`;

    // Upload to Supabase Storage
    const supabaseAdmin = createAdminClient();
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('qr-codes')
      .upload(fileName, buffer, {
        contentType: 'application/pdf',
        upsert: false,
        cacheControl: '3600',
      });

    if (uploadError) {
      logError(uploadError, 'PDF_UPLOAD_ERROR', { userId, fileName });
      clearTimeout(timeoutId);
      return NextResponse.json(
        { error: getSafeErrorMessage('Failed to upload PDF file', 'storage') },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('qr-codes')
      .getPublicUrl(fileName);

    clearTimeout(timeoutId);
    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      fileName: file.name,
    });
  } catch (error) {
    logError(error, 'PDF_UPLOAD_EXCEPTION');
    clearTimeout(timeoutId);
    return NextResponse.json(
      { error: getSafeErrorMessage('An error occurred while uploading PDF', 'server') },
      { status: 500 }
    );
  }
}

