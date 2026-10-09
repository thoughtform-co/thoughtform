import type { ArcDef } from "../types";

import { SURI_INSTRUMENT, suriWorkstreamInstrument } from "@/lib/instrument/records/suri";

import {
  SURI_RUN_SUB,
  SURI_RUN_TITLE,
  SURI_WORKSTREAM_ORDER,
  SURI_WORKSTREAMS,
  UNDER_THE_GLASS,
  EVERY_WORD_STAYS,
} from "./shared/suriWork";
import { whatFollows } from "./shared/whatFollows";
import { theCatch } from "./shared/workshopFraming";
import { WORKSHOP_INTRO } from "./shared/workshopIntro";
import { theHorizon } from "./shared/workshopPractice";

/* The close's sub on this page (ADR-148 U3). Same three steps as the shared
   close, without the word "loop" right after the Loop ad. */
const CLOSE_SUB =
  "The first workstream runs with Suri's own team at the controls, then a second. Then we hand over, with a date on it, and come back once to see what changed.";

/**
 * SURI, THE CREATIVE INTELLIGENCE CONFIGURATION (ADR-147, simplified by
 * ADR-148): the one page the owner sends Suri on how the setup works.
 *
 * ADR-148 (owner, 2026-10-06: "maybe this is a good time we make a
 * simplified version because we have so many different versions"). The
 * lunch and learn stays the record of the room and the kick-off page the
 * printed handout; this page is the setup, short. The order is the owner's:
 * where AI sits (between a tool and a collaborator), how each release
 * finishes longer work on its own (the curve), the catch (it is a superhuman
 * intelligence that sucks at running itself), the configuration titled as
 * the question it answers (how intelligence should take part in the work,
 * ADR-148 U2), the two things the team writes (the skill and its evals), why
 * it needs them (the horizon), the setup run end to end on one real piece of
 * work (Prompt to Loop, whole: every step Claude took to make the Loop ad,
 * ADR-148 U1, opened by one line on why it is here, U3, beside Suri's own Black Friday teaser under one case switch, U5), and then the setup run on three of Suri's own workstreams
 * under one floating switch. The proof cards, the steps, what to
 * connect, the repository, the chats and the month left this page; their
 * records stay in `shared/suriWork.ts`, which the Armada companion reads.
 *
 * ⚠ THE WORKSTREAMS ARE ONE RECORD (`SURI_RUNS`), each from the plugin
 * repository (`suri-ai-studio`): the skill's starting prompt, its steps and
 * rubric, the eval log's figures. What has not run says so. Since ADR-154 U1
 * the configuration and the three runs are ONE INSTRUMENT (`SURI_INSTRUMENT`,
 * `suriWorkstreamInstrument`): the same drawing at the work altitude with a
 * picker, and at the run altitude opening into the checks.
 *
 * ⚠ IT IS THE CLIENT'S PAGE. It names people by role; it prints no fee, no
 * break clause and no fleet word; no key and no price appear on it.
 */
