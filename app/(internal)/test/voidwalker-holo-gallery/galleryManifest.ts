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

const V5 = `${MIRROR}/20260830-azeroth-v5-blender`;
const V4 = `${MIRROR}/20260829-azeroth-v4`;
const V3 = `${MIRROR}/20260829-azeroth-v3`;
const V2 = `${MIRROR}/20260828-azeroth-v2`;
const V1 = `${MIRROR}/20260828-azeroth-v1`;
const TF5 = `${MIRROR}/20260826-thoughtform-v5`;
const TF4 = `${MIRROR}/20260826-thoughtform-v4`;

export const GALLERY_RUNS: readonly GalleryRun[] = [
  {
    id: "az-v5",
    wave: "20260830-azeroth-v5-blender",
    title: "Azeroth v5 — rendered, not captured",
    date: "2026-08-30",
    status: "SHIPPING",
    adr: "ADR-082 U15",
    summary: [
      "The wow.export pipeline was fixed, so the figure is no longer a capture of Blizzard's renderer — it is the character's OWN geometry, rigged, running `EmoteTalkSubdued` off the model's own 422 animations, re-lit in Blender on an emissive hologram material. The owner's read of the era is that he taught class inside the game; the talk emote is the era, and this is the first route that can pick an animation by name instead of by whatever the dressing room was playing.",
      "THREE THINGS ONLY THIS ROUTE CAN DO. The alpha is the RENDERER'S — v3 carried 414 matte cuts along dark cloth because a difference key against a backdrop cannot separate black from black, and a renderer knows exactly which pixels it drew. The FRESNEL RIM needs a surface normal, which a finished frame does not have, and it is what stops the figure reading as the 'tinted statue' v4's flat grade produced. And the scan cadence is WRAPPED ON THE GEOMETRY in world space, so it curves over the shoulders instead of lying flat on the picture.",
      "⚠ THE FIRST LIT PASS CAME BACK BROWN — the exact 'man in a brown suit' this skill's own record names one pipeline over. WoW's hand-painted armour sits at ~0.1–0.3 luminance, so fed raw into a gold ramp nearly every texel lands on the ramp's dark end. A gamma of 0.50 BEFORE the ramp maps the body of the texture into its gold range; the ramp's shape then does the grading. Same lever v3's grade.py used, one stage earlier.",
      "⚠ AND THE FRAME IS WIDTH-BOUND, WHICH COST A RENDER TO LEARN. The pauldrons span 1.40 m against a 2.08 m man — 0.67 in a 0.5625 slot — and they lean ~0.38 m toward the lens, so an orthographic width fit under a perspective camera under-reads them by 7.6%. The first full render came back with an 81px-tall FLAT CUT through the left pauldron on 117 of 149 frames while every world-space number reported a silhouette that fitted. The camera is solved against the PROJECTED silhouette now, over all 149 posed frames; measured headY/footY agree with the solve to four decimals.",
      "⚠ THE IMPS ARE ANIMATED AGAIN, AND IT TOOK ONE SETTING. v3's imps were frozen PNGs because the only imps on disk were OBJs, and an OBJ carries no skeleton — the cause was `config.exportCreatureFormat: \"OBJ\"`. Set to GLB with animations, the same app exports a Fel Imp with 25 animations and a 63-joint skin. Two ride an NLA strip whose integer repeat and derived scale put exactly 7 cycles in the figure's 149-frame loop, so the companions wrap where the man does instead of mid-stride.",
      "THE TWO CUTS BELOW ARE THE SAME RENDER WITH AND WITHOUT THEM, for the owner's read: the imps carry the demonology and the era's 'flanked by two imps', the solo cut is quieter at site scale where the figure's legs and the projector disc already sit in that band. Swapping is one registry line — the wave renders both.",
      "Payload: 2.38 MB against v3's 2.75, with two animated companions and 21 more frames — swept CRF 44/48/52 → 3.53/2.33/1.63 MB, at 0.49/255 of mean error between 44 and 48 measured on the imps' own faces. The bitrate is the bands and the layered translucency, not render noise (64 TAA samples measured 0.62/255 from 256).",
    ],
    assets: [
      {
        id: "az-v5-idle",
        kind: "video",
        src: `${V5}/holo-idle-azeroth-v5.mp4`,
        alphaSrc: `${V5}/holo-idle-azeroth-v5.webm`,
        label: "idle loop, with imps (live on the site)",
        note: "149 frames @ 24fps = 6.21s, the action's own length less the duplicate last frame. VP9/yuva420p CRF 48 for alpha, H.264 CRF 26 for the Safari floor. The baked scan band runs exactly 6 cycles per loop so the cadence closes with the animation.",
        mb: 2.38,
      },
      {
        id: "az-v5-solo",
        kind: "video",
        src: `${V5}/holo-idle-azeroth-v5-solo.mp4`,
        alphaSrc: `${V5}/holo-idle-azeroth-v5-solo.webm`,
        label: "idle loop, figure alone",
        note: "The same scene and the same 149 frames without the companions — the A/B for whether the imps earn the bottom third of the frame. 1.48 MB, and its anchors are byte-identical to the imp cut, which is the proof that scenery does not move the projector's anchor.",
        mb: 1.48,
      },
      {
        id: "az-v5-still",
        kind: "still",
        src: `${V5}/holo-still-azeroth-v5.jpg`,
        alphaSrc: `${V5}/holo-still-azeroth-v5.webp`,
        label: "poster",
        note: "Frame zero. headY 0.1586 / footY 0.9695, measured over every frame's alpha at the 32/255 cutoff.",
        mb: 0.14,
      },
    ],
  },
  {
    id: "az-v4",
    wave: "20260829-azeroth-v4",
    title: "Azeroth v4 — three routes to the same transparent video",
    date: "2026-08-29",
    status: "INTERMEDIATE",
    summary: [
      "A NEW SOURCE, and it is the good one: the owner's in-game .Source triplet — a white-on-black matte plus green and blue plates at 5120×1440, all three shot on the same pose. Alpha comes from the AUTHORED matte, so there is no difference-key and none of v3's 414 matte cuts; the blue plate carries the RGB because the character's own fel-green would be eaten by a green key. Matte and plate align to within a pixel (IoU 0.95–0.98, measured).",
      "ROUTE A · grade.py over the 124 animated frames from the WMW-Midnight GIF. Deterministic, alpha byte-identical, temporally stable by construction — the benchmark. On the corridor's own ground it reads FLAT: one value across the whole figure, a tinted statue rather than a body of light.",
      "ROUTE B · Nano Banana per-frame styling is REJECTED, on arithmetic rather than taste. The single-frame test passed its geometry gate (the styled figure covers 99.6% of the source silhouette), and the look is the best of the three. But two calls on the SAME frame differ by 19.6/255 — a white beard in one, a dark beard and green shoulder fire in the other — while two ADJACENT source frames differ by only 5.0. The model's run-to-run variance is 3.9× the actual motion, so a per-frame batch would bury the animation in strobe. It survives as the way to make ONE still.",
      "ROUTE C · that styled still through Veo 3.1, then keyed to alpha on luminance (EVAL_LOG Note K's geq recipe, which had never been written down as code). This is the one that reads as a hologram: the dark armour drops out into the corridor and only the lit surfaces and the fel-green carry, which is what the flat grade cannot do.",
      "⚠ THE LOOP DID NOT CLOSE ON ITS OWN. Veo's first=last trick left a seam of 15.35/255 against 14.19 of real motion — the jump was louder than the movement, exactly the endpoint drift vid.py's docstring predicts for an idle. Trimming to v3's own detected period (183 of 192 frames) takes the seam to 5.69 against 15.10. Kling was built as a second opinion and is UNTESTED: the account answers `code 1102, balance not enough`, which is billing, not the harness.",
    ],
    assets: [
      {
        id: "az-v4-veo-idle",
        kind: "video",
        src: `${V4}/holo-idle-azeroth-v4-veo.mp4`,
        alphaSrc: `${V4}/holo-idle-azeroth-v4-veo.webm`,
        label: "C · Veo, keyed",
        note: "183 frames @ 24fps = 7.63s, trimmed to the detected loop period. Luma-keyed alpha: 2.2% opaque, 38% partial — the translucency is the point, not a defect.",
        mb: 6.55,
      },
      {
        id: "az-v4-grade-idle",
        kind: "video",
        src: `${V4}/holo-idle-azeroth-v4-grade.mp4`,
        alphaSrc: `${V4}/holo-idle-azeroth-v4-grade.webm`,
        label: "A · grade.py, animated",
        note: "124 frames @ 24fps = 5.17s off the WMW-Midnight capture. The deterministic control: same duotone as v3, no generative step, no flicker.",
        mb: 2.08,
      },
      {
        id: "az-v4-routes",
        kind: "sheet",
        src: `${V4}/compare-routes.jpg`,
        label: "the four-way still",
        note: "Source · grade.py · two Nano Banana attempts. The two attempts are the flicker evidence: same input, same prompt, different beard and different shoulder fire.",
      },
      {
        id: "az-v4-animated",
        kind: "sheet",
        src: `${V4}/compare-animated.jpg`,
        label: "A vs C, on the corridor ground",
        note: "Composited over #0b0a09 rather than a checkerboard, because an emissive asset can only be judged against the ground it will actually sit on.",
      },
      {
        id: "az-v4-styled",
        kind: "source",
        src: `${V4}/styled/style-holo-emissive-azeroth-02.jpg`,
        label: "the styled still",
        note: "Nano Banana Pro on the keyed matte, style block `holo-emissive-azeroth` — the azeroth wardrobe on holo-emissive-black's grammar, with the fel-green ring-fenced against the gold. This one frame is what Veo animates.",
      },
      {
        id: "az-v4-veo-still",
        kind: "still",
        src: `${V4}/holo-still-azeroth-v4-veo.jpg`,
        alphaSrc: `${V4}/holo-still-azeroth-v4-veo.webp`,
        label: "C · poster",
        note: "Frame zero of the trimmed loop. headY 0.038 / footY 0.942.",
        mb: 0.52,
      },
    ],
  },
  {
    id: "az-v3",
    wave: "20260829-azeroth-v3",
    title: "Azeroth v3 — talking, imps, hybrid grade",
    date: "2026-08-29",
    status: "SUPERSEDED",
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
        label: "idle loop (superseded by v5)",
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
