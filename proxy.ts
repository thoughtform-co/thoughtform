import { NextResponse, type NextRequest } from "next/server";

import {
  ARC_UNLOCK_PATH,
  arcGateKey,
  arcPagePath,
  arcPassCookieName,
  arcPassToken,
  arcPasswordFor,
} from "@/lib/arcs/arcGate";

/**
 * Defense-in-depth route protection.
 *
 * Route group layouts handle the primary auth gating client-side.
 * This adds server-level enforcement:
 *   - /test/* and /archive/* are blocked entirely in production (404).
 *   - /arcs/<page> asks for its password when one is set (ADR-135): the
 *     page's own `ARC_PASSWORD_<KEY>`, else `ARCS_PASSWORD`. Without either
 *     the page is served as before (the gate fails open, on purpose). The
 *     overview `/arcs` keeps its own owner gate (ADR-117).
 *   - /orrery and /astrogation are allowed through (auth checked by layout + page).
 *   - /admin is public (login page).
 *   - Everything else passes through.
 *
 * ⚠ THIS IS THE FILE FORMERLY KNOWN AS `middleware.ts`. Next 16 renamed the
 * convention — same request lifecycle, same edge runtime, same `config`
 * matcher, but the file must be `proxy.ts` and the export `proxy` or the
 * build warns and (eventually) stops running it. Comments elsewhere still
 * say "middleware-blocked"; that is this.
 */

const INTERNAL_ROUTES = ["/test", "/archive"];

function isInternalRoute(pathname: string): boolean {
  return INTERNAL_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (process.env.NODE_ENV === "production" && isInternalRoute(pathname)) {
    return NextResponse.rewrite(new URL("/not-found", request.url), {
      status: 404,
    });
  }

  const key = arcGateKey(pathname);
  if (key) {
    const password = arcPasswordFor(key, process.env);
    if (password) {
      const pass = request.cookies.get(arcPassCookieName(key))?.value;
      if (pass !== (await arcPassToken(key, password))) {
        // Back to the PAGE, never to the payload variant that was asked for,
        // and without the router's own cache-busting parameter.
        const search = new URLSearchParams(request.nextUrl.search);
        search.delete("_rsc");
        const query = search.toString();
        const unlock = new URL(ARC_UNLOCK_PATH, request.url);
        unlock.searchParams.set("next", `${arcPagePath(pathname)}${query ? `?${query}` : ""}`);
        return NextResponse.redirect(unlock, 307);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|fonts|images|logos|videos|prototypes|api).*)",
  ],
};
