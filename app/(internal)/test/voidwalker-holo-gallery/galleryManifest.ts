/**
 * The gallery's own record of every hologram asset produced for the
 * voidwalker station, across every wave.
 *
 * ⚠ THE FILES ARE A PER-MACHINE MIRROR, NOT REPO CONTENT. They are served
 * from `public/_previews/voidwalker-avatar/`, which `.gitignore` excludes and
 * `scripts/sync-voidwalker-avatar-preview.mjs` populates by copying the
 * offline `voidwalker-avatar` skill's `waves/` folder (585 MB across 15
 * waves — nothing that size belongs in a deploy).
 *
 *   node scripts/sync-voidwalker-avatar-preview.mjs
 *
 * ⚠ AND THAT PATH IS DELIBERATELY NOT THE PRODUCTION ONE. Two entries below
 * (`az-v3`, `tf-ship`) are the same bytes `characterEras.ts` points at, but
 * they resolve through the mirror: this page has to keep rendering the older
 * runs after production moves on, and it must not break when the commit that
 * supersedes an asset deletes it from `public/`.
 */

const MIRROR = "/_previews/voidwalker-avatar";

export type AssetKind = "video" | "still" | "sheet" | "diagnostic" | "source";

export interface GalleryAsset {
  /** Stable id, used for the DOM and the play-all wiring. */
  id: string;
  kind: AssetKind;
  /** Full path under `public/`. */
  src: string;
  /** For video and still entries: the alpha-capable sibling, if one exists. */
  alphaSrc?: string;
  label: string;
  /** One line: what this asset IS. */
  note: string;
  /** Approximate on-disk size, for the payload conversation. */
  mb?: number;
}

export interface GalleryRun {
  id: string;
  /** The wave folder in the `voidwalker-avatar` skill. */
  wave: string;
  title: string;
  date: string;
  status: "SHIPPING" | "SUPERSEDED" | "REJECTED" | "INTERMEDIATE";
  /** The ADR update that records it, when one does. */
  adr?: string;
  /** What this run did, and what was wrong with it. */
  summary: readonly string[];
  assets: readonly GalleryAsset[];
}

const V3 = `${MIRROR}/20260829-azeroth-v3`;
const V2 = `${MIRROR}/20260828-azeroth-v2`;
const V1 = `${MIRROR}/20260828-azeroth-v1`;
const TF5 = `${MIRROR}/20260826-thoughtform-v5`;
const TF4 = `${MIRROR}/20260826-thoughtform-v4`;

