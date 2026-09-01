import { existsSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * The LANDING's import doctrine, enforced (2026-09-01, pre-launch).
 *
 * The landing-performance rule is stricter than the arcs' and had the weaker
 * enforcement: the WebGL corridor stack (three/R3F/drei/postprocessing) and
 * the Supabase client must stay OUT of the landing's First Load JS, and until
 * this test that was prose — `arcs-import-doctrine.test.ts` guards
 * `components/arcs/**` mechanically while the marketing route was protected
 * by comments (`lib/brandmark/journey.ts:42`, `useCorridorMount.tsx`).
 *
 * Unlike the arcs guard this one is a GRAPH property, not a directory ban:
 * plenty of R3F legitimately lives under `components/landing/**` — behind
 * `React.lazy` — so the question is REACHABILITY. We BFS the static import
 * graph from `app/(marketing)/page.tsx`, skipping dynamic `import()` edges
 * (that is the whole point of the seam), and assert:
 *
 *   1. three/R3F/postprocessing are statically reachable NOWHERE — server
 *      or client, they would land in a bundle this route pays for.
 *   2. `@supabase/*` is reachable only OUTSIDE the "use client" region —
 *      the page (a Server Component) reads celestial slots through
 *      `lib/supabase.ts`, which never reaches the browser; the client tree
 *      goes through the dependency-free `lib/auth/authBridge.ts` instead.
 *
 * Client-ness propagates: a module is in the client region if it declares
 * "use client" or is imported (statically) by a client-region module.
 */

const ROOT = join(__dirname, "..", "..");
const ENTRY = "app/(marketing)/page.tsx";

const BANNED_EVERYWHERE = [/^three(\/|$)/, /^@react-three\//, /^postprocessing(\/|$)/];
const BANNED_IN_CLIENT = [/^@supabase\//];

const EXTENSIONS = [".ts", ".tsx", ".mjs", ".js", ".jsx"];

function resolveSpecifier(fromFile: string, spec: string): string | null {
  // Only follow paths into this repo: the alias and relative paths.
  let base: string | null = null;
  if (spec.startsWith("@/")) base = join(ROOT, spec.slice(2));
  else if (spec.startsWith("./") || spec.startsWith("../")) base = resolve(dirname(fromFile), spec);
  else return null; // bare package (react, next/*, three, …) — not a file edge
  if (/\.(css|svg|png|jpe?g|webp|avif|mp4|webm|glb|woff2?)$/.test(base)) return null;
  const candidates = [
    base,
    ...EXTENSIONS.map((e) => base + e),
    ...EXTENSIONS.map((e) => join(base!, "index" + e)),
  ];
  for (const c of candidates) {
    if (existsSync(c) && /\.(ts|tsx|mjs|js|jsx)$/.test(c)) return c;
  }
  return null;
}

/** Static import/export-from specifiers. Dynamic `import(...)` is deliberately
 *  NOT matched — the corridor's lazy seam is the exception being protected.
 *  `import type` / `export type` are skipped too: they are erased at build
 *  and cost zero bytes (AuthProvider's `import type { Session }` is the
 *  documented legitimate case — its runtime path is lib/auth/authBridge). */
function staticSpecifiers(source: string): string[] {
  const specs: string[] = [];
  let m: RegExpExecArray | null;
  const re = /^\s*import\s+(type\s+)?(?:[\s\S]*?\sfrom\s*)?["']([^"']+)["']/gm;
  while ((m = re.exec(source))) if (!m[1]) specs.push(m[2]!);
  const re2 = /^\s*export\s+(type\s+)?(?:[\s\S]*?\sfrom\s*)["']([^"']+)["']/gm;
  while ((m = re2.exec(source))) if (!m[1]) specs.push(m[2]!);
  return specs;
}

interface Node {
  file: string;
  client: boolean;
}

function walkGraph() {
  const entryAbs = join(ROOT, ENTRY);
  const seen = new Map<string, boolean>(); // file → client-region flag
  const offendersEverywhere: string[] = [];
  const offendersClient: string[] = [];
  const supabaseServerFiles: string[] = [];

  const queue: Node[] = [{ file: entryAbs, client: false }];
  while (queue.length > 0) {
    const { file, client } = queue.shift()!;
    const prior = seen.get(file);
    // Re-visit only if a file first seen as server turns out client-reachable
    // (client-ness widens the ban list).
    if (prior !== undefined && (prior || !client)) continue;
    const source = readFileSync(file, "utf8");
    const isClient = client || /^\s*["']use client["']/m.test(source);
    seen.set(file, isClient);

    const rel = relative(ROOT, file).split(sep).join("/");
    for (const spec of staticSpecifiers(source)) {
      if (BANNED_EVERYWHERE.some((re) => re.test(spec))) {
        offendersEverywhere.push(`${rel} → ${spec}`);
      }
      if (BANNED_IN_CLIENT.some((re) => re.test(spec))) {
        if (isClient) offendersClient.push(`${rel} → ${spec}`);
        else supabaseServerFiles.push(rel);
      }
      const target = resolveSpecifier(file, spec);
      if (target) queue.push({ file: target, client: isClient });
    }
  }
  return { seen, offendersEverywhere, offendersClient, supabaseServerFiles };
}

describe("the landing's import doctrine", () => {
  const graph = walkGraph();

  it("walks a real graph (a guard over nothing is worse than no guard)", () => {
    // The audited static graph from the marketing page was ~200 modules; a
    // collapse below half of that means the walker broke, not the page.
    expect(graph.seen.size).toBeGreaterThan(100);
  });

  it("keeps three/R3F/postprocessing statically unreachable from the landing", () => {
    expect(graph.offendersEverywhere, graph.offendersEverywhere.join("\n")).toEqual([]);
  });

  it("keeps the Supabase client out of the landing's client region", () => {
    expect(graph.offendersClient, graph.offendersClient.join("\n")).toEqual([]);
    // …and the server-side read path stays exactly where it is known to be:
    // lib/supabase.ts, reached from the Server Component. Growing this list
    // is a decision, not a drift.
    expect([...new Set(graph.supabaseServerFiles)]).toEqual(["lib/supabase.ts"]);
  });
});
