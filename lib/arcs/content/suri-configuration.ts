import type { ArcDef } from "../types";

import { suriMonth, suriOnceTwice, suriRepository, suriUsing, suriWrong } from "./shared/suriWork";
import { whatFollows } from "./shared/whatFollows";

/**
 * SURI, THE CREATIVE INTELLIGENCE CONFIGURATION (ADR-147): the document the
 * owner sends Suri so the team knows what to do, what to connect, and how.
 *
 * Not the Armada page under another name: that page explains the machinery
 * to the house; this one is the client's own setup, in phases. It opens on
 * the month as a TRACK (the course's `syllabus` kind, with its own words:
 * steps, not classes), so one step is open at a time with its four rows:
 * what you do, what you end with, when it is done, where. Then what to
 * connect, in the order it is needed; the setup drawn (the repository, the
 * shared record); using it and saying when it is wrong (shared); once a
 * correction, twice a rule (shared); the month (shared); the close.
 *
 * ⚠ EVERY STEP IS WRITTEN FROM THE DOCTRINE AND THE PLUGIN REPOSITORY, never
 * invented: the kick-off's two workstreams, `IT.md`, `docs/SETUP.md`,
 * `docs/FEEDBACK.md`, `docs/TEAMS.md`, the bench's first session, the
 * encoding questions, the new-skill skill's steps, and the offering's
 * handover test ("the team can find the next workflow, encode it, and build
 * on it without Thoughtform in the room").
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
    "What to connect, what to do in which week, and how the skills reach everyone: the setup Suri's creative team runs.",
  cardImage: { src: "/images/services/workshop.webp", alt: "" },
  hero: {
    eyebrow: "Thoughtform · Suri · Creative Intelligence Configuration",
    title: { pre: "The setup", em: "your team runs." },
    lede: "What to connect, what to do in which week, and how the skills, the checks and the feedback reach everyone at Suri.",
    actions: [
      { id: "start", label: "The steps", href: "#the-steps", primary: true },
      { id: "connect", label: "What to connect", href: "#what-to-connect" },
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
      "The setup Suri's creative team runs: what to connect, what to do in which week, and how the skills, the checks and the feedback reach everyone.",
  },
  sections: [
    /* ── 01 · The steps ─────────────────────────────────────────────────────
       The month as one track: the fork is how the plugins arrive, a station
       per step under the phases, a gate after every station, and what is
       Suri's at the end. The open step's sheet carries the four rows once. */
    {
      id: "the-steps",
      kind: "syllabus",
      menuLabel: "The steps",
      menuPrimary: true,
      head: {
        eyebrow: "01 · The steps",
        title: { pre: "From today", em: "to the handover." },
        sub: "One step open at a time: what you do, what you end with, when it is done, and where. The first two are this week in the office; the rest run inside the work, and the handover date is set in week one.",
      },
      words: {
        station: "Step",
        tablist: "The steps",
        rows: ["What you do", "What you end with", "Done when", "Where"],
      },
      entry: { label: "The plugins arrive", ways: ["Synced from GitHub", "Added as three files"] },
      phases: [
        { id: "day-one", label: "Day one" },
        { id: "day-two", label: "Day two" },
        { id: "week-one", label: "The first week" },
        { id: "after", label: "Weeks two to four" },
      ],
      classes: [
        {
          id: "connect",
          phase: "day-one",
          name: "Connect",
          glyph: "setup",
          objective:
            "Claude, Monday and Figma on your own accounts, and the three plugins visible to everyone who needs them.",
          make: "The brief and brand skills in your Claude; the Monday read run once on your boards, the column map saved.",
          gate: "Everyone in the creative team sees the plugins, and the baseline is written down with its count.",
          tool: "Suri's Claude organisation with the Monday and Figma connectors; Claude Code on one laptop for the read.",
          example: { label: "What to connect", href: "#what-to-connect" },
        },
        {
          id: "one-skill",
          phase: "day-one",
          name: "One skill",
          glyph: "board",
          objective:
            "Talk to the briefing skill about a brief that is live this week, and say what is wrong in your own words.",
          make: "One real brief through the skill, the Monday item it wrote, and what it sent back.",
          gate: "The skill asked until the brief was complete, and a strategist agrees with the item it wrote.",
          tool: "The brief skill, in Claude chat or Cowork; the brand skill beside it for the products.",
          example: { label: "Using it", href: "#using-brief" },
        },
        {
          id: "write-it-down",
          phase: "day-two",
          name: "Write it down",
          glyph: "skill",
          objective:
            "What a complete brief holds and what the creative lead sends back most, in her words, not ours.",
          make: "The intake rewritten verbatim, and the first checks for a set from the verdicts on the first ad type.",
          gate: "A check is written only from work the decider has looked at, and it advises until it agrees with her.",
          tool: "The skill's own files: the intake, the rubric, the corrections; a vocabulary file for every verdict, dated.",
          example: { label: "Once, then twice", href: "#once-twice" },
        },
        {
          id: "into-the-plugin",
          phase: "week-one",
          name: "Into the plugin",
          glyph: "plugin",
          objective:
            "Every skill the team writes lands in its team's plugin, on one marketplace, with one owner each.",
          make: "The repository under a GitHub account of Suri's, synced into Suri's Claude; the next skill added from the chat.",
          gate: "A merged change reaches everyone within the half hour with nothing to install, and every skill names its owner.",
          tool: "GitHub with the Claude GitHub App on the repository; Plugins and skills, Sync from GitHub; /ai-suri:new-skill.",
          example: { label: "The setup, drawn", href: "#repository" },
        },
        {
          id: "feedback",
          phase: "week-one",
          name: "Feedback",
          glyph: "offer",
          objective:
            "Anyone tells a skill it got something wrong, from the chat, and the skill's owner decides what happens next.",
          make: "The feedback skill live for everyone: the connector, the triage and the labels, with the first test filed and read back.",
          gate: "The first test gets its labels within minutes, and the owner's decision becomes a draft fix that nobody merged by itself.",
          tool: "The connector in Suri's Vercel team, a Google Cloud project for the sign-in, the triage workflows in the repository.",
          example: { label: "When it's wrong", href: "#wrong-brief" },
        },
        {
          id: "run-it",
          phase: "after",
          name: "Run it",
          glyph: "board",
          objective:
            "Every new brief through the skill, the third ad type, and the Monday read again on the same map.",
          make: "Two weeks of briefs and sets with the checks in the creative lead's words, and the review against the baseline.",
          gate: "Rounds and complete briefs move against day one, and the team ran it for three days without us.",
          tool: "Claude, Monday and Figma as on day one; in week three the picture and video tests, with one key in Suri's name.",
          example: { label: "The month", href: "#the-month" },
        },
        {
          id: "hand-over",
          phase: "after",
          name: "Hand over",
          glyph: "launch",
          objective:
            "It is Suri's: the repository, the keys, the plugins, and the habit of writing down what good looks like.",
          make: "A full set from brief to finish through the mother, graded by the creative lead; one wrong check found and fixed by the team.",
          gate: "The team can find the next workflow, write it down, and build on it without us in the room.",
          tool: "/ai-suri:new-skill for the next one; a check-in at one month and at three.",
        },
      ],
      launch: {
        label: "Then it is Suri's",
        items: [
          "The repository, in Suri's GitHub",
          "Every key in Suri's name",
          "The next skill, from the chat",
        ],
      },
      note: "A gate is what must be true before the next step starts. A check advises; a person decides.",
    },

    /* ── 02 · What to connect ───────────────────────────────────────────────
       `IT.md`, `docs/SETUP.md` and `docs/FEEDBACK.md`, as two readout plates:
       Suri's Claude on Monday, Suri's own accounts with IT on Thursday. */
    {
      id: "what-to-connect",
      kind: "list-groups",
      menuLabel: "Connect",
      menuPrimary: true,
      layout: "readout",
      head: {
        eyebrow: "02 · What to connect",
        title: { pre: "The accounts,", em: "all Suri's." },
        sub: "Most people set up nothing: once the repository is synced, the plugins are in Claude for everyone they are set for. These are the things that need a person, in the order they are needed. Nothing here sits in our name.",
      },
      groups: [
        {
          id: "claude",
          label: "Suri's Claude",
          blurb: "an Owner, on Monday",
          items: [
            { id: "policy", tag: "Policy", name: "Skills on; user-created for the team" },
            { id: "sync", tag: "Add", name: "Sync from GitHub: suri-ai-studio" },
            { id: "default", tag: "Default", name: "Not available, until a group is set" },
            { id: "groups", tag: "Group access", name: "ai-suri for everyone; the teams by pilot" },
            { id: "connectors", tag: "Connectors", name: "Monday and Figma, each person signs in" },
            { id: "code", tag: "Code", name: "Code execution and file creation on" },
          ],
          foot: {
            label: "If GitHub cannot be connected today",
            lines: [
              "Upload the three files once, with the same access.",
              "Remove them when the sync is on.",
            ],
          },
        },
        {
          id: "suri",
          label: "Suri's own accounts",
          blurb: "with IT, on Thursday",
          items: [
            { id: "github", tag: "GitHub", name: "An organisation; the repository moves in" },
            { id: "app", tag: "GitHub App", name: "Claude's app, on this repository only" },
            { id: "google", tag: "Google Cloud", name: "A project in your Workspace, internal" },
            { id: "vercel", tag: "Vercel", name: "A Pro team, where the connector runs" },
            { id: "token", tag: "Claude token", name: "claude setup-token, to the repo secrets" },
            { id: "key", tag: "Week three", name: "One Gemini key, in Suri's name" },
          ],
          foot: {
            label: "What never goes in the repository",
            lines: [
              "No key, no photograph, no export.",
              "The repository is text; its own check refuses the rest.",
            ],
          },
        },
      ],
    },

    /* ── 03 to 07 · the shared bodies, numbered for this page ─────────────── */
    suriRepository({ eyebrow: "03 · The setup, drawn", menuLabel: "The setup", menuPrimary: true }),
    ...suriUsing({ eyebrow: "04 · Using it", menuLabel: "Using it" }),
    ...suriWrong({ eyebrow: "05 · When it's wrong", menuLabel: "When it's wrong" }),
    suriOnceTwice({ eyebrow: "06 · Once, then twice", menuLabel: "Once, then twice" }),
    suriMonth({ eyebrow: "07 · The month", menuLabel: "The month", menuPrimary: true }),

    /* ── 08 · What follows ──────────────────────────────────────────────────── */
    whatFollows("08 · What follows"),
  ],
};
