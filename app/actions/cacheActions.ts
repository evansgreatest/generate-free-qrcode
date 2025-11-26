"use server";

import { updateTag, revalidateTag } from 'next/cache';
import { auth } from '@clerk/nextjs/server';

/**
 * Server Actions for cache management using Next.js 16 cache APIs
 * 
 * updateTag() - Read-your-writes semantics (immediate cache invalidation)
 * revalidateTag() - Stale-while-revalidate (background revalidation)
 */

/**
 * Invalidate user's QR codes cache after generation
 * Uses updateTag() for immediate cache refresh (read-your-writes)
 */
export async function invalidateUserQRCodes(userId: string) {
  try {
    updateTag(`user-qr-codes:${userId}`);
    return { success: true };
  } catch (error) {
    console.error('Error invalidating QR codes cache:', error);
    return { success: false, error: 'Failed to invalidate cache' };
  }
}

/**
 * Invalidate user's payments cache
 * Uses updateTag() for immediate cache refresh
 */
export async function invalidateUserPayments(userId: string) {
  try {
    updateTag(`user-payments:${userId}`);
    return { success: true };
  } catch (error) {
    console.error('Error invalidating payments cache:', error);
    return { success: false, error: 'Failed to invalidate cache' };
  }
}

/**
 * Revalidate admin stats cache (stale-while-revalidate)
 * Uses revalidateTag() for background revalidation
 */
export async function revalidateAdminStats() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Revalidate with 'max' profile for long-lived content
    revalidateTag('admin-stats', 'max');
    return { success: true };
  } catch (error) {
    console.error('Error revalidating admin stats:', error);
    return { success: false, error: 'Failed to revalidate cache' };
  }
}

/**
 * Invalidate all user-related caches
 * Useful after major updates
 */
export async function invalidateUserCaches(userId: string) {
  try {
    updateTag(`user-qr-codes:${userId}`);
    updateTag(`user-payments:${userId}`);
    return { success: true };
  } catch (error) {
    console.error('Error invalidating user caches:', error);
    return { success: false, error: 'Failed to invalidate caches' };
  }
}

