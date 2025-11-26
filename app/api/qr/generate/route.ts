import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { generateVCard } from '@/app/utils/vcardUtils';
import { VCardData } from '@/app/types/qrTypes';
import { sanitizeProfileData } from '@/app/utils/sanitize';
import { getSafeErrorMessage, logError } from '@/app/utils/errors';
import { logAuditEvent } from '@/app/utils/audit';
import { revalidateTag } from 'next/cache';

/**
 * Note: This route is automatically dynamic in Next.js 16 with Cache Components
 * because it uses auth() which accesses headers
 */

// Request timeout (30 seconds)
const REQUEST_TIMEOUT = 30000;

export async function POST(request: NextRequest) {
  const timeoutId = setTimeout(() => {
    // Request will be aborted by Next.js if it takes too long
  }, REQUEST_TIMEOUT);

  // Declare userId outside try block so it's accessible in catch block
  let userId: string | null = null;
  let qrType: string | undefined = undefined;

  try {
    const authResult = await auth();
    userId = authResult.userId;
    
    if (!userId) {
      clearTimeout(timeoutId);
      return NextResponse.json(
        { error: getSafeErrorMessage('Unauthorized', 'authentication') },
        { status: 401 }
      );
    }

    const { qrData, qrType: requestQrType, imageFormat, paymentReference } = await request.json();
    qrType = requestQrType;

    if (!qrData || !qrType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Input validation (SECURITY FIX)
    // Validate qrData length to prevent DoS
    if (typeof qrData !== 'string' || qrData.length > 10000) {
      clearTimeout(timeoutId);
      return NextResponse.json(
        { error: getSafeErrorMessage('QR data too long (max 10KB)', 'validation') },
        { status: 400 }
      );
    }

    // Validate qrType
    const validQrTypes = ['URL', 'TEXT', 'EMAIL', 'PHONE', 'SMS', 'WIFI', 'LOCATION', 'VCARD', 'PDF'];
    if (!validQrTypes.includes(qrType)) {
      clearTimeout(timeoutId);
      return NextResponse.json(
        { error: getSafeErrorMessage('Invalid QR code type', 'validation') },
        { status: 400 }
      );
    }

    // Validate PDF URL format if PDF type
    if (qrType === 'PDF') {
      if (!qrData || typeof qrData !== 'string' || qrData.trim() === '') {
        clearTimeout(timeoutId);
        return NextResponse.json(
          { error: getSafeErrorMessage('PDF URL is required', 'validation') },
          { status: 400 }
        );
      }
      
      try {
        const pdfUrl = new URL(qrData);
        // Ensure it's http or https
        if (!['http:', 'https:'].includes(pdfUrl.protocol)) {
          clearTimeout(timeoutId);
          return NextResponse.json(
            { error: getSafeErrorMessage('PDF URL must use http or https protocol', 'validation') },
            { status: 400 }
          );
        }
        // Accept any valid URL - Supabase storage URLs are valid
      } catch (error) {
        clearTimeout(timeoutId);
        return NextResponse.json(
          { error: getSafeErrorMessage('Invalid PDF URL format', 'validation') },
          { status: 400 }
        );
      }
    }

    // Validate imageFormat
    if (imageFormat && !['png', 'jpeg'].includes(imageFormat)) {
      clearTimeout(timeoutId);
      return NextResponse.json(
        { error: getSafeErrorMessage('Invalid image format', 'validation') },
        { status: 400 }
      );
    }

    // Handle VCARD type - parse profile data and generate appropriate QR code
    let finalQrData = qrData;
    let profileSlug: string | null = null;
    let profileRecordId: string | null = null;

    if (qrType === 'VCARD') {
      try {
        let profileData: VCardData = typeof qrData === 'string' 
          ? JSON.parse(qrData) 
          : qrData;

        // Sanitize profile data (SECURITY FIX - XSS prevention)
        profileData = sanitizeProfileData(profileData) as VCardData;

        // Validate profile data (SECURITY FIX)
        if (!profileData.fullName || !profileData.phone || !profileData.email) {
          clearTimeout(timeoutId);
          return NextResponse.json(
            { error: getSafeErrorMessage('Missing required profile fields', 'validation') },
            { status: 400 }
          );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(profileData.email)) {
          clearTimeout(timeoutId);
          return NextResponse.json(
            { error: getSafeErrorMessage('Invalid email format', 'validation') },
            { status: 400 }
          );
        }

        // Generate secure random slug (CRITICAL SECURITY FIX)
        // Use full UUID without dashes for better entropy and unpredictability
        profileSlug = uuidv4().replace(/-/g, '');

        // Determine what to encode in QR code based on generateType
        const generateType = profileData.generateType || 'both';

        if (generateType === 'vcard') {
          // Generate vCard only
          const vCard = generateVCard(profileData);
          finalQrData = vCard;
        } else {
          // For 'web' or 'both', QR code points to web profile page
          // (web profile page will offer vCard download if 'both' was selected)
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
          finalQrData = `${baseUrl}/profile/${profileSlug}`;
        }
      } catch (error) {
        logError(error, 'QR_GENERATE_PROFILE_PARSE', { userId, qrType });
        clearTimeout(timeoutId);
        return NextResponse.json(
          { error: getSafeErrorMessage(error, 'validation') },
          { status: 400 }
        );
      }
    }

    // Check for valid unused payment
    // Create admin client once for reuse in payment check and storage operations
    let supabaseAdmin: ReturnType<typeof createAdminClient>;
    try {
      supabaseAdmin = createAdminClient();
    } catch (adminClientError) {
      logError(adminClientError, 'SUPABASE_ADMIN_CLIENT', { userId });
      clearTimeout(timeoutId);
      return NextResponse.json(
        { error: getSafeErrorMessage('Database connection error. Please try again.', 'database') },
        { status: 500 }
      );
    }

    let paymentRef: string | null = null;
    
    try {
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
          logError(paymentError, 'PAYMENT_CHECK', { userId, paymentReference });
          clearTimeout(timeoutId);
          return NextResponse.json(
            { error: getSafeErrorMessage('Error checking payment status. Please try again.', 'database') },
            { status: 500 }
          );
        }

        if (!payment) {
          clearTimeout(timeoutId);
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
          logError(checkError, 'PAYMENT_LOOKUP', { userId });
          clearTimeout(timeoutId);
          return NextResponse.json(
            { error: getSafeErrorMessage('Error checking payment status. Please try again.', 'database') },
            { status: 500 }
          );
        }

        if (!unusedPayment) {
          clearTimeout(timeoutId);
          return NextResponse.json(
            { error: 'Payment required. Please complete payment first.' },
            { status: 402 }
          );
        }
        paymentRef = unusedPayment.paystack_reference;
      }
    } catch (paymentCheckError) {
      // Handle network errors or Supabase connection issues
      logError(paymentCheckError, 'PAYMENT_CHECK_NETWORK', { userId, paymentReference });
      clearTimeout(timeoutId);
      return NextResponse.json(
        { error: getSafeErrorMessage('Unable to verify payment status. Please check your connection and try again.', 'network') },
        { status: 500 }
      );
    }

    // Generate QR code image (always as PNG first)
    const pngBuffer = await QRCode.toBuffer(finalQrData, {
      width: 512,
      margin: 2,
    });

    // Convert to requested format if JPEG, otherwise use PNG
    let qrCodeBuffer: Buffer;
    let finalImageFormat: string;
    
    if (imageFormat === 'jpeg') {
      // Convert PNG to JPEG using sharp
      qrCodeBuffer = await sharp(pngBuffer)
        .jpeg({ quality: 90 })
        .toBuffer();
      finalImageFormat = 'jpeg';
    } else {
      qrCodeBuffer = pngBuffer;
      finalImageFormat = 'png';
    }

    // Convert buffer to base64
    const base64Image = qrCodeBuffer.toString('base64');
    const dataUrl = `data:image/${finalImageFormat};base64,${base64Image}`;

    // Upload to Supabase Storage using admin client (bypasses RLS)
    // We use admin client because we're on the server and have already authenticated via Clerk
    // supabaseAdmin is already defined above for payment checking
    const fileName = `${userId}/${uuidv4()}.${finalImageFormat}`;
    const filePath = fileName;
    
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('qr-codes')
      .upload(filePath, qrCodeBuffer, {
        contentType: `image/${finalImageFormat}`,
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
        qr_data: finalQrData,
        image_url: urlData.publicUrl,
        image_format: finalImageFormat,
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

    // If VCARD type, save profile data to user_profiles table
    if (qrType === 'VCARD' && profileSlug) {
      try {
        const profileData: VCardData = typeof qrData === 'string' 
          ? JSON.parse(qrData) 
          : qrData;

        const { data: profileRecord, error: profileError } = await supabaseAdmin
          .from('user_profiles')
          .insert({
            user_id: userId,
            qr_code_id: qrRecord.id,
            full_name: profileData.fullName,
            phone: profileData.phone,
            email: profileData.email,
            company: profileData.company || null,
            job_title: profileData.jobTitle || null,
            website: profileData.website || null,
            bio: profileData.bio || null,
            profile_picture_url: profileData.profilePicture || null,
            linkedin: profileData.linkedin || null,
            twitter: profileData.twitter || null,
            instagram: profileData.instagram || null,
            facebook: profileData.facebook || null,
            profile_slug: profileSlug,
          })
          .select()
          .single();

        if (profileError) {
          console.error('Profile save error:', profileError);
          // Don't fail the request, QR code was already created
        } else {
          profileRecordId = profileRecord.id;
        }
      } catch (error) {
        console.error('Error saving profile:', error);
        // Don't fail the request
      }
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

    // Invalidate cache for user's QR codes list (Next.js 16 - read-your-writes)
    // Invalidate cache for user's QR codes and payments
    // Using revalidateTag() for Route Handlers (updateTag is Server Actions-only)
    if (userId) {
      try {
        // Revalidate user's QR codes cache
        revalidateTag(`user-qr-codes:${userId}`, 'max');
        // Revalidate user's payments cache
        revalidateTag(`user-payments:${userId}`, 'max');
      } catch (cacheError) {
        // Cache invalidation is best-effort, don't fail the request
        console.error('Cache invalidation error:', cacheError);
      }
    }

    // Log audit event (userId is guaranteed to be string here due to early return check)
    await logAuditEvent({
      user_id: userId!, // Non-null assertion: userId is validated at line 23
      action: 'qr.generate',
      resource_type: 'qr_code',
      resource_id: qrRecord.id,
      metadata: { qr_type: qrType },
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      user_agent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      success: true,
      qrCode: {
        id: qrRecord.id,
        imageUrl: urlData.publicUrl,
        dataUrl, // For immediate download
        qrData: finalQrData, // Return the actual QR data for client-side rendering
      },
      profile: profileSlug ? {
        slug: profileSlug,
        url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/profile/${profileSlug}`,
      } : null,
    });

    clearTimeout(timeoutId);
  } catch (error) {
    logError(error, 'QR_GENERATE', { userId, qrType });
    clearTimeout(timeoutId);
    return NextResponse.json(
      { error: getSafeErrorMessage(error, 'database') },
      { status: 500 }
    );
  }
}

