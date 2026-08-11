import { describe, expect, it } from "vitest";

import {
  CONFIG_EXT_MAX,
  CONFIG_INSET,
  configExt,
  configLayout,
  configSpecWidth,
  configurationLettering,
} from "@/components/landing/home-v2/services/casefile/map/pda/PdaConfiguration";
import { VIEW_BOX } from "@/components/landing/home-v2/services/casefile/map/pda/PdaViews";
import {
  CART_TYPE,
  MONO_ADVANCE,
  cartTitleChars,
  wrapLines,
} from "@/components/landing/home-v2/services/casefile/map/pda/pdaGlyphs";
import {
  PDA_SHOWN,
  type PdaWork,
  toPdaWork,
} from "@/components/landing/home-v2/services/casefile/map/pda/pdaRecord";
import type { CaseMapDistrict, CaseMapWork } from "@/lib/cases/types";
import { getCase } from "@/lib/cases/registry";

/**
 * THE MAP'S CROPS AND ITS TYPE (ADR-063 U1).
 *
 * The arithmetic half of a two-part guard. This checks the crops contain what
 * the drawings declare and that the type sizes fit the boxes they sit in; the
 * smoke measures real glyph boxes in a real browser. NEITHER IS SUFFICIENT —
 * the arithmetic cannot see a CSS change, and the smoke cannot tell you which
 * constant to move.
 */

/**
 * ⚠ THE FLOOR THE OWNER SET (ADR-070 U10, 2026-08-11). U4's floor was 10,
 * which is 5.4px at the binding preset and 8.3px at 1920 — under the 8.5px
 * chrome floor ADR-063 already records as this surface's standing defect.
 * The verdict on the keys was "utterly illegible", and it is arithmetic
 * rather than taste: a label nobody can read is not a quiet label, it is an
 * absent one.
 */
const FS_FLOOR = 12;

function box(v: 1 | 2 | 3) {
  const [x, y, w, h] = VIEW_BOX[v].split(" ").map(Number);
  return { x, y, w, h, right: x + w, bottom: y + h };
}

function mapVisual() {
  const visual = getCase("loop-earplugs")?.casefile.tracks.find(
    (t) => t.visual.kind === "intelligence-map"
  )?.visual;
  if (!visual || visual.kind !== "intelligence-map") throw new Error("no intelligence-map track");
  return visual;
}

/** Live work titles — the drawing letters these, so they set the measure. */
function workTitles(): string[] {
  return mapVisual().works.map((w) => w.title.toUpperCase());
}

/**
 * ALL TWENTY-SEVEN, projected the way the drawing projects them.
 *
 * Reading 01 shows twenty, but reading 02 will letter ANY of them — the reader
 * chooses — so the fit guard has to walk the whole record. The seven the grid
 * leaves out are exactly where an over-long string would hide.
 */
function allWorks(): PdaWork[] {
  const visual = mapVisual();
  const districts: readonly CaseMapDistrict[] = visual.districts;
  return visual.works.map((w: CaseMapWork) =>
    toPdaWork(
      w,
      districts.find((d) => d.id === w.dist)
    )
  );
}

