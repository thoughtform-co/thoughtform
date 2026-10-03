import type { CorridorCopyOverride } from "@/lib/v7-parse/types";

import type { ArcSectionOf } from "../../types";
import { HAND_IT_TO_AN_AGENT } from "./handItToAnAgent";
import { HARD_TO_STEER_BEAT, THE_CURVE_BEAT } from "./workshopFraming";

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
 * ⚠ THE THESIS IS THE HOMEPAGE'S (owner, 2026-10-03, on the built page:
 * "restore the copy from the home page"). The corridor's opening beat reads
 * `extractV7Text()` unchanged, so it has no field here.
 *
 * ⚠ THE ARC KEEPS ITS OWN WORDS (owner, 2026-10-03): Navigate / Encode /
 * Build and "intelligence configuration" stay, which overrides, for this page
 * only, the Suri sprint plan's list of words kept out of the room.
 *
 * ⚠ THE COPY LAW, pinned by `workshop-intro.test.ts`: no em dash, nothing
 * from the voice skill's banned list, no digit but the frontier's
 * "30-second", one `<br>` per caption, ledes at most 180 characters.
 */

/** The four Loop tracks the pile shows, in its order (`PROOF_STACK_ORDER`). */
export type WorkshopProofTrack = "atl-films" | "tooling" | "studio" | "ai-transformation";

export interface WorkshopIntro {
  /** The About's bio paragraphs, inner HTML each. The role line and the
   *  meta row are the prototype's, unchanged: the eras name the present. */
  about: readonly string[];
  /** Each station's caption: the Arc's move, then which part of today it is. */
  stations: NonNullable<CorridorCopyOverride["stations"]>;
  /** The epilogue's signal line: the homepage's title and button, without
   *  the ticker (beat 09 shows the same news). */
  signal: NonNullable<CorridorCopyOverride["signal"]>;
  proof: {
    /** One line per card, in place of `card.lede`; titles stay the record's. */
    ledes: Readonly<Record<WorkshopProofTrack, string>>;
    /** The card that glows, in dark only (the route sheet). */
    lit: WorkshopProofTrack;
  };
  /** The opening slide, 01: the shared board with this cut's own sub. */
  opening: ArcSectionOf<"hero-board">;
  /** 03 and 04 with this cut's own heads (ADR-143 U4): the shared figures by
   *  reference, the words turned so each beat hands to the next. V1 and the AP
   *  lecture keep the shared records (owner, 2026-10-03: "v3 only"). */
  curve: ArcSectionOf<"curve">;
  steer: ArcSectionOf<"spectrum">;
}

export const WORKSHOP_INTRO: WorkshopIntro = {
  about: [
    "<strong>Vince</strong> has spent a decade inside digital change: social media, online communities, now <em>intelligence itself.</em>",
    // Hands over to the era's motto, "Owning the map between work and
    // intelligence."
    'Today he maps which intelligence runs which work, inside the teams that do it: at <span class="voidwalker__bio-mark">Loop Earplugs</span>, and for other teams through Thoughtform.',
  ],
  stations: {
    navigate:
      "Learn how this <em>intelligence</em> behaves before you hand it work.<br>Part one today: from a prompt to an agent, and why it is hard to steer.",
    diagnostic:
      "Write down what your team knows and what <em>good looks like</em>.<br>Part two: the skills and the evals an agent runs on.",
    intelligence:
      "Give each piece of work its <em>intelligence configuration</em>.<br>Part three: one motion ad, end to end, and the plugin your team installs.",
  },
  // The title and the button are the homepage's (owner, 2026-10-03: the
  // positioning line, "we embed until it runs without us", is the one to
  // keep); only the ticker goes.
  signal: { ticker: false },
  proof: {
    ledes: {
      "atl-films":
        "Two 30-second films made with generative models to the craft bar of live action, and run as paid media.",
      tooling:
        "Four tools built with the people who run the work, where it got stuck. Those teams own them.",
      studio: "Embedded in the studio until the team ran paid social with AI on its own.",
      "ai-transformation":
        "Then we built for the agents: what each team knows, written down, and the checks they run on their own work. The rest of today is how.",
    },
    lit: "ai-transformation",
  },
  opening: {
    ...HAND_IT_TO_AN_AGENT,
    head: {
      ...HAND_IT_TO_AN_AGENT.head,
      sub: "Today follows the Arc: how this intelligence behaves, what your team writes down for it, and one piece of work set up to run on its own, from a prompt to a ten-second ad.",
    },
  },
  /* 02 ends on "each runs longer without you", so 03 stays on length (the
     price moves to its sub, the money's own beat is 11) and 04 turns on it. */
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
};
