import type { ArcDef } from "../types";

import { HAND_IT_TO_AN_AGENT } from "./shared/handItToAnAgent";
import { THREE_WAYS_LOOP } from "./shared/threeWaysLoop";
import { whatFollows } from "./shared/whatFollows";
import { HARD_TO_STEER_BEAT, REAL_QUESTION_BEAT, THE_CURVE_BEAT } from "./shared/workshopFraming";

/**
 * The Thoughtform workshop, THIRD HOUSE CUT (ADR-143): the template the
 * owner's next presentations are cut from, first for Suri in London.
 *
 * The AP lecture's spine (ADR-141) without its worlds: the same corridor, the
 * same About, the same era stage, the same Loop proof pile, and the same
 * situation, read by reference. Tom on the Moon and In The Pocket's wall are
 * gone (owner, 2026-10-03: "start from one prompt to a 10-second ad"), so the
 * worked example IS Prompt to Loop, the owner's breakdown of one motion ad,
 * rendered by the route around these sections. It runs to its cost slide;
 * this record's economics chapter answers that slide; then "Now it's a
 * skill. Just ask." and Laura's own test close the proof.
 *
 * ⚠ THE ECONOMICS ARE HIS NOTE'S, NOT A MODEL OF THEM. The chapter is the
 * Wispr note "Thoughtform Arc structure" (2026-10-03) in his words: creative
 * variety under Meta's Andromeda, ads tested small and scaled, a week of
 * craft that never pays back, headcount that cannot follow; volume against
 * taste; the team writing the layer the agents run inside. No figure on it
 * is invented: the $27 is the breakdown's own bill, the €50 his test budget,
 * the hours Laura's.
 *
 * ⚠ LAURA'S BEAT IS HER SLACK MESSAGE, MADE CONCISE (owner, 2026-10-03: "good
 * for the record"). First name only, the colleagues she mentioned are not on
 * the page, and the tip is her own sentence.
 *
 * ⚠ THE NUMBERS COUNT THIS RECORD'S SECTIONS ONLY, as the AP lecture's do;
 * the breakdown's slides carry their own step numbers.
 */
