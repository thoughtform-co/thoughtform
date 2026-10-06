import type { ArcDef, ArcStage } from "../types";

import { HAND_IT_TO_AN_AGENT } from "./shared/handItToAnAgent";
import { suriConfiguration } from "./shared/suriWork";
import { theLabsBet } from "./shared/marketSignal";
import { theCatch } from "./shared/workshopFraming";
import { THREE_WAYS_LOOP } from "./shared/threeWaysLoop";
import { WORKSHOP_INTRO } from "./shared/workshopIntro";
import { theHorizon } from "./shared/workshopPractice";

/**
 * SURI, THE LUNCH AND LEARN (ADR-147): the page the room sees on Monday
 * 5 October 2026 at 13:00 in London, cut from the workshop's third house cut.
 *
 * The same page as v3 down to the proof pile (the hero, the About, the eras,
 * the Arc, the four Loop cards, all read from `WORKSHOP_INTRO` by reference
 * so the owner's edits to v3's intro land here too), then a tail written for
 * Suri's own room: the situation by reference, Suri's three pieces of work
 * as the tabs (the brief, the Monday read, the statics, ONE RECORD shared
 * with the Armada companion and the configuration page), the loop and the
 * asks the kickoff page already carried, the month, what IT connects, and the
 * loop the owner made for them as the ending. No motion breakdown (owner,
 * 2026-10-04: Suri's own work as tabs, Loop's Prompt to Loop stays on v3),
 * and the finished loop itself as the last thing before the close (owner,
 * same day: "it's visual and tangible, a nice way of ending").
 *
 * ⚠ THE WORKSTREAMS ARE NAMED IN THE FRAME. The tabs are the three pieces of
 * work; the configuration's head says which workstream each one is (creative
 * strategy · creative operations · creative production), and review is what
 * the checks beats carry, so the room never reads the practice as motion
 * video alone.
 *
 * ⚠ IT IS THE CLIENT'S PAGE: it may name Kate, Nick and Adam in the frames it
 * authors, never in a shared body (the house page reads those). It prints no
 * fee, no break clause and no fleet word.
 */
/** A stage at its label and name alone (ADR-147 U7, owner: the text blocks
 *  "radically simplified"): no sentence, no Loop example. */
const nameOnly = ({ id, label, name, lit }: ArcStage): ArcStage => ({
  id,
  label,
  name,
  ...(lit ? { lit } : {}),
});

