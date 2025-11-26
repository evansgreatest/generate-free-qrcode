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

    // Log audit event
    await logAuditEvent({
      user_id: userId,
      action: 'admin.view_stats',
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      user_agent: request.headers.get('user-agent') || undefined,
    });

    const response = NextResponse.json({
      totalQRCodes: totalQRCodes || 0,
      totalUsers: uniqueUsers,
      totalRevenue,
      dailyRevenue,
      recentPayments: revenueData?.slice(-10).reverse() || [],
    });

    // Add cache tag for Next.js 16 cache management
    response.headers.set('x-cache-tag', 'admin-stats');
    response.headers.set('Cache-Control', 'private, s-maxage=60, stale-while-revalidate=300');

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    logError(error, 'ADMIN_STATS', { userId: (await auth()).userId });
    clearTimeout(timeoutId);
    return NextResponse.json(
      { error: getSafeErrorMessage(error, 'database') },
      { status: 500 }
    );
  }
}

