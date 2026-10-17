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
  KEYNOTE_ALREADY_CLEAN,
  KEYNOTE_SHOGGOTH,
  KEYNOTE_THEIR_OWN,
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

/** The order the owner set on 16 October, cut on the 17th: the wake-up call
    is the stack's head and the shoggoth is off the page (U6); Goodfire's
    line and his answer are held back for new sections (U7); what it still
    needs heads the layer beat, its interstitial gone (U10). */
const ORDER = [
  "capability",
  "the-interface",
  "an-intelligence",
  "every-desk",
  "the-layer",
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
    // U6 (owner, 2026-10-17): the wake-up call is no beat of its own; its
    // words head the stack, whose cards are renamed over the talk's media.
    expect(here("the-claim"), "the wake-up call is the stack's head").toBeUndefined();
    const cap = here("capability");
    const ghentCap = ghent("capability");
    expect(cap, "forked, not the talk's").not.toBe(ghentCap);
    // U7: 01 to 04 read as one paragraph, his wording ("content", as he wrote it).
    expect(cap?.kind === "figure" && cap.figure.id === "capability" ? cap.figure.title : "").toBe(
      "AI will absorb all digital content and products within 2 years."
    );
    const cards = cap?.kind === "figure" && cap.figure.id === "capability" ? cap.figure.cards : [];
    const ghentCards = ghentCap?.kind === "figure" && ghentCap.figure.id === "capability" ? ghentCap.figure.cards : [];
    expect(cards.map((c) => c.title)).toEqual(["Images", "Video", "Tools", "Brand systems", "Products", "Worlds", "Mathematics"]);
    expect(cards.map((c) => c.id), "the talk's cards, in its order").toEqual(ghentCards.map((c) => c.id));
    cards.forEach((c, i) => expect(c.media, `${c.id}: the talk's media`).toBe(ghentCards[i].media));
    for (const c of cards) expect(c.caption, `${c.id}: no "then"`).not.toMatch(/\bthen\b/i);
    // U3 (owner, 2026-10-16): the interface beat says it itself, and the
    // voice that followed it on the Ghent page is gone from the keynote.
    const ifc = here("the-interface");
    const ghentIfc = ghent("the-interface");
    expect(ifc, "forked, not the talk's").not.toBe(ghentIfc);
    expect(ifc?.kind === "figure" && ifc.figure.id === "interface" ? ifc.figure.mind : "").toBe(
      "And the interface to it all."
    );
    // U4: the middle's line is his, over the talk's cards.
    const mid = here("an-intelligence");
    const ghentMid = ghent("an-intelligence");
    expect(mid?.kind === "figure" && mid.figure.id === "middle" ? mid.figure.line : "").toBe(
      "Not software. An intelligence: the tool and its maker."
    );
    expect(mid?.kind === "figure" && mid.figure.id === "middle" ? mid.figure.tool : null).toBe(
      ghentMid?.kind === "figure" && ghentMid.figure.id === "middle" ? ghentMid.figure.tool : undefined
    );
    expect(ifc?.kind === "figure" && ifc.figure.id === "interface" ? ifc.figure.line : "").toBe(
      ghentIfc?.kind === "figure" && ghentIfc.figure.id === "interface" ? ghentIfc.figure.line : null
    );
    expect(here("any-software"), "no voice between the interface and the middle").toBeUndefined();
    // U2: the rings keep the talk's layers under his new line.
    const desk = here("every-desk");
    const ghentDesk = ghent("every-desk");
    expect(desk?.kind === "figure" && desk.figure.id === "knowledge" ? desk.figure.line : "").toBe(
      "Next, all knowledge work."
    );
    expect(desk?.kind === "figure" && desk.figure.id === "knowledge" ? desk.figure.layers : null).toBe(
      ghentDesk?.kind === "figure" && ghentDesk.figure.id === "knowledge" ? ghentDesk.figure.layers : undefined
    );
    for (const [id, n] of [
      ["latent-space", "07"],
      ["prowl", "09"],
    ] as const) {
      const a = here(id);
      const b = ghent(id);
      expect(a?.kind === "figure" && b?.kind === "figure" && a.figure, `${id}: the talk's drawing`).toBe(
        b?.kind === "figure" ? b.figure : null
      );
      expect(a?.kind === "figure" ? a.eyebrow?.slice(0, 2) : "", `${id}: renumbered`).toBe(n);
    }
    const midHere = here("an-intelligence");
    expect(midHere?.kind === "figure" ? midHere.eyebrow?.slice(0, 2) : "", "the middle, renumbered").toBe("03");
    for (const id of ["capability", "the-interface", "an-intelligence", "every-desk", "the-layer", "colleague", "the-median", "encode-yourself"]) {
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

    // U10: his line heads the layer beat, its own interstitial gone; the
    // shoggoth kept off the page (U6).
    expect(sections.some((s) => s.id === "an-alien"), "the line moved onto the layer").toBe(false);
    expect(sections.some((s) => s.id === "shoggoth"), "hidden for now").toBe(false);
    expect(KEYNOTE_SHOGGOTH.id).toBe("shoggoth");
    const shog = KEYNOTE_SHOGGOTH;
    expect(shog.kind === "figure" && shog.figure.id === "shoggoth" ? shog.figure.line : "").not.toMatch(
      /fully understand/
    );
    // U7: Goodfire's line and his answer held back, their records kept whole.
    for (const id of ["already-clean", "their-own"]) {
      expect(sections.some((s) => s.id === id), `${id}: held back`).toBe(false);
    }
    const clean = KEYNOTE_ALREADY_CLEAN;
    expect(clean.id).toBe("already-clean");
    expect(clean.kind === "interstitial" ? clean.attribution : "").toMatch(/Cammarata, Goodfire, 2026/);
    expect(clean.kind === "interstitial" ? clean.frame : "").toBe("marks");
    const theirOwn = KEYNOTE_THEIR_OWN;
    expect(theirOwn.id).toBe("their-own");
    expect(theirOwn.kind === "figure" ? theirOwn.figure.id : "").toBe("brain");
    // U5, U10: the layer, straight after the rings, headed by his line.
    const layer = sections.find((s) => s.id === "the-layer");
    expect(layer?.kind === "figure" ? layer.figure.id : "").toBe("layer");
    expect(layer?.kind === "figure" && layer.figure.id === "layer" ? layer.figure.title : null).toBe("But it still needs context, nuance and taste.");
    expect(layer?.kind === "figure" && layer.figure.id === "layer" ? layer.figure.line : null, "no line under it").toBeUndefined();
    expect(sections.findIndex((s) => s.id === "the-layer"), "after the rings").toBe(sections.findIndex((s) => s.id === "every-desk") + 1);
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
      'const IDS = ["capability", "the-interface", "an-intelligence", "every-desk", "an-alien", "shoggoth", "the-layer", "already-clean", "their-own", "latent-space"] as const;'
    );
    expect(act, "a pose behind every voice").toMatch(/4: RECEDE,[\s\S]*7: RECEDE,/);
    expect(act, "no block under the brain").toContain('base: "tendrils"');
    expect(act, "the manifest through the build height").toContain("reveal: step / STEPS");
    expect(act, "no scanline").not.toContain("behind a scanline");
    expect(act, "the cords from three edges").toMatch(/edge: "left"[\s\S]*edge: "back"/);
    expect(act, "the field on the last phase").toContain("phase === 9");
    // U2: the camera turns to face the reader between the interface and the
    // middle, and the head stands on the screen's top datum.
    expect(act, "the camera's path").toMatch(/const VIEW_T: Record<number, number> = \{ 1: 0, 2: 2, 3: 2/);
    expect(act).toContain("BRAIN_VIEW_FRONT");
    expect(act, "the head outside the scene's box").toMatch(/<\/div>\s*\{\/\* The head stands on the screen's own top datum/);
    // U3: the orbits in 3D, the pointer. U4: the smile as particles, no
    // mask in the picture; the planets lit, the rings with a glint.
    expect(act, "no mask on the keynote's brain").toMatch(/const PICTURE: Record<number, Picture> = \{ 1: "plain", 2: "split", 3: "plain", 4: "plain", 5: "plain", 6: "plain", 7: "plain", 8: "plain" \}/);
    expect(act, "the smile as particles in the face's plane").toContain("paintSmile(ctx, b.pl,");
    expect(act).toContain("brainIsoPoint(l, SMILE_F, z, view)");
    expect(act, "orbits in their own planes").toMatch(/const ORBITS = \[[\s\S]*tilt: [\d.]+, roll: [-\d.]+, prec: [-\d]+, spin: \d+, dir: -?1/);
    expect(act, "a perspective on the rings").toContain("ORBIT_EYE / (ORBIT_EYE - z)");
    expect(act, "planets lit from a side, with a glow").toMatch(/createRadialGradient\(\(q\.x - R \* 0\.35\) \* k/);
    expect(act, "a glint on the ring").toContain("O.spin * 0.55");
    expect(act, "the pointer leans the brain").toContain('window.addEventListener("pointermove", onPointer');
    expect(act, "and lets go").toContain('window.removeEventListener("pointermove", onPointer)');
    expect(act, "the glass").toContain('<linearGradient id="fa-glass"');
    // U5: the layer. The brain turns back to the isometric and parts; the
    // swarm page's plate, the mark cut into it, prints between its halves
    // through the swarm's own lattice, mark and palette.
    expect(act, "the layer beat at the isometric").toMatch(/const VIEW_T: Record<number, number> = \{ 1: 0, 2: 2, 3: 2, 4: 2, 5: 2, 6: 0, 7: 2, 8: 2 \}/);
    expect(act, "one hemisphere a picture").toContain('only: kind === "left" ? -1 : kind === "right" ? 1 : undefined');
    expect(act, "the swarm's lattice").toContain('from "@/app/(internal)/test/proposal-swarm/engine/lattice"');
    expect(act, "the swarm's mark").toContain("engraved(on(I, T), lit(I, T), [r < 3.5 ? 2 : 1, STYLE.layer])");
    // U6: the plate stands upright in the gap, its face square to L, the
    // mark read square to the face through the swarm's own sampler, solid.
    expect(act, "the swarm's sampler").toContain("import { COVER, coverOf, engraved, LIP_REACH }");
    expect(act, "the face stands").toContain("push(at(I, th, T), tier, style);");
    expect(act, "the strata through its thickness").toContain("push(at(I, J, m), 2, STYLE.layerLit);");
    expect(act, "solid").toContain("ctx.fillStyle = `rgb(${o.tones.ground.join(\", \")})`;");
    expect(act, "the halves parted along L").toContain("const part = LAYER_PART * open;");
    expect(act, "the stack's head").toContain('cap && cap.id === "capability" ? (cap.title ?? "") : ""');
    expect(act, "the swarm's paint").toContain("paletteOf([1, 1, 1], o.tones)");
    expect(act, "the rim lit, as there").toContain("rim ? [2, STYLE.layerLit] : engraved(");
    expect(act, "far half, plate, near half").toMatch(/half\(near > 0 \? -1 : 1\);[\s\S]*paintLayer\(ctx, D,[\s\S]*half\(near\);/);
    expect(act, "the halves close before the next turn").toContain("const target = brain.apart > 0 && !parting ? 0 : (VIEW_T[phase] ?? 0);");
    // U7: the layer's tendrils, far files under the slab, near ones over it
    // and under the near half; the brain's machining one constant.
    expect(act, "tendrils in depth order").toMatch(
      /half\(near > 0 \? -1 : 1\);[\s\S]*paintFiles\(ctx, files, "far", lay\);\s*paintLayer\(ctx, D,[\s\S]*paintFiles\(ctx, files, "near", lay\);\s*half\(near\);/
    );
    expect(act, "the files grow once the slab has printed").toContain("const grown = smooth((brain.apart - 0.82) / 0.18);");
    // U10 (owner: "why is it so small? I like the full bleed"): the card a
    // full-bleed screen under a slim head, no count, no date, no readout;
    // one PLAY plate on a film that opens it full screen, its hit area the
    // plate; the crosses back on the card's corners; the mathematics a black
    // hole, full bleed too.
    expect(act, "a slim head").toContain("const HEAD = 86;");
    expect(act, "the picture full bleed").toContain("<image href={card.media.src} x={0} y={y} width={W} height={h} preserveAspectRatio=\"xMidYMid slice\" />");
    expect(act, "the black hole full bleed").toMatch(/<foreignObject x=\{0\} y=\{y\} width=\{W\} height=\{h\}>\s*<MathHoleCanvas \/>/);
    for (const gone of ["fa__mod-count", "fa__mod-key", "fa__mod-val", "fa__mark", "PLAY WITH SOUND", "innerChamfer", "MathBoard"]) {
      expect(act, `no ${gone}`).not.toContain(gone);
    }
    expect(act, "one plate").toContain('<g className="fa__play-plate">');
    expect(act, "the play is the plate").toContain('<button ref={playRef} type="button" className="fa__play" style={playAt} aria-label="Play with sound" />');
    expect(act, "its hit area from the plate").toContain("left: `${((FACING.x + PLAY.x * s) / VB.w) * 100}%`,");
    expect(act, "full screen").toContain("theatre.requestFullscreen?.()");
    expect(act, "crosses on the card's corners").toMatch(/\[0, 0\],\s*\[W, H\],\s*\[0, H\],\s*\]\.map\(\(\[cx, cy\], j\) => \(\s*<path key=\{j\} className="fa__cross"/);
    // U10: the middle's cards read at a glance: a name and one line, large.
    expect(act, "the side card's name").toContain('className="fa__side-label"');
    expect(act, "no rows on the side cards").not.toContain("fa__side-row");
    expect(act, "the brain's machining").toMatch(/const BRAIN_CHIP: BrainChip = \{[^}]*\};/);
    expect(act).toContain("chip: BRAIN_CHIP,");
    const sheet = own("keynote-template-alpha.css");
    expect(sheet, "the scene inside the instrument band").toContain("var(--instrument-margin");
    expect(sheet, "the voices read over the brain").toContain("#an-alien .arc-stage");
    expect(sheet, "no voice about software any more").not.toContain("#any-software");
    expect(sheet, "the head on a top datum").toContain("--fa-head-top: clamp(");
    expect(sheet, "no head seated by the box").not.toContain("top: calc(40 / 820 * 100%)");
    expect(sheet, "the cards as glass").toContain("fill: url(#fa-glass)");
    expect(sheet, "the field's quote on the last phase").toContain('.fa[data-fa-phase="9"] .fa__quote');
    expect(sheet, "the layer's head, centred").toContain('.fa[data-fa-phase="6"] .fa__head');
    // U7: every head with no paragraph beside it centred, the stack's H1 too.
    expect(sheet, "the stack's head, centred").toMatch(/\.fa\[data-fa-phase="0"\] \.fa__head,\s*\.fa\[data-fa-phase="1"\] \.fa__head,[\s\S]*?justify-items: center;/);
    expect(sheet, "never left any more").not.toMatch(/\.fa\[data-fa-phase="0"\] \.fa__head \{\s*justify-items: start;/);
    expect(sheet, "the interface's head, centred").toMatch(/\.fa\[data-fa-phase="1"\] \.fa__head,\s*\.fa\[data-fa-phase="2"\] \.fa__head,[\s\S]*?justify-items: center;/);
    expect(sheet, "the act hides the layer beat's marks").toContain("#the-layer .arc-fig__marks");
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
    // U3: the display is the keynote's mask; the faceplate stays the Ghent page's.
    const display = brainIsoMarkup({ base: "tendrils", mask: "display" });
    expect(display).toContain('class="fa-mask fa-display"');
    expect(display).toContain('class="fa-led-lit"');
    expect(display).not.toContain("fa-mask-slot");
    const plate = brainIsoMarkup({ base: "tendrils", mask: true });
    expect(plate).toContain("fa-mask-slot");
    expect(plate).not.toContain("fa-display");
    expect(brainIsoMarkup({ base: "tendrils", reveal: 0 }).length, "the floor plates stand at level 0").toBeGreaterThan(0);
    // U5: one hemisphere alone is that hemisphere's own markup; the two
    // together, in the camera's depth order, are the tendril picture whole.
    const left = brainIsoMarkup({ base: "tendrils", only: -1 });
    const right = brainIsoMarkup({ base: "tendrils", only: 1 });
    expect(left.length).toBeGreaterThan(1000);
    expect(right.length).toBeGreaterThan(1000);
    expect(left).not.toBe(right);
    expect([left + right, right + left], "the halves make the whole").toContain(tendrils);
    // U7: the brain machined all over, every option off by default; on, the
    // halves still make the whole, each step adds to the last.
    const b1 = brainIsoMarkup({ base: "tendrils", chip: { wafer: true } });
    const b2 = brainIsoMarkup({ base: "tendrils", chip: { wafer: true, weave: true } });
    const b3chip = { wafer: true, weave: true, die: true };
    const b3 = brainIsoMarkup({ base: "tendrils", chip: b3chip });
    expect(brainIsoMarkup({ base: "tendrils", chip: {} }), "no chip is today's brain").toBe(tendrils);
    expect(b1.length).toBeGreaterThan(tendrils.length);
    expect(b2.length).toBeGreaterThan(b1.length);
    expect(b2, "the weave in gold").toContain("fa-gold-via");
    expect(b3, "a die's face on a wall").toContain('class="fa-die"');
    expect(
      [brainIsoMarkup({ base: "tendrils", chip: b3chip, only: -1 }), brainIsoMarkup({ base: "tendrils", chip: b3chip, only: 1 })].flatMap((a, i, h) => [a + h[1 - i]]),
      "the machined halves make the machined whole"
    ).toContain(b3);
    expect(BRAIN_ISO_ROOTS.length).toBe(8);
    for (let i = 1; i < BRAIN_ISO_ROOTS.length; i++) expect(BRAIN_ISO_ROOTS[i][0]).toBeGreaterThanOrEqual(BRAIN_ISO_ROOTS[i - 1][0]);
    expect(BRAIN_ISO_PORTS.length).toBe(7);
  });

  /**
   * U7: the layer's tendrils are files of the slab's own lattice, six to
   * each half, leaving its faces along `j` (the brain's L axis), stepping
   * once up or down, and running to the wall's reach, inside the walls' band.
   */
  it("lays the layer's tendrils on the slab's own lattice", async () => {
    const { tendrilFiles, slabAt } = await import("@/components/arcs/figures/foundation/layerTendrils");
    const { latticeAt } = await import("@/app/(internal)/test/proposal-swarm/engine/lattice");
    const L = latticeAt({ a: 5, b: 3, n: 4 }, 1);
    const th = 4.5;
    const files = tendrilFiles(L, th, (side) => (side === "far" ? 30 : 26), [8, 26]);
    expect(files.filter((f) => f.side === "far").length).toBe(6);
    expect(files.filter((f) => f.side === "near").length).toBe(6);
    const step = (L.a + L.b) * L.g;
    for (const f of files) {
      const n = f.pts.length / 2;
      const runs = f.side === "far" ? 30 : 26;
      // every j step is one site; the riser adds whole T sites
      expect(n, `${f.side}: at least the reach`).toBeGreaterThanOrEqual(runs);
      // the first site is one step off the slab's face, toward its half
      const [x0, y0] = [f.pts[0], f.pts[1]];
      expect(Math.abs(x0) + Math.abs(y0)).toBeGreaterThan(0);
      for (let i = 1; i < n; i++) {
        const dx = Math.abs(f.pts[2 * i] - f.pts[2 * i - 2]);
        const dy = Math.abs(f.pts[2 * i + 1] - f.pts[2 * i - 1]);
        expect(dx + dy, "neighbouring sites").toBeLessThanOrEqual(step + 2 * L.b * L.g);
      }
    }
    // far files run toward +L (right and up on screen), near ones toward -L
    const far = files.find((f) => f.side === "far");
    const near = files.find((f) => f.side === "near");
    expect(far && far.pts[far.pts.length - 2] - far.pts[0]).toBeGreaterThan(0);
    expect(near && near.pts[near.pts.length - 2] - near.pts[0]).toBeLessThan(0);
    expect(slabAt(L, 0, 0, 0)).toEqual([0, 0]);
  });

  /**
   * U8, U9: the black hole of mathematics is seeded (the same disk every
   * time) and falls in; since U9 it is a terminal, its cells the mono's
   * advance, its prompt typing the card's own equations.
   */
  it("seeds the black hole of mathematics, lets it fall, and lays its terminal", async () => {
    const { holeSeed, holeStep, holeScreen, HOLE_EQUATIONS } = await import("@/components/arcs/figures/foundation/mathHole");
    const a = holeSeed();
    const b = holeSeed();
    expect(a).toEqual(b);
    expect(a.length).toBe(900);
    expect([...HOLE_EQUATIONS], "the card's own equations at the prompt").toEqual(["∂u/∂t + (u·∇)u = −∇p + νΔu", "∇·u = 0", "4/n = 1/x + 1/y + 1/z"]);
    const screen = holeScreen(506, 285, 9, 5.4);
    expect(screen.cols).toBe(93);
    expect(screen.rows).toBe(31);
    expect(screen.light.length).toBe(93 * 31);
    const act = own("FoundationAct.tsx");
    expect(act, "the cells in the page's mono").toContain("const font = cs.fontFamily");
    expect(own("keynote-template-alpha.css"), "the hole's mono").toMatch(/\.fa__hole \{[^}]*font-family: var\(--font-pt-mono/);
    const r0 = a.map((p) => p.r);
    holeStep(a, 0.5, () => 0.5);
    let fell = 0;
    a.forEach((p, i) => {
      if (p.r < r0[i]) fell++;
      expect(p.r, "never inside the horizon").toBeGreaterThanOrEqual(1.1);
    });
    expect(fell).toBeGreaterThan(700);
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
