import { describe, expect, it } from "vitest";

import {
  CARRIER_HUB_K,
  CARRIER_LABEL_FS,
  CARRIER_SEAT_RECT,
} from "@/components/landing/home-v2/services/casefile/map/pda/PdaCarrier";
import {
  SEAT,
  configExt,
  configLayout,
  configurationLettering,
} from "@/components/landing/home-v2/services/casefile/map/pda/PdaConfiguration";
import {
  gridRect,
  workExt,
  workLayout,
} from "@/components/landing/home-v2/services/casefile/map/pda/PdaViews";
import {
  CARD,
  CARD_BOX,
  CART_TYPE,
  CORE_K,
  LANES,
  MONO_ADVANCE,
  cartPairMeasure,
  cartTitleChars,
  laneLabel,
  meterLabelDx,
  wrapLines,
} from "@/components/landing/home-v2/services/casefile/map/pda/pdaGlyphs";
import {
  PDA_SHOWN,
  type PdaWork,
  toPdaWork,
} from "@/components/landing/home-v2/services/casefile/map/pda/pdaRecord";
import { getCase } from "@/lib/cases/registry";
import type { CaseMapDistrict, CaseMapWork } from "@/lib/cases/types";

/**
 * THE CARD IS ONE DRAWING AT THREE SIZES (ADR-069, harmonised 2026-08-13;
 * ⚠ **THE THIRD SIZE LANDED WITH THE CARRIER, ADR-070 U33, 2026-08-18**).
 *
 * ADR-069's whole claim is that the selected work is a PERSISTENT OBJECT that
 * FLIES between reading 01's grid and reading 02's board rather than being
 * replaced. `pda-flight` already proves the two RECTS stay similar — but a rect
 * is a silhouette, and nothing measured what was drawn INSIDE it. Reading 02 was
 * redrawn on the R4 handoff (ADR-070 U11–U13) while reading 01 kept v18's
 * interior, so the one object the flight carries changed its corners, its mark,
 * its colour and its title's height at the instant of the swap — with every
 * guard green, because each drawing was only ever measured against itself.
 *
 * This file is the missing half: the grid card's interior is the seat card's ÷
 * `CORE_K`, rung for rung. It also owns the cartridge's own type, which used to
 * be measured in `pda-viewbox` against hardcoded `w - 19` / `w - 25` measures
 * while the drawing derived its own from `CARD.pad` — two sets of numbers for
 * one box, which is the drift this pass exists to remove.
 */

/** Every rung that exists on both cards, and nothing that exists on one. */
const RUNGS = [
  "cut",
  "pad",
  "mark",
  "markY",
  "headBase",
  "teamDx",
  "rule",
  "barLabel",
  "barLine",
  "footUp",
] as const;

/** The cartridge's own base box — reading 01's grid draws it at exactly this. */
const W = CARD_BOX.w;

/* The three homes as production computes them, at the resting field. The rects
   move with the elastic layouts, so they are DERIVED here rather than typed —
   a literal would be true at exactly one field shape. */
const GRID_RECT = gridRect(0, workLayout(workExt(0)));
const CONFIG_LAYOUT_0 = configLayout(configExt(0));

function allWorks(): PdaWork[] {
  const visual = getCase("loop-earplugs")?.casefile.tracks.find(
    (t) => t.visual.kind === "intelligence-map"
  )?.visual;
  if (!visual || visual.kind !== "intelligence-map") throw new Error("no intelligence-map track");
  const districts: readonly CaseMapDistrict[] = visual.districts;
  return visual.works.map((w: CaseMapWork) =>
    toPdaWork(
      w,
      districts.find((d) => d.id === w.dist)
    )
  );
}

describe("the grid card and the seat card are one drawing", () => {
  for (const rung of RUNGS) {
    it(`${rung} is the seat's own, at 1 / CORE_K`, () => {
      /* Both sides keep their EXACT numbers rather than one deriving from the
         other — R4's are authored integers and the grid's are 1/1.7 of them, so
         whichever way a multiply runs it lands one drawing on 17 significant
         digits for no gain. The RELATIONSHIP is what is asserted. */
      expect(CARD[rung] * CORE_K, `${rung} drifted between the two readings`).toBeCloseTo(
        SEAT[rung],
        9
      );
    });
  }

  it("the title's baseline is the one measure they do NOT share", () => {
    /* The one deliberate divergence, and it is arithmetic rather than taste:
       the seat fills the space under its title with THE BAR and the grid card
       letters no bar (owner — match the styling, not the content), so seat
       parity would pool 59 % of the grid card into one hole. `CART_TITLE_BASE`
       carries the derivation; `titleSeated` is the seat's own, used only by a
       card that DOES letter a bar. */
    expect(CARD.titleSeated * CORE_K).toBeCloseTo(SEAT.titleBase, 9);
  });

  it("every rung on the seat card is spoken for", () => {
    /* A rung added to one card and not the other is exactly how the two
       drawings drifted the first time, and it is invisible to every assertion
       above — those only walk the pairs that already exist. */
    const unpaired = Object.keys(SEAT).filter(
      (key) => !RUNGS.includes(key as (typeof RUNGS)[number]) && key !== "titleBase"
    );
    expect(unpaired, "these seat measures have no counterpart on the grid card").toEqual([]);
  });
});

