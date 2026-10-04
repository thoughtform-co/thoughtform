import type { ArcDef } from "../types";

import { HAND_IT_TO_AN_AGENT } from "./shared/handItToAnAgent";
import {
  suriConfiguration,
  suriMonth,
  suriRepository,
  suriUsing,
  suriWrong,
} from "./shared/suriWork";
import { THREE_WAYS_LOOP } from "./shared/threeWaysLoop";
import { whatFollows } from "./shared/whatFollows";
import { WORKSHOP_INTRO } from "./shared/workshopIntro";
import { SURI_ASK_CARDS, SURI_LOOP_GROUPS } from "./suri-workshop";

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
    },

    /* ── Chapter two · THE SITUATION ────────────────────────────────────────
       The stages and the three middle beats, by reference from v3. */
    THREE_WAYS_LOOP,
    WORKSHOP_INTRO.curve,
    WORKSHOP_INTRO.steer,
    WORKSHOP_INTRO.question,

    /* ── Chapter three · THE CONFIGURATION, FOR SURI'S WORK ─────────────────
       The three pieces of work as tabs, ONE RECORD with the Armada companion
       and the configuration page (`shared/suriWork.ts`). */
    ...suriConfiguration({
      eyebrow: "06 · The configuration",
      menuLabel: "Configuration",
      menuPrimary: true,
    }),
    {
      id: "leverage-suri",
      kind: "cards",
      menuLabel: "The two you write",
      columns: 2,
      head: {
        eyebrow: "07 · The two you write",
        title: { pre: "Two of the six", em: "nobody can write for you." },
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
    {
      /* The loop on one brief, the kickoff page's record by reference. */
      id: "the-loop",
      kind: "list-groups",
      menuLabel: "The loop",
      layout: "columns",
      head: {
        eyebrow: "08 · The loop",
        title: { pre: "Brief, set, checks,", em: "and then you." },
        sub: "One loop, one ad type at a time, on a brief that is live this week. We set it up with you in the room and run it with you until you run it without us.",
      },
      groups: SURI_LOOP_GROUPS,
    },

    /* ── Chapter four · MADE REAL ───────────────────────────────────────────
       Where the six answers live, how it is used, and what happens when a
       skill is wrong: the shared bodies, numbered for this page. */
    suriRepository({ eyebrow: "09 · Made real", menuLabel: "Made real", menuPrimary: true }),
    ...suriUsing({ eyebrow: "10 · Using it", menuLabel: "Using it" }),
    ...suriWrong({ eyebrow: "11 · When it's wrong", menuLabel: "When it's wrong" }),

    /* ── Chapter five · THIS MONTH ──────────────────────────────────────────
       The month as planned on 4 October (shared), what the month asks on top
       of the week (the kickoff's record), and what IT connects (`IT.md`). */
    suriMonth({ eyebrow: "12 · This month", menuLabel: "The month", menuPrimary: true }),
    {
      id: "what-we-ask",
      kind: "cards",
      menuLabel: "What we ask",
      columns: 4,
      head: {
        eyebrow: "13 · What we ask",
        title: { pre: "A few hours,", em: "on top of the week." },
        sub: "Most of the month runs inside the meetings and tools you already have. These are the hours it needs on top, this week.",
      },
      cards: SURI_ASK_CARDS,
    },
    {
      /* From `IT.md` and `docs/SETUP.md`: two things today, two with IT on
         Thursday, one key in week three. The full steps are the
         configuration page's. */
      id: "what-it-connects",
      kind: "cards",
      menuLabel: "IT",
      columns: 4,
      head: {
        eyebrow: "14 · What IT connects",
        title: { pre: "What IT connects,", em: "in Suri's name." },
        sub: "Everything in Suri's accounts, nothing in ours. Two things today, two more with IT on Thursday; the step-by-step is on the configuration page.",
      },
      cards: [
        {
          id: "plugins",
          n: "01",
          kicker: "Today",
          title: "The plugins",
          body: "Synced from GitHub into Suri's Claude by an Owner, or added as three files until that is possible.",
        },
        {
          id: "connectors",
          n: "02",
          kicker: "Today",
          title: "Monday and Figma",
          body: "Both connectors on for the creative team; each person signs in once with their own account.",
        },
        {
          id: "accounts",
          n: "03",
          kicker: "Thursday",
          title: "Suri's own accounts",
          body: "A GitHub organisation for the repository, a Google Cloud project for the feedback sign-in, a Vercel team for the connector.",
        },
        {
          id: "key",
          n: "04",
          kicker: "Week three",
          title: "One key",
          body: "A Gemini key in Suri's name for the picture test, on the laptop that runs it, never in the repository.",
        },
      ],
    },

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
        eyebrow: "15 · One more thing",
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

    /* ── What follows ─────────────────────────────────────────────────────── */
    whatFollows("16 · What follows"),
  ],
};
