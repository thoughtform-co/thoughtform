/**
 * servicePlateData — copy + assets for the "Thoughtform Prime" signal-plate
 * service cards (collapse states: open card / collapsed seed). Source of
 * truth shared by the production `#services` cluster (`ServicesPlateCluster`)
 * and the design lab (`/test/services-prime`).
 *
 * Copy rewritten 2026-07-16 (Vince review), replaced the same evening with
 * the owner's full-section copy: tightened bodies, no em dashes, voice moved
 * from first-person singular to the practice "we" / neutral. Chrome (chips,
 * status codes, feed labels, includes, CTAs, footer telemetry) intact per
 * the same brief; the HUD flavour lives in the chrome, not the sentences.
 * Emphasis segments ({ em }) render as UPRIGHT GOLD, not italic, per the
 * site's no-italics brand rule (the handoff mock used italics).
 *
 * Photos are the subject-centered, web-compressed crops produced by
 * `scripts/services-photos/prepare.mjs` (public/images/services/{id}.{webp,jpg}).
 *
 * 2026-07-25 (ADR-050) — the fields now split by STATE, not by surface:
 *   REST (baked WebGL face):  chip · title · lede · photo
 *   OPEN (DOM spec plate):    breakdown · spec · cta (+ the lede again)
 *   MOBILE PLATE ONLY:        statusCode · feedLabel · feedStatus · includes
 * The rest face used to carry FIVE competing elements (chip + includes +
 * title + lede + a full-width CTA slab over the photo). It now keeps the
 * three that say what the service IS and grows into the spec sheet on click;
 * the logistics row and the CTA slab are what left.
 */

export type ServicePlateId = "keynote" | "workshop" | "embedded" | "guided-build";

/** A run of lede text; `{ em }` marks a gold-emphasis span (upright, not italic). */
export type LedeSegment = string | { em: string };

/**
 * The qualification block — the `02 / HOW` half of Vince's proposal grammar,
 * surfaced on the site for the first time (ADR-050).
 *
 * Until 2026-07-25 the section published only persuasion: every card carried a
 * benefit claim and a lede, and nothing a buyer could self-qualify against.
 * The proposals lead with exactly this data, and half of it already existed in
 * `serviceData.ts`'s `meta` rows (Runs / Format / Leaves) where only the
 * mobile stack rendered it.
 *
 * DELIBERATELY NO PRICE FIELD (owner, 2026-07-25): duration, group size,
 * format and language filter enough for a first conversation; money stays in
 * the proposal. Do not add one without asking — publishing a rate is hard to
 * walk back.
 */
export interface ServiceSpec {
  /** How long it runs ("Half day to multi-day"). */
  duration: string;
  /** Who it is for / how many ("Up to 8 per session"). */
  participants: string;
  /** The shape of the engagement ("Hands-on, on your real work"). */
  format: string;
  /** Delivery languages ("NL / EN"). */
  language: string;
  /** What the team keeps afterwards ("First skills and a build list"). */
  leavesWith: string;
}

export interface ServicePlate {
  id: ServicePlateId;
  /** Gold chip label, e.g. "01 — Keynote". */
  chip: string;
  /** Right-aligned status code, e.g. "NAV-01" (the card appends " · Open"
   * to the open plate, per the Collapse States canvas). MOBILE PLATE ONLY —
   * removed from the WebGL bake 2026-07-17 as decorative filler that crowded
   * the service label. */
  statusCode: string;
  /** Card headline (rendered uppercase by CSS). */
  title: string;
  /** Body paragraph as segments so emphasis stays data-driven. */
  lede: LedeSegment[];
  /**
   * Three or four concrete "what actually happens" lines — the `01 / WHAT`
   * breakdown from the proposal grammar. OPEN STATE ONLY (ADR-050): these
   * never reach the baked card face, which carries the chip + title alone.
   */
  breakdown: string[];
  /** The `02 / HOW` qualification grid. OPEN STATE ONLY (see ServiceSpec). */
  spec: ServiceSpec;
  /** Feed caption under the photo, e.g. "Feed 01 · On stage". MOBILE PLATE
   *  ONLY — dropped from the WebGL bake 2026-07-17. */
  feedLabel: string;
  /** Feed status, e.g. "Live" / "Locked". MOBILE PLATE ONLY. */
  feedStatus: string;
  /** Inline "includes" chips — the single logistics line. Superseded on the
   *  card face by `spec` (ADR-050); still rendered by the mobile plate. */
  includes: string[];
  ctaLabel: string;
  ctaHref: string;
  /** Reserved emphasis flag. As of 2026-07-09 all four CTAs render as the
   * same filled gold button, so this no longer drives the CTA fill (it did
   * pre-2026-07-09, adding `.svc-plate__cta--solid`). Kept for possible
   * future per-card emphasis; wire a new consumer before relying on it. */
  focus?: boolean;
  /** Optional — services without a shipped hologram photo render a schematic
   * dot-grid placeholder in both the seed feed band and the open photo
   * window (`ServicePlateCard` handles the fallback). Drop the photo in and
   * ship the shape below to promote a service to full C3 hologram plate. */
  photo?: {
    webp: string;
    jpg: string;
    alt: string;
    /** `background-position` for the landscape feed window / sliver. The
     * assets are portrait card crops with the subject horizontally centered
     * (scripts/services-photos/prepare.mjs), so X stays 50% and Y picks the
     * face band. Tuned by vision inspection per photo. */
    position: string;
  };
}

