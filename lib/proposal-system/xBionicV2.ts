import { DISCIPLINE_ORDER, disciplineOf } from "@/lib/arcs/content/shared/disciplines";
import { X_BIONIC_JOBS } from "@/lib/arcs/content/shared/jobs";
import { LOOP_PROOF_CARDS, LOOP_RETURN, VINCE_ABOUT } from "@/lib/arcs/content/shared/loopProof";
import { TOOL_AND_COLLABORATOR } from "@/lib/arcs/content/shared/toolAndCollaborator";
import { X_BIONIC_PROPOSAL_ARC } from "@/lib/arcs/content/x-bionic-proposal";
import type { ArcDef, ArcSection, ArcSectionOf } from "@/lib/arcs/types";
import { X_BIONIC_INSTRUMENT } from "@/lib/instrument/records/x-bionic";
import type { InstrumentRecord } from "@/lib/instrument/types";

import type { PsKnobs } from "./variants";

/**
 * xBionicV2 — the X-Bionic proposal recomposed per knob (the proposal
 * system, 2026-10-10). Every section is the production record's own object
 * or a spread of it, so a fix on `lib/arcs/content/**` lands here too; at
 * the defaults the function returns production's `sections` BY REFERENCE
 * (the vitest pins `toBe`), and the lab is byte-identical to the page.
 *
 * ⚠ NEVER REGISTERED IN `ARCS`: the registry guards do not walk this; its
 * own test does. `sectionOf` THROWS on a miss, so a renamed production beat
 * breaks the lab loudly rather than drawing a stale one.
 *
 * ⚠ THE OWNER'S ORDER (10 October): about · the vision · the approach ·
 * where it plugs in · "In 2024, Loop decided to go AI-first." · the four
 * Loop cards · what it returned · "the same configuration, at two more
 * brands" · the four jobs · "and this is how we set it up at X-Bionic" ·
 * the engine · the two weeks · who takes part · the fee · the close.
 *
 * ⚠ NEVER THE FIRST PERSON on a proposal (owner, 10 October): the page
 * speaks as Thoughtform and to "your team". The sweep below is what the
 * production record takes at promotion.
 */

const PROD = X_BIONIC_PROPOSAL_ARC;

function sectionOf<K extends ArcSection["kind"]>(id: string, kind: K): ArcSectionOf<K> {
  const hit = PROD.sections.find((s) => s.id === id);
  if (!hit || hit.kind !== kind) {
    throw new Error(`xBionicV2: production has no "${kind}" section "${id}"`);
  }
  return hit as ArcSectionOf<K>;
}

/* The three part openers. `quote` is the ruler and the line alone. */
const QUOTE = {
  loop: { pre: "In 2024, Loop decided to go", em: "AI-first." },
  brands: { pre: "The same configuration, built with", em: "two more teams since." },
  offer: { pre: "And this is how we set it up", em: "at X-Bionic." },
} as const;

function chapter(
  id: string,
  n: number,
  line: { pre: string; em: string },
  menuLabel: string,
  quote: boolean
): ArcSectionOf<"interstitial"> {
  const prod = sectionOf(id, "interstitial");
  if (!quote) return { ...prod, line };
  return {
    id,
    kind: "interstitial",
    variant: "chapter",
    chapter: { n, of: 3 },
    menuLabel,
    menuPrimary: true,
    line,
  };
}

/** The instrument record with its workstreams in the disciplines' order:
 *  the engine's tiles, the jobs and the 2×2 as one vocabulary. */
