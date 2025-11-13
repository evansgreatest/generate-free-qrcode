import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();

    // Get total QR codes count
    const { count: totalQRCodes } = await supabase
      .from('qr_codes')
      .select('*', { count: 'exact', head: true });

    // Get total unique users (from payments)
    const { data: paymentsData } = await supabase
      .from('payments')
      .select('user_id')
      .eq('status', 'success');

    const uniqueUsers = new Set(paymentsData?.map(p => p.user_id) || []).size;

    // Get total successful payments
    const { count: totalPayments } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'success');

    // Format numbers for display
    const formatNumber = (num: number): string => {
      if (num >= 1000000) {
        return `${(num / 1000000).toFixed(1)}M+`;
      } else if (num >= 1000) {
        return `${(num / 1000).toFixed(1)}K+`;
      }
      return `${num}+`;
    };

    return NextResponse.json({
      totalQRCodes: totalQRCodes || 0,
      totalQRCodesFormatted: formatNumber(totalQRCodes || 0),
      totalUsers: uniqueUsers,
      totalUsersFormatted: formatNumber(uniqueUsers),
      totalPayments: totalPayments || 0,
      totalPaymentsFormatted: formatNumber(totalPayments || 0),
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { 
        totalQRCodes: 0,
        totalQRCodesFormatted: "0+",
        totalUsers: 0,
        totalUsersFormatted: "0+",
        totalPayments: 0,
        totalPaymentsFormatted: "0+",
      },
      { status: 200 } // Return default values instead of error
    );
  }
}

