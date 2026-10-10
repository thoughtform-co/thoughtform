import { disciplineOf } from "@/lib/arcs/content/shared/disciplines";
import { X_BIONIC_JOBS } from "@/lib/arcs/content/shared/jobs";
import { LOOP_PROOF_CARDS } from "@/lib/arcs/content/shared/loopProof";
import { TOOL_AND_COLLABORATOR } from "@/lib/arcs/content/shared/toolAndCollaborator";
import { X_BIONIC_PROPOSAL_ARC } from "@/lib/arcs/content/x-bionic-proposal";
import type { ArcDef, ArcJobBucket, ArcSection, ArcSectionOf } from "@/lib/arcs/types";
import { X_BIONIC_INSTRUMENT } from "@/lib/instrument/records/x-bionic";

import type { PsKnobs } from "./variants";

/**
 * xBionicV2 — the X-Bionic proposal recomposed per knob (the proposal
 * system, 2026-10-10). Every section is the production record's own object
 * or a spread of it, so a fix on `lib/arcs/content/**` lands here too; at
 * the defaults the function returns production's `sections` BY REFERENCE
 * (the vitest pins `toBe`), and the lab is byte-identical to the page. A
 * beat no knob touches is production's object, never a copy.
 *
 * ⚠ NEVER REGISTERED IN `ARCS`: the registry guards do not walk this; its
 * own test does. `sectionOf` THROWS on a miss, so a renamed production beat
 * breaks the lab loudly rather than drawing a stale one, and the test pins
 * that without the order knob the lab keeps production's beats in
 * production's order, so a beat added to the page cannot go missing here.
 *
 * ⚠ THE MERGE WITH THE X-BIONIC BRANCH (2026-10-10): production is what the
 * owner picked there, the jobs' gold band (ADR-153 U4), Loop's return as a
 * case card (U5), the engine as the layer opened (U6) and his three lines
 * alone on a screen. Each knob's first value names that and its second is
 * ADR-155's direction, argued against it. ⚠ A `face` and a `pin` never share
 * a section: the face replaces the figure the pin lights, so the pinned
 * engine drops the face.
 *
 * ⚠ THE OWNER'S ORDER (10 October): about · the vision · the approach ·
 * where it plugs in · "In 2024, Loop decided to go AI-first." · the four
 * Loop cards · what it returned · "This is how we recently built
 * intelligence configurations by making the team self-sufficient." · the
 * four jobs · "And this is how we'll do it at X-Bionic." · the engine · the
 * two weeks · who takes part · the fee · the close.
 *
 * ⚠ NEVER THE FIRST PERSON SINGULAR on a proposal (owner, 10 October): the
 * page speaks as Thoughtform and to "your team"; his three lines say "we"
 * and are his own. The copy law walks every composition in the test.
 */

const PROD = X_BIONIC_PROPOSAL_ARC;

function sectionOf<K extends ArcSection["kind"]>(id: string, kind: K): ArcSectionOf<K> {
  const hit = PROD.sections.find((s) => s.id === id);
  if (!hit || hit.kind !== kind) {
    throw new Error(`xBionicV2: production has no "${kind}" section "${id}"`);
  }
  return hit as ArcSectionOf<K>;
}

/** A part opener. Production's line alone on a screen, by reference; under
 *  `quote`, ADR-155's chapter band: the part ruler over the same line. */
function opener(id: string, n: number, quote: boolean): ArcSectionOf<"interstitial"> {
  const prod = sectionOf(id, "interstitial");
  if (!quote) return prod;
  return {
    id,
    kind: "interstitial",
    variant: "chapter",
    chapter: { n, of: 3 },
    menuLabel: prod.menuLabel,
    menuPrimary: true,
    line: prod.line,
  };
}