function instrumentInOrder(record: InstrumentRecord): InstrumentRecord {
  if (!record.org) return record;
  const streams = [...record.org.workstreams].sort(
    (a, b) =>
      DISCIPLINE_ORDER.indexOf(a.id as (typeof DISCIPLINE_ORDER)[number]) -
      DISCIPLINE_ORDER.indexOf(b.id as (typeof DISCIPLINE_ORDER)[number])
  );
  return { ...record, org: { ...record.org, workstreams: streams } };
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

  const about: ArcSection = narrative
    ? {
        ...sectionOf("about", "portrait"),
        head: { ...sectionOf("about", "portrait").head, eyebrow: VINCE_ABOUT.head.eyebrow },
      }
    : sectionOf("about", "portrait");

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
  const plugsIn: ArcSectionOf<"leverage"> = {
    ...prodLeverage,
    id: narrative ? "plugs-in" : "vision",
    menuLabel: narrative ? "Where it plugs in" : "The approach",
    menuPrimary: narrative ? undefined : true,
    head: narrative
      ? {
          eyebrow: "X-Bionic · where it plugs in",
          title: { pre: "Where the configuration sits", em: "in your Claude Enterprise." },
          sub: "Every company gets the same models and the same Claude. What makes them work like X-Bionic is the layer your team writes down, in the Claude you already run.",
        }
      : prodLeverage.head,
    uses: {
      label: prodLeverage.uses.label,
      items: narrative
        ? (DISCIPLINE_ORDER.map((id) => {
            const d = disciplineOf(id);
            const prodItem = prodLeverage.uses.items.find((u) => u.id === id);
            if (!prodItem) throw new Error(`xBionicV2: the 2×2 has no "${id}"`);
            return { ...prodItem, label: d.long, glyph: d.glyph };
          }) as unknown as ArcSectionOf<"leverage">["uses"]["items"])
        : prodLeverage.uses.items,
    },
  };

  const prodAdoption = sectionOf("adoption", "handoff");
  const approach: ArcSectionOf<"handoff"> = stack
    ? {
        ...prodAdoption,
        id: narrative ? "approach" : "adoption",
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
          tiles: X_BIONIC_INSTRUMENT.org!.workstreams.map((w) => ({
            id: w.id,
            bucket: w.bucket ?? w.id,
            name: w.name,
            line: w.line ?? "",
            ...(w.lit?.length ? { lit: true as const } : {}),
          })),
          alt: "The layer being written: four workstreams on the layer the team writes, the product voice, the brief, intake and naming and pre-review as its skills, the copy editor's and the product designer's checks as its evaluations, on X-Bionic's Claude Enterprise.",
        },
      }
    : { ...prodAdoption, id: narrative ? "approach" : "adoption" };

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

  const proofLoop = chapter("proof-loop", 1, QUOTE.loop, "Proof · Loop", quote);
  const proofBrands = chapter("proof-brands", 2, QUOTE.brands, "Proof · two brands", quote);
  const offer = chapter("offer", 3, QUOTE.offer, "The offer", quote);

  const ret: ArcSectionOf<"crew"> = ledger ? { ...LOOP_RETURN, layout: "returns" } : LOOP_RETURN;

  const jobsOrdered = narrative
    ? DISCIPLINE_ORDER.map((bucket, i) => {
        const job = X_BIONIC_JOBS.find((j) => j.bucket === bucket);
        if (!job) throw new Error(`xBionicV2: no job for "${bucket}"`);
        return { ...job, n: i + 1 };
      })
    : [...X_BIONIC_JOBS];
  const jobs: ArcSectionOf<"job">[] = jobsOrdered.map((j) =>
    mark ? { ...j, top: "mark" as const } : j
  );

  const prodEngine = sectionOf("engine", "instrument");
  const engine: ArcSectionOf<"instrument"> = {
    ...prodEngine,
    record: narrative ? instrumentInOrder(prodEngine.record) : prodEngine.record,
    pin: pinned ? true : undefined,
  };

  const phases = sectionOf("phases", "list-groups");
  const howWeWork = sectionOf("how-we-work", "list-groups");
  const pricing = sectionOf("pricing", "terms");
  const close = sectionOf("close", "close");

  const sections: ArcSection[] = narrative
    ? [
        about,
        vision,
        approach,
        ...(upstream ? [upstream] : []),
        plugsIn,
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
      ]
    : [
        about,
        plugsIn,
        approach,
        ...(upstream ? [upstream] : []),
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

  return {
    ...PROD,
    slug: "x-bionic-proposal-v2",
    hero: narrative
      ? {
          ...PROD.hero,
          actions: [
            { id: "read", label: "The vision", href: "#vision", primary: true },
            { id: "plan", label: "The two weeks", href: "#phases" },
          ],
        }
      : PROD.hero,
    sections,
  };
}
