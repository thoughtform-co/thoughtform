/**
 * Routes that are LOCKED to one theme, and the attribute that says so
 * (ADR-093).
 *
 * ADR-058 gives every visitor a choice and remembers it. A client pitch
 * page is the one surface where that is wrong: it is a link handed to one
 * reader, composed in light, and a visitor arriving with `tf-theme=dark`
 * in their storage from an earlier visit to `/` would open it in a theme
 * nobody designed it in. So the lock overrides BOTH the stored preference
 * and the `?theme=` override, and it never writes storage — the reader's
 * own choice survives the visit untouched and is theirs again on `/`.
 *
 * ⚠ HAND-WRITTEN, NOT DERIVED — the same discipline as `HERO_ROUTES` in
 * `heroPreload.ts`, and for the same reason: nothing else in the codebase
 * knows a route was composed in one theme, so nothing else could say so.
 * A route that gains or loses its lock is moved here BY HAND.
 *
 * ⚠ THIS IS NOT A CONTENT DECISION IT CAN MAKE FOR ITSELF. A locked route
 * must also carry the route-scoped rule that hides the theme switch (see
 * `app/(marketing)/arcs/trinny-london/proposal/trinny-london.css`) — a lock without it
 * leaves a control that visibly does nothing, which reads as a bug rather
 * than as a decision.
 */

/** The `<html>` attribute a locked route stamps, beside `data-theme`. */
export const THEME_LOCK_ATTR = "data-theme-lock";

/**
 * The locked routes and the theme each is locked to.
 *
 * Only "light" is expressible today, and deliberately so: dark is the
 * ABSENCE of `data-theme` (ADR-058), so a dark lock would have to be a
 * removal rather than a write and the bootstrap's shape would change. If
 * a dark-locked route is ever wanted, that is its own pass.
 */
export const LIGHT_LOCKED_ROUTES = [
  "/arcs/trinny-london/proposal",
  /* A proposal is composed on paper and has no dark reading (ADR-098).
     The arc declares `theme: "light"`, which is what mounts `ThemeLock`
     and hides the switch; this row is the pre-paint half, and the
     registry test fails a locked arc that has no row here. */
  "/arcs/suri-proposal",
  "/arcs/perfect-ted-proposal",
  "/arcs/hungry-minds-proposal",
  "/arcs/pandora-proposal",
  /* The Trinny brand bench (ADR-120, Update 1): one module on the plain
     warm grey of the client's own product tiles, no sheet and no switch
     drawn. Dev-only (`(internal)/test`), but a locked route is locked
     wherever it paints, and this one paints product swatches that have to
     be read against paper. */
  "/test/trinny-bench",
] as const;

/** Strip a trailing slash the way both inline scripts do, so `/x` and
 *  `/x/` are one route. `/` stays `/`. */
export function normalizeRoutePath(pathname: string): string {
  return pathname.replace(/\/+$/, "") || "/";
}

/** Is this path locked to the light theme? */
export function isLightLockedPath(pathname: string): boolean {
  return (LIGHT_LOCKED_ROUTES as readonly string[]).includes(normalizeRoutePath(pathname));
}
