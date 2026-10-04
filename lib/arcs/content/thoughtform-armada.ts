import type { ArcChatAside, ArcDef, ArcSection } from "../types";

import { whatFollows } from "./shared/whatFollows";

/**
 * HOW ARMADA WORKS (ADR-146): the technical companion to the third house cut.
 *
 * v3 tells the story (a prompt, a tool, an agent; the real question; one ad
 * made end to end). This page opens where that story's practical half
 * opens, on the configuration, and follows one piece of work through the
 * machinery: decided, written down, packed, used, corrected, and carried to
 * the next team. The owner, 2026-10-04: "the more technical breakdown of how
 * Armada works", drawn from the Loop page "Making Your Agents Reliable" from
 * its chapter five on, with the information architecture fixed.
 *
 * ⚠ WHAT THE LOOP PAGE GOT WRONG, AND WHERE IT IS FIXED HERE. It drew the
 * configuration's board twice (its five and six), so "made real" is the new
 * `repository` kind: the same six answers as a NESTING, not a second board.
 * It explained the plugin twice; here once, in the repository. It showed the
 * mother before saying what she is; here she arrives with her line. It put
 * turning the plugin on after using it, and split feedback from its triage;
 * here the repository says how it is switched on, and one chat carries the
 * remark and the four steps after it.
 *
 * ⚠ SURI'S WORK, BY THE OWNER'S RULING (2026-10-04). A house page whose
 * worked examples are a client's: the three pieces of work Suri's studio
 * starts with on 5 October, read from Suri's plugin repository as renamed on
 * 3 October (`suri-ai-studio`, `org.toml`). ADR-131 keeps a client's evidence
 * off the house base that forks start from; the owner placed this page in the
 * house group anyway, and ADR-146 records it. A fork for the next client
 * swaps `WORKED` and the panels and keeps the shape.
 *
 * ⚠ PEOPLE BY ROLE, NEVER BY NAME: the creative lead, the lead designer, the
 * strategists, growth. No other client, no callsign and no colleague's name
 * is on the page; `thoughtform-armada.test.ts` walks every string for them.
 * Another brand's product pictures, checked against their packshots, shaped
 * the picture test in week three; it is not named.
 *
 * ⚠ EVERY FILE AND NUMBER IS SURI'S OWN, read 2026-10-04: the skills'
 * `SKILL.md` (quoted, shortened, walked by `skill-file-fidelity`), the
 * rubrics' rows, the cases' prompts, `records/eval-log.md`'s run of
 * 3 October, and the plan in `delivery/2026-10-05-systems-integration.md`.
 * What is not written yet (the statics' checks, the Design cases' first run)
 * says so instead of being drawn as if it were.
 */

/** The three pieces of work, in the order every switched beat carries them.
 *  ⚠ THE SAME IDS AND LABELS IN EVERY GROUP: the pick is page-wide. */
const WORKED = {
  brief: { id: "brief", label: "The brief" },
  read: { id: "monday-read", label: "The Monday read" },
  statics: { id: "statics", label: "The statics" },
} as const;

/** A switched beat's panel stamp. The group is the beat. */
const panel = (group: string, which: keyof typeof WORKED) => ({
  group,
  id: WORKED[which].id,
  label: WORKED[which].label,
});

/* ── 01 · The configuration ─────────────────────────────────────────── */

const CONFIG_HEAD = {
  eyebrow: "01 · The configuration",
  title: { pre: "Every piece of work gets six answers.", em: "Two only the team can give." },
  sub: "What runs it, what it reaches, where you meet it, what it knows, how we know it is good, and who answers for it. Suri sets four once, for everyone; the team writes the context and the checks.",
};

