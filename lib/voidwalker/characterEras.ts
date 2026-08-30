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
   *  take this; Safari falls back to `videoPath`. */
  videoAlphaPath: string;
  /** Frame-zero poster under `public/images/voidwalker/`. Paints while the
   *  video buffers, so it must match whichever source wins — hence the
   *  alpha-capable sibling below. */
  posterPath: string;
  /** Frame-zero poster WITH alpha (WebP/PNG), for the alpha path. A `.jpg`
   *  cannot hold alpha, so without this the boot frame would flash an opaque
   *  black rectangle before the first video frame arrives. */
  posterAlphaPath: string;
  /** The normalized delivery canvas. Exact by contract. */
  frame: {
    readonly width: 720;
    readonly height: 1280;
  };
  /** Normalized Y coordinate of the top of the authored figure. */
  headY: number;
  /** Normalized Y coordinate where the boots meet the projector plane. */
  footY: number;
}

/**
 * The one production-ready hologram. Every era resolves to this pair until
 * an era-specific pair is present and passes `isCharacterEraHologram`.
 */
export const CANONICAL_CHARACTER_ERA_HOLOGRAM = Object.freeze({
  videoPath: "/videos/voidwalker/holo-idle-thoughtform.mp4",
  videoAlphaPath: "/videos/voidwalker/holo-idle-thoughtform.webm",
  posterPath: "/images/voidwalker/holo-still-thoughtform.jpg",
  posterAlphaPath: "/images/voidwalker/holo-still-thoughtform.webp",
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
const HOLOGRAM_POSTER_PATH = /^\/images\/voidwalker\/[a-z0-9][a-z0-9._-]*\.(?:jpe?g|png|webp)$/i;
/** Same reasoning one step down: JPEG has no alpha channel. */
const HOLOGRAM_POSTER_ALPHA_PATH = /^\/images\/voidwalker\/[a-z0-9][a-z0-9._-]*\.(?:png|webp)$/i;

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
    typeof candidate.posterPath === "string" &&
    HOLOGRAM_POSTER_PATH.test(candidate.posterPath) &&
    typeof candidate.posterAlphaPath === "string" &&
    HOLOGRAM_POSTER_ALPHA_PATH.test(candidate.posterAlphaPath) &&
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
 * for Azeroth, the cap and film cape for 2022's Latent Land, and the
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
    year: "2022",
    wardrobe: "The AI Captain",
    loadout: "Blazer · shirt · Latent Land cape · cap.",
    motto: "The models arrived. Wrote the charter.",
    modelPath: null,
    stillPath: "/images/vince-portrait.jpg",
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
    // `wow.export`'s rigged GLB, `EmoteTalkSubdued` off the model's own 422
    // animations, in Blender on an emissive hologram material. Three things
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
    // ⚠ THE PLATE SPEAKS FOR WHAT IT SHOWS (U13's rule), AND WHAT IT SHOWS IS
    // A CLASS. Two imps stand at his shoulders facing the way he faces; three
    // children sit in front of him facing HIM, backs to the reader. That is
    // the shape a room takes when someone is teaching in it, which is the
    // whole reason this era is on the wall — and it is why the imps moved out
    // of the middle: the space in front of a teacher belongs to the students.
    loadout: "Daemoniac · Shard of Azzinoth · two imps, and a class.",
    motto: "Class moved into the game.",
    modelPath: null,
    stillPath: "/images/services/vince.webp",
    // ⚠ `-v8` IS PART OF THE CONTRACT. Each wave has shipped under its own
    // suffix since v1 took the unsuffixed names — a cache does not read commit
    // messages, so a new URL is the only guarantee the new figure reaches the
    // reader. v5–v7 were the imp arc, tuned three times; v8 is the composition
    // the era actually wanted — the imps out of the middle, standing at his
    // shoulders facing HIS way, and a seated class in the space they left.
    //
    // ⚠ headY/footY ARE MEASURED OFF THE DELIVERED ALPHA, at the opaque cutoff
    // 32/255, over EVERY frame rather than frame zero — a talking idle's head
    // and hands move, so an anchor taken from one pose is wrong for the other
    // 148. They agree with the camera solve's own projection to four decimal
    // places, which is the check that the frame is the frame that was solved.
    //
    // ⚠ AND headY IS 0.159 BECAUSE THE FRAME IS WIDTH-BOUND, NOT BECAUSE THE
    // FIGURE SITS LOW. The Daemoniac pauldrons span 1.40 m against a 2.08 m
    // man — aspect 0.67 in a 0.5625 slot — so the shoulders decide the fit and
    // the surplus lands above the head. A height-first fit crops them, and a
    // pauldron is worn: U13's "a plume may run off the edge; the man may not".
    hologram: {
      videoPath: "/videos/voidwalker/holo-idle-azeroth-v8.mp4",
      videoAlphaPath: "/videos/voidwalker/holo-idle-azeroth-v8.webm",
      posterPath: "/images/voidwalker/holo-still-azeroth-v8.jpg",
      posterAlphaPath: "/images/voidwalker/holo-still-azeroth-v8.webp",
      frame: { width: 720, height: 1280 },
      headY: 0.1586,
      footY: 0.9695,
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
    loadout: "Blazer · shirt · lanyard · camera · phone · cap.",
    motto: "Venting became a campaign.",
    modelPath: null,
    stillPath: "/images/services/Vince-4.jpg",
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
