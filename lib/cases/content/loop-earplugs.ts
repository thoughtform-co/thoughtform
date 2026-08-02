import type { CaseDef, CaseSignalPoint } from "../types";

/**
 * Loop Earplugs — the flagship case (ADR-054), rendered as the casefile at
 * the top of `#services` (ADR-056).
 *
 * SHAPE. `report` + `beats` are the evidence; `casefile` is that evidence
 * recomposed as one interactive viewport. The two share their plates through
 * the hoisted consts below rather than restating them — a rollout-log row
 * edited here changes both surfaces, which is the only way they can be
 * guaranteed not to drift.
 *
 * NUMBERS. Every figure below is sourced; `stat.source` carries the
 * provenance. Where the harvest offered competing denominators the
 * SMALLER, exec-facing one is printed and the other is never shown:
 *   · 22 workshops = the board count of team sessions run. 14 is the count
 *     of teams with published skill cards — A DIFFERENT SET, and since
 *     2026-08-02 BOTH are published, so the wording has to keep them
 *     apart: teams are BRIEFED (22, the rollout log and the governance
 *     row) or they are USING THE LAYER (14, the Intelligence Map foot).
 *     Never "22 teams mapped" — that phrasing claimed the second number's
 *     meaning with the first number's value, and is now pinned out.
 *   · 47+ Skills = the count tagged to one of the five shapes, and the
 *     figure the Intelligence Map plate SUMS ON SCREEN (12 + 7 + 9 + 5 +
 *     14). It replaced 42 on 2026-08-02, everywhere at once: the plate
 *     makes the arithmetic visible, so a surviving 42 anywhere on the
 *     page would be a second variant the reader can check. (51 is the
 *     registry's card count including untagged and scoped placeholders;
 *     printing both invites arithmetic that reconciles to neither.)
 *   · 4 tools = PROJECT_CASES / CASE_TOTAL.
 * "95% of briefings ship with AI" is deliberately ABSENT: it is already
 * published on the ai-keynote arc page (`lib/arcs/content/ai-keynote.ts`),
 * and a second variant of the same claim on a second surface drifts. The
 * Build beat's "days to minutes" line carries that story without a
 * percentage. The `Thoughtform Prime` design handoff printed 15+ teams /
 * 20+ Skills / 90% of paid social — those predate this doctrine and are
 * pinned OUT by `tests/lib/cases-registry.test.ts`.
 *
 * CONFIDENTIALITY. No spend, commit, contract value, or per-seat figure
 * appears here or may be added — see `.claude/rules/proof.md`. Loop staff
 * are first-name only. Tool codenames are in scope for a case study
 * (published precedent: PROJECT_CASES); they stay OUT of general service
 * copy (`services/serviceDesignations.ts`).
 */

/* ── Evidence, hoisted so both surfaces read the same rows ───────────── */

const ROLLOUT_ROWS = [
  { t: "2024", event: "Embedded. First workflows mapped" },
  { t: "Pilot", event: "69 seats, one team at a time" },
  { t: "Q2 2026", event: "Enterprise agreement signed" },
  { t: "Parallel", event: "SSO · connector review · governance" },
  { t: "Q2 2026", event: "22 teams briefed, 45 minutes each" },
  { t: "Now", event: "130+ people, on organic pull" },
] as const;
const ROLLOUT_TAIL = "One workflow worth encoding, per team.";

