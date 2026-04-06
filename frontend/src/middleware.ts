import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const AUTH_ROUTES = ["/auth/login", "/auth/register"];
const PROTECTED_ROUTES = ["/history", "/settings"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const session = getSessionCookie(request);

  if (AUTH_ROUTES.some((r) => pathname.startsWith(r)) && session) {
    return NextResponse.redirect(new URL("/translate", request.url));
  }

  if (PROTECTED_ROUTES.some((r) => pathname.startsWith(r)) && !session) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|logos|.*\\.svg).*)",
  ],
};
