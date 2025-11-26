import { NextRequest, NextResponse } from "next/server";
import { auth } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * Note: This route is automatically dynamic in Next.js 16 with Cache Components
 * because it uses auth() which accesses headers
 */
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
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = createAdminClient();

    const { data: payments, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Payments fetch error:', error);
      return NextResponse.json(
        { error: "Failed to fetch payments" },
        { status: 500 }
      );
    }

    // Get total count
    const { count } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const response = NextResponse.json({
      payments: payments || [],
      total: count || 0,
      limit,
      offset,
    });

    // Add cache tags for Next.js 16 cache management
    response.headers.set('Cache-Control', 'private, no-cache');
    // Tag for cache invalidation
    if (userId) {
      response.headers.set('x-cache-tag', `user-payments:${userId}`);
    }

    return response;
  } catch (error) {
    console.error("User payments error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