describe("the readings' crops", () => {
  /* Declared extents, from each view's own geometry. 01 is the 4x5 grid
     (`GX`/`GY` + the 176x136 cartridge); 03 from its top rule to the bottom
     section label. */
  const CONTENT = {
    1: { x: 12, y: 22, right: 12 + 3 * 192 + 176, bottom: 22 + 4 * 158 + 136 },
    /* 02 is the R4 substrate field (ADR-070 U11), drawn in the handoff's own
       888 x 744 stage coordinates. The bound content is the MODULE BLOCK —
       the left module's wall (4) and the seat's top edge (20) across to the
       right module's outer wall (884), down to the base module's floor.
       ⚠ THE BED IS NOT IN THIS BOX and does not need to be: since U14 it is
       mapped ACROSS the crop by construction, so it can no more escape the
       crop than the crop can escape itself. What has to be asserted about it
       is that it fills BOTH ends, which is what the centring test does. */
    2: { x: 4, y: 20, right: 884, bottom: 660 },
    // 03 lost its two section rules 2026-08-06 (owner) — the foot already
    // said it — and the crop tightened from 718 units to 632 behind them.
    3: { x: 10, y: 93, right: 766, bottom: 702 },
  } as const;

  for (const v of [1, 2, 3] as const) {
    it(`reading ${v} contains everything it draws`, () => {
      const b = box(v);
      const c = CONTENT[v];
      expect(b.x, `crop starts right of the content`).toBeLessThanOrEqual(c.x);
      expect(b.y, `crop starts below the content`).toBeLessThanOrEqual(c.y);
      expect(b.right, `crop ends left of the content`).toBeGreaterThanOrEqual(c.right);
      expect(b.bottom, `crop ends above the content`).toBeGreaterThanOrEqual(c.bottom);
    });

    it(`reading ${v} does not waste the axis it is bound on`, () => {
      /* ⚠ THE BOUND AXIS INVERTED FOR 02 (ADR-070 U11), so the guard has to
         ask a different question of it. Readings 01 and 03 are portrait
         drawings in a landscape field, i.e. HEIGHT-bound, and vertical slack
         there is a direct tax on rendered type — 40 units is breathing room,
         and the pre-crop boxes wasted 82 and 132.

         Reading 02's crop is now WIDER than the field's aspect, so it is
         WIDTH-bound and vertical slack costs nothing. Asserting height there
         would be measuring the free axis; what has to stay tight is the
         INSET, which is deliberate and uniform — see `CONFIG_VIEWBOX`. */
      const b = box(v);
      const c = CONTENT[v];
      if (v === 2) {
        /* ⚠ HORIZONTAL IS AN INSET, VERTICAL IS A CENTRING, and they are
           different contracts. The width chain never moves, so the side
           margins are the frame inset R4 draws — big enough that the outer
           modules do not touch the console wall (2.7px, measured, before it
           was restored) and small enough not to eat the type. */
        const side = [c.x - b.x, b.right - c.right];
        expect(side[0], `reading 2's frame inset is uneven: ${side.join("/")}`).toBe(side[1]);
        expect(side[0], `reading 2's inset is a letterbox now`).toBeGreaterThanOrEqual(18);
        expect(side[0], `reading 2's inset is a letterbox now`).toBeLessThanOrEqual(34);

        /* ⚠ THE MODULE BLOCK IS CENTRED (U14, owner). U12 hung the leftover
           height off the bottom as bed tail, which is invisible — 26 units of
           air above the seat against 135 below the base at the owner's own
           shape, and it read as the board sitting high in a panel with a hole
           under it. The air is halved now, and this is the assertion that
           says so. */
        expect(c.y - b.y, `reading 2's block is not centred in its crop`).toBeCloseTo(
          b.bottom - c.bottom,
          1
        );
        return;
      }
      expect(b.h - (c.bottom - c.y), `reading ${v} wastes vertical units`).toBeLessThanOrEqual(40);
    });
  }

  it("reading 02's crop is LANDSCAPE — it has to fill a laptop panel", () => {
    /* ⚠ THE ASPECT IS THE CONTRACT, and matching it to the PANEL is what pays
       for the type. `meet` scales by the minimum ratio, so the crop's aspect
       decides which axis letterboxes. Measured field aspects on the live
       landing: 1.223 (1280x720), 1.239 (1440x800), 1.118 (1920x1080).

         crop            aspect   meet @1280   meet @1920
         828 x 912       0.908      0.541        0.833     (U4, portrait)
         1000 x 912      1.096      0.541        0.833     (U10)
         932 x 751       1.241      0.647        0.912     (U11, the R4 frame)

       U11 takes the R4 handoff's own stage, whose 1.194 is almost exactly the
       panel it fills; with the reference's frame inset restored it is 1.241.
       That is a +20 % / +9 % type lift bought by the ASPECT ALONE, before a
       single font size moved — and it is what paid for lifting the
       reference's 6.5px chrome up to this surface's floor.

       ⚠ THIS IS THE BOARD AT REST NOW (U12). U11 shipped this crop STATIC and
       it cost 270px of dead panel at 845 x 950 — the third update in a row to
       pick one viewport shape and letterbox the other. The crop's height is
       measured from the field; `the configuration board fills the panel it is
       given` is the guard that walks the shapes this one cannot see. What
       stays asserted here is that the REST board is the landscape one, since
       that is what the laptop gets and what every measure above derives
       from. */
    const b = box(2);
    expect(b.w / b.h, "reading 02's crop went portrait again").toBeGreaterThanOrEqual(1.05);

    /* ⚠ AND THE COST AT THE OTHER END IS BOUNDED. At the tall field the fit
       is WIDTH-bound, so a crop that keeps widening shrinks the type there
       without limit. At 850x1120 the smallest rung has to stay over the
       smoke's 4.3px floor with room to spare. */
    const tall = Math.min(850 / b.w, 1120 / b.h);
    expect(FS_FLOOR * tall, "the tall field's type fell toward the floor").toBeGreaterThan(9);

    /* The binding short-wide field, where the drawing is height-bound. */
    const meet = Math.min(603 / b.w, 493 / b.h);
    expect(FS_FLOOR * meet, "the smallest rung fell under the smoke's floor").toBeGreaterThan(4.6);
  });
});

