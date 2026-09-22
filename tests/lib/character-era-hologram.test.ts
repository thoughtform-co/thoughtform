import { existsSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  CANONICAL_CHARACTER_ERA_HOLOGRAM,
  CHARACTER_ERAS,
  containedHologramPlacement,
  HOLO_FIGURE_SPAN,
  holoFigureFit,
  holoFigureHeadShare,
  holoFigureStature,
  isCharacterEraHologram,
  resolveCharacterEraHologram,
  type CharacterEraHologram,
} from "@/lib/voidwalker/characterEras";

describe("ADR-082 · normalized character hologram assets", () => {
  it("pins the canonical delivery canvas and authored figure anchors", () => {
    expect(CANONICAL_CHARACTER_ERA_HOLOGRAM).toEqual({
      videoPath: "/videos/voidwalker/holo-idle-thoughtform.mp4",
      videoAlphaPath: "/videos/voidwalker/holo-idle-thoughtform.webm",
      // ADR-082 U23's Safari alpha source. The `toEqual` above is exhaustive
      // on purpose, which is why adding the field failed this pin first.
      videoAlphaHevcPath: "/videos/voidwalker/holo-idle-thoughtform.mov",
      posterPath: "/images/voidwalker/holo-still-thoughtform.jpg",
      posterAlphaPath: "/images/voidwalker/holo-still-thoughtform.webp",
      // ADR-082 U31's era-band bust. Exhaustive on purpose, again: a new field
      // on the delivery contract has to fail this pin before it ships.
      thumbPath: "/images/voidwalker/holo-thumb-thoughtform.webp",
      frame: { width: 720, height: 1280 },
      headY: 0.122,
      footY: 0.998,
    });
    expect(isCharacterEraHologram(CANONICAL_CHARACTER_ERA_HOLOGRAM)).toBe(true);
  });

  it("gives every delivery its own bust, cut from its own poster (ADR-082 U31)", () => {
    /* The era band is a thumbnail gallery, and U23 had dropped the framed bust
       WITH five lazily-fetched full posters (~363 KB). So the bust is a small
       file of its own, REQUIRED on the delivery, and three things are pinned:
         · it carries its poster's version — a re-cut figure cannot keep a
           stale bust (`holo-still-azeroth-v11` ⇒ `holo-thumb-azeroth-v11`);
         · it is on disk, a WebP, and inside the 10 KB budget;
         · two eras share a bust only by sharing a DELIVERY — never by two
           strings that happen to be equal. */
    const stem = (p: string, prefix: string) =>
      p
        .slice(p.lastIndexOf("/") + 1)
        .replace(prefix, "")
        .replace(/\.[a-z0-9]+$/i, "");
    const seen = new Map<string, CharacterEraHologram>();
    for (const era of CHARACTER_ERAS) {
      const h = resolveCharacterEraHologram(era);
      expect(stem(h.thumbPath, "holo-thumb-"), era.id).toBe(stem(h.posterAlphaPath, "holo-still-"));
      const file = join(process.cwd(), "public", h.thumbPath);
      expect(existsSync(file), `${era.id}: ${h.thumbPath} is on disk`).toBe(true);
      expect(statSync(file).size, `${era.id}: bust budget`).toBeLessThanOrEqual(10_240);
      const owner = seen.get(h.thumbPath);
      if (owner) expect(owner, `${era.id} shares a bust only with its own delivery`).toBe(h);
      seen.set(h.thumbPath, h);
    }
    // A thumbnail is never a full poster in disguise.
    expect(
      isCharacterEraHologram({
        ...CANONICAL_CHARACTER_ERA_HOLOGRAM,
        thumbPath: CANONICAL_CHARACTER_ERA_HOLOGRAM.posterAlphaPath,
      })
    ).toBe(false);
    const { thumbPath: _dropped, ...withoutThumb } = CANONICAL_CHARACTER_ERA_HOLOGRAM;
    void _dropped;
    expect(isCharacterEraHologram(withoutThumb), "the bust is required").toBe(false);
  });

  it("keeps every unauthored era on the canonical pair", () => {
    /* TWO eras are authored now, and the comment that stood here named one.
     *
     *  · AZEROTH — the WoW warlock Arafel (the owner's actual 2020 character)
     *    in his own "Daemoniac" transmog, TALKING, rendered in Blender from
     *    `wow.export`'s rigged GLB on an emissive hologram material, by the
     *    wave `voidwalker-avatar/waves/20260830-azeroth-v5-blender`.
     *  · GENAI — the Starhaven captain, from the owner's own reference
     *    painting with his identity locked from the 2025 shoot, by the wave
     *    `voidwalker-avatar/waves/20260918-genai-v1` (ADR-082 U23).
     *
     * Only `loop` still resolves to the canonical pair — it IS the Architect —
     * and that is exactly what this walk proves after a roster change.
     * (`pokemon-go` got its own figure in ADR-082 U33: the trainer, a cel.) */
    const authored = new Set(["azeroth", "genai", "expanse", "pokemon-go"]);
    for (const era of CHARACTER_ERAS) {
      if (authored.has(era.id)) continue;
      expect(resolveCharacterEraHologram(era), era.id).toBe(CANONICAL_CHARACTER_ERA_HOLOGRAM);
    }
  });

  it("resolves the expanse era to its authored set-visit hologram", () => {
    const expanse = CHARACTER_ERAS.find((e) => e.id === "expanse");
    expect(expanse?.hologram).toBeDefined();
    expect(isCharacterEraHologram(expanse?.hologram)).toBe(true);
    expect(resolveCharacterEraHologram(expanse!)).toBe(expanse!.hologram);
    // ⚠ v2 (ADR-082 U32) SHIPPED WITHOUT A `.mov`, and v1's was deleted with it:
    // an HEVC-alpha file pointing at the standing v1 figure would show Safari
    // a different man. v3 (U33) and v4 (U34) keep that: Safari takes the floor
    // until a Mac cuts one.
    expect(expanse?.hologram?.videoAlphaHevcPath).toBeUndefined();
    expect(expanse?.hologram?.videoAlphaPath).toBe("/videos/voidwalker/holo-idle-expanse-v5.webm");
    expect(expanse?.hologram?.thumbPath).toBe("/images/voidwalker/holo-thumb-expanse-v5.webp");
    expect(expanse?.hologram?.footY).toBeCloseTo(0.9953, 3);
    // ⚠ v4 STANDS (U34, the commander), so no stature is authored: the span is
    // the delivery's own head-to-foot, like every other standing era. A stature
    // left behind from the kneel would seat a standing man as a kneeling one.
    expect(expanse?.hologram?.stature).toBeUndefined();
    /* ⚠ ITS LOADOUT WAS BYTE-IDENTICAL TO `pokemon-go`'s until this wave, which
       is what a placeholder looks like. They may never be equal again. */
    const pokemon = CHARACTER_ERAS.find((e) => e.id === "pokemon-go");
    expect(expanse?.loadout).not.toBe(pokemon?.loadout);
  });

  it("resolves the pokemon-go era to its authored trainer (ADR-082 U33)", () => {
    const pokemon = CHARACTER_ERAS.find((e) => e.id === "pokemon-go");
    expect(pokemon?.hologram).toBeDefined();
    expect(isCharacterEraHologram(pokemon?.hologram)).toBe(true);
    expect(resolveCharacterEraHologram(pokemon!)).toBe(pokemon!.hologram);
    expect(pokemon?.hologram?.videoAlphaPath).toBe(
      "/videos/voidwalker/holo-idle-pokemon-go-v1.webm"
    );
    // Standing: the span IS the stature, so none is authored.
    expect(pokemon?.hologram?.stature).toBeUndefined();
    // No `.mov` exists for it; Safari takes the floor until a Mac cuts one.
    expect(pokemon?.hologram?.videoAlphaHevcPath).toBeUndefined();
    expect(pokemon?.hologram?.footY).toBeCloseTo(0.9953, 3);
  });

  it("resolves the genai era to its authored Starhaven hologram", () => {
    const genai = CHARACTER_ERAS.find((e) => e.id === "genai");
    expect(genai?.hologram).toBeDefined();
    expect(isCharacterEraHologram(genai?.hologram)).toBe(true);
    expect(resolveCharacterEraHologram(genai!)).toBe(genai!.hologram);
    expect(genai?.hologram?.videoAlphaPath).toBe("/videos/voidwalker/holo-idle-genai-v2.webm");
    // ⚠ It ships the Safari lane too, unlike azeroth — its matte is one figure
    // with a clean silhouette, so the encoder meets the fidelity standard.
    expect(genai?.hologram?.videoAlphaHevcPath).toBe("/videos/voidwalker/holo-idle-genai-v2.mov");
    /* The anchors are MEASURED off the delivered alpha over every frame, and
       the figure was SEATED so they land beside the canonical pair's rather
       than hovering above the projector disc. */
    expect(genai?.hologram?.footY).toBeCloseTo(0.993, 3);
    expect(genai?.hologram?.headY).toBeCloseTo(0.0563, 3);
  });

  it("resolves the azeroth era to its authored Arafel hologram", () => {
    const azeroth = CHARACTER_ERAS.find((e) => e.id === "azeroth");
    expect(azeroth?.hologram).toBeDefined();
    expect(isCharacterEraHologram(azeroth?.hologram)).toBe(true);

    const resolved = resolveCharacterEraHologram(azeroth);
    expect(resolved).not.toBe(CANONICAL_CHARACTER_ERA_HOLOGRAM);
    // ⚠ `-v10` IS PART OF THE CONTRACT. Every wave has shipped under its own
    // suffix since v1 took the unsuffixed names — a cache does not read commit
    // messages, so a new URL is the only guarantee the new figure reaches the
    // reader. v6 capped the fel mask, v7 stood the imp arc off the figure, v8
    // seated a class in front and v9 removed it again; v10 chains three talk
    // emotes and takes the waist piece off; v11 is v10 SEATED — the same 240
    // frames moved down 33 rows so his boots reach the disc (ADR-082 U31).
    expect(resolved.videoPath).toBe("/videos/voidwalker/holo-idle-azeroth-v11.mp4");
    expect(resolved.videoAlphaPath).toBe("/videos/voidwalker/holo-idle-azeroth-v11.webm");
    expect(resolved.posterPath).toBe("/images/voidwalker/holo-still-azeroth-v11.jpg");
    expect(resolved.posterAlphaPath).toBe("/images/voidwalker/holo-still-azeroth-v11.webp");
    // Measured off the DELIVERED alpha at the opaque cutoff 32/255, over all
    // 240 frames rather than frame zero — a talking idle's head and hands move,
    // so an anchor read from one pose is wrong for the other 239. They agree
    // with the camera solve's own projection to three decimals, which is what
    // says the delivered frame is the frame that was solved. ⚠ And they are
    // read off the FIGURE-ONLY render: on the composite the same script returns
    // footY 0.9719, which is the imps' claws three rows under his boots.
    //
    // ⚠ headY MOVED 0.159 → 0.235 WHEN THE PERFORMANCE BECAME A CHAIN, and it
    // is arithmetic. The frame is WIDTH-bound, the fit takes the widest pose in
    // the loop, and the 0.5625 slot then sets the height — so reach costs
    // scale. Per emote the man spans 1.400 m in EmoteTalkSubdued (all
    // pauldron), 1.446 m in EmoteTalkQuestion and 1.549 m in EmoteTalk, where
    // the gauntlet swings out: that one emote widens him 10.6 % and stands him
    // 8 % shorter in the slot. footY did not move, so the projector disc has
    // not either — the surplus is all above his head. Fitting by height instead
    // cut an 81px-tall flat edge through the left pauldron on 117 of 149
    // frames, and a gauntlet is worn: "a plume may run off the edge; the man
    // may not".
    //
    // ⚠ v11's PAIR IS v10's PLUS 33/1280 ON BOTH, EXACTLY (ADR-082 U31). The
    // shift cannot change the span, and the span is `HOLO_FIGURE_SPAN`: he is
    // the floor era, so his fit must be exactly 1. Re-measuring and rounding
    // each anchor on its own gives 0.2609 / 0.9953 — a span of 0.7344, a fit of
    // 0.99986, and a red "floor era returns exactly 1" below for a reason that
    // would look like float noise.
    expect(resolved.headY).toBe(0.261);
    expect(resolved.footY).toBe(0.9953);
    expect(+(resolved.footY - resolved.headY).toFixed(4)).toBe(0.7343);
    // Seated: every era's boots end inside the last 1 % of the canvas now.
    expect(resolved.footY).toBeGreaterThanOrEqual(0.99);
    // Sanity: the head anchor is above the foot anchor and both are inside
    // the frame — the same law the runtime guard enforces on every era.
    expect(resolved.headY).toBeLessThan(resolved.footY);
    expect(resolved.headY).toBeGreaterThanOrEqual(0);
    expect(resolved.footY).toBeLessThanOrEqual(1);
  });

  it("accepts a complete future pair and rejects malformed generated records", () => {
    const future = {
      videoPath: "/videos/voidwalker/holo-idle-loop.mp4",
      videoAlphaPath: "/videos/voidwalker/holo-idle-loop.webm",
      posterPath: "/images/voidwalker/holo-still-loop.webp",
      posterAlphaPath: "/images/voidwalker/holo-still-loop.png",
      thumbPath: "/images/voidwalker/holo-thumb-loop.webp",
      frame: { width: 720, height: 1280 },
      headY: 0.11,
      footY: 0.997,
    } as const satisfies CharacterEraHologram;

    expect(isCharacterEraHologram(future)).toBe(true);
    expect(resolveCharacterEraHologram({ hologram: future })).toBe(future);

    const malformed = {
      ...future,
      frame: { width: 721, height: 1280 },
      footY: Number.NaN,
    };
    expect(isCharacterEraHologram(malformed)).toBe(false);
    expect(
      resolveCharacterEraHologram({ hologram: malformed as unknown as CharacterEraHologram })
    ).toBe(CANONICAL_CHARACTER_ERA_HOLOGRAM);
  });

  /**
   * ⚠ THE ALPHA BRANCH'S WHOLE PREMISE IS TRANSPARENCY, so a format that
   * cannot carry an alpha channel must not be admitted to it. H.264-in-MP4
   * has no alpha and JPEG has none either — which is precisely how the
   * station ended up faking transparency with an opaque floor, and why the
   * owner saw a black pane. A widened regex here would restore that bug
   * silently, with the markup still claiming `data-holo-alpha`.
   */
  it("refuses an opaque format in either alpha slot", () => {
    const base = {
      videoPath: "/videos/voidwalker/holo-idle-loop.mp4",
      videoAlphaPath: "/videos/voidwalker/holo-idle-loop.webm",
      posterPath: "/images/voidwalker/holo-still-loop.webp",
      posterAlphaPath: "/images/voidwalker/holo-still-loop.png",
      thumbPath: "/images/voidwalker/holo-thumb-loop.webp",
      frame: { width: 720, height: 1280 },
      headY: 0.11,
      footY: 0.997,
    } as const satisfies CharacterEraHologram;

    expect(isCharacterEraHologram(base)).toBe(true);

    // MP4 in the alpha video slot: the exact substitution that reintroduces
    // an opaque source on the branch that switches the floor off.
    expect(
      isCharacterEraHologram({ ...base, videoAlphaPath: "/videos/voidwalker/holo-idle-loop.mp4" })
    ).toBe(false);

    // JPEG in the alpha poster slot: flashes an opaque rectangle while the
    // video buffers, which is the same defect one frame earlier.
    for (const jpeg of ["/images/voidwalker/holo-still-loop.jpg", "/images/voidwalker/x.jpeg"]) {
      expect(isCharacterEraHologram({ ...base, posterAlphaPath: jpeg }), jpeg).toBe(false);
    }

    // And the non-alpha slots keep accepting what they always did.
    expect(isCharacterEraHologram({ ...base, posterPath: "/images/voidwalker/s.jpg" })).toBe(true);
  });

  /**
   * ADR-082 U23's Safari lane. The container IS the contract here: Safari
   * composites HEVC alpha out of a QuickTime `.mov` and NOT out of an `.mp4`,
   * so admitting the wrong extension switches the floor off over a source the
   * engine reads as opaque — the black pane the branch exists to remove, in
   * the one place nobody looks.
   *
   * ⚠ NO CI PROJECT CAN EXERCISE THE RENDER PATH (every Playwright project is
   * Chromium, which takes VP9 and never runs the HEVC probe), so this record
   * guard and a hand walk on a real device are the whole of its coverage.
   */
  it("takes a `.mov` in the HEVC alpha slot, refuses every other container, and stays optional", () => {
    const base = {
      videoPath: "/videos/voidwalker/holo-idle-loop.mp4",
      videoAlphaPath: "/videos/voidwalker/holo-idle-loop.webm",
      posterPath: "/images/voidwalker/holo-still-loop.webp",
      posterAlphaPath: "/images/voidwalker/holo-still-loop.png",
      thumbPath: "/images/voidwalker/holo-thumb-loop.webp",
      frame: { width: 720, height: 1280 },
      headY: 0.11,
      footY: 0.997,
    } as const satisfies CharacterEraHologram;

    // ⚠ OPTIONAL, AND THAT IS LOAD-BEARING: the two shipped pairs predate the
    // field and `azeroth` will never carry one, so an absent slot must pass.
    expect(isCharacterEraHologram(base)).toBe(true);
    expect(isCharacterEraHologram({ ...base, videoAlphaHevcPath: undefined })).toBe(true);

    expect(
      isCharacterEraHologram({
        ...base,
        videoAlphaHevcPath: "/videos/voidwalker/holo-idle-loop.mov",
      })
    ).toBe(true);

    for (const wrong of [
      "/videos/voidwalker/holo-idle-loop.mp4",
      "/videos/voidwalker/holo-idle-loop.webm",
      "/images/voidwalker/holo-still-loop.png",
      "holo-idle-loop.mov",
    ]) {
      expect(isCharacterEraHologram({ ...base, videoAlphaHevcPath: wrong }), wrong).toBe(false);
    }
  });

  it("ships the canonical pair's Safari alpha source, and azeroth deliberately without one", () => {
    // The canonical pair is what four of the five eras resolve to, so this one
    // file is what puts the Architect, Latent Land, The Expanse and Pokémon GO
    // on real alpha in Safari.
    expect(CANONICAL_CHARACTER_ERA_HOLOGRAM.videoAlphaHevcPath).toBe(
      "/videos/voidwalker/holo-idle-thoughtform.mov"
    );

    /* ⚠ AZEROTH HAS NONE, BY MEASUREMENT RATHER THAN BY OVERSIGHT. Its matte
       carries a plume and three companions; encoded against the VP9 master the
       mean alpha error plateaus at ~2.6/255 at EVERY quality setting while the
       file runs from 4 MB to 12 MB. It misses the <=1/255 standard at every
       size, so it keeps the floor on Safari — which is exactly what it had. */
    const azeroth = CHARACTER_ERAS.find((era) => era.id === "azeroth");
    expect(azeroth?.hologram).toBeDefined();
    expect(azeroth?.hologram?.videoAlphaHevcPath).toBeUndefined();
  });
});

