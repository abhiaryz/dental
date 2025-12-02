import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // Public pages that don't require authentication
  const publicPages = ["/", "/login", "/signup", "/forgot-password", "/home"];
  const isPublicPage = publicPages.some(page => pathname === page || (page !== "/" && pathname.startsWith(page)));
  
  // Allow API auth routes
  if (pathname.startsWith("/api/auth") || pathname.startsWith("/api/clinic")) {
    return NextResponse.next();
  }

  // If on public auth page and already logged in, redirect to dashboard
  if (isLoggedIn && (pathname === "/login" || pathname.startsWith("/login") || pathname === "/signup" || pathname.startsWith("/signup"))) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // If on root page, redirect appropriately
  if (pathname === "/") {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    } else {
      return NextResponse.redirect(new URL("/login/clinic-select", req.url));
    }
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
});

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

