import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { KEYNOTE_JOURNEY_ORDER } from "@/app/(marketing)/arcs/thoughtform/keynote-template-alpha/journey";
import {
  insertSwarmBeforeCorridor,
  moveTalkBeforeCorridor,
} from "@/app/(marketing)/arcs/thoughtform/keynote-template-alpha/order";
import { UX_MEETUP_JOURNEY_ORDER } from "@/app/(marketing)/arcs/thoughtform/ux-meetup/journey";
import {
  KEYNOTE_ARC,
  KEYNOTE_HERO,
  KEYNOTE_PROOF_LEDES,
} from "@/lib/arcs/content/keynote-template-alpha";
import {
  UX_MEETUP_ARC,
  UX_MEETUP_HERO,
  UX_MEETUP_PROOF_LEDES,
} from "@/lib/arcs/content/ux-meetup";
import { heroMeasureFaults, PROPOSAL_COPY_BANS, scanStrings } from "@/lib/arcs/copyLaw";
import { getThoughtformWorkshopContent } from "@/lib/v7-parse";
import { VOIDWALKER_HOLOGRAM_EXIT_WINDOW } from "@/lib/voidwalker/voidwalkerHologramClock";

/**
 * The keynote template's route guard (ADR-159): the UX meetup talk's page
 * (ADR-156) with the record swapped, the swarm after the talk, and the
 * narrative in the owner's order of 16 October.
 *
 * ⚠ THE SHAPE IS THE TALK'S OWN TEST, and for its reason: this route reads
 * the SAME prototype through the SAME function with the SAME removed
 * stations, so the parse test and `ux-meetup.test.ts` already guard the
 * markup and the machinery. What is pinned here is what is TRUE OF THIS
 * ROUTE: the talk's hooks by import, the swarm's new seat, the Ghent beats
 * by reference, and the order and the lines the owner set.
 */

const ARCS_DIR = join(__dirname, "..", "..", "app", "(marketing)", "arcs");
const routeFile = (...p: string[]) => readFileSync(join(ARCS_DIR, ...p), "utf8");
const own = (file: string) => routeFile("thoughtform", "keynote-template-alpha", file);

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

/** The order the owner set on 16 October: three acts, a line and a picture in turn. */
const ORDER = [
  "the-claim",
  "capability",
  "the-interface",
  "any-software",
  "an-intelligence",
  "every-desk",
  "an-alien",
  "shoggoth",
  "already-clean",
  "their-own",
  "colleague",
  "latent-space",
  "the-median",
  "prowl",
  "encode-yourself",
] as const;

