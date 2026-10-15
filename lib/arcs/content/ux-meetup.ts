import type { ArcDef } from "../types";

import { THE_CURVE_BEAT } from "./shared/workshopFraming";
import { WORKSHOP_INTRO, type WorkshopIntro } from "./shared/workshopIntro";

/**
 * The UX meetup talk, A CUT OF THE WORKSHOP'S THIRD HOUSE CUT (ADR-156).
 *
 * The owner's talk for the UX Gent AI-design meetup of 15 October 2026. v3's
 * spine whole and by import (hero → the equilibrium → About → the eras → the
 * Arc → the Loop proof pile), then a tail written for a room of designers.
 * His brief: not a portfolio; a reality check, then what comes next.
 *
 * ⚠ THE SPINE ALREADY TELLS WHO HE IS. The About, the eras and the pile are
 * v3's, read from `WORKSHOP_INTRO` through the same seams, so none of that is
 * repeated here. The tail begins where the pile ends.
 *
 * ⚠ U2 (2026-10-15, the owner's read of U1 hours before the talk): the
 * talk sits between the eras and the corridor, so the corridor's thesis
 * ("AI sits somewhere between tool and collaborator") and the Arc close it.
 * Seven beats, a STATEMENT then a SECTION WITH ITS PICTURE in turn: the
 * claim, PhotoCraft, the threat, the curve under the electricity line, the
 * two ends, the stack (headless or told), the designer. Out: Tom on the
 * Moon, In The Pocket, the spectrum (the thesis says it), and every card
 * grid ("a glorified PowerPoint", owner). No equilibrium (page.tsx).
 *
 * ⚠ THE CURVE IS THE SHARED DRAWING UNDER THIS TALK'S HEAD, as v3 and
 * Suri's cut turn it, so `arcs-registry` does not count this page a
 * word-for-word reader.
 *
 * ⚠ What his notes ruled out stays out: the geopolitics, and the
 * jobs-and-unrest tangent (one spoken line at most, never a slide).
 */

/** The hero's copy, written over the shared prototype's at parse time (v3's
 *  `replaceHeroCopy`). The house measure holds (`HERO_MEASURE`). */
export const UX_MEETUP_HERO: WorkshopIntro["hero"] = {
  headlineHtml: "AI is not<br />software.",
  descHtml: "A talk on what is left to design once making digital things costs almost nothing.",
};

/** v3's proof ledes, with the one clause that promises a workshop removed
 *  ("The rest of today is how."): a talk does not show how. */
export const UX_MEETUP_PROOF_LEDES: WorkshopIntro["proof"]["ledes"] = {
  ...WORKSHOP_INTRO.proof.ledes,
  "ai-transformation":
    "Then we built for the agents: what each team knows, written down, and the checks they run on their own work.",
};

