import type { ArcDef } from "../types";

import { UX_MEETUP_ARC, UX_MEETUP_HERO, UX_MEETUP_PROOF_LEDES } from "./ux-meetup";

/**
 * The keynote template, CUT FROM THE UX MEETUP TALK (ADR-159).
 *
 * The owner, 2026-10-16, the day after the talk: "make a copy of our UX
 * meetup ... a good keynote template that we can build from." The Ghent
 * page (ADR-156) stays as the room saw it; this record is the one the next
 * talks are cut from, and it carries the narrative he set that morning.
 *
 * ⚠ THE SPINE ALREADY TELLS WHO HE IS. The About, the eras and the pile are
 * v3's, read from `WORKSHOP_INTRO` through the same seams, so none of that is
 * repeated here. The tail begins where the eras end.
 *
 * ⚠ THE GHENT BEATS ARE READ BY REFERENCE (`ghent(id)`), the way a `-v2` cut
 * reads its v1 (ADR-057's rule): a beat that moved is spread with its new
 * number alone; a beat that changed its words is this record's own. The day
 * a referenced beat must change for the keynote, it is forked here with the
 * same spread, never edited there.
 *
 * ⚠ THE ORDER (owner, 2026-10-16), in three acts, a line and a picture in
 * turn (ADR-155's law; an act counts as one):
 *   I   the reality      01 the claim · 02 what it can make · 03 the
 *                        interface (the tool and the builder of the tool) ·
 *                        04 an intelligence · 05 every desk
 *   II  a new kind of    06 a user that isn't a person · 07 the shoggoth ·
 *       user             08 already clean (Goodfire's line) · 09 their own
 *   III how you talk     10 a colleague · 11 latent space · 12 the median ·
 *       to it            13 the prowl · 14 a node in latent space
 * then the swarm chapter (the page's, not a beat), the corridor's thesis,
 * the Arc, the proof and the close.
 *
 * ⚠ GOODFIRE (Cammarata, "Neural Networks Are Already Clean", 2026) presses
 * on the Ghent shoggoth line, "something we don't fully understand": if nine
 * neurons in ten have one readable job, that line ages in months. So 07
 * asks about a user that isn't a person (his own phrase, the close of the
 * Ghent script), 08 says we are only beginning to read it, 09 is their line
 * in their words, credited, and 10 is his answer: legible, and still their
 * own. The swarm chapter after 15 is the picture of the node agents flow
 * through; its words are still the proposal's.
 *
 * Every line marked (proposal) in ADR-159 is his to rewrite.
 */

type Section = ArcDef["sections"][number];

/** A beat of the Ghent talk, by reference. Throws on a miss, so a beat
 *  renamed there fails here by name. */
function ghent(id: string): Section {
  const s = UX_MEETUP_ARC.sections.find((x) => x.id === id);
  if (!s) throw new Error(`[keynote] the UX meetup talk has no #${id}`);
  return s;
}

/** A Ghent beat at a new position: the same object spread with its number. */
function moved(id: string, eyebrow: string): Section {
  return { ...ghent(id), eyebrow } as Section;
}

/** The interface beat with the head over its brain rewritten, the drawing the talk's. */
function retitled(id: string, mind: string): Section {
  const s = ghent(id);
  if (s.kind !== "figure" || s.figure.id !== "interface") throw new Error(`[keynote] #${id} is not the interface`);
  return { ...s, figure: { ...s.figure, mind } };
}

/** The middle beat at a new position with its line rewritten, the drawing and the cards the talk's. */
function reworded(id: string, eyebrow: string, line: string): Section {
  const s = ghent(id);
  if (s.kind !== "figure" || s.figure.id !== "middle") throw new Error(`[keynote] #${id} is not the middle`);
  return { ...s, eyebrow, figure: { ...s.figure, line } };
}

/** The rings' beat at a new position with its line rewritten, the drawing the talk's. */
function relined(id: string, eyebrow: string, line: string): Section {
  const s = ghent(id);
  if (s.kind !== "figure" || s.figure.id !== "knowledge") throw new Error(`[keynote] #${id} is not the rings`);
  return { ...s, eyebrow, figure: { ...s.figure, line } };
}

/** The hero's copy is the talk's, by reference: "AI is not software." */
export const KEYNOTE_HERO = UX_MEETUP_HERO;

/** v3's proof ledes with the workshop's promise taken out, the talk's. */
export const KEYNOTE_PROOF_LEDES = UX_MEETUP_PROOF_LEDES;