/** Photo ASSET ids — decoupled from the slot ids because the asset is named
 * after the service it was shot for ("strategic" has no slot; it was Strategic
 * Advisory's and is the Home session's now — the one shot at a table). Assets
 * are produced by scripts/services-photos/prepare.mjs from the 2026-07-10
 * `-2` sources. */
type ServicePhotoAssetId = ServicePlateId | "strategic";

const photo = (id: ServicePhotoAssetId, alt: string, position: string) => ({
  webp: `/images/services/${id}.webp`,
  jpg: `/images/services/${id}.jpg`,
  alt,
  position,
});

/* Copy + order rewritten 2026-07-09 (Vince review). The four ServicePlateId
 * keys are FIXED SPATIAL SLOTS (not service names) — each id is wired to a
 * rack position, a brandmark anchor pick, a designation set, and a scan note.
 *
 * HARMONIZED 2026-08-02 (owner copy, verbatim — see serviceData.ts for the
 * ruling). Every title is now the service's OUTCOME STATEMENT and the lede
 * its one-sentence definition; the occupancy follows the owner's
 * progression (shared frame → working setup → internal capability →
 * portfolio direction).
 *
 * RE-CUT 2026-09-19 (ADR-112, owner): Strategic Advisory FOLDS INTO the
 * embedded offer — the doctrine's "standing session with leadership" is what
 * Advisory's monthly read becomes inside the embed, and the chip is EMBEDDED
 * (the doctrine's own flagship word, spanning both altitudes) — and the fourth
 * slot hosts the HOME SESSION, new on the site: six to eight people at the
 * owner's table in Antwerp for one morning, the argument in full and then
 * the skill by hand. The id → service mapping is now:
 *   keynote  slot (left rack, top)    → 01 Keynote       (keynote photo)
 *   workshop slot (left rack, bottom) → 02 Workshop      (workshop photo)
 *   embedded slot (right rack, top)   → 03 Embedded      (embedded photo)
 *   guided   slot (right rack, bottom)→ 04 Home session  (strategic photo — the
 *                                       one shot at a table, the slot's own asset)
 * Status codes are phase + index (NAV-01 / ENC-02 / BLD-03 / NAV-04) so the
 * mobile chrome reads the progression. Keeping the ids as slot keys avoids
 * re-tuning every spatial map; the photo for each slot is pointed at the
 * correct asset by hand. All four slots carry photos since the 2026-07-10
 * `-2` reshoot (ADR-029 card ring); the schematic dot-grid fallback stays
 * wired for any future photo-less service.
 *
 * ⚠ NO PRICE, NO DIGIT ON THE HOME SESSION. It is the one service ops prices
 * per seat, and the card law is that money stays in the proposal; digits are
 * banned on its copy outright (`tests/lib/services-copy.test.ts`) so a rate
 * cannot creep in as "€450". The phone back's fit is solved before any string
 * here is written — the same test walks every record through `backFaceLayout`.
 *
 * ⚠ BAKE FIT: the tight face wraps the lede upward from a fixed baseline
 * (ServicesCardRing TIGHT_COPY_BOTTOM), so a longer lede EATS PHOTO, never
 * clips — but the two long ledes (Embedded 156ch, Home session 157ch) run
 * four lines at the 35px bake size where the old ones ran three. Verified
 * on the baked faces 2026-08-02 and 2026-09-19; anything longer than ~160ch
 * starts crowding the title band (`LEDE_MAX_CH`, tested). */