export function xBionicV2(knobs: PsKnobs): ArcDef {
  const narrative = knobs.order === "narrative";
  const quote = knobs.interstitial === "quote";
  const mark = knobs.jobHead === "mark";
  const ledger = knobs.return === "ledger";
  const stack = knobs.approach === "stack";
  const horizon = knobs.upstream === "horizon";
  const pinned = knobs.engine === "pinned";
  const anyKnob = narrative || quote || mark || ledger || stack || horizon || pinned;

  if (!anyKnob) return PROD;

  /* ── The beats, each production's object or a spread of it ─────────── */

  const about = sectionOf("about", "portrait");

  const vision: ArcSectionOf<"spectrum"> = {
    id: "vision",
    kind: "spectrum",
    menuLabel: "The vision",
    menuPrimary: true,
    head: {
      eyebrow: "Thoughtform · the vision",
      title: { pre: "AI sits between a tool", em: "and a collaborator." },
      sub: "It takes instructions like software and interprets intent like a colleague. The work is to give it what it does well, and to keep the judging with your team.",
    },
    ...TOOL_AND_COLLABORATOR,
  };

  const prodLeverage = sectionOf("vision", "leverage");
  const plugsIn: ArcSectionOf<"leverage"> = narrative
    ? {
        ...prodLeverage,
        id: "plugs-in",
        menuLabel: "Where it plugs in",
        menuPrimary: undefined,
        head: {
          eyebrow: "X-Bionic · where it plugs in",
          title: { pre: "Where the configuration sits", em: "in your Claude Enterprise." },
          sub: "Every company gets the same models and the same Claude. What makes them work like X-Bionic is the layer your team writes down, in the Claude you already run.",
        },
      }
    : prodLeverage;

  const prodAdoption = sectionOf("adoption", "handoff");
  const approachId = narrative ? "approach" : "adoption";
  const approach: ArcSectionOf<"handoff"> = stack
    ? {
        ...prodAdoption,
        id: approachId,
        menuLabel: "The approach",
        head: {
          eyebrow: "Thoughtform · the approach",
          title: { pre: "An intelligence configuration,", em: "built with your team." },
          sub: "Claude can only automate what your team has written down. So adoption comes first: the team learns on its own work, writes down how it is done, and Claude takes the repetitive part from there.",
        },
        time: undefined,
        figure: {
          layer: "Your layer",
          host: "X-Bionic's Claude Enterprise",
          courses: {
            skills: ["The product voice", "The brief", "Intake and naming", "Pre-review"],
            evals: ["The copy editor's checks", "The designer's checks"],
          },
          /* The tile's mono chip is the discipline's short word (its cap
             is 12); the record's bucket is the owner's long name. */
          tiles: X_BIONIC_INSTRUMENT.org!.workstreams.map((w) => ({
            id: w.id,
            bucket: disciplineOf(w.id as ArcJobBucket).word,
            name: w.name,
            line: w.line ?? "",
            ...(w.lit?.length ? { lit: true as const } : {}),
          })),
          alt: "The layer being written: four workstreams on the layer the team writes, the product voice, the brief, intake and naming and pre-review as its skills, the copy editor's and the product designer's checks as its evaluations, on X-Bionic's Claude Enterprise.",
        },
      }
    : narrative
      ? { ...prodAdoption, id: approachId }
      : prodAdoption;

  const upstream: ArcSectionOf<"horizon"> | null = horizon
    ? {
        id: "upstream",
        kind: "horizon",
        menuLabel: "Longer tasks",
        head: {
          eyebrow: "Thoughtform · what it buys",
          title: { pre: "Longer tasks for Claude,", em: "upstream time for your team." },
          sub: "Once the work is written down, Claude can be given a whole task rather than a prompt every five minutes. It checks its own work, retries, and asks when it is unsure, so the team's day goes to the brief, the campaign and what to test next.",
        },
        owner: {
          key: "The owner",
          name: "The paid social lead and the creative lead",
          rows: [
            { tag: "Writes", line: "How the work is done" },
            { tag: "Sets", line: "What a good result looks like" },
            { tag: "Decides", line: "What goes out" },
          ],
        },
        upstream: {
          label: "Your team, upstream",
          spans: ["The brief", "The campaign", "What to test next"],
          line: "The brief, the campaign and what to test next, with Claude checking in once.",
        },
        agent: {
          label: "Claude, on the rest",
          start: "You set the goal and the checks",
          gates: [
            { kind: "check", at: 0.18, label: "Checks its own work" },
            { kind: "retry", at: 0.5, label: "Steps back and retries" },
            { kind: "ask", at: 0.72, label: "Checks in with you" },
          ],
          end: "You judge the result",
        },
      }
    : null;

  const proofLoop = opener("proof-loop", 1, quote);
  const proofBrands = opener("proof-brands", 2, quote);
  const offer = opener("offer", 3, quote);

  const prodReturn = sectionOf("return", "crew");
  const ret: ArcSectionOf<"crew"> = ledger ? { ...prodReturn, layout: "returns" } : prodReturn;

  const jobs: readonly ArcSectionOf<"job">[] = mark
    ? X_BIONIC_JOBS.map((j) => ({ ...j, top: "mark" as const }))
    : X_BIONIC_JOBS;

  const prodEngine = sectionOf("engine", "instrument");
  const engine: ArcSectionOf<"instrument"> = pinned
    ? { ...prodEngine, face: undefined, pin: true }
    : prodEngine;

  const phases = sectionOf("phases", "list-groups");
  const howWeWork = sectionOf("how-we-work", "list-groups");
  const pricing = sectionOf("pricing", "terms");
  const close = sectionOf("close", "close");

  const opening: ArcSection[] = narrative
    ? [about, vision, approach, ...(upstream ? [upstream] : []), plugsIn]
    : [about, plugsIn, approach, ...(upstream ? [upstream] : [])];

  const sections: ArcSection[] = [
    ...opening,
    proofLoop,
    ...LOOP_PROOF_CARDS,
    ret,
    proofBrands,
    ...jobs,
    offer,
    engine,
    phases,
    howWeWork,
    pricing,
    close,
  ];

  return { ...PROD, slug: "x-bionic-proposal-v2", sections };
}
