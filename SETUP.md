# Setup Guide - QR Pro Generator

This guide will help you set up the complete application with Supabase, Clerk, and Paystack.

## Prerequisites

- Node.js 18+ installed
- Accounts for:
  - Supabase (free tier available)
  - Clerk (free tier available)
  - Paystack (test mode available)

## Step 1: Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Paystack Configuration
PAYSTACK_SECRET_KEY=sk_test_277161d5c65a7d8503b506e4e586a33e7b16a46f
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_...

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Admin Configuration (comma-separated Clerk user IDs)
ADMIN_USER_IDS=user_2abc123,user_2def456
```

## Step 2: Supabase Setup

### 2.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in project details and wait for setup to complete
4. Copy your Project URL and API keys from Settings > API

### 2.2 Run Database Migration

1. Go to SQL Editor in Supabase dashboard
2. Click "New Query"
3. Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
4. Click "Run" to execute the migration

### 2.3 Create Storage Bucket

1. Go to Storage in Supabase dashboard
2. Click "New bucket"
3. Name it `qr-codes`
4. Set it to **Public** (or configure RLS policies if you prefer private)
5. Click "Create bucket"

### 2.4 Configure Storage Policies (if bucket is private)

If you set the bucket to private, add these policies:

```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'qr-codes');

-- Allow users to read their own files
CREATE POLICY "Users can read own files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'qr-codes' AND (storage.foldername(name))[1] = auth.uid()::text);
```

## Step 3: Clerk Setup

### 3.1 Create Clerk Application

1. Go to [clerk.com](https://clerk.com) and sign up/login
2. Click "Create Application"
3. Choose authentication methods (Email, Google, etc.)
4. Copy your Publishable Key and Secret Key

### 3.2 Configure Clerk

1. In Clerk dashboard, go to "Paths"
2. Set:
   - Sign-in path: `/sign-in`
   - Sign-up path: `/sign-up`
   - After sign-in: `/`
   - After sign-up: `/`

### 3.3 Get Admin User IDs

1. Sign in to your application
2. Go to Clerk dashboard > Users
3. Find your user and copy the User ID
4. Add it to `ADMIN_USER_IDS` in `.env.local` (comma-separated for multiple admins)

## Step 4: Paystack Setup

1. Go to [paystack.com](https://paystack.com) and sign up/login
2. Go to Settings > Developer > API Keys
3. Copy your Test Secret Key and Public Key
4. Add them to `.env.local`
5. **Configure Webhook** (Important for production):
   - Go to Settings > Developer > Webhooks
   - Click "Add Webhook"
   - Webhook URL: `https://yourdomain.com/api/paystack/webhook`
   - Select events: `charge.success` and `transaction.success`
   - Save the webhook
   - The webhook will automatically verify payments server-side

## Step 5: Install and Run

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Step 6: Test the Application

1. **Sign Up/Sign In**: Create an account or sign in
2. **Generate QR Code**:
   - Select QR code type
   - Enter data
   - Complete payment (GHS 8.99)
   - Generate QR code
3. **Admin Dashboard**:
   - Sign in as admin user
   - Visit `/admin`
   - View sales and statistics

## Security Features Implemented

✅ **Rate Limiting**

- General API: 100 requests per 15 minutes
- QR Generation: 10 requests per minute
- Payment: 5 requests per minute

✅ **CSRF Protection**

- Origin and referer validation
- Prevents cross-site request forgery

✅ **Authentication**

- Clerk-based authentication
- Protected routes and APIs

✅ **Row Level Security**

- Users can only access their own data
- Admin access via service role key

✅ **Input Validation**

- All inputs validated and sanitized
- Type checking on all API routes

## Troubleshooting

### QR codes not uploading to Supabase

- Check storage bucket exists and is named `qr-codes`
- Verify bucket is public or policies are configured
- Check Supabase service role key is correct

### Admin dashboard shows "Forbidden"

- Verify your user ID is in `ADMIN_USER_IDS`
- Check user ID format (starts with `user_`)
- Restart dev server after changing env vars

### Payment not working

- Verify Paystack keys are correct
- Check callback URL matches `NEXT_PUBLIC_APP_URL`
- Ensure payment amount is correct (8.99 GHS)

### Authentication issues

- Verify Clerk keys are correct
- Check Clerk application paths match your routes
- Clear browser cookies and try again

## Production Deployment

Before deploying to production:

1. Update all environment variables with production keys
2. Set `NEXT_PUBLIC_APP_URL` to your production domain
3. Configure Clerk for production
4. Switch Paystack to live mode
5. Update Supabase RLS policies if needed
6. Set up proper CORS policies
7. Enable HTTPS

## Support

For issues, check:

- Supabase logs in dashboard
- Clerk logs in dashboard
- Browser console for client errors
- Server logs for API errors
