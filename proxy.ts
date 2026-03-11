import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function resolveHostname(request: NextRequest) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host") ?? "";

  return host.split(":")[0].toLowerCase();
}

function isStaticAsset(pathname: string) {
  return /\.[^/]+$/.test(pathname);
}

export function proxy(request: NextRequest) {
  const hostname = resolveHostname(request);
  const isChatHost = hostname.startsWith("chat.");
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    isStaticAsset(pathname)
  ) {
    return NextResponse.next();
  }

  if (pathname === "/") {
    const destination = request.nextUrl.clone();
    destination.pathname = isChatHost ? "/chat" : "/home";
    return NextResponse.rewrite(destination);
  }

  if (isChatHost && pathname.startsWith("/c/")) {
    const destination = request.nextUrl.clone();
    destination.pathname = `/chat${pathname}`;
    return NextResponse.rewrite(destination);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image).*)"],
};