export const GALLERY_RUNS: readonly GalleryRun[] = [
  {
    id: "az-v3",
    wave: "20260829-azeroth-v3",
    title: "Azeroth v3 — talking, imps, hybrid grade",
    date: "2026-08-29",
    status: "SHIPPING",
    adr: "ADR-082 U14",
    summary: [
      "Wowhead capture with EmoteTalkSubdued applied post-load, the Skull of the Man'ari offhand removed at source, two imps chroma-keyed from the owner's own .Source triplet, and a hybrid gold + fel-green grade baked in.",
      "KNOWN DEFECTS, all visible on the checkerboard backdrop: the arm-gap voids read as holes in the figure against a dark corridor; 414 small matte cuts survive along dark cloth edges (21,920 px total); and the imps are STATIC — one still PNG composited into every frame at 85% alpha.",
    ],
    assets: [
      {
        id: "az-v3-idle",
        kind: "video",
        src: `${V3}/holo-idle-azeroth-v3.mp4`,
        alphaSrc: `${V3}/holo-idle-azeroth-v3.webm`,
        label: "idle loop",
        note: "128 frames @ 24fps = 5.33s. VP9/yuva420p CRF 40 for alpha, H.264 CRF 26 for the Safari floor.",
        mb: 2.75,
      },
      {
        id: "az-v3-still",
        kind: "still",
        src: `${V3}/holo-still-azeroth-v3.jpg`,
        alphaSrc: `${V3}/holo-still-azeroth-v3.webp`,
        label: "poster",
        note: "Frame zero. headY 0.049 / footY 0.972, measured on a companion-free recomposite.",
        mb: 0.21,
      },
      {
        id: "az-v3-imp-right",
        kind: "source",
        src: `${V3}/imp-right.png`,
        label: "imp, right seat",
        note: "Split out of the .Source composition by connected-component labelling on the alpha channel.",
      },
      {
        id: "az-v3-imp-left",
        kind: "source",
        src: `${V3}/imp-left.png`,
        label: "imp, left seat (MIRRORED)",
        note: "A horizontal mirror of the right imp. The authored left imp's alpha fused with the figure's cloak at the boots, so labelling returned 2 blobs where 3 were wanted.",
      },
    ],
  },
  {
    id: "az-v2",
    wave: "20260828-azeroth-v2",
    title: "Azeroth v2 — captured, not generated",
    date: "2026-08-28",
    status: "SUPERSEDED",
    adr: "ADR-082 U13",
    summary: [
      "The first capture of Blizzard's own renderer, driven by the character's transmog hash rather than a written prompt. A Doomguard composited in behind him from a second capture, resampled onto the figure's period.",
      "WHAT WAS WRONG: a dressing-room idle rather than a talking one, the Skull of the Man'ari throwing fel-fire skulls off both shoulders, and raw game colour the CSS raster alone could not resolve as a projection.",
    ],
    assets: [
      {
        id: "az-v2-idle",
        kind: "video",
        src: `${V2}/holo-idle-azeroth-v2.mp4`,
        alphaSrc: `${V2}/holo-idle-azeroth-v2.webm`,
        label: "idle loop",
        note: "64 frames @ 24fps. Compare its colour against v3's on the same backdrop — this is the untreated game render.",
        mb: 1.39,
      },
      {
        id: "az-v2-still",
        kind: "still",
        src: `${V2}/holo-still-azeroth-v2.jpg`,
        alphaSrc: `${V2}/holo-still-azeroth-v2.webp`,
        label: "poster",
        note: "headY 0.051 / footY 0.973.",
        mb: 0.16,
      },
    ],
  },
  {
    id: "az-v1",
    wave: "20260828-azeroth-v1",
    title: "Azeroth v1 — generated from a written wardrobe",
    date: "2026-08-28",
    status: "REJECTED",
    adr: "ADR-082 U12",
    summary: [
      "Nano Banana Pro on a bespoke prompt combining the identity lock, a written WoW wardrobe, and the hologram grammar — then Veo 3.1 for the idle, keyed with a luma LUT re-measured from the asset.",
      "WHY IT WAS REJECTED: a described transmog is a paraphrase. The head came back a generic cowl where the record has a Maroon Quotidian Hood, the shoulders were invented fel spires, the mainhand a nondescript sword. Every clause of the prompt was true and the picture was still wrong.",
    ],
    assets: [
      {
        id: "az-v1-idle",
        kind: "video",
        src: `${V1}/holo-idle-azeroth.mp4`,
        alphaSrc: `${V1}/holo-idle-azeroth.webm`,
        label: "idle loop",
        note: "Veo output, transcoded. Alpha keyed with `clip((val-8)*8, 0, 255)` via the geq RGBA path — `alphamerge` silently dropped chroma on this ffmpeg build.",
        mb: 3.11,
      },
      {
        id: "az-v1-idle-a",
        kind: "video",
        src: `${V1}/holo-idle-azeroth-a.mp4`,
        label: "pre-key master",
        note: "The raw Veo plate before the key, on its baked background.",
        mb: 6.94,
      },
      {
        id: "az-v1-still",
        kind: "still",
        src: `${V1}/holo-still-azeroth.jpg`,
        alphaSrc: `${V1}/holo-still-azeroth.webp`,
        label: "poster",
        note: "headY 0.044 / footY 0.975.",
        mb: 0.27,
      },
      {
        id: "az-v1-contact",
        kind: "sheet",
        src: `${V1}/contact-sheet.jpg`,
        label: "contact sheet",
        note: "The wave's generations. This is the read that told the owner a written wardrobe would not do.",
      },
      {
        id: "az-v1-contact-gold",
        kind: "sheet",
        src: `${V1}/contact-gold.jpg`,
        label: "gold variants",
        note: "The gold-grade attempts from the generative route.",
      },
      {
        id: "az-v1-contact-fel",
        kind: "sheet",
        src: `${V1}/contact-fel.jpg`,
        label: "fel variants",
        note: "The fel-green-led alternatives — the ancestor of v3's hybrid grade decision.",
      },
    ],
  },
  {
    id: "tf-ship",
    wave: "20260826-thoughtform-v5",
    title: "Thoughtform 2025 — the canonical pair (reference)",
    date: "2026-08-26",
    status: "SHIPPING",
    adr: "ADR-082 U6",
    summary: [
      "The era every unauthored era falls back to, and the asset the hologram grammar was calibrated against. Generated, gold-emissive on pure black, keyed from luminance with `clip((val-8)*12, 0, 255)`.",
      "This is the LOOK the Azeroth grade is reaching for. Put it beside v2 on the same backdrop and the gap between a treated asset and an untreated one is the whole argument for baking the grade.",
    ],
    assets: [
      {
        id: "tf-ship-idle",
        kind: "video",
        src: "/videos/voidwalker/holo-idle-thoughtform.mp4",
        alphaSrc: "/videos/voidwalker/holo-idle-thoughtform.webm",
        label: "idle loop (live on the site)",
        note: "VP9/yuva420p, alpha_mode=1. headY 0.122 / footY 0.998. Served from public/, not the mirror — this one is repo content.",
        mb: 1.78,
      },
      {
        id: "tf-ship-still",
        kind: "still",
        src: "/images/voidwalker/holo-still-thoughtform.jpg",
        alphaSrc: "/images/voidwalker/holo-still-thoughtform.webp",
        label: "poster (live on the site)",
        note: "The alpha poster paints while the video buffers on the alpha branch.",
        mb: 0.15,
      },
      {
        id: "tf-v5-idle-black",
        kind: "video",
        src: `${TF5}/holo-idle-black.mp4`,
        label: "pre-key master",
        note: "The Veo output before the luma key — opaque, on its baked black. Useful for judging what the key threw away.",
        mb: 3.6,
      },
      {
        id: "tf-v5-emissive",
        kind: "sheet",
        src: `${TF5}/holo-emissive-sheet.jpg`,
        label: "emissive sheet",
        note: "The prompt behind this sheet is the one that stopped returning 'a man in a brown suit' — asking for a volumetric hologram is what gave the model permission to EMIT.",
      },
      {
        id: "tf-v5-filmstrip",
        kind: "sheet",
        src: `${TF5}/holo-idle-filmstrip.jpg`,
        label: "idle filmstrip",
        note: "Every frame of the idle in one strip — the fastest read on whether a loop actually closes.",
      },
      {
        id: "tf-v5-style-black",
        kind: "sheet",
        src: `${TF5}/style-holo-emissive-black.jpg`,
        label: "style · emissive on black",
        note: "The style that shipped.",
      },
      {
        id: "tf-v5-style-green",
        kind: "sheet",
        src: `${TF5}/style-holo-emissive-green.jpg`,
        label: "style · emissive green",
        note: "The rejected green-led alternative — kept because v3's fel-green clause revisits the same question one era later.",
      },
      {
        id: "tf-v4-sheet",
        kind: "sheet",
        src: `${TF4}/holo-sheet.jpg`,
        label: "v4 sheet (superseded)",
        note: "The pass before the emissive prompt correction.",
      },
      {
        id: "tf-v4-clean",
        kind: "sheet",
        src: `${TF4}/style-holo-clean-black.jpg`,
        label: "style · clean (rejected)",
        note: "An untinted figure. The lab keeps this so the architecture can show what it rejects rather than only assert it.",
      },
      {
        id: "tf-v4-tinted",
        kind: "sheet",
        src: `${TF4}/style-holo-tinted-black.jpg`,
        label: "style · tinted (rejected)",
        note: "A duotone applied on top rather than baked as light — flat next to the emissive version.",
      },
    ],
  },
];

/** Every video id, so the play/pause-all control does not walk the DOM. */
export const GALLERY_VIDEO_IDS: readonly string[] = GALLERY_RUNS.flatMap((r) =>
  r.assets.filter((a) => a.kind === "video").map((a) => a.id)
);