describe("containedHologramPlacement", () => {
  it("bottom-centres a width-constrained 720 × 1280 hologram", () => {
    const placement = containedHologramPlacement(360, 700, CANONICAL_CHARACTER_ERA_HOLOGRAM);

    expect(placement).not.toBeNull();
    expect(placement!.scale).toBe(0.5);
    expect(placement!.width).toBe(360);
    expect(placement!.height).toBe(640);
    expect(placement!.left).toBe(0);
    expect(placement!.top).toBe(60);
    expect(placement!.footY).toBeCloseTo(698.72, 8);
    expect(placement!.gapBelowFoot).toBeCloseTo(1.28, 8);
  });

  it("bottom-centres a height-constrained hologram without stretching it", () => {
    const placement = containedHologramPlacement(500, 640, CANONICAL_CHARACTER_ERA_HOLOGRAM);

    expect(placement).not.toBeNull();
    expect(placement!.scale).toBe(0.5);
    expect(placement!.width).toBe(360);
    expect(placement!.height).toBe(640);
    expect(placement!.left).toBe(70);
    expect(placement!.top).toBe(0);
    expect(placement!.gapBelowFoot).toBeCloseTo(1.28, 8);
  });

  it("fails closed for invalid slot or anchor geometry", () => {
    expect(containedHologramPlacement(0, 640, CANONICAL_CHARACTER_ERA_HOLOGRAM)).toBeNull();
    expect(
      containedHologramPlacement(360, Number.NaN, CANONICAL_CHARACTER_ERA_HOLOGRAM)
    ).toBeNull();
    expect(
      containedHologramPlacement(360, 640, {
        frame: { width: 720, height: 1280 },
        footY: 1.01,
      })
    ).toBeNull();
  });
});

