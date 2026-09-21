import { existsSync, statSync } from "node:fs";
import path from "node:path";

import sharp from "sharp";
import { describe, expect, it } from "vitest";

import {
  CHARACTER_ERAS,
  CHARACTER_ERA_COUNT,
  CHARACTER_ERA_MEDIA_MAX,
  eraMedia,
  eraMediaDuration,
  eraMediaEmbedSrc,
  eraMediaKindLabel,
  eraMediaStill,
  eraPressBeatIds,
  findCharacterEra,
  isCharacterEraMedia,
  type CharacterEraMedia,
} from "@/lib/voidwalker/characterEras";
import { VOIDWALKER_BEATS } from "@/lib/voidwalker/voidwalkerData";

const PUBLIC_DIR = path.join(process.cwd(), "public");
const onDisk = (publicPath: string) => path.join(PUBLIC_DIR, publicPath);

/**
 * ADR-082 — the character stage's era registry.
 *
 * `voidwalkerData.ts` (ADR-074) is the record; `characterEras.ts` is the
 * roster the stage renders. This guard pins the invariants that make the
 * two consistent:
 *
 *   - the roster is the CURATED five (owner ruling, not all nine);
 *   - every era references an existing beat by id;
 *   - no era invents a year (each is a valid record year or span);
 *   - the wardrobe copy and rail labels fit their columns;
 *   - the stills point at existing files (checked as string shape here;
 *     `probe-voidwalker-models.mjs` walks the filesystem);
 *   - ids are unique kebab and the sweep is REVERSE-chronological.
 *
 * ⚠ U2 ADDS THE PANEL CONTENT (facts, press routing, films). The record
 * is at LOCK and its own guard bans rounding, currency and model
 * families over `voidwalkerData.ts`; this file letters copy on the same
 * public surface, so it runs the SAME envelope. A registry that is
 * scanned less strictly than the record it quotes is where a superseded
 * claim survives.
 */

/** The record's own bans, applied to the roster's authored copy.
 *  Mirrors `tests/lib/voidwalker-data.test.ts` — move them together. */
const BANNED_ROUNDING = /\b1[,.]?000\b|\b16[,.]?000\b|\b\d+k\b|\b100[,.]?000\+/i;
const CURRENCY = /[$€£¥]/;
const MODEL_FAMILIES = /\b(opus|sonnet|haiku|fable|gpt|gemini|llama|mistral|claude)\b/i;

/** Everything an era letters through the panels, as one blob. */
function eraCopy(era: (typeof CHARACTER_ERAS)[number]): string {
  return [
    era.wardrobe,
    era.motto,
    era.loadout,
    ...(era.facts ?? []).flatMap((f) => [f.k, f.v]),
    // ⚠ THE RAW LIST, NOT `eraMedia()`. The accessor drops what fails the
    // guard and what is past the cap — and a string that is authored but not
    // rendered today is one cap-bump from being on the public page unscanned.
    ...(era.media ?? []).flatMap((m) => [m.title, m.kind === "image" ? m.alt : ""]),
  ].join(" • ");
}