/**
 * THE THIRD HOME (ADR-070 U33) — the carrier's hub.
 *
 * ⚠ **IT IS A DIFFERENT KIND OF THIRD SIZE FROM THE SECOND, AND THAT IS WHY IT
 * NEEDS ITS OWN CLAIMS RATHER THAN ANOTHER `RUNGS` COLUMN.** The seat is a
 * SEPARATE AUTHORED TABLE (`SEAT`), so what has to be guarded there is that two
 * sets of numbers agree — which is what the block above does. The hub mounts the
 * SHARED `Cartridge` at a `k`, so no interior table exists to drift and rung
 * parity is true by construction. What CAN go wrong is different: the scale
 * itself could be chosen by eye, the silhouette could be re-declared, or the
 * wrap capacity could move with the box the way it did at `k` 2 before the
 * harmonisation.
 */
describe("the hub card is that same drawing at a third size", () => {
  it("the scale is DERIVED — the plate's label rung over the card's title", () => {
    /* The rule stated once: the work's name letters at the rung the 47 Skill
       names around it letter at. A `k` picked to look right is a `k` that drifts
       the moment either end moves, and nothing would fail. */
    expect(CARRIER_HUB_K).toBeCloseTo(CARRIER_LABEL_FS / CART_TYPE.title, 12);
    expect(CART_TYPE.title * CARRIER_HUB_K, "the hub title left the label rung").toBeCloseTo(
      CARRIER_LABEL_FS,
      12
    );
  });

  it("all three homes take their silhouette from ONE constant", () => {
    /* ⚠ THE OUTLINE WAS THE PART THE HARMONISATION MISSED. The 2026-08-13 pass
       made the INTERIORS one drawing and left the box declared in each reading's
       own file; U33 added a third copy, at which point three files each held a
       number that could move alone. `CARD_BOX` is the source now, and this walks
       the three homes' widths back to it through their own scales. */
    expect(GRID_RECT.w).toBeCloseTo(CARD_BOX.w, 9);
    expect(GRID_RECT.h).toBeCloseTo(CARD_BOX.h, 9);
    expect(CONFIG_LAYOUT_0.core.w).toBeCloseTo(CARD_BOX.w * CORE_K, 9);
    expect(CONFIG_LAYOUT_0.core.h).toBeCloseTo(CARD_BOX.h * CORE_K, 9);
    expect(CARRIER_SEAT_RECT.w).toBeCloseTo(CARD_BOX.w * CARRIER_HUB_K, 9);
    expect(CARRIER_SEAT_RECT.h).toBeCloseTo(CARD_BOX.h * CARRIER_HUB_K, 9);
  });

  it("all three homes are EXACTLY similar, so one uniform dk carries the object", () => {
    /* `pdaFlight` scales by a single `dk`. Three rects that are merely close
       would distort the card in mid-air — which is ADR-069 U1's finding in its
       geometric form, and the estate footprint's 3 % delta is the one place this
       surface accepts an approximation (it is a simplified silhouette, not the
       card). These three are the CARD. */
    const base = CARD_BOX.w / CARD_BOX.h;
    for (const [where, r] of [
      ["the grid", GRID_RECT],
      ["the seat", CONFIG_LAYOUT_0.core],
      ["the hub", CARRIER_SEAT_RECT],
    ] as const) {
      expect(r.w / r.h, `${where} card is not the cartridge's proportion`).toBeCloseTo(base, 12);
    }
  });

  it("the wrap capacity does not move at the third scale either", () => {
    /* The `k`-missing bug, re-asked at the size it would next appear. Capacity
       is a RATIO of two lengths; a uniform scale may not change it. */
    expect(cartTitleChars(W * CARRIER_HUB_K, CARRIER_HUB_K)).toBe(cartTitleChars(W));
  });

  it("every live title still letters on one line in the hub", () => {
    /* Implied by the capacity identity above and asserted anyway, because the
       hub seats ANY of the twenty-seven — the reader chooses — while reading 01
       only ever grids twenty. The seven the grid leaves out are exactly where an
       over-long title would hide. */
    for (const w of allWorks()) {
      const t = w.title.toUpperCase();
      expect(
        wrapLines(t, cartTitleChars(W * CARRIER_HUB_K, CARRIER_HUB_K)),
        `"${t}" wrapped in the hub`
      ).toHaveLength(1);
    }
  });
});

