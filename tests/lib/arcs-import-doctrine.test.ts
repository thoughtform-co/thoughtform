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
/* ADR-114 adds the sheet: it mounts the arcs' header and rail instruments
   and is served on three public routes, so it takes the same doctrine. */
const GUARDED = ["components/arcs", "lib/arcs", "components/sheet", "lib/sheet"];

/** Bare specifiers no file under the guarded trees may STATICALLY import. */
const BANNED = [/^three(\/|$)/, /^@react-three\//, /^postprocessing(\/|$)/, /^@supabase\//];

/**
 * The enumerated exceptions, and why each is safe:
 *
 *  - `ArcHoloProgramMount.tsx` reaches the trajectory's scene through
 *    `next/dynamic`, so the graph is a lazy chunk (ADR-080). Its own static
 *    imports are still walked — only the specifiers below are forgiven.
 *  - `ArcHoloStageMount.tsx` does the same for the workshop's four framing
 *    beats (ADR-130 U2), on the same terms and through the same mechanism.
 *  - The THREE-FREE modules of both folders (pure arithmetic, a label solver,
 *    a channel factory — the `journeyScalars` transport pattern) cost nothing
 *    to import statically.
 *
 * ⚠ THE SCENE MODULES ARE BANNED STATICALLY TOO, AND THAT IS NEW. ADR-080 U3
 * recorded this as left open: the old `HOLO_FREE` branch was an `else if …
 * continue` with no assertion, so a static
 * `import … from "@/components/holo-program/HoloProgramScene"` inside
 * `components/arcs/**` would have passed CI and dragged three into the route's
 * First Load JS — a ban whose one mechanism did not cover its own neighbour.
 */
const HOLO_FREE =
  /@\/components\/holo-(program\/(holoProgramGeom|hoverRef|holoLabelLayout|holoAnchorsRef|holoPalette)|stage\/(stageGeom|stageFit|stageAnchors|curveGeom|spectrumGeom))/;
/** Anything else under either folder is three-full until proven otherwise. */
const HOLO_TREE = /@\/components\/holo-(program|stage)\//;
/** The leaves the ADRs name, and the only files that may reach a scene. */
const HOLO_MOUNTS = [
  "components/arcs/ArcHoloProgramMount.tsx",
  "components/arcs/ArcHoloStageMount.tsx",
];

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

  it("keeps both holo seams DYNAMIC, and in the leaves the ADRs name", () => {
    const staticReaches: string[] = [];
    const dynamicReaches: string[] = [];

    for (const file of files) {
      const rel = relative(ROOT, file).split(sep).join("/");
      const source = readFileSync(file, "utf8");

      for (const spec of staticSpecifiers(source)) {
        if (HOLO_FREE.test(spec)) continue; // pure, and named so on purpose
        if (HOLO_TREE.test(spec)) staticReaches.push(`${rel} → ${spec}`);
      }

      const dyn =
        /import\(\s*["']@\/components\/holo-(program\/HoloProgramCanvas|stage\/HoloStageCanvas)["']\s*\)/;
      if (dyn.test(source)) dynamicReaches.push(rel);
    }

    /* ⚠ EVERY three-FULL MODULE, not just the two canvases. A static reach for
       a SCENE rather than its canvas is the hole ADR-080 U3 left open. */
    expect(staticReaches, staticReaches.join("\n")).toEqual([]);
    expect(dynamicReaches.sort()).toEqual(HOLO_MOUNTS);
  });

  it("lets no CLIENT file under the sheet import a registry (ADR-117, ADR-118)", () => {
    /* `/arcs` is the owner's page, gated on the server. A client component
       that imported a registry would put every client's name and lede into
       a PUBLIC chunk the gate cannot see — the instrument's controller reads
       everything it knows off the DOM for exactly this reason. */
    const REGISTRY =
      /^@\/lib\/(arcs|cases|sessions|musings)(\/|$)|^@\/lib\/sheet\/(arcs|home-sessions|musings)$/;
    const clientFiles = files.filter((f) => /^\s*["']use client["']/.test(readFileSync(f, "utf8")));
    const rels = clientFiles.map((f) => relative(ROOT, f).split(sep).join("/"));
    // A guard that walks nothing is worse than none: the controller must be in it.
    expect(rels).toContain("components/sheet/SheetInstrumentController.tsx");
    const offenders: string[] = [];
    for (const [i, file] of clientFiles.entries()) {
      if (!rels[i].startsWith("components/sheet/")) continue;
      for (const spec of staticSpecifiers(readFileSync(file, "utf8")))
        if (REGISTRY.test(spec)) offenders.push(`${rels[i]} → ${spec}`);
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });
});
