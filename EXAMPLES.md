# Next.js 16 Features - Code Examples

Practical examples from your QR Code Generator app showing how each feature works.

---

## 1. Cache Tags - Before & After

### ❌ Before: No Cache Invalidation

```typescript
// app/api/user/qr-codes/route.ts (OLD)
export async function GET(request: NextRequest) {
  const { data: qrCodes } = await supabase
    .from('qr_codes')
    .select('*')
    .eq('user_id', userId);

  return NextResponse.json({ qrCodes });
  // ❌ No cache tag - dashboard might show stale data
}
```

**Problem:** User generates QR code → Dashboard still shows old list → User has to refresh manually.

### ✅ After: With Cache Tags

```typescript
// app/api/user/qr-codes/route.ts (NEW)
export async function GET(request: NextRequest) {
  const { data: qrCodes } = await supabase
    .from('qr_codes')
    .select('*')
    .eq('user_id', userId);

  const response = NextResponse.json({ qrCodes });
  
  // ✅ Add cache tag
  response.headers.set('x-cache-tag', `user-qr-codes:${userId}`);
  
  return response;
}
```

**Solution:** Tag the response → Can invalidate it later → Dashboard shows fresh data automatically.

---

## 2. Cache Invalidation - The Magic

### When QR Code is Generated

```typescript
// app/api/qr/generate/route.ts
export async function POST(request: NextRequest) {
  // ... generate QR code ...
  
  // Save QR code to database
  const { data: qrRecord } = await supabase
    .from('qr_codes')
    .insert({ ... });

  // ✅ Invalidate cache so dashboard shows new QR code immediately
  if (userId) {
    invalidateUserQRCodes(userId);  // ← This clears the cache!
    invalidateUserPayments(userId);
  }

  return NextResponse.json({ success: true, qrCode: qrRecord });
}
```

**What happens:**
1. QR code saved to database ✅
2. Cache tag `user-qr-codes:userId` invalidated ✅
3. Next time user visits dashboard → Fresh data fetched ✅
4. User sees new QR code without manual refresh! 🎉

---

## 3. Server Actions for Cache Management

### The Server Action

```typescript
// app/actions/cacheActions.ts
"use server";

import { updateTag } from 'next/cache';

export async function invalidateUserQRCodes(userId: string) {
  // ✅ updateTag() is Server Actions-only
  // This provides "read-your-writes" semantics
  updateTag(`user-qr-codes:${userId}`);
  return { success: true };
}
```

**Why Server Actions?**
- `updateTag()` can ONLY be called from Server Actions
- Server Actions run on the server (secure)
- Perfect for cache invalidation after mutations

### Using It from API Routes

```typescript
// app/api/qr/generate/route.ts
import { invalidateUserQRCodes } from '@/app/actions/cacheActions';

export async function POST(request: NextRequest) {
  // ... generate QR code ...
  
  // Call server action to invalidate cache
  // Fire and forget - don't await (non-blocking)
  invalidateUserQRCodes(userId).catch(console.error);
  
  return NextResponse.json({ success: true });
}
```

**Note:** We don't `await` because:
- Cache invalidation is best-effort
- We don't want to block the response
- If it fails, user still gets their QR code

---

## 4. Two Types of Cache Invalidation

### `updateTag()` - Immediate (Read-Your-Writes)

```typescript
// app/actions/cacheActions.ts
import { updateTag } from 'next/cache';

export async function invalidateUserQRCodes(userId: string) {
  // ✅ Immediate invalidation
  // User sees changes RIGHT NOW
  updateTag(`user-qr-codes:${userId}`);
}
```

**Use case:** User generates QR code → Should see it immediately in dashboard

**Timeline:**
1. User generates QR code
2. `updateTag()` called
3. Cache invalidated immediately
4. User navigates to dashboard
5. **Fresh data shown** ✅

### `revalidateTag()` - Background (Stale-While-Revalidate)

