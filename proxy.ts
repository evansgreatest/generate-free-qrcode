import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionId, verifyCSRFToken } from "./app/utils/csrf";

// Rate limiting store (in-memory for free tier)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limit configuration
const RATE_LIMIT = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per window
  qrGeneration: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 QR codes per minute
  },
  payment: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5, // 5 payment attempts per minute
  },
};

function getRateLimitKey(request: NextRequest, type: string): string {
  // Get IP from headers (NextRequest doesn't have .ip property)
  const ip =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const path = request.nextUrl.pathname;
  return `${type}:${ip}:${path}`;
}

function checkRateLimit(
  request: NextRequest,
  type: "general" | "qr" | "payment"
): { allowed: boolean; remaining: number; resetTime: number } {
  const key = getRateLimitKey(request, type);
  const config =
    type === "general"
      ? RATE_LIMIT
      : type === "qr"
      ? RATE_LIMIT.qrGeneration
      : RATE_LIMIT.payment;

  const now = Date.now();
  const record = rateLimitStore.get(key);

  // Clean up old entries periodically
  if (Math.random() < 0.01) {
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetTime < now) {
        rateLimitStore.delete(k);
      }
    }
  }

  if (!record || record.resetTime < now) {
    // New window
    const resetTime =
      now + (type === "general" ? config.windowMs : config.windowMs);
    rateLimitStore.set(key, { count: 1, resetTime });
    return {
      allowed: true,
      remaining:
        (type === "general" ? config.maxRequests : config.maxRequests) - 1,
      resetTime,
    };
  }

  if (
    record.count >=
    (type === "general" ? config.maxRequests : config.maxRequests)
  ) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }

  record.count++;
  return {
    allowed: true,
    remaining:
      (type === "general" ? config.maxRequests : config.maxRequests) -
      record.count,
    resetTime: record.resetTime,
  };
}

// Request size limits (1MB for JSON, 10MB for file uploads)
const MAX_BODY_SIZE = 1024 * 1024; // 1MB
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Check request body size
function checkRequestSize(request: NextRequest): {
  valid: boolean;
  size?: number;
} {
  const contentLength = request.headers.get("content-length");
  if (!contentLength) {
    return { valid: true };
  }

  const size = parseInt(contentLength, 10);
  if (isNaN(size)) {
    return { valid: true }; // Can't determine size, let it through
  }

  // Allow larger sizes for file uploads
  const isFileUpload = request.headers
    .get("content-type")
    ?.includes("multipart/form-data");
  const maxSize = isFileUpload ? MAX_FILE_SIZE : MAX_BODY_SIZE;

  return {
    valid: size <= maxSize,
    size,
  };
}

// Enhanced CSRF validation with token support
function validateCSRF(request: NextRequest): boolean {
  if (request.method === "GET" || request.method === "HEAD") {
    return true; // GET requests don't need CSRF
  }

  // Check for CSRF token in header (preferred)
  const csrfToken = request.headers.get("x-csrf-token");
  if (csrfToken) {
    const sessionId = getSessionId(request);
    if (verifyCSRFToken(sessionId, csrfToken)) {
      return true;
    }
  }

  // Fallback to origin/referer check
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const host = request.headers.get("host");

  // Check origin matches host
  if (origin && host) {
    try {
      const originHost = new URL(origin).host;
      if (originHost !== host && !originHost.endsWith(`.${host}`)) {
        return false;
      }
    } catch {
      return false;
    }
  }

  // Check referer matches host
  if (referer && host) {
    try {
      const refererHost = new URL(referer).host;
      if (refererHost !== host && !refererHost.endsWith(`.${host}`)) {
        return false;
      }
    } catch {
      return false;
    }
  }

  return true;
}

// Protected routes
const isProtectedRoute = createRouteMatcher([
  "/admin(.*)",
  "/dashboard(.*)",
  "/api/qr(.*)",
  "/api/payments(.*)",
]);

// Public API routes that need rate limiting
const isPublicAPI = createRouteMatcher([
  "/api/paystack(.*)",
  "/api/qr/generate(.*)",
]);

export default clerkMiddleware(async (auth, request: NextRequest) => {
  // Check request size
  const sizeCheck = checkRequestSize(request);
  if (!sizeCheck.valid) {
    return NextResponse.json(
      { error: "Request body too large" },
      { status: 413 }
    );
  }

  // CSRF protection
  if (!validateCSRF(request)) {
    return NextResponse.json(
      { error: "Invalid request origin or missing CSRF token" },
      { status: 403 }
    );
  }

  // Rate limiting for public APIs
  if (isPublicAPI(request)) {
    const path = request.nextUrl.pathname;
    let rateLimitType: "general" | "qr" | "payment" = "general";

    if (path.includes("/qr/generate")) {
      rateLimitType = "qr";
    } else if (path.includes("/paystack")) {
      rateLimitType = "payment";
    }

    const rateLimit = checkRateLimit(request, rateLimitType);

    if (!rateLimit.allowed) {
      const response = NextResponse.json(
        {
          error: "Too many requests. Please try again later.",
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000),
        },
        { status: 429 }
      );

      response.headers.set(
        "X-RateLimit-Limit",
        rateLimitType === "general"
          ? "100"
          : rateLimitType === "qr"
          ? "10"
          : "5"
      );
      response.headers.set("X-RateLimit-Remaining", "0");
      response.headers.set("X-RateLimit-Reset", rateLimit.resetTime.toString());
      response.headers.set(
        "Retry-After",
        Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString()
      );

      return response;
    }

    // Add rate limit headers
    const response = NextResponse.next();
    response.headers.set(
      "X-RateLimit-Limit",
      rateLimitType === "general" ? "100" : rateLimitType === "qr" ? "10" : "5"
    );
    response.headers.set(
      "X-RateLimit-Remaining",
      rateLimit.remaining.toString()
    );
    response.headers.set("X-RateLimit-Reset", rateLimit.resetTime.toString());

    return response;
  }

  // Protect admin and dashboard routes
  if (isProtectedRoute(request)) {
    const { userId } = await auth();

    if (!userId) {
      const signInUrl = new URL("/sign-in", request.url);
      signInUrl.searchParams.set("redirect_url", request.url);
      return NextResponse.redirect(signInUrl);
    }

    // Check if user is admin (you can customize this logic)
    // For now, we'll check in the API routes
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
