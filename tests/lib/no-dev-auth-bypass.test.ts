import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * There is no development auth bypass (ADR-003, amendment 2026-09-24).
 *
 * `isAuthorized` returned `true` for every caller under `NODE_ENV=development`
 * — on a dev server that `next dev` binds to every interface by default and
 * that runs with the production service-role key. Twenty-nine admin routes
 * were open to anyone on the same Wi-Fi. The bypass is deleted, along with
 * the fake dev user in `getServerUser`, three inline `!== "development"`
 * clauses on the survey items routes and five client-side gates that
 * short-circuited on the same test. This walk is what stops one coming back
 * under a new name: a route, a guard or an admin gate that keys on
 * `NODE_ENV === "development"` fails here.
 *
 * ⚠ The two allowed sites are dev-ONLY features, not auth: a bench route that
 * 404s outside development, and a panel that renders nowhere else.
 */
const ROOT = join(__dirname, "..", "..");
const WALK = [
  "lib/auth-server.ts",
  "lib/api/guards.ts",
  "app/api",
  "app/(admin)",
  "components/admin",
];
const ALLOWED: Record<string, number> = {
  "app/api/trinny-bench/_lib/bench.ts": 1, // devOnly(): a 404 outside development
  "components/admin/AdminGate.tsx": 1, // DevOnlyGate: a dev-only panel
};
const DEV = /NODE_ENV\s*[!=]==\s*["']development["']/g;

const strip = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");

function walk(rel: string): string[] {
  const abs = join(ROOT, rel);
  if (statSync(abs).isFile()) return [rel];
  return readdirSync(abs).flatMap((name) => {
    const child = `${rel}/${name}`;
    if (statSync(join(ROOT, child)).isDirectory()) return walk(child);
    return /\.(ts|tsx)$/.test(name) ? [child] : [];
  });
}

describe("no development auth bypass (ADR-003 amendment)", () => {
  const files = WALK.flatMap(walk);

  it("walks the routes, the guards and the admin gates", () => {
    expect(files.length).toBeGreaterThan(40);
    expect(files).toContain("lib/auth-server.ts");
    expect(files).toContain("app/api/shape-presets/route.ts");
    expect(files).toContain("app/(admin)/layout.tsx");
  });

  it("no route, guard or gate keys on NODE_ENV === development", () => {
    for (const f of files) {
      const hits = (strip(readFileSync(join(ROOT, f), "utf8")).match(DEV) ?? []).length;
      expect(hits, `${f}: ${hits} development check(s)`).toBe(ALLOWED[f] ?? 0);
    }
  });

  it("isAuthorized IS the strict verifier, and getServerUser invents no user", () => {
    const src = strip(readFileSync(join(ROOT, "lib/auth-server.ts"), "utf8"));
    expect(src).toMatch(
      /export async function isAuthorized\(request: Request\): Promise<boolean> \{\s*return verifyAllowlistedBearer\(request\);\s*\}/
    );
    expect(src).not.toMatch(/dev@example\.com/);
    expect(src).not.toMatch(/development/);
  });

  it("the admin UI's once token-less fetches go through adminFetch", () => {
    // These five sent no token at all: they worked only through the bypass
    // and answered 401 in production. A bare `fetch("/api/` in any of them is
    // one of them coming back.
    const sites = [
      "app/(admin)/orrery/page.tsx",
      "app/(admin)/orrery/GatewayLabTab.tsx",
      "app/(admin)/astrogation/_components/bridge/useBridgeState.ts",
      "app/(admin)/astrogation/_hooks/useReferenceMatch.ts",
      "app/(admin)/astrogation/_components/SurveyView.tsx",
    ];
    for (const f of sites) {
      const src = strip(readFileSync(join(ROOT, f), "utf8"));
      expect(src, f).toContain('from "@/lib/auth/adminFetch"');
      expect(src, `${f} still fetches an admin route bare`).not.toMatch(
        /(?<![A-Za-z])fetch\(\s*[`"]\/api\//
      );
    }
  });
});
