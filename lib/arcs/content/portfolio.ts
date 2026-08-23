import type { ArcDef } from "../types";

import { LOOP_FIGURES } from "./shared/loop-figures";
import { LOOP_SKILL_GROUPS } from "./shared/loop-skills";
import { AI_ATL_SECTION, STUDIO_AD_CARDS, ratiosOnly } from "./shared/loop-studio";
import { MODE_LEGEND } from "./shared/loop-tools";
import { SOFTWARE_FEW_LINE, VINCE_BIO_LEAD, VINCE_PORTRAIT } from "./shared/vince";

/**
 * The Loop portfolio (ADR-072) — the adoption program at Loop Earplugs and
 * the four production tools built on it, for a reader who was in the
 * building: hero → about → ONE overview from adoption to automation →
 * the encoding evidence → the tools, each a full-viewport dossier → what
 * changed → close.
 *
 * FUNCTION FIRST. The hero names the role and the method; the person is
 * introduced one beat later. The overview's title is the thesis — adoption
 * that works IS automation — and its three cards are Navigate · Encode ·
 * Build with the canon numbers, so "adoption is the Claude part, automation
 * is the Skills and the tools" is the left-to-right read of one viewport.
 *
 * NUMBERS ARE THE REPO'S CANON AND NOTHING ELSE (`shared/loop-figures.ts`,
 * parity-pinned to the casefile): 22 · 47+ · 4 · 5 → 130+ · 97 % · 14
 * teams USING the layer (a different set from the 22 briefed — never lend
 * one number the other's meaning). The other repos still print 42 / 90 % /
 * 95 %; those are superseded and pinned OUT.
 *
 * THE ENVELOPE: this is an unlisted page a reader forwards, so it sits
 * inside the casefile's confidentiality envelope — no currency, no
 * thousands separators, no boards, no repos, first names only — and
 * `tests/lib/arcs-registry.test.ts` scans it. The studio cards come
 * through `ratiosOnly()` (SKU + ROAS; the keynote deck keeps its € rows).
 *
 * THE EVIDENCE IS SHARED BY REFERENCE (roster, studio cards, the ATL film,
 * the operator's lines, the mode legend); the FRAME — every head, sub and
 * placement — is this page's own. The dossiers contribute a `toolId` each
 * and draw everything else from `PROJECT_CASES`.
 */