describe("ADR-082 U25 · every era paints one figure height", () => {
  const spanOf = (h: CharacterEraHologram) => h.footY - h.headY;

  it("no era is delivered shorter than the stature every era is fitted to", () => {
    // ⚠ THIS IS THE GUARD THAT MATTERS, AND IT IS POINTED AT THE CLAMP.
    // `holoFigureFit` can only ever SHRINK — growth re-binds `contain` to the
    // column's width and clips the head against the wrap's inset clip — so an
    // era delivered SHORTER than the span would silently get `fit === 1` and
    // stay the odd one out with every other assertion green. The clamp must
    // never be the thing doing the work.
    for (const era of CHARACTER_ERAS) {
      const stature = holoFigureStature(resolveCharacterEraHologram(era));
      expect(stature, `${era.id} stature`).toBeGreaterThanOrEqual(HOLO_FIGURE_SPAN - 1e-9);
    }
  });

  it("fits every era to the same BODY SCALE, and shrinks rather than grows", () => {
    for (const era of CHARACTER_ERAS) {
      const hologram = resolveCharacterEraHologram(era);
      const fit = holoFigureFit(hologram);
      expect(fit, `${era.id} fit`).toBeGreaterThan(0);
      expect(fit, `${era.id} fit`).toBeLessThanOrEqual(1);
      // ⚠ STATURE, NOT EXTENT (ADR-082 U26). What the eye compares across the
      // reel is how big the MAN is drawn, and for every standing era that is
      // its span — so this is the same assertion U25 shipped until a
      // non-standing pose exists. A kneeling figure matches here and paints a
      // shorter extent on purpose.
      expect(holoFigureStature(hologram) * fit, `${era.id} painted stature`).toBeCloseTo(
        HOLO_FIGURE_SPAN,
        6
      );
    }
  });

  it("the head share is the fitted head's height above the floor, inside the slot (ADR-082 U28)", () => {
    for (const era of CHARACTER_ERAS) {
      const hologram = resolveCharacterEraHologram(era);
      const share = holoFigureHeadShare(hologram);
      // Inside the slot, and — for a STANDING era — never above the fit's own
      // ceiling, which would put the head outside the media it is drawn in. A
      // kneeling era's standing head may sit above its canvas (U32: expanse's
      // is at −0.012), so its bound is the slot.
      expect(share, `${era.id} head share`).toBeGreaterThan(0);
      expect(share, `${era.id} head share`).toBeLessThanOrEqual(
        hologram.stature === undefined ? holoFigureFit(hologram) + 1e-9 : 1
      );
      // A non-standing pose seats its STANDING head (`footY − stature`, U32);
      // a standing era's is its own `headY`.
      const head =
        hologram.stature === undefined ? hologram.headY : hologram.footY - hologram.stature;
      expect(share, `${era.id} head share`).toBeCloseTo(holoFigureFit(hologram) * (1 - head), 12);
      // The painted figure hangs from that head line: share − stature must be
      // the FOOT's height above the floor, which is ≥ 0 for every seated era.
      expect(share - HOLO_FIGURE_SPAN, `${era.id} foot`).toBeGreaterThanOrEqual(-1e-9);
    }
    // A headless record degrades to "the whole slot", never to NaN.
    expect(holoFigureHeadShare({ headY: Number.NaN, footY: 0.99 })).toBe(1);
  });

  it("a standing era's stature IS its span, so U25's arithmetic is unchanged", () => {
    // The distinction may only appear where a pose asks for it. If every era
    // still stands, nothing here may have moved.
    for (const era of CHARACTER_ERAS) {
      const hologram = resolveCharacterEraHologram(era);
      if (hologram.stature !== undefined) continue;
      expect(holoFigureStature(hologram), `${era.id}`).toBe(spanOf(hologram));
    }
  });

  it("an authored stature is what the fit reads, and it may not be a growth lever", () => {
    // A crouch: a short extent drawn at a standing man's scale.
    const crouch = { headY: 0.375, footY: 0.995, stature: 0.9524 };
    expect(holoFigureStature(crouch)).toBe(0.9524);
    expect(holoFigureFit(crouch)).toBeCloseTo(HOLO_FIGURE_SPAN / 0.9524, 12);
    // It shrinks like any other era — it cannot be used to make one bigger.
    expect(holoFigureFit(crouch)).toBeLessThanOrEqual(1);
    expect(holoFigureFit({ headY: 0.1, footY: 0.9, stature: 0.2 })).toBe(1);
  });

  it("a kneeling era seats its standing head on the phone, not its rifle's muzzle (U32)", () => {
    // The ink's top is the muzzle at 0.07; a standing man at this scale would
    // have his crown at footY − stature. The share reads the latter, so the
    // column lifts like a standing era's and the disc stays on the same line.
    const kneel = { headY: 0.07, footY: 0.995, stature: 0.88 };
    const fit = holoFigureFit(kneel);
    expect(holoFigureHeadShare(kneel)).toBeCloseTo(fit * (1 - (0.995 - 0.88)), 12);
    expect(holoFigureHeadShare(kneel)).toBeLessThan(fit * (1 - kneel.headY));
    // Painted foot above the floor: share − painted stature = fit × (1 − footY).
    expect(holoFigureHeadShare(kneel) - fit * 0.88).toBeCloseTo(fit * (1 - 0.995), 12);
  });

  it("leaves the shortest era untouched and is the identity on a square-on span", () => {
    // Azeroth IS the floor (his composite measures 0.9625 of the canvas wide,
    // so he cannot be re-delivered taller), which means his own render must be
    // byte-identical to what shipped — a fit of exactly 1, not 0.999.
    const azeroth = CHARACTER_ERAS.find((e) => e.id === "azeroth");
    expect(azeroth).toBeDefined();
    expect(holoFigureFit(resolveCharacterEraHologram(azeroth!))).toBe(1);
  });

  it("fails closed on unmeasurable anchors instead of emitting NaN CSS", () => {
    expect(holoFigureFit({ headY: 0.5, footY: 0.5 })).toBe(1);
    expect(holoFigureFit({ headY: 0.9, footY: 0.1 })).toBe(1);
    expect(holoFigureFit({ headY: Number.NaN, footY: 0.99 })).toBe(1);
  });
});
