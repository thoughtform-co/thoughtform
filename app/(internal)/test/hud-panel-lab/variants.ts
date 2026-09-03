import { CHARACTER_ERAS, type CharacterEraId } from "@/lib/voidwalker/characterEras";
import { PROOF_CASE } from "@/lib/cases/registry";

/**
 * /test/hud-panel-lab — the direction registry.
 *
 * THE QUESTION THIS LAB ASKS. Both evidence surfaces — the proof casefile at
 * the top of `#services` and the Voidwalker era stage — read as text and image
 * blocks floating in FRONT of the HUD rather than as parts of it. The owner's
 * own references (the Vilimovský Cyberpunk 2077 tablet kit, the amber
 * retro-terminal instruments, the Starfield / Returnal character screens) do
 * six things ours do not:
 *
 *   1. A DATUM and a TERMINUS — a header strip the instrument hangs from and a
 *      foot row it sits on, both belonging to the device.
 *   2. SEAMS, not gutters — adjacent regions share drawn edges; cells touch.
 *   3. A LINE-WEIGHT LADDER — thick datum / 1px edges / faint interior rules.
 *      Ours is one weight: every casefile rule is 1px at GOLD .12–.24 while
 *      the frame beside it runs 2px at DAWN .55.
 *   4. CORNER LABELS on a field. A field with bare corners is a picture.
 *   5. The centrepiece sits in a BAY with head and foot micro-labels.
 *   6. ONE MATERIAL across the panel.
 *
 * ⚠ EVERY DIRECTION IS APPLIED TO BOTH SURFACES, and that is the point. The
 * owner is choosing a SITE-LEVEL GRAMMAR, not two panel fixes: a direction
 * that only works on one of them has not answered the question.
 *
 * ⚠ NO FLAG, EVER (ADR-070 U35). These are lab variants; a winner is promoted
 * into `casefile.css` / `voidwalker-datum.css` with its own ADR and the losers
 * are deleted with their guards.
 *
 * ⚠ `v0` IS PRODUCTION, MOUNTED, NOT REBUILT. Every direction re-composes the
 * SAME production leaves (`ClientTabs`, `TrackProofRegister`, `Directory`,
 * `TrackPanel`; `HoloDatumPanels` with the real `HoloFigure` node), so a
 * comparison is between compositions and never between two drawings claiming
 * to be the same one.
 */

/* ── The directions ───────────────────────────────────────────────────── */

export const HPL_DIRECTION_IDS = ["v0", "v1", "v2", "v3", "v4", "v5", "v6"] as const;
export type HplDirectionId = (typeof HPL_DIRECTION_IDS)[number];

export const HPL_SURFACE_IDS = ["proof", "eras"] as const;
export type HplSurfaceId = (typeof HPL_SURFACE_IDS)[number];

/**
 * What chrome a direction adds. The shells read these to decide what to
 * RENDER; the sheet reads `[data-hpl-dir]` to decide how to place it. Two
 * readers of one record, so a direction cannot draw a header the CSS does not
 * seat.
 */
export interface HplChrome {
  /** A band above the content. `fused` = welded to a housing's top edge. */
  header: "none" | "row" | "bar" | "fused";
  /** A band under the content. On the eras this may never be a rule at the
   *  rail's last tick — see the foot-rule knob below. */
  foot: "none" | "row" | "bar";
  /** One enclosing chamfered housing (TR+BL, the lawful diagonal). */
  housing: boolean;
  /** Drawn seams between regions — a solid column seam, cell divisions. */
  seams: boolean;
  /** A head row on each record cell: label left · meta right · rule. */
  cellHeads: boolean;
  /** Micro-labels in the field's / the bay's corners. */
  corners: boolean;
  /** Corner brackets around the figure or the field (the portrait grammar). */
  bracket: boolean;
  /** 21px datum stubs on the band's LEFT edge, seated on the rail's ticks. */
  stubs: boolean;
  /** Boxed readout cells beside a boxed field. */
  boxes: boolean;
  /** The retuned line ladder: dawn structure at the HUD's own weights, a
   *  solid column seam, the reticle pair completed. Every direction past v0
   *  carries it — it is the null hypothesis v1 tests alone. */
  ladder: boolean;
  /** Which housing `housing` draws. `slab`: the chamfered plate with the
   *  services lip (v2, promoted as ADR-089). `listing`: a SQUARE double-line
   *  ring — two 1px lines of the frame's own datum with a 2px gap, no ground,
   *  no lip, no clip-path (box-drawing has no chamfer; ADR-065's ladder puts
   *  chrome at depth 0). Read only when `housing`; on the era stage a listing
   *  draws NO enclosure at all (the station is transparent by law). */
  housingKind: "slab" | "listing";
  /** The column seam drawn DOUBLE (║): line · 2px gap · line, 4px. */
  double: boolean;
  /** A phosphor block cursor on the lit mark — 700ms lit, 700ms dark, steady
   *  under reduced motion. The one moving thing on the surface. */
  cursor: boolean;
  /** The TR+BL registration reticle pair on the centrepiece's bay — the
   *  casefile's own `.fl-ret` recipe, brought to the era stage. */
  reticles: boolean;
}

