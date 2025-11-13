import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { qrData, qrType, imageFormat, paymentReference } = await request.json();

    if (!qrData || !qrType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check for valid unused payment
    const supabaseAdmin = createAdminClient();
    let paymentRef: string | null = null;
    
    if (paymentReference) {
      const { data: payment, error: paymentError } = await supabaseAdmin
        .from('payments')
        .select('*')
        .eq('paystack_reference', paymentReference)
        .eq('user_id', userId)
        .eq('status', 'success')
        .is('qr_code_id', null)
        .maybeSingle();

      if (paymentError) {
        console.error('Payment check error:', paymentError);
        return NextResponse.json(
          { error: 'Error checking payment status. Please try again.' },
          { status: 500 }
        );
      }

      if (!payment) {
        return NextResponse.json(
          { error: 'No valid unused payment found for this reference. Please complete a new payment.' },
          { status: 402 }
        );
      }
      paymentRef = payment.paystack_reference;
    } else {
      // Check if user has any unused successful payment
      const { data: unusedPayment, error: checkError } = await supabaseAdmin
        .from('payments')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'success')
        .is('qr_code_id', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (checkError) {
        console.error('Payment lookup error:', checkError);
        return NextResponse.json(
          { error: 'Error checking payment status. Please try again.' },
          { status: 500 }
        );
      }

      if (!unusedPayment) {
        return NextResponse.json(
          { error: 'Payment required. Please complete payment first.' },
          { status: 402 }
        );
      }
      paymentRef = unusedPayment.paystack_reference;
    }

    // Generate QR code image
    const qrCodeBuffer = await QRCode.toBuffer(qrData, {
      width: 512,
      margin: 2,
      type: imageFormat === 'jpeg' ? 'image/jpeg' : 'image/png',
    });

    // Convert buffer to base64
    const base64Image = qrCodeBuffer.toString('base64');
    const dataUrl = `data:image/${imageFormat};base64,${base64Image}`;

    // Upload to Supabase Storage using admin client (bypasses RLS)
    // We use admin client because we're on the server and have already authenticated via Clerk
    // supabaseAdmin is already defined above for payment checking
    const fileName = `${userId}/${uuidv4()}.${imageFormat}`;
    const filePath = fileName;

    // Convert base64 to blob
    const blob = Buffer.from(base64Image, 'base64');
    
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('qr-codes')
      .upload(filePath, blob, {
        contentType: `image/${imageFormat}`,
        upsert: false,
        cacheControl: '3600',
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload QR code image' },
        { status: 500 }
      );
    }

    // Get public URL using admin client
    const { data: urlData } = supabaseAdmin.storage
      .from('qr-codes')
      .getPublicUrl(filePath);

    // Save QR code record to database using admin client
    const { data: qrRecord, error: dbError } = await supabaseAdmin
      .from('qr_codes')
      .insert({
        user_id: userId,
        qr_type: qrType,
        qr_data: qrData,
        image_url: urlData.publicUrl,
        image_format: imageFormat,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // Try to delete uploaded file
      await supabaseAdmin.storage.from('qr-codes').remove([filePath]);
      return NextResponse.json(
        { error: 'Failed to save QR code record' },
        { status: 500 }
      );
    }

    // Link payment to QR code and mark as used
    // paymentRef is already set above during payment validation
    if (paymentRef) {
      const { error: linkError } = await supabaseAdmin
        .from('payments')
        .update({
          qr_code_id: qrRecord.id,
          updated_at: new Date().toISOString(),
        })
        .eq('paystack_reference', paymentRef)
        .eq('user_id', userId);

      if (linkError) {
        console.error('Error linking payment to QR code:', linkError);
        // Don't fail the request, QR code was already created
      }
    }

    return NextResponse.json({
      success: true,
      qrCode: {
        id: qrRecord.id,
        imageUrl: urlData.publicUrl,
        dataUrl, // For immediate download
      },
    });
  } catch (error) {
    console.error('QR generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

