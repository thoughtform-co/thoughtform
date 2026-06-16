import { describe, expect, it } from "vitest";

import { buildContentSecurityPolicy, buildSecurityHeaders } from "@/lib/security/headers";

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
