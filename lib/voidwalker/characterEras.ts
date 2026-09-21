/**
 * The VOIDWALKER character-stage era registry (ADR-082).
 *
 * Five selectable versions of the owner across ten years — the
 * curated roster the hologram section ships with (owner ruling, not the
 * full nine). Each entry pins to a beat id in
 * `voidwalkerData.ts` (ADR-074), which is the record and stays the
 * source of truth for years, titles and prose. This file names the
 * WARDROBE ("what era-Vince wore"), the model asset, the still that
 * stands in on mobile / PRM / no-WebGL, and — since ADR-082 U2 — the
 * PANEL CONTENT that flanks the figure.
 *
 * ⚠ THE ORDER IS REVERSE-CHRONOLOGICAL, matching the record. Reading
 * downward the rail starts at the current seat (`loop`) and lands on
 * the origin (`pokemon-go`).
 *
 * ⚠ ZERO IMPORTS. The consumers are the stage renderer, its lab
 * variant and a unit guard — one record, no cycles, no runtime.
 */

/** A stable non-display id for the era. Kebab; matches the beat id it
 *  hangs off in `VOIDWALKER_BEATS`.
 *
 *  ⚠ EVERY ERA ID NOW EQUALS ITS BEAT ID. The compound-era exception is
 *  gone: `the-crowd` used to span four 2016–18 beats under one seat, and
 *  the 2026-08-30 reduction split it into the two eras that carry their
 *  own year — `expanse` (2018) and `pokemon-go` (2016) — each still
 *  speaking for its neighbour through `pressBeatIds`. `azeroth` is the
 *  one id whose spelling differs from its beat (`classroom`), because the
 *  era is named for the field site rather than the room. */
export type CharacterEraId = "pokemon-go" | "expanse" | "azeroth" | "genai" | "loop";

/**
 * A normalized, self-hosted hologram pair for one era.
 *
 * The frame and anchors are data rather than CSS calibration. Every asset
 * therefore enters the same 720 × 1280 projection slot, and the hologram
 * treatment remains free to own its transforms without a second corrective
 * transform fighting it at runtime.
 */
export interface CharacterEraHologram {
  /** H.264 MP4 under `public/videos/voidwalker/`. OPAQUE by format — H.264
   *  cannot carry alpha — so this source composites through the additive
   *  floor path. See `.vwh__media` in voidwalker-hologram.css. */
  videoPath: string;
  /** VP9/WebM carrying a real alpha channel (`alpha_mode=1`), keyed from the
   *  asset's own luminance. Preferred source: with true alpha the floor, the
   *  blend and the slot's isolation are all unnecessary. Chromium and Firefox
   *  take this; Safari falls back to `videoAlphaHevcPath` and then to
   *  `videoPath`. */
  videoAlphaPath: string;
  /** HEVC carrying a real alpha channel, in a QuickTime container, `hvc1`-
   *  tagged — the SAFARI alpha source (ADR-082 U23).
   *
   *  ⚠ OPTIONAL, AND AN ABSENT ONE IS A REAL STATE. An era without this file
   *  composites through the additive floor on Safari, which is what every era
   *  did before the field existed, so omitting it is a no-op rather than a
   *  defect. `azeroth` omits it deliberately: its matte carries a plume and
   *  three companions, and the encoder plateaus at ~2.6/255 of mean alpha
   *  error against the VP9 master at EVERY quality setting while the file runs
   *  to 12 MB — it misses the <=1/255 standard at every size, so it does not
   *  ship one.
   *
   *  ⚠ `.mov`, AND THE CONTAINER IS THE CONTRACT. Safari does not composite
   *  HEVC alpha out of an `.mp4`, so admitting one here would switch the floor
   *  OFF over a source whose alpha the engine ignores — the opaque pane this
   *  branch exists to remove, reinstated where nobody looks.
   *
   *  Produced on macOS: `-c:v hevc_videotoolbox -alpha_quality 0.5 -q:v 45
   *  -pix_fmt bgra -tag:v hvc1`. ⚠ `yuva420p` is NOT a pixel format that
   *  encoder accepts — asking for it silently yields `ayuv` — and
   *  `-alpha_quality` DEFAULTS TO 0, which destroys the channel outright. */
  videoAlphaHevcPath?: string;
  /** Frame-zero poster under `public/images/voidwalker/`. Paints while the
   *  video buffers, so it must match whichever source wins — hence the
   *  alpha-capable sibling below. */
  posterPath: string;
  /** Frame-zero poster WITH alpha (WebP/PNG), for the alpha path. A `.jpg`
   *  cannot hold alpha, so without this the boot frame would flash an opaque
   *  black rectangle before the first video frame arrives. */
  posterAlphaPath: string;
  /**
   * The era band's BUST (ADR-082 U31, owner 2026-09-21: the band "should be
   * more like a sort of thumbnail gallery that should be a bit more clear") —
   * a 192×128 WebP with alpha, ≤10 KB, cut from `posterAlphaPath` by
   * `scripts/voidwalker-avatar/thumb.py`.
   *
   * ⚠ IT BELONGS TO THE DELIVERY, NOT TO THE ERA, AND THAT IS WHY IT IS HERE.
   * Two eras that resolve to one hologram (`loop` and `pokemon-go` both take the
   * canonical pair until 2016 gets a figure of its own) share one bust BY
   * CONSTRUCTION rather than by two strings that have to be kept equal, and a
   * re-cut figure cannot pass the guard with its predecessor's thumbnail: the
   * unit suite pins the thumb's version suffix to the poster's.
   * ⚠ REQUIRED. U23 dropped the framed bust along with five lazily-fetched
   * FULL posters (~363 KB); an optional field falling back to `posterAlphaPath`
   * is exactly that weight coming back the first time one is forgotten.
   * ⚠ THE CROP IS SOLVED FROM HEAD MARKS — the deliveries draw their heads at
   * different sizes, so a fixed window gives five busts at five scales. One
   * head size and one eye line across the row is `thumb.py`'s whole job.
   */
  thumbPath: string;
  /** The normalized delivery canvas. Exact by contract. */
  frame: {
    readonly width: 720;
    readonly height: 1280;
  };
  /** Normalized Y coordinate of the top of the authored figure. */
  headY: number;
  /** Normalized Y coordinate where the boots meet the projector plane. */
  footY: number;
  /**
   * The span this figure would occupy IF IT WERE STANDING — the reference the
   * one-height law normalises against (ADR-082 U26, owner 2026-09-19).
   *
   * ⚠ OPTIONAL, AND ABSENT IS THE RULE RATHER THAN THE EXCEPTION. For a
   * standing figure the stature IS `footY - headY`, so every era that stands
   * omits this and is byte-identical to the pre-U26 arithmetic. It exists for
   * a deliberately NON-STANDING pose, where head-to-foot extent stops being a
   * measure of how big the man is drawn: a commander on one knee is ~0.6 of
   * his own standing height, and matching that extent to a standing era would
   * draw him half again as large — the owner's ruling is that he matches their
   * BODY SCALE and simply sits lower in his box.
   *
   * ⚠ IT IS MEASURED, NOT ASSERTED. The scale proxy is HEAD WIDTH, which is
   * the one dimension a pose does not change (`post.py` reports it): the
   * stature is the standing delivery's span times the ratio of the two head
   * widths. Author the arithmetic beside the value or it is a guess in
   * costume.
   */
  stature?: number;
}

