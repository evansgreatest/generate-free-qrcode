import { NextRequest, NextResponse } from "next/server";
import { auth } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase/server';
import { isAdmin } from '@/app/utils/rbac';
import { logAuditEvent } from '@/app/utils/audit';
import { getSafeErrorMessage, logError } from '@/app/utils/errors';

/**
 * Note: This route is automatically dynamic in Next.js 16 with Cache Components
 * because it uses auth() which accesses headers
 */

// Request timeout (30 seconds)
const REQUEST_TIMEOUT = 30000;

export async function GET(request: NextRequest) {
  const timeoutId = setTimeout(() => {}, REQUEST_TIMEOUT);

  try {
    const { userId } = await auth();
    
    if (!userId) {
      clearTimeout(timeoutId);
      return NextResponse.json(
        { error: getSafeErrorMessage('Unauthorized', 'authentication') },
        { status: 401 }
      );
    }

    // Check if user is admin using RBAC
    const userIsAdmin = await isAdmin(userId);
    if (!userIsAdmin) {
      clearTimeout(timeoutId);
      return NextResponse.json(
        { error: getSafeErrorMessage('Forbidden - Admin access required', 'authorization') },
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

    // Log audit event
    await logAuditEvent({
      user_id: userId,
      action: 'admin.view_sales',
      metadata: { startDate, endDate, limit, offset },
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      user_agent: request.headers.get('user-agent') || undefined,
    });

    const response = NextResponse.json({
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

    // Add cache tags for Next.js 16 cache management
    response.headers.set('x-cache-tag', 'admin-sales');
    response.headers.set('Cache-Control', 'private, s-maxage=60, stale-while-revalidate=300');

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    logError(error, 'ADMIN_SALES', { userId: (await auth()).userId });
    clearTimeout(timeoutId);
    return NextResponse.json(
      { error: getSafeErrorMessage(error, 'database') },
      { status: 500 }
    );
  }
}

