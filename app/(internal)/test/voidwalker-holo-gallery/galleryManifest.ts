/**
 * The gallery's own record of every hologram asset produced for the
 * voidwalker station, across every wave.
 *
 * ⚠ THE FILES ARE A PER-MACHINE MIRROR, NOT REPO CONTENT. They are served
 * from `public/_previews/voidwalker-avatar/`, which `.gitignore` excludes and
 * `scripts/sync-voidwalker-avatar-preview.mjs` populates by copying the
 * offline `voidwalker-avatar` skill's `waves/` folder (585 MB across 15
 * waves — nothing that size belongs in a deploy) and, since ADR-082 U31, the
 * in-repo chain's `scripts/voidwalker-avatar/waves/` — never a wave's `refs/`
 * (other people's faces) and never a blind sheet's answer key.
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

/**
 * ⚠ A `plate` IS NEVER SHOWN UNDER THE TREATMENT (ADR-082 U31). It is a figure
 * drawn in full colour on a flat key ground, judged for LIKENESS and pose; the
 * gold is applied afterwards by `gold.py`. A scanline mask and an additive
 * blend over a colour photograph show neither the likeness nor the look.
 */
export type AssetKind = "video" | "still" | "sheet" | "diagnostic" | "source" | "plate";

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
  /** A landscape sheet takes two card widths. The cards are sized for one
   *  standing figure, and a side-by-side pair at that width is two 80px men —
   *  too small to judge the one thing a pair is for. */
  wide?: boolean;
}

export interface GalleryRun {
  id: string;
  /** The wave folder in the `voidwalker-avatar` skill. */
  wave: string;
  title: string;
  date: string;
  /** `AWAITING` is a run that exists to ask the owner something. */
  status: "SHIPPING" | "SUPERSEDED" | "REJECTED" | "INTERMEDIATE" | "AWAITING";
  /** The ADR update that records it, when one does. */
  adr?: string;
  /** What this run did, and what was wrong with it. */
  summary: readonly string[];
  assets: readonly GalleryAsset[];
}

const PG1 = `${MIRROR}/20260922-pokemon-go-v1`;
const EX6 = `${MIRROR}/20260922-expanse-v6`;
const EX5 = `${MIRROR}/20260922-expanse-v5`;
const EX4 = `${MIRROR}/20260922-expanse-v4`;
const G0 = `${MIRROR}/20260921-calibration-v1`;
const V11 = `${MIRROR}/20260921-azeroth-v11`;
const V5 = `${MIRROR}/20260830-azeroth-v5-blender`;
const V4 = `${MIRROR}/20260829-azeroth-v4`;
const V3 = `${MIRROR}/20260829-azeroth-v3`;
const V2 = `${MIRROR}/20260828-azeroth-v2`;
const V1 = `${MIRROR}/20260828-azeroth-v1`;
const TF5 = `${MIRROR}/20260826-thoughtform-v5`;
const TF4 = `${MIRROR}/20260826-thoughtform-v4`;

