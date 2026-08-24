import type { ArcDef } from "../types";

import { LOOP_FIGURES } from "./shared/loop-figures";
import { AI_ATL_SECTION, STUDIO_AD_CARDS, ratiosOnly } from "./shared/loop-studio";
import { MODE_LEGEND } from "./shared/loop-tools";
import { VINCE_BIO_LEAD, VINCE_PORTRAIT } from "./shared/vince";

/**
 * The Loop portfolio (ADR-072) — the adoption program at Loop Earplugs and
 * the four production tools built on it, for a reader who was in the
 * building: hero → about → ONE overview from adoption to automation →
 * the tools, each a full-viewport dossier → what changed → THE
 * ARCHITECTURE UNDERNEATH → close.
 *
 * IT FLOWS (ADR-076). The page reads as one continuous scroll, not a deck
 * of pinned beats, and the two text-wall sections that carried the Skills
 * — five ruled rows and the 47-row roster — are replaced by ONE drawn
 * instrument at the foot: the casefile's own three-reading console, at
 * page scale, on the record both surfaces share.
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
  /* ⚠ NO `motion` — this page FLOWS (ADR-076, owner 2026-08-24). The
     terminal grammar pins every section and resolves its masthead with a
     decode, which reads as a deck being presented; this is a portfolio a
     reader forwards and scrolls at their own pace, so it takes the ADR-052
     reveal — plain sections, one quiet rise each. The hero's curtain seam
     survives the change (ADR-075 generalised); the `-v2` client decks keep
     terminal motion, which is the grammar they were designed in. */
  cardTitle: "The Loop portfolio",
  cardLede:
    "The adoption program and the four tools it produced: navigate, encode, build, at company scale.",
  cardImage: { src: "/images/services/embedded.webp", alt: "The Loop portfolio" },
  hero: {
    eyebrow: "Thoughtform · Portfolio · Loop Earplugs",
    title: { pre: "AI capability,", em: "built inside the work." },
    // The homepage's own register: a short headline over ~110 characters
    // of lede. The role argument is not lost — it opens the About beat
    // and the overview's thesis; the hero says what this page IS.
    lede: "Eighteen months at Loop Earplugs — the adoption program, the Skills it encoded, and the four tools it produced.",
    actions: [
      { id: "see-tools", label: "See the tools", href: "#tools", primary: true },
      { id: "see-program", label: "The program", href: "#overview" },
    ],
    // THE HOMEPAGE'S HERO, PLATE AND ALL (ADR-075): the Gateway key
    // visual, delivered the landing's way — AVIF over WebP in dark, and
    // theme.css's own light rule painting `Gateway_v2-light.webp`.
    image: {
      src: "/images/Gateway_v1b.webp",
      alt: "",
      width: 2880,
      height: 1620,
    },
    plate: "gateway",
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
      menuPrimary: true,
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
      menuPrimary: true,
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
          // No shape roll-call here: the architecture beat DERIVES those
          // five counts from the roster and letters them on the dial, and
          // a hand-typed copy is the one that goes stale.
          receipt: "One shared board · one versioned library",
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
    // ⚠ THE TWO TEXT WALLS ARE GONE (ADR-076, owner 2026-08-24: "the
    // skills are now like blocks of text… very East German").
    //
    //   `five-shapes`    — five ruled mono rows naming the shapes and
    //                      their counts. The ARCHITECTURE beat draws them
    //                      instead, at the bottom of the page, and derives
    //                      every count from the roster.
    //   `skills-by-team` — the full 47-Skill roster as text cards, which
    //                      measured 5319px at 1440×800: a quarter of the
    //                      page, and the densest reading on it. The dial
    //                      letters all 47 names; the console's own
    //                      small-screen fallback keeps the grouped list
    //                      where there is no drawing. The WRITTEN roster
    //                      survives on the keynote arc, which is a deck
    //                      read in a room rather than a page forwarded to
    //                      a stranger.
    //
    // `LOOP_SKILL_GROUPS` is therefore no longer imported here — the arc
    // shares the roster through the map record now, by reference.
    {
      // The tools' chapter head. It WAS an `anatomy` listing the three
      // modes with a tool named in each — but every dossier below already
      // prints its own mode chip and the same shared legend sentence, so
      // the rows were this page saying a thing twice, one viewport before
      // it said it properly.
      id: "tools",
      kind: "head",
      menuLabel: "Tools",
      menuPrimary: true,
      ariaLabel: "The tools, in production",
      head: {
        eyebrow: "The tools · in production",
        title: { pre: "Removing workflow bottlenecks,", em: "one tool at a time." },
        /* ⚠ THIS PAGE AUTHORS ITS OWN, and the reason is placement.
           `SOFTWARE_FEW_LINE` (shared with the keynote) ends "The Skills
           ABOVE are what those tools run on" — true on the deck, where the
           roster precedes it, and false here since ADR-076 moved the Skills
           to the foot. Share the evidence, author the frame: the argument
           is the same and the sentence points the way this page runs. */
        sub: "Most of Loop's bottlenecks live in software too specific to buy off the shelf, and too small to justify an agency build. That category sat unsolved for years. AI models crossed a threshold at the end of 2025 where the team that owns the problem can now build the tool itself — on the Skills that team already authored.",
      },
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
      menuPrimary: true,
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
      /* THE ARCHITECTURE, AT THE BOTTOM (ADR-076, owner). It closes the
         page rather than interrupting it: the reader has seen the program,
         the four tools and what the layer produced, so the instrument is
         the answer to "what is underneath all of that" — not a spec sheet
         to get through before the work.
         It carries a masthead and NOTHING ELSE. The 47 Skills, their five
         shapes and the 27 configured streams come from the casefile's own
         record (`LOOP_INTELLIGENCE_MAP`), which is why the counts on the
         dial cannot disagree with the landing's. */
      id: "intelligence",
      kind: "intelligence",
      menuLabel: "Architecture",
      menuPrimary: true,
      ariaLabel: "The intelligence architecture — 47 Skills, five shapes, 27 configured streams",
      head: {
        eyebrow: "The substrate · what it is made of",
        title: { pre: "Forty-seven Skills,", em: "five shapes of work." },
        sub: "Every Skill encodes one piece of how a team works. Read the work, open a stream to see how it is configured, or take the whole substrate at once.",
      },
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
