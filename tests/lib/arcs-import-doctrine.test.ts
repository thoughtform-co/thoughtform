import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * The arcs' import doctrine, enforced.
 *
 * `.claude/rules/arcs.md` has banned three.js under `components/arcs/` and
 * `lib/arcs/` since ADR-072 — the landing-performance seam that keeps a
 * ~270 kB WebGL graph out of the arc route's First Load JS. Until now that
 * ban was a RULE with no mechanism, so a stray `import * as THREE` would
 * have passed CI and regressed the budget silently.
 *
 * ADR-080 opens exactly one door — the trajectory instrument — and the whole
 * safety of that door is that it is DYNAMIC. This test is what keeps the
 * distinction real: a static import fails, an `import()` inside `dynamic()`
 * does not.
 */

const ROOT = join(__dirname, "..", "..");
const GUARDED = ["components/arcs", "lib/arcs"];

/** Bare specifiers no file under the guarded trees may STATICALLY import. */
const BANNED = [/^three(\/|$)/, /^@react-three\//, /^postprocessing(\/|$)/, /^@supabase\//];

/**
 * The enumerated exceptions, and why each is safe:
 *
 *  - `ArcHoloProgramMount.tsx` reaches the scene through `next/dynamic`, so
 *    the graph is a lazy chunk (ADR-080). Its own static imports are still
 *    walked — only the specifier below is forgiven.
 *  - `holoProgramGeom` / `hoverRef` are the scene's THREE-FREE modules (pure
 *    arithmetic and a module-scope ref, the `journeyScalars` transport
 *    pattern), so importing them statically costs nothing.
 */
const HOLO_SCENE = /@\/components\/holo-program\/HoloProgramCanvas/;
const HOLO_FREE = /@\/components\/holo-program\/(holoProgramGeom|hoverRef)/;

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

/** Every STATIC import specifier in a source file. `import(...)` is
 *  deliberately not matched — that is the whole point of the exception. */
function staticSpecifiers(source: string): string[] {
  const specs: string[] = [];
  const re = /^\s*import\s+(?:[\s\S]*?\sfrom\s*)?["']([^"']+)["']/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source))) specs.push(m[1]);
  const re2 = /^\s*export\s+(?:[\s\S]*?\sfrom\s*)["']([^"']+)["']/gm;
  while ((m = re2.exec(source))) specs.push(m[1]);
  return specs;
}

describe("the arcs' import doctrine", () => {
  const files = GUARDED.flatMap((d) => walk(join(ROOT, d)));

  it("finds the trees it is supposed to be guarding", () => {
    // A guard that silently walks nothing is worse than no guard.
    expect(files.length).toBeGreaterThan(20);
  });

  it("lets NO file statically import three, R3F, postprocessing or supabase", () => {
    const offenders: string[] = [];
    for (const file of files) {
      const rel = relative(ROOT, file).split(sep).join("/");
      for (const spec of staticSpecifiers(readFileSync(file, "utf8"))) {
        if (BANNED.some((re) => re.test(spec))) offenders.push(`${rel} → ${spec}`);
      }
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("keeps the holo seam DYNAMIC, and in exactly one file", () => {
    const staticReaches: string[] = [];
    let dynamicReaches = 0;

    for (const file of files) {
      const rel = relative(ROOT, file).split(sep).join("/");
      const source = readFileSync(file, "utf8");

      for (const spec of staticSpecifiers(source)) {
        if (HOLO_SCENE.test(spec)) staticReaches.push(`${rel} → ${spec}`);
        // The three-free modules are always fine; named so a reader can see
        // the distinction is deliberate rather than an oversight.
        else if (HOLO_FREE.test(spec)) continue;
      }

      if (/import\(\s*["']@\/components\/holo-program\/HoloProgramCanvas["']\s*\)/.test(source)) {
        dynamicReaches++;
        expect(rel).toBe("components/arcs/ArcHoloProgramMount.tsx");
      }
    }

    // The scene may only ever be reached lazily…
    expect(staticReaches, staticReaches.join("\n")).toEqual([]);
    // …and through the one leaf the ADR names.
    expect(dynamicReaches).toBe(1);
  });
});