/**
 * The one production-ready hologram. Every era resolves to this pair until
 * an era-specific pair is present and passes `isCharacterEraHologram`.
 */
export const CANONICAL_CHARACTER_ERA_HOLOGRAM = Object.freeze({
  videoPath: "/videos/voidwalker/holo-idle-thoughtform.mp4",
  videoAlphaPath: "/videos/voidwalker/holo-idle-thoughtform.webm",
  videoAlphaHevcPath: "/videos/voidwalker/holo-idle-thoughtform.mov",
  posterPath: "/images/voidwalker/holo-still-thoughtform.jpg",
  posterAlphaPath: "/images/voidwalker/holo-still-thoughtform.webp",
  thumbPath: "/images/voidwalker/holo-thumb-thoughtform.webp",
  frame: Object.freeze({ width: 720, height: 1280 }),
  headY: 0.122,
  footY: 0.998,
} as const satisfies CharacterEraHologram);

const HOLOGRAM_VIDEO_PATH = /^\/videos\/voidwalker\/[a-z0-9][a-z0-9._-]*\.mp4$/i;
/** ⚠ WEBM ONLY. The alpha source is the one that must carry a real alpha
 *  channel, and of the self-hosted formats this app can serve, VP9-in-WebM is
 *  the only one that does. Widening this to `.mp4` would silently admit an
 *  opaque file into the branch whose whole premise is transparency. */
const HOLOGRAM_VIDEO_ALPHA_PATH = /^\/videos\/voidwalker\/[a-z0-9][a-z0-9._-]*\.webm$/i;
/** ⚠ `.mov` ONLY, for the reason on the field itself: HEVC alpha in an `.mp4`
 *  is not composited by Safari, and a `.webm` here would be the VP9 source
 *  entering the branch that exists because Safari cannot read it. */
const HOLOGRAM_VIDEO_ALPHA_HEVC_PATH = /^\/videos\/voidwalker\/[a-z0-9][a-z0-9._-]*\.mov$/i;
const HOLOGRAM_POSTER_PATH = /^\/images\/voidwalker\/[a-z0-9][a-z0-9._-]*\.(?:jpe?g|png|webp)$/i;
/** Same reasoning one step down: JPEG has no alpha channel. */
const HOLOGRAM_POSTER_ALPHA_PATH = /^\/images\/voidwalker\/[a-z0-9][a-z0-9._-]*\.(?:png|webp)$/i;
/** ⚠ `holo-thumb-` IS PART OF THE PATTERN. The bust sits on the void like the
 *  figure does, so it must carry alpha (WebP), and the prefix is what stops a
 *  full 130 KB poster being admitted as a "thumbnail" — the weight U23 removed. */
const HOLOGRAM_THUMB_PATH = /^\/images\/voidwalker\/holo-thumb-[a-z0-9][a-z0-9._-]*\.webp$/i;

