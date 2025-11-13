# QR Pro Generator

A modern, professional QR code generator built with Next.js 16, featuring Supabase storage, Clerk authentication, and Paystack payment integration for Ghanaian Cedis (GHS).

## Features

- 🚀 **Next.js 16** - Built with the latest Next.js features including Server Actions
- 🔐 **Clerk Authentication** - Secure user authentication and management
- 💾 **Supabase Storage** - QR code images stored securely in Supabase
- 💳 **Paystack Integration** - Secure payment processing in GHS
- 📊 **Admin Dashboard** - View sales, billing, and analytics
- 🛡️ **Security** - Rate limiting, CSRF protection, brute force prevention
- 🎨 **Modern UI** - Beautiful, responsive design with dark mode support
- ⚡ **Fast Generation** - Lightning-fast QR code generation
- 📱 **Multiple Formats** - Support for URLs, text, emails, and phone numbers
- 🔒 **Secure** - Encrypted data processing with Row Level Security

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Clerk account
- Paystack account

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd qrcode-generator
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your services:

#### Clerk Setup
1. Sign up at [clerk.com](https://clerk.com)
2. Create a new application
3. Copy your Publishable Key and Secret Key to `.env.local`

#### Supabase Setup
1. Sign up at [supabase.com](https://supabase.com)
2. Create a new project
3. Copy your Project URL and Anon Key to `.env.local`
4. Copy your Service Role Key to `.env.local`
5. Run the migration:
   - Go to SQL Editor in Supabase dashboard
   - Run the SQL from `supabase/migrations/001_initial_schema.sql`
6. Create a storage bucket:
   - Go to Storage in Supabase dashboard
   - Create a bucket named `qr-codes`
   - Set it to public or configure policies as needed

#### Paystack Setup
1. Sign up at [paystack.com](https://paystack.com)
2. Go to Settings > Developer > API Keys
3. Copy your Test/Live Secret Key and Public Key to `.env.local`

5. Configure admin users:
   - Add your Clerk user IDs (comma-separated) to `ADMIN_USER_IDS` in `.env.local`
   - You can find your user ID in Clerk dashboard after signing in

6. Run the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

The application uses the following tables:

- **qr_codes**: Stores generated QR code records
- **payments**: Tracks payment transactions

See `supabase/migrations/001_initial_schema.sql` for the complete schema.

## Security Features

- **Rate Limiting**: 
  - General API: 100 requests per 15 minutes
  - QR Generation: 10 requests per minute
  - Payment: 5 requests per minute
- **CSRF Protection**: Origin and referer validation
- **Row Level Security**: Users can only access their own data
- **Authentication**: Clerk-based authentication
- **Input Validation**: All inputs are validated and sanitized

## Admin Dashboard

Access the admin dashboard at `/admin` to view:
- Total revenue and transactions
- User statistics
- QR code generation stats
- Payment history with filtering

Only users listed in `ADMIN_USER_IDS` can access the admin dashboard.

## Project Structure

```
qrcode-generator/
├── app/
│   ├── api/
│   │   ├── admin/          # Admin API routes
│   │   ├── paystack/       # Paystack payment routes
│   │   └── qr/             # QR code generation routes
│   ├── admin/              # Admin dashboard
│   ├── components/         # React components
│   ├── sign-in/           # Clerk sign-in page
│   ├── sign-up/           # Clerk sign-up page
│   └── payment/            # Payment callback
├── lib/
│   └── supabase/          # Supabase client configuration
├── middleware.ts           # Rate limiting and security
└── supabase/
    └── migrations/        # Database migrations
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key | Yes |
| `CLERK_SECRET_KEY` | Clerk secret key | Yes |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `PAYSTACK_SECRET_KEY` | Paystack secret key | Yes |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Paystack public key | Yes |
| `NEXT_PUBLIC_APP_URL` | Application URL | Yes |
| `ADMIN_USER_IDS` | Comma-separated admin user IDs | Yes |

## Building for Production

```bash
npm run build
npm start
```

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
