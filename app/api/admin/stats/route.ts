import { NextRequest, NextResponse } from "next/server";
import { auth } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase/server';

const ADMIN_USER_IDS = process.env.ADMIN_USER_IDS?.split(',') || [];

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId || !ADMIN_USER_IDS.includes(userId)) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const supabase = createAdminClient();

    // Get total QR codes
    const { count: totalQRCodes } = await supabase
      .from('qr_codes')
      .select('*', { count: 'exact', head: true });

    // Get total users (from payments)
    const { data: usersData } = await supabase
      .from('payments')
      .select('user_id')
      .eq('status', 'success');

    const uniqueUsers = new Set(usersData?.map(p => p.user_id) || []).size;

    // Get revenue stats
    const { data: revenueData } = await supabase
      .from('payments')
      .select('amount, created_at')
      .eq('status', 'success');

    const totalRevenue = revenueData?.reduce((sum, p) => sum + p.amount, 0) || 0;

    // Get daily revenue for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: dailyData } = await supabase
      .from('payments')
      .select('amount, created_at')
      .eq('status', 'success')
      .gte('created_at', thirtyDaysAgo.toISOString());

    const dailyRevenue = dailyData?.reduce((acc, payment) => {
      const date = new Date(payment.created_at).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + payment.amount;
      return acc;
    }, {} as Record<string, number>) || {};

    return NextResponse.json({
      totalQRCodes: totalQRCodes || 0,
      totalUsers: uniqueUsers,
      totalRevenue,
      dailyRevenue,
      recentPayments: revenueData?.slice(-10).reverse() || [],
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

