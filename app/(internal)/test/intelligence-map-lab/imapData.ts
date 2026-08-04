/**
 * imapData — the Intelligence Map's lab fixtures, ROUND 3.
 *
 * ── PROVENANCE ────────────────────────────────────────────────────────────
 * Every record below is the OWNER'S OWN, authored in his hand-built prototype
 * (v2) after two agent-designed rounds were rejected.
 * This file is a transcription, not a redesign: titles, teams, tiers, modes,
 * quality bars, substrate mappings, the six component values and the polar
 * bearing table are his. Three edits are listed at their site and nowhere
 * else — the genericized MODEL lane, one shortened note, and the wrapped
 * display forms the real-px label layer needs.
 *
 * `repoId` maps each work to the shipped `CaseWorkConfiguration` id in
 * `lib/cases/content/loop-earplugs.ts`, so Phase 1 is a data move rather than
 * a re-authoring. Nothing here is imported by production.
 *
 * ── CONFIDENTIALITY (rules/proof.md, Intelligence Map clause) ─────────────
 * Stricter than the rest of the casefile: NO personal names or identifying
 * initials, NO vendor or model-family names, no token counts, no currency, no
 * internal identifiers. The MODEL component publishes a GENERIC CAPABILITY
 * LANE and nothing else — the prototype's vendor strings are replaced here and
 * `tests/lib/cases-registry.test.ts` is the mechanical guard once this data
 * moves to `lib/cases/`. The HUMAN component names a ROLE, which is what the
 * shipped `ownerRole` / `humanCheckpoint` fields already publish.
 */

/* ══ Works ═════════════════════════════════════════════════════════════ */

export const COMPONENT_KEYS = ["human", "model", "skill", "context", "execution", "eval"] as const;
export type ComponentKey = (typeof COMPONENT_KEYS)[number];

/** `[value, note]` — the value is the answer, the note is why it is the answer. */
export type ComponentEntry = readonly [string, string];

export interface ImapWork {
  id: string;
  /** The shipped `CaseWorkConfiguration.id` this fixture stands in for. */
  repoId: string;
  title: string;
  team: TeamName;
  tier: TierName;
  /** The doctrine's delegation level. */
  mode: "SHARED" | "PERSON-LED" | "SYSTEM-LED";
  /** The quality bar. Rendered in the target readout, never truncated. */
  bar: string;
  substrates: readonly string[];
  components: Readonly<Record<ComponentKey, ComponentEntry>>;
}

export const TEAMS = [
  "LEGAL + RISK",
  "PRODUCT + ENGINEERING",
  "DESIGN + PRODUCTION",
  "CREATIVE + BRAND",
  "OPERATIONS",
  "FINANCE",
  "PEOPLE + PROGRAMS",
] as const;
export type TeamName = (typeof TEAMS)[number];

export const TIERS = ["FAST", "EVERYDAY", "DEEP", "FRONTIER"] as const;
export type TierName = (typeof TIERS)[number];

