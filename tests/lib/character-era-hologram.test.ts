import { describe, expect, it } from "vitest";

import {
  CANONICAL_CHARACTER_ERA_HOLOGRAM,
  CHARACTER_ERAS,
  containedHologramPlacement,
  isCharacterEraHologram,
  resolveCharacterEraHologram,
  type CharacterEraHologram,
} from "@/lib/voidwalker/characterEras";

describe("ADR-082 · normalized character hologram assets", () => {
  it("pins the canonical delivery canvas and authored figure anchors", () => {
    expect(CANONICAL_CHARACTER_ERA_HOLOGRAM).toEqual({
      videoPath: "/videos/voidwalker/holo-idle-thoughtform.mp4",
      videoAlphaPath: "/videos/voidwalker/holo-idle-thoughtform.webm",
      posterPath: "/images/voidwalker/holo-still-thoughtform.jpg",
      posterAlphaPath: "/images/voidwalker/holo-still-thoughtform.webp",
      frame: { width: 720, height: 1280 },
      headY: 0.122,
      footY: 0.998,
    });
    expect(isCharacterEraHologram(CANONICAL_CHARACTER_ERA_HOLOGRAM)).toBe(true);
  });

  it("keeps every unauthored era on the canonical pair", () => {
    for (const era of CHARACTER_ERAS) {
      expect(resolveCharacterEraHologram(era), era.id).toBe(CANONICAL_CHARACTER_ERA_HOLOGRAM);
    }
  });

  it("accepts a complete future pair and rejects malformed generated records", () => {
    const future = {
      videoPath: "/videos/voidwalker/holo-idle-loop.mp4",
      videoAlphaPath: "/videos/voidwalker/holo-idle-loop.webm",
      posterPath: "/images/voidwalker/holo-still-loop.webp",
      posterAlphaPath: "/images/voidwalker/holo-still-loop.png",
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