/**
 * The work → intelligence map (2026-07-31), WEIGHTED 2026-08-02.
 *
 * WHAT CHANGED AND WHY. This was a skills registry: the rows named a
 * workflow and the `tag` named which of the five shapes it belonged to. It
 * now names WHAT RUNS THE WORK. That one change is the difference between
 * a list of artifacts and a map.
 *
 * THE WEIGHTS (2026-08-02, ADR-056 U12) are the second change, and they
 * qualify the July ruling rather than reversing it. That ruling — "a count
 * of Skills is not evidence of a transformation" — was about the FOOT of a
 * row claiming a transformation. This row now claims THE MAP ITSELF, and a
 * map with no scale is a diagram: how much of the portfolio each shape
 * carries, and how far it spreads, is exactly what a reader needs to see
 * that the taxonomy is load-bearing and not five words invented for a
 * slide. The counts sum to the 47+ the foot prints, in view, which is why
 * the sweep of that figure had to land in the same change.
 *
 * `count` and `teams` are read from the client's own adoption board (rev
 * 2026.07), where the tagging lives. The BEAT renders name + gloss only, so
 * it is unaffected by the weights it now carries — the two surfaces still
 * share this array by reference, which is what stops them describing the
 * same portfolio differently.
 *
 * A third field naming two Skills per shape was built and CUT: it clipped
 * 59px at 1440×820 and 39px at 1600×900, so it would have shipped as copy
 * visible on roughly one desktop in ten. See the note on `types.ts`.
 *
 * The `Human` row below is the load-bearing one. A map with no human rows
 * is a sales list; the measurement that makes it a decision record is that
 * "stays human" is recorded rather than left as a gap. Do not remove it to
 * make the panel look more automated — that would invert its meaning.
 *
 * The five shapes themselves are unchanged: they are the taxonomy of the
 * work, and they outlive the assignment beside them.
 */
const MAP_GROUPS = [
  {
    name: "Judgment",
    gloss: "Applies senior judgment to varied inputs.",
    count: "12",
    teams: "9 teams",
  },
  {
    name: "Voice",
    gloss: "Writes in a specific Loop voice.",
    count: "7",
    teams: "4 teams",
  },
  {
    name: "Validation",
    gloss: "Checks output against a Loop bar.",
    count: "9",
    teams: "6 teams",
  },
  {
    name: "Stakeholder",
    gloss: "Frames information for a specific reader.",
    count: "5",
    teams: "4 teams",
  },
  {
    name: "Pattern",
    gloss: "Composes structured outputs from recurring inputs.",
    count: "14",
    teams: "10 teams",
  },
] as const;
/**
 * THREE rows — ONE PER ASSIGNMENT. Measured, not chosen.
 *
 * The plate box holds about eight lines and five of them are the groups
 * above, so the row budget is three. Everything past that clips silently,
 * and the clipping is viewport-dependent: at six rows 1280×720 showed
 * three, 1440×800 showed four, and 1920×1080 showed all six, so the defect
 * is invisible on the machine most likely to be authoring it. A fourth row
 * looked fine at 1920 and had its TAG sliced at 1440 — a row with half a
 * tag reads as broken, which is worse than a shorter list.
 *
 * ⚠ THE WEIGHTS SPEND THE SAME BUDGET (2026-08-02), which is why they had to
 * stay on ONE line per group. A second line — two Skills named per shape —
 * cost 71px and clipped at every viewport below ~970h, and these rows are
 * what it would have pushed out. They win that conflict every time: the
 * `Human` row is the one thing on this plate that cannot be lost.
 *
 * The old skills registry had the same budget problem; it just sat on row
 * five where few readers reached it. As the default panel it is the first
 * thing anyone sees.
 *
 * So the list is a KEY, not a census: one exemplar of each answer the map
 * can give. That is also the more honest register — six rows implied an
 * inventory, and the inventory is not what this panel is claiming.
 * ⚠ Adding a fourth row costs the laptop tiers an assignment, and no test
 * will tell you.
 */
const MAP_ROWS = [
  { team: "Legal", name: "NDA pre-check", tag: "Skill" },
  { team: "Studio", name: "Briefing synthesis", tag: "Tool" },
  { team: "Design", name: "CMF sign-off", tag: "Human" },
] as const;
/* NO FOOTER, deliberately. The plate's box holds about nine lines and five
   are the groups, so a footer of any length pushed a row out at 1280×720 and
   1440×800 — and a line that renders only at 1920 is dead copy someone will
   later edit believing it ships. What it said ("Skill, tool, or human —
   every row is a recorded decision") is what the TAGS already show, so this
   cuts a restatement rather than evidence. The 295-ads grounding claim the
   old skills-registry footer carried is still published on the ai-keynote
   arc page; nothing went with this. */

const TOOL_IDS = ["mimir", "vesper", "babylon", "heimdall"] as const;