export const WORKS: readonly ImapWork[] = [
  {
    id: "W01",
    repoId: "review-nda",
    title: "NDA REVIEW",
    team: "LEGAL + RISK",
    tier: "DEEP",
    mode: "SHARED",
    bar: "NUANCED RISK REVIEW / ESCALATE NON-STANDARD CLAUSES",
    substrates: ["S01", "S04", "S05", "S06"],
    components: {
      /* PORT EDIT 1 of 3 — his "HOLDS CONSEQUENTIAL JUDGMENT" is 28 characters,
         166px at the 9px note floor against a 119px station measure. Shortened
         to 20 characters with the meaning intact rather than shrunk below the
         floor or wrapped to a third line (the simplification says ONE note). */
      human: ["COUNSEL", "HOLDS THE HARD CALLS"],
      /* PORT EDIT 2 of 3 — the MODEL component publishes a GENERIC CAPABILITY
         LANE. His vendor/model strings are replaced here and in W02/W03/W05/
         W06/W08; the privacy wall admits no exceptions, including in a lab. */
      model: ["DEEP LANE", "REASONING-HEAVY"],
      skill: ["NDA REVIEW", "POLICY + PRECEDENT"],
      context: ["LEGAL CORPUS", "CLAUSES + HISTORY"],
      execution: ["DOC REVIEW", "SOURCE TRACE"],
      eval: ["08 REAL CASES", "LEGAL OPERATIONS"],
    },
  },
  {
    id: "W02",
    repoId: "audit-firmware-release",
    title: "RELEASE AUDIT",
    team: "PRODUCT + ENGINEERING",
    tier: "FRONTIER",
    mode: "SHARED",
    bar: "SURFACE FIRMWARE RISK BEFORE RELEASE",
    substrates: ["S01", "S03", "S05", "S06"],
    components: {
      human: ["FIRMWARE LEAD", "SIGNS OFF"],
      model: ["FRONTIER LANE", "THE HARDEST BUILDS"],
      skill: ["RELEASE AUDIT", "REPO CONVENTIONS"],
      context: ["REPO + LOGS", "HARDWARE HISTORY"],
      execution: ["CODE + TESTS", "TRACE EXECUTION"],
      eval: ["06 RELEASES", "EMBEDDED HARDWARE"],
    },
  },
  {
    id: "W03",
    repoId: "pressure-test-product-idea",
    title: "IDEA TEST",
    team: "PRODUCT + ENGINEERING",
    tier: "DEEP",
    mode: "PERSON-LED",
    bar: "PRESSURE-TEST THE IDEA WITHOUT FLATTENING IT",
    substrates: ["S01", "S02", "S03", "S06"],
    components: {
      human: ["PRODUCT LEAD", "OWNS DIRECTION"],
      /* His "REASONING" was already generic; normalized to the lane vocabulary
         so all six MODEL values read on one scale. */
      model: ["DEEP LANE", "EXPAND + CHALLENGE"],
      skill: ["CONCEPT TEST", "DECISION LOGIC"],
      context: ["RESEARCH", "MARKET + USER"],
      execution: ["SEARCH", "EVIDENCE TRACE"],
      eval: ["10 CONCEPTS", "PRODUCT STRATEGY"],
    },
  },
  {
    id: "W04",
    repoId: "prepare-supplier-packaging",
    title: "PACKAGING QA",
    team: "DESIGN + PRODUCTION",
    tier: "EVERYDAY",
    mode: "SHARED",
    bar: "CLAIM-SAFE, PRODUCTION-READY PACKAGING",
    substrates: ["S01", "S04", "S05", "S06"],
    components: {
      human: ["PRODUCER", "HANDLES EXCEPTIONS"],
      model: ["EVERYDAY LANE", "BOUNDED CHECKS"],
      skill: ["PACKAGING QA", "CLAIMS + FORMAT"],
      context: ["SOURCE FILES", "PRODUCTION RULES"],
      execution: ["CLAIMS REGISTRY", "FILE CHECK"],
      eval: ["12 PACKS", "DESIGN OPERATIONS"],
    },
  },
  {
    id: "W05",
    repoId: "produce-paid-social-copy",
    title: "BRAND COPY CHECK",
    team: "CREATIVE + BRAND",
    tier: "EVERYDAY",
    mode: "SHARED",
    bar: "ON-BRAND, CLAIM-SAFE, CHANNEL-READY COPY",
    substrates: ["S01", "S02", "S04", "S06"],
    components: {
      human: ["CREATIVE LEAD", "FINAL TASTE"],
      model: ["EVERYDAY LANE", "GENERATION + REVIEW"],
      skill: ["BRAND COPY V3.2", "VOICE + JUDGMENT"],
      context: ["CAMPAIGN", "CHANNEL + AUDIENCE"],
      execution: ["CLAIMS REGISTRY", "SOURCE CHECK"],
      eval: ["12 REAL CASES", "ACCEPTED EXAMPLES"],
    },
  },
  {
    id: "W06",
    repoId: "review-supplier-invoices",
    title: "INVOICE CHECK",
    team: "OPERATIONS",
    tier: "FAST",
    mode: "SYSTEM-LED",
    bar: "MATCH ROUTINE INVOICES / SURFACE EXCEPTIONS",
    substrates: ["S03", "S05", "S06"],
    components: {
      human: ["OPERATIONS", "EXCEPTION OWNER"],
      model: ["FAST LANE", "FAST CLASSIFICATION"],
      skill: ["INVOICE RULES", "MATCHING LOGIC"],
      context: ["FINANCE DATA", "VENDOR HISTORY"],
      execution: ["CHECKING AGENT", "ERP ACCESS"],
      eval: ["20 EDGE CASES", "OPERATIONS"],
    },
  },
  {
    id: "W07",
    repoId: "reconcile-general-ledger",
    title: "LEDGER CHECK",
    team: "FINANCE",
    tier: "EVERYDAY",
    mode: "SYSTEM-LED",
    bar: "SURFACE ANOMALIES WITH A TRACEABLE PATH",
    substrates: ["S03", "S05", "S06"],
    components: {
      human: ["FINANCE", "OWNS THE CALL"],
      model: ["EVERYDAY LANE", "ANOMALY REVIEW"],
      skill: ["LEDGER CHECK", "CONTROL LOGIC"],
      context: ["ERP", "HISTORICAL ENTRIES"],
      execution: ["CHECKING AGENT", "TRACE + FLAG"],
      eval: ["14 REAL CASES", "FINANCE CONTROL"],
    },
  },
  {
    id: "W08",
    repoId: "prepare-cross-team-status",
    title: "STATUS DIGEST",
    team: "PEOPLE + PROGRAMS",
    tier: "FAST",
    mode: "SHARED",
    bar: "RELIABLE WEEKLY READOUT FROM SCATTERED UPDATES",
    substrates: ["S01", "S03", "S06"],
    components: {
      human: ["PROGRAM OWNER", "CORRECTS EMPHASIS"],
      model: ["FAST LANE", "SUMMARISE + STRUCTURE"],
      skill: ["DIGEST", "EDITORIAL LOGIC"],
      context: ["PROJECT RECORDS", "WEEKLY UPDATES"],
      execution: ["NOTION + MONDAY", "RECORD ACCESS"],
      eval: ["08 CYCLES", "PROGRAMS"],
    },
  },
];

