import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { UX_MEETUP_JOURNEY_ORDER } from "@/app/(marketing)/arcs/thoughtform/ux-meetup/journey";
import { moveTalkBeforeCorridor } from "@/app/(marketing)/arcs/thoughtform/ux-meetup/order";
import { workshopV3Tracks } from "@/app/(marketing)/arcs/thoughtform/workshop-v3/WorkshopProof";
import { EDGE, ISO_PHI, ISO_PSI, ISO_S, basisOf, coreModel } from "@/components/arcs/figures/foundation/mind";
import { CARDS_END, STACK_C, U, axesAt, plateOrigin, proj, sheetPoses } from "@/components/arcs/figures/foundation/scene";
import { HEAD_PARTS, headDrawing, headField } from "@/components/arcs/figures/crossroads/head";
import { WORKSHOP_INTRO } from "@/lib/arcs/content/shared/workshopIntro";
import {
  UX_MEETUP_ARC,
  UX_MEETUP_HERO,
  UX_MEETUP_PROOF_LEDES,
} from "@/lib/arcs/content/ux-meetup";
import { heroMeasureFaults, PROPOSAL_COPY_BANS, scanStrings } from "@/lib/arcs/copyLaw";
import { getThoughtformWorkshopContent } from "@/lib/v7-parse";
import { VOIDWALKER_HOLOGRAM_EXIT_WINDOW } from "@/lib/voidwalker/voidwalkerHologramClock";

/**
 * The UX meetup talk's route guard (ADR-156, U2).
 *
 * ⚠ THE SHAPE IS THE LECTURE'S OWN TEST, and for its reason: this route reads
 * the SAME prototype through the SAME function with the SAME removed
 * stations, so the parse test already guards the markup. What is pinned here
 * is what is TRUE OF THIS ROUTE: v3's corridor half with the talk moved in
 * front of it, its hero and one proof lede, and the owner's rulings of
 * 15 October on how the talk is built.
 */

const ARCS_DIR = join(__dirname, "..", "..", "app", "(marketing)", "arcs");
const routeFile = (...p: string[]) => readFileSync(join(ARCS_DIR, ...p), "utf8");

const REMOVED_STATIONS = [
  "definition",
  "missing-layer",
  "intelligence-layer",
  "continuum",
  "practice",
  "buildQuote",
  "build",
] as const;
const MOUNT = "home-corridor-mount";

