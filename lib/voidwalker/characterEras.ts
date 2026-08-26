/**
 * The VOIDWALKER character-stage era registry (ADR-082).
 *
 * Six selectable versions of the owner across twelve years — the
 * curated roster the character stage ships with (owner ruling, not the
 * full nine). Each entry pins to a beat id in
 * `voidwalkerData.ts` (ADR-074), which is the record and stays the
 * source of truth for years, titles and prose. This file only names
 * the WARDROBE ("what era-Vince wore"), the model asset and the still
 * that stands in on mobile / PRM / no-WebGL.
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
  },
  {
    id: "thoughtform",
    beatId: "thoughtform",
    year: "2025",
    wardrobe: "The founder",
    loadout: "Blazer · turtleneck · Thoughtform cap · brooch · rings.",
    motto: "The practice, founded.",
    modelPath: null,
    stillPath: "/images/services/Vince-4.jpg",
    short: "Thoughtform",
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
  },
  {
    id: "the-crowd",
    // The plate beat is the Expanse campaign (the compound span's
    // richest artefact); the era HUD lists all four crowds (Pokémon GO,
    // Ophef, Save The Expanse, Six coins) in the copy panel.
    beatId: "expanse",
    year: "2016–18",
    wardrobe: "The street organiser",
    loadout: "Blazer · shirt · lanyard · camera · phone · cap.",
    motto: "The crowd was the work.",
    modelPath: null,
    stillPath: "/images/services/Vince-4.jpg",
    short: "The Crowd",
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
