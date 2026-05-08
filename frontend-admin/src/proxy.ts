import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function parseJwtPayload(token: string | undefined) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const json = atob(padded);
    return JSON.parse(json) as { role?: string };
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const token = request.cookies.get("accessToken")?.value;
  const payload = parseJwtPayload(token);
  const role = payload?.role;
  const pathname = request.nextUrl.pathname;

  const isPublic = pathname.startsWith("/login") || pathname.startsWith("/_next") || pathname === "/favicon.ico";
  const isRoot = pathname === "/";

  if (isRoot && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isRoot && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!isPublic && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!isPublic && role === "employee") {
    const denied = new URL("/login?denied=panel", request.url);
    denied.searchParams.set("denied", "panel");
    return NextResponse.redirect(denied);
  }

  if (pathname.startsWith("/login") && token) {
    if (role === "employee") {
      return NextResponse.redirect(new URL("/login?denied=panel", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