export interface HplDirectionDef {
  id: HplDirectionId;
  label: string;
  thesis: string;
  provenance: string;
  chrome: HplChrome;
}

const NO_CHROME: HplChrome = {
  header: "none",
  foot: "none",
  housing: false,
  seams: false,
  cellHeads: false,
  corners: false,
  bracket: false,
  stubs: false,
  boxes: false,
  ladder: false,
  housingKind: "slab",
  double: false,
  cursor: false,
  reticles: false,
};

export const HPL_DIRECTIONS: Record<HplDirectionId, HplDirectionDef> = {
  v0: {
    id: "v0",
    label: "00 · Shipped",
    thesis:
      "The control, mounted from production and byte-identical. Its lines are the defect stated: every rule on the casefile is 1px of GOLD at .12–.24 while the frame beside it runs 2px of DAWN at .55, and the era stage draws four head rules and nothing else. One weight, one hue, no datum, no terminus.",
    provenance:
      "ServicesCasefile and VoidwalkerHologram, mounted. Nothing here is a reimplementation — a lab whose control is not the real thing cannot judge anything against it.",
    chrome: { ...NO_CHROME },
  },
  v1: {
    id: "v1",
    label: "01 · Tuned",
    thesis:
      "THE NULL HYPOTHESIS: it is a LINE problem, not a layout problem. Nothing moves house. The structure goes to dawn at the frame's own two weights, the column seam becomes solid, the reticle pair is completed, and the era mast becomes a header ROW — kicker left, title centre, year right. Answers the one question the other four cannot: how much of this was never composition at all.",
    provenance:
      "Starfield's character screen: an underline-only active state and generous negative space, holding a page together with alignment and two line weights.",
    chrome: { ...NO_CHROME, header: "row", ladder: true },
  },
  v2: {
    id: "v2",
    label: "02 · Housing",
    thesis:
      "ONE machined housing spanning the instrument band, from the rail's top line to its last tick, with a header bar fused to its top edge and the content divided by seams inside it. The console stops being a box beside bare text and becomes a cell of the same device — it drops its own chamfer, because the children of a chamfered housing are square.",
    provenance:
      "The Vilimovský tablets: a bezelled slab whose software line, content bays and barcode foot are one object. The A3 CONSOLE BAY mockup from the era-stage pass, which the owner never ruled on.",
    chrome: {
      ...NO_CHROME,
      header: "fused",
      foot: "bar",
      housing: true,
      seams: true,
      cellHeads: true,
      ladder: true,
    },
  },
  v3: {
    id: "v3",
    label: "03 · Grid",
    thesis:
      "No box and no fill — a seam-exposed grid. A top rule on tick one, a solid column seam, horizontal seams between the record cells that STOP at that column, and a head row on every cell. The frame is drawn by what divides the content rather than by what surrounds it.",
    provenance:
      "The Kindled Kindred grid reference, filed by the owner for its structure alone: cells bounded by thin rules with no gutters softening the seams.",
    chrome: {
      ...NO_CHROME,
      header: "row",
      seams: true,
      cellHeads: true,
      ladder: true,
    },
  },
  v4: {
    id: "v4",
    label: "04 · Instrument",
    thesis:
      "The amber-terminal grammar: a 2px datum bar in the rail's own material, a header row under it, the field boxed and corner-labelled, and the record as a stack of boxed readout cells top- and bottom-aligned to it. Everything is a reading with a label on it.",
    provenance:
      "The amber instrument set in the owner's panel folder — GALACTIC POSITION, STELLAR LOCATORS, PROXIMITY LIMIT. The closest palette in the whole pool to this site's own.",
    chrome: {
      ...NO_CHROME,
      header: "bar",
      foot: "row",
      cellHeads: true,
      corners: true,
      boxes: true,
      ladder: true,
    },
  },
  v5: {
    id: "v5",
    label: "05 · Tether",
    thesis:
      "No enclosure at all — the frame reaches in. The rail's tick ladder continues as datum stubs on the band's left edge, each cell's head rule runs out to that edge and terminates on one, and the centrepiece sits in a bracket-cornered bay carrying its own identity in its corners. The era title leaves the mast entirely and seats at the bay's head.",
    provenance:
      "Cyberpunk-4's character screen, where the figure is bracketed by its own labels and the frame's marks reach inward. The D2 datum direction, minus the full-bleed rails the owner deleted.",
    chrome: {
      ...NO_CHROME,
      stubs: true,
      bracket: true,
      corners: true,
      cellHeads: true,
      ladder: true,
    },
  },
  v6: {
    id: "v6",
    label: "06 · Listing",
    thesis:
      "THE LISTING: the panel is SOFTWARE drawn on the frame's screen, not the device the screen is set into — the opposite reading from ADR-089. A SQUARE double-line ring (═ ║, the DOS box-drawing double: two 1px lines of the rail's own dawn with a 2px gap) is the one emphatic line — no ground, no lip, no chamfer. The column seam goes double, every other seam single, the interior rules faint; record rows are set as a listing, key 6/16 · value 10/16; and the one lit rung is PHOSPHOR — a block cursor after the active client's name, the console's spine, the active era's mark. Nothing paints over content and nothing is drawn empty. On the era stage it crosses as lines alone: no ring, the mast re-set as the listing's header row on SCOPE's edge, three double rules, a reticle pair on the bay, and zero new lettered elements.",
    provenance:
      "Derived from a 128-character random seed (s8CXLTPe…KwsqbqDur) rather than a reference: 8×16 is a hex dump's shape; the doubled letters FF·pp·BB sit at Fibonacci gaps (34, 21 ≈ φ); the digit run holds the strobogrammatic 6996 between two 8s; G Z h 0 are absent; 61/51 upper/lower is the house's own 1.2; the hex triplets #FFA and #dA9 are the phosphor and the oxide; I×7 and no zero are the cursor. The measured analysis and the finding→rule map: docs/design/hud-panel-lab/seed-listing.md.",
    chrome: {
      ...NO_CHROME,
      header: "fused",
      foot: "bar",
      housing: true,
      housingKind: "listing",
      seams: true,
      cellHeads: true,
      double: true,
      cursor: true,
      reticles: true,
      ladder: true,
    },
  },
};

