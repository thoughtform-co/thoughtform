/**
 * The sheet's ending (ADR-127) — source ratchets for what a still cannot show.
 *
 * Three things shipped wrong on every sheet route for two weeks with every
 * gate green, because every gate excluded the close: the footer's own sheet
 * was never imported (the footer rendered as bare markup), the wordmark rested
 * at the hero's column on pages with no hero, and four station links were
 * bare anchors that exist only on `/`. Each is pinned here in SOURCE, the way
 * `musings-row.test.ts` pins the landing's weld, so the next route that mounts
 * a close cannot forget the sheet, and the rise's arithmetic cannot drift
 * from the landing's.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { blocks, stripComments } from "./helpers/cssBlocks";

const ROOT = join(__dirname, "..", "..");
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");
const flat = (s: string) => s.replace(/\s+/g, "");

const SHEET = "components/sheet/sheet.css";
const INSTRUMENT = "components/sheet/instrument.css";
const FOOTER = "components/landing/v7/site-footer/site-footer.css";
const MUSINGS = "components/landing/home-v2/musings/musings.css";
const RENDERER = "components/sheet/SheetRenderer.tsx";

const SHEET_IMPORT = 'import "@/components/sheet/sheet.css";';
const FOOTER_IMPORT = 'import "@/components/landing/v7/site-footer/site-footer.css";';
const THEME_IMPORT = 'import "@/components/landing/v7/theme.css";';

/** Every route that mounts a close, and whether its body rises. */
const CLOSE_ROUTES: Record<string, boolean> = {
  "app/(marketing)/musings/page.tsx": true,
  "app/(marketing)/musings/[slug]/page.tsx": true,
  "app/(marketing)/home-sessions/page.tsx": true,
  "app/(marketing)/arcs/[slug]/page.tsx": false,
  "app/(internal)/test/subpage-kit/page.tsx": false,
};
/** The instrument (ADR-118) has no close: a monitor and a log. */
const CLOSELESS = new Set([
  "app/(marketing)/arcs/page.tsx",
  "app/(internal)/test/arcs-instrument-kit/page.tsx",
]);

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(join(ROOT, dir))) {
    const rel = join(dir, name).replace(/\\/g, "/");
    if (statSync(join(ROOT, rel)).isDirectory()) walk(rel, out);
    else if (rel.endsWith(".tsx")) out.push(rel);
  }
  return out;
}

const decls = (css: string, path: string) =>
  blocks(stripComments(css))
    .filter((b) => b.path === path)
    .map((b) => flat(b.decls))
    .join(";");
const declsEnding = (css: string, ending: string, inside: string) =>
  blocks(stripComments(css))
    .filter((b) => b.path.endsWith(ending) && b.path.includes(inside))
    .map((b) => flat(b.decls))
    .join(";");

