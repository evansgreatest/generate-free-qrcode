import { NextRequest, NextResponse } from "next/server";
import { auth } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase/server';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const reference = searchParams.get("reference");

    if (!reference) {
      return NextResponse.json(
        { error: "Reference is required" },
        { status: 400 }
      );
    }

    if (!PAYSTACK_SECRET_KEY) {
      return NextResponse.json(
        { error: "Paystack secret key not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const data = await response.json();

    if (!data.status) {
      return NextResponse.json(
        { error: data.message || "Failed to verify payment" },
        { status: 400 }
      );
    }

    const paymentStatus = data.data.status === "success";
    const amount = data.data.amount / 100; // Convert from pesewas to GHS

    // Update payment record in database using admin client (bypasses RLS)
    const supabase = createAdminClient();
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: paymentStatus ? 'success' : 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('paystack_reference', reference)
      .eq('user_id', userId);

    if (updateError) {
      console.error('Payment update error:', updateError);
    }

    return NextResponse.json({
      status: paymentStatus,
      reference: data.data.reference,
      amount: amount,
      metadata: data.data.metadata,
    });
  } catch (error) {
    console.error("Paystack verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}
