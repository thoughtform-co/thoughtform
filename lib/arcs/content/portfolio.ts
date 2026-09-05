import type { ArcDef } from "../types";

/* ⚠ `LOOP_FIGURES` is NOT imported here, and that is the contract rather
   than an omission: this module letters no figures. The registers read it
   in `ArcProgramBoard`, the same way a `dossier` carries only a `toolId` —
   a hand-typed count is the one that goes stale, and the canon is
   parity-pinned to the casefile in exactly one place. It went out of the
   imports with the `rollout` section (ADR-079), whose log rows were the
   last thing here that named a number. */
import { MODE_LEGEND } from "./shared/loop-tools";

/**
 * The Loop portfolio (ADR-072, re-cut by ADR-076 and ADR-078 U1) — the
 * adoption program at Loop Earplugs and the four production tools built
 * on it, for a reader who was in the building and for the strangers he
 * forwards it to.
 *
 * IT IS THE CASEFILE, EXPANDED (ADR-078). The homepage's proof panel is
 * one instrument that changes what it displays, four directory rows deep;
 * this page is those rows given a section each, at a size a stranger can
 * read.
 *
 * ⚠ IT OPENS ON THE WORK, NOT ON THE OPERATOR (ADR-078 U1, owner). The
 * page used to run hero → bio → an origin card set → the thesis → a prose
 * bridge before a reader reached anything Loop shipped. Four sections of
 * throat-clearing on an extension of the proof panel. They are ONE now:
 * the program board, which carries the origin as a dim run-in, the thesis
 * as its title, the canon as its registers and the page's own contents as
 * its plotted course.
 *
 * ⚠ TITLES ARE NAMES, NOT APHORISMS (ADR-078 U1, owner: the earlier set
 * "disgusts me… people will hate me for it"). Three shapes are banned on
 * this surface: the counting pair ("Twenty-two teams, forty-five minutes
 * each"), the reversal epigram ("The method is the durable centre. The
 * tools are its proof"), and the spelled-out-number opener ("Forty-seven
 * Skills, five shapes of work"). Where the owner already has a phrase for
 * a thing, that phrase IS the title: "Adoption that works is automation",
 * "Software for few", "97% of briefings involve AI", "the Intelligence
 * Map". Subs are one or two short sentences.
 *
 * IT FLOWS (ADR-076). One continuous scroll, not a deck of pinned beats:
 * a deck is presented, a portfolio is scrolled at the reader's own pace.
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
 * `tests/lib/arcs-registry.test.ts` scans it.
 *
 * THE EVIDENCE IS SHARED BY REFERENCE (the studio sheets, the films, the
 * map, the mode legend, the figures); the FRAME — every head, sub and
 * placement — is this page's own.
 */
