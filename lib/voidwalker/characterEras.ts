/**
 * The VOIDWALKER character-stage era registry (ADR-082).
 *
 * Six selectable versions of the owner across twelve years — the
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
 * the origin (`creatives`).
 *
 * ⚠ ZERO IMPORTS. The consumers are the stage renderer, its lab
 * variant and a unit guard — one record, no cycles, no runtime.
 */

/** A stable non-display id for the era. Kebab; matches the beat id it
 *  hangs off in `VOIDWALKER_BEATS`. The compound `the-crowd` is the
 *  one exception — it spans four 2016–18 beats (Pokémon GO, Ophef, the
 *  Expanse campaign + film, and the coins post), each one an instance
 *  of the same move on a different crowd. */
export type CharacterEraId =
  | "creatives"
  | "the-crowd"
  | "azeroth"
  | "genai"
  | "thoughtform"
  | "loop";

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
   * The rail label as it letters on the era pip. Kept short so all six
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
   * ⚠ THIS IS HOW THE UNMAPPED BEATS BECOME REACHABLE. `the-crowd`
   * spans four 2016–18 beats but pins to `expanse` for its plate, so
   * the Pokémon GO, Ophef and coins beats have no era of their own.
   * Naming them here is what lets one era speak for its whole span
   * without duplicating a word of the record.
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
 * makes the moment recognisable: a mic and shorter blazer for 2014, a
 * lanyard and camera for the crowds, a lecturer's tote for Azeroth, the
 * cap and film cape for 2022's Latent Land, the Thoughtform cap +
 * ThoughtForm brooch for 2025, the same coat but longer for 2026.
 * These are the WARDROBE LOCKS the skill runs against.
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
    id: "thoughtform",
    beatId: "thoughtform",
    year: "2025",
    wardrobe: "The founder",
    loadout: "Blazer · turtleneck · Thoughtform cap · brooch · rings.",
    motto: "The practice, founded.",
    // First real Meshy model (voidwalker-avatar wave 20260826-thoughtform-v3,
    // lowpoly A/B winner, texture re-encoded to 1.55 MB from 4.30).
    modelPath: "/models/voidwalker/thoughtform.glb",
    stillPath: "/images/services/Vince-4.jpg",
    short: "Thoughtform",
    facts: [
      { k: "Founded", v: "Thoughtform, the practice" },
      { k: "Subject", v: "Organisations" },
      { k: "In place of", v: "A platform, an intelligence" },
      { k: "Mark", v: "Cap, brooch, rings" },
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
    wardrobe: "The Azeroth teacher",
    loadout: "Blazer · turtleneck · cap · lecturer's tote · headphones.",
    motto: "Class moved into the game.",
    modelPath: null,
    stillPath: "/images/services/vince.webp",
    short: "Azeroth",
    facts: [
      { k: "Field site", v: "Azeroth" },
      { k: "Course", v: "Online Communities" },
      { k: "Also ran", v: "Social Media Storytelling" },
      { k: "The exit", v: "Built into the calendar" },
    ],
  },
  {
    id: "the-crowd",
    // The plate beat is the Expanse campaign (the compound span's
    // richest artefact); the era's facts and press speak for all four
    // crowds — Pokémon GO and Ophef in the rows, the coins post in the
    // second press card.
    beatId: "expanse",
    year: "2016–18",
    wardrobe: "The street organiser",
    loadout: "Blazer · shirt · lanyard · camera · phone · cap.",
    motto: "The crowd was the work.",
    modelPath: null,
    stillPath: "/images/services/Vince-4.jpg",
    short: "The Crowd",
    facts: [
      { k: "Petition", v: "Past 100,000 signatures" },
      { k: "Outcome", v: "Three more seasons" },
      { k: "Street hunt", v: "About a thousand" },
      { k: "Zoo hunt", v: "Sixteen thousand" },
      { k: "Same years", v: "A hashtag became a party" },
    ],
    pressBeatIds: ["expanse", "coins"],
    film: {
      youtubeId: "a5-DcdfxCvU",
      title: "How the power of fans saved The Expanse",
      duration: "2:14",
      poster: "/images/voidwalker/film-save-the-expanse.jpg",
    },
  },
  {
    id: "creatives",
    beatId: "creatives",
    year: "2014",
    wardrobe: "The community manager",
    loadout: "Shorter blazer · shirt · mic · lanyard · cap.",
    motto: "Antwerp. Powered by Creatives.",
    modelPath: null,
    stillPath: "/images/vince-portrait.jpg",
    short: "Creatives",
    facts: [
      { k: "Role", v: "Community manager" },
      { k: "Terrain", v: "The Antwerp creative industry" },
      { k: "Held", v: "People, disciplines, industries" },
      { k: "The test", v: "It holds without its organiser" },
    ],
  },
];

/** How many eras the roster ships with — curated by the owner, pinned
 *  by a unit guard so growth is a decision, not a drift. */
export const CHARACTER_ERA_COUNT = 6 as const;

/** Look up an era by id; never throws — the consumer decides what to
 *  do on a miss (typically a fallback to the first entry). */
export function findCharacterEra(id: string): CharacterEra | undefined {
  return CHARACTER_ERAS.find((e) => e.id === id);
}

/** The beats whose press cards an era prints, in order. One place, so
 *  the renderer and the guard cannot disagree about the default. */
export function eraPressBeatIds(era: CharacterEra): readonly string[] {
  return era.pressBeatIds ?? [era.beatId];
}