/**
 * READING 02'S BOARD IS HEIGHT-ELASTIC (ADR-070 U12).
 *
 * ⚠ THIS IS THE GUARD THE LAST THREE UPDATES DID NOT HAVE. U4, U10 and U11
 * each chose a static crop, measured it at ONE viewport shape, and shipped a
 * letterbox at the other end — U11's cost 270px of dead panel at 845 × 950,
 * which no assertion on this surface could see because every one of them
 * measured the drawing against its own crop rather than against the PANEL.
 * The elastic path has to be walked at every shape the console takes.
 */
describe("the configuration board fills the panel it is given", () => {
  /* Live console fields, measured on the landing. The last two are the tall
     ones that were paying for the landscape crop. */
  const FIELDS = [
    { at: "1280x720", w: 603, h: 493 },
    { at: "1440x800", w: 679, h: 548 },
    { at: "1920x1080", w: 850, h: 760 },
    { at: "1920x1200", w: 850, h: 880 },
    { at: "the owner's", w: 845, h: 950 },
    { at: "2560x1440", w: 850, h: 1120 },
    { at: "1280x1440", w: 603, h: 1177 },
  ] as const;

  const crop = (ext: number) => {
    const [x, y, w, h] = configLayout(ext).crop.split(" ").map(Number);
    return { x, y, w, h, right: x + w, bottom: y + h };
  };

  it("the crop grows by exactly the height the field offers", () => {
    /* The whole mechanism in one line: the crop is `751 + ext`, and the block
       plus its two margins is exactly that. If these ever disagree the board
       is either overflowing its crop or leaving a gap inside it. */
    for (const ext of [0, 11, 82, 160, 297, CONFIG_EXT_MAX]) {
      const c = crop(ext);
      const l = configLayout(ext);
      expect(c.h, `ext ${ext}: the crop and the chain disagree`).toBeCloseTo(751 + ext, 1);
      expect(
        l.margin * 2 + (l.blockBottom - 20),
        `ext ${ext}: the block and its margins do not fill the crop`
      ).toBeCloseTo(c.h, 1);
      // Air, never a negative margin — the block may not outgrow its crop.
      expect(l.margin, `ext ${ext}: the block overflows its crop`).toBeGreaterThan(20);
    }
  });

  it("nothing overlaps, and the inset holds, at every height", () => {
    for (const ext of [0, 11, 82, 160, 297, CONFIG_EXT_MAX]) {
      const l = configLayout(ext);
      const c = crop(ext);
      const where = `ext ${ext}`;

      // The vertical chain stays in order, with real cable between the docks.
      expect(l.core.y, `${where}: the card rode up into the seat`).toBeGreaterThan(128 + 20);
      expect(l.base.y, `${where}: the base rode up into the card`).toBeGreaterThan(
        l.core.y + l.core.h + 20
      );
      // The satellites are co-centred with the card, as the reference has them.
      expect(l.left.y + l.left.h / 2, `${where}: the band lost its centre`).toBeCloseTo(
        l.core.y + l.core.h / 2,
        6
      );
      // A module always holds its own header and cells.
      expect(34 + 2 * l.cellH, `${where}: the satellites overflow`).toBeLessThanOrEqual(l.satH);
      expect(34 + l.cellH, `${where}: the base module overflows`).toBeLessThanOrEqual(l.baseH);

      // The SIDE inset is uniform and unchanged — U11's finding, kept.
      expect(4 - c.x, `${where}: the left inset moved`).toBe(CONFIG_INSET);
      expect(c.right - 884, `${where}: the right inset moved`).toBe(CONFIG_INSET);
      // ...and the block is centred vertically at every height (U14).
      // ⚠ ONE PLACE, not six: the crop string is rounded to 2dp on purpose
      // (it lands in the DOM and in the flight's arithmetic).
      expect(20 - c.y, `${where}: the head air drifted`).toBeCloseTo(l.margin, 1);
      expect(c.bottom - l.blockBottom, `${where}: the block is off-centre`).toBeCloseTo(
        l.margin,
        1
      );
    }
  });

  it("every measured field fills, or names what it cannot", () => {
    for (const f of FIELDS) {
      const ext = configExt(f.h / f.w);
      const c = crop(ext);
      const meet = Math.min(f.w / c.w, f.h / c.h);
      const slack = Math.round(f.h - c.h * meet);

      /* ⚠ THE TYPE NEVER PAYS FOR THIS. The board stays WIDTH-bound by
         construction, so `meet` is `field.w / crop.w` at every height and the
         floor renders the same everywhere the clamp is not reached.
         ⚠ RELATIVE, not exact: `configExt` rounds to whole authoring units,
         which can leave the crop a unit tall and the fit a hair height-bound.
         0.999 is the claim that matters — that the elasticity is free. */
      expect(
        meet / (f.w / c.w),
        `${f.at}: the board went height-bound and shrank its type`
      ).toBeGreaterThan(0.999);
      expect(FS_FLOOR * meet, `${f.at}: the floor fell under the smoke's`).toBeGreaterThan(4.6);

      if (ext < CONFIG_EXT_MAX) {
        // Everything short of the clamp fills the panel outright.
        expect(slack, `${f.at}: ${slack}px of dead panel under the board`).toBeLessThanOrEqual(2);
      } else {
        /* ⚠ ONE MEASURED SHAPE REACHES THE CLAMP — a PORTRAIT desktop window
           — and there the board letterboxes on purpose, because a 590-unit
           bus run is a gap with wires in it rather than a cable. The clamp
           still has to be buying most of the trade: U11's static crop left
           691px empty here and the elastic board leaves 290. */
        const wasStatic = f.h - 751 * meet;
        expect(slack, `${f.at}: the clamp is not buying enough`).toBeLessThan(wasStatic * 0.55);
        expect(slack / f.h, `${f.at}: the clamp leaves the panel mostly empty`).toBeLessThan(0.28);
      }
    }
  });

  it("a short-wide field never compresses the reference's own board", () => {
    // Below the reference proportions there is nothing to give back: the
    // board is R4's at rest and only ever grows.
    expect(configExt(0.4), "a wide field squeezed the chain").toBe(0);
    expect(configLayout(configExt(0.4)).crop, "the rest crop moved").toBe(configLayout(0).crop);
  });
});