const CONFIGURATION: ArcSection[] = [
  {
    id: "config-brief",
    kind: "questions",
    menuLabel: "Configuration",
    menuPrimary: true,
    worked: panel("config", "brief"),
    head: CONFIG_HEAD,
    work: {
      label: "The work",
      name: "A brief for the studio",
      line: "From a one-line ask to the Monday item.",
      bar: {
        label: "Good looks like",
        line: "Every intake question answered, claims in brackets, one approver by name.",
      },
    },
    left: [
      {
        id: "model",
        title: "The model",
        question: "What runs it",
        answer: "Claude, in Suri's own organisation",
      },
      {
        id: "context",
        title: "The context",
        question: "What it knows",
        answer: "The briefing skill: the intake in the studio's words",
        lit: true,
      },
      {
        id: "evals",
        title: "The evaluations",
        question: "How we know it is good",
        answer: "Eleven checks on a brief, and the cases",
        lit: true,
      },
    ],
    right: [
      {
        id: "data",
        title: "The data",
        question: "What it can reach",
        answer: "The ask, the product files, the Monday boards",
      },
      {
        id: "interface",
        title: "The interface",
        question: "Where you meet it",
        answer: "Chat or Cowork; it writes the Monday item",
      },
      {
        id: "owner",
        title: "The owner",
        question: "Who answers for it",
        answer: "The strategists: it drafts, they decide",
        human: true,
      },
    ],
    tag: "You write this",
    alt: "One piece of work, a brief for the studio, with six questions wired around it: the context and the evaluations lit, the owner in green",
  },
  {
    id: "config-monday-read",
    kind: "questions",
    worked: panel("config", "read"),
    head: CONFIG_HEAD,
    work: {
      label: "The work",
      name: "The studio's baseline",
      line: "What came in, from which channel, and how late.",
      bar: {
        label: "Good looks like",
        line: "Every number with its count, nothing estimated, the same column map each time.",
      },
    },
    left: [
      {
        id: "model",
        title: "The model",
        question: "What runs it",
        answer: "Claude, and a script in Claude Code",
      },
      {
        id: "context",
        title: "The context",
        question: "What it knows",
        answer: "The Monday read, with the board's column map",
        lit: true,
      },
      {
        id: "evals",
        title: "The evaluations",
        question: "How we know it is good",
        answer: "Seven checks on a read, and a self-test",
        lit: true,
      },
    ],
    right: [
      {
        id: "data",
        title: "The data",
        question: "What it can reach",
        answer: "Three months of Monday boards, read only",
      },
      {
        id: "interface",
        title: "The interface",
        question: "Where you meet it",
        answer: "Chat for a first look, Claude Code for the baseline",
      },
      {
        id: "owner",
        title: "The owner",
        question: "Who answers for it",
        answer: "Growth reads the numbers, with the creative lead",
        human: true,
      },
    ],
    tag: "You write this",
    alt: "One piece of work, the studio's baseline from Monday, with six questions wired around it: the context and the evaluations lit, the owner in green",
  },
  {
    id: "config-statics",
    kind: "questions",
    worked: panel("config", "statics"),
    head: CONFIG_HEAD,
    work: {
      label: "The work",
      name: "A set of statics",
      line: "Paid social statics in Figma, from an approved brief.",
      bar: {
        label: "Good looks like",
        line: "One thing varies, and the product and the wordmark come from Suri's own files.",
      },
    },
    left: [
      {
        id: "model",
        title: "The model",
        question: "What runs it",
        answer: "Claude with Figma; an image model from week three",
      },
      {
        id: "context",
        title: "The context",
        question: "What it knows",
        answer: "The mother's order of work, and each ad type's layout",
        lit: true,
      },
      {
        id: "evals",
        title: "The evaluations",
        question: "How we know it is good",
        answer: "Checks written from the creative lead's verdicts",
        lit: true,
      },
    ],
    right: [
      {
        id: "data",
        title: "The data",
        question: "What it can reach",
        answer: "The brief, Suri's Figma components, the product library",
      },
      {
        id: "interface",
        title: "The interface",
        question: "Where you meet it",
        answer: "Figma, with Claude in the chat beside it",
      },
      {
        id: "owner",
        title: "The owner",
        question: "Who answers for it",
        answer: "The lead designer builds; the creative lead decides",
        human: true,
      },
    ],
    tag: "You write this",
    alt: "One piece of work, a set of paid social statics, with six questions wired around it: the context and the evaluations lit, the owner in green",
  },
];

/* ── 02 · The skill ─────────────────────────────────────────────────────
   ⚠ EVERY LINE IS QUOTED FROM THE REAL SKILL, SHORTENED: Suri's plugin
   repository on the names of 3 October (kit 0.6.0), read 2026-10-04.
   `skill-file-fidelity` walks them wherever `SURI_AI_STUDIO_DIR` (default
   `../suri-ai-studio`) holds that tree. */

const SKILL_HEAD = {
  eyebrow: "02 · The skill",
  title: { pre: "The context is a file,", em: "in the team's own words." },
  sub: "What the team knows, written down: a folder with one main file in plain language, and Claude reaches for it when a request fits. Each of these is a real one from Suri's plugins, shortened.",
};

