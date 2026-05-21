import createIntlMiddleware from "next-intl/middleware";
import { auth } from "@/lib/auth-config";
import { NextResponse } from "next/server";
import { routing, locales } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

const localePrefix = new RegExp(`^\\/(${locales.join("|")})`);

const protectedPaths = [
  "/dashboard",
  "/profile",
  "/meal-plans",
  "/meal-logs",
  "/diario",
  "/planes",
  "/compras",
  "/perfil",
  "/progreso",
  "/objetivos",
];

const authPaths = ["/login", "/register"];

export default auth(async (request) => {
  const session = request.auth;
  const { pathname } = request.nextUrl;

  // Allow public/internal routes
  const isPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".");

  if (isPublicRoute) return intlMiddleware(request);

  // Strip locale prefix to check route protections
  const pathWithoutLocale = pathname.replace(localePrefix, "") || "/";

  // Check if accessing protected route without auth
  const isProtected = protectedPaths.some(
    (p) => pathWithoutLocale.startsWith(p) || pathWithoutLocale === p
  );

  if (isProtected && !session) {
    const loginUrl = new URL("/login", request.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages
  const isAuth = authPaths.some(
    (p) => pathWithoutLocale.startsWith(p) || pathWithoutLocale === p
  );

  if (isAuth && session) {
    return NextResponse.redirect(
      new URL("/dashboard", request.nextUrl.origin)
    );
  }

  // Let intl middleware handle locale headers/redirects last
  return intlMiddleware(request);
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
