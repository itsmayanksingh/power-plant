import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const token = request.cookies.get("accessToken")?.value;
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

  if (pathname.startsWith("/login") && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