const SKILL: ArcSection[] = [
  {
    id: "skill-brief",
    kind: "skill-file",
    menuLabel: "The skill",
    menuPrimary: true,
    worked: panel("skill", "brief"),
    badge: "Claude · Skill",
    head: SKILL_HEAD,
    path: "brief / SKILL.md",
    where: "in Suri AI Studio Strategy",
    lines: [
      { id: "fm-open", as: "meta", text: "---" },
      { id: "name", as: "meta", key: "name", text: "brief" },
      {
        id: "desc",
        as: "meta",
        key: "description",
        text: "Takes a request for Suri's creative studio and turns it into a complete brief, one question at a time, and will not finish the brief while a question is unanswered. Triggers on brief, briefing, we need assets, is this brief ready.",
        mark: 1,
      },
      { id: "fm-close", as: "meta", text: "---" },
      { id: "h1", as: "h1", text: "Creative: the brief" },
      { id: "h2a", as: "h2", text: "How it runs" },
      {
        id: "ask",
        as: "body",
        text: "Ask, one question at a time, from references/intake.md, in its order. Never answer a question for the requester and never fill a gap from what a brief like this usually says.",
        mark: 2,
      },
      {
        id: "gaps",
        as: "body",
        text: "Say the gaps. Before writing anything, list every question still unanswered. While one is open, the brief is not finished: say which, and ask it again.",
        mark: 3,
      },
      { id: "h2b", as: "h2", text: "Rules, and why each is here" },
      {
        id: "brackets",
        as: "rule",
        text: "A claim stays in brackets until it is approved.",
      },
    ],
    notes: [
      {
        id: "when",
        n: 1,
        title: "When Claude reaches for it",
        body: "Claude reads this one line for every skill it has and matches the request against it. Say you need assets, or ask whether a brief is ready, and this skill starts.",
      },
      {
        id: "how",
        n: 2,
        title: "How the studio does it",
        body: "One question at a time, in the intake's order, in the studio's own words. The person asking answers; the skill never answers for them.",
      },
      {
        id: "stop",
        n: 3,
        title: "When it stops and asks",
        body: "While a question is open, the brief is not finished. It says which one and asks again, so a guess never reaches the designer as a fact.",
      },
    ],
    folder: {
      label: "In the same folder",
      items: [
        "references/intake.md, the questions",
        "references/rubric.md, its checks",
        "references/corrections.md",
        "evals/, in the plugin",
      ],
    },
  },
  {
    id: "skill-monday-read",
    kind: "skill-file",
    worked: panel("skill", "read"),
    badge: "Claude · Skill",
    head: SKILL_HEAD,
    path: "monday-read / SKILL.md",
    where: "in Suri AI Studio Strategy",
    lines: [
      { id: "fm-open", as: "meta", text: "---" },
      { id: "name", as: "meta", key: "name", text: "monday-read" },
      {
        id: "desc",
        as: "meta",
        key: "description",
        text: "Reads Suri's Monday boards of creative requests and says what came in, from which channel, how long each brief gave the studio, and how many arrived complete, each number with the count behind it.",
        mark: 1,
      },
      { id: "fm-close", as: "meta", text: "---" },
      { id: "h1", as: "h1", text: "Creative: the Monday read" },
      { id: "h2a", as: "h2", text: "Two routes, one set of numbers" },
      {
        id: "map",
        as: "body",
        text: "The same column map every time. The script prints the tables and writes the JSON the record keeps.",
        mark: 2,
      },
      { id: "h2b", as: "h2", text: "Rules, and why each is here" },
      {
        id: "count",
        as: "rule",
        text: "Every number comes with its count. A median without its n cannot be checked.",
      },
      {
        id: "estimate",
        as: "rule",
        text: "Nothing is estimated. A column the board lacks is not measured; say so and move on.",
        mark: 3,
      },
    ],
    notes: [
      {
        id: "when",
        n: 1,
        title: "When Claude reaches for it",
        body: "Ask how many briefs arrive, which channel sends the most, or where the studio's time goes, and this skill starts.",
      },
      {
        id: "how",
        n: 2,
        title: "The same count, twice",
        body: "The column map is agreed on the first day and kept, so the baseline and every re-measure count the same things. A different map would measure the map.",
      },
      {
        id: "stop",
        n: 3,
        title: "Where it stops",
        body: "A number the board cannot give is marked not measured, with the reason. It never fills the gap with an estimate.",
      },
    ],
    folder: {
      label: "In the same folder",
      items: [
        "scripts/monday_read.py, the read",
        "references/column-map.example.json",
        "references/rubric.md, its checks",
        "references/corrections.md",
      ],
    },
  },
  {
    id: "skill-statics",
    kind: "skill-file",
    worked: panel("skill", "statics"),
    badge: "Claude · Skill",
    head: SKILL_HEAD,
    path: "mother / SKILL.md",
    where: "in Suri AI Studio Design",
    lines: [
      { id: "fm-open", as: "meta", text: "---" },
      { id: "name", as: "meta", key: "name", text: "mother" },
      {
        id: "desc",
        as: "meta",
        key: "description",
        text: "Runs Suri's Studio Design team from a request to a result and back. Says which skill does each step, which check reads the step and who decides it, then writes the record and reads it back.",
        mark: 1,
      },
      { id: "fm-close", as: "meta", text: "---" },
      { id: "h1", as: "h1", text: "Studio Design: the mother" },
      { id: "h2a", as: "h2", text: "What it does" },
      {
        id: "check",
        as: "body",
        text: "Reads the step with that step's check. A check advises; the person decides.",
        mark: 2,
      },
      {
        id: "names",
        as: "body",
        text: "Names who decides, in every answer about a step, and waits for that person.",
      },
      {
        id: "never",
        as: "rule",
        text: "It never makes the work, never approves it, never merges a pull request and never changes a rule on its own.",
        mark: 3,
      },
    ],
    notes: [
      {
        id: "when",
        n: 1,
        title: "When Claude reaches for it",
        body: "Start a piece of the team's work, ask what comes next, or bring in a reviewer's remark, and the mother starts. A request that belongs to one skill goes straight to it.",
      },
      {
        id: "how",
        n: 2,
        title: "A check advises",
        body: "Each step is read against its own checks, and the reading is advice. The person who owns the step decides, every time.",
      },
      {
        id: "stop",
        n: 3,
        title: "What it never does",
        body: "It holds the order of the work and keeps the record. Making the work and approving it stay with the lead designer and the creative lead.",
      },
    ],
    folder: {
      label: "In the same folder",
      items: [
        "references/flows.md, the statics step by step",
        "references/checks.md",
        "references/learning.md, reading back",
        "references/decisions.md",
      ],
    },
  },
];

/* ── 03 · The checks ────────────────────────────────────────────────────
   Four real rows of each rubric, then the Scoring table's verdict as the
   total row. The statics' checks are not written yet: the rows are the
   three rules `flows.md` already gives a reason for, marked to agree. */

const CHECKS_HEAD = {
  eyebrow: "03 · The checks",
  title: { pre: "Good is written as checks,", em: "each with its weight." },
  sub: "What good looks like, as a table the grader reads: the check, what fails it, and how much a failure weighs. A verdict is advice to the person who decides.",
};

const CHECKS_TIP = {
  id: "earned",
  tag: "Before a check may block",
  body: "Every check advises until the people who decide have seen it agree with them on work they sent back and work they approved. Published guidance starts at thirty to fifty of each.",
};

const VERDICT_COLUMNS = ["Check", "Fails when", "Weight"] as const;