describe("ADR-082 · character era registry", () => {
  it("ships with the curated five (never grows silently)", () => {
    expect(CHARACTER_ERAS).toHaveLength(CHARACTER_ERA_COUNT);
    expect(CHARACTER_ERA_COUNT).toBe(5);
  });

  it("every era's id is unique, kebab, and looked up by helper", () => {
    const ids = CHARACTER_ERAS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(findCharacterEra(id)).toBeDefined();
    }
    expect(findCharacterEra("does-not-exist")).toBeUndefined();
  });

  it("every era points at a real beat in the record", () => {
    const beatIds = new Set(VOIDWALKER_BEATS.map((b) => b.id));
    for (const era of CHARACTER_ERAS) {
      expect(beatIds.has(era.beatId), `era ${era.id} → beat ${era.beatId}`).toBe(true);
    }
  });

  it("years are 4-digit or a 4-digit dash 2-digit span (record grammar)", () => {
    for (const era of CHARACTER_ERAS) {
      // `2026` | `2016–18` (en dash, not hyphen — the ADR-074 rule).
      expect(era.year, era.id).toMatch(/^\d{4}(–\d{2})?$/);
    }
  });

  it("sweeps reverse-chronological — first entry is the current seat", () => {
    // The record itself is reverse-chronological (ADR-074 U2), and the
    // rail should read the same way so index 0 is 2026 and index 4 is
    // 2016. Compare only the leading four digits; span forms like
    // "2016–18" collapse to their opening year for this check.
    const openings = CHARACTER_ERAS.map((e) => parseInt(e.year.slice(0, 4), 10));
    expect(openings[0]).toBeGreaterThanOrEqual(openings.at(-1)!);
    for (let i = 1; i < openings.length; i++) {
      expect(openings[i]!).toBeLessThanOrEqual(openings[i - 1]!);
    }
  });

  it("wardrobe copy fits its columns", () => {
    for (const era of CHARACTER_ERAS) {
      expect(era.wardrobe.length, `${era.id} wardrobe`).toBeLessThanOrEqual(32);
      expect(era.motto.length, `${era.id} motto`).toBeLessThanOrEqual(52);
      expect(era.loadout.length, `${era.id} loadout`).toBeLessThanOrEqual(120);
      expect(era.short.length, `${era.id} short`).toBeLessThanOrEqual(14);
    }
  });

  it("stills are public paths; models are null until Meshy lands them", () => {
    for (const era of CHARACTER_ERAS) {
      expect(era.stillPath, `${era.id} stillPath`).toMatch(
        /^\/images\/[^\s]+\.(jpg|jpeg|png|webp)$/i
      );
      if (era.modelPath !== null) {
        expect(era.modelPath, `${era.id} modelPath`).toMatch(/^\/models\/voidwalker\/[^\s]+\.glb$/);
      }
    }
  });
});

describe("ADR-082 U2 · the era panels' content", () => {
  it("every era carries 3-5 facts, and each row fits its column", () => {
    for (const era of CHARACTER_ERAS) {
      const facts = era.facts ?? [];
      expect(facts.length, `${era.id} fact count`).toBeGreaterThanOrEqual(3);
      expect(facts.length, `${era.id} fact count`).toBeLessThanOrEqual(5);
      for (const f of facts) {
        // The label column is mono caps at a fixed measure; the value
        // takes the rest of a ~34ch panel and must not wrap to three.
        expect(f.k.length, `${era.id} fact key "${f.k}"`).toBeLessThanOrEqual(14);
        expect(f.v.length, `${era.id} fact value "${f.v}"`).toBeLessThanOrEqual(44);
        expect(f.k.trim(), `${era.id} fact key blank`).not.toBe("");
        expect(f.v.trim(), `${era.id} fact value blank`).not.toBe("");
      }
    }
  });

  it("fact labels are unique within an era (no row says the same thing twice)", () => {
    for (const era of CHARACTER_ERAS) {
      const keys = (era.facts ?? []).map((f) => f.k.toLowerCase());
      expect(new Set(keys).size, `${era.id} duplicate fact key`).toBe(keys.length);
    }
  });

  it("runs the RECORD's envelope over every lettered string", () => {
    for (const era of CHARACTER_ERAS) {
      const copy = eraCopy(era);
      expect(BANNED_ROUNDING.test(copy), `${era.id} rounds a figure`).toBe(false);
      expect(CURRENCY.test(copy), `${era.id} names money`).toBe(false);
      expect(MODEL_FAMILIES.test(copy), `${era.id} names a model family`).toBe(false);
      // The section's own name is not a word its copy uses (ADR-074).
      expect(/voidwalker/i.test(copy), `${era.id} says "voidwalker"`).toBe(false);
      // No markup smuggled into copy strings; emphasis is a role, not a tag.
      expect(/<[a-z/]/i.test(copy), `${era.id} smuggles markup`).toBe(false);
    }
  });

  it("press routing names real beats that actually carry a press card", () => {
    const byId = new Map(VOIDWALKER_BEATS.map((b) => [b.id, b]));
    for (const era of CHARACTER_ERAS) {
      const ids = eraPressBeatIds(era);
      expect(ids.length, `${era.id} press routing empty`).toBeGreaterThan(0);
      expect(new Set(ids).size, `${era.id} duplicate press beat`).toBe(ids.length);
      for (const id of ids) {
        const beat = byId.get(id);
        expect(beat, `${era.id} → unknown beat ${id}`).toBeDefined();
      }
      // A named beat with no press renders an empty card — the routing
      // is explicit, so an id that letters nothing is a mistake, not a
      // fallback. (Eras that simply have no press omit the field and
      // default to their own beat, which may legitimately carry none.)
      if (era.pressBeatIds) {
        for (const id of era.pressBeatIds) {
          expect(byId.get(id)?.press, `${era.id} routed to press-less beat ${id}`).toBeDefined();
        }
      }
    }
  });

  it("defaults press routing to the era's own beat", () => {
    for (const era of CHARACTER_ERAS) {
      if (!era.pressBeatIds) {
        expect(eraPressBeatIds(era)).toEqual([era.beatId]);
      }
    }
  });

  it("does not put a second film on the RECORD (the interlude stays alone)", () => {
    // The era registry is where a second transmission lives, precisely
    // so `voidwalker-data.test.ts`'s exactly-one-film pin keeps holding.
    // If this ever fails, someone moved an era film onto a beat.
    expect(VOIDWALKER_BEATS.filter((b) => b.film)).toHaveLength(1);
  });
});