export const PORTFOLIO_ARC: ArcDef = {
  slug: "loop-earplugs",
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
    title: { pre: "The Loop", em: "portfolio." },
    lede: "Eighteen months of AI adoption at Loop Earplugs: the program, the Skills, and the four tools the teams run.",
    /* ONE action (owner, ADR-078 U1). Two CTAs on a page with a drawn
       table of contents in its first section is the hero asking a
       question the board answers better. */
    actions: [{ id: "see-work", label: "See the work", href: "#overview", primary: true }],
    /* ⚠ NOT A FRAME OUT OF THE FILMS (owner, ADR-078 U2). U1 put the DJ
       Neighbour master here on the reasoning that a Loop page should open
       on a Loop image. It should — but a poster frame is EVIDENCE, and
       this page shows that evidence properly two beats later, in a console
       with its own rail. A still lifted out of it and blown up to 100vh is
       the work used as wallpaper, which cheapens the thing the reel is
       there to sell.
       So the plate is the house key visual again and the LOOP-SPECIFIC
       part of the hero is what it says. The repo holds no Loop image at
       hero grade; if one arrives, it belongs here — a film frame does not.
       (`.claude/rules/arcs.md`, the hero clause.) */
    image: {
      src: "/images/Gateway_v1b.webp",
      alt: "",
      width: 2880,
      height: 1620,
    },
    plate: "gateway",
    /* ⚠ DECLARED EVEN THOUGH THE GATEWAY PLATE IMPLIES IT (ADR-078 U1).
       The curtain used to RIDE the plate, so an arc taking its own key
       visual silently lost the seam. The two are separate questions now,
       and this page states its answer to both — which is what makes the
       hero image swappable without a choreography regression. */
    curtain: true,
  },
  meta: {
    title: "Portfolio — Thoughtform",
    description:
      "The AI adoption program at Loop Earplugs and the four production tools built on it.",
  },
  sections: [
    {
      /* THE SETUP, AS ONE CHART (ADR-078 U1).

         It was FOUR sections: a bio, a three-card "one system earlier",
         the thesis, and a prose bridge into the studio. The owner's read
         was that the bio does not belong on an extension of the proof
         panel at all, that the origin cards and the bridge were written
         in a register he would be embarrassed to send, and that the
         thesis drawing "doesn't work at all".

         All four collapse here. The chart carries the origin as a dim
         run-in, the thesis as its title, the numbers as its registers and
         the page's own contents as its plotted course — so the setup is
         one section, and the reader is inside the work by the second
         scroll.

         The id stays `overview`: the hero links it, and a forwarded
         page's deep links outlive a rename.

         ⚠ IT LETTERS NO DIGITS. The registers are `LOOP_FIGURES`, read by
         the component — this module contributes the head, the waypoints
         and their dates, exactly as `dossier` contributes a `toolId`. The
         only digits authored here are YEARS. */
      id: "overview",
      kind: "program",
      menuLabel: "Trajectory",
      menuPrimary: true,
      ariaLabel: "The trajectory at Loop Earplugs, plotted from 2024",
      head: {
        eyebrow: "The program · Loop Earplugs",
        title: { pre: "The", em: "trajectory." },
        state: "2024 — Now",
        sub: "The engagement in the order it happened, on the dates it happened. The gaps are part of the record: the work moved when a team was ready, not to a schedule. Every station on the axis opens the chapter it belongs to.",
      },
      /* THE COURSE — what shipped, at the date it shipped, each one an
         anchor into its own chapter. ⚠ THE POSITIONS ARE THE RECORD'S
         DATES, NOT AN EVEN SPREAD: the cluster on the right IS the
         reading (four tools inside eight months), and spacing them
         evenly would delete the one thing the chart knows that a list
         does not.

         ⚠ EACH ONE CARRIES ITS `note` NOW (ADR-079). The stations used to
         be dated labels, which named seven things and left the arc between
         them to be inferred. The owner's own telling is a sequence of
         MOVES — into the AI team, then into marketing to make the studio
         efficient, then the tools for the creative process, then the tools
         around it, then the company — and the move is what a stranger is
         reading for. */
      waypoints: [
        {
          id: "embedded",
          label: "Embedded in marketing",
          sub: "2024",
          note: "First workflows mapped from inside the team.",
          at: 0.04,
        },
        {
          id: "studio",
          label: "The studio brief",
          sub: "2025",
          note: "Making paid social a capability the team owns.",
          target: "studio",
          at: 0.21,
        },
        {
          id: "films",
          label: "The films",
          sub: "Sept 2025",
          note: "Two above-the-line masters, generative end to end.",
          target: "studio-films",
          at: 0.38,
        },
        {
          id: "vesper",
          label: "Tools for the process",
          sub: "Oct 2025",
          note: "One canvas for image and video, in the studio's hands.",
          target: "tool-vesper",
          at: 0.52,
        },
        {
          id: "process",
          label: "Tools around it",
          sub: "Feb 2026",
          note: "Briefing, dubbing and the studio's own project chain.",
          target: "tool-mimir",
          at: 0.69,
        },
        {
          id: "company",
          label: "Company-wide",
          sub: "Q2 2026",
          note: "Studio self-sufficient; adoption opens to every team.",
          at: 0.83,
        },
        {
          id: "architect",
          label: "Intelligence architecture",
          sub: "Now",
          note: "The record of which work runs on which intelligence.",
          target: "intelligence",
          at: 1,
          seat: true,
        },
      ],
      /* The run-in before the axis opens — the "one system earlier" fact
         as chart grammar. It replaced three prose cards; the names are
         the whole of what those cards had to say that a stranger needed. */
      priors: ["Starhaven", "Latent Land"],
      /* THE PLATFORM TRACK, absorbed from the retired `rollout` section
         (ADR-079). Its six log rows plotted the same 2024 → now span under
         a second masthead at the other end of the page; the three that are
         not already stations on the axis survive here, where they read as
         what they were — work that ran BESIDE the course so no team ever
         waited on it. Log-row phrasing, deliberately: a record is not a
         claim, and none of this is a display title. */
      parallel: [
        "Pilot seats tied one-to-one to workflows, the enterprise agreement signed on that evidence, and governance as its own track — so no team ever waited on it.",
      ],
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
        sub: "Paid social became a capability the studio owns, shipped without a specialist in the loop. The ads are the output; the line and the red line are how the studio decides what AI may make.",
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
      /* A CHAPTER since ADR-079: retiring `rollout` freed the fifth inline
         slot, and the reel had been the one full viewport of the page's
         most striking evidence with no link to reach it by. */
      menuPrimary: true,
      ariaLabel: "The above-the-line films",
      head: {
        eyebrow: "Loop Earplugs · September 2025",
        title: { pre: "A world-first", em: "above-the-line film." },
        sub: "Loop was the first brand to ship a fully AI-made above-the-line film, run on YouTube and CTV beside live action. Then the team made a second one.",
      },
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
      /* ⚠ `tool-index`, NOT `head`, since ADR-079. Once every tool owns a
         viewport of its own, a masthead with nothing under it spends a
         whole screen being a divider. The index puts the four records it
         introduces on that screen — resolved from `PROJECT_CASES` by the
         renderer, so nothing here describes a tool twice. */
      kind: "tool-index",
      menuLabel: "Tools",
      menuPrimary: true,
      ariaLabel: "The tools, in production",
      head: {
        eyebrow: "The tools · in production",
        title: { pre: "Software for", em: "few." },
        /* ⚠ THIS PAGE AUTHORS ITS OWN, and the reason is placement.
           `SOFTWARE_FEW_LINE` (shared with the keynote) ends "The Skills
           ABOVE are what those tools run on" — true on the deck, where the
           roster precedes it, and false here since ADR-076 moved the Skills
           to the foot. Share the evidence, author the frame: the argument
           is the same and the sentence points the way this page runs. */
        sub: "Loop's bottlenecks live in software too specific to buy and too small for an agency build. The teams built it themselves, on the Skills they had already written.",
      },
    },
    // Reel labels are the CODENAMES: the reel sits at the left margin and
    // a 14-character handle ("BRIEFING AGENT") crosses the record column at
    // 1440 (measured) — the keynote's reel was cut for ≤9 characters. The
    // dossier's own masthead letters codename · tagline over the function,
    // so the reel's short handle resolves one beat in.
    /* ⚠ VESPER LEADS (ADR-079). The order is the TRAJECTORY's: the tool
       built FOR the creative process comes before the three built AROUND
       it, which is both the real sequence (Oct 2025 → Feb 2026) and the
       distinction the chapter's own sub draws. */
    {
      id: "tool-vesper",
      kind: "dossier",
      menuLabel: "Vesper",
      toolId: "vesper",
      legend: MODE_LEGEND.Compress,
    },
    {
      id: "tool-mimir",
      kind: "dossier",
      menuLabel: "Mímir",
      toolId: "mimir",
      legend: MODE_LEGEND.Invent,
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
    // ⚠ THE `rollout` SECTION IS RETIRED (ADR-079, owner: the rollout
    // "should be like a timeline, and maybe that timeline should be
    // combined with the program").
    //
    // It was an `anatomy` of six dated log rows under its own masthead —
    // and it plotted the SAME 2024 → now span the program board plots, in
    // a second grammar, at the opposite end of the page. A reader met the
    // chronology twice and had to work out that the two were one thing.
    //
    // Where each row went, so nothing is restored from memory:
    //   2024 embedded  → the axis's first station (`embedded`)
    //   Pilot          → the board's `parallel` track
    //   Q2 2026 agreement → `parallel`
    //   Parallel       → `parallel`
    //   Q2 2026 briefed → the `22` register, which letters the figure
    //   Now            → the `people` + `teamsUsing` registers, and the
    //                    `company` station
    //
    // ⚠ Its rows were COPY-WITH-PARITY to the casefile's `ROLLOUT_ROWS`,
    // asserted by `arcs-registry.test.ts`. That assertion goes with the
    // section; the casefile keeps its own rows, which are the canonical
    // copy and are untouched.
    {
      /* THE ARCHITECTURE, AT THE BOTTOM (ADR-076, owner). It closes the
         page rather than interrupting it: the reader has seen the program,
         the four tools and what the layer produced.
         It carries a masthead and NOTHING ELSE. The 47 Skills, their five
         shapes and the 27 configured streams come from the casefile's own
         record (`LOOP_INTELLIGENCE_MAP`), which is why the counts on the
         dial cannot disagree with the landing's.

         ⚠ IT IS THE PROGRAM'S RECORD, NOT THE SUBSTRATE OF EVERYTHING
         ABOVE IT (owner, ADR-078 U1). A bridge used to ask "so what is
         actually underneath this?" over the whole page — which claimed the
         Skills underlie the films too. They do not: the above-the-line work
         is separate work. The map is what the ADOPTION program produced,
         and the head now says only that. */
      id: "intelligence",
      kind: "intelligence",
      menuLabel: "Architecture",
      menuPrimary: true,
      ariaLabel: "The Intelligence Map — the Skills the teams encoded, and the work they run",
      head: {
        eyebrow: "The record · Loop Earplugs",
        title: { pre: "The", em: "Intelligence Map." },
        sub: "Every Skill the teams encoded, mapped to the work it runs.",
      },
    },
    {
      id: "close",
      kind: "close",
      menuLabel: "Close",
      head: {
        title: { pre: "Get in", em: "touch." },
        sub: "For the detail behind any of it, talk to Vince.",
      },
      actions: [
        { id: "talk", label: "Talk to Vince", href: "mailto:vince@thoughtform.co", primary: true },
        { id: "home", label: "thoughtform.co", href: "/" },
      ],
      footerLine: "Thoughtform · Portfolio · Loop Earplugs, 2024 · ongoing.",
      signature: "Compiled by Vince · 2026.",
    },
  ],
};