describe("the UX meetup talk (ADR-156)", () => {
  /**
   * v3's page with the record swapped, as Suri's lunch and learn is
   * (ADR-147), MINUS the equilibrium and with the talk before the corridor
   * (U2): the hook runs with `seam: false`, and this page alone is stamped.
   */
  it("shares the corridor with v3, opens on the About, and turns the seam off", () => {
    const page = routeFile("thoughtform", "ux-meetup", "page.tsx");
    expect(page, "v1's root class, v3's cut, the talk's order").toContain(
      'className="tw-root" data-tw-cut="v3" data-tw-order="talk-first"'
    );
    expect(page, "imports v1's route sheet").toContain('"../workshop-v1/thoughtform-workshop.css"');
    expect(page, "imports its own sheet").toContain('"./ux-meetup.css"');
    expect(page, "loads the stack's sheet").toContain('"@/components/arcs/stack/stack.css"');
    expect(page, "no equilibrium sheet").not.toContain("equilibrium.css");
    expect(page, "no equilibrium station").not.toContain("insertEquilibriumStation");
    expect(page, "moves the talk").toContain("moveTalkBeforeCorridor(");
    expect(page, "reads v1's prototype").toContain("getThoughtformWorkshopContent");
    for (const station of REMOVED_STATIONS) {
      expect(page, `removes ${station}, as v1 does`).toContain(`"${station}"`);
    }
    for (const seam of ["../workshop-v3/about", "../workshop-v3/hero"]) {
      expect(page, `v3's seam by import: ${seam}`).toContain(`"${seam}"`);
    }
    const portals = routeFile("thoughtform", "ux-meetup", "WorkshopPortals.tsx");
    expect(portals, "reuses v3's proof, never a copy").toContain('"../workshop-v3/WorkshopProof"');
    expect(portals, "no opener").not.toContain("EquilibriumMount");
    expect(portals, "the About's flow, no seam").toContain("useWorkshopFlow({ seam: false })");
    const sheet = routeFile("thoughtform", "ux-meetup", "ux-meetup.css");
    expect(sheet, "scoped to this page's stamp").toContain('[data-tw-order="talk-first"]');

    expect([...UX_MEETUP_JOURNEY_ORDER]).toEqual([
      "hero",
      "about",
      "voidwalker",
      "workshop",
      "thesis",
      "navigate",
      "encode",
      "build",
      "services",
      "contact",
    ]);
  });

  /**
   * ⚠ THE MOVE RUNS ON THE REAL PROTOTYPE and throws on a miss: the talk lands
   * directly before the corridor mount, the kill edge goes to `#contact`, the
   * hero's corridor link points at the talk, and a second pass refuses.
   */
  it("moves the talk in front of the corridor, with the kill edge and the hero link", () => {
    const { bodyHtml } = getThoughtformWorkshopContent({
      removeStations: REMOVED_STATIONS,
      corridorMountId: MOUNT,
    });
    const moved = moveTalkBeforeCorridor(bodyHtml, MOUNT);
    const at = (re: RegExp) => moved.search(re);
    const talk = at(/<section\b[^>]*\bid="workshop"/);
    const mount = at(new RegExp(`<div\\s+id="${MOUNT}"`));
    const eras = at(/<section\b[^>]*\bid="voidwalker"/);
    const services = at(/<section\b[^>]*\bid="services"/);
    expect(eras).toBeGreaterThan(-1);
    expect(talk, "after the eras").toBeGreaterThan(eras);
    expect(mount, "the talk is before the corridor").toBeGreaterThan(talk);
    expect(services, "the proof after the corridor").toBeGreaterThan(mount);
    expect(moved.match(/\bid="workshop"/g)?.length, "moved, not copied").toBe(1);
    expect(moved).toMatch(/<section\b[^>]*\bid="workshop"(?![^>]*data-corridor-kill)[^>]*>/);
    expect(moved).toMatch(/<section\b[^>]*\bid="contact"[^>]*\sdata-corridor-kill\b[^>]*>/);
    expect(moved).not.toContain(`href="#${MOUNT}"`);
    expect(moved).toContain('href="#workshop"');
    expect(() => moveTalkBeforeCorridor(moved, MOUNT)).toThrow();
    expect(() => moveTalkBeforeCorridor("<main></main>", MOUNT)).toThrow();
  });

  /**
   * ⚠ THE WELD IS ARITHMETIC ON TWO OTHER FILES (U3): the eras' runway
   * (`voidwalker.css`, 260svh with a 100svh stage) and the end of their exit
   * (`VOIDWALKER_HOLOGRAM_EXIT_WINDOW`). The talk is laid up into that runway
   * so its first beat parks on the frame the exit ends; a change to either
   * number fails here, by name, before it shows as a gap or an overlap.
   */
  it("welds the talk to the end of the eras' exit, and runs the terminal grammar", () => {
    const eras = readFileSync(
      join(process.cwd(), "components", "landing", "home-v2", "voidwalker", "voidwalker.css"),
      "utf8"
    );
    expect(eras, "the eras' runway").toContain("min-height: 260svh;");
    const pinTravel = 260 - 100;
    const weld = 260 - VOIDWALKER_HOLOGRAM_EXIT_WINDOW[1] * pinTravel;
    const sheet = routeFile("thoughtform", "ux-meetup", "ux-meetup.css");
    expect(sheet, "the talk's weld").toContain(`margin-top: -${weld.toFixed(1)}svh;`);
    expect(sheet, "the curtain is gone").not.toContain("-75svh");
    expect(sheet, "beats welded to the blank point of the fold").toContain(
      "margin-top: calc(-100svh - 0.38 * var(--uxm-tail));"
    );

    expect(UX_MEETUP_ARC.motion, "titles decode where they stand").toBe("terminal");
    const tail = routeFile("thoughtform", "ux-meetup", "WorkshopTail.tsx");
    expect(tail, "the talk's frames come from its one reader").toContain("useTalkFrame(");
    expect(tail).toContain("observeDocument: true");
    for (const s of UX_MEETUP_ARC.sections) {
      if (s.kind === "interstitial" && s.variant === "statement") {
        expect(s.glitch, `${s.id}: glitches in`).toBe(true);
      }
    }
  });

  /** The hero is the talk's own, one record with the arc's. */
  it("says one hero, inside the house measure", () => {
    const { title, lede } = UX_MEETUP_ARC.hero;
    const titleText = [title.pre, title.em, title.post].filter(Boolean).join(" ");
    expect(heroMeasureFaults(titleText, lede)).toEqual([]);
    const headline = UX_MEETUP_HERO.headlineHtml.replace(/<br\s*\/?>/g, " ");
    expect(headline, "the headline is the arc's title").toBe(titleText);
    expect(UX_MEETUP_HERO.descHtml, "the lede is the arc's lede").toBe(lede);
    for (const action of UX_MEETUP_ARC.hero.actions ?? []) {
      const id = action.href.replace(/^#/, "");
      expect(
        UX_MEETUP_ARC.sections.some((s) => s.id === id),
        `${action.label}: points at a beat on the page`
      ).toBe(true);
    }
  });

  /** One lede differs from v3's: the workshop's promise taken out. */
  it("reads v3's proof with the workshop's promise taken out", () => {
    const record = WORKSHOP_INTRO.proof.ledes;
    for (const id of WORKSHOP_INTRO.proof.order) {
      if (id === "ai-transformation") continue;
      expect(UX_MEETUP_PROOF_LEDES[id], `${id}: v3's lede, by value`).toBe(record[id]);
    }
    expect(UX_MEETUP_PROOF_LEDES["ai-transformation"]).not.toMatch(/today/i);
    const talk = workshopV3Tracks(UX_MEETUP_PROOF_LEDES);
    const v3 = workshopV3Tracks();
    expect(talk.map((t) => t.id)).toEqual(v3.map((t) => t.id));
  });

  /** No switch: no switched beats, no island. */
  it("carries no worked-example switch", () => {
    const tail = routeFile("thoughtform", "ux-meetup", "WorkshopTail.tsx");
    expect(tail, "the tail mounts no switch").not.toContain("ArcWorkedSwitch");
    for (const s of UX_MEETUP_ARC.sections) {
      expect(s.worked, `${s.id}: a panel stamp on a page with no switch`).toBeUndefined();
    }
  });

  /**
   * ⚠ THE OWNER'S RULINGS OF 15 OCTOBER, as structure:
   * - no card grid and no list of boxes ("a glorified PowerPoint");
   * - a statement is one line and nothing under it ("we don't need the small
   *   text below it");
   * - a statement and a section with its picture take turns, never two of a
   *   kind side by side (ADR-155's law);
   * - every eyebrow letters its own position.
   */
  it("holds the owner's rulings on how the talk is built", () => {
    const sections = UX_MEETUP_ARC.sections;
    expect(sections.map((s) => s.id)).toEqual([
      "the-claim",
      "capability",
      "the-interface",
      "any-software",
      "an-intelligence",
      "crossroads",
    ]);
    for (const s of sections) {
      expect(["cards", "list-groups"], `${s.id}: a box grid`).not.toContain(s.kind);
      if (s.kind === "interstitial" && s.variant === "statement") {
        expect(s.subline, `${s.id}: no small text`).toBeUndefined();
      }
      const own = s as unknown as { eyebrow?: string; head?: { eyebrow?: string } };
      const eyebrow = own.head?.eyebrow ?? own.eyebrow ?? "";
      const i = sections.indexOf(s);
      expect(eyebrow.slice(0, 2), `${s.id}: its number`).toBe(String(i + 1).padStart(2, "0"));
    }
    /* Never two lines side by side (ADR-155): a statement or a voice is a
       line; every drawing, with a head or standing alone, is a picture. */
    const units = sections.map((s) => (s.kind === "interstitial" ? "line" : "picture"));
    for (let i = 1; i < units.length; i++) {
      expect(units[i - 1] === "line" && units[i] === "line", `two lines at ${i}`).toBe(false);
    }
    const chapters = sections.filter((s) => s.menuPrimary).map((s) => s.id);
    expect(chapters.length).toBeLessThanOrEqual(5);
  });

  /**
   * ⚠ THE FOUNDATION ACT (U5, U6): one example faces the reader at every
   * scroll of the first beat until the last has lain down; a sheet lies in
   * the stack in the very pose it keeps in the next beat, the stack landing
   * in the centre only after a cascade, the bottom plate first; the stack
   * stands between its two axes; the mind is a machine of named parts, and
   * its isometric camera IS the scene's projection.
   */
  it("faces one example at a time, then stacks them in the pose the interface keeps", () => {
    const cap = UX_MEETUP_ARC.sections.find((s) => s.id === "capability");
    const cards = cap?.kind === "figure" && cap.figure.id === "capability" ? cap.figure.cards : [];
    expect(cards.map((c) => c.kind)).toEqual(["image", "video", "tool", "product", "worlds", "mathematics"]);
    for (const c of cards) {
      if (c.media) {
        expect(existsSync(join(process.cwd(), "public", c.media.src)), `${c.media.src} on disk`).toBe(true);
        if (c.media.poster) {
          expect(existsSync(join(process.cwd(), "public", c.media.poster)), `${c.media.poster} on disk`).toBe(true);
        }
      }
    }
    const n = cards.length;
    const lastDown = ((n - 1 + 0.62) / n) * CARDS_END;
    for (let a = 0; a < lastDown - 0.005; a += 0.01) {
      const facing = sheetPoses(n, a).filter((p) => p.facing).length;
      expect(facing, `facing at ${a.toFixed(2)}`).toBe(1);
    }
    // Seated in the stack on the left, then landed in the centre: the same
    // pose moved, never turned again.
    const left = sheetPoses(n, CARDS_END + 0.005);
    const centre = sheetPoses(n, 1);
    for (let i = 0; i < n; i++) {
      expect(left[i].seated && centre[i].seated).toBe(true);
      expect(centre[i].m.slice(0, 4)).toEqual(left[i].m.slice(0, 4));
    }
    expect(plateOrigin(n - 1, 1)).toEqual(STACK_C);
    // The cascade: mid-move, a lower plate is always further along.
    const mid = [0, 1, 2, 3, 4, 5].map((i) => plateOrigin(i, 0.93).x);
    for (let i = 1; i < n; i++) expect(mid[i]).toBeLessThanOrEqual(mid[i - 1]);
    expect(mid[0]).toBeGreaterThan(mid[n - 1]);
    // The axes: a tick per plate, climbing.
    const ax = axesAt(n, STACK_C);
    expect(ax.ticks.length).toBe(n);
    for (let i = 1; i < n; i++) expect(ax.ticks[i].y).toBeLessThan(ax.ticks[i - 1].y);
  });

  it("builds the model as an instrument: a dodecahedron round its dual, on the scene's projection", () => {
    const m = coreModel();
    expect(m.parts.length, "the anatomy's parts").toBeGreaterThanOrEqual(36);
    expect(new Set(m.parts).size, "every part named once").toBe(m.parts.length);
    expect(m.shell.length, "a dodecahedron's corners").toBe(20);
    expect(m.lattice.length, "an icosahedron's").toBe(12);
    expect(m.edges.filter((e) => e.kind === EDGE.shell).length).toBe(30);
    expect(m.edges.filter((e) => e.kind === EDGE.lattice).length).toBe(30);
    // Twelve faces, each its own five corners, each corner on three faces.
    expect(new Set(m.faces.map((f) => [...f.idx].sort().join())).size).toBe(12);
    const uses = new Array(20).fill(0);
    for (const f of m.faces) for (const i of f.idx) uses[i]++;
    expect(uses.every((u) => u === 3)).toBe(true);
    // Front-facing: one face looks straight along +y, at the reader.
    expect(Math.max(...m.faces.map((f) => f.n.y))).toBeCloseTo(1, 6);
    // Every circuit lies on its face's plane.
    for (const e of m.edges.filter((x) => x.kind === EDGE.circuit)) {
      const f = m.faces.reduce((best, g) => (g.n.x * e.a.x + g.n.y * e.a.y + g.n.z * e.a.z > best.n.x * e.a.x + best.n.y * e.a.y + best.n.z * e.a.z ? g : best));
      const p0 = m.shell[f.idx[0]];
      const off = (q: { x: number; y: number; z: number }) => f.n.x * (q.x - p0.x) + f.n.y * (q.y - p0.y) + f.n.z * (q.z - p0.z);
      expect(Math.abs(off(e.a))).toBeLessThan(0.05);
      expect(Math.abs(off(e.b))).toBeLessThan(0.05);
    }
    expect(m.sockets.length, "a socket for every plate").toBe(6);
    // At its isometric pose the camera draws exactly what the scene draws.
    const b = basisOf({ psi: ISO_PSI, phi: ISO_PHI, s: ISO_S, o: { x: 0, y: 0 } });
    const o = { x: 0, y: 0 };
    for (const [x, y, z] of [[1, 0, 0], [0, 1, 0], [0, 0, 1]]) {
      const q = proj({ x, y, z }, o);
      expect(x * b.ex.x + y * b.ey.x + z * b.ez.x).toBeCloseTo(q.x, 6);
      expect(x * b.ex.y + y * b.ey.y + z * b.ez.y).toBeCloseTo(q.y, 6);
    }
    expect(ISO_S * Math.cos(ISO_PHI)).toBeCloseTo(U, 6);
    const ifc = UX_MEETUP_ARC.sections.find((s) => s.id === "the-interface");
    expect(ifc?.kind === "figure" && ifc.head, "no head and no paragraph").toBeFalsy();
  });

  /**
   * ⚠ THE HEAD IS NOBODY'S (U3, owner: "an anonymous head"): built from
   * solids, raymarched, the same every time; split at its nose line into a
   * human half of particles and a machine half of lines, both present.
   */
  it("draws the crossroads head from solids, the same every time, in two halves", () => {
    expect(HEAD_PARTS.length).toBeGreaterThanOrEqual(12);
    const f = headField();
    const hits = Array.from(f.depth).filter(Number.isFinite).length;
    expect(hits / f.depth.length, "the head fills a fair share of its window").toBeGreaterThan(0.25);
    expect(f.seam).toBeGreaterThan(f.cols * 0.3);
    expect(f.seam).toBeLessThan(f.cols * 0.7);
    const a = headDrawing();
    const b = headDrawing();
    expect(a.lines).toEqual(b.lines);
    expect(a.dots.length).toBe(b.dots.length);
    expect(a.lines.length, "the machine half").toBeGreaterThan(40);
    expect(a.dots.length, "the human half").toBeGreaterThan(800);
    for (const d of a.dots) expect(d.x).toBeLessThanOrEqual(a.seamX + 4);
    const cross = UX_MEETUP_ARC.sections.find((s) => s.id === "crossroads");
    expect(cross?.kind === "figure" && cross.head, "it stands without a section head").toBeFalsy();
  });

  /** The intelligence beat (U6): the mind between a tool and a collaborator,
      the owner's own line, and no head over it. */
  it("seats the mind between a tool and a collaborator", () => {
    const mid = UX_MEETUP_ARC.sections.find((s) => s.id === "an-intelligence");
    const spec = mid?.kind === "figure" ? mid.figure : null;
    expect(spec?.id).toBe("middle");
    if (spec?.id === "middle") {
      expect(spec.line).toBe("AI is an intelligence that sits in the middle.");
      expect([spec.tool.label, spec.collaborator.label]).toEqual(["Tool", "Collaborator"]);
    }
    expect(mid?.kind === "figure" && mid.head).toBeFalsy();
    // The tool takes the back of the mind, the collaborator its front.
    expect(coreModel().flanks.tool.every((p) => p.x < 0)).toBe(true);
    expect(coreModel().flanks.collab.every((p) => p.x > 0)).toBe(true);
  });

  /** The house copy law, over what this page letters of its own. */
  it("holds the copy law on its own words", () => {
    const faults: string[] = [];
    const visit = (value: string, path: string) => {
      for (const [pattern, why] of PROPOSAL_COPY_BANS) {
        if (pattern.test(value)) faults.push(`${path}: ${why}`);
      }
      if (/<\/?(i|em)\b/i.test(value)) faults.push(`${path}: markup in a copy string`);
    };
    const { sections, ...frame } = UX_MEETUP_ARC;
    scanStrings(frame, "arc", visit);
    scanStrings(UX_MEETUP_HERO, "hero", visit);
    for (const section of sections) {
      const own = section as unknown as Record<string, unknown>;
      for (const key of ["menuLabel", "eyebrow", "head", "line", "subline", "media", "caption", "figure"]) {
        scanStrings(own[key], `${section.id}.${key}`, visit);
      }
    }
    expect(faults).toEqual([]);
  });
});