export const THOUGHTFORM_WORKSHOP_V3_ARC: ArcDef = {
  slug: "thoughtform-workshop-v3",
  leaf: "workshop-v3",
  format: "workshop",
  /* No `client` (a house format), no `theme` (it reads in both), no `motion`
     (reveal is the default), no `worked` anywhere. */
  status: "running",
  date: "2026-10-03",
  cardTitle: "The Thoughtform workshop · V3",
  cardLede:
    "The story, then one motion ad an agent made from a single prompt, and what that changes for a creative team.",
  cardImage: { src: "/images/services/workshop.webp", alt: "" },
  hero: {
    eyebrow: "Thoughtform · Workshop",
    title: { pre: "One prompt,", em: "a ten-second ad." },
    lede: "How an agent made a motion ad for about $27, and why the team that keeps its taste matters more than ever.",
    actions: [
      { id: "start", label: "The workshop", href: "#the-workshop", primary: true },
      { id: "economics", label: "The economics", href: "#the-money" },
    ],
    image: {
      src: "/images/Thoughtform_Key%20Visual_14d.webp",
      alt: "",
      width: 2400,
      height: 1350,
    },
    plate: "gateway",
    curtain: true,
  },
  meta: {
    title: "The Thoughtform workshop · V3",
    description:
      "How AI went from a prompt to an agent, one motion ad made end to end, and what it changes for a creative team.",
  },
  sections: [
    /* ── Chapter one · THE WORKSHOP ─────────────────────────────────────── */
    HAND_IT_TO_AN_AGENT,

    /* ── Chapter two · THE SITUATION ───────────────────────────────────────
       v2's stages (Loop's own examples) and the AP lecture's three middle
       beats, all by reference. The breakdown follows the real question. */
    THREE_WAYS_LOOP,
    THE_CURVE_BEAT,
    HARD_TO_STEER_BEAT,
    REAL_QUESTION_BEAT,

    /* ── (the route renders Prompt to Loop here, from its first slide to its
       cost slide) ── */

    /* ── Chapter three · THE ECONOMICS ─────────────────────────────────── */
    {
      /* A beat: no picture. It answers the cost slide directly above it. */
      id: "the-money",
      kind: "interstitial",
      variant: "question",
      menuLabel: "The economics",
      menuPrimary: true,
      eyebrow: "06 · The bill",
      line: { pre: "About $27 and an evening.", em: "Is it just about the money?" },
      subline:
        "The bill is the headline, but the bigger change is that this ad would not have existed: a week of stop-motion never paid back on an ad that might only run as a test.",
    },
    {
      /* Four cards, never three: `.arc-cards` collapses to two columns at
         1280px, where three would land two and one with a hole. Titles of
         two lines and bodies of two, no kicker: at 1280×720 the format's own
         air is 100px a side, and a 2 × 2 grid fits one screen only that way. */
      id: "the-economics",
      kind: "cards",
      menuLabel: "Variety",
      columns: 4,
      head: {
        eyebrow: "07 · The economics",
        title: { pre: "More variety", em: "than a team can hire for." },
        sub: "Meta's Andromeda matches ads to people by their creative, so an account needs many genuinely different ads, and you rarely know in advance which one will work.",
      },
      cards: [
        {
          id: "variety",
          title: "Every angle wants its own ad",
          body: "The algorithm rewards variety, and you rarely know which ad will land, so you keep making new ones.",
        },
        {
          id: "test",
          title: "Tested small, scaled if it works",
          body: "Ads are often tested on €50 or a few hundred. With some luck, a simple one returns its spend many times over.",
        },
        {
          id: "return",
          title: "A week of craft does not pay back",
          body: "Brands weigh an ad's return against what it cost to make. A week of stop-motion fails that, even where craft is loved.",
        },
        {
          id: "headcount",
          title: "Output grows faster than hiring",
          body: "Nobody wants to pay creatives less, but paid social asks for more than any studio can staff.",
        },
      ],
    },
    {
      /* A beat: no picture. */
      id: "volume-and-taste",
      kind: "interstitial",
      variant: "callout",
      eyebrow: "08 · Volume and taste",
      line: { pre: "AI solves the volume.", em: "Who keeps the taste current?" },
      subline:
        "Slop is easy at scale, and customers notice. And taste does not stay encoded: when every feed went Ghibli, the look was worth nothing within days. Keeping it current is the creative team's work, which makes them more important than ever.",
    },
    {
      id: "the-team",
      kind: "cards",
      menuLabel: "The team",
      columns: 4,
      head: {
        eyebrow: "09 · What changes for the team",
        title: { pre: "Agents run on", em: "the team's taste." },
        sub: "The team writes what good looks like and keeps it current. The agents take the longer tasks in parallel, under the team's supervision, without anyone babysitting them.",
      },
      cards: [
        {
          id: "layer",
          title: "Taste, written down",
          body: "The team puts what good looks like into the skill and its checks, and updates it as trends move.",
        },
        {
          id: "everyday",
          title: "Agents carry the volume",
          body: "The paid social that pays the bills runs on that layer, with five agents working an hour in parallel.",
        },
        {
          id: "upstream",
          title: "The team moves up",
          body: "The time goes to bigger campaigns, partnerships and the pieces people still love to make by hand.",
        },
        {
          id: "pace",
          title: "Set with the business",
          body: "More agents than you can follow costs focus, so how far to take it is agreed with the business.",
        },
      ],
    },

    /* ── (the route renders the breakdown's last slide here: "Now it's a
       skill. Just ask.") ── */

    /* ── Chapter four · IN OTHER HANDS ────────────────────────────────── */
    {
      /* Laura's Slack message (2026-10-02), made concise: the table is hers,
         the last row is the total row on purpose, the tip is her sentence. */
      id: "in-other-hands",
      kind: "cards",
      menuLabel: "In other hands",
      menuPrimary: true,
      head: {
        eyebrow: "10 · In other hands",
        title: { pre: "Laura gave Vesper", em: "the hardest variant of her own brief." },
        sub: "Laura is head of design at Loop. A week earlier she had made all four variants of this brief by hand; the day she tried Vesper, she wrote the team this comparison.",
      },
      ledger: { columns: ["When", "The work", "Time"] },
      cards: [
        {
          id: "june",
          kicker: "June",
          title: "Over a week",
          body: "A 30-second animated ad, made by hand. It never launched.",
        },
        {
          id: "september",
          kicker: "September",
          title: "About 16 hours",
          body: "One brief, four very different variants: script, storyboard, lip-sync.",
        },
        {
          id: "hardest",
          kicker: "September",
          title: "4 to 5 hours",
          body: "The hardest of the four, on its own.",
        },
        {
          id: "vesper",
          kicker: "October",
          title: "15 minutes",
          body: "The same variant, made by Vesper.",
        },
      ],
      tips: [
        {
          id: "laura",
          tag: "Laura · Head of design, Loop",
          body: "Not perfect, but come on… so impressive.",
        },
      ],
    },

    /* ── Chapter five · WHAT FOLLOWS ──────────────────────────────────── */
    whatFollows("11 · What follows"),
  ],
};
