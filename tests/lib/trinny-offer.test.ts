import { describe, expect, it } from "vitest";

import { existsSync } from "node:fs";
import { join } from "node:path";

import {
  TRINNY_CONFIGURATION,
  TRINNY_OFFER_SECTIONS,
} from "@/app/(marketing)/arcs/trinny-london/proposal/offer/offerSections";
import { PROPOSAL_COPY_BANS, scanStrings } from "@/lib/arcs/copyLaw";

/** Every beat the page mounts, in reading order: the configuration is beat
 *  one and lives in its own station (ADR-099), the rest follow in `#offer`. */
const ALL_BEATS = [TRINNY_CONFIGURATION, ...TRINNY_OFFER_SECTIONS];

/**
 * The Trinny pitch page's offer (ADR-094 U9) — the proposal's beats after
 * the configuration, rendered by the arcs' components over a route-local
 * record. It is OUTSIDE `ARCS`, so nothing in `arcs-registry` sees it;
 * this is the same copy law, walked over the same shape of record.
 */
describe("trinny-london offer (ADR-094 U9)", () => {
  it("holds the proposal's client-facing copy law", () => {
    const offenders: string[] = [];
    scanStrings(ALL_BEATS, "beats", (value, path) => {
      for (const [pattern, what] of PROPOSAL_COPY_BANS) {
        if (pattern.test(value)) offenders.push(`${path}: ${what}`);
      }
    });
    expect(offenders).toEqual([]);
  });

  it("carries no noun of the client it was copied from", () => {
    /* The record is the Suri proposal's with the client's nouns swapped —
       placeholder copy by the owner's own instruction, to be rewritten.
       A swap is only a swap if nothing of the other client survived it:
       a Trinny page that says "Suri" once is not a placeholder, it is the
       wrong client's proposal. */
    const leaks: string[] = [];
    scanStrings(ALL_BEATS, "beats", (value, path) => {
      if (/\bSuri\b|\bKate\b|\bMark\b|\bNick\b/.test(value)) leaks.push(path);
    });
    expect(leaks).toEqual([]);
  });

  it("uses only the kinds the page's mount dispatches, with unique ids", () => {
    /* `TrinnyBeats.tsx` switches over the four kinds this page draws and
       renders nothing for any other — deliberately, to keep the arcs' heavier
       kinds (the dossier console, the holo program) off this route. A beat
       authored in another kind would vanish silently, and this is the
       failure that says so. */
    const kinds = new Set(ALL_BEATS.map((s) => s.kind));
    for (const kind of kinds) {
      expect(["list-groups", "cards", "configuration", "flow"]).toContain(kind);
    }
    /* ⚠ UNIQUE ACROSS BOTH ROOTS, not within each. The ids are DOM ids on
       one page — the configuration mounts into `#proposition` and the rest
       into `#offer`, two React trees but one document, so a collision is a
       duplicate anchor that `topOf()` and every in-page link resolve to the
       first of. */
    const ids = ALL_BEATS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    // The phases are PLATES and the fee is a LEDGER — the two drawings this
    // pass exists for (ADR-098 U2).
    const phases = TRINNY_OFFER_SECTIONS.find((s) => s.id === "phases");
    expect(phases?.kind === "list-groups" && phases.layout).toBe("plates");
    const pricing = TRINNY_OFFER_SECTIONS.find((s) => s.id === "pricing");
    expect(pricing?.kind === "cards" && pricing.ledger?.columns).toEqual(["Phase", "What", "Fee"]);
  });

  it("the configuration's picker is internally consistent (ADR-099)", () => {
    /* The record moved out of the prototype's `data-*` and into this module,
       so the parse guard that walked those attributes moved here with it.
       Every layer a tile names must be a row the drawing HAS, or the pick
       lights nothing and fails silently — the one defect this shape can have
       that neither a render nor a type can catch. */
    const cfg = TRINNY_CONFIGURATION;
    expect(cfg.kind).toBe("configuration");
    if (cfg.kind !== "configuration") return;
    const rows = cfg.layer.map((row) => row.id);
    expect(rows).toEqual(["rules", "examples", "sources", "loops"]);
    expect(cfg.teams).toHaveLength(3);
    for (const team of cfg.teams) {
      expect(team.layers.length, `${team.id}: reads nothing`).toBeGreaterThan(0);
      for (const id of team.layers) expect(rows, `${team.id}: unknown layer ${id}`).toContain(id);
      for (const k of ["owner", "runs", "bar", "reach", "where"] as const) {
        expect(team[k], `${team.id}.${k}`).toBeTruthy();
      }
    }
    /* ⚠ NO DIGIT ON THE DRAWING, the ruling this instrument has carried
       since ADR-094 U7: it plots the configuration, it does not measure it.
       (A phase code like `M1` is a NAME and is allowed — but this drawing
       carries none, so the plain ban is the honest one here.) */
    scanStrings(cfg, "configuration", (value, path) => {
      expect(/\d/.test(value), `${path}: a figure on the configuration`).toBe(false);
    });
  });

  it("draws the flow from a real template's fields and the client's own renders (ADR-099)", () => {
    const flow = TRINNY_OFFER_SECTIONS.find((s) => s.id === "flow");
    expect(flow?.kind).toBe("flow");
    if (!flow || flow.kind !== "flow") return;

    /* The eight fields a working brief carries. Short, because each is a
       LABEL on a plate and a clause there would wrap into the bar beneath
       it; digit-free, because the drawing letters no counts. */
    expect(flow.brief.fields).toHaveLength(8);
    for (const field of flow.brief.fields) {
      expect(field.length, `${field} is too long for a plate row`).toBeLessThanOrEqual(12);
      expect(/\d/.test(field), `${field} carries a digit`).toBe(false);
    }
    expect(new Set(flow.brief.fields).size).toBe(flow.brief.fields.length);

    /* ⚠ THE RENDERS MUST EXIST ON DISK. They are `public/` paths written by
       hand, and a typo renders an empty frame that every geometry gate reads
       as present — the plate would measure correct and show nothing. */
    expect(flow.renders.images.length).toBeGreaterThanOrEqual(3);
    for (const image of flow.renders.images) {
      expect(image.src, `${image.src} is not repo-rooted`).toMatch(/^\/[a-z0-9\-/]+\.webp$/);
      expect(
        existsSync(join(__dirname, "..", "..", "public", image.src.replace(/^\//, ""))),
        `${image.src} is missing from public/`
      ).toBe(true);
      // Decorative: the plate's own label carries the meaning.
      expect(image.alt).toBe("");
    }

    // Market codes, not country names — the plate's frames are small.
    expect(flow.scale.markets.length).toBeGreaterThanOrEqual(2);
    for (const market of flow.scale.markets) expect(market).toMatch(/^[A-Z]{2}$/);
    // Exactly two connectors, because there are exactly three plates.
    expect(flow.steps).toHaveLength(2);
  });
});
