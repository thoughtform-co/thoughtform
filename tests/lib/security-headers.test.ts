import { describe, expect, it } from "vitest";

import {
  buildContentSecurityPolicy,
  buildSecurityHeaders,
  ERA_MEDIA_ORIGIN,
} from "@/lib/security/headers";
import { ERA_MEDIA_STORAGE_ORIGIN } from "@/lib/voidwalker/characterEras";

/**
 * Security headers wired into `next.config.mjs`. These are
 * security-critical defaults — pin the directives so a refactor
 * cannot silently widen the policy.
 */

describe("buildContentSecurityPolicy", () => {
  it("includes the always-on directives", () => {
    const csp = buildContentSecurityPolicy();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("upgrade-insecure-requests");
  });

  it("allows Supabase REST and realtime websockets in connect-src", () => {
    const csp = buildContentSecurityPolicy();
    expect(csp).toMatch(/connect-src[^;]*https:\/\/\*\.supabase\.co/);
    expect(csp).toMatch(/connect-src[^;]*wss:\/\/\*\.supabase\.co/);
  });

  it("permits Supabase signed-URL images and data: URIs", () => {
    const csp = buildContentSecurityPolicy();
    expect(csp).toMatch(/img-src[^;]*https:\/\/\*\.supabase\.co/);
    expect(csp).toMatch(/img-src[^;]*data:/);
    expect(csp).toMatch(/img-src[^;]*blob:/);
  });

  /* ⚠ THESE TWO PIN A WIDENING, WHICH IS WHAT THIS FILE COULD NOT CATCH.
     Every assertion above is directive-scoped (`[^;]*`), so ADDING a
     directive — or adding a host to one nobody pinned — broke nothing, and
     `media-src` and `frame-src` were both unpinned. That is the opposite of
     this file's stated job. The exact-list matches below mean a new media
     origin or a second embeddable host has to come here and argue for
     itself; a host appended silently fails instead. */
  it("keeps media self-hosted, plus ONE named bucket the owner chose (ADR-082 U34)", () => {
    const csp = buildContentSecurityPolicy();
    // data: is the hologram codec probe (inline content, not a remote host).
    // The one remote origin is the site's own Supabase project, named in full:
    // the owner's "stream from Supabase" for the era stage's films, 2026-09-22.
    expect(csp).toContain(`media-src 'self' blob: data: ${ERA_MEDIA_ORIGIN};`);
    const media = /media-src([^;]*)/.exec(csp)?.[1] ?? "";
    // ⚠ Exactly that origin and no other — and never a wildcard, which would
    // let any project on the platform serve video here.
    expect(media.match(/https?:\/\/[^\s;]+/g)).toEqual([ERA_MEDIA_ORIGIN]);
    expect(media).not.toContain("*");
  });

  it("names the same media origin the era registry allows a video to stream from", () => {
    // The registry is zero-import, so it carries its own copy; one string.
    expect(ERA_MEDIA_STORAGE_ORIGIN).toBe(ERA_MEDIA_ORIGIN);
  });

  it("frames exactly one origin: the owner's own film, cookie-free (ADR-074 U2)", () => {
    const csp = buildContentSecurityPolicy();
    expect(csp).toContain("frame-src https://www.youtube-nocookie.com;");
    // The cookie-setting host is the whole reason `-nocookie` is named.
    expect(csp).not.toMatch(/frame-src[^;]*https:\/\/www\.youtube\.com/);
  });

  it("scripts come from self plus exactly one host: Vercel measurement", () => {
    const prod = buildContentSecurityPolicy({ allowUnsafeEval: false });
    // 'wasm-unsafe-eval' is the self-hosted Draco decoder (wasm-only, never
    // JS eval); the one external host is Vercel measurement.
    expect(prod).toContain(
      "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://va.vercel-scripts.com;"
    );
  });

  it("opts in to 'unsafe-eval' for dev (HMR / fast refresh) but never in prod", () => {
    const dev = buildContentSecurityPolicy({ allowUnsafeEval: true });
    expect(dev).toContain("'unsafe-eval'");
    const prod = buildContentSecurityPolicy({ allowUnsafeEval: false });
    expect(prod).not.toContain("'unsafe-eval'");
  });
});

describe("buildSecurityHeaders", () => {
  it("emits the canonical baseline headers in production", () => {
    const headers = buildSecurityHeaders({ isDevelopment: false });
    const map = Object.fromEntries(headers.map((h) => [h.key, h.value]));

    expect(map["X-Content-Type-Options"]).toBe("nosniff");
    expect(map["X-Frame-Options"]).toBe("DENY");
    expect(map["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(map["Permissions-Policy"]).toContain("camera=()");
    expect(map["Strict-Transport-Security"]).toContain("max-age=63072000");
    // Default mode = report-only.
    expect(map["Content-Security-Policy-Report-Only"]).toContain("default-src 'self'");
    expect(map["Content-Security-Policy"]).toBeUndefined();
  });

  it("omits HSTS in development so localhost http stays usable", () => {
    const headers = buildSecurityHeaders({ isDevelopment: true });
    const map = Object.fromEntries(headers.map((h) => [h.key, h.value]));
    expect(map["Strict-Transport-Security"]).toBeUndefined();
  });

  it("supports enforced CSP (Content-Security-Policy) when explicitly opted in", () => {
    const headers = buildSecurityHeaders({ isDevelopment: false, enforceCsp: true });
    const map = Object.fromEntries(headers.map((h) => [h.key, h.value]));
    expect(map["Content-Security-Policy"]).toContain("default-src 'self'");
    expect(map["Content-Security-Policy-Report-Only"]).toBeUndefined();
  });
});
