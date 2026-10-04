import type { CorridorCopyOverride, CorridorStackCopy } from "@/lib/v7-parse/types";

import type { ArcSectionOf } from "../../types";
import { HAND_IT_TO_AN_AGENT } from "./handItToAnAgent";
import { HARD_TO_STEER_BEAT, REAL_QUESTION_BEAT, THE_CURVE_BEAT } from "./workshopFraming";

/**
 * The workshop's intro, said as a story (ADR-143 U3): the RECORD the third
 * house cut reads for everything before its arc. Pure data, so the Suri cut
 * and the cuts after it read it by reference (one section, one record).
 *
 *   1. I am an intelligence architect.     (about)
 *   2. This is how I work: the Arc.         (stations)
 *   3. This is how I did it at Loop.        (proof)
 *   4. Now we go in depth.                  (opening)
 *
 * ⚠ V3 ONLY (owner, 2026-10-03). V1, V2, the AP lecture and the homepage keep
 * today's intro; every seam this record feeds is the identity when it is not
 * passed, so they render byte-identical.
 *
 * ⚠ THE THESIS TITLE IS THE HOMEPAGE'S, ITS PARAGRAPHS ARE NOT (owner,
 * 2026-10-03: "restore the copy from the home page"; then 2026-10-04, ADR-143
 * U6: reword the paragraphs). "AI sits somewhere between tool and
 * collaborator." stays, because the era title morphs into it (U5); the two
 * paragraphs under it stop asking beat 05's question early and stop selling.
 *
 * ⚠ THE INTRO BUILDS UP, IT DOES NOT GIVE AWAY (owner, 2026-10-04). The
 * captions point at the workshop's three parts in plain words and never name
 * the skills, the evals or the intelligence configuration: beat 06 reveals
 * that term. The Arc is a philosophy the work came out of, hinted at as a
 * loop once (the thesis's second paragraph), never explained; so the proof
 * cards carry no phase either.
 *
 * ⚠ THE ARC KEEPS ITS OWN WORDS (owner, 2026-10-03): Navigate / Encode /
 * Build stay, which overrides, for this page only, the Suri sprint plan's
 * list of words kept out of the room.
 *
 * ⚠ THE COPY LAW, pinned by `workshop-intro.test.ts`: no em dash, nothing
 * from the voice skill's banned list, no digit but the frontier's
 * "30-second", one `<br>` per caption, ledes at most 180 characters, the
 * hero inside the house measure.
 */

/** The four Loop tracks the pile shows, in its order (`PROOF_STACK_ORDER`). */
export type WorkshopProofTrack = "atl-films" | "tooling" | "studio" | "ai-transformation";

export interface WorkshopIntro {
  /** The hero's headline and lede, inner HTML each (ADR-143 U6), written
   *  over the shared workshop prototype's at parse time. The two buttons are
   *  the prototype's. */
  hero: { headlineHtml: string; descHtml: string };
  /** The station after the hero (ADR-143 U7): the Thoughtform equilibrium,
   *  a holographic object in three.js (a core between two ring systems).
   *  Plain text throughout; the title carries no gold word, because the
   *  object's one gold is the flow from upstream to downstream. */
  equilibrium: {
    eyebrow: string;
    title: string;
    sub: string;
    /** The three words the object names, keyed by the point the geometry
     *  gives each (`components/holo-program/equilibriumGeom.ts`). */
    labels: Readonly<Record<"downstream" | "upstream" | "encode", { key: string; text: string }>>;
  };
  /** The About's bio paragraphs, inner HTML each. The role line and the
   *  meta row are the prototype's, unchanged: the eras name the present. */
  about: readonly string[];
  /** The thesis's two paragraphs, under the homepage's title (ADR-143 U6). */
  thesis: { body1Html: string; body2Html: string };
  /** The thesis glyphs' second words, in place of See / Crystallize / Ship. */
  phases: NonNullable<CorridorCopyOverride["phaseSubs"]>;
  /** Each station's caption: the Arc's move, then what it means in practice. */
  stations: NonNullable<CorridorCopyOverride["stations"]>;
  /** The Build station's right-hand column: the agents the layer runs. */
  stack: CorridorStackCopy;
  /** The epilogue's signal line: this cut's own title, the homepage's
   *  button, no ticker (beat 10 shows the same news). */
  signal: NonNullable<CorridorCopyOverride["signal"]>;
  proof: {
    /** One line per card, in place of `card.lede`; titles stay the record's.
     *  The card heads letter the client alone, no phase (ADR-143 U6). */
    ledes: Readonly<Record<WorkshopProofTrack, string>>;
    /** The card that glows, in dark only (the route sheet). */
    lit: WorkshopProofTrack;
  };
  /** The opening slide, 01: the shared board with this cut's own title, no sub. */
  opening: ArcSectionOf<"hero-board">;
  /** 03 and 04 with this cut's own heads (ADR-143 U4): the shared figures by
   *  reference, the words turned so each beat hands to the next. V1 and the AP
   *  lecture keep the shared records (owner, 2026-10-03: "v3 only"). */
  curve: ArcSectionOf<"curve">;
  steer: ArcSectionOf<"spectrum">;
  /** 05 without its subline (owner, 2026-10-03): the question stands alone. */
  question: ArcSectionOf<"interstitial">;
}

