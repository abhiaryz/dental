import { NextRequest, NextResponse } from "next/server";

/**
 * Lightweight middleware for Edge Runtime
 * Checks for NextAuth session token without importing heavy dependencies
 * This avoids importing PrismaClient, bcryptjs, and other heavy libraries
 * that would exceed Vercel's 1 MB Edge Function size limit
 * 
 * Note: Middleware always runs on Edge Runtime in Next.js
 */
export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Check for session token cookie (NextAuth uses different cookie names in prod/dev)
  // Check both possible cookie names since we might not know the environment at build time
  const sessionTokenProd = req.cookies.get("__Secure-next-auth.session-token");
  const sessionTokenDev = req.cookies.get("next-auth.session-token");
  const isLoggedIn = !!(sessionTokenProd || sessionTokenDev);

  // Public pages that don't require authentication
  const publicPages = ["/", "/login", "/signup", "/forgot-password", "/home", "/privacy-policy", "/terms-of-service", "/verify-email", "/reset-password"];
  const isPublicPage = publicPages.some(
    (page) => pathname === page || (page !== "/" && pathname.startsWith(page))
  );

  // Allow API auth routes and static files
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/clinic") ||
    pathname.startsWith("/api/super-admin") ||
    pathname.startsWith("/super-admin") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next();
  }

  // If on root page and logged in, redirect to dashboard
  // Otherwise, allow access to the landing page
  if (pathname === "/") {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    // Allow non-authenticated users to access the landing page
    return NextResponse.next();
  }

  // If on public auth page and already logged in, redirect to dashboard
  if (
    isLoggedIn &&
    (pathname === "/login" ||
      pathname.startsWith("/login") ||
      pathname === "/signup" ||
      pathname.startsWith("/signup"))
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Allow access to public pages
  if (isPublicPage) {
    return NextResponse.next();
  }

  // Redirect to clinic selection if not authenticated and trying to access protected route
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login/clinic-select", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth API routes)
     * - api/clinic (Clinic API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    "/((?!api/auth|api/clinic|_next/static|_next/image|favicon.ico|.*\\..*|public).*)",
  ],
};