export const UX_MEETUP_ARC: ArcDef = {
  slug: "thoughtform-ux-meetup",
  leaf: "ux-meetup",
  format: "workshop",
  /* A house arc: no `client`, so it lives at `/arcs/thoughtform/ux-meetup`
     (owner, 2026-10-13). No `theme`, no `motion`, no `worked` anywhere. */
  cardChip: "talk",
  status: "running",
  date: "2026-10-13",
  cardTitle: "UX meetup · talk",
  cardLede:
    "What is left to design once making digital things costs almost nothing: interfaces for and with an intelligence.",
  cardImage: { src: "/images/services/keynote.webp", alt: "" },
  hero: {
    eyebrow: "Thoughtform · UX Gent · 15 October 2026",
    title: { pre: "AI is", em: "not software." },
    lede: "A talk on what is left to design once making digital things costs almost nothing.",
    actions: [
      { id: "start", label: "The claim", href: "#the-claim", primary: true },
      { id: "rebuilt", label: "Rebuilt", href: "#rebuilt" },
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
    title: "AI is not software · UX meetup",
    description:
      "A talk for designers: digital content and products become a commodity, and what is left to design is the interface with an intelligence.",
  },
  sections: [
    /* ── U2 (owner, 2026-10-15): seven beats, a statement then a section
       with its picture, never two of a kind side by side (ADR-155's law).
       A statement is one line and nothing under it; the speaker says the
       rest. No card grid anywhere: the owner's ruling, standing. The thesis
       and the Arc come after this, in the corridor. */
    {
      id: "the-claim",
      kind: "interstitial",
      variant: "statement",
      menuLabel: "The reality",
      menuPrimary: true,
      eyebrow: "01 · The reality",
      line: {
        pre: "Within two years, digital content and products",
        em: "are a commodity.",
      },
    },
    {
      id: "rebuilt",
      kind: "media",
      menuLabel: "Rebuilt",
      menuPrimary: true,
      head: {
        eyebrow: "02 · Rebuilt",
        title: { pre: "Photoshop,", em: "rebuilt with Claude." },
        sub: "An open-source Photoshop, written in Rust with Claude and on GitHub since 30 September; Word, Excel and PowerPoint followed a week later. Up close it is early alpha, and no company leaves a subscription for a clone.",
      },
      media: {
        type: "image",
        src: "/arcs/ux-meetup/photocraft.webp",
        alt: "PhotoCraft open on Hokusai's Great Wave: a Photoshop layout with the tools on the left, a Curves adjustment and a layer stack on the right.",
      },
      caption: {
        label: "PhotoCraft, the ArtCraft project",
        role: "A clean-room rebuild of Photoshop, mostly written by AI",
        meta: "Rust · Apache-2.0 · early alpha · over 60,000 stars in two weeks",
        sourceLabel: "github.com/storytold/photocraft",
        sourceHref: "https://github.com/storytold/photocraft",
      },
    },
    {
      id: "the-threat",
      kind: "interstitial",
      variant: "statement",
      menuLabel: "The threat",
      eyebrow: "03 · The threat",
      line: {
        pre: "The threat is that nobody",
        em: "opens the other software.",
      },
    },
    {
      /* The shared curve's drawing under the talk's electricity line. */
      ...THE_CURVE_BEAT,
      menuLabel: "Not software",
      menuPrimary: true,
      head: {
        eyebrow: "04 · Not software",
        title: { pre: "A commodity like electricity,", em: "except this one solves problems." },
        sub: "More power plants run more machines and solve nothing. More intelligence finishes longer and harder work, and no upper bound has shown up yet. No claim about consciousness: trained on our language, it reasons through a problem.",
      },
    },
    {
      id: "two-ends",
      kind: "interstitial",
      variant: "statement",
      menuLabel: "Two ways out",
      eyebrow: "05 · Two ways out",
      line: {
        pre: "Value moves to what only people make,",
        em: "and to the intelligence itself.",
      },
    },
    {
      id: "the-interface",
      kind: "stack",
      menuLabel: "What is left",
      menuPrimary: true,
      head: {
        eyebrow: "06 · What is left to design",
        title: { pre: "The interface is", em: "the intelligence." },
        sub: "People build what they need on the fly. Where the story is not yours, go headless and let them. Where it is, tell it yourself, and encode the brand so every intelligence renders you right.",
      },
      figure: {
        tiers: ["tiles", "layer", "host", "shared"],
        lit: "layer",
        tiles: [
          { id: "dashboard", bucket: "Headless", name: "A dashboard" },
          { id: "report", bucket: "Headless", name: "A report" },
          { id: "tool", bucket: "Headless", name: "An internal tool" },
          { id: "page", bucket: "Headless", name: "A page for one person" },
        ],
        callouts: {
          layer: { label: "Told", lines: ["Your brand, encoded"], chip: "Yours" },
          host: { label: "The intelligence", lines: ["Claude, ChatGPT"] },
          shared: { label: "The models", lines: ["A commodity"] },
        },
        /* The tiles' words to the left: on the right they ran into the
           layer's, which sits just under them. */
        sides: { tiles: "left" },
        courses: {
          skills: ["Shader libraries", "A design system shipped as source", "Motion and type rules"],
          evals: ["Checks for what is on brand"],
        },
        alt: "An isometric stack. On top, interfaces built on the fly: a dashboard, a report, an internal tool, a page for one person. Under them, lit gold, the brand encoded: shader libraries, a design system shipped as source, motion and type rules, and checks. Under that, the intelligence, Claude and ChatGPT, and at the bottom the models, a commodity.",
      },
    },
    {
      id: "designer",
      kind: "interstitial",
      variant: "statement",
      menuLabel: "Designers",
      eyebrow: "07 · Where that leaves us",
      line: {
        pre: "The most interesting time",
        em: "to be a designer.",
      },
    },
  ],
};
