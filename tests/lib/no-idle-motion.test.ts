import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * ADR-080's law, mechanised (ADR-154): a figure arrives once and is then a
 * still drawing. No sheet under the figure trees may run an animation
 * forever. The terminal cursor (ADR-057's one CRT keyframe) is the pinned
 * exception; anything else that idles is named here and deleted.
 */
const ROOT = join(__dirname, "..", "..");
const TREES = ["components/instrument", "components/arcs", "components/lattice"];
const ALLOWED = new Set(["components/arcs/arcs.css:arc-cursor-blink"]);

function cssFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...cssFiles(p));
    else if (name.endsWith(".css")) out.push(p);
  }
  return out;
}

describe("nothing idles (ADR-080)", () => {
  it("no infinite animation under the figure trees but the terminal cursor", () => {
    const offenders: string[] = [];
    for (const tree of TREES) {
      for (const file of cssFiles(join(ROOT, tree))) {
        const css = readFileSync(file, "utf8");
        const rel = file.slice(ROOT.length + 1);
        for (const m of css.matchAll(
          /animation(?:-iteration-count)?\s*:\s*([^;]*infinite[^;]*);/g
        )) {
          const name =
            m[1]
              .match(/[A-Za-z][\w-]*/g)
              ?.find(
                (w) =>
                  !/^(infinite|linear|ease|steps?|alternate|both|forwards|backwards|normal|reverse|running|paused|ease-in-out|ease-in|ease-out|cubic-bezier)$/.test(
                    w
                  )
              ) ?? "?";
          if (!ALLOWED.has(`${rel}:${name}`)) offenders.push(`${rel}: ${m[1].trim()}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
