import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "crackers-admin-jwt-secret-key-production-2026";
const secretKey = new TextEncoder().encode(JWT_SECRET);
const ADMIN_COOKIE_NAME = "admin_session";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Handle CSRF protection on admin API routes
  if (pathname.startsWith("/api/admin")) {
    const method = req.method.toUpperCase();
    if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
      const origin = req.headers.get("origin");
      const host = req.headers.get("host");
      if (origin && host) {
        const originHost = new URL(origin).host;
        if (originHost !== host) {
          return NextResponse.json(
            { ok: false, code: "CSRF_FORBIDDEN", message: "Cross-origin requests not allowed." },
            { status: 403 }
          );
        }
      }
    }
    return NextResponse.next();
  }

  // Only handle /admin routes
  if (pathname.startsWith("/admin")) {
    const response = NextResponse.next();

    // Enforce noindex on all admin pages
    response.headers.set("X-Robots-Tag", "noindex, nofollow");

    // Allow login page without authentication
    if (pathname === "/admin/login") {
      const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
      if (token) {
        try {
          await jwtVerify(token, secretKey);
          // If already logged in, redirect to dashboard
          return NextResponse.redirect(new URL("/admin", req.url));
        } catch {
          // Token invalid, allow staying on login page
        }
      }
      return response;
    }

    // Protect all other /admin routes
    const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    if (!token) {
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      await jwtVerify(token, secretKey);
      return response;
    } catch {
      // Token invalid or expired
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("from", pathname);
      const redirectRes = NextResponse.redirect(loginUrl);
      redirectRes.cookies.delete(ADMIN_COOKIE_NAME);
      return redirectRes;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