/* ══ Substrates ════════════════════════════════════════════════════════ */

export interface ImapSubstrate {
  id: string;
  title: string;
  note: string;
  /* PORT EDIT 3 of 3 (display only) — the ring seats six titles 60° apart at a
     79px label radius, which gives each one ~82px of tangential room. Two of
     the titles measure 134px at the 11px identity size, so every title ships
     a hand-wrapped two-line display form. The STRING is unchanged; only the
     line break is authored. */
  lines: readonly string[];
}

export const SUBSTRATES: readonly ImapSubstrate[] = [
  { id: "S01", title: "JUDGMENT", note: "WHAT GOOD MEANS HERE", lines: ["JUDGMENT"] },
  { id: "S02", title: "TASTE", note: "DISTINCTIONS UNDER AMBIGUITY", lines: ["TASTE"] },
  {
    id: "S03",
    title: "PATTERN RECOGNITION",
    note: "SIGNAL ACROSS REPEATED CASES",
    lines: ["PATTERN", "RECOGNITION"],
  },
  {
    id: "S04",
    title: "CLAIM INTEGRITY",
    note: "WHAT MAY BE SAID AND WHY",
    lines: ["CLAIM", "INTEGRITY"],
  },
  {
    id: "S05",
    title: "EXCEPTION LOGIC",
    note: "WHERE THE PATTERN STOPS",
    lines: ["EXCEPTION", "LOGIC"],
  },
  {
    id: "S06",
    title: "VALIDATION",
    note: "REAL CASES THAT MAKE QUALITY VISIBLE",
    lines: ["VALIDATION"],
  },
];

/* ══ The six component stations ════════════════════════════════════════ */

export interface ComponentSpec {
  key: ComponentKey;
  code: string;
  label: string;
  /** Hex bearing. His angles, unchanged — the fingerprint reads the same on
   *  the core, on every compact node and on the station ring. */
  angle: number;
}

export const COMPONENT_SPECS: readonly ComponentSpec[] = [
  { key: "human", code: "H", label: "HUMAN", angle: -90 },
  { key: "model", code: "M", label: "MODEL", angle: -30 },
  { key: "skill", code: "S", label: "SKILL", angle: 30 },
  { key: "context", code: "C", label: "CONTEXT", angle: 90 },
  { key: "execution", code: "X", label: "EXECUTION", angle: 150 },
  { key: "eval", code: "E", label: "EVAL", angle: 210 },
];