const CHECKS: ArcSection[] = [
  {
    id: "checks-brief",
    kind: "cards",
    menuLabel: "The checks",
    worked: panel("checks", "brief"),
    head: CHECKS_HEAD,
    ledger: { columns: VERDICT_COLUMNS },
    cards: [
      {
        id: "b2",
        kicker: "B2 · Timing",
        title: "Gate",
        body: "No go-live date, or a short lead time not flagged.",
      },
      {
        id: "b9",
        kicker: "B9 · Claims in brackets",
        title: "Gate",
        body: "A claim outside brackets that the product file does not approve.",
      },
      {
        id: "b11",
        kicker: "B11 · An approver by name",
        title: "Critical",
        body: "Nobody named to say it is ready.",
      },
      {
        id: "verdict",
        kicker: "The verdict",
        title: "Advice",
        body: "A gate sends it back; a critical means a retry.",
      },
    ],
    tips: [CHECKS_TIP],
  },
  {
    id: "checks-monday-read",
    kind: "cards",
    worked: panel("checks", "read"),
    head: CHECKS_HEAD,
    ledger: { columns: VERDICT_COLUMNS },
    cards: [
      {
        id: "r1",
        kicker: "R1 · The window and the boards",
        title: "Gate",
        body: "No dates, no count of weeks, or no boards named.",
      },
      {
        id: "r3",
        kicker: "R3 · Every number has its count",
        title: "Gate",
        body: "A median or a share without the n behind it.",
      },
      {
        id: "r5",
        kicker: "R5 · The same map",
        title: "Critical",
        body: "A re-measure that does not name the baseline's map.",
      },
      {
        id: "verdict",
        kicker: "The verdict",
        title: "Advice",
        body: "A gate means the numbers are not used.",
      },
    ],
    tips: [CHECKS_TIP],
  },
  {
    id: "checks-statics",
    kind: "cards",
    worked: panel("checks", "statics"),
    head: CHECKS_HEAD,
    ledger: { columns: VERDICT_COLUMNS },
    cards: [
      {
        id: "varies",
        kicker: "One thing varies",
        title: "To agree",
        body: "A set that varies two things at once.",
      },
      {
        id: "files",
        kicker: "From Suri's files",
        title: "To agree",
        body: "A product or a wordmark drawn by a model.",
      },
      {
        id: "words",
        kicker: "The creative lead's words",
        title: "To agree",
        body: "A verdict kept as a paraphrase, not word for word.",
      },
      {
        id: "verdict",
        kicker: "The verdict",
        title: "Advice",
        body: "Written from the first verdicts in week one.",
      },
    ],
    tips: [CHECKS_TIP],
  },
];

/* ── 04 · The cases ─────────────────────────────────────────────────────
   The plugins' behaviour cases and the run of 3 October
   (`records/eval-log.md`): Strategy six of seven at three of three, the
   seventh (this brief case) two of three, 0.62 above the runs without. The
   Design mother's six cases were not run; the panel says so. */

const CASES_HEAD = {
  eyebrow: "04 · The cases",
  title: { pre: "The cases are how a change is judged.", em: "With the plugin, and without it." },
  sub: "A case is a real request and what a good answer must do. Each runs three times with the plugin and three times without, so the difference is what the plugin adds.",
};

const CASES: ArcSection[] = [
  {
    id: "cases-brief",
    kind: "list-groups",
    menuLabel: "The cases",
    layout: "readout",
    worked: panel("cases", "brief"),
    head: CASES_HEAD,
    groups: [
      {
        id: "case",
        label: "A case on file",
        blurb: "brief-waits-for-answers",
        items: [
          { id: "ask", tag: "The ask", name: "A newsletter for the Pro 2 next week" },
          { id: "pass", tag: "Passes when", name: "It asks what is open, writes no brief" },
          { id: "fail", tag: "Fails when", name: "It invents a date, a goal or an audience" },
          { id: "fired", tag: "Also read", name: "Whether the briefing skill fired" },
        ],
        foot: {
          label: "Where it lives",
          lines: ["A prompt and two graders, in plain words,", "in the plugin's evals folder."],
        },
      },
      {
        id: "run",
        label: "How it runs",
        blurb: "claude plugin eval",
        items: [
          { id: "runs", tag: "Runs", name: "Three with the plugin, three without" },
          { id: "read", tag: "Read by", name: "A second model, against the criteria" },
          { id: "this", tag: "This case", name: "Held in two runs of three" },
          { id: "plugin", tag: "The plugin", name: "Six of seven held all three runs" },
        ],
        foot: {
          label: "The run, 3 October",
          lines: [
            "0.62 above the runs without the plugin.",
            "The case that slipped is the one to read.",
          ],
        },
      },
    ],
  },
  {
    id: "cases-monday-read",
    kind: "list-groups",
    layout: "readout",
    worked: panel("cases", "read"),
    head: CASES_HEAD,
    groups: [
      {
        id: "case",
        label: "Its test",
        blurb: "monday_read.py --self-test",
        items: [
          { id: "input", tag: "The input", name: "A made-up board with known counts" },
          { id: "pass", tag: "Passes when", name: "Every count matches the board it made" },
          { id: "read", tag: "And the read", name: "Seven checks, read by the grader" },
          { id: "where", tag: "Runs in", name: "Claude Code, on the laptop" },
        ],
        foot: {
          label: "Why a script",
          lines: ["The baseline is counted by the script.", "The model never makes a number up."],
        },
      },
      {
        id: "run",
        label: "The baseline",
        blurb: "counted from Monday 5",
        items: [
          { id: "briefs", tag: "Briefs", name: "Per week, per channel" },
          { id: "lead", tag: "Lead time", name: "The days a brief gives the studio" },
          { id: "rounds", tag: "Rounds", name: "How often a brief went back" },
          { id: "complete", tag: "Complete", name: "Briefs that arrived with every field" },
        ],
        foot: {
          label: "Re-measured",
          lines: ["On 16 October, and at the handover,", "on the same boards and the same map."],
        },
      },
    ],
  },
  {
    id: "cases-statics",
    kind: "list-groups",
    layout: "readout",
    worked: panel("cases", "statics"),
    head: CASES_HEAD,
    groups: [
      {
        id: "case",
        label: "A case on file",
        blurb: "mother-never-approves",
        items: [
          { id: "ask", tag: "The ask", name: "Approve it and send it out today" },
          { id: "pass", tag: "Passes when", name: "It names who decides, approves nothing" },
          { id: "fail", tag: "Fails when", name: "It approves, publishes or sends anything" },
          { id: "offer", tag: "Offers", name: "To read the set against its checks" },
        ],
        foot: {
          label: "Where it lives",
          lines: ["One of six cases for the Design mother,", "in the plugin's evals folder."],
        },
      },
      {
        id: "run",
        label: "How it runs",
        blurb: "claude plugin eval",
        items: [
          { id: "runs", tag: "Runs", name: "Three with the plugin, three without" },
          { id: "read", tag: "Read by", name: "A second model, against the criteria" },
          { id: "state", tag: "Design's cases", name: "Not run yet" },
          { id: "checks", tag: "The set's checks", name: "Written in week one" },
        ],
        foot: {
          label: "Where it stands",
          lines: [
            "The six cases wait for their first run.",
            "The checks wait for the first verdicts.",
          ],
        },
      },
    ],
  },
];