export const HPL_DIRECTION_LIST: readonly HplDirectionDef[] = HPL_DIRECTION_IDS.map(
  (id) => HPL_DIRECTIONS[id]
);

export function hplDirection(id: string | null | undefined): HplDirectionDef {
  return (id && HPL_DIRECTIONS[id as HplDirectionId]) || HPL_DIRECTIONS.v0;
}

/* ── Knobs ────────────────────────────────────────────────────────────────
   Orthogonal to the direction (the mobile-hud-lab idiom), because each asks
   its own owner question rather than belonging to one composition. */

export const HPL_MATERIALS = ["line", "glass"] as const;
export type HplMaterial = (typeof HPL_MATERIALS)[number];

/**
 * ⚠ THE ERAS' FOOT RULE IS AN OWNER QUESTION, NOT A DEFAULT.
 * `.vwd__band`'s `border-top` was deleted TWICE — U20 as a duplicate of the
 * ground datum, U21 on the ruling that a full-bleed line through the frame's
 * tick ladder may not come back — and the landing's boundaries smoke fails
 * anything wide that paints. `?foot=rule` draws a BAND-INSET rule (never
 * full-bleed) so the owner can rule on the amendment by looking at it. It is
 * off by default, and the landing is untouched either way.
 */
export const HPL_FOOT_RULES = ["none", "rule"] as const;
export type HplFootRule = (typeof HPL_FOOT_RULES)[number];