describe("the grid card's title fits its box", () => {
  it("every live title letters on one line", () => {
    const titles = allWorks().map((w) => w.title.toUpperCase());
    expect(titles.length).toBeGreaterThanOrEqual(PDA_SHOWN);
    for (const t of titles.slice(0, PDA_SHOWN)) {
      /* A wrapped title collided with its own second line AND ran into the lane
         rail when the size was 12 — measured in the browser, not supposed. */
      expect(wrapLines(t, cartTitleChars(W)), `"${t}" wrapped`).toHaveLength(1);
      expect(
        t.length * CART_TYPE.title * MONO_ADVANCE,
        `"${t}" runs past the card wall`
      ).toBeLessThanOrEqual(cartTitleChars(W) * CART_TYPE.title * MONO_ADVANCE);
    }
  });

  it("the wrap capacity does not move with the scale", () => {
    /* ⚠ `k` WAS MISSING FROM THIS ARITHMETIC until the harmonisation: the
       measure scaled with the box while the divisor did not, so a card mounted
       at k 2 allowed twice the characters that fit. Capacity is a RATIO of two
       lengths — a uniform scale may not change it at all. */
    expect(cartTitleChars(W * 2, 2)).toBe(cartTitleChars(W));
    expect(cartTitleChars(W * CORE_K, CORE_K)).toBe(cartTitleChars(W));
  });

  it("the title is the largest thing on the card", () => {
    // The name of the work outranks its metadata. A record whose id letters
    // larger than its title is a record about ids.
    expect(CART_TYPE.title).toBeGreaterThan(CART_TYPE.code);
    expect(CART_TYPE.code).toBeGreaterThan(CART_TYPE.lane);
  });
});

describe("the grid card's header row leaves a gap in the middle", () => {
  it("the team code and the stream id cannot meet", () => {
    /* ⚠ THE LEFT ANCHOR IS NOT THE INSET ANY MORE. The state mark moved into
       this row in the harmonisation — it is what freed the band the title now
       rises into — so the team code starts past it and the pair shares less
       than the full measure. The old assertion, anchored at the inset, would
       have missed a collision by 22 units. */
    const teamStart = CARD.pad + CARD.teamDx;
    const team = 3 * CART_TYPE.code * (0.6 + 0.24);
    const id = 5 * CART_TYPE.code * (0.6 + 0.18);
    expect(
      teamStart + team + id,
      "the team code and the stream id meet in the middle of the header row"
    ).toBeLessThanOrEqual(W - CARD.pad);
  });
});

describe("the grid card's foot is one run, not a pair", () => {
  /* ⚠ `autonomy` CAME OFF THE CARD WITH THE LANE METER (owner, 2026-08-13).
     Reading 02 letters it on the OWNER PLATE, which is where a person's
     latitude belongs, and a value printed in both places is this surface's
     said-twice defect. So the foot is one LEFT-ANCHORED run — the four cells,
     the gap, and the label — and what it can overflow is the far wall rather
     than a neighbour in the middle. */
  it("the widest lane label clears the far inset", () => {
    const widest = Math.max(
      ...[...LANES.map((l) => `${l} TIER`), "NO LANE"].map(
        (label) => label.length * CART_TYPE.lane * (0.6 + 0.2)
      )
    );
    expect(
      meterLabelDx() + widest,
      "the lane meter and its label run past the card's inset"
    ).toBeLessThanOrEqual(cartPairMeasure(W));
  });

  it("the two homes letter the same lane for every stream", () => {
    /* The card may not disagree with itself about the record. The seat declares
       its strings in `configurationLettering`; the grid's come from the shared
       `laneLabel`, so this walks both against one record. */
    for (const w of allWorks()) {
      const tier = configurationLettering(w).find((s) => s.slot === "card.tier");
      expect(tier?.text, `${w.id}'s two cards disagree about its lane`).toBe(laneLabel(w.lane));
      // Person-led work runs on no lane and says so rather than lighting a cell.
      if (!w.configured) expect(laneLabel(w.lane), `${w.id} claims a lane`).toBe("NO LANE");
    }
  });
});
