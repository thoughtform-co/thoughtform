import type { ArcDef } from "../types";

import { SURI_STUDIO_CONFIGURATION, suriRuns } from "./shared/suriWork";
import { whatFollows } from "./shared/whatFollows";
import { WORKSHOP_INTRO } from "./shared/workshopIntro";
import { theHorizon } from "./shared/workshopPractice";

/**
 * SURI, THE CREATIVE INTELLIGENCE CONFIGURATION (ADR-147, simplified by
 * ADR-148): the one page the owner sends Suri on how the setup works.
 *
 * ADR-148 (owner, 2026-10-06: "maybe this is a good time we make a
 * simplified version because we have so many different versions"). The
 * lunch and learn stays the record of the room and the kick-off page the
 * printed handout; this page is the setup, short. The order is the owner's:
 * where AI sits (between a tool and a collaborator), the question that
 * raises (how should it take part in the work), the configuration that
 * answers it, the two things the team writes (the skill and its evals), why
 * it needs them (the horizon), and then the setup run on three of Suri's own
 * workstreams under one floating switch. The proof cards, the steps, what to
 * connect, the repository, the chats and the month left this page; their
 * records stay in `shared/suriWork.ts`, which the Armada companion reads.
 *
 * ⚠ THE WORKSTREAMS ARE ONE RECORD (`SURI_RUNS`), each from the plugin
 * repository (`suri-ai-studio`): the skill's starting prompt, its steps and
 * rubric, the eval log's figures. What has not run says so.
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
    lede: "How the setup works, and how it runs on Suri's own work: the brief, the iterations and the edit.",
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
        sub: "Tell it exactly what to do and it executes. Describe what you are after and it works out how. Suri's setup decides, workstream by workstream, where on that line the work sits.",
      },
    },
    {
      id: "participate",
      kind: "interstitial",
      variant: "question",
      menuLabel: "The question",
      eyebrow: "02 · The question",
      line: { pre: "How should intelligence", em: "participate in the work?" },
    },

    /* ── 03 · The configuration, once for the studio ─────────────────────── */
    {
      id: "configuration",
      kind: "questions",
      menuLabel: "Configuration",
      menuPrimary: true,
      head: {
        eyebrow: "03 · The configuration",
        title: { pre: "Building an intelligence configuration", em: "around the work." },
        sub: "Six questions, answered once for the studio. Suri sets four for everyone: the model, the data, the interface and the owner. The team writes the other two, workstream by workstream.",
      },
      ...SURI_STUDIO_CONFIGURATION,
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
        eyebrow: "04 · Skills and evals",
        title: { pre: "Context is your", em: "biggest lever." },
        sub: "The rest of the setup is set once. The skill and its evals can only come from the people doing the work, and they are what decide whether the work is any good.",
      },
      cards: [
        {
          id: "skill",
          kicker: "The skill",
          title: "What it knows and does",
          body: "One per workstream: the steps in the studio's own words, and the files it reads.",
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
          body: "Real requests with the result we expect, and the rubric the skill checks itself against.",
          metaRows: [
            { label: "Cases", value: "Real requests, run with and without the skill" },
            { label: "Gates", value: "What must be true, or the work fails" },
            { label: "Verdicts", value: "The creative lead's, written down as given" },
          ],
        },
      ],
    },

    /* ── 05 · Why it needs them, by reference ────────────────────────────── */
    theHorizon("05 · Why it needs evals"),

    /* ── 06 · In practice: three workstreams under one floating switch ──── */
    ...suriRuns({ eyebrow: "06 · In practice", menuLabel: "In practice", menuPrimary: true }),

    /* ── 07 · What follows ─────────────────────────────────────────────────── */
    whatFollows("07 · What follows"),
  ],
};
