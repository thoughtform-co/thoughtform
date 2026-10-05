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
 * ⚠ THE THESIS IS THE HOMEPAGE'S, TITLE AND PARAGRAPHS (owner, 2026-10-05,
 * ADR-143 U11: "restore copy from homepage"). U6 had reworded the two
 * paragraphs; they are read from the homepage's prototype again, so this
 * record carries no thesis and the cuts pass the shared text through. The
 * glyphs' words below stay this cut's own.
 *
 * ⚠ THE INTRO BUILDS UP, IT DOES NOT GIVE AWAY (owner, 2026-10-04). The
 * captions point at the workshop's three parts in plain words and never name
 * the skills, the evals or the intelligence configuration: beat 06 reveals
 * that term. The Arc is a philosophy the work came out of, never explained;
 * so the proof cards carry no phase either.
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

/** A proof claim, `CaseBlock`'s shape restated (lib/arcs keeps no lib/cases
 *  import): a glyph key, a title of at most 27 characters, one sentence. */
export interface WorkshopProofClaim {
  glyph: string;
  title: string;
  desc: string;
}

export interface WorkshopIntro {
  /** The hero's headline and lede, inner HTML each (ADR-143 U6), written
   *  over the shared workshop prototype's at parse time. The two buttons are
   *  the prototype's. */
  hero: { headlineHtml: string; descHtml: string };
  /** The station after the hero (ADR-143 U7): the Thoughtform equilibrium,
   *  a holographic object in three.js (ADR-143 U8: a crumpled contour mass,
   *  a gold gate on a fulcrum, a receding stack of toothed rings, on one axis).
   *  ⚠ THE STATION LETTERS NO HEAD (U11, owner 2026-10-05: "don't think we
   *  need the text either"): the object and its three words carry it, and
   *  the title is the station's accessible name alone. */
  equilibrium: {
    title: string;
    /** The three words the object names, keyed by the point the geometry
     *  gives each (`components/holo-program/equilibriumGeom.ts`). */
    labels: Readonly<Record<"downstream" | "upstream" | "encode", { key: string; text: string }>>;
  };
  /** The About's bio paragraphs, inner HTML each. The role line and the
   *  meta row are the prototype's, unchanged: the eras name the present. */
  about: readonly string[];
  /** The thesis glyphs' second words, in place of See / Crystallize / Ship. */
  phases: NonNullable<CorridorCopyOverride["phaseSubs"]>;
  /** Each station's caption: the Arc's move, then what it means in practice. */
  stations: NonNullable<CorridorCopyOverride["stations"]>;
  /** The Build station's right-hand column: the agents the layer runs. */
  stack: CorridorStackCopy;
  /** The epilogue's signal line: this cut's own title, the homepage's
   *  button, no ticker (beat 09 shows the same news). */
  signal: NonNullable<CorridorCopyOverride["signal"]>;
  proof: {
    /** The pile's order on these cuts (ADR-147 U1, owner 2026-10-05): the
     *  studio right after the films, as it happened at Loop, where the
     *  homepage keeps the record's order (ADR-126). Every track once. */
    order: readonly WorkshopProofTrack[];
    /** One line per card, in place of `card.lede`; titles stay the record's.
     *  The card heads letter the client alone, no phase (ADR-143 U6). */
    ledes: Readonly<Record<WorkshopProofTrack, string>>;
    /** A card's four claims in place of the record's (ADR-147 U2): the
     *  studio's are its own rules on these cuts, where the homepage keeps
     *  the outcomes. Same glyph keys as the record's track, one each. */
    claims?: Partial<Record<WorkshopProofTrack, readonly WorkshopProofClaim[]>>;
    /** A card's title in place of the record's `arc.title` (ADR-147 U2), at
     *  most 44 characters, the record's own bound. */
    titles?: Partial<Record<WorkshopProofTrack, string>>;
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
    title: "The Thoughtform equilibrium.",
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
  // ADR-147 U1 (owner, 2026-10-05: "more concise, non AI slop"): said as
  // the work's end state, and no longer pre-empting the studio card's title,
  // which says "self-sufficient" a scroll later.
  signal: {
    titleHtml: "<em>EMBED</em> UNTIL THE TEAM<br>RUNS IT ALONE.",
    ariaLabel: "Embed until the team runs it alone",
    ticker: false,
  },
  proof: {
    order: ["atl-films", "studio", "tooling", "ai-transformation"],
    ledes: {
      "atl-films":
        "Two 30-second films by Loop's own creative team, made with generative models and run as paid media beside two live-action spots.",
      tooling:
        "Four tools built with the people who run the work, at the points where it got stuck. Those teams own and run them now.",
      // ADR-147 U1 (owner, 2026-10-05): the guardrails the studio set for
      // itself, every clause from the card's own sheets (THE GOVERNANCE,
      // THE RED LINE) and its brief; the card follows the films now.
      studio:
        "Every designer in the studio now makes their own ads with AI, inside these four lines.",
      "ai-transformation":
        "Then we built for the agents: what each team knows, written down, and the checks they run on their own work. The rest of today is how.",
    },
    // ADR-147 U2 (owner, 2026-10-05): the card is the guardrails the studio
    // set for itself, so its claims are the rules, every one from the card's
    // own sheets (THE GOVERNANCE, THE RED LINE) and its brief.
    // The title says who drew them; the record's "We make the creative team
    // self-sufficient" stays on the homepage.
    // ADR-147 U3 (owner, same day: "change the copy on the other proof cards
    // too"), then the owner's own lines, word for word: the record's "We"
    // lines in the past tense, the Studio card and the tools card his.
    titles: {
      "atl-films": "We pushed the frontiers of AI creative",
      studio: "We set guidelines that respect the craft",
      tooling: "We built tools around the creative process",
      "ai-transformation": "We built the layer agents run on",
    },
    // The three other cards' claims, digit-free (this record's copy law),
    // each from its own track's blocks and brief.
    claims: {
      "atl-films": [
        {
          glyph: "masters",
          title: "Two narrative films",
          desc: "Made with generative image and video models for top-of-funnel paid media.",
        },
        {
          glyph: "level",
          title: "The live-action bar",
          desc: "Direction, art direction, edit, colour and sound held to the standard of a shoot.",
        },
        {
          glyph: "broadcast",
          title: "On YouTube and connected TV",
          desc: "Run as paid media in the US.",
        },
        {
          glyph: "parallel",
          title: "Next to live action",
          desc: "The two AI films ran in the same campaign as two traditionally produced spots.",
        },
      ],
      tooling: [
        {
          glyph: "gap",
          title: "Too specific to buy",
          desc: "Too specific for off-the-shelf software, too small for an agency build.",
        },
        {
          glyph: "collapse",
          title: "One surface for the work",
          desc: "Five sources became one surface and five handoffs one flow. Nothing is retyped.",
        },
        {
          glyph: "ownership",
          title: "The teams own them",
          desc: "Built with whoever runs the workflow. Localization now runs its own tool end to end.",
        },
        {
          glyph: "substrate",
          title: "Shared judgment underneath",
          desc: "The tools share one written-down judgment; one was even extracted from another.",
        },
      ],
      "ai-transformation": [
        {
          glyph: "board",
          title: "Built for agents first",
          desc: "Per piece of work: which model runs it, what it can reach, what it decides, who owns it.",
        },
        {
          glyph: "encode",
          title: "Know-how, written down",
          desc: "What each team knows, written once, as the briefing every agent starts from.",
        },
        {
          glyph: "envelope",
          title: "Checks it runs on itself",
          desc: "What good looks like, written as checks: a result passes, goes to review, or is blocked.",
        },
        {
          glyph: "reuse",
          title: "Set the goal, let it run",
          desc: "Say what success looks like and let it work for hours. A person judges what comes back.",
        },
      ],
      studio: [
        {
          glyph: "field",
          title: "Identity stays photographed",
          desc: "If an image says who Loop is, or who its people are, it is real photography.",
        },
        {
          glyph: "threshold",
          title: "AI shows the scenario",
          desc: "Where an image only sets the scene for the product, AI is the right tool.",
        },
        {
          glyph: "holdfast",
          title: "No AI-generated creators",
          desc: "AI makes the pipeline faster: briefing, editing, localization. It never replaces a creator.",
        },
        {
          glyph: "cadence",
          title: "Craft gets the time back",
          desc: "What AI saves in paid social goes back into the live-action craft it should not replace.",
        },
      ],
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
  // The question stands alone on V3 (owner, 2026-10-03: "remove this
  // paragraph"); the AP lecture keeps the shared beat's subline.
  question: { ...REAL_QUESTION_BEAT, subline: undefined },
};