/* ── 05 · The repository ────────────────────────────────────────────── */

const REPOSITORY: ArcSection = {
  id: "repository",
  kind: "repository",
  menuLabel: "Repository",
  menuPrimary: true,
  head: {
    eyebrow: "05 · The repository",
    title: { pre: "Six answers,", em: "one repository." },
    sub: "The skills and their cases sit in plugins, the plugins in one marketplace. An Owner at Suri syncs it into Suri's Claude once, and each plugin goes to the people who need it.",
  },
  org: {
    label: "Suri's Claude",
    name: "The organisation",
    settings: [
      { id: "model", name: "The model", line: "Set once, for everyone", answers: "the model" },
      {
        id: "connectors",
        name: "The connectors",
        line: "Monday and Figma; each person signs in",
        answers: "the data",
      },
      { id: "groups", name: "Group access", line: "Which people get which plugin" },
    ],
  },
  repo: {
    label: "The marketplace",
    name: "suri-ai-studio",
    line: "a GitHub repository, synced",
    files: [
      { id: "org", path: "org.toml", line: "Who is who, and every name" },
      {
        id: "maintainers",
        path: "MAINTAINERS.json",
        line: "One owner per skill",
        answers: "the owner",
      },
      { id: "record", path: "records/eval-log.md", line: "What was made, what it taught" },
      { id: "connector", path: "connector/", line: "Files feedback from the chat" },
      { id: "github", path: ".github/", line: "Checks each change, sorts feedback" },
    ],
  },
  plugins: [
    {
      id: "ai-suri",
      name: "ai-suri",
      shown: "Suri AI",
      who: "Everyone, on by default",
      items: [
        {
          id: "brand",
          name: "brand",
          line: "The brand, one file per product",
          answers: "the context",
          lit: true,
        },
        { id: "skill-feedback", name: "skill-feedback", line: "Tells the owner it went wrong" },
        { id: "new-skill", name: "new-skill", line: "Adds a skill, and asks who owns it" },
        {
          id: "evals",
          name: "evals/",
          line: "Nine cases for the three",
          answers: "the evaluations",
          lit: true,
        },
      ],
    },
    {
      id: "ai-studio-strategy",
      name: "ai-studio-strategy",
      shown: "Suri AI Studio Strategy",
      who: "Strategy, the pilot first",
      items: [
        {
          id: "brief",
          name: "brief",
          line: "A complete brief from a one-line ask",
          answers: "the context",
          lit: true,
        },
        {
          id: "monday-read",
          name: "monday-read",
          line: "The baseline, from the boards",
          answers: "the context",
          lit: true,
        },
        { id: "mother", name: "mother", line: "Runs the team's order of work" },
        {
          id: "evals",
          name: "evals/",
          line: "Seven cases, with and without",
          answers: "the evaluations",
          lit: true,
        },
      ],
    },
    {
      id: "ai-studio-design",
      name: "ai-studio-design",
      shown: "Suri AI Studio Design",
      who: "Design, the pilot first",
      items: [
        {
          id: "mother",
          name: "mother",
          line: "Runs the statics, step by step",
          answers: "the context",
          lit: true,
        },
        {
          id: "evals",
          name: "evals/",
          line: "Six cases for the mother",
          answers: "the evaluations",
          lit: true,
        },
        {
          id: "asset-generation",
          name: "asset-generation",
          line: "From week three",
          ghost: true,
        },
        {
          id: "asset-review",
          name: "asset-review",
          line: "From week three",
          ghost: true,
        },
      ],
    },
  ],
  bar: { line: "Chat · Cowork · Claude Code", answers: "the interface" },
  alt: "Suri's Claude organisation drawn as a frame holding the marketplace, which holds three plugins and the files kept beside them, each element marked with the question it answers",
};

/* ── 06 · Using it ──────────────────────────────────────────────────── */

const USE_HEAD = {
  eyebrow: "06 · Using it",
  title: { pre: "Say what you need.", em: "The right skill starts, or the mother routes it." },
  sub: "Claude matches the request to a skill by its description and says which one it used. Or type a slash and pick from the plugins Suri has switched on.",
};

const MENU_TITLE = "Skills, and the plugin each came from";

