/**
 * The lattice lab's specimen copy (ADR-149 §4): ONE record of REAL copy, no
 * lorem, no digits in a title — the jury's Content category is unscorable on
 * placeholder text.
 *
 * ⚠ COPIED, NOT IMPORTED, AND PINNED. Every string below is a LITERAL copy
 * of a public record — the services card record
 * (`components/landing/home-v2/services/serviceData.ts`), the Loop casefile
 * (`lib/cases/content/loop-earplugs.ts` through `PROOF_CASE`) and the home
 * sessions record (`lib/sessions/registry.ts`) — because this module is read
 * by CLIENT components (the shell switches boards on state) and a client
 * chunk is public: importing the registries here would put the whole
 * casefile on a `/test/*` chunk and drag `lib/sheet/dates` with it.
 * `tests/lib/lattice-specimen.test.ts` imports BOTH sides and asserts each
 * copied string `toBe` the record's, so a copy cannot drift silently (the
 * ONE SECTION, ONE RECORD, EVERY SURFACE law, applied to a lab).
 *
 * The section kickers and titles that NAME an arrangement (`THE WAY IN`,
 * `THE SPECIMEN`…) are the lab's own chrome, marked `chrome` in the test's
 * exclusion list; everything else traces to a field.
 *
 * Confidentiality envelope: the casefile strings are used as they are and
 * nothing is added to them — in particular no number joins a title.
 */

export interface SpecimenCell {
  title: string;
  line: string;
}

export interface SpecimenRow {
  key: string;
  value: string;
  tag: string;
}

export interface SpecimenColumn {
  name: string;
  title: string;
  copy: string;
  cta: string;
}

export const SPECIMEN = {
  /* ── the masthead — the services masthead's own two lines and intro ── */
  masthead: {
    /* SERVICES[embedded].kicker */
    kicker: "A SETUP YOUR TEAM RUNS ITSELF",
    /* SERVICES_MASTHEAD.titleLines, authored in capitals (ADR-092: the sans
       does not shout by `text-transform`; the string is the caps) */
    titleLines: ["AI CAPABILITY", "YOUR TEAM OWNS."] as const,
    /* SERVICES_MASTHEAD.intro */
    lede: "We embed in your marketing team and build the setup it runs by itself, from creative production to review. A keynote, a workshop or a home session is the way in.",
  },

  /* ── six cells — the Loop casefile's own claims (ADR-067: a CLAIM and its
     evidence), the Software for Few register's four and the studio's two
     whose titles carry no digit ──────────────────────────────────────── */
  cells: [
    {
      title: "Too specific to buy",
      line: "Four tools in the gap between generic SaaS and an agency build no headcount could justify.",
    },
    {
      title: "Rebuilt, not accelerated",
      line: "Five sources become one surface, five handoffs one flow — and nothing is retyped in between.",
    },
    {
      title: "Owned by the teams",
      line: "Built with the workflow owner; localization now product-manages its own tool end to end.",
    },
    {
      title: "One substrate, four tools",
      line: "The engines share their encoded judgment — one tool was even extracted from another.",
    },
    {
      title: "Two to three times faster",
      line: "More iterations in less time than the former agency route, at the same craft bar.",
    },
    {
      title: "The studio owns the work",
      line: "The team briefs, creates, reviews and ships without a specialist in the loop.",
    },
  ] as const satisfies readonly SpecimenCell[],

  /* ── the split — two services as text columns, and the embedded card as
     the frame beside them ──────────────────────────────────────────────── */
  split: {
    /* chrome */
    kicker: "THE WAY IN",
    /* chrome */
    title: "A keynote, a workshop or a home session",
    columns: [
      {
        name: "Keynote",
        title: "A shared frame for AI.",
        copy: "A grounded argument for treating AI as intelligence rather than software, and for designing its role in work accordingly.",
        cta: "Book a keynote",
      },
      {
        name: "Workshop",
        title: "A first working AI setup.",
        copy: "A hands-on session around one real workflow, producing an encoded practice, a working first setup and a clear build path.",
        cta: "Book a workshop",
      },
    ] as const satisfies readonly SpecimenColumn[],
    frame: {
      name: "Embedded",
      title: "A setup your team runs itself.",
      copy: "Embedded in your marketing team, from creative production to operations to review: a modular sprint in three stage-gated workstreams on your own keys, inside the tools the team already uses, with a standing session for leadership alongside, and a handover dated in week one. Proven first on creative work; the same shape takes any team's own workstreams.",
      cta: "Scope an engagement",
      rows: [
        { key: "Runs", value: "Three workstreams · leadership" },
        { key: "Format", value: "Fixed term · dated handover" },
        { key: "Leaves", value: "The layer, and the team" },
      ] as const,
    },
  },

  /* ── the instrument — the home sessions, plotted ─────────────────────── */
  instrument: {
    /* chrome */
    kicker: "HOME SESSIONS",
    /* SERVICES[guided-build].name */
    title: "Home session",
    /* SERVICES[guided-build].tagline */
    sub: "The skill, for yourself.",
    /* SERVICES[guided-build].body */
    lede: "Six to eight people at a table in Antwerp for one morning: the argument behind the practice, then the skill by hand, with the time a keynote never has.",
    /* SESSIONS[].title, in calendar order */
    stops: ["October morning", "November morning", "December morning", "January morning"] as const,
    /* SESSIONS[].seats */
    seats: "six to eight",
    /* SERVICES[guided-build].ctaLabel / ctaHref */
    cta: "Reserve a seat",
    href: "/home-sessions",
  },

  /* ── the ledger — the services' meta rows, tagged by their verb ──────── */
  ledger: [
    { key: "Runs", value: "Three workstreams · leadership", tag: "EMBEDDED" },
    { key: "Format", value: "Fixed term · dated handover", tag: "EMBEDDED" },
    { key: "Leaves", value: "The layer, and the team", tag: "EMBEDDED" },
    { key: "Runs", value: "Navigate · Encode", tag: "WORKSHOP" },
    { key: "Leaves", value: "First skills + build list", tag: "WORKSHOP" },
    { key: "Format", value: "One morning · Antwerp · NL/EN", tag: "HOME SESSION" },
  ] as const satisfies readonly SpecimenRow[],

  /* ── the head-field — the Intelligence Map row's own head and lede ───── */
  headField: {
    /* PROOF_CASE.casefile.tracks[0].project */
    kicker: "Intelligence Map",
    /* PROOF_CASE.casefile.tracks[0].arc.title */
    title: "We build the layer the agents run on",
    /* PROOF_CASE.casefile.tracks[0].card.lede */
    copy: "Across Loop, team by team. Then we started building for the agents: briefings they read, checks they run on their own work, and a person who signs off.",
  },

  /* ── the frames board's one sentence and its status ──────────────────── */
  frames: {
    /* PROOF_CASE.casefile.tracks[0].project */
    kicker: "Intelligence Map",
    /* PROOF_CASE.casefile.brief, the segments joined */
    body: "Eighteen months inside one company, mapping its work onto the intelligence now available to it — encoded as Skills they own, built as tools, or left human on the record.",
    /* PROOF_CASE.casefile.state */
    foot: "On record",
  },
} as const;

export type Specimen = typeof SPECIMEN;
