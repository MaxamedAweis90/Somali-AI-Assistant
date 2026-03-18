import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

type AppVariant = "auto" | "landing" | "chat";

function resolveAppVariant(value: string | undefined): AppVariant {
  const normalized = (value ?? "auto").trim().toLowerCase();
  if (normalized === "landing" || normalized === "chat") return normalized;
  return "auto";
}

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
  const variant = resolveAppVariant(process.env.APP_VARIANT);
  const isChatHostname = hostname.startsWith("chat.") || hostname.startsWith("chat-");
  const isChatHost = variant === "chat" ? true : variant === "landing" ? false : isChatHostname;
  const { pathname } = request.nextUrl;

  const chatBaseUrl = process.env.CHAT_BASE_URL;
  const landingBaseUrl = process.env.LANDING_BASE_URL;

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

  if (variant === "landing" && chatBaseUrl) {
    if (pathname === "/chat" || pathname.startsWith("/chat/") || pathname.startsWith("/c/")) {
      const target = new URL(chatBaseUrl);
      target.pathname = pathname === "/chat" ? "/" : pathname;
      target.search = request.nextUrl.search;
      return NextResponse.redirect(target);
    }
  }

  if (variant === "chat" && landingBaseUrl) {
    if (pathname === "/home" || pathname.startsWith("/home/")) {
      return NextResponse.redirect(new URL(pathname, landingBaseUrl));
    }
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