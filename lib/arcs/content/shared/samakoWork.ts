import type { ArcBreakdown } from "../../types";

/**
 * SAMAKO'S WORK, AS BREAKDOWNS (2026-10-08): two jobs from the Samako
 * engagement, in the case grammar `UNDER_THE_GLASS` set (ADR-148 U5), cut
 * to two or three beats so a reader sees what was made and how it was
 * judged, not the recipe. The services workstreams read them whole; the
 * X-Bionic proposal's jobs (`jobs.ts`, ADR-153 U1) take their film and
 * stills.
 *
 * ⚠ EVERY NUMBER IS SAMAKO'S RECORD: `samako-ai-studio/records/eval-log.md`
 * (wave 11 and its race, 7 October; Autumn Deals 02, 6 October) and the
 * `autumn-02` README on the production Drive. The reviewer's own read of
 * wave 11 is filed since 8 October (14 of the 15 frames the reviewer
 * pinned agree with the blind grade): the review job carries it, these
 * beats do not.
 *
 * ⚠ PEOPLE BY ROLE, NEVER BY NAME, and no figure from an offer the client
 * has not approved: the film is the clean cut, "Tijdelijke actie", no
 * percentage and no end date.
 */
const SAM = "/arcs/samako";

export const SAMAKO_PRODUCT_SHOTS: ArcBreakdown = {
  eyebrow: "Production · Samako · product shots · 7 Oct 2026",
  title: { pre: "The product, drawn right", em: "15 times out of 18." },
  sub: "Samako makes vacuum cleaners in the Netherlands. Every AI frame is read against the real product before anyone sees it: its parts, its colour, its wordmark, the light on the floor head.",
  page: {
    src: `${SAM}/shots-sheet.webp`,
    alt: "Every frame gpt-image-2 drew of the CleanDetect Pro in the round: three packshots, the machine in use, and the machine standing in five rooms.",
    label: "gpt-image-2 · the round's frames",
    ratio: "scroll",
  },
  facts: [
    { label: "Frames", value: "18 shots, on 3 models" },
    { label: "Read", value: "Blind to the model" },
    { label: "Best model", value: "15 of 18 right" },
    { label: "Runs in", value: "Samako's own Claude" },
  ],
  beats: [
    {
      id: "sam-shots-bar",
      key: "The bar",
      title: { pre: "Read against the real product,", em: "before a person looks." },
      line: "The checks come from the product itself: how many parts, which colour, where the wordmark sits and what it says, which light is lit. A frame that fails one goes back with the reason named.",
      frames: [
        {
          src: `${SAM}/shot-hero-kept.webp`,
          alt: "The CleanDetect Pro packshot on a cream ground, every part and the green floor-head light correct.",
          label: "Every check holds",
          ratio: "1:1",
          verdict: "kept",
        },
        {
          src: `${SAM}/shot-hero-sent-back.webp`,
          alt: "The same packshot from another model, with an invented string of letters where the wordmark belongs.",
          label: "The wordmark re-lettered",
          ratio: "1:1",
          verdict: "rejected",
        },
      ],
    },
    {
      id: "sam-shots-rooms",
      key: "A new room",
      title: { pre: "It holds in a room", em: "it was never tuned on." },
      line: "The recipe was written on three rooms. A fourth, held back while tuning, came out right three times out of three on the best model, so the next shoot does not start from zero.",
      frames: [
        {
          src: `${SAM}/shot-evening-kept.webp`,
          alt: "The vacuum cleaner leaning against a hallway wall in warm evening lamplight.",
          label: "Evening light",
          ratio: "3:2",
          verdict: "kept",
        },
        {
          src: `${SAM}/shot-hallway-kept.webp`,
          alt: "The vacuum cleaner in an oak-panelled hallway the recipe was never tuned on.",
          label: "A room never tuned on",
          ratio: "3:2",
          verdict: "kept",
        },
        {
          src: `${SAM}/shot-hallway-sent-back.webp`,
          alt: "The same hallway from another model, with gibberish lettering on the machine's bin.",
          label: "Same room, another model",
          ratio: "3:2",
          verdict: "rejected",
        },
      ],
    },
    {
      id: "sam-shots-race",
      key: "The models",
      title: { pre: "Which model draws it,", em: "measured, not guessed." },
      line: "The same 18 shots on three models, shuffled and read blind. The result is the evidence for which model the product lane runs on; the client's own reviewer makes that call.",
      figures: [
        { label: "gpt-image-2, frames right", value: "15 / 18" },
        { label: "Nano Banana 2.1, frames right", value: "5 / 18" },
        { label: "Nano Banana Pro, frames right", value: "4 / 18" },
        { label: "Wordmarks re-lettered by gpt-image-2", value: "0" },
      ],
    },
  ],
};

