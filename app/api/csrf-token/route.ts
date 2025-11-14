import { NextRequest, NextResponse } from "next/server";
import { generateCSRFToken, getSessionId } from "@/app/utils/csrf";

/**
 * GET /api/csrf-token
 * Generate and return a CSRF token for the current session
 */
export async function GET(request: NextRequest) {
  try {
    const sessionId = getSessionId(request);
    const token = generateCSRFToken(sessionId);

    return NextResponse.json({ token });
  } catch (error) {
    console.error("CSRF token generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate CSRF token" },
      { status: 500 }
    );
  }
}