```typescript
// app/actions/cacheActions.ts
import { revalidateTag } from 'next/cache';

export async function revalidateAdminStats() {
  // ✅ Background revalidation
  // Users see cached data, fresh data loads in background
  revalidateTag('admin-stats', 'max');
}
```

**Use case:** Admin stats page → Can show slightly stale data, refresh in background

**Timeline:**
1. User visits admin stats
2. Sees cached data immediately (fast!)
3. Fresh data loads in background
4. Next user gets fresh data

**Cache Life Profiles:**
```typescript
revalidateTag('stats', 'max');           // Long-lived
revalidateTag('news', 'hours');          // Refreshes every few hours
revalidateTag('analytics', 'days');      // Refreshes daily
revalidateTag('products', { expire: 3600 }); // Custom: 1 hour
```

---

## 5. React Compiler - Automatic Optimization

### Before: Manual Memoization

```typescript
// ❌ Before: You'd write this manually
import { useMemo, useCallback } from 'react';

function QRCodeGenerator() {
  const [data, setData] = useState();
  
  // Manual memoization
  const expensiveValue = useMemo(() => {
    return heavyCalculation(data);
  }, [data]);
  
  // Manual callback memoization
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    // ... submit logic
  }, []);
  
  return <form onSubmit={handleSubmit}>...</form>;
}
```

### After: Automatic (React Compiler)

```typescript
// ✅ After: React Compiler does it automatically
function QRCodeGenerator() {
  const [data, setData] = useState();
  
  // ✅ Automatically memoized by React Compiler
  const expensiveValue = heavyCalculation(data);
  
  // ✅ Automatically memoized by React Compiler
  const handleSubmit = (e) => {
    e.preventDefault();
    // ... submit logic
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
}
```

**What React Compiler does:**
- Analyzes your code
- Finds expensive calculations
- Automatically wraps them in `useMemo()`
- Automatically wraps callbacks in `useCallback()`
- Prevents unnecessary re-renders

**Result:** Same performance, less code! 🎉

---

## 6. Cache Tags in Your App

### User QR Codes

```typescript
// app/api/user/qr-codes/route.ts
const response = NextResponse.json({
  qrCodes: qrCodes || [],
  total: count || 0,
});

// Tag: user-qr-codes:{userId}
response.headers.set('x-cache-tag', `user-qr-codes:${userId}`);
return response;
```

**Invalidated when:**
- User generates new QR code
- User deletes QR code (if you add that feature)

### User Payments

```typescript
// app/api/user/payments/route.ts
const response = NextResponse.json({
  payments: payments || [],
  total: count || 0,
});

// Tag: user-payments:{userId}
response.headers.set('x-cache-tag', `user-payments:${userId}`);
return response;
```

**Invalidated when:**
- User completes payment
- QR code is generated (payment linked)

### Admin Stats

```typescript
// app/api/admin/stats/route.ts
const response = NextResponse.json({
  totalQRCodes: totalQRCodes || 0,
  totalUsers: uniqueUsers,
  totalRevenue,
});

// Tag: admin-stats
response.headers.set('x-cache-tag', 'admin-stats');
response.headers.set('Cache-Control', 'private, s-maxage=60, stale-while-revalidate=300');
return response;
```

**Revalidated when:**
- Admin manually refreshes (can use `revalidateTag()`)
- Or automatically with stale-while-revalidate

---

## 7. Complete Flow Example

### User Generates QR Code

```typescript
// 1. User submits form
// app/components/QRCodeGenerator.tsx
const handleSubmit = async (e) => {
  e.preventDefault();
  
  // 2. Call API to generate QR code
  const response = await fetch('/api/qr/generate', {
    method: 'POST',
    body: JSON.stringify({ qrData, qrType, paymentReference }),
  });
  
  const result = await response.json();
  // ✅ QR code generated!
};

// 3. API generates QR code
// app/api/qr/generate/route.ts
export async function POST(request: NextRequest) {
  // ... generate QR code ...
  
  // Save to database
  const { data: qrRecord } = await supabase
    .from('qr_codes')
    .insert({ ... });
  
  // ✅ Invalidate cache
  invalidateUserQRCodes(userId);
  invalidateUserPayments(userId);
  
  return NextResponse.json({ success: true, qrCode: qrRecord });
}

// 4. User navigates to dashboard
// app/dashboard/page.tsx
const { data: qrCodesData } = useSWR('/api/user/qr-codes', fetcher);
// ✅ Fresh data fetched (cache was invalidated!)
// ✅ New QR code appears immediately!
```

