import { auth } from "@/lib/auth-config";
import { NextResponse } from "next/server";

const protectedRoutes = ["/(dashboard)", "/profile", "/meal-plans", "/meal-logs"];
const authRoutes = ["/login", "/register"];

export default auth(async (request) => {
  const session = request.auth;
  const { pathname } = request.nextUrl;

  // Allow public routes
  const isPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".");

  if (isPublicRoute) return NextResponse.next();

  // Check if accessing protected route without auth
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname.startsWith(route.replace("/(", "/").replace(")", "")) ||
    pathname === route.replace("/(", "/").replace(")", "")
  );

  // More precise: check route group patterns
  const isDashboardRoute = pathname.startsWith("/dashboard") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/meal-plans") ||
    pathname.startsWith("/meal-logs");

  if (isDashboardRoute && !session) {
    const loginUrl = new URL("/login", request.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL("/dashboard", request.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