export const KEYNOTE_ARC: ArcDef = {
  slug: "thoughtform-keynote-template-alpha",
  leaf: "keynote-template-alpha",
  format: "workshop",
  /* A house arc: no `client`, so it lives at
     `/arcs/thoughtform/keynote-template-alpha`. No `theme`, no `worked`. */
  motion: "terminal",
  cardChip: "talk",
  status: "running",
  date: "2026-10-16",
  cardTitle: "Keynote template α · talk",
  cardLede:
    "The UX meetup talk as the keynote the next ones are cut from: the reality, a new kind of user, and how you talk to it.",
  cardImage: { src: "/images/services/keynote.webp", alt: "" },
  hero: {
    eyebrow: "Thoughtform · Keynote template α · October 2026",
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
    title: "AI is not software · Keynote template",
    description:
      "The keynote: digital content and products become a commodity, the user is a new kind of mind, and what is left to design is how you talk to it.",
  },
  sections: [
    /* ── I · The reality. The Ghent beats, by reference. */
    ghent("the-claim"),
    ghent("capability"),
    /* The owner, 2026-10-16 (U3, U4): the interface beat says it itself and
       says it short ("AI will become the interface"); the voice that followed
       it on the Ghent page is gone, so the middle comes straight after, and
       the middle's line is his too: "But AI isn't software. It sits between a
       tool and a collaborator." The drawings and the cards are the talk's. */
    retitled("the-interface", "AI will become the interface."),
    reworded("an-intelligence", "04 · An intelligence", "But AI isn’t software. It sits between a tool and a collaborator."),
    /* Owner, 2026-10-16: "reword it so it's more logical. It's like an
       intelligence that will soon absorb all knowledge work." The rings are
       the talk's; the line is his. */
    relined("every-desk", "05 · Every desk", "An intelligence that will soon absorb all knowledge work."),

    /* ── II · A new kind of user. */
    {
      /* The Ghent line asked about "a user that is alien". After Goodfire
         the word has to mean not a person, never unreadable; the phrase is
         his own, from the close of the Ghent script. */
      id: "an-alien",
      kind: "interstitial",
      variant: "quote",
      frame: "marks",
      menuLabel: "A new kind of user",
      eyebrow: "06 · A new kind of user",
      line: {
        pre: "How do you design experiences and interfaces",
        em: "for a user that isn’t a person?",
      },
    },
    {
      /* The shoggoth (ADR-156 U9, U13), its line rewritten: the field can
         read it now, in part; it is still not ours. (proposal) */
      id: "shoggoth",
      kind: "figure",
      menuLabel: "The shoggoth",
      eyebrow: "07 · The shoggoth",
      figure: {
        id: "shoggoth",
        alt: "The machine brain with tentacles unfurling from under it, slow and many, and a small smiling mask held in front of it: the shoggoth, the field's picture of a friendly face on a mind that is not ours.",
        title: "A mask on the shoggoth.",
        line: "A friendly face on a mind we are only beginning to read.",
      },
    },
    {
      /* Goodfire's own line, in their words and credited: the counter to
         the shoggoth, said by the people who looked inside. */
      id: "already-clean",
      kind: "interstitial",
      variant: "quote",
      frame: "marks",
      menuLabel: "Already clean",
      eyebrow: "08 · Already clean",
      line: {
        pre: "The network is strange,",
        em: "but its strangeness repeats.",
      },
      attribution: "Nick Cammarata, Goodfire, 2026",
    },
    {
      /* His answer (2026-10-16): "even if they're legible intelligences,
         they are still going to have their own society and their own
         minds, and it's already happening." The brain alone: no mask, no
         tentacles. */
      id: "their-own",
      kind: "figure",
      menuLabel: "Their own",
      eyebrow: "09 · Their own",
      figure: {
        id: "brain",
        alt: "The machine brain alone, no mask and no tentacles, its terraces lit, seen from the stack's own corner.",
        title: "Legible. Still their own.",
        line: "Even when we can read every neuron, they form minds and societies of their own. It’s already happening.",
      },
    },

    /* ── III · How you talk to it. */
    {
      /* His standing line: "if you treat AI like a pretty smart colleague,
         you get very far. If you respect the intelligence, you get pretty
         far." */
      id: "colleague",
      kind: "interstitial",
      variant: "statement",
      glitch: true,
      menuLabel: "A colleague",
      menuPrimary: true,
      eyebrow: "10 · A colleague",
      line: {
        pre: "Treat it like a pretty smart colleague.",
        em: "Respect the intelligence.",
      },
    },
    moved("latent-space", "11 · Latent space"),
    {
      /* "AI often converges on the median, not because it is stupid or not
         creative, but because without context it just generates the most
         plausible answer." */
      id: "the-median",
      kind: "interstitial",
      variant: "statement",
      glitch: true,
      menuLabel: "The median",
      eyebrow: "12 · The median",
      line: {
        pre: "Without context it gives the most plausible answer.",
        em: "The median.",
      },
    },
    /* The wolf (owner: "that visual of a wolf ... to talk about the semantic
       navigation prompting techniques"): the film carries the point, the
       script says it. */
    moved("prowl", "13 · The prowl"),
    {
      /* "Really try to convert yourself as a node in the latent space
         through which agents can flow. That's what I'm trying to do with
         Thoughtform." The swarm chapter follows as its picture. */
      id: "encode-yourself",
      kind: "interstitial",
      variant: "quote",
      frame: "marks",
      menuLabel: "Yourself as a node",
      eyebrow: "14 · A node in latent space",
      line: {
        pre: "Convert yourself into a node in latent space",
        em: "that agents flow through.",
      },
    },
  ],
};