**Result:** User sees their new QR code without manual refresh! 🎉

---

## 8. Configuration Example

### Complete `next.config.mjs`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ Turbopack File System Caching
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },

  // ✅ React Compiler
  reactCompiler: true,

  // ✅ Cache Components
  cacheComponents: true,

  // ✅ Image Configuration (Next.js 16 defaults)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
    minimumCacheTTL: 14400,  // 4 hours
    qualities: [75],         // Single quality
    maximumRedirects: 3,      // Max redirects
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // ... more headers
        ],
      },
    ];
  },
};

export default nextConfig;
```

---

## 9. Testing Examples

### Test Cache Invalidation

```typescript
// Test scenario:
// 1. Open dashboard → Note current QR codes
// 2. Generate new QR code
// 3. Navigate back to dashboard
// 4. Expected: New QR code appears without refresh

// In your browser console:
console.log('Before generating QR code');
// Note: Dashboard shows 5 QR codes

// Generate QR code...
// Cache invalidated automatically

// Navigate to dashboard
console.log('After generating QR code');
// Expected: Dashboard shows 6 QR codes (new one added!)
```

### Test React Compiler

```typescript
// Check if React Compiler is working:
// 1. Build your app: npm run build
// 2. Look for React Compiler messages in output
// 3. Check that components don't re-render unnecessarily

// In your component:
function TestComponent() {
  console.log('Component rendered');
  // With React Compiler: Only renders when necessary
  // Without: Might render more often
}
```

### Test Turbopack Caching

```bash
# First build (no cache)
npm run dev
# Time: ~5 seconds

# Stop server (Ctrl+C)

# Second build (with cache)
npm run dev
# Time: ~2 seconds (faster!)
```

---

## 10. Common Patterns

### Pattern 1: Invalidate After Create

```typescript
// After creating something, invalidate related caches
export async function createQRCode(data) {
  // Create in database
  await supabase.from('qr_codes').insert(data);
  
  // ✅ Invalidate cache
  invalidateUserQRCodes(userId);
  
  return { success: true };
}
```

### Pattern 2: Invalidate After Update

```typescript
// After updating something, invalidate related caches
export async function updateQRCode(id, data) {
  // Update in database
  await supabase.from('qr_codes').update(data).eq('id', id);
  
  // ✅ Invalidate cache
  invalidateUserQRCodes(userId);
  
  return { success: true };
}
```

### Pattern 3: Invalidate After Delete

```typescript
// After deleting something, invalidate related caches
export async function deleteQRCode(id) {
  // Delete from database
  await supabase.from('qr_codes').delete().eq('id', id);
  
  // ✅ Invalidate cache
  invalidateUserQRCodes(userId);
  
  return { success: true };
}
```

### Pattern 4: Revalidate Public Data

```typescript
// For public data that can be slightly stale
export async function getPublicStats() {
  // Can use revalidateTag() for background refresh
  revalidateTag('public-stats', 'hours');
  
  return stats;
}
```

---

## Key Takeaways

1. **Cache Tags** = Group cached data, invalidate when needed
2. **`updateTag()`** = Immediate invalidation (read-your-writes)
3. **`revalidateTag()`** = Background refresh (stale-while-revalidate)
4. **React Compiler** = Automatic optimizations
5. **Turbopack Caching** = Faster dev builds
6. **Cache Components** = Explicit caching control

All working together to make your app faster and more responsive! 🚀