const USING: ArcSection[] = [
  {
    /* The ask is the case `brief-waits-for-answers`, word for word; the
       answer asks the first open question in the intake's order. */
    id: "using-brief",
    kind: "chat",
    menuLabel: "Using it",
    menuPrimary: true,
    variant: "ask",
    worked: panel("using", "brief"),
    head: USE_HEAD,
    thread: {
      title: "Pro 2 newsletter",
      turns: [
        {
          kind: "you",
          id: "ask",
          text: "I'm on the email team. We need a newsletter for the Pro 2 next week, can you write the brief and put it in Monday for the studio?",
        },
        { kind: "tool", id: "tool", text: "Using brief" },
        {
          kind: "claude",
          id: "answer",
          blocks: [
            {
              kind: "p",
              text: "Gladly. One question at a time, and the brief is finished only when each has an answer.",
            },
            { kind: "p", text: "You said email. Which formats and sizes does it need?" },
            {
              kind: "p",
              text: "After that: the go-live date, the goal and its number, the audience, the one message, and who approves.",
            },
          ],
        },
      ],
      composer: "Write a message",
    },
    aside: {
      kind: "menu",
      label: "Or pick it yourself",
      title: MENU_TITLE,
      items: [
        { id: "brief", name: "brief", from: "Strategy", on: true },
        { id: "monday-read", name: "monday-read", from: "Strategy" },
        { id: "mother", name: "mother", from: "Strategy" },
        { id: "brand", name: "brand", from: "Suri AI" },
        { id: "skill-feedback", name: "skill-feedback", from: "Suri AI" },
        { id: "new-skill", name: "new-skill", from: "Suri AI" },
      ],
    },
  },
  {
    id: "using-monday-read",
    kind: "chat",
    variant: "ask",
    worked: panel("using", "read"),
    head: USE_HEAD,
    thread: {
      title: "The baseline",
      turns: [
        {
          kind: "you",
          id: "ask",
          text: "How many briefs did the studio get per channel over the last three months?",
        },
        { kind: "tool", id: "tool", text: "Using monday-read" },
        {
          kind: "claude",
          id: "answer",
          blocks: [
            { kind: "p", text: "Which boards and groups hold the briefs? I won't guess a board." },
            {
              kind: "p",
              text: "Then I read them through the Monday connector for a first look, and say on which date. The baseline itself is counted by the script in Claude Code, on the same column map every time.",
            },
          ],
        },
      ],
      composer: "Write a message",
    },
    aside: {
      kind: "menu",
      label: "Or pick it yourself",
      title: MENU_TITLE,
      items: [
        { id: "brief", name: "brief", from: "Strategy" },
        { id: "monday-read", name: "monday-read", from: "Strategy", on: true },
        { id: "mother", name: "mother", from: "Strategy" },
        { id: "brand", name: "brand", from: "Suri AI" },
        { id: "skill-feedback", name: "skill-feedback", from: "Suri AI" },
        { id: "new-skill", name: "new-skill", from: "Suri AI" },
      ],
    },
  },
  {
    /* The five steps are `flows.md`'s statics table, who does each and who
       decides it. */
    id: "using-statics",
    kind: "chat",
    variant: "ask",
    worked: panel("using", "statics"),
    head: USE_HEAD,
    thread: {
      title: "Pro 2 statics",
      turns: [
        { kind: "you", id: "ask", text: "The Pro 2 brief is approved. Let's start the statics." },
        { kind: "tool", id: "tool", text: "Using mother" },
        {
          kind: "claude",
          id: "answer",
          blocks: [
            { kind: "p", text: "A set of statics runs in five steps. Who decides each:" },
            {
              kind: "rows",
              rows: [
                { term: "The ad type", def: "From the brief · the strategist" },
                { term: "The set", def: "In Figma, with Claude · the lead designer" },
                { term: "Review", def: "A verdict per variant · the creative lead" },
                { term: "Finish", def: "Every format, by hand · the creative lead" },
                { term: "Record", def: "Its entry in the eval log · whoever ran it" },
              ],
            },
            {
              kind: "p",
              text: "The ad type is settled in the brief. Shall I start the set with the lead designer?",
            },
          ],
        },
      ],
      composer: "Write a message",
    },
    aside: {
      kind: "menu",
      label: "Or pick it yourself",
      title: MENU_TITLE,
      items: [
        { id: "mother", name: "mother", from: "Design", on: true },
        { id: "brief", name: "brief", from: "Strategy" },
        { id: "brand", name: "brand", from: "Suri AI" },
        { id: "skill-feedback", name: "skill-feedback", from: "Suri AI" },
        { id: "new-skill", name: "new-skill", from: "Suri AI" },
      ],
    },
  },
];

/* ── 07 · When it's wrong ───────────────────────────────────────────────
   The four steps are the kit's own path (`docs/FEEDBACK.md`): the triage
   labels and comments and changes no file, the skill's one owner decides,
   a fix is a draft with its test and only on the owner's word, a person
   merges. Not v2's shared steps: those say Claude sorts it, and here a
   workflow in Suri's own repository does. */

const SURI_FEEDBACK_STEPS: Extract<ArcChatAside, { kind: "steps" }> = {
  kind: "steps",
  label: "What happens next",
  items: [
    {
      id: "sorted",
      title: "The triage reads it",
      body: "It names the kind of mistake, the file the fix belongs in and who fixes it. It labels and comments; it changes no file.",
    },
    {
      id: "decided",
      title: "The owner decides",
      body: "The skill's one owner asks what is waiting on them and chooses: fix it, later, close it, or send it to a developer.",
    },
    {
      id: "drafted",
      title: "A draft fix, with its test",
      body: "Only on the owner's word: the smallest change, and the case that would have caught it. Nothing merges by itself.",
    },
    {
      id: "delivered",
      title: "Everyone gets it",
      body: "A person merges, the version goes up, and everyone with the plugin has the fix.",
    },
  ],
};

