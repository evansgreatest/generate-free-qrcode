import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from '@/lib/supabase/server';
import crypto from 'crypto';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const hash = request.headers.get('x-paystack-signature');

    if (!PAYSTACK_SECRET_KEY) {
      return NextResponse.json(
        { error: "Paystack secret key not configured" },
        { status: 500 }
      );
    }

    // Verify webhook signature
    const expectedHash = crypto
      .createHmac('sha512', PAYSTACK_SECRET_KEY)
      .update(body)
      .digest('hex');

    if (hash !== expectedHash) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    const event = JSON.parse(body);
    const { event: eventType, data } = event;

    // Handle payment events
    if (eventType === 'charge.success' || eventType === 'transaction.success') {
      const paymentData = data;
      const reference = paymentData.reference;
      const userId = paymentData.metadata?.user_id;
      const amount = paymentData.amount / 100; // Convert from pesewas to GHS
      const status = paymentData.status === 'success' ? 'success' : 'failed';

      if (!userId) {
        console.error('No user_id in payment metadata');
        return NextResponse.json(
          { error: "Missing user_id in metadata" },
          { status: 400 }
        );
      }

      const supabase = createAdminClient();

      // Update or create payment record
      const { data: existingPayment } = await supabase
        .from('payments')
        .select('*')
        .eq('paystack_reference', reference)
        .single();

      if (existingPayment) {
        // Update existing payment
        const { error: updateError } = await supabase
          .from('payments')
          .update({
            status: status,
            amount: amount,
            updated_at: new Date().toISOString(),
          })
          .eq('paystack_reference', reference);

        if (updateError) {
          console.error('Payment update error:', updateError);
        }
      } else {
        // Create new payment record
        const { error: insertError } = await supabase
          .from('payments')
          .insert({
            user_id: userId,
            amount: amount,
            currency: 'GHS',
            paystack_reference: reference,
            status: status,
            metadata: paymentData.metadata || {},
          });

        if (insertError) {
          console.error('Payment insert error:', insertError);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Paystack webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

// GET endpoint for webhook verification (Paystack sends a GET request to verify)
export async function GET(request: NextRequest) {
  return NextResponse.json({ status: 'ok' });
}

