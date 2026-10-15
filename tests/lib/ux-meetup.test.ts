import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { UX_MEETUP_JOURNEY_ORDER } from "@/app/(marketing)/arcs/thoughtform/ux-meetup/journey";
import { moveTalkBeforeCorridor } from "@/app/(marketing)/arcs/thoughtform/ux-meetup/order";
import { workshopV3Tracks } from "@/app/(marketing)/arcs/thoughtform/workshop-v3/WorkshopProof";
import {
  ABSORPTION_PARTS,
  WIRE_COUNT,
  absorptionFrame,
} from "@/components/arcs/figures/absorption/layout";
import { HEAD_PARTS, headDrawing, headField } from "@/components/arcs/figures/crossroads/head";
import { monthsOf } from "@/components/arcs/figures/timeline/model";
import {
  timelineFrame,
  timelineLabels,
  timelinePrisms,
} from "@/components/arcs/figures/timeline/layout";
import { labelBoxes, labelCollisions } from "@/components/arcs/framing/iso";
import type { ArcFigureSpec } from "@/lib/arcs/types";
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
      "proof-content",
      "proof-products",
      "absorbed",
      "your-tool",
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
    /* ⚠ THE ACT IS ONE UNIT (U3): the two timelines and the machine are one
       drawing built up over three beats, so the alternation law (ADR-155)
       reads statement · act · voice · picture, never two of a kind. */
    const ACT = new Set(["proof-content", "proof-products", "absorbed"]);
    const units: string[] = [];
    for (const s of sections) {
      const unit = ACT.has(s.id)
        ? "act"
        : s.kind === "interstitial" || (s.kind === "figure" && !s.head)
          ? "line"
          : "picture";
      if (unit === "act" && units.at(-1) === "act") continue;
      units.push(unit);
    }
    for (let i = 1; i < units.length; i++) {
      const pair = [units[i - 1], units[i]];
      expect(pair[0] === "line" && pair[1] === "line", `two lines side by side at ${i}`).toBe(false);
    }
    const chapters = sections.filter((s) => s.menuPrimary).map((s) => s.id);
    expect(chapters.length).toBeLessThanOrEqual(5);
  });

  /**
   * ⚠ THE TIMELINE IS A RECORD (U3): every event dated and sourced, each lane
   * rising, the two beats one record (the second only draws the ghost lane
   * in), and the drawing's words never seated on top of each other at the
   * size they render.
   */
  it("draws the timeline from a dated, sourced record without a word on a word", () => {
    const figs = UX_MEETUP_ARC.sections.flatMap((s) =>
      s.kind === "figure" && s.figure.id === "timeline" ? [s.figure] : []
    ) as Extract<ArcFigureSpec, { id: "timeline" }>[];
    expect(figs.map((f) => f.show)).toEqual(["content", "both"]);
    expect(figs[0].lanes, "one record for both beats").toBe(figs[1].lanes);
    for (const lane of figs[0].lanes) {
      const months = lane.events.map((e) => monthsOf(e.date));
      expect([...months].sort((x, y) => x - y), `${lane.id}: rising`).toEqual(months);
      for (const e of lane.events) {
        expect(e.source.label.length, `${e.id}: sourced`).toBeGreaterThan(0);
        expect(e.date, `${e.id}: a date`).toMatch(/^\d{4}(-\d{2})?$/);
      }
    }
    expect(figs[0].rail.source.href).toMatch(/^https:\/\/epoch\.ai\//);

    const lanes = figs[1].lanes;
    const prisms = timelinePrisms(lanes.map((l) => l.events));
    const f = timelineFrame(prisms);
    const tags = Object.fromEntries(
      lanes.flatMap((l) => l.events.map((e) => [e.id, `${e.date} ${e.label}`]))
    );
    const labels = timelineLabels(prisms, tags, [lanes[0].label, lanes[1].label], figs[1].rail.label, f);
    // The tags render at ~11px across a drawing ~760px wide at 1280x720.
    const type = (11 * f.w) / 760;
    expect(labelCollisions(labelBoxes(labels, type, f))).toEqual([]);
  });

  /**
   * ⚠ THE MACHINE IS A MECHANISM (U3, the anatomy method): forty or more
   * parts and wires, one gold part (the model), on the framing's projection.
   */
  it("builds the absorption machine from forty or more parts, one of them gold", () => {
    expect(ABSORPTION_PARTS.length + WIRE_COUNT).toBeGreaterThanOrEqual(40);
    expect(ABSORPTION_PARTS.filter((p) => p.kind === "model")).toHaveLength(1);
    const f = absorptionFrame();
    expect(f.w).toBeGreaterThan(0);
    expect(f.h).toBeGreaterThan(0);
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

  /** The intelligence beat stands on its source: Evans's keynote, timestamped. */
  it("sources the turn to an intelligence", () => {
    const logic = UX_MEETUP_ARC.sections.find((s) => s.id === "an-intelligence");
    const spec = logic?.kind === "figure" ? logic.figure : null;
    expect(spec?.id).toBe("logic");
    if (spec?.id === "logic") {
      expect(spec.source.href).toMatch(/youtube\.com\/watch\?v=EbqiuDtFWxA&t=\d+s/);
    }
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
