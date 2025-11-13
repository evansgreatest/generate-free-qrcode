import { NextRequest, NextResponse } from "next/server";
import { auth } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase/server';

// Admin user IDs - you should configure this based on your Clerk setup
const ADMIN_USER_IDS = process.env.ADMIN_USER_IDS?.split(',') || [];

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (!ADMIN_USER_IDS.includes(userId)) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = createAdminClient();

    // Build query
    // Note: We don't have a users table (using Clerk), so we just select payments
    let query = supabase
      .from('payments')
      .select('*')
      .eq('status', 'success')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: payments, error: paymentsError } = await query;

    if (paymentsError) {
      console.error('Payments query error:', paymentsError);
      return NextResponse.json(
        { error: "Failed to fetch payments" },
        { status: 500 }
      );
    }

    // Get total revenue
    let revenueQuery = supabase
      .from('payments')
      .select('amount')
      .eq('status', 'success');

    if (startDate) {
      revenueQuery = revenueQuery.gte('created_at', startDate);
    }
    if (endDate) {
      revenueQuery = revenueQuery.lte('created_at', endDate);
    }

    const { data: revenueData, error: revenueError } = await revenueQuery;

    const totalRevenue = revenueData?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
    const totalTransactions = revenueData?.length || 0;

    // Get statistics
    const { data: statsData, error: statsError } = await supabase
      .from('payments')
      .select('status')
      .gte('created_at', startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    const stats = {
      total: statsData?.length || 0,
      success: statsData?.filter(p => p.status === 'success').length || 0,
      failed: statsData?.filter(p => p.status === 'failed').length || 0,
      pending: statsData?.filter(p => p.status === 'pending').length || 0,
    };

    return NextResponse.json({
      payments,
      summary: {
        totalRevenue,
        totalTransactions,
        averageTransaction: totalTransactions > 0 ? totalRevenue / totalTransactions : 0,
        stats,
      },
      pagination: {
        limit,
        offset,
        hasMore: payments.length === limit,
      },
    });
  } catch (error) {
    console.error("Admin sales error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