export const SURI_LUNCH_AND_LEARN_ARC: ArcDef = {
  slug: "suri-lunch-and-learn",
  leaf: "lunch-and-learn",
  format: "workshop",
  client: "suri",
  kind: "workshop",
  status: "running",
  date: "2026-10-04",
  cardTitle: "Suri · lunch and learn",
  cardLede:
    "The story, then Suri's own three pieces of work set up to run with the team at the controls, and the loop made for the room.",
  cardImage: { src: "/images/services/workshop.webp", alt: "" },
  hero: {
    eyebrow: "Thoughtform · Suri · Lunch and learn · 5 October 2026",
    title: { pre: "A new kind", em: "of intelligence." },
    lede: "What it looks like at Suri: the brief, the Monday read and the statics, run by the team.",
    actions: [
      { id: "start", label: "At Suri", href: "#the-workshop", primary: true },
      { id: "loop", label: "The loop", href: "#no-reflection" },
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
    title: "Suri · lunch and learn",
    description:
      "How AI went from a prompt to an agent, how Loop's studio came to run its own, and what that looks like at Suri this month.",
  },
  sections: [
    /* ── Chapter one · AT SURI ──────────────────────────────────────────────
       The shared board with this room's own head: after the story and the
       proof, the title says the day is about them (owner, 2026-10-04: the
       opening should connect to the client, "how this will help us"). A
       different sub keeps it out of the shared board's readers pin, as
       `WORKSHOP_INTRO.opening` does. */
    {
      ...HAND_IT_TO_AN_AGENT,
      menuLabel: "At Suri",
      head: {
        ...HAND_IT_TO_AN_AGENT.head,
        eyebrow: "01 · At Suri",
        title: { pre: "What this looks like", em: "at Suri." },
        sub: "Three pieces of your own work, set up this month so the team runs them: the brief, the Monday read, and the statics. First, how the intelligence behaves.",
      },
      // ADR-147 U1 (owner, 2026-10-05): a Thought + Form keeper in place of
      // the board, for a clean hand from the proof into the room's own part.
      // MF-01 (Midjourney 6f2a7b44, "the approved frame"); the hero is MF-04
      // and the footer MF-10, so this one is not seen twice.
      plate: {
        src: "/arcs/suri/at-suri-mf01.webp",
        alt: "A head shaped from sand inside a broken ring, rising out of a dune.",
        width: 1456,
        height: 816,
      },
    },

    /* ── Chapter two · THE SITUATION ────────────────────────────────────────
       ADR-147 U7 (owner, 2026-10-05): the stages radically simplified (each
       row its label and its name, no sentence, no Loop example), the curve
       by reference, then how we measure it, then the spectrum and the beat
       under this page's own heads. */
    {
      ...THREE_WAYS_LOOP,
      own: undefined,
      stages: [
        nameOnly(THREE_WAYS_LOOP.stages[0]),
        nameOnly(THREE_WAYS_LOOP.stages[1]),
        nameOnly(THREE_WAYS_LOOP.stages[2]),
      ],
    },
    WORKSHOP_INTRO.curve,
    {
      /* Moira's resource table (class one, v1, v2), with this room's head:
         the way into the tool and the collaborator. */
      id: "resource",
      kind: "resource",
      menuLabel: "A resource",
      head: {
        eyebrow: "04 · A strange resource",
        title: { pre: "We use it like a tool,", em: "when it's an intelligence." },
        sub: "We count it in tokens, the way we count software in seats. Tokens say how much it read and wrote, and nothing about whether the work was any good.",
      },
      columns: ["Resource", "Counted in", "What the count tells you"],
      rows: [
        { id: "people", resource: "People", unit: "Hours", tells: "How long the work took" },
        { id: "money", resource: "Money", unit: "Pounds", tells: "What the work cost" },
        { id: "software", resource: "Software", unit: "Seats", tells: "Who can use it" },
        {
          id: "intelligence",
          resource: "Intelligence",
          unit: "Tokens",
          tells: "How much the model read and wrote",
          misses: "Nothing about what it was worth, or whether it worked",
          open: true,
        },
      ],
    },
    {
      ...WORKSHOP_INTRO.steer,
      head: {
        ...WORKSHOP_INTRO.steer.head,
        eyebrow: "05 · Tool and collaborator",
        title: { pre: "AI sits between a tool", em: "and a collaborator." },
      },
    },
    theCatch("06 · The catch"),

    /* ── Chapter three · THE CONFIGURATION, FOR SURI'S WORK ─────────────────
       The three pieces of work as tabs, ONE RECORD with the Armada companion
       and the configuration page (`shared/suriWork.ts`), under this page's
       own title (ADR-147 U7). */
    ...suriConfiguration({
      eyebrow: "07 · The configuration",
      title: { pre: "Building an intelligence configuration", em: "around the work." },
      menuLabel: "Configuration",
      menuPrimary: true,
    }),
    {
      id: "leverage-suri",
      kind: "cards",
      menuLabel: "The two you write",
      columns: 2,
      // The board's two lit plates, opened up (ADR-143 U11, owner 2026-10-05).
      plates: { tag: "You write this" },
      head: {
        eyebrow: "08 · The two you write",
        title: { pre: "Context is your", em: "biggest lever." },
        sub: "What it knows and what good looks like can only come from the people doing the work: the context and the checks. For the brief, the intake in the studio's words and eleven checks. For the statics, each ad type's layout and Kate's verdicts, written down as she gives them.",
      },
      cards: [
        {
          id: "context",
          kicker: "The context",
          title: "What it knows",
          body: "The intake in the studio's words; each ad type's layout.",
          metaRows: [
            { label: "Rules", value: "What the team always checks" },
            { label: "Examples", value: "Good work, and work sent back" },
            { label: "Sources", value: "The brand file, the library, the boards" },
          ],
        },
        {
          id: "evals",
          kicker: "The checks",
          title: "How we know it is good",
          body: "Eleven on a brief; on a set, the creative lead's verdicts.",
          metaRows: [
            { label: "Cases", value: "Real requests, with the expected result" },
            { label: "Checks", value: "What must be true of every output" },
            { label: "Gates", value: "Where it stops and asks a person" },
          ],
        },
      ],
    },
    /* v3's two beats, by reference (ADR-147 U7): why it needs the checks,
       and where the market's money goes. */
    theHorizon("09 · Why it needs checks"),
    theLabsBet("10 · Where the money goes"),
    {
      /* ADR-147 U8 (owner): the finished Loop ad as an interstitial, looping
         above its line, in place of "Brief, set, checks, and then you.",
         straight into the breakdown. */
      id: "loop-ad",
      kind: "interstitial",
      variant: "callout",
      menuLabel: "The Loop ad",
      eyebrow: "11 · Loop · Experience 2 Gold",
      line: { pre: "From one prompt", em: "to a 10‑second ad." },
      clip: {
        src: "/arcs/prompt-to-loop/loop.mp4",
        poster: "/arcs/prompt-to-loop/ptl-02.jpg",
        alt: "The finished 10-second Halloween loop for Loop Experience 2 Gold",
      },
    },

    /* ── Chapter four · PROMPT TO LOOP ───────────────────────────────────────
       ADR-147 U8 (owner, 2026-10-05, twenty minutes before the room): after
       the loop, the Prompt to Loop breakdown from "How it runs" to "Just
       ask", mounted by the tail from the shared component (never a copy).
       The made-real, using, when-wrong, month, asks and IT beats come off
       this page; the technical half is for later. */

    /* ── The ending · THE LOOP HE MADE ──────────────────────────────────────
       Visual and tangible (owner, 2026-10-04): the finished Halloween loop,
       made for this room on 2 October from one line and Suri's own product
       photograph. The video itself, not a breakdown; it plays on press, with
       sound. */
    {
      id: "no-reflection",
      kind: "media",
      menuLabel: "One more thing",
      head: {
        eyebrow: "One more thing",
        title: { pre: "No reflection:", em: "a Suri loop." },
        sub: "Made for this room from one line and your own product photograph, with the same setup: a skill, its checks, and a person who picks. Not this month's work; what the setup does once it is yours.",
      },
      media: {
        type: "video",
        src: "/arcs/suri/no-reflection.mp4",
        poster: "/arcs/suri/no-reflection-poster.jpg",
        aspect: "portrait",
        alt: "A paper-cut crypt at night, the word NO with a mirror as its O, and the Pro 2 toothbrush alone in the glass",
      },
      caption: {
        label: "No reflection, a Suri Halloween loop",
        role: "A vampire has no reflection. His brush does.",
        meta: "9:16 · 15 seconds · the Pro 2 in Midnight Black, from the product page's photograph",
        sourceLabel: "Thoughtform, 2 October 2026",
      },
    },
    /* No close after it (ADR-147 U8, owner 2026-10-05): the Suri video is
       the last slide. */
  ],
};