describe("the cartridge's type fits its box", () => {
  /* 176-unit cartridge: the title is anchored to the left wall alone and runs
     to `w - 19`; the metadata rows are PAIRS pinned to opposite walls and
     share one `w - 25` measure between them. */
  const W = 176;
  const TITLE_MEASURE = W - 19;
  const PAIR_MEASURE = W - 25;

  it("every live title fits one line", () => {
    const titles = workTitles();
    expect(titles.length).toBeGreaterThanOrEqual(PDA_SHOWN);
    for (const t of titles.slice(0, PDA_SHOWN)) {
      const width = t.length * CART_TYPE.title * MONO_ADVANCE;
      expect(width, `"${t}" runs past the cartridge wall`).toBeLessThanOrEqual(TITLE_MEASURE);
      // ...and the wrapper agrees, so no title splits onto a second line.
      // A wrapped title collided with its own second line and with the lane
      // rail when this was 12 — measured, not supposed.
      expect(wrapLines(t, cartTitleChars(W)), `"${t}" wrapped`).toHaveLength(1);
    }
  });

  it("the metadata pairs leave a gap in the middle", () => {
    // Worst case per row, from the live record's shapes.
    const code = 3 * CART_TYPE.code * 0.8 + 5 * CART_TYPE.code * 0.76;
    const lane = 8 * CART_TYPE.lane * 0.76 + 7 * CART_TYPE.lane * 0.76;
    expect(code, "the team code and stream id meet in the middle").toBeLessThan(PAIR_MEASURE * 0.9);
    expect(lane, "the lane and autonomy labels meet in the middle").toBeLessThan(
      PAIR_MEASURE * 0.9
    );
  });

  it("the title is the largest thing in the cartridge", () => {
    // The name of the work outranks its metadata. A record whose id letters
    // larger than its title is a record about ids.
    expect(CART_TYPE.title).toBeGreaterThan(CART_TYPE.code);
    expect(CART_TYPE.code).toBeGreaterThan(CART_TYPE.lane);
  });
});