export const WORKSHOP_INTRO: WorkshopIntro = {
  // Names the subject; 01, "How to work with a new kind of intelligence.",
  // answers it. The lede is the three parts in plain words.
  hero: {
    headlineHtml: "A new kind<br />of intelligence.",
    descHtml:
      "A workshop on how it behaves, what it needs from your team, and how to hand it real work.",
  },
  // Owner, 2026-10-04 (his Wispr note "Thoughtform workshop V3"): instant
  // ideas are no longer the edge; the balance is. His own phrase is the name.
  equilibrium: {
    eyebrow: "Before we start",
    title: "The Thoughtform equilibrium.",
    sub: "AI closed the distance between thought and form. The edge now is balance: agents run the work downstream, so people go further upstream.",
    labels: {
      downstream: { key: "Downstream", text: "Decks, analyses, synthesis" },
      upstream: { key: "Upstream", text: "Strategy, architecture, work across teams" },
      encode: { key: "Encode", text: "What works upstream runs downstream" },
    },
  },
  about: [
    "<strong>Vince</strong> has spent a decade inside digital change: social media, online communities, now <em>intelligence itself.</em>",
    // Hands over to the era's motto, "Owning the map between work and
    // intelligence."
    'Today he maps which intelligence runs which work, inside the teams that do it: at <span class="voidwalker__bio-mark">Loop Earplugs</span>, and for other teams through Thoughtform.',
  ],
  // The second paragraph is the one place the Arc is hinted at as a loop.
  thesis: {
    body1Html: "Working with it well takes practice, and it can be learned.",
    body2Html: "I do it in three moves, and make them again for every piece of work.",
  },
  // "Ship" was the Build that made tools; each word echoes its caption.
  phases: { navigate: "Learn", encode: "Write down", build: "Hand over" },
  // Part one, part two, part three of the day, without naming them: the
  // skills, the evals and the configuration are the workshop's to reveal.
  stations: {
    navigate:
      "Learn how this <em>intelligence</em> behaves before you hand it work.<br>What it does well, where it slips, and how long it can run on its own.",
    diagnostic:
      "It is already smart. What it lacks is <em>your context</em>.<br>So the team writes down what it knows, and what good looks like.",
    intelligence:
      "Set the work up for <em>agents</em> to run, with people steering.<br>Each piece gets its own, built on what the team wrote down.",
  },
  // Build is for agents now (owner, 2026-10-04): the column the homepage
  // letters as rented surfaces, with the Model lit, read as "output: model".
  // One agent per piece of work on the left, row for row, none lit.
  // ⚠ ONE SHORT WORD A CHIP: the head says AGENTS, and "Pricing agent" ran
  // the fan's lowest chip onto the right rail at 1920x1247. Each label stays
  // within two characters of the homepage's at its row ("Reports", not
  // "Reporting", which reached the rail line at 1470x956). The column is
  // tight at laptop sizes on the homepage too: its own chips sit on the
  // SECTOR and LOCAL readouts there (measured 2026-10-04).
  stack: {
    surfacesTitle: "Agents",
    surfacesSub: "what runs on the layer",
    surfaceLabels: ["Pricing", "Review", "Copy", "Support", "Reports"],
    surfaceLit: null,
  },
  // Owner, 2026-10-04: the homepage's "we embed in your team until it runs
  // without us" is an offer, and this page is a story; the practice, said as
  // what the work is. The button stays the homepage's, the ticker goes.
  // ADR-143 U7 (owner, same day): the line takes the stations' own grammar,
  // a verb in gold and its object (NAVIGATE THE INTELLIGENCE. · ENCODE THE
  // CONTEXT. · BUILD ON THE LAYER.), so it reads as the Arc's last move.
  signal: {
    titleHtml: "<em>EMBED</em> IN THE WORK<br>TO MAKE THE TEAMS SELF-SUFFICIENT.",
    ariaLabel: "Embed in the work to make the teams self-sufficient",
    ticker: false,
  },
  proof: {
    ledes: {
      "atl-films":
        "Two 30-second films made with generative models to the craft bar of live action, and run as paid media.",
      tooling:
        "Four tools built with the people who run the work, where it got stuck. Those teams own them.",
      // Evidence, not a restatement: the signal line and this card's title
      // already say the team runs it alone (ADR-143 U6).
      studio:
        "Three months after the films, every designer in the studio was making their own ads with AI.",
      "ai-transformation":
        "Then we built for the agents: what each team knows, written down, and the checks they run on their own work. The rest of today is how.",
    },
    lit: "ai-transformation",
  },
  opening: {
    ...HAND_IT_TO_AN_AGENT,
    // The title says what the day is for (owner, 2026-10-03: "how to work
    // with a new type of intelligence").
    head: {
      ...HAND_IT_TO_AN_AGENT.head,
      title: { pre: "How to work with", em: "a new kind of intelligence." },
      // No sub (owner, 2026-10-03: "don't think we need the paragraph"):
      // the title alone opens the day.
      sub: undefined,
    },
  },
  /* 02 ends on "each runs longer without you", so 03 stays on length (the
     price moves to its sub, the money's own beat is 12) and 04 turns on it. */
  curve: {
    ...THE_CURVE_BEAT,
    head: {
      ...THE_CURVE_BEAT.head,
      title: { pre: "Each release finishes longer work", em: "on its own." },
      sub: "Each release makes fewer small mistakes, so it gets further on long and difficult work. It also costs more per token, and every model has a second dial: how hard it thinks.",
    },
  },
  steer: {
    ...HARD_TO_STEER_BEAT,
    head: {
      ...HARD_TO_STEER_BEAT.head,
      title: { pre: "The longer it runs,", em: "the harder it is to steer." },
      sub: "It is a tool and a collaborator at once. Sometimes you tell it exactly what to do; sometimes you explain what you are after and let it work it out. Nothing we worked with before was both.",
    },
  },
  // The question stands alone on V3 (owner, 2026-10-03: "remove this
  // paragraph"); the AP lecture keeps the shared beat's subline.
  question: { ...REAL_QUESTION_BEAT, subline: undefined },
};
