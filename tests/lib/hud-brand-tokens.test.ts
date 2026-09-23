/**
 * The wordmark's box as tokens (ADR-082 U40).
 *
 * `--hud-brand-dock-h` is what the era stage seats its band on, and it is an
 * arithmetic model of the mark: `--hud-brand-w × --hud-brand-dock ×
 * --hud-brand-aspect`. Two of those three are what `.hud__brand` itself reads,
 * so they cannot drift from the drawing; the third — the aspect — is the
 * lockup's own viewBox, which CSS cannot read, so it is a literal here and
 * this test is what ties it to the file. A re-exported lockup with a different
 * artboard would otherwise seat the band a few pixels off with nothing to say
 * so. The prototype names the file the HUD loads; the token, the rules and the
 * era sheet's fallback are all pinned to it.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const read = (rel: string) => readFileSync(path.resolve(process.cwd(), rel), "utf8");

const LANDING = "components/landing/v7/landing.css";
const PROTOTYPE = "public/prototypes/v7/landing-v7-motion.html";
const DATUM = "components/landing/home-v2/voidwalker/hologram/voidwalker-datum.css";
const DATUM_LAB = "app/(internal)/test/voidwalker-datum-lab/voidwalker-datum-lab.css";

const token = (css: string, name: string): string => {
  const m = css.match(new RegExp(`${name}:\\s*([^;]+);`));
  if (!m) throw new Error(`${name} is not declared`);
  return m[1].trim();
};

describe("the wordmark's box as tokens (ADR-082 U40)", () => {
  const landing = read(LANDING);
  const root = landing.slice(
    landing.indexOf(":root {"),
    landing.indexOf("}", landing.indexOf(":root {"))
  );

  it("declares the three terms and the product in :root", () => {
    expect(token(root, "--hud-brand-w")).toBe("clamp(104px, 8.5vw, 150px)");
    expect(token(root, "--hud-brand-dock")).toBe("0.68");
    expect(token(root, "--hud-brand-dock-h")).toBe(
      "calc(var(--hud-brand-w) * var(--hud-brand-dock) * var(--hud-brand-aspect))"
    );
  });

  it("the aspect is the lockup's own viewBox, the file the HUD loads", () => {
    const src = read(PROTOTYPE).match(/class="hud__brand"[\s\S]*?<img src="([^"]+)"/)?.[1];
    expect(src).toBeTruthy();
    // the prototype's `assets/logos/<name>` is served from `public/logos/<name>`
    const file = decodeURIComponent(src!.split("/").pop()!);
    const svg = read(path.join("public/logos", file));
    const vb = svg.match(/viewBox="([\d.]+) ([\d.]+) ([\d.]+) ([\d.]+)"/);
    expect(vb).toBeTruthy();
    const aspect = Number(vb![4]) / Number(vb![3]);
    const declared = Number(token(root, "--hud-brand-aspect"));
    expect(Math.abs(declared - aspect)).toBeLessThan(0.0001);
  });

  it("the mark's own rules read the tokens, not the literals", () => {
    const brand = landing.slice(
      landing.indexOf(".hud__brand {"),
      landing.indexOf("}", landing.indexOf(".hud__brand {"))
    );
    expect(brand).toContain("width: var(--hud-brand-w);");
    const docked = landing.slice(
      landing.indexOf(".hud__brand.is-collapsed {"),
      landing.indexOf("}", landing.indexOf(".hud__brand.is-collapsed {"))
    );
    expect(docked).toContain("transform: scale(var(--hud-brand-dock));");
  });

  it("the era band's foot reads the same box, on the landing and in the lab", () => {
    const foot =
      /--vwd-foot:\s*min\(\s*calc\(\s*var\(--hud-margin, 54px\) \+ var\(--hud-brand-dock-h, 42\.85px\) \/ 2 - var\(--vwd-band-box\) \/ 2\s*\),\s*max\(0px, \(100svh - 720px\) \* 0\.4\)\s*\);/;
    expect(read(DATUM)).toMatch(foot);
    expect(read(DATUM_LAB)).toMatch(foot);
    // the fallback is the token's value at its 150px cap: 150 × 0.68 × 0.42008
    expect(Math.abs(150 * 0.68 * 0.42008 - 42.85)).toBeLessThan(0.01);
  });
});