/** Runtime guard for data coming from future generated-asset manifests. */
export function isCharacterEraHologram(value: unknown): value is CharacterEraHologram {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<CharacterEraHologram>;
  const frame = candidate.frame as Partial<CharacterEraHologram["frame"]> | undefined;
  const headY = candidate.headY;
  const footY = candidate.footY;

  return (
    typeof candidate.videoPath === "string" &&
    HOLOGRAM_VIDEO_PATH.test(candidate.videoPath) &&
    typeof candidate.videoAlphaPath === "string" &&
    HOLOGRAM_VIDEO_ALPHA_PATH.test(candidate.videoAlphaPath) &&
    /* Optional, so `undefined` passes — but a PRESENT one must be a `.mov`,
       or the floor would switch off over a source Safari reads as opaque. */
    (candidate.videoAlphaHevcPath === undefined ||
      (typeof candidate.videoAlphaHevcPath === "string" &&
        HOLOGRAM_VIDEO_ALPHA_HEVC_PATH.test(candidate.videoAlphaHevcPath))) &&
    typeof candidate.posterPath === "string" &&
    HOLOGRAM_POSTER_PATH.test(candidate.posterPath) &&
    typeof candidate.posterAlphaPath === "string" &&
    HOLOGRAM_POSTER_ALPHA_PATH.test(candidate.posterAlphaPath) &&
    typeof candidate.thumbPath === "string" &&
    HOLOGRAM_THUMB_PATH.test(candidate.thumbPath) &&
    frame?.width === 720 &&
    frame.height === 1280 &&
    typeof headY === "number" &&
    typeof footY === "number" &&
    Number.isFinite(headY) &&
    Number.isFinite(footY) &&
    headY >= 0 &&
    headY < footY &&
    footY <= 1
  );
}

export interface ContainedHologramPlacement {
  /** Uniform object-fit scale. */
  scale: number;
  /** Rendered media bounds inside the slot. */
  width: number;
  height: number;
  left: number;
  top: number;
  /** Foot-anchor Y in slot-local CSS pixels. */
  footY: number;
  /** Remaining CSS pixels between the foot anchor and the slot bottom. */
  gapBelowFoot: number;
}

/**
 * Pure `object-fit: contain` + `object-position: bottom center` geometry.
 * Invalid or unmeasurable inputs fail closed instead of producing NaN CSS.
 */
export function containedHologramPlacement(
  slotWidth: number,
  slotHeight: number,
  hologram: Pick<CharacterEraHologram, "frame" | "footY">
): ContainedHologramPlacement | null {
  if (
    !Number.isFinite(slotWidth) ||
    !Number.isFinite(slotHeight) ||
    slotWidth <= 0 ||
    slotHeight <= 0 ||
    !Number.isFinite(hologram.frame.width) ||
    !Number.isFinite(hologram.frame.height) ||
    hologram.frame.width <= 0 ||
    hologram.frame.height <= 0 ||
    !Number.isFinite(hologram.footY) ||
    hologram.footY < 0 ||
    hologram.footY > 1
  ) {
    return null;
  }

  const scale = Math.min(slotWidth / hologram.frame.width, slotHeight / hologram.frame.height);
  const width = hologram.frame.width * scale;
  const height = hologram.frame.height * scale;
  const left = (slotWidth - width) / 2;
  const top = slotHeight - height;
  const footY = top + hologram.footY * height;

  return {
    scale,
    width,
    height,
    left,
    top,
    footY,
    gapBelowFoot: slotHeight - footY,
  };
}

/**
 * How much of the delivery canvas the figure itself occupies, as every era
 * must paint it (ADR-082 U25, owner 2026-09-18: "make sure the avatars and the
 * videos are all the same height").
 *
 * ⚠ THE CANVAS IS NORMALISED AND THE FIGURE INSIDE IT NEVER WAS. `post.py`
 * seats the FOOT (`--foot 0.995`) and leaves `headY` wherever the generator
 * put it, so the delivered spans run 0.9524 (expanse) · 0.9367 (genai) ·
 * 0.876 (the canonical pair) · 0.7343 (azeroth) — a 23 % spread inside boxes
 * that are identical to the pixel. The media box was never the defect.
 *
 * ⚠ THIS VALUE IS THE SHORTEST DELIVERED SPAN, AND THAT IS A CONSTRAINT
 * RATHER THAN A PREFERENCE. Azeroth's composite already measures 0.9625 of
 * the canvas WIDE — his fel-crystal spires touch both walls at mid-torso —
 * so growing him to any other era's stature cuts the spires on both sides and
 * bisects the right-hand imp (measured; the still is in the U25 record). He
 * cannot rise, so the others come down to him.
 */
export const HOLO_FIGURE_SPAN = 0.7343;

/**
 * The fraction of its slot an era's media may fill so that every era paints a
 * figure of the same height, still standing on the projector disc.
 *
 * ⚠ CLAMPED AT 1 — THE MECHANISM MAY ONLY EVER SHRINK, and the clamp is
 * structural rather than cautious. The figure column is 9:16 by construction
 * (`--vwd-fig-w` is `(100svh - chrome) * 0.5625`, which is exactly 720/1280)
 * and the slot is a little shorter again, so `contain` is height-bound with
 * ~33px of spare width. Past ~1.077 the fit re-binds to WIDTH and the media
 * then overflows `.vwh__media-wrap`'s inset clip upward, cutting the head. An
 * era that would need more than 1 is an asset to re-deliver, never a number
 * to raise; `character-era-hologram.test.ts` fails rather than let the clamp
 * quietly do that work.
 */
