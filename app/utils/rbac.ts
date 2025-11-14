import { createAdminClient } from '@/lib/supabase/server';

export type UserRole = 'admin' | 'user';

/**
 * Check if a user has admin role
 */
export async function isAdmin(userId: string): Promise<boolean> {
  // Check environment variable first (legacy support)
  const adminUserIds = process.env.ADMIN_USER_IDS?.split(',') || [];
  if (adminUserIds.includes(userId)) {
    return true;
  }
  
  // Check database for role
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();
    
    if (error) {
      console.error('Error checking user role:', error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error('Error in isAdmin check:', error);
    return false;
  }
}

/**
 * Get user role
 */
export async function getUserRole(userId: string): Promise<UserRole> {
  const isUserAdmin = await isAdmin(userId);
  return isUserAdmin ? 'admin' : 'user';
}

/**
 * Set user role (admin only)
 */
export async function setUserRole(
  userId: string,
  role: UserRole,
  adminUserId: string
): Promise<boolean> {
  // Verify the requester is admin
  const requesterIsAdmin = await isAdmin(adminUserId);
  if (!requesterIsAdmin) {
    return false;
  }
  
  try {
    const supabase = createAdminClient();
    
    // Upsert role
    const { error } = await supabase
      .from('user_roles')
      .upsert({
        user_id: userId,
        role: role,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });
    
    if (error) {
      console.error('Error setting user role:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in setUserRole:', error);
    return false;
  }
}