/**
 * READING 02 IS THE R4 SUBSTRATE FIELD (ADR-070 U11).
 *
 * It declares every string it letters together with the measure that string
 * has to fit (`configurationLettering`), so this guard measures THE DRAWING'S
 * OWN INPUTS rather than re-deriving them — a guard that re-derives cannot
 * notice the drawing pointing at the wrong field. Sub-card values wrap to
 * three lines and THE BAR to two; the line past each cap is declared with a
 * ZERO measure, so a tail the wrapper would slice off fails here loudly
 * instead of vanishing on screen.
 */
describe("the configuration letters into its boxes", () => {
  it("every string on every stream fits its measure", () => {
    const works = allWorks();
    expect(works.length).toBeGreaterThanOrEqual(PDA_SHOWN);
    for (const w of works) {
      const specs = configurationLettering(w);
      expect(specs.length, `${w.id} letters nothing`).toBeGreaterThan(20);
      for (const spec of specs) {
        expect(spec.text.length, `${w.id} ${spec.slot} is blank`).toBeGreaterThan(0);
        expect(
          configSpecWidth(spec),
          `${w.id} ${spec.slot}: "${spec.text}" runs past its ${spec.measure}u measure`
        ).toBeLessThanOrEqual(spec.measure);
      }
    }
  });

  it("no single WORD runs through a sub-card wall", () => {
    /* ⚠ THE BINDING NUMBER IS A WORD, NOT A STRING — `wrapLines` breaks on
       spaces only, so a word longer than the measure overflows however well
       the whole value wraps, and every per-line assertion above still passes
       because each LINE is short. INTELLIGENCE (12 chars) is the record's
       longest and it is what fixes the value size at 11 and the node at 228. */
    for (const w of allWorks()) {
      for (const spec of configurationLettering(w)) {
        if (spec.measure === 0) continue;
        const longest = spec.text.split(" ").reduce((a, b) => (b.length > a.length ? b : a), "");
        expect(
          longest.length * spec.fs * (0.6 + spec.track),
          `${w.id} ${spec.slot}: the word "${longest}" is wider than its ${spec.measure}u box`
        ).toBeLessThanOrEqual(spec.measure);
      }
    }
  });

  it("nothing letters under the floor the owner set", () => {
    /* ⚠ 12 SINCE U10 — see `FS_FLOOR`. U4's 10 rendered 5.4px at the binding
       preset and 8.3px at 1920, under the 8.5px chrome floor; the owner ruled
       the keys illegible and the ladder was rebuilt around this rung. */
    for (const spec of configurationLettering(allWorks()[0])) {
      expect(spec.fs, `${spec.slot} letters at ${spec.fs}`).toBeGreaterThanOrEqual(FS_FLOOR);
    }
  });

  it("no value wants a line past its cap", () => {
    /* `wrapLines` SLICES at its cap, so a value that wanted one more line
       would lose its tail silently and every fit assertion above would still
       pass. The line past the cap is declared with a zero measure for exactly
       that reason: this is the assertion that sees it. */
    for (const w of allWorks()) {
      for (const spec of configurationLettering(w)) {
        expect(
          spec.measure,
          `${w.id} ${spec.slot} wants a line past the cap: "${spec.text}"`
        ).toBeGreaterThan(0);
      }
    }
  });
});