/**
 * What the one-height law measures an era against: its STATURE — the span the
 * figure would occupy standing — which for a standing figure is simply its
 * span (ADR-082 U26).
 *
 * ⚠ THE DISTINCTION ONLY APPEARS WHEN A POSE IS NOT STANDING, and until one
 * ships this returns `footY - headY` for all five eras, so the fit below is
 * byte-identical to what U25 shipped.
 */
export function holoFigureStature(
  hologram: Pick<CharacterEraHologram, "headY" | "footY" | "stature">
): number {
  const span = hologram.footY - hologram.headY;
  const authored = hologram.stature;
  if (typeof authored === "number" && Number.isFinite(authored) && authored > 0) return authored;
  return span;
}

export function holoFigureFit(
  hologram: Pick<CharacterEraHologram, "headY" | "footY" | "stature">
): number {
  const span = holoFigureStature(hologram);
  if (!Number.isFinite(span) || span <= 0) return 1;
  // ⚠ THE FLOOR ERA RETURNS EXACTLY 1, NOT 0.9999999999999999. `footY - headY`
  // is a float subtraction, so the shortest era's span is not bit-equal to the
  // literal it defines, and `Math.min` alone would hand its media a height of
  // `calc(100% * 0.9999999999999999)` — pixel-identical and a lie about the
  // one era this pass does not touch.
  if (span <= HOLO_FIGURE_SPAN + 1e-9) return 1;
  return HOLO_FIGURE_SPAN / span;
}

/**
 * How far above the slot's floor an era's HEAD paints, as a fraction of the
 * slot's height — `fit × (1 − headY)` (ADR-082 U28).
 *
 * The fit makes every era the same HEIGHT; it does not put every head on the
 * same LINE, because each canvas carries its own headroom (azeroth's head is
 * at 0.235 of his canvas, the Architect's at 0.048) and the media is seated
 * on the floor. The phone sheet lifts the whole column so the head lands a
 * fixed distance below the stage's top whatever the canvas above it holds;
 * this is the term it subtracts. Height-bound only, which the phone always is
 * (the column is narrower than 9:16 there).
 */
export function holoFigureHeadShare(
  hologram: Pick<CharacterEraHologram, "headY" | "footY" | "stature">
): number {
  const head = hologram.headY;
  if (!Number.isFinite(head) || head < 0 || head >= 1) return 1;
  return holoFigureFit(hologram) * (1 - head);
}

/**
 * One row of the era's FACTS panel — a mono label and its value, read
 * as a dotted-leader pair (the `.arc-card-item__meta-row` grammar).
 *
 * ⚠ THE VALUES ARE THE RECORD'S OWN PHRASINGS, NOT NEW CLAIMS. Where a
 * figure appears it is quoted from `voidwalkerData.ts` verbatim ("about
 * a thousand", "Sixteen thousand", "Past 100,000 signatures"), because
 * that record is at LOCK and its guard bans the rounded forms (`1,000`,
 * `16,000`, `\d+k`). A fact that wants a NEW number is a record edit
 * first, in `voidwalkerData.ts`, with its own pin.
 */
export interface CharacterEraFact {
  /** ≤14 chars — the row's label, mono caps, dim, left. */
  k: string;
  /** ≤44 chars — the value, bright, right. One line at the panel's measure. */
  v: string;
}

/**
 * A film that belongs to the ERA rather than to a beat.
 *
 * ⚠ THIS IS DELIBERATELY NOT `VwBeat.film`. `voidwalker-data.test.ts`
 * pins the record to EXACTLY ONE film (the Expanse interlude is a row
 * in the timeline, not a beat), so hanging a second one off a beat
 * fails CI. The era registry is the presentation layer — two eras can
 * carry a transmission here without the record growing a second
 * interlude it does not have.
 *
 * The player is `youtube-nocookie.com/embed/{youtubeId}`, built only
 * after a click, inside `MediaLightbox` — the ONE third-party frame on
 * this site and the one origin `lib/security/headers.mjs` names in
 * `frame-src`. A new origin is a decision, not a field edit.
 */
export interface CharacterEraFilm {
  /** The YouTube id — 11 chars, the `nocookie` embed's whole payload. */
  youtubeId: string;
  /** ≤60 chars — what the plate's bar letters. */
  title: string;
  /** `M:SS`, when it is known. Chrome; the plate omits the row without it. */
  duration?: string;
  /**
   * The SELF-HOSTED poster under `public/images/voidwalker/` — the
   * video's own frame, 16:9, ≤120 KB. Required: a transmission without
   * a thumbnail is a text bar nobody reads as a video (owner,
   * 2026-08-26). Self-hosted because `img-src` does not name ytimg and
   * a poster must not be the page's first third-party request — the
   * player stays the only external thing, and only after a click.
   */
  poster: string;
}