export const SURI_CONFIGURATION_ARC: ArcDef = {
  slug: "suri-configuration",
  leaf: "configuration",
  format: "workshop",
  client: "suri",
  kind: "workshop",
  cardChip: "setup",
  status: "running",
  date: "2026-10-04",
  cardTitle: "Suri · the configuration",
  cardLede:
    "How the setup works, and how it runs on Suri's own workstreams: the brief, the iterations and the video retouch.",
  cardImage: { src: "/images/services/workshop.webp", alt: "" },
  hero: {
    eyebrow: "Thoughtform · Suri · Creative Intelligence Configuration",
    title: { pre: "Creative intelligence,", em: "at Suri." },
    lede: "How the setup works, three real jobs made on it, and the same setup on three of Suri's workstreams.",
    actions: [
      { id: "start", label: "How it works", href: "#tool-and-collaborator", primary: true },
      { id: "practice", label: "In practice", href: "#in-practice-briefing" },
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
    title: "Suri · Creative Intelligence Configuration",
    description:
      "How Suri's creative intelligence setup works, and how it runs on three of the studio's own workstreams.",
  },
  sections: [
    /* ── 01 · Where AI sits ─────────────────────────────────────────────────
       The shared spectrum (the drawing pinned to `TOOL_AND_COLLABORATOR`),
       under this page's own head. */
    {
      ...WORKSHOP_INTRO.steer,
      id: "tool-and-collaborator",
      menuLabel: "Where AI sits",
      menuPrimary: true,
      head: {
        ...WORKSHOP_INTRO.steer.head,
        eyebrow: "01 · Tool and collaborator",
        title: { pre: "AI sits between a tool", em: "and a collaborator." },
        sub: "Suri's setup decides, workstream by workstream, what it gets to work out and what stays with you.",
      },
    },
    /* ── 02 · The curve, then 03 · the catch (ADR-148 U2, owner 2026-10-06:
       "first we introduce what AI is, then we explain how models are getting
       smarter and can work for longer tasks, and then the interstitial").
       The curve is v3's by reference; the catch is the shared line. */
    {
      ...WORKSHOP_INTRO.curve,
      menuLabel: "The curve",
      head: {
        ...WORKSHOP_INTRO.curve.head,
        eyebrow: "02 · The curve",
        sub: "Each release makes fewer small mistakes, so it gets further on long, difficult work before it needs you.",
      },
    },
    { ...theCatch("03 · The catch"), menuLabel: "The catch" },

    /* ── 04 · The configuration, once for the studio ───────────────────────
       ADR-148 U2: its title carries the question the interstitial used to
       ask, so the page asks it once, where it is answered. ADR-154 U1: the
       instrument at the work altitude, the studio's six on the shared
       record, with the picker up to the plugin and down into a run. */
    {
      id: "configuration",
      kind: "instrument",
      menuLabel: "Configuration",
      menuPrimary: true,
      head: {
        eyebrow: "04 · The configuration",
        title: { pre: "How intelligence should", em: "take part in the work." },
        sub: "Running it is the part you set up. Suri answers four of these once, for the whole studio; the team writes the other two, per workstream.",
      },
      record: SURI_INSTRUMENT,
      altitude: "work",
      picker: ["plugin", "work", "run", "check"],
    },

    /* ── 04 · The two the team writes ────────────────────────────────────── */
    {
      id: "skills-and-evals",
      kind: "cards",
      menuLabel: "Skills and evals",
      menuPrimary: true,
      columns: 2,
      plates: { tag: "You write this" },
      head: {
        eyebrow: "05 · Skills and evals",
        title: { pre: "Context is your", em: "biggest lever." },
        sub: "Only the people doing the work can write these two, and they decide whether the work is any good.",
      },
      cards: [
        {
          id: "skill",
          kicker: "The skill",
          title: "What it knows and does",
          body: "One per workstream, in the studio's own words.",
          metaRows: [
            { label: "Steps", value: "The order the work is done in" },
            { label: "Context", value: "The brand file, working names, the library" },
            { label: "Examples", value: "Good work, and work sent back" },
          ],
        },
        {
          id: "evals",
          kicker: "The evals",
          title: "How we know it is good",
          body: "What the work is checked against, before anyone sees it.",
          metaRows: [
            { label: "Cases", value: "Real requests, run with and without the skill" },
            { label: "Gates", value: "What must be true, or the work fails" },
            { label: "Verdicts", value: "The creative lead's, written down as given" },
          ],
        },
      ],
    },

    /* ── 05 · Why it needs them, by reference ────────────────────────────── */
    (() => {
      const horizon = theHorizon("06 · Why it needs evals");
      return {
        ...horizon,
        head: {
          ...horizon.head,
          sub: "Without them it needs you at every step. With them it checks its own work, tries again, and stops to ask.",
        },
      };
    })(),

    /* ── 07 · The bridge into the breakdowns (ADR-148 U3, two cases since U5)
       Says why another client's ad is on Suri's page, and that Suri's own
       case sits beside it under the switch. */
    {
      id: "real-jobs",
      kind: "interstitial",
      variant: "callout",
      eyebrow: "07 · Three real jobs",
      menuLabel: "Three real jobs",
      line: { pre: "Before Suri's workstreams,", em: "the whole setup on three real jobs." },
      subline:
        "Loop's Halloween ad, made in one evening, and two of Suri's own: the Black Friday teaser and the email skill. Switch between them on the bar.",
    },

    /* ── The cases, under one floating switch (ADR-148 U1, U5) ─────────────
       Owner, 2026-10-07: "in the sections where we break down each case,
       there should be a floating bar … when you click on it, the sections
       change to correspond with the case." Prompt to Loop is the owner's
       breakdown, one record (the lunch and learn, v3 and the AP lecture mount
       it too); Under the Glass is Suri's own, in the same format. */
    {
      id: "ptl-top",
      kind: "prompt-to-loop",
      menuLabel: "How Claude made it",
      menuPrimary: true,
      worked: { group: "case", id: "loop", label: "Loop · Halloween ad" },
    },
    {
      id: "utg-top",
      kind: "breakdown",
      worked: { group: "case", id: "under-the-glass", label: "Suri · Black Friday" },
      breakdown: UNDER_THE_GLASS,
    },
    {
      id: "ews-top",
      kind: "breakdown",
      worked: { group: "case", id: "every-word-stays", label: "Suri · Email skill" },
      breakdown: EVERY_WORD_STAYS,
    },

    /* ── 08 · In practice: three workstreams under one floating switch ────
       ADR-154 U1: each workstream is the same instrument at the run altitude,
       its record cut from `SURI_RUNS`, opening into its checks. */
    ...SURI_WORKSTREAM_ORDER.map((which, i) => ({
      id: `in-practice-${SURI_WORKSTREAMS[which].id}`,
      kind: "instrument" as const,
      ...(i === 0 ? { menuLabel: "In practice", menuPrimary: true as const } : {}),
      worked: {
        group: "workstream",
        id: SURI_WORKSTREAMS[which].id,
        label: SURI_WORKSTREAMS[which].label,
      },
      head: { eyebrow: "08 · In practice", title: SURI_RUN_TITLE, sub: SURI_RUN_SUB },
      record: suriWorkstreamInstrument(which),
      altitude: "run" as const,
      picker: ["run", "check"] as const,
    })),

    /* ── 09 · What follows ───────────────────────────────────────────────────
       The shared close, with this page's own sub: the shared one says the
       work "goes through the loop", which on this page reads as the Loop ad
       the reader has just watched. */
    (() => {
      const close = whatFollows("09 · What follows");
      return { ...close, head: { ...close.head, sub: CLOSE_SUB } };
    })(),
  ],
};
