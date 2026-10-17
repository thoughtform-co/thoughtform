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
 *   I   the reality      01 what it can make (headed by the claim, U6) ·
 *                        02 the interface · 03 an intelligence ·
 *                        04 every desk
 *   II  a new kind of    05 what it still needs · 06 the layer · 07 already
 *       user             clean (Goodfire's line) · 08 their own
 *   III how you talk     09 a colleague · 10 latent space · 11 the median ·
 *       to it            12 the prowl · 13 a node in latent space
 * then the swarm chapter (the page's, not a beat), the corridor's thesis,
 * the Arc, the proof and the close. The shoggoth is off the page for now
 * (U6), its record kept as `KEYNOTE_SHOGGOTH`.
 *
 * ⚠ GOODFIRE (Cammarata, "Neural Networks Are Already Clean", 2026) presses
 * on the Ghent shoggoth line, "something we don't fully understand": if nine
 * neurons in ten have one readable job, that line ages in months. So 05
 * says what the intelligence still needs (his words, U6), 06 opens the
 * brain and stands the layer in it, 07 is Goodfire's line in their words,
 * credited, and 08 is his answer: legible, and still their own. The swarm
 * chapter after 13 is the picture of the node agents flow through; its
 * words are still the proposal's.
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

/** The interface beat at a new position with the head over its brain rewritten, the drawing the talk's. */
function retitled(id: string, eyebrow: string, mind: string): Section {
  const s = ghent(id);
  if (s.kind !== "figure" || s.figure.id !== "interface") throw new Error(`[keynote] #${id} is not the interface`);
  return { ...s, eyebrow, figure: { ...s.figure, mind } };
}

/**
 * What it can make, forked (U6, owner 2026-10-17): the wake-up call is no
 * longer a beat of its own ("maybe we don't need that interstitial but we
 * can just use that title in the section with ... the stacks, image, film");
 * its words are this beat's head, and the cards are named as one run of what
 * AI has absorbed ("instead of 'an image' ... images, video, tools ... I
 * don't want to use the word 'then' every time"). The media are the talk's.
 */
function absorbed(id: string, eyebrow: string, title: string, named: Record<string, { title: string; caption?: string }>): Section {
  const s = ghent(id);
  if (s.kind !== "figure" || s.figure.id !== "capability") throw new Error(`[keynote] #${id} is not the capability stack`);
  const cards = s.figure.cards.map((c) => {
    const n = named[c.id];
    if (!n) throw new Error(`[keynote] #${id} has no name for the card ${c.id}`);
    return { ...c, title: n.title, caption: n.caption ?? c.caption };
  });
  return { ...s, eyebrow, figure: { ...s.figure, title, cards } };
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
      { id: "start", label: "What it can make", href: "#capability", primary: true },
      { id: "layer", label: "The layer", href: "#the-layer" },
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
    /* ── I · The reality. The wake-up call is the stack's own head (U6). */
    absorbed("capability", "01 · What it can make", "AI will absorb all digital contents and products within 2 years.", {
      image: { title: "Images", caption: "Pictures from a prompt." },
      video: { title: "Video" },
      tool: { title: "Tools" },
      brand: { title: "Brand systems" },
      product: { title: "Products" },
      worlds: { title: "Worlds" },
      mathematics: { title: "Mathematics", caption: "Gold at the Maths Olympiad, and open problems solved." },
    }),
    /* The owner, 2026-10-16 (U3, U4): the interface beat says it itself, and
       the voice that followed it on the Ghent page is gone, so the middle
       comes straight after; the middle's line is his: "But AI isn't
       software. It sits between a tool and a collaborator." U6 (2026-10-17):
       the head picks up the stack's ("a nice connection between these two
       sections"). (proposal) The drawings and the cards are the talk's. */
    retitled("the-interface", "02 · Intelligence as the interface", "And it becomes the interface to all of it."),
    reworded("an-intelligence", "03 · An intelligence", "But AI isn’t software. It sits between a tool and a collaborator."),
    /* Owner, 2026-10-16: "reword it so it's more logical. It's like an
       intelligence that will soon absorb all knowledge work." The rings are
       the talk's; the line is his. */
    relined("every-desk", "04 · Every desk", "An intelligence that will soon absorb all knowledge work."),

    /* ── II · A new kind of user. */
    {
      /* His line (U6, 2026-10-17), in place of "How do you design
         experiences and interfaces for a user that isn't a person?": "but it
         still needs context, nuance and taste" (dictated "new ones"). */
      id: "an-alien",
      kind: "interstitial",
      variant: "quote",
      frame: "marks",
      menuLabel: "Context and taste",
      eyebrow: "05 · What it still needs",
      line: {
        pre: "But it still needs",
        em: "context, nuance and taste.",
      },
    },
    /* The shoggoth is hidden for now (U6, owner: "hide the shoggoth section
       for now"): its record is `KEYNOTE_SHOGGOTH`, off the page. */
    {
      /* The layer (owner, 2026-10-16, U5): "hide the mask on the shoggoth
         for a bit. This is where I want to reveal the brain, move the two
         parts left and right respectively, and place our Thoughtform-encoded
         layer that we built for the swarm page in between". U6 (2026-10-17):
         no words ("we don't need the 'I am the layer' text, just the brain
         opened in the middle"), and the plate stands upright between the
         halves. */
      id: "the-layer",
      kind: "figure",
      menuLabel: "The layer",
      eyebrow: "06 · The layer",
      figure: {
        id: "layer",
        alt: "The machine brain's two hemispheres moved apart, and standing upright between them a slab of gold dots with the Thoughtform mark cut into its face: the layer.",
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
      eyebrow: "07 · Already clean",
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
      eyebrow: "08 · Their own",
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
      eyebrow: "09 · A colleague",
      line: {
        pre: "Treat it like a pretty smart colleague.",
        em: "Respect the intelligence.",
      },
    },
    moved("latent-space", "10 · Latent space"),
    {
      /* "AI often converges on the median, not because it is stupid or not
         creative, but because without context it just generates the most
         plausible answer." */
      id: "the-median",
      kind: "interstitial",
      variant: "statement",
      glitch: true,
      menuLabel: "The median",
      eyebrow: "11 · The median",
      line: {
        pre: "Without context it gives the most plausible answer.",
        em: "The median.",
      },
    },
    /* The wolf (owner: "that visual of a wolf ... to talk about the semantic
       navigation prompting techniques"): the film carries the point, the
       script says it. */
    moved("prowl", "12 · The prowl"),
    {
      /* "Really try to convert yourself as a node in the latent space
         through which agents can flow. That's what I'm trying to do with
         Thoughtform." The swarm chapter follows as its picture. */
      id: "encode-yourself",
      kind: "interstitial",
      variant: "quote",
      frame: "marks",
      menuLabel: "Yourself as a node",
      eyebrow: "13 · A node in latent space",
      line: {
        pre: "Convert yourself into a node in latent space",
        em: "that agents flow through.",
      },
    },
  ],
};

/**
 * The shoggoth (ADR-156 U9, U13), off the page since U6 (owner, 2026-10-17:
 * "hide the shoggoth section for now"). Its line was rewritten for the
 * keynote: the field can read it now, in part; it is still not ours.
 * (proposal) Back on the page is one line in `sections`, after `an-alien`;
 * the act keeps its phase (5), so nothing else moves.
 */
export const KEYNOTE_SHOGGOTH: Section = {
  id: "shoggoth",
  kind: "figure",
  menuLabel: "The shoggoth",
  eyebrow: "The shoggoth",
  figure: {
    id: "shoggoth",
    alt: "The machine brain with tentacles unfurling from under it, slow and many, and a small smiling mask held in front of it: the shoggoth, the field's picture of a friendly face on a mind that is not ours.",
    title: "A mask on the shoggoth.",
    line: "A friendly face on a mind we are only beginning to read.",
  },
};
