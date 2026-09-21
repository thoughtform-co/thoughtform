/**
 * The proposal skeleton (ADR-098) — one `ArcDef` module, with the house
 * parts written and the client's four inputs interpolated.
 *
 * ⚠ IT SHIPS FINISHED COPY, NOT PLACEHOLDERS. A scaffold that registered
 * an arc full of `[brackets]` would leave `npm run verify` failing on a
 * repo nobody had opened yet — and Armada's day-one command runs this
 * unattended. Every sentence here is the house's own argument, true of any
 * engagement; what a person then replaces is the CONTENT the fill-in list
 * names, not the scaffolding around it.
 *
 * The one bracket that survives is the configuration's ghost tile, which
 * is the honest register for a workstream that is not scoped yet — and the
 * registry test's placeholder walk exempts exactly that string.
 *
 * Pure and export-only, so `tests/lib/new-arc-scaffold.test.ts` can run it
 * without touching the filesystem.
 */

/** `Suri` → `SURI`, `Tom on the Moon` → `TOM_ON_THE_MOON`. */
export const constantCase = (slug) => slug.replace(/[^a-z0-9]+/gi, "_").toUpperCase();

/** A TypeScript string literal with the quotes and escapes a name needs. */
const q = (value) => JSON.stringify(String(value));

/**
 * `date` is the day the engagement is FILED (ADR-118): the arcs overview plots
 * it. It is a parameter, never read off the clock here, so the template stays
 * pure and its test deterministic; the script passes today unless told.
 */