describe("what the owner deleted stays deleted", () => {
  it("no readout, no draw meter, no derived caption", () => {
    /* ⚠ ADR-070 U3/U4 (owner, quoted at the ADR): the reactive readout
       sentence, the DRAW PER RUN meter with NEVER A PRICE, and the
       DRAWS ON n OF m caption are all GONE. The notes stay in the RECORD; the
       DRAWING declares no slot for any of them. Each returning is a
       deliberate decision, not a drift. */
    for (const w of allWorks()) {
      const slots = configurationLettering(w).map((s) => s.slot);
      const texts = configurationLettering(w).map((s) => s.text);
      expect(
        slots.some((s) => s.startsWith("readout.")),
        `${w.id} letters a readout slot`
      ).toBe(false);
      expect(
        texts.some((t) => /DRAW PER RUN|NEVER A PRICE|DRAWS ON/.test(t)),
        `${w.id} letters a deleted chrome string`
      ).toBe(false);
    }
  });

  it("the card's meter is the LANE LADDER and nothing else", () => {
    /* ⚠ THE ONE DELETED THING THE R4 HANDOFF BRINGS BACK (ADR-070 U11), and
       it is a DIFFERENT QUANTITY wearing the same shape. U4 removed the meter
       that measured WORKLOAD — `PdaWork.draw`, which needed a NEVER A PRICE
       caption to stay honest and still letters nowhere. This one is the
       capability LANE: generic by law, already published, and with exactly
       four values, so the gauge IS the record rather than a rating of it.

       The guard is that the tier can only ever be one of the record's own
       four lanes, or the honest absence. An invented tier — or the word DRAW
       creeping back onto it — fails here. */
    const LANES = ["FAST TIER", "EVERYDAY TIER", "DEEP TIER", "FRONTIER TIER", "NO LANE"];
    const seen = new Set<string>();
    for (const w of allWorks()) {
      const tier = configurationLettering(w).find((s) => s.slot === "card.tier");
      expect(tier, `${w.id} draws no lane ladder`).toBeDefined();
      expect(LANES, `${w.id} letters an invented tier: "${tier!.text}"`).toContain(tier!.text);
      expect(tier!.text, `${w.id}'s tier reads as workload, not capability`).not.toMatch(/DRAW/);
      seen.add(tier!.text);
      // Person-led runs on no lane, and says so rather than lighting a cell.
      if (!w.configured) expect(tier!.text, `${w.id} claims a lane`).toBe("NO LANE");
    }
    // All four lanes plus the absence are live in the record — a ladder whose
    // top rung nothing reaches is a scale the reader cannot calibrate.
    expect(seen.size, `the record no longer spans the lane ladder`).toBe(LANES.length);
  });
});

describe("person-led work answers all four questions", () => {
  it("prints what is not bound rather than emptying out", () => {
    /* The negative space is the reading leadership takes (ADR-062), so a
       stream with no configuration still fills every sub-card — an empty one
       would read as a drawing that failed to load. */
    const person = allWorks().filter((w) => !w.configured);
    expect(person.length, "the record lost its person-led work").toBe(3);
    for (const w of person) {
      for (const spec of configurationLettering(w)) {
        expect(spec.text.length, `${w.id} ${spec.slot} is blank`).toBeGreaterThan(0);
        expect(
          configSpecWidth(spec),
          `${w.id} ${spec.slot}: "${spec.text}" runs past its measure`
        ).toBeLessThanOrEqual(spec.measure);
      }
    }
  });

  it("never claims a lane it does not run on", () => {
    for (const w of allWorks()) {
      if (w.configured) continue;
      expect(w.cfg.laneRun).toBe("NO LANE");
      expect(w.cfg.skill).toContain("NOT BOUND");
    }
  });
});
