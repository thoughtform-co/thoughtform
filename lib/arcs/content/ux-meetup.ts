import type { ArcDef } from "../types";

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
     (owner, 2026-10-13). No `theme`, no `worked` anywhere. */
  /* U3 (owner, 2026-10-15): "no movement or travel, just a glitch effect".
     The terminal grammar (ADR-057): every beat parks, its title decodes
     where it stands, nothing slides in. */
  motion: "terminal",
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
      { id: "proof", label: "What it can make", href: "#capability" },
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
    /* ── U3 (owner, 2026-10-15): the wake-up call, then the proof as an act
       of three drawings on one floor (the content lane, the products lane
       added, then both absorbed by the machine), a voice, the turn to an
       intelligence. Statements glitch in where they stand; nothing slides. */
    {
      id: "the-claim",
      kind: "interstitial",
      variant: "statement",
      /* The wake-up call (U3): it glitches in over the emptied eras. */
      glitch: true,
      menuLabel: "The wake-up call",
      menuPrimary: true,
      eyebrow: "01 · The wake-up call",
      line: {
        pre: "Within two years, all digital content and products",
        em: "will be absorbed.",
      },
    },
    {
      /* U4 (owner, 2026-10-15): the timeline back to the drawing board. One
         beat, no head: under the registration row, one framed card at a
         time, each rotating back into the stack as the next appears. */
      id: "capability",
      kind: "figure",
      menuLabel: "What it can make",
      menuPrimary: true,
      eyebrow: "02 · What it can make",
      figure: {
        id: "capability",
        alt: "Six framed examples, one after another, each turning into a standing sheet in a stack to the side: an image made with Midjourney, Loop's AI film, Vesper (the image and video tool built at Loop), PhotoCraft (Photoshop rebuilt with Claude), new worlds built from game assets, and mathematics.",
        cards: [
          {
            id: "image",
            kind: "image",
            year: "2023",
            title: "An image",
            caption: "A picture from a prompt, made with Midjourney.",
            media: {
              type: "image",
              src: "/images/ThoughtForm_v1.webp",
              alt: "A head shaped from sand inside a broken ring, made with Midjourney",
            },
          },
          {
            id: "video",
            kind: "video",
            year: "2024",
            title: "A film",
            caption: "Loop's AI film, run as paid media next to live action.",
            media: {
              type: "video",
              src: "/videos/loop-smug-owl-ai-atl.mp4",
              poster: "/arcs/posters/smug-owl.jpg",
              alt: "Smug Owl, Loop's AI above-the-line film",
            },
          },
          {
            id: "tool",
            kind: "tool",
            year: "2025",
            title: "A tool, built for the team",
            caption: "Vesper: the image and video tool I built at Loop.",
            media: {
              type: "video",
              src: "/videos/tools/vesper.mp4",
              poster: "/videos/tools/vesper-poster.jpg",
              alt: "Vesper, the image and video generation tool built at Loop Earplugs",
            },
          },
          {
            id: "product",
            kind: "product",
            year: "2026",
            title: "A whole product",
            caption: "PhotoCraft: Photoshop, rebuilt with Claude.",
            media: {
              type: "image",
              src: "/arcs/ux-meetup/photocraft.webp",
              alt: "PhotoCraft open on Hokusai's Great Wave, a Photoshop layout rebuilt with Claude",
            },
          },
          {
            id: "worlds",
            kind: "worlds",
            year: "2026",
            title: "New worlds",
            caption: "Players mod Halo into new games and worlds of their own.",
          },
          {
            id: "mathematics",
            kind: "mathematics",
            year: "2025",
            title: "Mathematics",
            caption: "Gold at the Maths Olympiad, then open problems solved.",
          },
        ],
      },
    },
    {
      /* U4 (owner, 2026-10-15): no head, no paragraph. A piece of work, and
         downstream from it the two ways: every step we used to take, and the
         frontier model as the interface. */
      id: "the-interface",
      kind: "figure",
      menuLabel: "The interface",
      eyebrow: "03 · The new interface",
      figure: {
        id: "interface",
        alt: "The stack of examples moves to the centre, layer by layer: images, film, tools, products, worlds, mathematics, the foundations. Above it stands the model, a machine brain of low-poly shells, circuit dies and a heatsink, and from the port under it cords of different weights and colours plug into every plate.",
        mind: "The model",
        line: "The new interface: give it context, hard problems and evals, and it works every layer below.",
      },
    },
    {
      id: "your-tool",
      kind: "interstitial",
      variant: "quote",
      frame: "marks",
      menuLabel: "A voice",
      eyebrow: "04 · Heard in the industry",
      line: {
        pre: "I don\u2019t want to use your agent.",
        em: "I want my agent to use your tool.",
      },
    },
    {
      id: "an-intelligence",
      kind: "figure",
      menuLabel: "An intelligence",
      menuPrimary: true,
      /* U6: the logic figure is gone (owner: "we don't need that"); the
         mind of the interface beat comes back alone and faces the reader. */
      eyebrow: "05 · An intelligence",
      figure: {
        id: "middle",
        alt: "The machine mind turns to face the reader. Its left half, crisp gold circuits, is routed square to a tool; its right half, loose particles, streams to a collaborator and back. It sits in the middle.",
        line: "AI is an intelligence that sits in the middle.",
        tool: { label: "Tool", line: "It does what you tell it." },
        collaborator: { label: "Collaborator", line: "It thinks it through with you." },
      },
    },
    {
      /* The conclusion (U3): one head, two ways. No section head: it stands
         under the registration row, centred, so it never reads as a second
         head-and-picture after the intelligence (ADR-155). */
      id: "crossroads",
      kind: "figure",
      /* The talk's last beat is its exit, never a chapter (arc-marks). */
      menuLabel: "The crossroads",
      eyebrow: "06 · The crossroads",
      figure: {
        id: "crossroads",
        alt: "An anonymous head seen from three-quarters, split down the nose line. The left half is a cloud of particles; the right half is drawn in gold contour lines, like a machine. On the left: live action matters more than ever. On the right: embrace the intelligence.",
        human: {
          label: "One way",
          line: "Live action matters more than ever: real experiences, rooms with people in them.",
        },
        machine: {
          label: "The other way",
          line: "Embrace the intelligence: interactions, interfaces and business models for a new digital civilisation.",
        },
      },
    },
  ],
};
