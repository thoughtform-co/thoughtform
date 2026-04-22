import { NextResponse, type NextRequest } from "next/server";

/**
 * Defense-in-depth middleware for route protection.
 *
 * Route group layouts handle the primary auth gating client-side.
 * This middleware adds server-level enforcement:
 *   - /test/* and /archive/* are blocked entirely in production (404).
 *   - /orrery and /astrogation are allowed through (auth checked by layout + page).
 *   - /admin is public (login page).
 *   - Everything else passes through.
 */

const INTERNAL_ROUTES = ["/test", "/archive"];

function isInternalRoute(pathname: string): boolean {
  return INTERNAL_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (process.env.NODE_ENV === "production" && isInternalRoute(pathname)) {
    return NextResponse.rewrite(new URL("/not-found", request.url), {
      status: 404,
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|fonts|images|logos|videos|prototypes|api).*)",
  ],
};
