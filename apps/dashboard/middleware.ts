import { NextRequest, NextResponse } from "next/server";

async function computeHmac(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Constant-time string comparison to prevent timing attacks
function timingSafeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const ba = encoder.encode(a.padEnd(256));
  const bb = encoder.encode(b.padEnd(256));
  let diff = 0;
  for (let i = 0; i < 256; i++) diff |= ba[i] ^ bb[i];
  return diff === 0 && a.length === b.length;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Auth endpoints are public (login / logout)
  if (pathname.startsWith("/api/auth")) return NextResponse.next();

  // Cron route uses Bearer token auth — intentionally excluded from cookie auth
  // See /api/cron/outreach/route.ts for its own auth logic
  if (pathname.startsWith("/api/cron")) return NextResponse.next();

  const cookie = req.cookies.get("kronos-auth")?.value;
  const secret = process.env.DASHBOARD_SECRET;

  if (!secret || !cookie) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/", req.url));
  }

  const expected = await computeHmac(secret, "kronos-authenticated");

  if (!timingSafeEqual(cookie, expected)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Add security headers to all authenticated responses
  const res = NextResponse.next();
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return res;
}

export const config = {
  matcher: [
    // Dashboard pages
    "/dashboard/:path*",
    // API routes — all protected except /api/auth and /api/cron (handled above)
    "/api/campaign/:path*",
    "/api/analytics/:path*",
    "/api/git/:path*",
    "/api/scraper/:path*",
    "/api/assets/:path*",
    "/api/settings",          // exact match — was missing before
    "/api/settings/:path*",
    "/api/agent/:path*",      // JARVIS chat — was completely unprotected
    "/api/memory/:path*",
  ],
};
