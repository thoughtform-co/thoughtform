import type { ArcDef } from "../types";

import { LOOP_FIGURES } from "./shared/loop-figures";
import { MODE_LEGEND } from "./shared/loop-tools";
import { VINCE_BIO_LEAD, VINCE_PORTRAIT } from "./shared/vince";

/**
 * The Loop portfolio (ADR-072, re-cut by ADR-078) — the adoption program at
 * Loop Earplugs and the four production tools built on it, for a reader who
 * was in the building and for the strangers he forwards it to.
 *
 * IT IS THE CASEFILE, EXPANDED (ADR-078). The homepage's proof panel is one
 * instrument that changes what it displays, four directory rows deep; this
 * page is those rows given a section each, at a size a stranger can read.
 * Four of them are drawn consoles now — the studio's sheets, the reel, the
 * four tool dossiers, the architecture — because the alternative was what
 * shipped first: a reader meeting a machine, then a brochure, then a
 * machine.
 *
 * IT READS IN ORDER, and the order is the story rather than the taxonomy:
 * where he came from → the thesis → the studio that proved it → the tools
 * the studio's bottlenecks produced → the program that spread them → the
 * architecture underneath all of it. The `interstitial` beats between the
 * chapters carry the case shape's own connective tissue — what each chapter
 * REVEALED NEXT — so the page argues rather than lists.
 *
 * IT FLOWS (ADR-076). One continuous scroll, not a deck of pinned beats:
 * a deck is presented, a portfolio is scrolled at the reader's own pace.
 *
 * FUNCTION FIRST. The hero names the role and the method; the person is
 * introduced one beat later. The thesis beat's title is the argument —
 * adoption that works IS automation — and since ADR-078 it is DRAWN: a
 * ratchet between two strands, with the canon numbers as its registers and
 * the career route as its course strip.
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
      /* THE ORIGIN, BEFORE LOOP (ADR-078). Three records that say the same
         thing about him one system earlier: he reads a new medium early,
         builds the layer that lets people act inside it, and steps back.
         Loop is where that move met an intelligence.

         ⚠ THE FACTS ARE THE VOIDWALKER RECORD'S, AT LOCK, RE-AUTHORED —
         never imported. `lib/voidwalker` is a zero-import module drawn on a
         gold spine at snapshot scale; this is card copy, and the two are
         pinned to agree in `arcs-registry.test.ts` rather than sharing an
         array. Nothing here is rounded, and no client of Starhaven's is
         named beyond what the press already printed. */
      id: "beyond",
      kind: "cards",
      menuLabel: "Beyond Loop",
      ariaLabel: "Before Loop — the work the method came out of",
      columns: 3,
      head: {
        eyebrow: "Before Loop · where the method comes from",
        title: { pre: "The same move,", em: "one system earlier." },
        sub: "Loop is the third time this ran. Before the models there were crowds, fandoms and classrooms — read the new system early, build the layer that lets other people act inside it, then leave. What changed in 2022 is that the system became an intelligence.",
      },
      cards: [
        {
          id: "starhaven",
          kicker: "Starhaven · 2022",
          title: "One of Belgium's first AI consultancies for the creative industry",
          body: "Founded to work with the models the year they arrived, for the studios and agencies that had no idea yet what to do with them. It is the practice Thoughtform grew out of.",
          receipt: "Co-drafted the UBA/ACC AI Charter",
        },
        {
          id: "latent-land",
          kicker: "Welcome to Latent Land",
          title: "The first hybrid AI-video production in Belgium",
          body: "AI Captain on the production: the pipeline, the shot logic and the craft bar for a film made with models before anyone had a workflow for it.",
          receipt: "AI direction · Under Armour with Anthony Joshua",
        },
        {
          id: "in-the-pocket",
          kicker: "In The Pocket",
          title: "Product teams, the same question",
          body: "Where the method meets software teams rather than creative ones — the shape it takes when the people in the room already build for a living.",
          receipt: "On record · detail on request",
        },
      ],
      footnote:
        "Read the system early, build the layer, hand it over. The medium changes; the move does not.",
    },
    {
      /* THE THESIS, DRAWN (ADR-078). It was three text plates — Navigate ·
         Encode · Build with the canon numbers — and the owner's read was
         that it was the weakest object on a page of instruments. It is the
         one beat that ARGUES, so it is the one that most needed to be
         drawn.

         The id stays `overview`: the hero's second action links it, and a
         forwarded page's deep links outlive a rename.

         ⚠ IT LETTERS NO DIGITS HERE. The registers are `LOOP_FIGURES`,
         read by the component — the content module contributes the head,
         the route and the footnote, exactly as `dossier` contributes a
         `toolId`. A hand-typed count is the one that goes stale. */
      id: "overview",
      kind: "flywheel",
      menuLabel: "Program",
      menuPrimary: true,
      ariaLabel: "The program — adoption and automation as one mechanism",
      head: {
        eyebrow: "The program · adoption to automation",
        title: { pre: "Adoption that works", em: "is", post: "automation." },
        sub: "Software gets installed. AI has to be adopted. Loop runs the same loop with every team, turns what works into Skills, and reuses them everywhere: navigate first, then encode, then build. Stack enough Skills on one workflow and a tool emerges, built by the team that owns the work.",
      },
      /* THE COURSE STRIP — this page's own chart, drawn. Every waypoint
         but one is an anchor into the chapter it names, so the route is
         the table of contents and the argument at once: the seat at the
         end is what the four before it produced. */
      /* ⚠ WAYPOINT LABELS ARE TERSE, and that is the chart's grammar
         rather than a fit workaround: a course strip names a place in as
         few characters as it can, and the `sub` carries what the place
         was. "The adoption program" wrapped into its neighbour at 1440
         and said nothing "Adoption" does not. */
      route: [
        { id: "specialist", label: "AI Specialist", sub: "2024", target: "about" },
        { id: "studio", label: "Studio", sub: "97% of briefings", target: "studio" },
        { id: "vesper", label: "Vesper", sub: "Image + video", target: "tool-vesper" },
        {
          id: "process",
          label: "Process tools",
          sub: "Mímir · Babylon · Heimdall",
          target: "tool-mimir",
        },
        { id: "program", label: "Adoption", sub: "22 teams briefed", target: "rollout" },
        {
          id: "architect",
          label: "Intelligence Architect",
          sub: "Holds the map",
          target: "intelligence",
          seat: true,
        },
      ],
      footnote:
        "When the model changes, the substrate stays. When a team rotates, the judgment stays.",
    },
    {
      id: "bridge-studio",
      kind: "interstitial",
      variant: "question",
      ariaLabel: "What the layer produced first",
      eyebrow: "What it produced first",
      line: { pre: "So what does a team do", em: "with all of that?" },
      subline:
        "The studio went first, because the studio had the most to lose. Paid social is where a craft bar either survives contact with a model or does not.",
    },
    {
      /* THE STUDIO, AS THE CASEFILE SHOWS IT (ADR-078). It was three ad
         cards — the output, and only the output. Half the engagement was
         the policy: when AI may make an image and when it may not, and
         what a synthetic creator actually costs. That half is the half a
         stranger has to trust, and it was on the landing and nowhere here.
         The record is the casefile's own (`LOOP_STUDIO_SHEETS`). */
      id: "studio",
      kind: "sheets",
      menuLabel: "Studio",
      menuPrimary: true,
      ariaLabel: "Loop Studio — the output, the rule, and the limit",
      head: {
        eyebrow: "Loop Studio · what the layer produced",
        title: { pre: "97% of briefings", em: "involve AI." },
        sub: "Paid social moved from a specialist service to a capability the studio owns — briefing, creating, reviewing and shipping without a specialist in the loop, two to three times faster than the agency route at the same craft bar. The ads are the output. The line and the red line are how the studio decides.",
      },
    },
    {
      /* THE REEL. It was a `media` beat carrying ONE film and no
         `menuLabel` — a full viewport of the page's most striking evidence
         with no name in the readout and no row in the drawer. The plate
         holds both masters, poster-first. */
      id: "studio-films",
      kind: "films",
      menuLabel: "Films",
      ariaLabel: "The above-the-line films",
      head: {
        eyebrow: "Loop Earplugs · September 2025",
        title: { pre: "A world-first", em: "above-the-line film." },
        sub: "Loop was the first brand to make a full AI above-the-line video. Concept, casting, shot list, comp, edit — the whole pipeline shaped through AI, finished by the team, and run on YouTube and CTV beside live action. Then they made a second one.",
      },
    },
    {
      id: "bridge-tools",
      kind: "interstitial",
      variant: "callout",
      ariaLabel: "What the studio revealed next",
      eyebrow: "What it revealed next",
      line: { pre: "Every bottleneck it cleared", em: "exposed the next one upstream." },
      subline:
        "Three teams doing the same work is a Skill worth sharing. Three teams needing the same surface is a tool worth building — on the Skills those teams had already authored.",
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
      /* THE PROGRAM'S OWN LOG (ADR-078). The tools are what one team's
         bottlenecks produced; this is how the capability reached the rest
         of the company — and it is the beat the page was missing, because
         without it the four dossiers read as four side projects rather
         than as the output of a rollout.

         ⚠ THE ROWS ARE THE CASEFILE'S `ROLLOUT_ROWS`, COPY-WITH-PARITY —
         `lib/arcs` keeps no `lib/cases` import (the `LOOP_FIGURES`
         precedent), so the registry test asserts these against that array
         rather than sharing it. Editing one without the other fails
         loudly. */
      id: "rollout",
      kind: "anatomy",
      menuLabel: "Rollout",
      ariaLabel: "The adoption program — how the layer reached the company",
      badge: "Organic pull · not mandate",
      head: {
        eyebrow: "The program · how it spread",
        title: { pre: "Twenty-two teams,", em: "forty-five minutes each." },
        sub: "No mandate, no seat targets, no training programme. One team went first and the rest asked — and the operating work around it (the agreement, the sign-on, the connector reviews, the governance) ran in parallel so that the answer to a team's first question was never “not yet”.",
      },
      rows: [
        {
          id: "embedded",
          label: "2024",
          body: "Embedded in the marketing team, mapping the first workflows by sitting inside them rather than surveying them.",
        },
        {
          id: "pilot",
          label: "Pilot",
          body: "Sixty-nine seats, one team at a time — small enough that every seat had a workflow attached to it before it was handed out.",
        },
        {
          id: "agreement",
          label: "Q2 2026",
          body: "Enterprise agreement signed, after the pilot had already produced the evidence for it.",
        },
        {
          id: "parallel",
          label: "Parallel",
          body: "Sign-on, connector review and governance ran as their own track, so the platform was never what a team was waiting on.",
        },
        {
          id: "briefed",
          label: "Q2 2026",
          body: "Twenty-two teams briefed, forty-five minutes each: one workflow worth encoding, and a steward who stays.",
        },
        {
          id: "now",
          label: "Now",
          body: "Over a hundred and thirty people on the layer, and fourteen teams using it — the ones publishing Skills of their own, a smaller set than the ones briefed.",
        },
      ],
    },
    {
      id: "bridge-architecture",
      kind: "interstitial",
      variant: "question",
      ariaLabel: "What is underneath the work",
      eyebrow: "Underneath all of it",
      line: { pre: "So what is", em: "actually underneath this?" },
      subline:
        "Four tools, twenty-seven streams of work and forty-seven Skills, and the question a stranger asks last is the one that decides whether any of it survives the next model.",
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