/**
 * ADR-082 U31 — the TRANSMISSION pile. `film?` became `media?`, a list of a
 * closed three-way union (embed · video · image), because the owner's seat has
 * to hold "every type of asset, image or video", several at once.
 */
describe("ADR-082 U31 · the era's transmission pile", () => {
  const embed: CharacterEraMedia = {
    kind: "embed",
    youtubeId: "a5-DcdfxCvU",
    title: "A film",
    poster: "/images/voidwalker/media/film-save-the-expanse.jpg",
  };
  const video: CharacterEraMedia = {
    kind: "video",
    src: "/videos/voidwalker/media/a-cut.mp4",
    title: "A cut",
    poster: "/images/voidwalker/media/a-cut.jpg",
    duration: "0:30",
  };
  const image: CharacterEraMedia = {
    kind: "image",
    src: "/images/voidwalker/media/a-still.webp",
    width: 1600,
    height: 900,
    title: "A still",
    alt: "What the still shows.",
  };

  it("every authored entry passes the guard, and no pile is past the cap", () => {
    for (const era of CHARACTER_ERAS) {
      const raw = era.media ?? [];
      // ⚠ The accessor TRUNCATES, so the pile a reader sees can be shorter than
      // the one the author wrote with nothing on screen to say so. This is the
      // assertion that says so.
      expect(raw.length, `${era.id} pile is past the tab row's cap`).toBeLessThanOrEqual(
        CHARACTER_ERA_MEDIA_MAX
      );
      for (const item of raw) {
        expect(isCharacterEraMedia(item), `${era.id} · "${item.title}"`).toBe(true);
      }
      expect(eraMedia(era)).toEqual(raw);
    }
    // Four, and the number is the tab row's arithmetic at 1101×800.
    expect(CHARACTER_ERA_MEDIA_MAX).toBe(4);
  });

  it("the two films that shipped as `film` are still the record, as embeds", () => {
    const front = (id: string) => eraMedia(findCharacterEra(id))[0];
    expect(front("genai")).toMatchObject({ kind: "embed", youtubeId: "jFVezT4mznU" });
    expect(front("expanse")).toMatchObject({
      kind: "embed",
      youtubeId: "a5-DcdfxCvU",
      duration: "2:14",
    });
    for (const id of ["loop", "azeroth", "pokemon-go"]) {
      expect(eraMedia(findCharacterEra(id)), `${id} has no transmission`).toEqual([]);
    }
  });

  it("every file a pile names is self-hosted, on disk, and the shape it claims", async () => {
    for (const era of CHARACTER_ERAS) {
      for (const item of eraMedia(era)) {
        const still = eraMediaStill(item);
        // Self-hosted: `img-src` does not name ytimg and `media-src` is 'self',
        // so an absolute URL is a request the CSP refuses.
        expect(still, `${era.id} still`).not.toMatch(/^https?:|^\/\//);
        expect(existsSync(onDisk(still)), `${era.id} · ${still} is not on disk`).toBe(true);
        if (item.kind === "video") {
          expect(item.src).not.toMatch(/^https?:|^\/\//);
          expect(existsSync(onDisk(item.src)), `${era.id} · ${item.src} is not on disk`).toBe(true);
        }
        if (item.kind === "image") {
          // The lightbox solves its box from these two numbers.
          const meta = await sharp(onDisk(item.src)).metadata();
          expect([meta.width, meta.height], `${era.id} · ${item.src}`).toEqual([
            item.width,
            item.height,
          ]);
          expect(item.alt, `${era.id} alt restates the title`).not.toBe(item.title);
        } else {
          // A film's poster is its own frame: 16:9, and light — the card is
          // lazily fetched but four of them is still a pile.
          const meta = await sharp(onDisk(item.poster)).metadata();
          expect((meta.width ?? 0) / (meta.height ?? 1), `${item.poster} aspect`).toBeCloseTo(
            16 / 9,
            2
          );
          expect(statSync(onDisk(item.poster)).size, `${item.poster} weight`).toBeLessThanOrEqual(
            120 * 1024
          );
        }
      }
    }
  });

  it("the guard fails closed on each kind's own traps", () => {
    for (const ok of [embed, video, image]) expect(isCharacterEraMedia(ok)).toBe(true);

    const bad: Array<[string, unknown]> = [
      ["no kind", { ...embed, kind: undefined }],
      ["an unknown kind", { ...embed, kind: "audio" }],
      ["a blank title", { ...embed, title: "  " }],
      ["a title past the card's two lines", { ...embed, title: "x".repeat(61) }],
      [
        "a YouTube URL where the id belongs",
        { ...embed, youtubeId: "https://youtu.be/a5-DcdfxCvU" },
      ],
      ["a remote poster", { ...embed, poster: "https://i.ytimg.com/vi/a5-DcdfxCvU/hq.jpg" }],
      // The figure's own posters live one folder up; a pile poster does not.
      [
        "a poster outside media/",
        { ...embed, poster: "/images/voidwalker/holo-still-thoughtform.jpg" },
      ],
      ["a duration that is not M:SS", { ...embed, duration: "2m14s" }],
      // `media-src` is 'self': a bucket URL is blocked outright.
      ["a remote video", { ...video, src: "https://cdn.example.com/a-cut.mp4" }],
      ["a webm with no fallback beside it", { ...video, src: "/videos/voidwalker/media/a.webm" }],
      ["a video outside media/", { ...video, src: "/videos/voidwalker/holo-idle-thoughtform.mp4" }],
      ["a video without a poster", { ...video, poster: undefined }],
      ["an image without its size", { ...image, width: undefined }],
      ["a fractional size", { ...image, height: 900.5 }],
      ["an image without alt", { ...image, alt: "" }],
      ["alt past 140", { ...image, alt: "x".repeat(141) }],
      ["a focus outside the asset", { ...image, focus: [0.5, 1.2] }],
      ["a focus with one term", { ...image, focus: [0.5] }],
      ["a path that climbs out", { ...image, src: "/images/voidwalker/media/../../secret.png" }],
    ];
    for (const [why, value] of bad) {
      expect(isCharacterEraMedia(value), why).toBe(false);
    }
    expect(isCharacterEraMedia(null)).toBe(false);
    expect(isCharacterEraMedia("film")).toBe(false);
    expect(isCharacterEraMedia({ ...image, focus: [0, 1] })).toBe(true);
  });

  it("the accessor drops what fails and truncates at the cap, without throwing", () => {
    const five = [embed, video, image, embed, video] as const;
    expect(eraMedia({ media: five })).toHaveLength(CHARACTER_ERA_MEDIA_MAX);
    expect(eraMedia({ media: five })[0]).toBe(embed);
    const mixed = [embed, { kind: "audio", title: "no" } as unknown as CharacterEraMedia, image];
    expect(eraMedia({ media: mixed })).toEqual([embed, image]);
    expect(eraMedia(undefined)).toEqual([]);
    expect(eraMedia({})).toEqual([]);
  });

  it("derives the card's still, tag and designation from the kind", () => {
    expect(eraMediaStill(embed)).toBe(embed.kind === "embed" ? embed.poster : "");
    expect(eraMediaStill(image)).toBe("/images/voidwalker/media/a-still.webp");
    expect(eraMediaDuration(video)).toBe("0:30");
    expect(eraMediaDuration(embed)).toBeUndefined();
    expect(eraMediaDuration(image)).toBeUndefined();
    // ⚠ Two words, ONE LENGTH CLASS: the tab's width is solved from the longer.
    expect(eraMediaKindLabel(embed)).toBe("Film");
    expect(eraMediaKindLabel(video)).toBe("Film");
    expect(eraMediaKindLabel(image)).toBe("Image");
    // The one frame origin the CSP names, spelled once.
    if (embed.kind === "embed") {
      expect(eraMediaEmbedSrc(embed)).toBe(
        "https://www.youtube-nocookie.com/embed/a5-DcdfxCvU?autoplay=1&rel=0"
      );
    }
  });
});