export const SERVICE_PLATES: readonly ServicePlate[] = [
  {
    id: "keynote",
    chip: "Keynote",
    statusCode: "NAV-01",
    title: "A shared frame for AI.",
    lede: [
      "A grounded argument for treating AI as intelligence rather than software, and for designing its role in work accordingly.",
    ],
    breakdown: [
      "Built on your industry's cases, not generic AI slides",
      "Live demos, so the room sees the work happen",
      "A take-home deck the team can reuse",
    ],
    spec: {
      duration: "30 to 90 minutes",
      participants: "Any room size",
      format: "Live demos, built for your industry",
      language: "NL / EN",
      leavesWith: "A shared language for AI",
    },
    feedLabel: "Feed 01 · On stage",
    feedStatus: "Live",
    includes: ["Live demos", "Custom cases", "Take-home deck", "NL / EN"],
    ctaLabel: "Book a keynote",
    ctaHref: "#contact",
    photo: photo("keynote", "Vince Buyssens delivering a keynote on stage", "50% 22%"),
  },
  {
    id: "workshop",
    chip: "Workshop",
    statusCode: "ENC-02",
    title: "A first working AI setup.",
    lede: [
      "A hands-on session around one real workflow, producing an encoded practice, a working first setup and a clear build path.",
    ],
    breakdown: [
      "We map your team's real workflows before touching a tool",
      "They build their first working AI tools in the room",
      "A follow-up session once the first patterns have run",
    ],
    spec: {
      duration: "Half day to multi-day, plus follow-up",
      participants: "Up to 8 per session",
      format: "Hands-on, on your own work",
      language: "NL / EN",
      leavesWith: "First skills and a build list",
    },
    feedLabel: "Feed 02 · On the floor",
    feedStatus: "Standby",
    includes: ["Workflow mapping", "First skills", "Build list", "NL / EN"],
    ctaLabel: "Book a workshop",
    ctaHref: "#contact",
    photo: photo("workshop", "Vince Buyssens working with a team in a studio session", "50% 18%"),
  },
  {
    id: "embedded",
    chip: "Embedded",
    statusCode: "BLD-03",
    title: "An intelligence configuration you own.",
    /* ADR-124 (owner, 2026-09-24): the card says what the work IS, in the
       room it is built in. "Marketing team" is a deliberate narrowing of
       ADR-111's "any team"; the general claim keeps its place in
       `serviceData.body`. The word "creative" stays off the baked face and
       the phone back (ADR-111), so the scope reads production, operations,
       review. 148 characters against LEDE_MAX_CH. */
    lede: [
      "Embedded in your marketing team, from production to operations to review: a setup on your own keys, in your own tools, that the team runs by itself.",
    ],
    /* ADR-112: the leadership altitude enters through the third bullet — the
       doctrine's "standing session with leadership" is what Advisory's monthly
       read becomes inside the embed. The bullet stays two lines on the back
       (the fit test measures it). */
    breakdown: [
      "Setup and briefing, the first workstream you run alone",
      "Generation and design, run with your team as the last gate",
      "Operations and scaling, and a standing session with leadership",
    ],
    /* ⚠ `leavesWith` IS THE ONE PAID LINE ON THE PHONE BACK (ADR-111). The back
       had 67px of slack; a second line there costs 44 and `participants` /
       `language` growing cost NOTHING (their rows are already two-line tall
       because `duration` and `format` are, and `rowH = max(...)`). It is spent
       here because this is where the doctrine's non-negotiable discipline sits:
       state the layer's value and its DEPENDENCE in the same breath, or the
       claim arms whoever wants to cut the experts. The team is named as the
       mechanism twice — here and in `participants` — so the card cannot be read
       as replacing it. */
    spec: {
      duration: "Fixed term, dated handover",
      participants: "Your team, as the last gate",
      format: "Your keys, your tools",
      language: "NL / EN",
      leavesWith: "The layer, and the team that runs it",
    },
    feedLabel: "Feed 04 · On site",
    feedStatus: "Standby",
    includes: ["Three workstreams", "Your own keys", "Leadership session", "Dated handover"],
    ctaLabel: "Scope an engagement",
    ctaHref: "#contact",
    photo: photo("embedded", "Vince Buyssens on site during an embedded engagement", "50% 45%"),
  },
  {
    id: "guided-build",
    chip: "Home session",
    statusCode: "NAV-04",
    title: "The skill, for yourself.",
    lede: [
      "Six to eight people at a table in Antwerp for one morning: the argument behind the practice, then the skill by hand, with the time a keynote never has.",
    ],
    breakdown: [
      "The argument in full, then your own work on the table",
      "Six to eight people, each registered for themselves",
      "Food and drinks, a printed handout, and the circle after",
    ],
    spec: {
      duration: "One morning, three hours",
      participants: "Six to eight, individually registered",
      format: "At the table, in Antwerp",
      language: "NL / EN",
      leavesWith: "The skill, and the people you sat with",
    },
    feedLabel: "Feed 03 · At the table",
    feedStatus: "Standby",
    includes: ["Six to eight seats", "One morning", "Antwerp", "NL / EN"],
    ctaLabel: "Reserve a seat",
    ctaHref: "/home-sessions",
    // The slot's own asset: the one shot at a table, which is what a home
    // session is. The alt says what the picture shows.
    photo: photo("strategic", "Vince Buyssens at the table, mid-session", "50% 32%"),
  },
];
