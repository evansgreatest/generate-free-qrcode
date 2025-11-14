import { createAdminClient } from '@/lib/supabase/server';

export type AuditAction =
  | 'admin.login'
  | 'admin.view_sales'
  | 'admin.view_stats'
  | 'admin.set_role'
  | 'payment.init'
  | 'payment.verify'
  | 'qr.generate'
  | 'qr.delete'
  | 'user.create'
  | 'user.update';

export interface AuditLog {
  user_id: string;
  action: AuditAction;
  resource_type?: string;
  resource_id?: string;
  metadata?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Log an audit event
 */
export async function logAuditEvent(
  log: AuditLog
): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: log.user_id,
        action: log.action,
        resource_type: log.resource_type || null,
        resource_id: log.resource_id || null,
        metadata: log.metadata || {},
        ip_address: log.ip_address || null,
        user_agent: log.user_agent || null,
        created_at: new Date().toISOString(),
      });
    
    if (error) {
      console.error('Error logging audit event:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in logAuditEvent:', error);
    return false;
  }
}

/**
 * Get audit logs (admin only)
 */
export async function getAuditLogs(
  filters?: {
    userId?: string;
    action?: AuditAction;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }
): Promise<AuditLog[]> {
  try {
    const supabase = createAdminClient();
    
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(filters?.limit || 100);
    
    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }
    
    if (filters?.action) {
      query = query.eq('action', filters.action);
    }
    
    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    
    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching audit logs:', error);
      return [];
    }
    
    return (data || []) as AuditLog[];
  } catch (error) {
    console.error('Error in getAuditLogs:', error);
    return [];
  }
}