describe("the keynote template (ADR-159)", () => {
  /**
   * v3's page with the record swapped, on the talk's shape: v1's root class,
   * v3's cut, the talk's order stamp, v1's sheet by path, its own sheet, the
   * talk's ground and reader BY IMPORT, and the swarm in its own slot.
   */
  it("shares the corridor with v3 and the talk's machinery by import", () => {
    const page = own("page.tsx");
    expect(page, "v1's root class, v3's cut, the talk's order").toContain(
      'className="tw-root" data-tw-cut="v3" data-tw-order="talk-first"'
    );
    expect(page, "imports v1's route sheet").toContain('"../workshop-v1/thoughtform-workshop.css"');
    expect(page, "imports its own sheet").toContain('"./keynote-template-alpha.css"');
    expect(page, "never the talk's sheet").not.toContain("ux-meetup.css");
    expect(page, "no equilibrium").not.toContain("insertEquilibriumStation");
    expect(page, "moves the talk").toContain("moveTalkBeforeCorridor(");
    expect(page, "slots the swarm after it").toContain("insertSwarmBeforeCorridor(");
    expect(page, "reads v1's prototype").toContain("getThoughtformWorkshopContent");
    for (const station of REMOVED_STATIONS) {
      expect(page, `removes ${station}, as v1 does`).toContain(`"${station}"`);
    }
    for (const seam of ["../workshop-v3/about", "../workshop-v3/hero"]) {
      expect(page, `v3's seam by import: ${seam}`).toContain(`"${seam}"`);
    }
    const portals = own("WorkshopPortals.tsx");
    expect(portals, "reuses v3's proof, never a copy").toContain('"../workshop-v3/WorkshopProof"');
    expect(portals, "the About's flow, no seam").toContain("useWorkshopFlow({ seam: false })");
    expect(portals, "mounts the swarm in its own slot").toContain("[data-kta-swarm-root]");
    const tail = own("WorkshopTail.tsx");
    expect(tail, "the talk's ground by import").toContain('"../ux-meetup/TalkGround"');
    expect(tail, "the talk's reader by import").toContain('"../ux-meetup/useTalkFrame"');
    expect(tail, "its own act").toContain('"./FoundationAct"');
    expect(tail).toContain("observeDocument: true");
    const swarm = own("SwarmChapter.tsx");
    expect(swarm, "its own section ids").toContain('id="kta-vision"');
    expect(swarm).toContain('id="kta-adoption"');
    expect(swarm, "never the talk's").not.toContain("uxm-");

    expect([...KEYNOTE_JOURNEY_ORDER], "the roster is the talk's").toEqual([...UX_MEETUP_JOURNEY_ORDER]);
  });

  /**
   * ⚠ THE MOVES RUN ON THE REAL PROTOTYPE and throw on a miss: the talk lands
   * directly before the corridor mount, the swarm's slot between the two,
   * the kill edge goes to `#contact`, the hero's corridor link points at the
   * talk, and every second pass refuses, as does a swarm before the move.
   */
  it("moves the talk before the corridor and slots the swarm after the talk", () => {
    const { bodyHtml } = getThoughtformWorkshopContent({
      removeStations: REMOVED_STATIONS,
      corridorMountId: MOUNT,
    });
    expect(() => insertSwarmBeforeCorridor(bodyHtml, MOUNT), "the talk first").toThrow();
    const moved = moveTalkBeforeCorridor(bodyHtml, MOUNT);
    const page = insertSwarmBeforeCorridor(moved, MOUNT);
    const at = (re: RegExp) => page.search(re);
    const eras = at(/<section\b[^>]*\bid="voidwalker"/);
    const talk = at(/<section\b[^>]*\bid="workshop"/);
    const swarm = at(/<section\b[^>]*\bid="kta-swarm"/);
    const mount = at(new RegExp(`<div\\s+id="${MOUNT}"`));
    const services = at(/<section\b[^>]*\bid="services"/);
    expect(eras).toBeGreaterThan(-1);
    expect(talk, "the talk after the eras").toBeGreaterThan(eras);
    expect(swarm, "the swarm after the talk").toBeGreaterThan(talk);
    expect(mount, "the corridor after the swarm").toBeGreaterThan(swarm);
    expect(services, "the proof after the corridor").toBeGreaterThan(mount);
    expect(page.match(/\bid="workshop"/g)?.length, "moved, not copied").toBe(1);
    expect(page.match(/\bid="kta-swarm"/g)?.length, "one slot").toBe(1);
    expect(page).toContain("data-kta-swarm-root");
    expect(page).toMatch(/<section\b[^>]*\bid="workshop"(?![^>]*data-corridor-kill)[^>]*>/);
    expect(page).toMatch(/<section\b[^>]*\bid="contact"[^>]*\sdata-corridor-kill\b[^>]*>/);
    expect(page).not.toContain(`href="#${MOUNT}"`);
    expect(page).toContain('href="#workshop"');
    expect(() => moveTalkBeforeCorridor(page, MOUNT)).toThrow();
    expect(() => insertSwarmBeforeCorridor(page, MOUNT)).toThrow();
    expect(() => moveTalkBeforeCorridor("<main></main>", MOUNT)).toThrow();
  });

  /**
   * ⚠ THE WELD IS BACK (ADR-156 U3): with the swarm no longer between the
   * eras and the talk, the talk is laid up into the eras' runway again, and
   * the Ghent page's cancel rule has no seat on this sheet. The ground, the
   * active beat and the act keep the talk's hooks; only the swarm's slot is
   * this page's own.
   */
  it("welds the talk to the eras' exit and seats the swarm after it", () => {
    const eras = readFileSync(
      join(process.cwd(), "components", "landing", "home-v2", "voidwalker", "voidwalker.css"),
      "utf8"
    );
    expect(eras, "the eras' runway").toContain("min-height: 260svh;");
    const weld = 260 - VOIDWALKER_HOLOGRAM_EXIT_WINDOW[1] * (260 - 100);
    const sheet = own("keynote-template-alpha.css");
    expect(sheet, "the talk's weld").toContain(`margin-top: -${weld.toFixed(1)}svh;`);
    expect(sheet, "no cancel of the weld").not.toContain("+ #workshop.station.tw-arc");
    expect(sheet, "the talk's slot id is gone").not.toContain("#uxm-swarm");
    expect(sheet, "the swarm's own slot").toContain('[data-tw-order="talk-first"] #kta-swarm');
    expect(sheet, "the talk's hooks, shared").toContain('[data-uxm-ground="on"]');
    expect(sheet, "beats welded to the blank point of the fold").toContain(
      "margin-top: calc(-100svh - 0.38 * var(--uxm-tail));"
    );
    expect(sheet, "the act hides the brain-alone beat's marks").toContain("#their-own .arc-fig__marks");
    expect(sheet, "the field's quote on the last phase").toContain('.fa[data-fa-phase="9"] .fa__quote');

    expect(KEYNOTE_ARC.motion, "titles decode where they stand").toBe("terminal");
    for (const s of KEYNOTE_ARC.sections) {
      if (s.kind === "interstitial" && s.variant === "statement") {
        expect(s.glitch, `${s.id}: glitches in`).toBe(true);
      }
    }
  });

  /** The hero is the talk's, by reference, inside the house measure. */
  it("says the talk's hero, by reference", () => {
    expect(KEYNOTE_HERO).toBe(UX_MEETUP_HERO);
    expect(KEYNOTE_PROOF_LEDES).toBe(UX_MEETUP_PROOF_LEDES);
    const { title, lede } = KEYNOTE_ARC.hero;
    const titleText = [title.pre, title.em, title.post].filter(Boolean).join(" ");
    expect(heroMeasureFaults(titleText, lede)).toEqual([]);
    const headline = KEYNOTE_HERO.headlineHtml.replace(/<br\s*\/?>/g, " ");
    expect(headline, "the headline is the arc's title").toBe(titleText);
    expect(KEYNOTE_HERO.descHtml, "the lede is the arc's lede").toBe(lede);
    for (const action of KEYNOTE_ARC.hero.actions ?? []) {
      const id = action.href.replace(/^#/, "");
      expect(
        KEYNOTE_ARC.sections.some((s) => s.id === id),
        `${action.label}: points at a beat on the page`
      ).toBe(true);
    }
    expect(KEYNOTE_ARC.date >= UX_MEETUP_ARC.date, "filed after the talk").toBe(true);
  });

  /**
   * ⚠ THE GHENT BEATS ARE READ BY REFERENCE (the `-v2` rule): the six of the
   * first act are the talk's own objects; the two that moved share their
   * figure and differ only in their number; everything else is this
   * record's own, and the Ghent record is untouched.
   */
  it("reads the Ghent beats by reference and forks only what moved or changed", () => {
    const ghent = (id: string) => UX_MEETUP_ARC.sections.find((s) => s.id === id);
    const here = (id: string) => KEYNOTE_ARC.sections.find((s) => s.id === id);
    for (const id of ["the-claim", "capability", "the-interface", "an-intelligence"]) {
      expect(here(id), `${id}: the talk's object`).toBe(ghent(id));
    }
    // U1 (owner, 2026-10-16): the voice about software has his new line.
    const soft = here("any-software");
    expect(soft, "forked, not the talk's").not.toBe(ghent("any-software"));
    expect(soft?.kind === "interstitial" ? [soft.line.pre, soft.line.em] : []).toEqual([
      "AI is both the tool",
      "and the builder of the tool.",
    ]);
    // U2: the rings keep the talk's layers under his new line.
    const desk = here("every-desk");
    const ghentDesk = ghent("every-desk");
    expect(desk?.kind === "figure" && desk.figure.id === "knowledge" ? desk.figure.line : "").toBe(
      "An intelligence that will soon absorb all knowledge work."
    );
    expect(desk?.kind === "figure" && desk.figure.id === "knowledge" ? desk.figure.layers : null).toBe(
      ghentDesk?.kind === "figure" && ghentDesk.figure.id === "knowledge" ? ghentDesk.figure.layers : undefined
    );
    for (const [id, n] of [
      ["latent-space", "12"],
      ["prowl", "14"],
    ] as const) {
      const a = here(id);
      const b = ghent(id);
      expect(a?.kind === "figure" && b?.kind === "figure" && a.figure, `${id}: the talk's drawing`).toBe(
        b?.kind === "figure" ? b.figure : null
      );
      expect(a?.kind === "figure" ? a.eyebrow?.slice(0, 2) : "", `${id}: renumbered`).toBe(n);
    }
    for (const id of ["any-software", "every-desk", "an-alien", "shoggoth", "already-clean", "their-own", "colleague", "the-median", "encode-yourself"]) {
      expect(here(id), `${id}: on the page`).toBeDefined();
      expect(here(id), `${id}: this record's own`).not.toBe(ghent(id));
    }
    // The Ghent page as the room saw it (ADR-156 U14).
    expect(UX_MEETUP_ARC.sections.map((s) => s.id)).toEqual([
      "the-claim",
      "capability",
      "the-interface",
      "any-software",
      "an-intelligence",
      "every-desk",
      "an-alien",
      "shoggoth",
      "prowl",
      "latent-space",
    ]);
  });

  /**
   * ⚠ THE OWNER'S ORDER OF 16 OCTOBER, as structure: three acts; a line and a
   * picture in turn (ADR-155's law); no card grid; a statement is one line;
   * every eyebrow letters its position; five chapters at most, the third
   * act's opening among them; the Goodfire line credited; the alien question
   * about a user that isn't a person, the shoggoth no longer "not understood".
   */
  it("holds the owner's order and the Goodfire rewrite", () => {
    const sections = KEYNOTE_ARC.sections;
    expect(sections.map((s) => s.id)).toEqual([...ORDER]);
    for (const s of sections) {
      expect(["cards", "list-groups"], `${s.id}: a box grid`).not.toContain(s.kind);
      if (s.kind === "interstitial" && s.variant === "statement") {
        expect(s.subline, `${s.id}: no small text`).toBeUndefined();
      }
      const o = s as unknown as { eyebrow?: string; head?: { eyebrow?: string } };
      const eyebrow = o.head?.eyebrow ?? o.eyebrow ?? "";
      const i = sections.indexOf(s);
      expect(eyebrow.slice(0, 2), `${s.id}: its number`).toBe(String(i + 1).padStart(2, "0"));
    }
    const units = sections.map((s) => (s.kind === "interstitial" ? "line" : "picture"));
    for (let i = 1; i < units.length; i++) {
      expect(units[i - 1] === "line" && units[i] === "line", `two lines at ${i}`).toBe(false);
    }
    const chapters = sections.filter((s) => s.menuPrimary).map((s) => s.id);
    expect(chapters.length).toBeLessThanOrEqual(5);
    expect(chapters, "the third act opens a chapter").toContain("colleague");

    const alien = sections.find((s) => s.id === "an-alien");
    expect(alien?.kind === "interstitial" ? alien.line.em : "").toMatch(/isn’t a person/);
    const shog = sections.find((s) => s.id === "shoggoth");
    expect(shog?.kind === "figure" && shog.figure.id === "shoggoth" ? shog.figure.line : "").not.toMatch(
      /fully understand/
    );
    const clean = sections.find((s) => s.id === "already-clean");
    expect(clean?.kind === "interstitial" ? clean.attribution : "").toMatch(/Cammarata, Goodfire, 2026/);
    expect(clean?.kind === "interstitial" ? clean.frame : "").toBe("marks");
    const theirOwn = sections.find((s) => s.id === "their-own");
    expect(theirOwn?.kind === "figure" ? theirOwn.figure.id : "").toBe("brain");
    const latent = sections.find((s) => s.id === "latent-space");
    expect(latent?.kind === "figure" && latent.menuPrimary, "the field is never a chapter").toBeFalsy();
  });

  /**
   * ⚠ THE BRAIN IS ONE OBJECT (U1, owner 2026-10-16): the act holds the
   * voices between its drawn beats, so the brain recedes behind them and
   * comes forward; it manifests plate by plate through `brainIso`'s
   * `reveal`, never a scanline; it stands on tendrils, not a block; and the
   * cords reach the plates from three edges.
   */
  it("holds the brain across the voices, manifests it, and hangs tendrils", () => {
    const act = own("FoundationAct.tsx");
    expect(act, "reads this record").toContain('from "@/lib/arcs/content/keynote-template-alpha"');
    expect(act, "never the talk's").not.toContain("UX_MEETUP_ARC");
    expect(act).toContain(
      'const IDS = ["capability", "the-interface", "any-software", "an-intelligence", "every-desk", "an-alien", "shoggoth", "already-clean", "their-own", "latent-space"] as const;'
    );
    expect(act, "a pose behind every voice").toMatch(/2: RECEDE,[\s\S]*5: RECEDE,[\s\S]*7: RECEDE,/);
    expect(act, "no block under the brain").toContain('base: "tendrils"');
    expect(act, "the manifest through the build height").toContain("reveal: step / STEPS");
    expect(act, "no scanline").not.toContain("behind a scanline");
    expect(act, "the cords from three edges").toMatch(/edge: "left"[\s\S]*edge: "back"/);
    expect(act, "the field on the last phase").toContain("phase === 9");
    // U2: the camera turns to face the reader between the interface and the
    // middle, and the head stands on the screen's top datum.
    expect(act, "the camera's path").toMatch(/const VIEW_T: Record<number, number> = \{ 1: 0, 2: 1, 3: 2/);
    expect(act).toContain("BRAIN_VIEW_FRONT");
    expect(act, "the head outside the scene's box").toMatch(/<\/div>\s*\{\/\* The head stands on the screen's own top datum/);
    const sheet = own("keynote-template-alpha.css");
    expect(sheet, "the scene inside the instrument band").toContain("var(--instrument-margin");
    expect(sheet, "the voices read over the brain").toContain("#any-software .arc-stage");
    expect(sheet, "the head on a top datum").toContain("--fa-head-top: clamp(");
    expect(sheet, "no head seated by the box").not.toContain("top: calc(40 / 820 * 100%)");
  });

  /**
   * ⚠ `brainIso` GREW TWO OPTIONS AND STAYED BYTE-IDENTICAL BY DEFAULT: the
   * Ghent page's act passes neither, so its picture is the one the room
   * saw; the keynote's tendril base drops the stem, the block and the
   * manifold, and a partial reveal is a prefix of the build.
   */
  it("keeps the Ghent brain byte-identical and builds the keynote's from the floor", async () => {
    const { brainIsoMarkup, brainIsoBox, brainIsoRoots, BRAIN_ISO_BOX, BRAIN_ISO_ROOTS, BRAIN_ISO_PORTS, BRAIN_VIEW_ISO, BRAIN_VIEW_FRONT } =
      await import("@/components/arcs/figures/foundation/brainIso");
    const whole = brainIsoMarkup();
    expect(brainIsoMarkup({ base: "manifold", reveal: 1 })).toBe(whole);
    expect(brainIsoMarkup({ view: BRAIN_VIEW_ISO }), "the isometric is the default camera").toBe(whole);
    // U2: a second camera, face on and tilted up, with its own bounds and roots.
    const front = brainIsoMarkup({ view: BRAIN_VIEW_FRONT, base: "tendrils" });
    expect(front).not.toBe(brainIsoMarkup({ base: "tendrils" }));
    expect(front.length).toBeGreaterThan(1000);
    expect(brainIsoBox(BRAIN_VIEW_ISO)).toEqual(BRAIN_ISO_BOX);
    expect(brainIsoBox(BRAIN_VIEW_FRONT)).not.toEqual(BRAIN_ISO_BOX);
    expect(brainIsoRoots(BRAIN_VIEW_ISO)).toEqual(BRAIN_ISO_ROOTS);
    const frontRoots = brainIsoRoots(BRAIN_VIEW_FRONT);
    expect(frontRoots.length).toBe(8);
    for (let i = 1; i < frontRoots.length; i++) expect(frontRoots[i][0]).toBeGreaterThanOrEqual(frontRoots[i - 1][0]);
    const tendrils = brainIsoMarkup({ base: "tendrils" });
    expect(tendrils.length).toBeLessThan(whole.length);
    // The hemispheres are the same parts in both: the far one appears inside
    // the whole picture after its base, the near one ends both.
    expect(whole.includes(tendrils.slice(0, 400)), "the far hemisphere, unchanged").toBe(true);
    expect(whole.startsWith(tendrils.slice(0, 400)), "the base is drawn before it").toBe(false);
    expect(whole.endsWith(tendrils.slice(-400)), "the near hemisphere, unchanged").toBe(true);
    const half = brainIsoMarkup({ base: "tendrils", reveal: 0.5 });
    expect(half.length).toBeGreaterThan(0);
    expect(half.length).toBeLessThan(tendrils.length);
    expect(brainIsoMarkup({ base: "tendrils", reveal: -1 })).toBe("");
    expect(brainIsoMarkup({ base: "tendrils", reveal: 0 }).length, "the floor plates stand at level 0").toBeGreaterThan(0);
    expect(BRAIN_ISO_ROOTS.length).toBe(8);
    for (let i = 1; i < BRAIN_ISO_ROOTS.length; i++) expect(BRAIN_ISO_ROOTS[i][0]).toBeGreaterThanOrEqual(BRAIN_ISO_ROOTS[i - 1][0]);
    expect(BRAIN_ISO_PORTS.length).toBe(7);
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
    const { sections, ...frame } = KEYNOTE_ARC;
    scanStrings(frame, "arc", visit);
    scanStrings(KEYNOTE_HERO, "hero", visit);
    for (const section of sections) {
      const o = section as unknown as Record<string, unknown>;
      for (const key of ["menuLabel", "eyebrow", "head", "line", "subline", "attribution", "media", "caption", "figure"]) {
        scanStrings(o[key], `${section.id}.${key}`, visit);
      }
    }
    expect(faults).toEqual([]);
  });
});