export const GALLERY_RUNS: readonly GalleryRun[] = [
  {
    id: "pg-v1",
    wave: "20260922-pokemon-go-v1",
    title: "2016 v1 — the trainer, drawn as a cel, graded gold",
    date: "2026-09-22",
    status: "SHIPPING",
    adr: "ADR-082 U33",
    summary: [
      'Owner: "a Pokémon-style version of myself, similar to Ash Ketchum with a hat, but … with my facial features" — anime, like the show, his call. No show, character or studio is named in the lock; the costume is lettered by its parts, and his face and boots are the only references.',
      "⚠ HE STANDS ON MAGENTA. The blue key reads a navy vest through at α 0.27 and jeans at 0.78; magenta's key (min(R,B) − G) leaves every colour he wears opaque, and it cut all six plates whole.",
      "⚠ A CEL GRADES HOT. Even drawn in a deep palette, at the lowest exposure the chain allows (×0.85) the deep interior's p75 is 112.8 — inside the Architect's band — but 15.3 % of it sits above 200 against his 4 %: flat skin on bare forearms and the cap's white panel. Reported, not re-lit.",
      "Plate 2 (the brows, the hooded eyes, the beard thinning at the cheeks, the ball at his chest); the sheet's face finder took the CAP on three of six, so the heads were cut by hand. Veo refused the first idle on its SOUNDTRACK (uncharged); the retry directs the sound as near-silence. A ping-pong, 382 frames.",
    ],
    assets: [
      {
        id: "pg-v1-idle",
        kind: "video",
        src: `${PG1}/out/holo-idle-pokemon-go-v1.mp4`,
        alphaSrc: `${PG1}/out/holo-idle-pokemon-go-v1.webm`,
        label: "v1 · the trainer's idle (live on the site)",
        note: "Ping-pong of one take: the brim hand holds, the ball turns in his fingers, the grin warms. No `.mov`.",
        mb: 0.43,
      },
      {
        id: "pg-v1-plates",
        kind: "sheet",
        src: `${PG1}/plates-and-gold.jpg`,
        label: "the six plates on magenta, each beside its gold preview",
        note: "Graded at the exposure that ships (×0.85). Plate 2 used.",
        wide: true,
      },
      {
        id: "pg-v1-heads",
        kind: "sheet",
        src: `${PG1}/heads.jpg`,
        label: "the heads, cut by hand, beside his reference",
        note: "The blind sheet's skin-blob finder landed on the cap for three plates; these crops are what the pick was made on.",
        wide: true,
      },
      {
        id: "pg-v1-strip",
        kind: "sheet",
        src: `${PG1}/strip-idle.jpg`,
        label: "the idle, twelve frames across 8 s",
        note: "The pose holds for the whole take; the drawing does not boil.",
        wide: true,
      },
    ],
  },
  {
    id: "ex-v4",
    wave: "20260922-expanse-v6",
    title: "The Expanse v4 — the commander, standing, points into the distance",
    date: "2026-09-22",
    status: "SHIPPING",
    adr: "ADR-082 U34",
    summary: [
      "Owner: \"if I'm the campaign commander … more like a general or commander, maybe holding my gun but then pointing in the distance, giving commands. Make it subtle … Maybe I shouldn't be kneeling.\" A pose EDIT of v2/v3's plate F (his likeness and the rifle he approved): he stands, the rifle low in one hand, the other arm pointing, foreshortened so the hand stays inside the column.",
      '⚠ THE FIRST PLATE HAD HIM MID-WORD, AND VEO GAVE HIM A VOICE. The edit allowed "closed or just parted as if giving the command"; the model drew the parted, speaking mouth, and every idle from it — five takes, whatever the prompt said about silence — was refused on the SOUNDTRACK (uncharged). A first frame outranks a sentence: a second, one-change edit closed the lips, and the idle rendered on the first try.',
      "⚠ TAKE 1 RAISED A FINGER. Told the hand \"moves forward a finger's width … and settles back\", Veo swung the forearm upright into a raised index finger at 1.25 s and held it to 4.5 s (the hand's reach fell 0.890 → 0.81). Take 2 gives the hand no motion of its own and bans the upturned finger by name; it holds the point for 7.3 s and drops the arm at f174.",
      "A PING-PONG cut at f168, inside the hold: 336 frames, 14 s. Graded ×0.85 (deep-interior p75 129, 7 % hot), seated +49px, flicker 1.33, the pointing hand 59px inside the right wall. He STANDS, so no stature: the span is his own cap-to-soles.",
    ],
    assets: [
      {
        id: "ex-v4-idle",
        kind: "video",
        src: `${EX6}/out/holo-idle-expanse-v4.mp4`,
        alphaSrc: `${EX6}/out/holo-idle-expanse-v4.webm`,
        label: "v4 · the commander, pointing, breathing (live on the site)",
        note: "Ping-pong of take 2 cut at f168. No `.mov`: Safari takes the floor for this era until a Mac cuts one from veo/graded/.",
        mb: 0.63,
      },
      {
        id: "ex-v4-strip2",
        kind: "sheet",
        src: `${EX6}/strip-take2.jpg`,
        label: "take 2, twelve frames across 8 s",
        note: "The point holds f0–f175; the last frame here (f176) is where the arm starts to drop, past the loop's turn at f168.",
        wide: true,
      },
      {
        id: "ex-v4-strip1",
        kind: "sheet",
        src: `${EX6}/strip-take1.jpg`,
        label: "take 1 (not used): the raised finger",
        note: "The hand was given a motion of its own and turned it into a gesture — the forearm upright, a finger raised, 1.25–4.5 s.",
        wide: true,
      },
      {
        id: "ex-v4-plates",
        kind: "plate",
        src: `${EX6}/plates.jpg`,
        label: "the commander plate, then its mouth closed (mouth_01 used)",
        note: "Edits of plate F: the pose, then the lips alone. mouth_02 reached the frame's right and bottom edges and was dropped.",
        wide: true,
      },
      {
        id: "ex-v4-heads",
        kind: "plate",
        src: `${EX6}/heads.jpg`,
        label: "the three heads: mid-word, then closed twice",
        note: "mouth_01 keeps the source's eyes and brow; silhouette IoU 0.998 against the plate it edits.",
        wide: true,
      },
    ],
  },
  {
    id: "ex-v3",
    wave: "20260922-expanse-v5",
    title: "The Expanse v3 — he scouts, then aims",
    date: "2026-09-22",
    status: "SUPERSEDED",
    adr: "ADR-082 U33",
    summary: [
      "Owner: v2 \"is just sighing and breathing as if he's having anxiety … I really want a pose where he looks around, turns his head like he's scouting, and then takes his gun to aim.\" The same plate as v2 (his likeness, the futuristic rifle), animated as a SCENE: he listens at the earpiece, scouts left and right, takes the front grip, swings the rifle down and holds the aim.",
      "⚠ TAKE 1 AIMED OFF THE FRAME. Asked in words to aim past the camera, Veo swung the rifle out level to the right and the barrel ran off the edge for ~2.7 s. So the aim was DRAWN first as a still (three edits; aim_03 is no wider than the kneel, 63–72px inside both walls) and take 2 runs from the plate TO that still.",
      "⚠ VEO MORPHS INTO A DRAWN LAST FRAME. From f171 the front glove shifts and a skin-coloured patch appears as the model lands on the still (motion jumps 0.2 → 2.2). The aim is already held and clean f144–f170, so the loop is a PING-PONG cut at f160: both turns fall on still frames, 320 frames, 13.3 s.",
      "Graded like v2 (×0.85, deep-interior p75 108.6, 3.1 % hot), seated +54px, stature 1.0074 unchanged — same plate, same scale. Flicker reads 6.64 over the clip, but that is the SWING (10.2); the three holds read 2.1–3.1 against v2's idle at 2.47.",
    ],
    assets: [
      {
        id: "ex-v3-idle",
        kind: "video",
        src: `${EX5}/out/holo-idle-expanse-v3.mp4`,
        alphaSrc: `${EX5}/out/holo-idle-expanse-v3.webm`,
        label: "v3 · the scene: listen, scout, aim",
        note: "Ping-pong of take 2 cut at f160. No `.mov`: Safari takes the floor for this era until a Mac cuts one from veo/graded/.",
        mb: 1.29,
      },
      {
        id: "ex-v3-strip2",
        kind: "sheet",
        src: `${EX5}/strip-take2.jpg`,
        label: "take 2, twelve frames across 8 s",
        note: "f0–f52 listening and scouting, f69–f119 the grip and the swing, f122 onward the held aim; the loop turns at f160.",
        wide: true,
      },
      {
        id: "ex-v3-strip1",
        kind: "sheet",
        src: `${EX5}/strip-take1.jpg`,
        label: "take 1 (not used): the aim runs off the right edge",
        note: "The same scene asked in words alone; f104–f156 the barrel crosses the frame edge.",
        wide: true,
      },
      {
        id: "ex-v3-aims",
        kind: "sheet",
        src: `${EX5}/aim-stills.jpg`,
        label: "the rest plate and the three drawn aims (aim_03 used)",
        note: "Edits of the plate: the pose above the waist changes, the knee, boot and scale do not.",
        wide: true,
      },
    ],
  },
  {
    id: "ex-v2",
    wave: "20260922-expanse-v4",
    title: "The Expanse v2 — on one knee, drawn in colour, graded gold",
    date: "2026-09-22",
    status: "SUPERSEDED",
    adr: "ADR-082 U32",
    summary: [
      'THE FIRST FIGURE MADE THE TWO-STEP WAY. Plate F of `20260921-expanse-v3` (his likeness held; three of six plates lost it), its rifle alone EDITED futuristic (owner: "only the gun needs to look more futuristic"), a Veo idle, then `post.py --matte ground`: the blue keyed out, the edge un-mixed, the Architect\'s curve and bloom per frame, one exposure scalar (×0.85 → deep-interior p75 109, his band).',
      '⚠ TAKE 1 DROPPED THE HAND. Told the hand at the earpiece "stays still" at the END of the prompt, Veo lowered it and lifted his head inside two seconds, then held THAT — a calmer pose, and a loop that can never close. Take 2 states the hold FIRST and bans the moves by name, and it held.',
      "⚠ A SUBTLE IDLE NEVER RETURNS TO ITS FIRST FRAME (0.3/255 a frame, 2.0 from frame zero at the end), so it loops as a PING-PONG — forward then back, 382 frames, no seam and no cross-fade ghosting. And Veo letterboxed the 0.558 plate with 2–3px of black that a ground key reads as figure: the outer 4px are repainted with the ground first.",
      "He kneels, so the site reads his STATURE (1.0074, measured off crown→beard against the Architect's) and he paints at the Architect's own body scale; the phone seats his standing head, not the muzzle.",
    ],
    assets: [
      {
        id: "ex-v2-idle",
        kind: "video",
        src: `${EX4}/out/holo-idle-expanse-v2.mp4`,
        alphaSrc: `${EX4}/out/holo-idle-expanse-v2.webm`,
        label: "v2 · the kneel, rifle upright, hand at the earpiece (live on the site)",
        note: "Ping-pong of take 2. No `.mov`: HEVC alpha needs macOS, so Safari takes the floor for this era until a Mac cuts one from veo/graded/.",
        mb: 0.89,
      },
      {
        id: "ex-v2-still",
        kind: "still",
        src: `${EX4}/out/holo-still-expanse-v2.jpg`,
        alphaSrc: `${EX4}/out/holo-still-expanse-v2.webp`,
        label: "poster",
        note: "headY 0.100 (the muzzle) / footY 0.9953 · stature 1.0074 · head marks crown 0.1836, beard 0.340.",
      },
      {
        id: "ex-v4-sheet",
        kind: "sheet",
        src: `${EX4}/sheet.jpg`,
        label: "the three rifle edits (A shipped)",
        note: "⚠ The face zooms are WRONG here — the sheet's skin-colour face finder locked onto the brick-red foregrip. The likeness was checked on hand-cut crops.",
      },
    ],
  },
  {
    id: "g0-gold",
    wave: "20260921-calibration-v1",
    title: "G0 — the Architect's gold: drawn by the model, or graded?",
    date: "2026-09-21",
    status: "AWAITING",
    adr: "ADR-082 U31",
    summary: [
      "THE QUESTION. The pair below is the Architect twice, from the same photograph at the same scale. One is the image model's own gold restyle of it — the frame that ships as the Architect. The other is that photograph run through `gold.py`: a tone curve, a gold ramp and a highlight-weighted bloom, fitted to that pair once and frozen as numbers. Which is which, and would you take either as the Architect's look? ⚠ The answer key is not mirrored to this page.",
      'WHY IT IS ASKED. Latent Land and The Expanse were drawn in ONE step ("a volumetric hologram") and read hot beside him: deep-interior p75 luma 172 (genai-v2) and 170 (expanse-v1) against the Architect\'s ~91–103. The cause is the key, not the prompt — a luma key needs black cloth over-lit to survive it, and over-lit black cloth IS the glow. If the grade passes, the new figures are drawn in full colour on a flat blue ground, where a likeness can be judged, and made gold by arithmetic.',
      "MEASURED. Held out on a 32px checkerboard the grade reproduces the model's frame to 9.3/255 a pixel; the model re-drawing that same frame disagrees with ITSELF by 19.6. ⚠ An average is not a verdict: the two are not identical, and they differ most at the CONTOUR (one carries a brighter rim down the sleeves, the other a softer halo round the face and hands) and in how far the jacket's folds are lifted. Those are the places to look.",
      "THE DRY RUN, FREE. His own photograph keyed onto the plate ground stands in for a model plate, to prove the plate stage end to end: ground off 0 (σ 1.7), spill 0, p50 26, 25.9 % of the figure under luma 16 — his own source sits at 26 %, which is why that gate is 30 % and not a round number that fails the reference — and a gold preview at p75 88.2 with 4.2 % above 200, inside his band (p75 80–130, ≤12 %).",
      "Nothing has been spent. Six colour plates per era (~$0.80 each era) wait on this answer.",
    ],
    assets: [
      {
        id: "g0-pair",
        kind: "sheet",
        src: `${G0}/g0-blind-pair.png`,
        label: "the blind pair · A | B",
        note: "Same photograph, same scale, pure black. One is the model's restyle that ships as the Architect; the other is the deterministic grade. Judge on the contour and the jacket.",
        mb: 1.25,
        wide: true,
      },
      {
        id: "g0-plate",
        kind: "plate",
        src: `${G0}/plates/plate-architect-synthetic.png`,
        label: "dry-run plate · his photograph on the key ground",
        note: "Not a model draw: the Architect's own photograph, keyed and laid on flat #0A28D2 to stand in for one. This is what a plate IS — full colour, a flat ground under the boots, no shadow, nothing lit for the key.",
      },
      {
        id: "g0-gold",
        kind: "still",
        src: `${G0}/gold/plate-architect-synthetic.gold-on-black.jpg`,
        alphaSrc: `${G0}/gold/plate-architect-synthetic.gold.png`,
        label: "its gold preview",
        note: "gold.py on that plate: key the ground, un-mix the edge, grade, bloom — free, and written for every plate so a pick is never made on colour alone. p75 88.2 · 4.2 % above 200.",
      },
      {
        id: "g0-sheet",
        kind: "sheet",
        src: `${G0}/sheet.jpg`,
        label: "the pick sheet · the form G1 comes back in",
        note: "Each era's six plates return like this: plate · gold preview · the face at the same face height as his reference, lettered blind.",
      },
    ],
  },
  {
    id: "az-v11",
    wave: "20260921-azeroth-v11",
    title: "Azeroth v11 — v10, whole and seated",
    date: "2026-09-21",
    status: "SHIPPING",
    adr: "ADR-082 U31",
    summary: [
      'THE SAME 240 FRAMES AS v10, MOVED DOWN 33 ROWS. Owner: "some parts are falling off" — and he stood above his disc. Neither fault was in the pixels. The wrap clipped its media to its own box and masked it with a radial vignette, and Azeroth is the one era whose fit is 1: at the stage\'s 1.16 overscan his 533.6px picture sat in a 460px wrap and lost ~27px of pauldron a side. The clip now opens to the media box, and the mask comes off on the alpha branch at ≥1101px.',
      "AND HE STOOD 23.6px ABOVE HIS DISC (footY 0.9695). The 33 rows taken off the top were asserted EMPTY (max alpha 0 on all 240 frames) before the shift, so nothing of him is lost. ⚠ headY 0.261 / footY 0.9953 are v10's own anchors + 0.0258, authored TOGETHER — measured and rounded separately they give a span that makes the floor era's fit 0.99986, not 1.",
    ],
    assets: [
      {
        id: "az-v11-idle",
        kind: "video",
        src: `${V11}/out/holo-idle-azeroth-v11.mp4`,
        alphaSrc: `${V11}/out/holo-idle-azeroth-v11.webm`,
        label: "v11 · v10 re-seated (live on the site)",
        note: "Same CRF as v10, same figure, 33 rows lower: his boots now stand on the frame's floor, where the stage draws his disc. ⚠ The pauldron crop was never in this file — it was the stage's clip, and it is fixed in CSS, so v10 would show whole on today's stage too.",
        mb: 3.28,
      },
      {
        id: "az-v11-still",
        kind: "still",
        src: `${V11}/out/holo-still-azeroth-v11.jpg`,
        alphaSrc: `${V11}/out/holo-still-azeroth-v11.webp`,
        label: "poster",
        note: "headY 0.261 / footY 0.9953.",
      },
    ],
  },
  {
    id: "az-v10",
    wave: "20260830-azeroth-v5-blender",
    title: "Azeroth v10 — he asks, he explains, he settles",
    date: "2026-08-31",
    status: "SUPERSEDED",
    adr: "ADR-082 U18",
    summary: [
      "⚠ ONE WAVE, SEVEN CUTS. v10 was live until v11 re-seated it (2026-09-21, the card above); v9, v8, v7 and v6 are what it came from, and the card below holds the wave's first cut and the companion-free control. This page is for comparison, not for a changelog — a card per version would say less than two that each carry their own findings.",
      "v10 IS A CHAIN OF THREE OF THE MODEL'S OWN EMOTES — EmoteTalkQuestion → EmoteTalk → EmoteTalkSubdued, back to back on one NLA track (owner). ⚠ THE JUNCTIONS COST NOTHING, AND HOW WoW AUTHORS A CYCLE IS WHY: an emote's last frame duplicates its first, and all three talk emotes start and end on the same neutral stand — so laying each strip's START on the previous strip's END overwrites that duplicate with an identical pose. No crossfade, which would smear the hands mid-gesture. And the periods add to 43.2 + 48.0 + 148.8 = 240.0 frames exactly, i.e. ten seconds on the nose.",
      "⚠ THE PRICE IS SCALE, AND IT IS ARITHMETIC RATHER THAN COMPOSITION. The frame is WIDTH-bound and the fit takes the widest pose in the whole loop, so the 0.5625 slot then decides the height — reach costs size. Measured per emote: 1.400 m in Subdued (all pauldron), 1.446 m in Question, 1.549 m in EmoteTalk where the gauntlet swings out. That one emote widens him 10.6 % and stands him 8 % shorter in the slot; headY goes 0.159 → 0.235 and footY does not move, so the surplus is all above his head and the projector disc is where it was. Put v10 beside v9 to see exactly what the fuller gesture costs.",
      "THE WAIST PIECE IS OFF THE FIGURE (owner: the belt's glow is distracting). Its buckle carries the set's fel orb, which even under the v6 fel cap was the brightest single object on the man — a hologram whose loudest feature is a belt buckle is pointing at the wrong thing. ⚠ The BODY's own belt geoset stays: it never glowed, and dropping it too would cut a notch in the robe where the item used to sit.",
      '⚠ AND THE FRAME GUARD WAS MEASURING THE SET INSTEAD OF THE OBJECTS. v9 reported a placid "1.3 % of vertices outside" and filed it as an allowable cropping tail while the owner could see one imp\'s arm running off the LEFT edge — because the share was POOLED across the company. An aggregate over independently-placed objects cannot name the offender or the side. It reports per companion now, with the edge it crosses and by how much, over five samples of the loop rather than two.',
      "v9 IS v8 WITH THE CLASS TAKEN BACK OUT (owner). What v8 got right survives: the imps come out of the middle and stand at his shoulders facing the way HE faces — with him, not watching him. What it got wrong was scale, and it was predicted in v8's own note: three children at ~150px each read as a huddle rather than as a class. ⚠ THE SPACE IS WORTH MORE EMPTY than filled with figures too small to be read as what they are. The `--kids` machinery stays in the script — it works, and the question may come back — only the call site is shorter.",
      "v8 FOR THE RECORD: three children seated in front facing him, backs to the reader — the shape a room takes when someone is teaching in it. ⚠ They needed their OWN dim, and skin is why: an imp's hide is dark and lands low on the gold ramp, a child's skin is pale and lands high, so at the flankers' 0.62 the class measured mean-luminance 146 against the figure's 138 — scenery outshining the subject in the third of the frame nearest the reader. 0.42 put him back on top at 124 against 138.",
      "⚠ THE CHILDREN NEEDED THEIR OWN DIM, AND SKIN IS WHY. An imp's hide is dark and lands low on the gold ramp; a child's skin is pale and lands high, so at the flankers' 0.62 the seated class measured mean-luminance 146 against the figure's 138 — the scenery was brighter than the subject, in the third of the frame nearest the reader. At 0.42 the class reads 124 against his 138 and he is the brightest thing again. One dim for two very different materials was the wrong shape of knob.",
      '⚠ AND THE VARIATION IS A FIXED TABLE, NOT A RANDOM. "They shouldn\'t feel like copy paste" is a real requirement, but `random` is the wrong tool for it — a re-render has to reproduce the delivered frames exactly. Seven authored offsets (position, yaw, scale) cycled by index, plus alternating `WASit01`/`WASit02` between neighbouring children, because a repeated pose is loudest in MOTION rather than in a still.',
      "Two owner notes on v5, both about things that were shouting. THE FEL MASK IS CAPPED at 0.42, so green is a TINT ON the gold rather than a replacement for it. ⚠ Raising the mask's bias instead does not work and the reason is worth keeping: those texels really are fel in the source, so a bias only nibbles the patch's edge while its middle stays full-strength neon. What reads as loud is the mix reaching 1.0. Measured after: the belt's brightest pixel is [251,205,117] — gold, and not clipping.",
      'AND v7 STANDS THEM OFF HIM (owner: "spread them a bit so they\'re less close to me"). The arc goes 0.30 × 0.47 → 0.42 × 0.525 and the imps shrink to 0.44 / 0.72 / 0.50 to pay for it — ⚠ the frame is WIDTH-BOUND by the pauldrons, so lateral room is not free: every centimetre the flankers move out has to come off their own width or it leaves the frame. The gap between his leg and the nearest imp goes from ~5 cm to ~17 cm, which is the difference between demons leaning on him and demons attending him.',
      "THE COMPANIONS ARE A COURT, NOT A PAIR: three different species at three sizes on a shallow arc IN FRONT of the figure, each turned to face him so the frame shows their backs. ⚠ Three, because four is soup — these models are about as wide as they are tall in their Stand pose, so four at 0.5–0.9 m is ~2.8 m of imp across a 1.44 m frame, and translucent bodies then interleave into a tangle of limbs. Count was the lever; angles and sizes were not.",
      "⚠ THREE OF THE SEVEN IMP DISPLAYS ARE UNUSABLE — Diabolic, Empowered and Imp Lord carry a body texture that is effectively black, so an emissive luminance ramp draws horns and hands and nothing in between. `imp-sheet.py` renders every candidate alone, framed to its own height, which is how to see that in one look instead of composing blind.",
      "⚠ AND THE ARC IS AN ELLIPSE — WIDE AND SHALLOW — BECAUSE OF PERSPECTIVE. A companion forward of the figure is closer to the lens, so the same floor projects LOWER: at 0.6 m forward the magnification is 1.125, which takes a foot line from v 0.97 to 1.03 — off the bottom edge, and off the projector disc the site draws at the figure's own foot line. Reaching sideways is free; reaching forward is not.",
      "⚠ THE COMPANIONS ALSO BURN AT 0.62x THE FIGURE'S EMISSION. Their horns and claws are the palest texels in any imp atlas and clipped to white at his exposure — and a hologram whose scenery is as luminous as its subject has no subject. The dim is applied by SET DIFFERENCE (materials the imps use and he does not), so it can never reach him.",
    ],
    assets: [
      {
        id: "az-v10-idle",
        kind: "video",
        src: `${V5}/holo-idle-azeroth-v10.mp4`,
        alphaSrc: `${V5}/holo-idle-azeroth-v10.webm`,
        label: "v10 · the three-emote chain, no belt (superseded by v11)",
        note: "Question → Talk → Subdued in one 10.0s loop, the waist item removed, and the left imp trimmed 0.58 → 0.55 m and pulled in. ⚠ 3.28 MB against v9's 2.22 — the asset is 61 % longer at the same CRF, so it is 0.33 MB/s against v9's 0.37: cheaper per second, dearer per file.",
        mb: 3.28,
      },
      {
        id: "az-v9-idle",
        kind: "video",
        src: `${V5}/holo-idle-azeroth-v9.mp4`,
        alphaSrc: `${V5}/holo-idle-azeroth-v9.webm`,
        label: "v9 · one emote, belt on (superseded)",
        note: "EmoteTalkSubdued alone, 6.21s. The comparison that matters: the man is 8 % TALLER in this frame, because his widest pose here is only the pauldrons. Also the last cut with the fel belt buckle on him.",
        mb: 2.22,
      },
      {
        id: "az-v8-idle",
        kind: "video",
        src: `${V5}/holo-idle-azeroth-v8.mp4`,
        alphaSrc: `${V5}/holo-idle-azeroth-v8.webm`,
        label: "v8 · the seated class (superseded)",
        note: "The same flankers plus Attentive Child, Human Orphan and Neighborhood Child seated in front on WASit01/WASit02, facing him.",
        mb: 2.33,
      },
      {
        id: "az-v7-idle",
        kind: "video",
        src: `${V5}/holo-idle-azeroth-v7.mp4`,
        alphaSrc: `${V5}/holo-idle-azeroth-v7.webm`,
        label: "v7 · the spread imp arc (superseded)",
        note: "Fiendish 0.44m · Corefire 0.72m · Imp 0.50m on a 150° arc, 0.42 deep by 0.525 wide — the last of the three imp cuts, and the one v8 replaced.",
      },
      {
        id: "az-v6-idle",
        kind: "video",
        src: `${V5}/holo-idle-azeroth-v6.mp4`,
        alphaSrc: `${V5}/holo-idle-azeroth-v6.webm`,
        label: "v6 · the tight arc (superseded)",
        note: "The same three species at 0.50 / 0.80 / 0.58 on a 0.30 × 0.47 arc — close enough to his legs that they read as one mass at page scale. Put it beside v7 to see what 12 cm of arc buys.",
        mb: 2.33,
      },
      {
        id: "az-v10-still",
        kind: "still",
        src: `${V5}/holo-still-azeroth-v10.jpg`,
        alphaSrc: `${V5}/holo-still-azeroth-v10.webp`,
        label: "poster",
        note: "headY 0.2352 / footY 0.9695. ⚠ Measured on the FIGURE-ONLY render — read off the delivered composite instead, footY comes back 0.9719 off the imps' claws and the projector disc seats low. The tell is the SPREAD: his boots do not move (foot row 1241 on all 240 frames), the companions' do.",
      },
    ],
  },
  {
    id: "az-v5",
    wave: "20260830-azeroth-v5-blender",
    title: "Azeroth v5 — the wave's first cut, and the control",
    date: "2026-08-30",
    status: "SUPERSEDED",
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
        label: "idle loop, the mirrored pair (superseded by v6)",
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