describe("the sheet's ending (ADR-127)", () => {
  it("every route that mounts a close imports the footer's sheet after sheet.css and before theme.css", () => {
    for (const route of Object.keys(CLOSE_ROUTES)) {
      const src = read(route);
      const iSheet = src.indexOf(SHEET_IMPORT);
      const iFoot = src.indexOf(FOOTER_IMPORT);
      const iTheme = src.indexOf(THEME_IMPORT);
      expect(iSheet, `${route}: sheet.css`).toBeGreaterThan(-1);
      expect(iFoot, `${route}: site-footer.css`).toBeGreaterThan(-1);
      expect(iTheme, `${route}: theme.css`).toBeGreaterThan(-1);
      expect(iSheet < iFoot && iFoot < iTheme, `${route}: order sheet → footer → theme`).toBe(true);
    }
  });

  it("no app file mounts SheetRenderer without the footer's sheet, unless it is the closeless instrument", () => {
    const hosts = walk("app").filter((rel) => read(rel).includes("<SheetRenderer"));
    expect(hosts.length).toBeGreaterThanOrEqual(Object.keys(CLOSE_ROUTES).length);
    for (const rel of hosts) {
      if (CLOSELESS.has(rel)) continue;
      expect(rel in CLOSE_ROUTES, `${rel}: a new sheet route — list it here with its rise`).toBe(
        true
      );
      expect(read(rel).includes(FOOTER_IMPORT), `${rel}: imports site-footer.css`).toBe(true);
    }
  });

  it("the footer's Navigate links are root-relative anchors, so they resolve from a sheet", () => {
    const nav = read("lib/site/footer-nav.ts");
    expect(nav).toMatch(/href: `\/#\$\{row\.targetId\}`/);
    expect(nav).toMatch(/href: `\/#\$\{CORRIDOR_MOUNT_ID\}`/);
    expect(nav).not.toMatch(/href: `#\$\{/);
  });

  it("the root declares the weld once, equal to the landing's, and clips both axes", () => {
    const sheet = read(SHEET);
    const root = decls(sheet, ".sh-root");
    expect(root).toContain("--ft-weld:100svh");
    expect(root).toContain("overflow:clip");
    expect(root).not.toContain("overflow-x:");
    expect(root).not.toContain("overflow:hidden");
    expect(stripComments(sheet).match(/--ft-weld\s*:/g) ?? []).toHaveLength(1);
    // ⚠ ONE NUMBER ON BOTH HOSTS: the landing's is on `.stations`.
    const landing = decls(read(FOOTER), ".stations").match(/--ft-weld:([^;]+)/)?.[1];
    expect(landing).toBe("100svh");
  });

  it("the wordmark is docked from the first frame on every sheet, by the frame's own token", () => {
    const sheet = read(SHEET);
    const brand = decls(sheet, ".sh-root .hud__brand");
    expect(brand).toContain("left:var(--hud-margin)");
    expect(brand).toContain("transform:scale(var(--hud-brand-dock))");
    // The instrument's private copy (a hardcoded 0.68) is retired into it.
    expect(stripComments(read(INSTRUMENT))).not.toMatch(
      /data-sh-profile="instrument"\]\s*\.hud__brand/
    );
    expect(stripComments(sheet)).not.toMatch(/scale\(0\.68\)/);
    // ⚠ NEVER IN landing.css — hud-brand-tokens.test.ts slices that file at `.hud__brand {`.
    expect(stripComments(read("components/landing/v7/landing.css"))).not.toContain(".sh-root");
  });

  it("the weld pair nets zero height, outside the gate, and the close is never transformed", () => {
    const sheet = read(SHEET);
    expect(decls(sheet, ".sh-body")).toContain("position:relative");
    expect(decls(sheet, ".sh-body")).toContain("isolation:isolate");
    expect(decls(sheet, ".sh-body[data-sh-rise]")).toContain("padding-bottom:var(--ft-weld)");
    const close = decls(sheet, ".sh-body[data-sh-rise] + .sh-sec--close");
    expect(close).toContain("margin-top:calc(-1*var(--ft-weld))");
    expect(close).toContain("z-index:2");
    for (const b of blocks(stripComments(sheet)))
      if (b.path.includes(".sh-sec--close"))
        expect(flat(b.decls), `${b.path}: a transform on the close`).not.toMatch(/(^|;)transform:/);
  });

  it("the drift and the veil ride the body's own view timeline, gated, on the landing's range", () => {
    const sheet = read(SHEET);
    const gate =
      "@supports (animation-timeline: view()) @media (min-width: 961px) and (prefers-reduced-motion: no-preference)";
    const body = declsEnding(sheet, " .sh-body[data-sh-rise]", gate);
    const veil = declsEnding(sheet, " .sh-body[data-sh-rise]::after", gate);
    const range = "animation-range:containcalc(100%-var(--ft-weld))contain100%";
    expect(body).toContain("view-timeline:--sh-runblock");
    expect(body).toContain("animation:sh-underlinearboth");
    expect(body).toContain("animation-timeline:--sh-run");
    expect(body).toContain(range);
    expect(veil).toContain("z-index:3");
    expect(veil).toContain("background-color:var(--sh-ground)");
    expect(veil).toContain("opacity:0");
    expect(veil).toContain("pointer-events:none");
    expect(veil).toContain("animation:sh-under-veillinearboth");
    expect(veil).toContain(range);
    // Neither may run outside the gate: a browser without timelines would
    // play the keyframes on the document timeline (the Trinny finding).
    expect(decls(sheet, ".sh-body[data-sh-rise]")).not.toContain("animation");
    // The keyframes: +0.75 of the weld on a flowing body is −0.25 on a pinned
    // stage — the same quarter of scroll speed the landing's list drifts at.
    expect(decls(sheet, "@keyframes sh-under to")).toContain(
      "transform:translateY(calc(0.75*var(--ft-weld)))"
    );
    expect(decls(sheet, "@keyframes sh-under-veil to")).toContain("opacity:0.4");
    // ⚠ THE RANGE IS THE LANDING'S, token for token.
    const landing = declsEnding(read(MUSINGS), " .mu__stage", "@supports").match(
      /animation-range:([^;]+)/
    )?.[1];
    expect(landing?.replace("--mu-rise", "--ft-weld")).toBe(range.slice("animation-range:".length));
  });

  it("the renderer wraps the body and the close is its sibling; rise is opt-in and only the flowing pages take it", () => {
    const renderer = read(RENDERER);
    expect(renderer).toContain('className="sh-body"');
    expect(renderer).toMatch(/"data-sh-rise": ""/);
    expect(renderer).toMatch(/\{close \? <SheetClose id=\{close\.id\} \/> : null\}/);
    for (const [route, rise] of Object.entries(CLOSE_ROUTES)) {
      const mounts = read(route).match(/<SheetRenderer[\s\S]*?\/>/g) ?? [];
      expect(mounts.length, `${route}: one SheetRenderer`).toBe(1);
      expect(
        /\brise\b/.test(mounts[0] ?? ""),
        `${route}: rise ${rise ? "passed" : "not passed"}`
      ).toBe(rise);
    }
  });
});