export const PORTFOLIO_ARC: ArcDef = {
  slug: "portfolio",
  format: "portfolio",
  motion: "terminal",
  cardTitle: "The Loop portfolio",
  cardLede:
    "The adoption program and the four tools it produced: navigate, encode, build, at company scale.",
  cardImage: { src: "/images/services/embedded.webp", alt: "The Loop portfolio" },
  hero: {
    eyebrow: "Thoughtform · Portfolio · Loop Earplugs",
    title: { pre: "AI capability,", em: "built inside the work." },
    lede: "I architect the fit between an organisation's work and the intelligence available to it. At Loop Earplugs that meant one loop, run with every team — navigate, encode, build — until the teams ran it without me. This is the record: the adoption work, and the four tools it produced.",
    actions: [
      { id: "see-tools", label: "See the tools", href: "#tools", primary: true },
      { id: "see-program", label: "The adoption program", href: "#overview" },
    ],
    image: {
      src: "/images/Thoughtform_Key%20Visual_14d.webp",
      alt: "",
      width: 2560,
      height: 1440,
    },
  },
  meta: {
    title: "Portfolio — Thoughtform",
    description:
      "The AI adoption program at Loop Earplugs and the four production tools built on it.",
  },
  sections: [
    {
      id: "about",
      kind: "portrait",
      menuLabel: "About",
      ariaLabel: "About Vince Buyssens",
      head: {
        eyebrow: "About",
        title: { pre: "Vince Buyssens" },
        sub: "AI Adoption & Encoding Lead, Loop Earplugs · Founder, Thoughtform",
      },
      image: VINCE_PORTRAIT,
      bio: [
        VINCE_BIO_LEAD,
        "Inside Loop he moved from the AI team into marketing to show that AI would elevate the teams rather than replace them, then ran the same loop with every team after that. Building is the diagnostic instrument: every tool on this page came out of a workflow the team had already encoded.",
      ],
      meta: [
        { label: "Role at Loop", value: "AI Adoption & Encoding Lead" },
        { label: "Practice", value: "Thoughtform" },
        { label: "Base", value: "Antwerp · BE" },
      ],
    },
    {
      id: "overview",
      kind: "cards",
      menuLabel: "Overview",
      ariaLabel: "The program, from adoption to automation",
      columns: 3,
      head: {
        eyebrow: "The program · adoption to automation",
        title: { pre: "Adoption that works", em: "is", post: "automation." },
        sub: "Software gets installed. AI has to be adopted. Loop runs the same loop with every team, turns what works into Skills, and reuses them everywhere: navigate first, then encode, then build. Stack enough Skills on one workflow and a tool emerges, built by the team that owns the work.",
      },
      cards: [
        {
          id: "navigate",
          n: "01",
          kicker: "Navigate · Adoption",
          title: "Every team starts here",
          body: "Same forty-five-minute kickoff, same Claude. Each team leaves with one workflow worth encoding as a Skill, and keeps its own steward.",
          metaRows: [
            { label: "Workshops run", value: LOOP_FIGURES.workshops },
            { label: "People on the layer", value: LOOP_FIGURES.people },
          ],
          receipt: "Eighteen months · organic pull, not mandate",
        },
        {
          id: "encode",
          n: "02",
          kicker: "Encode · Skills",
          title: "Records feed the layer",
          body: "The transcript becomes a Skill, the result lands on one shared board, and production-grade Skills graduate to one versioned, team-owned library.",
          metaRows: [
            { label: "Skills encoded", value: LOOP_FIGURES.skills },
            { label: "Teams using the layer", value: LOOP_FIGURES.teamsUsing },
          ],
          receipt:
            "Five shapes · Judgment 12 · Voice 7 · Validation 9 · Stakeholder 5 · Pattern 14",
        },
        {
          id: "build",
          n: "03",
          kicker: "Build · Tools",
          title: "Patterns become tools",
          body: "Three teams doing the same work → a Skill worth sharing. Three teams needing the same surface → a tool worth building, on the Skills they already authored.",
          metaRows: [
            { label: "Production tools", value: LOOP_FIGURES.tools },
            { label: "Built", value: "In-house, with the workflow owner" },
          ],
          receipt: "Mímir · Vesper · Babylon · Heimdall",
        },
      ],
      footnote:
        "When the model changes, the substrate stays. When a team rotates, the judgment stays.",
    },
    {
      id: "five-shapes",
      kind: "anatomy",
      menuLabel: "Skills",
      ariaLabel: "Forty-seven Skills, five shapes of work",
      badge: "Encode · 47+ Skills",
      head: {
        eyebrow: "The substrate",
        title: { pre: "Forty-seven Skills,", em: "five shapes of work." },
        sub: "Every Skill encodes one piece of how a team works. Sorted by the kind of judgment it carries, the portfolio falls into five shapes, and the shapes outlive the model version, the team roster, and whatever surface launches next.",
      },
      // Gloss + meaning per shape, copied from the casefile's map record
      // (`MAP_GROUPS` / `MAP_SHAPES`, lib/cases/content/loop-earplugs.ts) and
      // parity-pinned there. Counts only — a per-shape team count would
      // re-open the three-unit confusion the envelope exists to prevent.
      rows: [
        {
          id: "judgment",
          label: "Judgment · 12",
          body: "Applies senior judgment to varied inputs. What good means when the inputs vary and the answer is not obvious.",
        },
        {
          id: "voice",
          label: "Voice · 7",
          body: "Writes in a specific Loop voice. How the organisation sounds when it speaks, held steady across readers.",
        },
        {
          id: "validation",
          label: "Validation · 9",
          body: "Checks output against a Loop bar. The bar output is checked against, and the cases that make a failure visible.",
        },
        {
          id: "stakeholder",
          label: "Stakeholder · 5",
          body: "Frames information for a specific reader. Who the work is for, and the framing that reader needs to act on it.",
        },
        {
          id: "pattern",
          label: "Pattern · 14",
          body: "Composes structured outputs from recurring inputs. The shapes the work keeps returning to, so output arrives structured rather than improvised.",
        },
      ],
    },
    {
      id: "skills-by-team",
      kind: "list-groups",
      ariaLabel: "The Skill roster, team by team",
      layout: "stack",
      head: {
        eyebrow: "Encode · the roster",
        title: { pre: "What's", em: "encoded,", post: "team by team." },
        sub: "The forty-seven as the teams named them. Each one captures how that team handles a specific piece of work, so people and agents can build on what the company already knows. Status as of the latest board revision.",
      },
      groups: LOOP_SKILL_GROUPS,
    },
    {
      id: "tools",
      kind: "anatomy",
      menuLabel: "Tools",
      ariaLabel: "The tools, in production",
      badge: "Build · Software for few",
      head: {
        eyebrow: "The tools · in production",
        title: { pre: "Removing workflow bottlenecks,", em: "one tool at a time." },
        sub: SOFTWARE_FEW_LINE,
      },
      rows: [
        {
          id: "compress",
          label: "Compress",
          body: `${MODE_LEGEND.Compress} Vesper: three generation tools and an invisible cost became one canvas, with the draw visible per run.`,
        },
        {
          id: "repair",
          label: "Repair",
          body: `${MODE_LEGEND.Repair} Heimdall: board to canvas to asset system, nothing retyped.`,
        },
        {
          id: "invent",
          label: "Invent",
          body: `${MODE_LEGEND.Invent} Mímir: five sources become one brief while it is written. Babylon: five handoffs across thirty-plus markets become one review.`,
        },
      ],
    },
    // Reel labels are the CODENAMES: the reel sits at the left margin and
    // a 14-character handle ("BRIEFING AGENT") crosses the record column at
    // 1440 (measured) — the keynote's reel was cut for ≤9 characters. The
    // dossier's own masthead letters codename · tagline over the function,
    // so the reel's short handle resolves one beat in.
    {
      id: "tool-mimir",
      kind: "dossier",
      menuLabel: "Mímir",
      toolId: "mimir",
      legend: MODE_LEGEND.Invent,
    },
    {
      id: "tool-vesper",
      kind: "dossier",
      menuLabel: "Vesper",
      toolId: "vesper",
      legend: MODE_LEGEND.Compress,
    },
    {
      id: "tool-babylon",
      kind: "dossier",
      menuLabel: "Babylon",
      toolId: "babylon",
      legend: MODE_LEGEND.Invent,
    },
    {
      id: "tool-heimdall",
      kind: "dossier",
      menuLabel: "Heimdall",
      toolId: "heimdall",
      legend: MODE_LEGEND.Repair,
    },
    {
      id: "studio",
      kind: "cards",
      menuLabel: "Outcome",
      ariaLabel: "Loop Studio — what the layer produced",
      columns: 3,
      head: {
        eyebrow: "Loop Studio · what the layer produced",
        title: { pre: "97% of briefings", em: "involve AI." },
        sub: "Paid social moved from a specialist service to a capability the studio owns. The team briefs, creates, reviews and ships without a specialist in the loop, two to three times faster than the agency route at the same craft bar, and every one of these three cuts beat its return target.",
      },
      cards: STUDIO_AD_CARDS.map(ratiosOnly),
      footnote:
        "AI-generated visuals, Claude-assisted copy, Studio design. Return on ad spend measured against the Loop performance benchmark.",
    },
    {
      ...AI_ATL_SECTION,
      id: "proof-ai-atl",
      menuLabel: undefined,
    },
    {
      id: "close",
      kind: "close",
      menuLabel: "Close",
      head: {
        title: { pre: "The method is the durable centre.", em: "The tools are its proof." },
        sub: "Navigate produces the read, encode produces the layer, build produces the map. Run that loop inside the work and adoption stops being a program someone has to keep alive: the teams own the Skills, the tools run on them, and the layer stays whichever model Loop runs next.",
      },
      actions: [
        { id: "talk", label: "Talk to Vince", href: "mailto:vince@thoughtform.co", primary: true },
        { id: "home", label: "thoughtform.co", href: "/" },
      ],
      footerLine:
        "Thoughtform · Portfolio · The adoption work and the tools built on it · Loop Earplugs, 2024 · ongoing.",
      signature: "Compiled by Vince · 2026.",
    },
  ],
};