/**
 * Three paid-social cuts, reused verbatim from the ai-keynote arc page
 * (`lib/arcs/content/ai-keynote.ts`) — same files, same alt text, so the two
 * surfaces cannot end up describing the same ad differently.
 *
 * What deliberately does NOT come across: the arc carries per-ad spend,
 * order value and ROAS. That page is a client deck; this is the public
 * landing, where the confidentiality envelope bans currency outright
 * (`.claude/rules/proof.md`, pinned by the registry test). The panel says
 * "beat the ROAS benchmarks" and prints no figure.
 */
const STUDIO_SHOTS = [
  {
    src: "/arcs/studio-ads/exp-sb93-filter.jpg",
    alt: "Loop Switch ad: It's parenting, but just the good bits — earplug case with hear/filter checklist.",
    width: 1080,
    height: 1350,
  },
  {
    src: "/arcs/studio-ads/exp-lm103-highlight.jpg",
    alt: "Loop fashion ad: monochrome portrait of a man with a Loop earplug highlighted by a square reticle.",
    width: 1080,
    height: 1350,
  },
  {
    src: "/arcs/studio-ads/exp-sb92-ski.jpg",
    alt: "Loop Engage ad: stress-free ski trips — skier in helmet and goggles, three callout chips around the ear.",
    width: 1080,
    height: 1350,
  },
] as const;

/** Both above-the-line films, self-hosted. CSP is `media-src 'self' blob:`
 *  (`lib/security/headers.mjs`), so these can never be served from a bucket
 *  — a remote src would be blocked the moment CSP leaves report-only. */
const ATL_FILMS = [
  {
    src: "/videos/loop-smug-owl-ai-atl.mp4",
    poster: "/arcs/posters/smug-owl.jpg",
    label: "Smug Owl · Loop ATL",
    meta: "16:9 master · 30 sec",
  },
  {
    src: "/videos/loop-dj-neighbour-ai-atl.mp4",
    poster: "/arcs/posters/dj-neighbour.jpg",
    label: "DJ Neighbour · Loop ATL",
    meta: "16:9 master · 30 sec",
  },
] as const;

/**
 * The rollout log re-read as an adoption curve. Milestones are the log's own
 * rows; the y-axis is the seat count the `5 → 130+` stat already publishes.
 * The handoff's invented quarters ("25.Q2 skill layer live", "25.Q4 4 tools
 * shipped") are not in this module and are not used.
 */
const ADOPTION_SIGNAL: readonly CaseSignalPoint[] = [
  { x: 0.04, y: 0.06, stamp: "2024", label: "Embedded" },
  { x: 0.3, y: 0.24, stamp: "Pilot", label: "69 seats" },
  { x: 0.66, y: 0.62, stamp: "26.Q2", label: "22 teams briefed" },
  { x: 0.95, y: 0.94, stamp: "Now", label: "130+ on the layer" },
];