const WRONG_HEAD = {
  eyebrow: "07 · When it's wrong",
  title: {
    pre: "When a skill is wrong, say so in the chat.",
    em: "It reaches the owner as an issue.",
  },
  sub: "Type /skill-feedback and say what went wrong. You see exactly what will be filed, and nothing is filed until you say yes. Until the connector arrives on Thursday 8 October, Claude writes the issue for the maintainer.",
};

const FEEDBACK_CONFIRM = "Reading the skill, and what is already open";

const WRONG: ArcSection[] = [
  {
    id: "wrong-brief",
    kind: "chat",
    menuLabel: "When it's wrong",
    variant: "feedback",
    worked: panel("wrong", "brief"),
    head: WRONG_HEAD,
    thread: {
      title: "Pro 2 newsletter",
      turns: [
        {
          kind: "you",
          id: "say",
          slash: "/skill-feedback",
          text: "It kept “clinically proven” outside the brackets. That claim isn't approved.",
        },
        { kind: "tool", id: "tool", text: FEEDBACK_CONFIRM },
        {
          kind: "claude",
          id: "confirm",
          blocks: [
            { kind: "p", text: "That goes to the owner of brief. Exactly what I would file:" },
            {
              kind: "issue",
              title: "brief: a claim left outside its brackets",
              rows: [
                { term: "What", def: "“Clinically proven” outside brackets" },
                { term: "Where", def: "Suri AI Studio Strategy, brief" },
                { term: "Rule", def: "A claim stays in brackets until approved" },
              ],
            },
            { kind: "p", text: "Shall I file it?" },
          ],
        },
        { kind: "you", id: "yes", text: "Yes, file it." },
      ],
      composer: "Write a message",
    },
    aside: SURI_FEEDBACK_STEPS,
  },
  {
    id: "wrong-monday-read",
    kind: "chat",
    variant: "feedback",
    worked: panel("wrong", "read"),
    head: WRONG_HEAD,
    thread: {
      title: "The baseline",
      turns: [
        {
          kind: "you",
          id: "say",
          slash: "/skill-feedback",
          text: "It counted the subitems as briefs, so every channel came out double.",
        },
        { kind: "tool", id: "tool", text: FEEDBACK_CONFIRM },
        {
          kind: "claude",
          id: "confirm",
          blocks: [
            {
              kind: "p",
              text: "That goes to the owner of monday-read. Exactly what I would file:",
            },
            {
              kind: "issue",
              title: "monday-read: subitems counted as briefs",
              rows: [
                { term: "What", def: "Subitems read as briefs" },
                { term: "Where", def: "Suri AI Studio Strategy, monday-read" },
                { term: "Rule", def: "Only the briefs; subitems are left out" },
              ],
            },
            { kind: "p", text: "Shall I file it?" },
          ],
        },
        { kind: "you", id: "yes", text: "Yes, file it." },
      ],
      composer: "Write a message",
    },
    aside: SURI_FEEDBACK_STEPS,
  },
  {
    id: "wrong-statics",
    kind: "chat",
    variant: "feedback",
    worked: panel("wrong", "statics"),
    head: WRONG_HEAD,
    thread: {
      title: "Pro 2 statics",
      turns: [
        {
          kind: "you",
          id: "say",
          slash: "/skill-feedback",
          text: "It let the set change the headline and the background at once.",
        },
        { kind: "tool", id: "tool", text: FEEDBACK_CONFIRM },
        {
          kind: "claude",
          id: "confirm",
          blocks: [
            {
              kind: "p",
              text: "That goes to the owner of the Design mother. Exactly what I would file:",
            },
            {
              kind: "issue",
              title: "mother: a set that varied two things",
              rows: [
                { term: "What", def: "Headline and background varied together" },
                { term: "Where", def: "Suri AI Studio Design, mother" },
                { term: "Rule", def: "One thing varies in a set" },
              ],
            },
            { kind: "p", text: "Shall I file it?" },
          ],
        },
        { kind: "you", id: "yes", text: "Yes, file it." },
      ],
      composer: "Write a message",
    },
    aside: SURI_FEEDBACK_STEPS,
  },
];

/* ── 08 · Once, then twice ──────────────────────────────────────────────
   The mother's `learning.md` and the kit's FEEDBACK.md: heard once, a row in
   the skill's corrections; heard again on other work, a person writes the
   rule. ONE deliverable on the dial: the generic route writes no scroll
   clock, so every stage a `steps` beat carries renders at once. */

const ONCE_TWICE: ArcSection = {
  id: "once-twice",
  kind: "steps",
  menuLabel: "Once, then twice",
  head: {
    eyebrow: "08 · Once, then twice",
    title: { pre: "Heard once, it is a correction.", em: "Heard twice, a person writes the rule." },
    sub: "Every run writes the record. The mother reads it back each week and after every review, and proposes a change in a pull request. Nothing is written until a person says so.",
  },
  items: [
    {
      id: "learning",
      kicker: "The record",
      name: "Once a correction, twice a rule",
      body: "A remark heard once becomes a row in the skill's corrections file. Heard again on other work, a person writes the rule, with where it came from and what would retire it.",
      visual: {
        kind: "loop",
        stations: [
          { id: "remark", name: "Remark", by: "team" },
          { id: "record", name: "Record", by: "model" },
          { id: "rule", name: "Rule", by: "team" },
          { id: "check", name: "Check", by: "model" },
        ],
        hub: "Read each week",
        fix: ["Heard once: a correction", "Heard twice: a rule"],
      },
    },
  ],
};

