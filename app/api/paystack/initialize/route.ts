import { NextRequest, NextResponse } from "next/server";
import { auth } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase/server';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

// Pricing constants (must match client-side)
const PRICE_PER_QR = 10.0;
const PRICE_PER_PROFILE = 15.0;

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { email, amount, metadata } = await request.json();

    // Validate email format
    if (!email || !email.includes("@") || !email.includes(".")) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Validate amount based on QR type (CRITICAL SECURITY FIX)
    const qrType = metadata?.qrType;
    const expectedAmount = qrType === "PROFILE" ? PRICE_PER_PROFILE : PRICE_PER_QR;
    
    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid payment amount" },
        { status: 400 }
      );
    }

    // Allow small floating point differences (0.01 GHS tolerance)
    if (Math.abs(amount - expectedAmount) > 0.01) {
      return NextResponse.json(
        { error: "Invalid payment amount for this QR code type" },
        { status: 400 }
      );
    }

    if (!PAYSTACK_SECRET_KEY) {
      return NextResponse.json(
        { error: "Paystack secret key not configured" },
        { status: 500 }
      );
    }

    // Amount in pesewas (GHS * 100)
    const amountInPesewas = Math.round(amount * 100);

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: amountInPesewas,
        currency: "GHS",
        metadata: {
          ...metadata,
          user_id: userId,
        },
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/payment/callback`,
        // Webhook URL for server-side payment verification
        // Configure this in Paystack dashboard: Settings > Webhooks
        // URL: https://yourdomain.com/api/paystack/webhook
      }),
    });

    const data = await response.json();

    if (!data.status) {
      return NextResponse.json(
        { error: data.message || "Failed to initialize payment" },
        { status: 400 }
      );
    }

    // Save payment record to database using admin client (bypasses RLS)
    const supabase = createAdminClient();
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        amount: amount,
        currency: 'GHS',
        paystack_reference: data.data.reference,
        status: 'pending',
        metadata: metadata,
      });

    if (paymentError) {
      console.error('Payment record error:', paymentError);
      // Continue anyway, payment initialization succeeded
    }

    return NextResponse.json({
      authorization_url: data.data.authorization_url,
      access_code: data.data.access_code,
      reference: data.data.reference,
    });
  } catch (error) {
    console.error("Paystack initialization error:", error);
    return NextResponse.json(
      { error: "Failed to initialize payment" },
      { status: 500 }
    );
  }
}
