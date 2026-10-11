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
 * ⚠ THE OWNER'S PICK OF 11 OCTOBER ("Whole"): the approach is his
 * eight-step outline drawn as one run, read whole on one screen, and the
 * two lines follow it. Both are production now, so `run` and `lines` are
 * the first values; the runway and the rail over the run came out with the
 * pick. `plates` keeps the beat as it shipped before the run (ADR-153's
 * three plates and two time bars), and `stack` ADR-155's figure; neither
 * may carry the run (`ArcHandoff` draws `ArcConfigRun` whenever it is set),
 * so both clear it.
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
  const plates = knobs.approach === "plates";
  const noUpstream = knobs.upstream === "off";
  const horizon = knobs.upstream === "horizon";
  const pinned = knobs.engine === "pinned";
  const visionTeam = knobs.vision === "team";
  const visionPhases = knobs.vision === "phases";
  const anyKnob =
    narrative ||
    quote ||
    mark ||
    ledger ||
    stack ||
    plates ||
    noUpstream ||
    horizon ||
    pinned ||
    visionTeam ||
    visionPhases;

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
  const visionBase: ArcSectionOf<"leverage"> = narrative
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

  /* The vision in another route (the lab, 2026-10-11; the owner: the
     console's IA and its 2×2 stay, "the models, that's already part of
     Claude Enterprise", "what's missing is THE TEAM"). The models tier
     goes and the team arrives; the note's sentence moves into the head.
     The team is the instrument record's workstreams and owners, by
     reference; the connectors the plugin's; the layer's line the vision's
     own plate's. `team` keeps the console (its readout spelled, no digit);
     `phases` is one housing cut into three rows with a sentence a row. */
  const prodEngine = sectionOf("engine", "instrument");
  const visionRoute = (kind: "team" | "phases"): ArcSectionOf<"leverage"> => ({
    ...visionBase,
    head: {
      ...visionBase.head,
      sub: "Every company gets the same models and the same Claude. What makes them work like X-Bionic is the layer your team writes down: written with Thoughtform in your Claude in phase one, and handed over with an owner per workstream.",
    },
    readout:
      kind === "team"
        ? [
            { label: "Team", value: "Four workstreams" },
            { label: "Layer", value: "Owned" },
            { label: "Claude", value: "In place" },
          ]
        : visionBase.readout,
    figure: {
      kind,
      levels: { team: "The team", layer: "The layer", host: "Claude Enterprise" },
      layerLine: visionBase.stack[0].line,
      connectors: prodEngine.face?.connectors ?? [],
      courses: {
        skills: ["The product voice", "The product facts", "The brief"],
        evals: ["The copywriter's checks", "The product designer's checks"],
      },
      tiles: X_BIONIC_INSTRUMENT.org!.workstreams.map((w) => ({
        id: w.id,
        name: w.bucket ?? w.name,
        role: w.line ?? "",
      })),
      ...(kind === "phases"
        ? {
            lines: [
              "Your team, on the four workstreams it already runs.",
              "The skills and the evals the team writes down, in phase one.",
              "Plugged into the Claude Enterprise X-Bionic already runs.",
            ] as const,
          }
        : {}),
      alt:
        kind === "team"
          ? "The team on the stack: X-Bionic's Claude Enterprise as a plain slab with Shopify, analytics and the ad accounts running in under it; the layer the team writes, gold and hatched, over it; the four workstreams standing on the layer, a person on each: creative production, creative ops, creative review and creative strategy, run by the copywriter and the creative lead, the digital team, the product designer and the paid social lead."
          : "Three phases, read down: the team on the four workstreams it already runs, a person on each; the layer the team writes, with the product voice, the product facts and the brief as skills and the copywriter's and the product designer's checks as evals; and the Claude Enterprise X-Bionic already runs, with Shopify, analytics and the ad accounts plugged into it.",
    },
  });
  const plugsIn: ArcSectionOf<"leverage"> = visionTeam
    ? visionRoute("team")
    : visionPhases
      ? visionRoute("phases")
      : visionBase;

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
        run: undefined,
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
    : plates
      ? /* The beat as it shipped before the run (ADR-153): three plates
           with a verb each, and where the team's time goes, today against
           configured. Its own words, kept here so the lab can still argue
           the plates against the run. */
        {
          ...prodAdoption,
          id: approachId,
          head: {
            ...prodAdoption.head,
            sub: "Claude can only automate what your team has written down. So adoption comes first: the team learns on its own work, then Claude takes the repetitive part.",
          },
          steps: [
            { ...prodAdoption.steps[0], label: "Adopt" },
            { ...prodAdoption.steps[1], label: "Write it down" },
            { ...prodAdoption.steps[2], label: "Automate" },
          ],
          run: undefined,
          time: {
            label: "Where your team's time goes",
            note: "Illustrative",
            rows: [
              {
                label: "Today",
                segments: [
                  { label: "Making and resizing", share: 0.55 },
                  { label: "Admin", share: 0.25 },
                  { label: "Ideas", share: 0.2, lit: true },
                ],
              },
              {
                label: "Configured",
                segments: [
                  { label: "Checking", share: 0.2 },
                  { label: "Ideas, briefs and campaigns", share: 0.8, lit: true },
                ],
              },
            ],
          },
        }
      : narrative
        ? { ...prodAdoption, id: approachId }
        : prodAdoption;

  /* Longer tasks. Production is the owner's two lines (outline steps 7 and
     8, picked with the run on 11 October); `off` lets the approach carry
     the claim alone, and `horizon` draws it as the owned horizon: the
     team's day upstream, the agent's run reaching up three times. */
  const prodUpstream = sectionOf("upstream", "horizon");
  const upstream: ArcSectionOf<"horizon"> | null = noUpstream
    ? null
    : horizon
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
      : prodUpstream;

  const proofLoop = opener("proof-loop", 1, quote);
  const proofBrands = opener("proof-brands", 2, quote);
  const offer = opener("offer", 3, quote);

  const prodReturn = sectionOf("return", "crew");
  const ret: ArcSectionOf<"crew"> = ledger ? { ...prodReturn, layout: "returns" } : prodReturn;

  const jobs: readonly ArcSectionOf<"job">[] = mark
    ? X_BIONIC_JOBS.map((j) => ({ ...j, top: "mark" as const }))
    : X_BIONIC_JOBS;

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