export function proposalModule({ client, name, engagement = "proposal", kind = "production", date }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date ?? ""))) throw new Error(`proposalModule: a YYYY-MM-DD date is required, got ${date}`);
  const slug = `${client}-${engagement}`;
  const CONST = `${constantCase(slug)}_ARC`;
  const N = name;
  return `import type { ArcDef } from "../types";

import { MODE_LEGEND } from "./shared/loop-tools";

/**
 * ${N}, the ${engagement}, as an arc (ADR-098).
 *
 * Scaffolded by \`scripts/new-arc.mjs\`. The house parts below are written;
 * what wants ${N}'s own words is the configuration's teams, the phases,
 * the fee, the people and the next steps.
 *
 * ⚠ IT IS ADDRESSED TO ONE READER, so it may print the fee, the names and
 * the dates, and it is therefore deliberately OUTSIDE \`ENVELOPE_ARCS\`,
 * whose job is a page forwarded to strangers.
 *
 * ⚠ THE PROOF IS LOOP'S, BY REFERENCE. The films, the sheets and the
 * briefing agent resolve the casefile's own records, so a correction lands
 * in one place and nothing about Loop is retyped here.
 */
export const ${CONST}: ArcDef = {
  slug: ${q(slug)},
  format: "proposal",
  client: ${q(client)},
  kind: ${q(kind)},
  // A proposal is out until the client answers it (ADR-114).
  status: "proposed",
  // Filed today; the overview's monitor plots it (ADR-118). OWNER-TO-CONFIRM.
  date: ${q(date)},
  theme: "light",
  cardTitle: ${q(`${N} · the ${engagement}`)},
  cardLede:
    ${q(`What ${N}'s team would own, and the phases that get them there.`)},
  cardImage: { src: "/images/services/embedded.webp", alt: "" },
  hero: {
    eyebrow: ${q(`Proposal · ${N}`)},
    title: { pre: "Creative teams that", em: "scale themselves." },
    lede: ${q(
      `A proposal for ${N}. Three years of building AI capability inside a creative team, turned into phases for ${N}'s own team.`
    )},
    image: {
      src: "/images/Thoughtform_Key%20Visual_14d.webp",
      alt: "",
      width: 2400,
      height: 1350,
    },
    plate: "gateway",
    curtain: true,
    actions: [{ id: "read", label: "The configuration", href: "#configuration", primary: true }],
  },
  meta: {
    title: ${q(`${N} · ${engagement} — Thoughtform`)},
    description: ${q(`What ${N}'s team would own, and the phases that get them there.`)},
  },
  sections: [
    {
      id: "what-we-build",
      kind: "cards",
      menuLabel: "What we build",
      menuPrimary: true,
      columns: 4,
      head: {
        eyebrow: "Thoughtform · what is actually delivered",
        title: { pre: "What we", em: "actually build." },
        sub: "The measure of this work is what the team can do after we leave, and whether it can run at the pace of external change.",
      },
      cards: [
        {
          id: "people",
          n: "01",
          kicker: "Upskilling",
          title: "People who reach for it",
          body: "Designers who use AI the way they use Figma, because they know what it is good at and where it will confidently get things wrong.",
        },
        {
          id: "encoded",
          n: "02",
          kicker: "Encoding",
          title: "Your way of working, written down",
          body: "Brand, tone of voice, standards and what gets sent back, as plain files any new hire can read and any agent can follow.",
        },
        {
          id: "handover",
          n: "03",
          kicker: "Handover",
          title: "A setup they run themselves",
          body: "The team works the loop with their own hands before we stop showing up. Handover is a real production run, not a document.",
        },
        {
          id: "independence",
          n: "04",
          kicker: "Independence",
          title: "Running at the pace of change",
          body: "Files and their own accounts. No platform to license, no subscription to renew. When a better model ships, the setup takes it: nothing to migrate, no one to wait on.",
        },
      ],
    },
    {
      id: "loop-decided",
      kind: "interstitial",
      variant: "callout",
      eyebrow: "Part one · Loop, 2024 to now",
      line: {
        pre: "In 2024, Loop's executive team decided the company would be",
        em: "AI-first.",
      },
      subline:
        "Creative operations was the biggest immediate win, so it became the first focus. What follows is what that decision produced, in the order it happened.",
    },
    {
      id: "films",
      kind: "films",
      menuLabel: "Films",
      menuPrimary: true,
      ariaLabel: "The above-the-line films Loop made with AI",
      head: {
        eyebrow: "Loop Earplugs · September 2025",
        title: { pre: "The first films made with AI,", em: "above the line." },
        sub: "Two thirty-second films, made end to end with AI by the same director, editor, colourist and sound team as Loop's live-action spots. On air in October, among the first brands in the world to do it.",
      },
    },
    {
      id: "studio",
      kind: "sheets",
      menuLabel: "Studio",
      ariaLabel: "Loop Studio, the output, the rule and the limit",
      head: {
        eyebrow: "Loop Earplugs · December 2025",
        title: { pre: "Every designer makes", em: "their own ads." },
        sub: "By the end of 2025 the studio produced its paid social in-house, above the return threshold, with nothing about the creative standard lowered to get there. The line and the red line are how it decides what AI may make.",
      },
    },
    {
      id: "briefing-agent",
      kind: "dossier",
      menuLabel: "Own software",
      toolId: "mimir",
      legend: MODE_LEGEND.Invent,
    },
    {
      id: "turn",
      kind: "interstitial",
      variant: "callout",
      eyebrow: ${q(`Part two · ${N}`)},
      line: { pre: ${q(`${N} does not need`)}, em: "three years of this." },
      subline:
        ${q(
          `The products, the brand and the review taste are already ${N}'s. We bring the order to do it in, and the method for writing a team's judgment down. The tools wrapping the models change every quarter, and every subscription is a bet on one of them. What lasts is a team that works the models directly.`
        )},
    },
    {
      /* FILL IN: the teams, and the five answers each. One tile per
         workstream the engagement will stand up, the first one being what
         phase one builds. */
      id: "configuration",
      kind: "configuration",
      menuLabel: "The setup",
      menuPrimary: true,
      ariaLabel: ${q(`The AI capability ${N}'s team would own`)},
      head: {
        eyebrow: ${q(`${N} · what the team owns`)},
        title: { pre: "AI capability", em: "your team owns." },
        sub: ${q(
          `One setup that ${N}'s team runs and keeps building after we leave. Adoption writes the layer, automation runs on it. Pick a workstream to see how the same layer is read differently.`
        )},
      },
      owner: ${q(`Owned by ${N}`)},
      layer: [
        { id: "rules", tag: "Rules", name: "how the team decides" },
        { id: "examples", tag: "Examples", name: "what good looks like" },
        { id: "sources", tag: "Sources", name: "what it can read" },
        { id: "loops", tag: "Loops", name: "who confirms it" },
      ],
      seam: {
        adoption: "The team learns on its own work and writes down what good looks like.",
        automation: "The layer runs inside the tools they already use, and hands the time back.",
      },
      teams: [
        {
          id: "imagery",
          name: "Imagery",
          work: "stills and video, M1",
          layers: ["rules", "examples", "sources", "loops"],
          owner: "The creative lead, the last gate",
          runs: ${q(`The imagery Skill, on ${N}'s keys`)},
          bar: "On-brand, graded before the lead opens the sheet",
          reach: ${q(`${N}'s products and brand definition`)},
          where: "Claude, with image generation",
        },
        {
          id: "composition",
          name: "Composition",
          work: "layout, type and motion, M2",
          layers: ["rules", "examples", "loops"],
          owner: "The creative lead, with the team",
          runs: "The composition Skill",
          bar: "Layout, type and CTA that pass the rubric",
          reach: "The approved frames and the design standards",
          where: "Claude, connected to Figma",
        },
        {
          id: "ads",
          name: "Ads",
          work: "brief to finished ad, M3",
          layers: ["rules", "sources", "loops"],
          owner: "Whoever writes the brief",
          runs: "The briefing Skill",
          bar: "A finished ad, on brand, from one brief",
          reach: "The imagery and composition Skills, the product facts",
          where: "Claude, where the brief is written",
        },
      ],
      next: { name: "[Next team]", work: "the next workflow" },
      kickers: ["One configuration", "The people run it", "No vendor in the way"],
    },
    {
      /* FILL IN: the weeks. Three phases, one motion each, and the outcome
         as the column's last ruled row. */
      id: "phases",
      kind: "list-groups",
      menuLabel: "Phases",
      menuPrimary: true,
      layout: "columns",
      head: {
        eyebrow: ${q(`${N} · the shape of the work`)},
        title: { pre: "We propose running this in", em: "three phases." },
        sub: "Discovery, imagery and video first, then composition, then ads and the handover. One motion leads each phase, and M2 and M3 firm up once M1 discovery has told us what they should be.",
      },
      groups: [
        {
          id: "m1",
          label: "M1 · Discovery, imagery and video",
          blurb: ${q(`Navigate leads. Weeks 1 to 3, building the intuition on ${N}'s own work.`)},
          items: [
            {
              id: "m1w1",
              tag: "Week 1",
              name: "On site",
              body: "Kickoff with the team. The systems mapped, and the setup stood up with the designers.",
            },
            {
              id: "m1w2",
              tag: "Week 2",
              name: "Brand and tone of voice encoded, in the lead's words",
              body: "First imagery waves, run by the designers, graded with the lead in the room.",
            },
            {
              id: "m1w3",
              tag: "Week 3",
              name: "First video: approved stills animated into simple clips",
              body: "M1 review.",
            },
            {
              id: "m1out",
              tag: "Outcome",
              name: "Imagery Skill and first clips live",
              meta: "About three weeks",
            },
          ],
        },
        {
          id: "m2",
          label: "M2 · Composition",
          blurb: "Encode leads. Weeks 4 to 6, writing down the judgment the team is already using.",
          items: [
            {
              id: "m2w1",
              tag: "Week 1",
              name: "Kickoff workshop: the team reviews M1 output",
              body: "Designers begin layout, type and CTA in Figma.",
            },
            {
              id: "m2w2",
              tag: "Week 2",
              name: "Iteration workshops",
              body: "Guardrails encoded from what comes back. Simple animations composed into the formats.",
            },
            {
              id: "m2w3",
              tag: "Week 3",
              name: "The designers run composition alone",
              body: "M2 review.",
            },
            {
              id: "m2out",
              tag: "Outcome",
              name: "Composition Skill encoded",
              meta: "About three weeks",
            },
          ],
        },
        {
          id: "m3",
          label: "M3 · Ads and handover",
          blurb: "Build leads. Weeks 7 to 9, handing the system over while we watch.",
          items: [
            {
              id: "m3w1",
              tag: "Week 1",
              name: "Workshop: the team builds the briefing Skill with us",
              body: "Structure and above-the-line session.",
            },
            {
              id: "m3w2",
              tag: "Week 2",
              name: "A designer takes a brief to a finished ad, tested",
              body: ${q(`The handover pack: files, rubric and record, on ${N}'s keys.`)},
            },
            {
              id: "m3w3",
              tag: "Week 3",
              name: "Handover workshop: the team runs it, we watch",
              body: "Then it scales: the next asset type, campaign and team.",
            },
            {
              id: "m3out",
              tag: "Outcome",
              name: "Handover complete, ready to scale",
              meta: "About three weeks",
            },
          ],
        },
      ],
      closing:
        "M2 and M3 are our current view of the work. They confirm at the end of M1, when discovery has said what they should be.",
    },
    {
      /* FILL IN: the people, and how much of their week this takes. */
      id: "how-we-work",
      kind: "list-groups",
      menuLabel: "The loop",
      layout: "columns",
      head: {
        eyebrow: ${q(`${N} · inside every phase`)},
        title: { pre: "How we work together,", em: "inside every phase." },
        sub: ${q(
          `One loop, run with ${N}'s team. We set it up in week one, then run it beside them until they are running it without us.`
        )},
      },
      groups: [
        {
          id: "loop",
          label: "The loop, on one workstream",
          blurb: "The imagery workstream, M1. The others follow on the same loop.",
          items: [
            {
              id: "owns",
              tag: "Who owns it",
              name: "The creative lead, and the designers",
              body: "The lead decides what passes. The designers run the rounds themselves.",
            },
            {
              id: "runs",
              tag: "What runs it",
              name: "Their own Skills, in Claude",
              body: "Brand, tone of voice and the review rules as files, on their own keys.",
            },
            {
              id: "bar",
              tag: "The bar",
              name: "The lead's rubric, in their words",
              body: "Every frame is graded against it before the sheet is opened. What they say twice becomes a check.",
            },
            {
              id: "where",
              tag: "Where it runs",
              name: "Figma and the image models",
              body: "Claude connected to Figma, to the image models, and to the product facts.",
            },
          ],
        },
        {
          id: "people",
          label: "In the loop, and how much",
          blurb: "Who is in the room, and what it costs them in time.",
          items: [
            {
              id: "lead",
              tag: ${q(N)},
              name: "The creative lead, the last gate",
              body: "Writes the review rules in week one, then grades every round.",
              meta: "Two half-days a week",
            },
            {
              id: "designers",
              tag: ${q(N)},
              name: "The designers, who make the work",
              body: "In every session from day one. From week two they run the rounds themselves.",
              meta: "Two sessions a week, then their normal week",
            },
            {
              id: "vince",
              tag: "Thoughtform",
              name: "Vince, on AI and creative technology",
              body: "On site for week one, then encoding what comes back. By the third phase, watching.",
              meta: "Week one full time, then two sessions a week",
            },
          ],
        },
      ],
    },
    {
      id: "needs-keeps",
      kind: "list-groups",
      menuLabel: "Needs and keeps",
      layout: "columns",
      head: {
        eyebrow: ${q(`${N} · the terms of the work`)},
        title: { pre: "What we need, and", em: "what you keep." },
        sub: "Three dependencies. Six things that stay behind when we stop showing up.",
      },
      groups: [
        {
          id: "needs",
          label: ${q(`What this needs from ${N}`)},
          items: [
            {
              id: "brand",
              tag: "01",
              name: "Brand definition",
              body: "Works best where identity, tone of voice and guidelines exist. Where they do not, defining them becomes part of M1 and affects pace.",
            },
            {
              id: "access",
              tag: "02",
              name: "Access",
              body: ${q(
                `Figma, plus the accounts and API access for image generation. Opened in ${N}'s name so nothing needs migrating later.`
              )},
            },
            {
              id: "time",
              tag: "03",
              name: "The creative team's time",
              body: "The lead and the designers are in every working session: this is done with them, not for them. Their grading is what the rubric learns from.",
            },
          ],
        },
        {
          id: "keeps",
          label: ${q(`What ${N} has at the end`)},
          items: [
            {
              id: "setup",
              tag: "Keeps",
              name: "The configuration",
              body: ${q(
                `Claude, Figma and image generation in ${N}'s environment, on ${N}'s keys.`
              )},
            },
            {
              id: "skills",
              tag: "Keeps",
              name: "Claude Skills",
              body: "Brand, tone of voice, design standards and the review rules.",
            },
            {
              id: "workflow",
              tag: "Keeps",
              name: "A tested workflow",
              body: "Best practice and red flags earned through graded waves, not assumed.",
            },
            {
              id: "assets",
              tag: "Keeps",
              name: "Assets at volume",
              body: "On-brand and ready for paid social. Composition still takes human oversight.",
            },
            {
              id: "team",
              tag: "Keeps",
              name: "A team that runs it",
              body: "Half a day on a real production run, then check-ins at one and three months.",
            },
            {
              id: "nodep",
              tag: "Keeps",
              name: "No dependency",
              body: "No platform to license, no retainer, nothing that breaks if we stop answering.",
            },
          ],
        },
      ],
    },
    {
      /* FILL IN: the fee. */
      id: "pricing",
      kind: "cards",
      menuLabel: "Pricing",
      menuPrimary: true,
      columns: 4,
      head: {
        eyebrow: ${q(`${N} · the fee`)},
        title: { pre: "Priced", em: "one phase at a time." },
        sub: "M1 is scoped and priced now. M2 and M3 are our current view, and they confirm at the end of M1.",
      },
      cards: [
        {
          id: "fee-m1",
          kicker: "M1",
          title: "Priced now",
          body: "Discovery, imagery and video.",
        },
        {
          id: "fee-m2",
          kicker: "M2",
          title: "Confirms after M1",
          body: "Composition.",
        },
        {
          id: "fee-m3",
          kicker: "M3",
          title: "Confirms after M2",
          body: "Ads and handover.",
        },
        {
          id: "fee-total",
          kicker: "Total",
          title: "All three phases",
          body: "M1 stands on its own: stop after it and the team still has a working imagery setup and the Skills behind it.",
        },
      ],
      tips: [
        {
          id: "separate",
          tag: "Commitment",
          body: "Each phase is a separate decision, and nothing beyond M1 is committed upfront. If M1 shows that another need is nearer-term, we say so before pricing anything else.",
        },
        {
          id: "expenses",
          tag: "Expenses",
          body: ${q(
            `Travel at cost. Model and API usage billed to ${N} directly by the providers, typically low hundreds per month at this volume.`
          )},
        },
        {
          id: "owns",
          tag: "Ownership",
          body: ${q(
            `${N} owns its configured setup, its Skills and its outputs outright. The underlying method is not exclusive to ${N}.`
          )},
        },
      ],
    },
    {
      /* FILL IN: who is showing up. */
      id: "people",
      kind: "cards",
      menuLabel: "Who does it",
      columns: 2,
      head: {
        eyebrow: "Thoughtform · who shows up",
        title: { pre: "The people who", em: "did this before." },
        sub: "One built the capability inside a creative team. The other ran the organisation it had to work for.",
      },
      cards: [
        {
          id: "vince",
          kicker: "AI and creative technology",
          title: "Vince Buyssens",
          body: "Built Loop's AI capability inside its creative team over three years, and now leads its company-wide AI transformation. Runs the workshops, the encoding and the graded waves.",
        },
        {
          id: "rob",
          kicker: "Commercial and organisation",
          title: "Rob Weston",
          body: "Ran the Commercial and Marketing teams at Loop and sat on the executive team that decided, in 2024, to make Loop AI-first. Focuses on organisation, process, governance and the senior stakeholder relationships.",
        },
      ],
    },
    {
      /* FILL IN: the dates. */
      id: "next-steps",
      kind: "cards",
      menuLabel: "Next steps",
      columns: 3,
      head: {
        eyebrow: ${q(`${N} · from here`)},
        title: { pre: "Next", em: "steps." },
        sub: "Three of them, and the first is a date in a diary.",
      },
      cards: [
        {
          id: "onsite",
          n: "01",
          title: "Confirm the on-site week",
          body: "Five days on site. We work around the creative lead's availability first.",
        },
        {
          id: "prep",
          n: "02",
          title: "Short prep calls",
          body: "An hour each with the stakeholders, so week one starts with the questions already asked.",
        },
        {
          id: "kickoff",
          n: "03",
          title: "Kick off M1",
          body: "The setup in on day one. First graded imagery wave by the end of week two.",
        },
      ],
    },
    {
      id: "appendix",
      kind: "list-groups",
      menuLabel: "Appendix",
      layout: "columns",
      head: {
        eyebrow: "Appendix",
        title: { pre: "Why not just subscribe to", em: "a generation tool?" },
        sub: ${q(
          `Because the same models sit behind both. A subscription rents your team a front end to them. This puts them inside the tools the team already uses, on ${N}'s own keys, learning from ${N}'s own work.`
        )},
      },
      groups: [
        {
          id: "subscription",
          label: "A generation tool on subscription",
          blurb: "What a seat buys, and where it leaves the work.",
          items: [
            {
              id: "s-pay",
              tag: "What you pay for",
              name: "A seat per person, per month, for as long as you use it",
            },
            {
              id: "s-where",
              tag: "Where the work happens",
              name: "In their app. The prompt is written somewhere else and pasted in",
            },
            {
              id: "s-keys",
              tag: "Who holds the keys",
              name: "They do. History and settings live in their account",
            },
            {
              id: "s-models",
              tag: "Which models",
              name: "The frontier models, behind their front end",
            },
            { id: "s-new", tag: "When a better model ships", name: "When they add it" },
            {
              id: "s-better",
              tag: "How it gets better",
              name: "A prompt enhancer of its own, kept apart from the Claude your team talks to",
            },
          ],
        },
        {
          id: "own",
          label: "Your own configuration",
          blurb: ${q(`Claude, on ${N}'s keys, inside the tools the team already has open.`)},
          items: [
            {
              id: "o-pay",
              tag: "What you pay for",
              name: "The setup and the adoption, once. Model usage at cost. No seats",
            },
            {
              id: "o-where",
              tag: "Where the work happens",
              name: "Inside Claude and Figma, where the team already works",
            },
            {
              id: "o-keys",
              tag: "Who holds the keys",
              name: ${q(`${N} does. Files, accounts and outputs stay ${N}'s`)},
            },
            {
              id: "o-models",
              tag: "Which models",
              name: "The same frontier models, called directly, with Claude running them",
            },
            {
              id: "o-new",
              tag: "When a better model ships",
              name: "The setup takes it. A new key, not a new tool",
            },
            {
              id: "o-better",
              tag: "How it gets better",
              name: "The Claude your team already uses, with its memory of your work and your written rules",
            },
          ],
        },
      ],
      closing:
        ${q(
          `A subscription tool is a good tool, and it stays available: connect it and the team's own setup gets smarter either way. The question is where ${N}'s judgment ends up, in a vendor's account or written down in ${N}'s own setup, where the next team inherits it.`
        )},
    },
    {
      id: "close",
      kind: "close",
      menuLabel: "Close",
      head: {
        title: { pre: "Talk it", em: "through." },
        sub: "Questions on any of it, or a date for the on-site week.",
      },
      actions: [
        { id: "vince", label: "Vince Buyssens", href: "mailto:vince@thoughtform.co", primary: true },
        { id: "home", label: "thoughtform.co", href: "/" },
      ],
      footerLine: ${q(`Thoughtform · Proposal for ${N}.`)},
    },
  ],
};
`;
}

/** What a person fills in after the scaffold runs, in the order it reads. */
export const FILL_IN = [
  "the configuration's teams, and the five answers each",
  "the phases, and what happens in each week",
  "the fee",
  "the people who will be in the room",
  "the next steps, with real dates",
];
