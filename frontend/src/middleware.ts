import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const AUTH_ROUTES = ["/auth/login", "/auth/register", "/auth/sign-in"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const session = getSessionCookie(request);
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  // Extension sign-in must not redirect even when already authenticated —
  // the page needs to post the session token back to the extension.
  const isExtensionFlow =
    pathname.startsWith("/auth/sign-in") &&
    request.nextUrl.searchParams.get("source") === "extension";

  if (isAuthRoute && session && !isExtensionFlow) {
    return NextResponse.redirect(new URL("/translate", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|logos|.*\\.svg).*)",
  ],
};