export const SAMAKO_AUTUMN_FILM: ArcBreakdown = {
  eyebrow: "Strategy · Samako · Autumn Deals film · 6 Oct 2026",
  title: { pre: "From a sale brief", em: "to a 15-second story." },
  sub: "The first round was correct and flat: four statics in one formula, a film that described autumn. The second gave every frame a story. The product is the photographer's original, composited in code, never drawn.",
  film: {
    src: `${SAM}/autumn-a.mp4`,
    poster: `${SAM}/autumn-a-poster.webp`,
    alt: "Autumn walks in: the front door opens on falling leaves, a wet dog shakes on the sofa, paw prints land on a cushion, and the vacuum cleaner hops in to set it right.",
  },
  facts: [
    { label: "Length", value: "15 s, 9:16, in Dutch" },
    { label: "Scenes", value: "Kling, Veo and Seedance" },
    { label: "The product", value: "The real photograph" },
    { label: "Model cost", value: "Logged per call" },
  ],
  beats: [
    {
      id: "sam-film-brief",
      key: "The brief",
      title: { pre: "Correct is not", em: "the same as good." },
      line: "The brief left the idea open. The first answer met it and said nothing, so the second started from a story a person would stop scrolling for, and offered two.",
      rows: [
        { label: "Asked for", value: "Autumn sale ads, in Dutch, with complete creative freedom" },
        { label: "Round one", value: "Correct and flat: one formula, a film about autumn" },
        { label: "Film A", value: "Autumn walks in: a door, wellies, a wet dog, then the machine" },
        { label: "Film B", value: "The room tidies itself, then the range hops in on the beat" },
        { label: "Statics", value: "Four, each with its own layout and its own small story" },
      ],
    },
    {
      id: "sam-film-frames",
      key: "The frames",
      title: { pre: "One house,", em: "drawn once." },
      line: "The hall, the room, the dog and the person were drawn first and handed to every shot, so the film holds together. Video models make the scenes; none of them is ever given the product.",
      frames: [
        {
          src: `${SAM}/kf-a1-door.webp`,
          alt: "The front door open on a hall, autumn leaves blowing in over the rug.",
          label: "The door",
          ratio: "9:16",
        },
        {
          src: `${SAM}/kf-a3b-dog-close.webp`,
          alt: "A wet golden dog shaking itself on a pale sofa.",
          label: "The dog",
          ratio: "9:16",
        },
        {
          src: `${SAM}/kf-a4-cushion-paws.webp`,
          alt: "Muddy paw prints across a linen cushion.",
          label: "The mess",
          ratio: "9:16",
        },
        {
          src: `${SAM}/kf-a7-after.webp`,
          alt: "The living room in the evening, clean, the dog asleep on the sofa.",
          label: "After",
          ratio: "9:16",
        },
      ],
    },
    {
      id: "sam-film-cost",
      key: "The cost",
      title: { pre: "What it cost,", em: "counted per piece." },
      line: "Every model call is logged with its price, so a film's cost sits beside its results. That is the number return on ad cost creation starts from.",
      figures: [
        { label: "Model calls logged with their price", value: "All" },
        { label: "Frames where a model drew the product", value: "0" },
        { label: "Cold reads per film before it went out", value: "3" },
        { label: "Loudness, as the platforms ask", value: "−14 LUFS" },
      ],
    },
  ],
};