/* ══ Polar seating ═════════════════════════════════════════════════════ */

/** His table, verbatim. A team owns a BEARING; a tier owns a RADIUS; a work
 *  sits where they cross, and it keeps that seat in every range. */
export const TEAM_BEARINGS: Readonly<Record<TeamName, number>> = {
  "LEGAL + RISK": -142,
  "PRODUCT + ENGINEERING": -93,
  "DESIGN + PRODUCTION": -38,
  "CREATIVE + BRAND": 16,
  OPERATIONS: 72,
  FINANCE: 126,
  "PEOPLE + PROGRAMS": 177,
};

/** His table, verbatim — the two PRODUCT + ENGINEERING works split their
 *  shared bearing so neither hides the other. */
export const WORK_BEARING_OFFSETS: Readonly<Record<string, number>> = {
  W01: 0,
  W02: -7,
  W03: 9,
  W04: 0,
  W05: 0,
  W06: 0,
  W07: 0,
  W08: 0,
};

/** PORT EDIT (display only) — a team name is a 9px graticule label and
 *  "PRODUCT + ENGINEERING" measures 136px on one line, which runs off the
 *  east side of the field and into the depth rail. Every name breaks AFTER
 *  its `+`, capping the widest line at 71px. */
export const TEAM_LABEL_LINES: Readonly<Record<TeamName, readonly string[]>> = {
  "LEGAL + RISK": ["LEGAL +", "RISK"],
  "PRODUCT + ENGINEERING": ["PRODUCT +", "ENGINEERING"],
  "DESIGN + PRODUCTION": ["DESIGN +", "PRODUCTION"],
  "CREATIVE + BRAND": ["CREATIVE +", "BRAND"],
  OPERATIONS: ["OPERATIONS"],
  FINANCE: ["FINANCE"],
  "PEOPLE + PROGRAMS": ["PEOPLE +", "PROGRAMS"],
};

/* ══ The depth scale ═══════════════════════════════════════════════════ */

export interface RangeSpec {
  depth: 0 | 1 | 2;
  ord: string;
  name: string;
  /** SIMPLIFICATION — his invented ratios (1:1 / 1:8 / 1:64) are dropped; the
   *  sublabel now says what the range READS. */
  sub: readonly string[];
}

export const RANGES: readonly RangeSpec[] = [
  { depth: 0, ord: "01", name: "CONFIGURATION", sub: ["ONE WORK", "STREAM"] },
  { depth: 1, ord: "02", name: "SUBSTRATE", sub: ["PATTERNS THAT", "TRAVEL"] },
  { depth: 2, ord: "03", name: "ESTATE", sub: ["COMPANY-WIDE", "READ"] },
];

/** The canvas hint — what the next scroll, key or click does. Lives in the
 *  panel's 24px strip, which is the only measure wide enough for it. */
export const RANGE_HINTS: readonly string[] = [
  "SCROLL OUT TO SEE WHAT THIS CONFIGURATION SHARES · CLICK THE CORE TO ZOOM OUT",
  "SCROLL OUT TO PLACE THE TRACE IN THE ESTATE · CLICK A WORK TO INSPECT IT",
  "L CHANGES THE INSTRUMENT · CLICK A WORK TO ZOOM IN · ESC HOLDS THE RANGE",
];

/* ⚠ THIS COPY NAMES THE GEOMETRY, so it moves when the geometry does. His
   strings said SECTORS and RINGS, which described the polar rosette rev A drew;
   rev B is a cartesian plot, so a lens lights a ROW or a COLUMN. Leaving the old
   words in would have been the map describing a diagram it no longer is. */
export const LENS_LINES: Readonly<Record<"team" | "allocation", string>> = {
  team: "ROWS NAME THE TEAM THAT OWNS THE WORK",
  allocation: "COLUMNS NAME THE CAPABILITY LANE",
};

/* ══ Derived lookups ═══════════════════════════════════════════════════ */

export const WORK_BY_ID = new Map(WORKS.map((work) => [work.id, work]));
export const SUBSTRATE_BY_ID = new Map(SUBSTRATES.map((sub) => [sub.id, sub]));
export const WORK_IDS = WORKS.map((work) => work.id);
export const SUBSTRATE_IDS = SUBSTRATES.map((sub) => sub.id);