export interface CharacterEra {
  /** Kebab id, stable for the DOM (`data-era-id`) and analytics. */
  id: CharacterEraId;
  /** The beat this era hangs off in `VOIDWALKER_BEATS`. Compound eras
   *  point to their strongest beat (the one with the plate). */
  beatId: string;
  /** The year(s) as they letter on the era rail. En dash, not hyphen. */
  year: string;
  /** ≤32 chars — the wardrobe name over the model, one line at the
   *  reading size in the HUD's title column. */
  wardrobe: string;
  /** ≤80 chars — a single line under the title, the loadout summary. */
  loadout: string;
  /** ≤44 chars — one line, the era's leitmotif in the owner's own
   *  vocabulary. Displayed as the stage's subtitle when the era is
   *  centred. */
  motto: string;
  /**
   * Path under `public/models/voidwalker/` for the era's GLB. May be
   * `null` while the model is being produced by the `voidwalker-avatar`
   * skill — the stage falls back to the still portrait in that case,
   * so the flag can be on before every era has landed.
   *
   * ⚠ ≤4 MB per file (`scripts/probe-voidwalker-models.mjs`).
   */
  modelPath: string | null;
  /**
   * Path under `public/images/voidwalker/` for the era's canonical
   * still (the sheet's front frame from the `voidwalker-avatar`
   * skill). ALWAYS present — the flag OFF path uses it, so does the
   * mobile / PRM rail, and the model's boot state cross-fades from it
   * on the desktop path (materialization masks the mesh's first-frame
   * cost). PNG or WEBP; ≤240 KB.
   */
  stillPath: string;
  /**
   * Optional normalized hologram pair for this era. Omission is deliberate:
   * `resolveCharacterEraHologram` supplies the canonical Thoughtform pair
   * until an era-specific delivery exists and passes the runtime guard.
   */
  hologram?: CharacterEraHologram;
  /**
   * The rail label as it letters on the era pip. Kept short so all five
   * fit at 1280 without wrapping. ≤14 chars.
   */
  short: string;
  /**
   * The FACTS panel's rows — 3-5 of them, the left column's lead.
   * Optional in the type so an era can ship without one; every era
   * carries facts today and the guard pins the count where present.
   */
  facts?: readonly CharacterEraFact[];
  /**
   * Which beats' press cards the era prints, in order. Defaults to
   * `[beatId]` when absent.
   *
   * ⚠ THIS IS HOW THE UNMAPPED BEATS BECOME REACHABLE. Two 2016–18
   * beats have no era of their own: the `expanse` era prints the COINS
   * card beside its own, and the `pokemon-go` era prints the OPHEF card
   * beside its own. Naming them here is what lets one era speak for its
   * neighbour without duplicating a word of the record.
   */
  pressBeatIds?: readonly string[];
  /** The era's transmission, when one exists. See `CharacterEraFilm`. */
  film?: CharacterEraFilm;
}

/**
 * The roster. Order = reader's sweep direction (newest first, oldest
 * last), matching `VOIDWALKER_BEATS`.
 *
 * Wardrobe copy is authored from the owner's own uniform (black boots,
 * black jeans, blazer, turtleneck/shirt, cap) plus per-era gear that
 * makes the moment recognisable: a lanyard and camera for the two
 * crowds (2016's hunts and 2018's campaign), the warlock's own transmog
 * for Azeroth, the cap and film cape for 2023's Latent Land, and the
 * long coat with the Thoughtform cap + brooch for 2026. These are the
 * WARDROBE LOCKS the skill runs against.
 *
 * ⚠ `stillPath` currently points at the existing site portrait for
 * every era. When the `voidwalker-avatar` skill produces the real era
 * sheets, each `stillPath` swaps to `/images/voidwalker/era-<id>.jpg`
 * (the destination is already reserved by the ADR). The DOM contract
 * is stable through the swap — only the pixel changes.
 */
