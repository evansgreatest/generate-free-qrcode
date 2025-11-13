export interface QRCodeRecord {
  id: string;
  user_id: string;
  qr_type: string;
  qr_data: string;
  image_url: string;
  image_format: 'png' | 'jpeg';
  created_at: string;
  updated_at: string;
}

export interface PaymentRecord {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  paystack_reference: string;
  status: 'pending' | 'success' | 'failed';
  qr_code_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface UserStats {
  total_qr_codes: number;
  total_payments: number;
  total_revenue: number;
  user_id: string;
  email?: string;
}