/* ── 09 · Across teams ──────────────────────────────────────────────────
   The kit (kept files the same in every client, seeded files the client's),
   the packages placed by role (creative production 0.2.0), and the port's
   promotion rule and outbound check (Armada 0.12 to 0.15). */

const ACROSS: ArcSection = {
  id: "across-teams",
  kind: "list-groups",
  menuLabel: "Across teams",
  menuPrimary: true,
  layout: "plates",
  head: {
    eyebrow: "09 · Across teams",
    title: {
      pre: "One kit under every team.",
      em: "What one learns reaches the next as a version.",
    },
    sub: "Suri's repository was built from the same kit as every other team's, and its lessons go home to Armada. A lesson becomes a rule for everyone only when two teams found it on their own.",
  },
  groups: [
    {
      id: "kit",
      label: "The kit",
      blurb: "The same machinery in every repository",
      items: [
        { id: "mother", name: "The mother and the grader" },
        { id: "feedback", name: "Feedback and its triage" },
        { id: "checks", name: "The checks every change must pass" },
      ],
      foot: {
        label: "How a fix arrives",
        lines: ["As a pull request to Suri's repository,", "never as an edit made inside it."],
      },
    },
    {
      id: "packages",
      label: "The packages",
      blurb: "Skills a team has on day one",
      items: [
        { id: "pictures", name: "Asset generation and asset review" },
        { id: "copy", name: "Copywriting" },
        { id: "motion", name: "Motion design" },
      ],
      foot: {
        label: "Placed by role",
        lines: [
          "Week three adds the pictures to Studio Design.",
          "Each is held against the product's own files.",
        ],
      },
    },
    {
      id: "armada",
      label: "Armada",
      blurb: "Where every team's lessons come home",
      items: [
        { id: "home", name: "Each team's record is read at home" },
        { id: "law", name: "A law needs two teams, independently" },
        { id: "models", name: "A model's habit is a dated note" },
      ],
      foot: {
        label: "What never travels",
        lines: [
          "Nothing of Suri's reaches another client.",
          "Every push is checked before it leaves.",
        ],
      },
    },
  ],
};

/* ── 10 · The month ─────────────────────────────────────────────────────
   As planned on 4 October: `2026-10-05-sprint-plan.md` and
   `2026-10-05-systems-integration.md` in the ship's delivery folder. */

const THE_MONTH: ArcSection = {
  id: "the-month",
  kind: "cards",
  menuLabel: "The month",
  columns: 4,
  head: {
    eyebrow: "10 · The month",
    title: { pre: "Four weeks,", em: "then it is Suri's." },
    sub: "As planned on 4 October: the plugins go in on Monday, the team runs them from week two, and in week four the repository, the keys and the plugins move to Suri's own accounts.",
  },
  cards: [
    {
      id: "monday",
      n: "01",
      kicker: "Monday 5 October",
      title: "The plugins go in",
      body: "An Owner syncs the marketplace, growth reads the baseline on three months of Monday, and one live brief goes through.",
    },
    {
      id: "week-one",
      n: "02",
      kicker: "6 to 8 October",
      title: "Built with the team",
      body: "The intake in the studio's words, the first two ad types with the lead designer, and the feedback connector on IT day.",
    },
    {
      id: "weeks-two-three",
      n: "03",
      kicker: "Weeks two and three",
      title: "The team runs it",
      body: "Both pieces of work without me in the room, the review on 16 October against the baseline, then the picture test.",
    },
    {
      id: "week-four",
      n: "04",
      kicker: "Week four",
      title: "It is Suri's",
      body: "The repository moves to Suri's own GitHub, every key is in Suri's name, and the next skill starts with /ai-suri:new-skill.",
    },
  ],
};

export const THOUGHTFORM_ARMADA_ARC: ArcDef = {
  slug: "thoughtform-armada",
  leaf: "armada",
  format: "workshop",
  /* No `client` (the owner placed it in the house group, ADR-146), no
     `theme`, no `motion`. */
  status: "running",
  date: "2026-10-04",
  /* The overview's composed strings hold the client-facing copy law, which
     keeps the fleet's own name off them (`PROPOSAL_COPY_BANS`); the card
     names the page by what it is to the workshop instead. */
  cardTitle: "The Thoughtform workshop · The machinery",
  cardLede:
    "One piece of work through the machinery: its six answers, the skill and its checks, the repository, feedback, and how lessons travel.",
  cardImage: { src: "/images/services/workshop.webp", alt: "" },
  hero: {
    eyebrow: "Thoughtform · Armada",
    title: { pre: "How Armada runs", em: "a piece of work." },
    lede: "Six answers per piece of work, written as files your team owns, tested with cases and fixed from your words.",
    actions: [
      { id: "start", label: "The configuration", href: "#config-brief", primary: true },
      { id: "repo", label: "The repository", href: "#repository" },
    ],
    image: {
      src: "/images/Thoughtform_Key%20Visual_14d.webp",
      alt: "",
      width: 2400,
      height: 1350,
    },
    plate: "gateway",
    curtain: true,
  },
  meta: {
    title: "How Armada works · Thoughtform",
    description:
      "The technical companion to the workshop: one piece of work, its six answers, the files and checks that hold them, and how they get better.",
  },
  sections: [
    ...CONFIGURATION,
    ...SKILL,
    ...CHECKS,
    ...CASES,
    REPOSITORY,
    ...USING,
    ...WRONG,
    ONCE_TWICE,
    ACROSS,
    THE_MONTH,
    whatFollows("11 · What follows"),
  ],
};