export const CHARACTER_ERAS: readonly CharacterEra[] = [
  {
    id: "loop",
    beatId: "loop",
    year: "2026",
    wardrobe: "The Intelligence Architect",
    loadout: "Long coat · Thoughtform cap · brooch · rings · signet map on the hand.",
    motto: "Owning the map between work and intelligence.",
    modelPath: null,
    stillPath: "/images/services/vince.jpg",
    short: "Architect",
    facts: [
      { k: "Seat", v: "Loop Earplugs" },
      { k: "Owns", v: "The map between work and intelligence" },
      { k: "Decides", v: "Which setup runs which workflow" },
      { k: "Answers for", v: "What it inherits, and the outcome" },
    ],
  },
  {
    id: "genai",
    beatId: "genai",
    year: "2023",
    wardrobe: "The AI Captain",
    /* ⚠ THE LOADOUT NAMES WHAT THE PLATE SHOWS (ADR-082 U13's rule, applied
       here by ADR-082 U23's wave). It read "Blazer · shirt · Latent Land cape ·
       cap" — the UNIFORM's loadout, carried over before this era had a figure
       of its own. The Starhaven captain wears none of it: he is bare-headed in
       a cloak over a floor-length robe, and the cap belongs to the Architect. */
    loadout: "Latent Land cloak · gold cuffs · disc sash · a halo of stars.",
    motto: "The models arrived. Wrote the charter.",
    modelPath: null,
    stillPath: "/images/voidwalker/era-genai.jpg",
    /* The era's own hologram — wave `20260918-genai-v1`, the Starhaven captain
       from the owner's own reference painting with his identity locked from the
       2025 shoot. Nano Banana Pro for the still, Veo 3.1 for the idle, keyed on
       a LUT measured off this asset (`clip((val-11)*20)`).
       ⚠ THE LOOP IS CLOSED BY AN OVERLAP, NOT BY A TRIM ALONE. This idle is
       deliberately almost still (motion 1.19/255 between frames) and its best
       return point still sat 3.5 out — three ordinary frame-steps of jump. The
       tail is blended into the head, which takes the seam under the clip's own
       motion floor: the join is quieter than the movement.
       ⚠ AND THE FIGURE IS SEATED — the frame is shifted so the boots land on
       the foot anchor rather than hovering above the projector disc.
       ⚠ `-v2` BECAUSE `-v1` SHIPPED FOR AN HOUR AND DRIPPED. Its robe was lit
       only along the fold highlights, so the cloth between them sat at the
       ground's own black level and the key cut the silhouette into vertical
       strips with the corridor showing through — measured 7.87 opaque runs per
       hem row against the Architect's 1.93. Three things it was NOT: the model
       (the raw frames are clean), the encoder (pre- and post-VP9 are
       identical), or the LUT (every gain from 5 to 20 does it). The draw that
       ships holds at 1.90. A cache does not read commit messages, so the
       replacement takes a new URL. */
    hologram: {
      videoPath: "/videos/voidwalker/holo-idle-genai-v2.mp4",
      videoAlphaPath: "/videos/voidwalker/holo-idle-genai-v2.webm",
      videoAlphaHevcPath: "/videos/voidwalker/holo-idle-genai-v2.mov",
      posterPath: "/images/voidwalker/holo-still-genai-v2.jpg",
      posterAlphaPath: "/images/voidwalker/holo-still-genai-v2.webp",
      thumbPath: "/images/voidwalker/holo-thumb-genai-v2.webp",
      frame: { width: 720, height: 1280 },
      headY: 0.0563,
      footY: 0.993,
    },
    short: "Latent Land",
    facts: [
      { k: "Founded", v: "Starhaven" },
      { k: "First", v: "Hybrid AI-video production in Belgium" },
      { k: "Campaign", v: "Under Armour, with Anthony Joshua" },
      { k: "Charter", v: "UBA/ACC AI Charter, co-drafted" },
    ],
    // The film the era is named for. Its id lives as a source comment on
    // the `genai` beat; the record has no second `film` field to put it in.
    film: {
      youtubeId: "jFVezT4mznU",
      title: "Welcome to Latent Land",
      poster: "/images/voidwalker/film-latent-land.jpg",
    },
  },
  {
    id: "azeroth",
    beatId: "classroom",
    year: "2020",
    // ⚠ The Azeroth era's WARDROBE is deliberately the one exception to the
    // identity-map's five-era uniform (blazer · turtleneck · cap · rolled cuff
    // · combat boots). The 2020 field site was Azeroth itself: the figure is
    // Vince's Warcraft warlock ARAFEL (Human, Alliance, Magtheridon EU), in
    // his own "Daemoniac" transmog, TALKING — the emote is what the era is
    // about, because the class was taught inside the game.
    //
    // ⚠ AND IT IS THE CHARACTER'S OWN GEOMETRY NOW, LIT AS A HOLOGRAM RATHER
    // THAN GRADED INTO ONE. v1 ran a written wardrobe through an image model,
    // which is a paraphrase (generic cowl, invented fel spires, nondescript
    // sword). v2 and v3 captured Blizzard's renderer through Wowhead's
    // dressing room and post-graded the frames. v5 renders the export itself:
    // `wow.export`'s rigged GLB, in Blender, on an emissive hologram material.
    //
    // ⚠ THE PERFORMANCE IS A CHAIN OF THREE OF THE MODEL'S OWN ANIMATIONS
    // (owner, 2026-08-31): `EmoteTalkQuestion` → `EmoteTalk` →
    // `EmoteTalkSubdued`, laid back to back on ONE NLA track — he asks, he
    // explains, he settles. The junctions cost nothing, and how WoW authors a
    // cycle is why: an emote's last frame duplicates its first and all three
    // start and end on the same neutral stand, so laying each strip's START on
    // the previous strip's END overwrites that duplicate with an identical
    // pose. No crossfade — a blend window would smear the hands mid-gesture.
    // Measured on the delivered pixels, the loudest cut in the loop is at
    // frame 86, INSIDE EmoteTalk where the hand snaps out; neither junction
    // (43→44, 91→92) is distinguishable from ordinary motion.
    //
    // Three things
    // only this route can do — the alpha is the RENDERER'S (v3 carried 414
    // matte cuts along dark cloth, because a difference key against a backdrop
    // cannot separate black from black), the FRESNEL RIM needs a surface
    // normal a finished frame does not have, and the scan cadence is WRAPPED
    // ON THE GEOMETRY in world space instead of lying flat on the picture.
    // Recipe in `voidwalker-avatar/waves/20260830-azeroth-v5-blender`.
    //
    // ⚠ BAKE THE LIGHT, CODE THE SCREEN still holds (ADR-082 U1). The baked
    // band is coarse — one cycle per ~19px against the site's own 1px-in-3px
    // CSS scan mask — and carries only the part CSS cannot: a cadence that
    // curves over the shoulders. The site's mask, flicker and materialize are
    // untouched.
    wardrobe: "The Azeroth teacher",
    // ⚠ THE PLATE SPEAKS FOR WHAT IT SHOWS (U13's rule). Two imps stand at his
    // shoulders facing the way he faces — with him, not watching him. The v8
    // seated class was built, shipped and then taken back out at the owner's
    // read: three children at ~150px each read as a huddle rather than as a
    // class, and the space they occupied is worth more empty. The machinery
    // stays (`--kids`, `KID_DIM`, the sit-variation alternation) because it
    // works and the question may return; only the call site is shorter.
    //
    // ⚠ AND THE WAIST PIECE IS OFF THE FIGURE SINCE v10 (owner: the belt's
    // glow is distracting). Its buckle carries the set's fel orb, which even
    // under the v6 fel cap was the brightest single object on the man — a
    // hologram whose loudest feature is a belt buckle is pointing at the wrong
    // thing. The BODY's own belt geoset stays: it never glowed, and dropping
    // it too would cut a notch in the robe where the item used to sit.
    loadout: "Daemoniac · Shard of Azzinoth · flanked by two imps.",
    motto: "Class moved into the game.",
    modelPath: null,
    stillPath: "/images/services/vince.webp",
    // ⚠ `-v10` IS PART OF THE CONTRACT. Each wave has shipped under its own
    // suffix since v1 took the unsuffixed names — a cache does not read commit
    // messages, so a new URL is the only guarantee the new figure reaches the
    // reader. v5–v7 were the imp arc, tuned three times; v8 added a seated
    // class, v9 took it out again keeping v8's real gain, and v10 is the
    // three-emote chain with the waist piece removed.
    //
    // ⚠ headY/footY ARE MEASURED OFF THE DELIVERED ALPHA, at the opaque cutoff
    // 32/255, over EVERY frame rather than frame zero — a talking idle's head
    // and hands move, so an anchor taken from one pose is wrong for the other
    // 239. They agree with the camera solve's own projection to three decimal
    // places, which is the check that the frame is the frame that was solved.
    // ⚠ AND THEY ARE READ OFF THE FIGURE-ONLY RENDER. Pointed at the delivered
    // composite the same script returns footY 0.9719 — the imps' claws, three
    // rows below his boots — and the projector disc would seat low.
    //
    // ⚠ headY MOVED 0.159 → 0.235 WITH THE CHAIN, AND THAT IS ARITHMETIC, NOT
    // A RECOMPOSITION. The frame is WIDTH-bound: the fit takes the widest pose
    // in the whole loop and the 0.5625 slot then decides the height, so every
    // centimetre of reach costs scale. Measured per emote, the man spans
    // 1.400 m in EmoteTalkSubdued (v9's cut, all pauldron), 1.446 m in
    // EmoteTalkQuestion and 1.549 m in EmoteTalk, where the gauntlet swings
    // out — so EmoteTalk alone widens him 10.6 % and stands him 8 % shorter in
    // the slot. footY is unchanged, so the projector disc has not moved; the
    // surplus is all above his head. Cropping to recover it is not available:
    // a gauntlet is worn, and U13's line is "a plume may run off the edge; the
    // man may not".
    //
    // ⚠ `-v11` IS v10 SEATED, NOTHING ELSE (ADR-082 U31). U25 named the defect
    // and left it open: every other era's boots end at 0.993–0.998 of the
    // canvas and his ended at 0.9695, so on a slot whose floor IS the projector
    // disc he hovered 23.6px at 1920×1247 — 27.3 once U29's overscan magnified
    // it. The close is a pure 33-row downward SHIFT of the same 240 rendered
    // frames (`scripts/voidwalker-avatar/reseat_azeroth.py`): no scale, no crop,
    // no re-render, and the composite's lowest claw lands at row 1277 of 1279.
    // ⚠ BOTH ANCHORS ARE AUTHORED AS `v10 + 33/1280`, NEVER RE-ROUNDED. The
    // figure-only render measures head row 334 / foot row 1274, i.e. 0.2609 /
    // 0.9953, and rounding those separately gives a span of 0.7344 — which makes
    // `holoFigureFit` return 0.99986 for the ONE era whose fit must be exactly 1
    // (`HOLO_FIGURE_SPAN` is his span, and the unit guard says so).
    hologram: {
      videoPath: "/videos/voidwalker/holo-idle-azeroth-v11.mp4",
      videoAlphaPath: "/videos/voidwalker/holo-idle-azeroth-v11.webm",
      posterPath: "/images/voidwalker/holo-still-azeroth-v11.jpg",
      posterAlphaPath: "/images/voidwalker/holo-still-azeroth-v11.webp",
      thumbPath: "/images/voidwalker/holo-thumb-azeroth-v11.webp",
      frame: { width: 720, height: 1280 },
      headY: 0.261,
      footY: 0.9953,
    },
    short: "Azeroth",
    facts: [
      { k: "Field site", v: "Azeroth" },
      { k: "Course", v: "Online Communities" },
      { k: "Also ran", v: "Social Media Storytelling" },
      { k: "The exit", v: "Built into the calendar" },
    ],
  },
  {
    id: "expanse",
    beatId: "expanse",
    year: "2018",
    wardrobe: "The campaign commander",
    /* Named off the owner's own set photographs (ADR-082 U24), not off the
       show: he is in the production's MCRN marine armour over his own clothes,
       with the kilt panel at the waist and his cap still on. ⚠ It read
       "Blazer · shirt · lanyard · camera · phone · cap" — BYTE-IDENTICAL to
       `pokemon-go`'s, which is what a placeholder looks like, and which is why
       a scoped edit was needed to change one of them. */
    loadout: "Marine plate · gauntlets · kilt panel · his own cap.",
    motto: "Venting became a campaign.",
    modelPath: null,
    stillPath: "/images/voidwalker/era-expanse.jpg",
    /* The era's own hologram — wave `20260918-expanse-v1`. ⚠ THE WARDROBE
       REFERENCE IS TWO PHOTOGRAPHS, not one: a solo full-body frame for the
       silhouette and a lit group frame where the plate's panels actually read.
       ⚠ AND THE CAP IS THE IDENTITY'S, NOT THE SET'S. He wore a plain dark cap
       on the day; the figure wears the Thoughtform one he is locked from, which
       is the cap the Architect wears eight years later. That is the UNIFORM
       reading rather than the documentary one — recorded because it is a
       choice, and the loadout says "his own cap" rather than naming it. */
    hologram: {
      videoPath: "/videos/voidwalker/holo-idle-expanse-v1.mp4",
      videoAlphaPath: "/videos/voidwalker/holo-idle-expanse-v1.webm",
      videoAlphaHevcPath: "/videos/voidwalker/holo-idle-expanse-v1.mov",
      posterPath: "/images/voidwalker/holo-still-expanse-v1.jpg",
      posterAlphaPath: "/images/voidwalker/holo-still-expanse-v1.webp",
      thumbPath: "/images/voidwalker/holo-thumb-expanse-v1.webp",
      frame: { width: 720, height: 1280 },
      headY: 0.0437,
      footY: 0.9961,
    },
    short: "The Expanse",
    facts: [
      { k: "Petition", v: "Past 100,000 signatures" },
      { k: "Command post", v: "A Discord" },
      { k: "The flight", v: "LA, to put it in front of Jeff Bezos" },
      { k: "Outcome", v: "Three more seasons" },
    ],
    // The coins post is the other 2018 crowd and has no era of its own,
    // so this seat prints its press card beside the campaign's.
    pressBeatIds: ["expanse", "coins"],
    film: {
      youtubeId: "a5-DcdfxCvU",
      title: "How the power of fans saved The Expanse",
      duration: "2:14",
      poster: "/images/voidwalker/film-save-the-expanse.jpg",
    },
  },
  {
    id: "pokemon-go",
    beatId: "pokemon-go",
    year: "2016",
    wardrobe: "The street organiser",
    loadout: "Blazer · shirt · lanyard · camera · phone · cap.",
    motto: "The crowd was the work.",
    modelPath: null,
    stillPath: "/images/vince-portrait.jpg",
    short: "Pokémon GO",
    // ⚠ FOUR ROWS, NOT FIVE — THE FACTS SEAT IS FIXED. A fifth row
    // ("Same years · A hashtag became a party") overran `--vwh-seat-h` and
    // printed straight through the ON RECORD heading below it: measured 34px
    // of ink collision at 1440x900, and invisible to any per-string budget
    // because every value was well inside its own limit. The dropped row was
    // the Ophef beat's summary, and that beat's press card is already the
    // second card in ON RECORD — so the seat is honest and nothing is lost.
    facts: [
      { k: "Co-founded", v: "Pokémon GO Belgium" },
      { k: "First", v: "Pokémon GO consultant, advising Unizo" },
      { k: "Street hunt", v: "About a thousand" },
      { k: "Zoo hunt", v: "Sixteen thousand" },
    ],
    // Ophef is the same year's other crowd and has no era of its own.
    pressBeatIds: ["pokemon-go", "ophef"],
  },
];

/** How many eras the roster ships with — curated by the owner, pinned
 *  by a unit guard so growth is a decision, not a drift. */
export const CHARACTER_ERA_COUNT = 5 as const;

/** Look up an era by id; never throws — the consumer decides what to
 *  do on a miss (typically a fallback to the first entry). */
export function findCharacterEra(id: string): CharacterEra | undefined {
  return CHARACTER_ERAS.find((e) => e.id === id);
}

/**
 * Resolve an era's production media without ever returning an unvalidated
 * generated-asset record. The shared canonical pair is the visible fallback,
 * not an empty slot.
 */
export function resolveCharacterEraHologram(
  era: Pick<CharacterEra, "hologram"> | null | undefined
): CharacterEraHologram {
  return isCharacterEraHologram(era?.hologram) ? era.hologram : CANONICAL_CHARACTER_ERA_HOLOGRAM;
}

/** The beats whose press cards an era prints, in order. One place, so
 *  the renderer and the guard cannot disagree about the default. */
export function eraPressBeatIds(era: CharacterEra): readonly string[] {
  return era.pressBeatIds ?? [era.beatId];
}