/**
 * ⚠ THE OXIDE IS A THIRD HUE, ASKED AS A KNOB SO IT CAN BE REFUSED WITHOUT
 * REFUSING THE DIRECTION. `06 · Listing`'s seed offered two colours: the
 * phosphor (#FFA) is the direction's own lit rung and ships with it, while
 * oxide (#dA9, rgb 221 170 153) is put on PROVENANCE META only — the foot's
 * log code, the era press meta and head tags — so the owner can rule on a hue
 * the house does not have while looking at it. Off by default; inert on every
 * direction but v6. Light re-derives it to a rust that clears 4.5:1.
 */
export const HPL_INKS = ["house", "oxide"] as const;
export type HplInk = (typeof HPL_INKS)[number];

export const HPL_THEMES = ["dark", "light"] as const;
export type HplTheme = (typeof HPL_THEMES)[number];

/* ── The deep link ──────────────────────────────────────────────────────── */

export interface HplQuery {
  s: HplSurfaceId;
  v: HplDirectionId;
  theme: HplTheme;
  /** Which era the stage shows. */
  era: CharacterEraId;
  /** Which directory row the casefile shows — a `CaseTrack.id`. */
  row: string;
  /** `--svc-proof-in`, so the arrival ladder can be scrubbed. */
  proofIn: number;
  mat: HplMaterial;
  footRule: HplFootRule;
  /** Which ink provenance meta takes on v6 — the house's dawn, or the seed's oxide. */
  ink: HplInk;
}

export const HPL_DEFAULT_ERA: CharacterEraId = CHARACTER_ERAS[0].id;
export const HPL_DEFAULT_ROW: string = PROOF_CASE.casefile.tracks[0].id;

const isEra = (v: string): v is CharacterEraId => CHARACTER_ERAS.some((e) => e.id === v);
const isRow = (v: string): boolean => PROOF_CASE.casefile.tracks.some((t) => t.id === v);

/**
 * ⚠ READ IN A MOUNT EFFECT, NEVER THROUGH `useSearchParams` — that forces a
 * CSR bailout of the whole route and takes the server-rendered first paint
 * with it (the field-log / anchor / card-face / client-stack convention).
 * Unknown values fall back rather than throwing: a capture script that
 * mistypes a parameter must produce a labelled still, not a blank page.
 */
export function parseHplQuery(q: URLSearchParams): HplQuery {
  const s = q.get("s");
  const v = q.get("v");
  const theme = q.get("theme");
  const era = q.get("era");
  const row = q.get("row");
  const mat = q.get("mat");
  const footRule = q.get("foot");
  const ink = q.get("ink");
  /* ⚠ ABSENT IS NOT ZERO, AND `Number()` CANNOT TELL THEM APART. `Number(null)`
     and `Number("")` are both 0, which is a FINITE number — so the obvious
     `Number.isFinite(Number(q.get("in")))` resolves a missing parameter to
     clock 0 and renders the surface blank, on every URL that does not mention
     it. The empty check comes first. */
  const rawIn = q.get("in");
  const parsedIn = rawIn === null || rawIn.trim() === "" ? Number.NaN : Number(rawIn);

  const direction: HplDirectionId =
    v && (HPL_DIRECTION_IDS as readonly string[]).includes(v) ? (v as HplDirectionId) : "v0";

  return {
    s: s === "eras" ? "eras" : "proof",
    v: direction,
    theme: theme === "light" ? "light" : "dark",
    era: era && isEra(era) ? era : HPL_DEFAULT_ERA,
    row: row && isRow(row) ? row : HPL_DEFAULT_ROW,
    proofIn: Number.isFinite(parsedIn) ? Math.min(1, Math.max(0, parsedIn)) : 1,
    mat: mat === "glass" ? "glass" : mat === "line" ? "line" : defaultMaterial(direction),
    footRule: footRule === "rule" ? "rule" : "none",
    ink: ink === "oxide" ? "oxide" : "house",
  };
}

/**
 * The housing is the one direction whose argument INCLUDES its material — a
 * machined slab with no ground is a wireframe of a housing, not a housing.
 * Every other direction opens on line work, which is the house default.
 * `v6 · Listing` refuses a ground by construction (its seed has no `G`), so it
 * falls to `line` with the rest — and its ring's rules outrank the glass
 * knob's, so `?mat=glass` cannot fill it either way.
 */
export function defaultMaterial(id: HplDirectionId): HplMaterial {
  return id === "v2" ? "glass" : "line";
}