export const LOOP_EARPLUGS_CASE: CaseDef = {
  slug: "loop-earplugs",
  client: "Loop Earplugs",

  report: {
    title: { pre: "Mission report:", em: "Loop Earplugs." },
    lede: "Eighteen months inside one company, mapping its work onto the intelligence now available to it. Every workflow encoded as a Skill the team owns, built into a tool where off-the-shelf software never fit, or left human on the record. The same Arc we teach, run at company scale.",
    stats: [
      {
        value: "22",
        label: "workshops run",
        detail: "one per team",
        source: "adoption board, team-session count",
      },
      {
        value: "47+",
        label: "Skills encoded",
        detail: "versioned, team-owned",
        source:
          "count tagged to the five shapes (12+7+9+5+14), the figure the map plate sums; the registry holds 51 cards incl. untagged and scoped",
      },
      {
        value: "4",
        label: "production tools",
        detail: "built in-house",
        source: "PROJECT_CASES / CASE_TOTAL",
      },
      {
        value: "5 → 130+",
        label: "people on the layer",
        detail: "in 18 months",
        source: "adoption curve; a 69-seat pilot went company-wide on organic demand",
      },
    ],
    meta: [
      { label: "Client", value: "Loop Earplugs" },
      { label: "Role", value: "Embedded AI lead" },
      { label: "Period", value: "2024 · ongoing" },
      { label: "Status", value: "Live" },
    ],
  },

  beats: [
    {
      id: "proof-navigate",
      phase: "navigate",
      title: { pre: "Every team,", em: "one frame." },
      body: [
        "Every team gets the same forty-five minute kickoff and the same starting question: where does the work actually happen. Nobody leaves with a tool demo. They leave with one workflow of their own worth encoding.",
        "It spread because people asked for it, not because a mandate said so — a pilot of sixty-nine went company-wide on inbound demand alone. Underneath, three tracks ran in parallel so the pull had somewhere to land: the enterprise agreement, single sign-on, and the legal review of every connector. Each team keeps its own steward.",
      ],
      receipts: [
        "Zero to a functioning AI practice in 21 days",
        "Agreement, SSO and legal review — three tracks, in parallel",
      ],
      visual: {
        kind: "log",
        title: "Rollout log",
        rows: ROLLOUT_ROWS,
        tail: ROLLOUT_TAIL,
      },
    },
    {
      id: "proof-encode",
      phase: "encode",
      title: { pre: "Judgment,", em: "encoded." },
      body: [
        "What surfaces in a workshop does not stay in the transcript. It becomes a Skill — versioned, reviewed, and owned by the team in one governed repository rather than by the person who wrote it. Forty-seven are in motion across the company.",
        "Encoding it is only half the act. The other half is deciding what should run each piece of work: a Skill the team owns, a tool built on those Skills, or a person, on the record. Every one of them is a variation on five recurring shapes of work — and the shapes outlive the model version, the team roster, and whatever surface launches next.",
      ],
      closer: [
        "When the model changes, the ",
        { em: "substrate stays" },
        ". When a team rotates, the ",
        { em: "judgment stays" },
        ". When a new surface launches, it inherits the layer that was already there.",
      ],
      visual: {
        kind: "registry",
        title: "Work → intelligence · what runs what",
        groups: MAP_GROUPS,
        rows: MAP_ROWS,
      },
    },
    {
      id: "proof-build",
      phase: "build",
      title: { pre: "Software for", em: "few." },
      body: [
        "Off-the-shelf software is built for millions, so it is too broad. An agency build is too expensive for a team of ten and too far from the work. The third option is a tool built with the team that owns the workflow, standing on the Skills they already authored.",
        "Four of them run in production daily. The localization managers now product-manage the dubbing tool end to end across thirty-plus markets — it was handed over, not just delivered — and the same pipeline is moving into above-the-line work.",
      ],
      receipts: [
        "A world-first AI above-the-line film, shipped through the same layer",
        "Briefing synthesis: days to minutes",
      ],
      visual: { kind: "tool-strip", toolIds: TOOL_IDS },
    },
  ],

  casefile: {
    ix: "01",
    tab: "Loop Earplugs",
    logCode: "TF-24",
    state: "On record",
    classLine: "AI adoption · marketing → company-wide · 2024 — active",
    // `report.lede` tightened, with one clause marked for the gold wash.
    // Re-typed as segments rather than sliced out of the string so the
    // emphasis is data, not a fragile substring match.
    //
    // ⚠ LENGTH IS A HARD CONSTRAINT, and it fails SILENTLY. `.fl-brief` is
    // height-boxed against the `--fl-t6` seam with `overflow: hidden` and no
    // scrollbar, so a brief that outgrows its box just loses its tail.
    // Measured 2026-07-31: 1280×720 is the binding viewport at ~154px of box,
    // which is about 195 characters — a 246-character draft lost 23px there
    // and 9px at 1440×800 while looking perfect at 1920×1080. This runs 167.
    // Re-measure at 1280×720 after any edit here; the taller viewports will
    // not tell you.
    //
    // It closes on Skill / tool / human because that is exactly what the
    // row-one map shows — the brief previews the panel rather than
    // restating the mission report.
    brief: [
      "Eighteen months inside one company, ",
      { em: "mapping its work onto the intelligence now available to it" },
      " — encoded as Skills they own, built as tools, or left human on the record.",
    ],
    /* ORDER IS THE DIRECTORY, and the first row is what the casefile OPENS
       ON.

       THE MAP LEADS (owner, 2026-07-31; retitled 2026-08-02). The studio
       held row one while this directory was a list of deliverables, and it
       was the right call then. It is the wrong one now: the studio, the
       films and the tools are OUTPUTS of the mapping work, and leading with
       them presented an output as if it were the engagement. The largest
       thing here is eighteen months of deciding what should run which work
       — so that is row one, and the evidence it produced follows it.

       Two consequences worth knowing before reordering again:
       · Row one's plate mounts WITH the casefile. A media row here puts its
         bytes on page load — that cost 23.6 kB while the studio led, and
         moving to a pure-DOM plate gives it back.
       · The mission report closes the file instead of opening it: it
         summarises what the rows above already showed. Its `00_` keeps it
         reading as the master log rather than a sixth project. */
    tracks: [
      {
        // NOT `transformation` — that id belongs to the workshop-rollout row
        // below and the plate-sharing guard keys on it. Two ids one word
        // apart would be a standing trap.
        // Renamed "AI Transformation" → "Intelligence Map" (owner,
        // 2026-08-02). The old title named a CATEGORY OF ENGAGEMENT, which
        // every consultancy's page also claims; this one names the artifact
        // the engagement produced, which only someone who did the work can
        // show. The word is deliberately vague on its own — the brief
        // beside it is what resolves it, and the plate is what proves it.
        //
        // The ID DOES NOT CHURN with the rename (precedent: `transformation`
        // → `workshop-rollout` kept its id). It is a DOM id, and the
        // plate-sharing guard has keyed on plate KIND since 2026-07-31, so
        // nothing downstream reads this string. `file` and `project` DO move
        // together — the registry test normalises one against the other.
        id: "ai-transformation",
        file: "01_INTELLIGENCE-MAP/",
        meta: "5 → 130+",
        project: "Intelligence Map",
        icon: "dir",
        preview: "Preview — 01_intelligence-map/",
        vizLabel: "Map — work to intelligence",
        // The ONLY `registry` track, and the reference-equality guard finds
        // the first one — so this is what keeps the beat/casefile plate
        // sharing live now that the skill-layer row is gone.
        visual: {
          kind: "registry",
          groups: MAP_GROUPS,
          rows: MAP_ROWS,
        },
        // FOUR BLOCKS, not three readouts (owner, 2026-08-02). The readout
        // trio could only say things that reduce to a number, so the two
        // claims that matter most here — that the layer is one system, and
        // that the teams own it — had no way to appear. The 2×2 grammar is
        // the tool gallery's, and the fourth block deliberately carries no
        // figure at all.
        //
        // This QUALIFIES the July "system numbers, not artifact counts"
        // ruling rather than discarding it: that ruling protected a row
        // claiming a TRANSFORMATION from being evidenced by an inventory.
        // The row now claims THE MAP, and the size of what is mapped is the
        // evidence for it. The two numbers that left (21 days, 05 shapes)
        // are not lost — 21 days still prints on the rollout and governance
        // rows, and the five shapes ARE the plate above.
        //
        // ⚠ "14 teams" is a DIFFERENT SET from the 22 in the rollout log and
        // the governance row (see NUMBERS at the top of this file). The
        // titles are what keep them apart: USING THE LAYER vs BRIEFED. Do
        // not harmonise the wording.
        blocks: [
          {
            stat: "47+",
            title: "Skills in active use",
            desc: "Reusable methods, standards and review logic encoded for AI.",
          },
          {
            stat: "14",
            title: "Teams using the layer",
            desc: "Across creative, legal, finance, product, programs and operations.",
          },
          {
            stat: "1",
            title: "Shared intelligence layer",
            desc: "One system for authoring, testing, versioning, ownership and reuse.",
          },
          {
            // No `stat`. The claim is a property of the layer, not a count
            // of it, and inventing "14" here twice would say less.
            title: "Domain-owned",
            desc: "The teams that know the work maintain the Skills and extend them after handoff.",
          },
        ],
        context: [
          { k: "Period", v: "2024 · ongoing" },
          { k: "Scope", v: "Marketing → company" },
          // Key kept SHORT: the three-up register puts this in the rightmost
          // column, and "Unit of done" + a 20-char value ran off the panel
          // edge at 1440. The ≤20 guard on the value alone does not catch it.
          { k: "Unit", v: "One workflow encoded" },
        ],
        // The board is the system of record and is NAMED, never linked — the
        // confidentiality envelope bans the domain outright.
        source: "Source — adoption board · rev 2026.07",
        stamp: { ord: "01", phase: "Navigate", ref: "NAV-01" },
        // THE ONLY PER-TRACK BRIEF (2026-08-01, ADR-056 U11). The standing
        // casefile brief has to serve all eight rows, so it can only describe
        // the engagement — it cannot make this row's claim.
        //
        // OWNER COPY, VERBATIM (2026-08-02). The words are not ours to
        // tighten: the gold-wash marker was placed on an existing phrase
        // rather than rewriting one in, and the split into segments is a
        // display treatment only. It replaced a draft that opened on what
        // "most AI work" does — a frame the reader has to accept before the
        // sentence pays off. This one opens on the client's own before-state
        // and names the thing the row is titled after, which is what makes
        // "Intelligence Map" resolve instead of hang.
        //
        // "Over eighteen months" is the SAME claim as the mission report's
        // lede and the `5 → 130+` stat's detail — one duration, three
        // surfaces, deliberately identical.
        //
        // 300 chars against the ~330 the U11 tick move bought at 1280x720
        // (the binding viewport; it was ~195 before). Re-measure THERE.
        brief: [
          "Over eighteen months, Loop's scattered AI experiments became a ",
          { em: "shared intelligence layer" },
          ": domain knowledge encoded as versioned Skills, connected to tools and agents, and mapped to the workflows they support. The result is one maintained system for reuse, evaluation and ownership across the company.",
        ],
      },
      {
        id: "studio",
        file: "02_AI-FLUENCY-STUDIO/",
        meta: "500 ADS/MO",
        project: "AI Fluency Studio",
        icon: "dir",
        preview: "Preview — 02_ai-fluency-studio/",
        vizLabel: "Viz — performance evidence",
        visual: { kind: "stills", shots: STUDIO_SHOTS },
        readouts: [
          { value: "500", label: "ads a month with AI in the chain" },
          { value: "2-3×", label: "faster than the agencies replaced" },
        ],
        context: [
          { k: "Phase", v: "Build" },
          { k: "Surface", v: "Production platform" },
          { k: "Owner", v: "The studio" },
        ],
        source: "Source — studio production line · rev 2026.07",
        stamp: { ord: "02", phase: "Build", ref: "BLD-01" },
      },
      {
        id: "atl-films",
        file: "03_AI-ABOVE-THE-LINE/",
        meta: "2 FILMS",
        project: "AI Above-the-Line",
        icon: "dir",
        preview: "Preview — 03_ai-above-the-line/",
        vizLabel: "Viz — the films",
        visual: { kind: "films", films: ATL_FILMS },
        readouts: [
          { value: "2", label: "films fully AI-produced" },
          { value: "1", label: "crew shared with live action" },
        ],
        context: [
          { k: "Phase", v: "Build" },
          { k: "Format", v: "Above-the-line" },
          { k: "Owner", v: "The creative team" },
        ],
        source: "Source — creative archive · rev 2026.07",
        stamp: { ord: "03", phase: "Build", ref: "BLD-02" },
      },
      {
        id: "tooling",
        file: "04_SOFTWARE-FOR-FEW/",
        meta: "4 TOOLS",
        project: "Software for few",
        icon: "dir",
        preview: "Preview — 04_software-for-few/",
        vizLabel: "Fleet — in production",
        visual: { kind: "tools", toolIds: TOOL_IDS },
        readouts: [
          { value: "04", label: "production tools" },
          { value: "47+", label: "Skills they stand on" },
          { value: "Days → min", label: "briefing synthesis" },
        ],
        context: [
          { k: "Built with", v: "The workflow owner" },
          { k: "Instead of", v: "Off-the-shelf" },
          { k: "Cadence", v: "Daily" },
        ],
        source: "Source — fleet registry · rev 2026.07",
        stamp: { ord: "04", phase: "Build", ref: "BLD-03" },
      },
      {
        // Renamed from `transformation` (2026-07-31) when the AI Transformation
        // row landed above. The plate-sharing guard in
        // `tests/lib/cases-registry.test.ts` keys on this id BY STRING and
        // does not fail on a rename — it silently stops guarding. The two
        // move together or the guard is dead.
        id: "workshop-rollout",
        file: "05_WORKSHOP-ROLLOUT/",
        meta: "22 WORKSHOPS",
        project: "Workshop Rollout",
        icon: "dir",
        preview: "Preview — 05_workshop-rollout/",
        vizLabel: "Log — rollout",
        visual: { kind: "log", rows: ROLLOUT_ROWS, tail: ROLLOUT_TAIL },
        readouts: [
          { value: "22", label: "workshops run" },
          { value: "5 → 130+", label: "people on the layer" },
          { value: "21", label: "days to a practice" },
          { value: "03", label: "tracks in parallel" },
        ],
        context: [
          { k: "Frame", v: "45 min, every team" },
          { k: "Trigger", v: "Inbound demand" },
          { k: "Handoff", v: "Per-team steward" },
        ],
        source: "Source — rollout log · one workflow worth encoding, per team",
        stamp: { ord: "05", phase: "Navigate", ref: "NAV-02" },
      },
      /* `05_SKILL-LAYER/` was retired here (owner, 2026-07-31): "we already
         mentioned it". Its plate was not deleted — it moved up to row one and
         became the work → intelligence map, which is the same evidence
         answering a better question. A count of Skills was never the claim
         worth leading with. */
      {
        id: "governance",
        file: "GOVERNANCE.MD",
        meta: "LEGAL · IT",
        project: "Governance",
        icon: "doc",
        preview: "Preview — governance.md",
        vizLabel: "Register — parallel tracks",
        visual: {
          kind: "register",
          rows: [
            { k: "Agreement", v: "Enterprise, signed" },
            { k: "Access", v: "Single sign-on" },
            { k: "Review", v: "Every connector, legal-reviewed" },
            { k: "Ownership", v: "One steward per team" },
          ],
          footer: "Three tracks, run alongside the rollout — never after it.",
        },
        readouts: [
          { value: "03", label: "tracks in parallel" },
          { value: "22", label: "teams briefed, each with a steward" },
          { value: "21", label: "days to a functioning practice" },
        ],
        context: [
          { k: "Legal", v: "From workshop one" },
          { k: "IT", v: "SSO · connectors" },
          { k: "Cadence", v: "Alongside" },
        ],
        source: "Source — governance track · rev 2026.07",
        stamp: { ord: "—", phase: "Governance", ref: "GOV-01" },
      },
      {
        id: "metrics",
        file: "METRICS.DAT",
        meta: "4 READOUTS",
        project: "Metrics",
        icon: "doc",
        preview: "Preview — metrics.dat",
        vizLabel: "Readouts — sampled quarterly",
        visual: { kind: "readouts" },
        readouts: [
          { value: "22", label: "workshops run · one per team" },
          { value: "47+", label: "Skills encoded · versioned, team-owned" },
          { value: "4", label: "production tools · built in-house" },
          { value: "5 → 130+", label: "people on the layer · in 18 months" },
        ],
        context: [
          { k: "Client", v: "Loop Earplugs" },
          { k: "Period", v: "2024 · ongoing" },
          { k: "Status", v: "Live" },
        ],
        source: "Source — metrics.dat · sampled quarterly · rev 2026.07",
        stamp: { ord: "—", phase: "Metrics", ref: "MET-01" },
      },
      {
        id: "report",
        file: "00_MISSION-REPORT.LOG",
        meta: "2.4 KB",
        project: "Mission Report",
        icon: "doc",
        preview: "Preview — 00_mission-report.log",
        vizLabel: "Viz — adoption signal",
        visual: {
          kind: "signal",
          points: ADOPTION_SIGNAL,
          t0: "T0 — embedded · 2024",
          now: "Active — 2026.07",
        },
        readouts: [
          { value: "22", label: "workshops run" },
          { value: "47+", label: "Skills encoded" },
          { value: "4", label: "production tools" },
          { value: "5 → 130+", label: "people on the layer" },
        ],
        context: [
          { k: "Role", v: "Embedded AI lead" },
          { k: "Mandate", v: "Adoption · tooling" },
          { k: "Governance", v: "Legal · IT" },
        ],
        source: "Source — metrics.dat · sampled quarterly · rev 2026.07",
      },
    ],
  },

  meta: {
    title: "Loop Earplugs — Thoughtform case",
    description:
      "Eighteen months at Loop Earplugs, mapping the company's work onto the intelligence available to it: 22 team workshops, 47+ Skills encoded, and four production tools built on the layer they created.",
  },
};
