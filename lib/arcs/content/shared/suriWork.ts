import type { ArcBreakdown, ArcChatAside, ArcSectionOf, ArcTitle } from "../../types";

/**
 * SURI'S THREE PIECES OF WORK, AS ONE RECORD (ADR-147): the brief, the Monday
 * read and the statics, drawn through the machinery once, read by three
 * pages. The Armada companion (`/arcs/thoughtform/armada`, ADR-146) carries
 * them as its worked examples by the owner's ruling; the Suri lunch-and-learn
 * and the Suri configuration page carry them as the client's own. ONE
 * SECTION, ONE RECORD (owner, 2026-10-02): a body is written here and never
 * on a page, so an edit to an answer, a thread or a plugin's line lands on
 * every page at once, and `arcs-registry` pins each reader `toBe` the body.
 *
 * SHARE THE BODY, AUTHOR THE FRAME (the `theHorizon(eyebrow)` and
 * `whatFollows(eyebrow)` idiom): each page numbers the beat in its own order
 * and decides whether it is a chapter, so every factory here takes the
 * eyebrow and the menu words and spreads the body under them. The head's
 * title and sub are the record's, because they say what the beat IS.
 *
 * ⚠ PEOPLE BY ROLE, NEVER BY NAME. The house page reads these bodies and its
 * test walks every string for a colleague's name (`thoughtform-armada.test.ts`),
 * so the record says the creative lead, the lead designer, the strategists,
 * growth. A client page may name people in the frame it authors around a
 * body, never in the body.
 *
 * ⚠ EVERY FILE AND NUMBER IS SURI'S OWN, read from the plugin repository on
 * the names of 3 October (`suri-ai-studio`: `ai-suri`, `ai-studio-strategy`,
 * `ai-studio-design`) and `records/eval-log.md`'s run of 3 October. What is
 * not written yet says so instead of being drawn as if it were.
 */

/** The three pieces of work, in the order every switched beat carries them.
 *  ⚠ THE SAME IDS AND LABELS IN EVERY GROUP: the pick is page-wide. */
export const SURI_WORKED = {
  brief: { id: "brief", label: "The brief" },
  read: { id: "monday-read", label: "The Monday read" },
  statics: { id: "statics", label: "The statics" },
} as const;

export type SuriWork = keyof typeof SURI_WORKED;

/** The three, in the order the switch shows them. */
export const SURI_WORKS: readonly SuriWork[] = ["brief", "read", "statics"];

/** A switched beat's panel stamp. The group is the beat. */
export const suriPanel = (group: string, which: SuriWork) => ({
  group,
  id: SURI_WORKED[which].id,
  label: SURI_WORKED[which].label,
});

/** What a page authors around a shared body: its number, and whether the
 *  beat is a chapter. `menuLabel` defaults to the body's own word. */
export interface SuriFrame {
  eyebrow: string;
  /** A page's own title for the beat (ADR-147 U7: the lunch and learn's
   *  "Building an intelligence configuration around the work"); the body,
   *  the sub and every panel stay the record's. */
  title?: ArcTitle;
  menuLabel?: string;
  menuPrimary?: boolean;
}

/** The menu words a frame puts on the FIRST panel of a switched group only;
 *  a panel after the first carries neither (`arcs-registry`). */
const menu = (frame: SuriFrame, fallback: string, first: boolean) =>
  first
    ? {
        menuLabel: frame.menuLabel ?? fallback,
        ...(frame.menuPrimary ? { menuPrimary: true } : {}),
      }
    : {};

/* ── The configuration ──────────────────────────────────────────────────
   Six answers per piece of work; Suri sets four once, the team writes the
   context and the checks. */

export const SURI_CONFIGURATION_TITLE = {
  pre: "Every piece of work gets six answers.",
  em: "Two only the team can give.",
} as const;

export const SURI_CONFIGURATION_SUB =
  "What runs it, what it reaches, where you meet it, what it knows, how we know it is good, and who answers for it. Suri sets four once, for everyone; the team writes the context and the checks.";

type ConfigurationBody = Pick<ArcSectionOf<"questions">, "work" | "left" | "right" | "tag" | "alt">;

export const SURI_CONFIGURATION_BODIES: Record<SuriWork, ConfigurationBody> = {
  brief: {
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
  read: {
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
  statics: {
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
};

/** The three `questions` panels of the `config` group, under one head. */
export function suriConfiguration(frame: SuriFrame): ArcSectionOf<"questions">[] {
  const head = {
    eyebrow: frame.eyebrow,
    title: frame.title ?? SURI_CONFIGURATION_TITLE,
    sub: SURI_CONFIGURATION_SUB,
  };
  return SURI_WORKS.map((which, i) => ({
    id: `config-${SURI_WORKED[which].id}`,
    kind: "questions" as const,
    ...menu(frame, "Configuration", i === 0),
    worked: suriPanel("config", which),
    head,
    ...SURI_CONFIGURATION_BODIES[which],
  }));
}

/* ── The repository ─────────────────────────────────────────────────────
   The six answers as a nesting: Suri's Claude holds the marketplace, which
   holds the plugins, which hold the skills. */

export const SURI_REPOSITORY_TITLE = { pre: "Six answers,", em: "one repository." } as const;

export const SURI_REPOSITORY_SUB =
  "The skills and their cases sit in plugins, the plugins in one marketplace. An Owner at Suri syncs it into Suri's Claude once, and each plugin goes to the people who need it.";

type RepositoryBody = Pick<ArcSectionOf<"repository">, "org" | "repo" | "plugins" | "bar" | "alt">;

export const SURI_REPOSITORY_BODY: RepositoryBody = {
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

export function suriRepository(frame: SuriFrame): ArcSectionOf<"repository"> {
  return {
    id: "repository",
    kind: "repository",
    ...menu(frame, "Repository", true),
    head: { eyebrow: frame.eyebrow, title: SURI_REPOSITORY_TITLE, sub: SURI_REPOSITORY_SUB },
    ...SURI_REPOSITORY_BODY,
  };
}

/* ── Using it ───────────────────────────────────────────────────────────
   Say what you need; the right skill starts, or the mother routes it. */

export const SURI_USING_TITLE = {
  pre: "Say what you need.",
  em: "The right skill starts, or the mother routes it.",
} as const;

export const SURI_USING_SUB =
  "Claude matches the request to a skill by its description and says which one it used. Or type a slash and pick from the plugins Suri has switched on.";

const MENU_TITLE = "Skills, and the plugin each came from";

type ChatBody = Pick<ArcSectionOf<"chat">, "thread" | "aside">;

export const SURI_USING_BODIES: Record<SuriWork, ChatBody> = {
  /* The ask is the case `brief-waits-for-answers`, word for word; the
     answer asks the first open question in the intake's order. */
  brief: {
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
  read: {
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
  /* The five steps are `flows.md`'s statics table, who does each and who
     decides it. */
  statics: {
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
};

/** The three `chat ask` panels of the `using` group, under one head. */
export function suriUsing(frame: SuriFrame): ArcSectionOf<"chat">[] {
  const head = { eyebrow: frame.eyebrow, title: SURI_USING_TITLE, sub: SURI_USING_SUB };
  return SURI_WORKS.map((which, i) => ({
    id: `using-${SURI_WORKED[which].id}`,
    kind: "chat" as const,
    ...menu(frame, "Using it", i === 0),
    variant: "ask" as const,
    worked: suriPanel("using", which),
    head,
    ...SURI_USING_BODIES[which],
  }));
}

/* ── When it's wrong ────────────────────────────────────────────────────
   The four steps are the kit's own path (`docs/FEEDBACK.md`): the triage
   labels and comments and changes no file, the skill's one owner decides,
   a fix is a draft with its test and only on the owner's word, a person
   merges. Not v2's shared steps: those say Claude sorts it, and here a
   workflow in Suri's own repository does. */

export const SURI_FEEDBACK_STEPS: Extract<ArcChatAside, { kind: "steps" }> = {
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

export const SURI_WRONG_TITLE = {
  pre: "When a skill is wrong, say so in the chat.",
  em: "It reaches the owner as an issue.",
} as const;

export const SURI_WRONG_SUB =
  "Type /skill-feedback and say what went wrong. You see exactly what will be filed, and nothing is filed until you say yes. Until the connector arrives on Thursday 8 October, Claude writes the issue for the maintainer.";

const FEEDBACK_CONFIRM = "Reading the skill, and what is already open";

export const SURI_WRONG_THREADS: Record<SuriWork, ArcSectionOf<"chat">["thread"]> = {
  brief: {
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
  read: {
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
  statics: {
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
};

/** The three `chat feedback` panels of the `wrong` group, under one head. */
export function suriWrong(frame: SuriFrame): ArcSectionOf<"chat">[] {
  const head = { eyebrow: frame.eyebrow, title: SURI_WRONG_TITLE, sub: SURI_WRONG_SUB };
  return SURI_WORKS.map((which, i) => ({
    id: `wrong-${SURI_WORKED[which].id}`,
    kind: "chat" as const,
    ...menu(frame, "When it's wrong", i === 0),
    variant: "feedback" as const,
    worked: suriPanel("wrong", which),
    head,
    thread: SURI_WRONG_THREADS[which],
    aside: SURI_FEEDBACK_STEPS,
  }));
}

/* ── Once, then twice ───────────────────────────────────────────────────
   The mother's `learning.md` and the kit's FEEDBACK.md: heard once, a row in
   the skill's corrections; heard again on other work, a person writes the
   rule. ONE deliverable on the dial: the generic route writes no scroll
   clock, so every stage a `steps` beat carries renders at once. */

export const SURI_ONCE_TWICE_TITLE = {
  pre: "Heard once, it is a correction.",
  em: "Heard twice, a person writes the rule.",
} as const;

export const SURI_ONCE_TWICE_SUB =
  "Every run writes the record. The mother reads it back each week and after every review, and proposes a change in a pull request. Nothing is written until a person says so.";

export const SURI_ONCE_TWICE_ITEM: ArcSectionOf<"steps">["items"][number] = {
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
};

export function suriOnceTwice(frame: SuriFrame): ArcSectionOf<"steps"> {
  return {
    id: "once-twice",
    kind: "steps",
    ...menu(frame, "Once, then twice", true),
    head: { eyebrow: frame.eyebrow, title: SURI_ONCE_TWICE_TITLE, sub: SURI_ONCE_TWICE_SUB },
    items: [SURI_ONCE_TWICE_ITEM],
  };
}

/* ── The month ──────────────────────────────────────────────────────────
   As planned on 4 October: `2026-10-05-sprint-plan.md` and
   `2026-10-05-systems-integration.md` in the ship's delivery folder. */

export const SURI_MONTH_TITLE = { pre: "Four weeks,", em: "then it is Suri's." } as const;

export const SURI_MONTH_SUB =
  "As planned on 4 October: the plugins go in on Monday, the team runs them from week two, and in week four the repository, the keys and the plugins move to Suri's own accounts.";

export const SURI_MONTH_CARDS: ArcSectionOf<"cards">["cards"] = [
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
];

export function suriMonth(frame: SuriFrame): ArcSectionOf<"cards"> {
  return {
    id: "the-month",
    kind: "cards",
    ...menu(frame, "The month", true),
    columns: 4,
    head: { eyebrow: frame.eyebrow, title: SURI_MONTH_TITLE, sub: SURI_MONTH_SUB },
    cards: SURI_MONTH_CARDS,
  };
}

/* ── The studio's configuration (ADR-148) ───────────────────────────────
   The six answers once, for the studio as a whole: the simplified setup
   page shows one board where the lunch and learn switched three. The
   workstreams that follow it are where each answer gets specific. */

export const SURI_STUDIO_CONFIGURATION: ConfigurationBody = {
  work: {
    label: "The work",
    name: "Suri's creative work",
    line: "Briefs, iterations and edits, one workstream at a time.",
    bar: {
      label: "Good looks like",
      line: "Each workstream's own checks passed, and a person who decides.",
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
      answer: "A skill per workstream, with the brand file and the library",
      lit: true,
    },
    {
      id: "evals",
      title: "The evaluations",
      question: "How we know it is good",
      answer: "The rubric, the cases, and the creative lead's verdicts",
      lit: true,
    },
  ],
  right: [
    {
      id: "data",
      title: "The data",
      question: "What it can reach",
      answer: "Monday, Figma and the Drive folders",
    },
    {
      id: "interface",
      title: "The interface",
      question: "Where you meet it",
      answer: "Claude or Cowork: ask in your own words",
    },
    {
      id: "owner",
      title: "The owner",
      question: "Who answers for it",
      answer: "One owner per workstream, by role",
      human: true,
    },
  ],
  tag: "You write this",
  alt: "Suri's creative work at the centre, with six questions wired around it: the context and the evaluations lit, the owner in green",
};

/* ── The workstreams, run (ADR-148) ─────────────────────────────────────
   Three of the eight workstreams in `suri-ai-studio/workstreams.toml`, the
   ones the 5 October sessions put first: the brief and its ad names, the
   Black Friday iterations, the video retouch. Each is one `skill-run`: the
   ask is the plugin's own starting prompt, the steps and checks its
   SKILL.md and rubric, the figures `records/eval-log.md` (4 and 6 October).
   What has not run says so. */

export const SURI_WORKSTREAMS = {
  briefing: { id: "briefing", label: "Briefing + naming" },
  iterations: { id: "iterations", label: "Iterations" },
  video: { id: "video", label: "Video retouch + edit" },
} as const;

export type SuriWorkstream = keyof typeof SURI_WORKSTREAMS;

export const SURI_WORKSTREAM_ORDER: readonly SuriWorkstream[] = ["briefing", "iterations", "video"];

export const SURI_RUN_TITLE = { pre: "How it runs", em: "on Suri's own work." } as const;

export const SURI_RUN_SUB =
  "The same five steps as the Loop ad, on three of Suri's workstreams, taken from the studio's own plugin.";

type RunBody = Pick<
  ArcSectionOf<"skill-run">,
  "ask" | "skill" | "steps" | "checks" | "decide" | "evals"
>;

const UTG = "/arcs/suri/under-the-glass";

/**
 * UNDER THE GLASS (ADR-148 U4, a breakdown since U5): Suri's own case, the
 * Black Friday teaser made in Cowork on 6 October, condensed from its own
 * breakdown (the artifact the owner shared, 11 steps) to the film and seven
 * slides. Every figure is the breakdown's. It sits beside Prompt to Loop
 * under the page's case switch, in the same format. The video editor is
 * named by role.
 */
export const UNDER_THE_GLASS: ArcBreakdown = {
  eyebrow: "How Claude made it · Suri Black Friday · 6 Oct 2026",
  title: { pre: "From 31 raw clips", em: "to a 16‑second teaser." },
  sub: "Edit only, no generated footage: a real hand, a real magnifying glass and a real card on brushed steel. Code added the words on the card and what the glass shows over them.",
  film: {
    src: `${UTG}/teaser.mp4`,
    poster: `${UTG}/teaser-poster.webp`,
    alt: "The teaser: a hand moves a magnifying glass over a white card on brushed steel, and the glass reveals BLACK FRIDAY, EARLY ACCESS IS COMING.",
  },
  facts: [
    { label: "From", value: "31 raw clips, about 39 minutes" },
    { label: "Length", value: "16.16 s, 1080 × 1920" },
    { label: "Master", value: "ProRes 422 HQ" },
    { label: "Rounds", value: "7 versions" },
  ],
  beats: [
    {
      id: "utg-idea",
      key: "The idea",
      title: { pre: "The glass is the reader.", em: "The message waits on the card." },
      line: "Every card take was shot with green paper inside the glass, which left room for the message. It is printed on the card the whole time, shows enlarged inside the lens, and stays wherever the glass has passed, so the reveal follows the real hand.",
      frames: [
        {
          src: `${UTG}/lens_raw.webp`,
          alt: "The glass over the card, green paper inside the lens",
          label: "As shot · C6125",
          ratio: "1:1",
        },
        {
          src: `${UTG}/lens_comp.webp`,
          alt: "The same frame, the message enlarged inside the lens",
          label: "In the teaser · same frame",
          ratio: "1:1",
        },
      ],
    },
    {
      id: "utg-cut",
      key: "The cut",
      title: { pre: "Two shots,", em: "one continuous moment." },
      line: "The first version followed the brief whole: seven shots, 27 seconds. The video editor cut it down to the card. Two locked-off shots, aligned so the cut does not jump, the second at half speed on real 50p frames, so nothing is interpolated.",
      frames: [
        {
          src: `${UTG}/cut_a.webp`,
          alt: "The last frame of the first shot: the blank card on steel",
          label: "Last frame · C6119",
          ratio: "9:16",
        },
        {
          src: `${UTG}/cut_b.webp`,
          alt: "The first frame of the second shot, aligned to the first",
          label: "First frame · C6125",
          ratio: "9:16",
        },
        {
          src: `${UTG}/end_logo.webp`,
          alt: "The last frame: the SURI logo printed on the card",
          label: "The logo, in the same ink",
          ratio: "9:16",
        },
      ],
    },
    {
      id: "utg-reveal",
      key: "The reveal",
      title: { pre: "Measured from the hand,", em: "frame by frame." },
      line: "No video or image model, no generative fill and no interpolated frames. Code finds the glass in every frame and prints the message under it.",
      rows: [
        {
          label: "Find the glass",
          value: "The green paper is keyed and a circle fitted to its edge",
        },
        {
          label: "Remember the path",
          value: "Wherever the lens has been, the message stays printed",
        },
        {
          label: "Print it",
          value: "On the card's real tilt, multiplied in like ink, so the grain shows through",
        },
        {
          label: "Hands in front",
          value: "Fingers, handle and rim are held out, so the print never lands on them",
        },
        {
          label: "Follow the camera",
          value: "The print moves with the drift and softens when the focus does",
        },
      ],
    },
    {
      id: "utg-clean",
      key: "Clean-up",
      title: { pre: "Remove the marks,", em: "keep the metal." },
      line: "The first pass smoothed the whole surface. Every scratch went, and the brushed grain with it, and the video editor said it looked AI. The second pass only touches the specks, the short scratches and three smudges.",
      frames: [
        {
          src: `${UTG}/clean_orig.webp`,
          alt: "The steel as shot, with specks and scratches",
          label: "As shot",
          ratio: "3:2",
        },
        {
          src: `${UTG}/clean_smooth.webp`,
          alt: "The steel smoothed flat, the grain gone",
          label: "Too smooth · v2",
          ratio: "3:2",
          verdict: "rejected",
        },
        {
          src: `${UTG}/clean_real.webp`,
          alt: "The steel with the marks gone and the grain kept",
          label: "Final",
          ratio: "3:2",
          verdict: "kept",
        },
      ],
    },
    {
      id: "utg-rounds",
      key: "Rounds",
      title: { pre: "Seven versions,", em: "each one a note." },
      line: "Each version answered one note, most of them the video editor's.",
      rows: [
        { label: "v1", value: "The full brief, brush details to card, 27 s, placeholder copy" },
        { label: "v2", value: "Cut to the card, in Plain Regular; the steel too smooth" },
        { label: "v3", value: "Texture kept, marks removed" },
        { label: "v4", value: "The last smudge gone, and a ProRes master" },
        { label: "v5", value: "New copy, and an ending on the logo" },
        { label: "v6", value: "The copy in two tiers, all caps, as in the reference" },
        { label: "v7", value: "Take C6125, so the message sits centred in the glass" },
      ],
    },
    {
      id: "utg-check",
      key: "Check",
      title: { pre: "Look, measure,", em: "look again." },
      line: "Every render was checked frame by frame, and measured where the eye could miss something.",
      figures: [
        { label: "Offset left at the cut between the two shots", value: "0.1 px" },
        { label: "Of the message passed over by the real glass", value: "100%" },
        { label: "Largest brightness step on a cleaned smudge, out of 255", value: "< 0.4" },
        { label: "The ProRes master against the lossless render", value: "52–55 dB" },
      ],
    },
    {
      id: "utg-next",
      key: "Next",
      title: { pre: "What's left,", em: "and how to reuse it." },
      line: "The master goes on to the grade and the sound. Then the method could be written down as a Suri skill, so the next teaser starts from a request instead of a blank page.",
      rows: [
        {
          label: "Sound",
          value: "Music, plus a few quiet room sounds: the card set down, the glass passing",
        },
        {
          label: "Grade and export",
          value: "Grade the ProRes master, then export an H.264 file for posting",
        },
        { label: "Make it a skill", value: "Survey, track, reveal, clean, check, deliver" },
      ],
    },
  ],
};

export const SURI_RUNS: Record<SuriWorkstream, RunBody> = {
  briefing: {
    ask: "A newsletter for the Pro 2 next week.",
    skill: { name: "brief", also: ["ad-naming"] },
    steps: [
      "Asks one question at a time, in the studio's words",
      "Lists what is still missing, and flags a short lead time",
      "Writes the brief, every claim in brackets",
      "Fills the ad names from the brief's own fields",
      "Shows the names before it writes to Monday",
    ],
    checks: [
      { line: "Channel, formats and timing named", gate: true },
      { line: "Every claim in brackets", gate: true },
      { line: "Every name from its list", gate: true },
      { line: "Names shown before they are written", gate: true },
    ],
    decide: {
      who: "The strategist",
      line: "Marks the brief ready. It lands as a Monday item, with its ad names.",
    },
    evals: {
      cases: [
        { name: "brief-waits-for-answers", with: "3 of 3" },
        { name: "names-at-brief-stage" },
        { name: "an-iteration-keeps-its-original" },
      ],
      note: "The brief held on every run on 4 October. The naming cases are written, and run on the first real brief.",
    },
  },
  iterations: {
    ask: "Three iterations of last week's winner: a new hook, a footage swap, a copy line. UK and US.",
    skill: { name: "video-edit", also: ["figma-variants", "ad-naming"] },
    steps: [
      "Reads the result and names one change per iteration",
      "Cuts each iteration from the master, which stays as it is",
      "Makes the 4:5 and 9:16 crops",
      "Names each one with the original's code",
    ],
    checks: [
      { line: "The product is real footage", gate: true },
      { line: "One change per iteration", gate: true },
      { line: "The master stays untouched", gate: true },
      { line: "The crops hold the product and the supers" },
    ],
    decide: {
      who: "The creative lead",
      line: "Picks what goes live, and reviews anything above an agreed spend.",
    },
    evals: {
      cases: [
        { name: "iterate-a-winner-one-change", with: "2 of 3", without: "0 of 3" },
        { name: "rushes-to-a-thirty-second-cut", with: "3 of 3", without: "1 of 3" },
      ],
      note: "Run on 6 October. The miss asked for the clip's path before proposing anything; the one-change rule held.",
    },
  },
  video: {
    ask: "Scratches on the backdrop from 00:04 to 00:09 on the sink clip. It can't look AI.",
    skill: { name: "video-retouch", also: ["asset-review"] },
    steps: [
      "Picks the cheapest fix that works: a curve before a model",
      "Never touches the product",
      "Holds the fix across every frame of the span",
      "Saves a new numbered file and keeps the original",
      "Makes a before and after sheet at 1x and 4x",
    ],
    checks: [
      { line: "The product untouched", gate: true },
      { line: "The original kept, the fix a new file", gate: true },
      { line: "Nothing invented" },
      { line: "The fix holds across frames" },
    ],
    decide: {
      who: "The video editor",
      line: "Reads the sheet. The creative lead signs it off.",
    },
    evals: {
      cases: [
        { name: "remove-the-whole-background", with: "3 of 3", without: "0 of 3" },
        { name: "scratch-on-the-background", with: "2 of 3", without: "0 of 3" },
      ],
      note: "Run on 6 October: the video skills scored 0.73 above Claude without them, on average.",
    },
  },
};

const EWS = "/arcs/suri/every-word-stays";

/**
 * EVERY WORD STAYS (ADR-148 U6): Suri's second case, the email skill made in
 * Cowork on 6 and 7 October, condensed from its own breakdown (the artifact
 * the owner shared, 11 steps) to the page and nine slides. It has no film:
 * its hero is the email itself, scrolling in the film's window. Every figure
 * and quote is the breakdown's; people by role (the designer, a colleague who
 * reviews, the creative lead), and the dentist is named only inside Suri's
 * own email.
 */
export const EVERY_WORD_STAYS: ArcBreakdown = {
  eyebrow: "How Claude made it · Suri email · 6–7 Oct 2026",
  title: { pre: "From one dentist's tips", em: "to a skill for every Suri email." },
  sub: "Over five rounds the designer showed what makes a lot of copy feel light without cutting a word, and her own edits to the frames became the brief.",
  page: {
    src: `${EWS}/final_desktop.webp`,
    alt: "The Brush like a dentist pt I email at 600 wide: the SURI logo, an inset rounded photo of a dentist brushing a model of teeth under the headline Meet your oral microbiome, a serif standfirst, a short explainer, the line When that balance is disrupted in a pale panel, five tips as white cards on a light band, a Restore module with a moving close-up of the product, and the UK footer",
    label: "As she left it · her desktop",
    ratio: "scroll",
  },
  facts: [
    { label: "Read", value: "About 110 emails, May–Sep 2026" },
    { label: "Rounds", value: "5, then her own frame" },
    { label: "Made", value: "1 skill · 9 references · 36 checks" },
    { label: "Cases", value: "3 real requests, dated" },
  ],
  beats: [
    {
      id: "ews-ask",
      key: "The ask",
      title: { pre: "Set it up,", em: "same as usual." },
      line: "The Monday item was part one of a series: a dentist explains the oral microbiome, in an editorial email for the UK and the US that ends on a refillable toothpaste module. A day later the designer asked for a skill just for emails.",
      rows: [
        {
          label: "6 October",
          value:
            "“Can you set it up in this Figma board using the same layout and standards as usual.”",
        },
        {
          label: "7 October",
          value: "“Make sure it's evergreen and works for different types of emails.”",
        },
      ],
    },
    {
      id: "ews-look",
      key: "Look first",
      title: { pre: "The file", em: "before the frame." },
      line: "Before anything was drawn, Claude read the Email Projects file, May to September 2026: 26 campaigns measured layer by layer, nothing moved. Every round after was read against the references the designer pinned beside the brief, for inspiration, not to copy.",
      figures: [
        { value: "16 of 26", label: "Heroes centred; about 9 more set left" },
        { value: "8 of 26", label: "With the card overlapping the hero, the house signature" },
        { value: "3 grounds", label: "Sections change background instead of using dividers" },
      ],
    },
    {
      id: "ews-rounds",
      key: "The rounds",
      title: { pre: "Five rounds,", em: "each one lighter." },
      line: "From v2 on, every round kept every word of her copy and changed only how heavy it felt. Her notes ran from “way off” and “big blocks of text” to “way too formal” and “the images don't necessarily match”, until she took the frame over herself.",
      frames: [
        {
          src: `${EWS}/r1.webp`,
          alt: "Round 1: a grey hero placeholder, two long paragraphs, five numbered tips as text, a subscription banner",
          label: "v1 · way off, blocks of text",
          ratio: "scroll",
          verdict: "rejected",
        },
        {
          src: `${EWS}/r2.webp`,
          alt: "Round 2: a monospaced series masthead, a big 700 on blue, ruled rows of tips, a pasted Restore module",
          label: "v2 · way too formal",
          ratio: "scroll",
          verdict: "rejected",
        },
        {
          src: `${EWS}/r3.webp`,
          alt: "Round 3: an inset rounded hero, split cards with library photos for each tip, a frosted Restore panel",
          label: "v3 · photos that don't match",
          ratio: "scroll",
        },
        {
          src: `${EWS}/r4.webp`,
          alt: "Round 4: the intro as one flowing block, tips as white cards on a peach band",
          label: "v4 · tips without photos",
          ratio: "scroll",
        },
        {
          src: `${EWS}/r5.webp`,
          alt: "Round 5, option D: the closing line set apart in a soft blue panel",
          label: "v5 · the line in a panel",
          ratio: "scroll",
        },
        {
          src: `${EWS}/r6.webp`,
          alt: "Her frame: the inset hero, the line in a pale panel, white tip cards, a split Restore module",
          label: "Hers · as she left it",
          ratio: "scroll",
          verdict: "kept",
        },
      ],
    },
    {
      id: "ews-weight",
      key: "Text weight",
      title: { pre: "Text weight,", em: "seen squinted." },
      line: "Squinted, the first round is grey bars of text from top to bottom. Hers is a rhythm: a photo, a lead, a panel, cards, the product.",
      frames: [
        {
          src: `${EWS}/sq_v1.webp`,
          alt: "Round 1 blurred: long grey bars of text from top to bottom",
          label: "v1, squinted · grey bars",
          ratio: "page",
        },
        {
          src: `${EWS}/sq_final.webp`,
          alt: "Her frame blurred: a dark photo, a short lead, a pale panel, a band of light cards, the product, the footer",
          label: "Hers, squinted · a rhythm",
          ratio: "page",
        },
      ],
    },
    {
      id: "ews-lead",
      key: "One lead",
      title: { pre: "One lead", em: "per section." },
      line: "The intro was two blocks at a similar weight, with the sentence that matters most at the end of the body, so nothing led. Round five tried four ways to give one piece the lead, each on a copy of her frame. She took the panel.",
      frames: [
        {
          src: `${EWS}/i_flat.webp`,
          alt: "The intro as two blocks, a serif standfirst over one sans paragraph",
          label: "Before · one flow",
          ratio: "1:1",
        },
        {
          src: `${EWS}/i_a.webp`,
          alt: "Option A: a small sans deck, a rule, the body, the line as a large serif headline",
          label: "A · the line as headline",
          ratio: "1:1",
        },
        {
          src: `${EWS}/i_b.webp`,
          alt: "Option B: the line moved down to open the tips band, with a small deck under it",
          label: "B · the line opens the tips",
          ratio: "1:1",
        },
        {
          src: `${EWS}/i_c.webp`,
          alt: "Option C: a left-aligned grid with small labels, What it is and Why it matters",
          label: "C · an editorial grid",
          ratio: "1:1",
        },
        {
          src: `${EWS}/i_d.webp`,
          alt: "Option D: the line set apart in a soft blue panel",
          label: "D · the line in a panel",
          ratio: "1:1",
          verdict: "kept",
        },
      ],
    },
    {
      id: "ews-frame",
      key: "Her frame",
      title: { pre: "Her frame", em: "is the brief." },
      line: "Between rounds the designer worked in the frames herself: “I have deleted from there what I think wasn't working.” So the skill reads her frame against what it last made, lists every change and carries them all into the next step.",
      frames: [
        {
          src: `${EWS}/claude_mobile.webp`,
          alt: "Claude's mobile, 390 wide: the hero with a chip, the standfirst, the explainer, the line in a blue panel, five stacked left-aligned cards, the Restore bottle beside a glass panel",
          label: "Claude's mobile, from her desktop",
          ratio: "scroll",
        },
        {
          src: `${EWS}/final_mobile.webp`,
          alt: "Her mobile now: the same order, a pale panel, five centred white cards, a split Restore module",
          label: "Her mobile now",
          ratio: "scroll",
          verdict: "kept",
        },
      ],
    },
    {
      id: "ews-seeing",
      key: "Seeing",
      title: { pre: "Four ways to look", em: "at one email." },
      line: "In a desktop inbox the photo fills the first screen and the headline starts just below it, so a reader in a short preview pane meets the dentist before the words. Lift the headline or let the photo lead: that is the designer's call.",
      frames: [
        {
          src: `${EWS}/see_inbox.webp`,
          alt: "The email's first screen in a desktop inbox, 600 by 560: the photo fills it",
          label: "Inbox · the first screen",
          ratio: "page",
        },
        {
          src: `${EWS}/see_phone.webp`,
          alt: "The email's first screen on a phone",
          label: "Phone",
          ratio: "page",
        },
        {
          src: `${EWS}/see_squint.webp`,
          alt: "The whole email blurred, to read its weight",
          label: "Squint",
          ratio: "page",
        },
        {
          src: `${EWS}/see_values.webp`,
          alt: "The whole email in grey values, to read its contrast",
          label: "Values",
          ratio: "page",
        },
      ],
    },
    {
      id: "ews-system",
      key: "The system",
      title: { pre: "What a Suri email does,", em: "as measured." },
      line: "Every value comes from the file, dated 6 or 7 October 2026, and stays unconfirmed until the creative lead confirms it. Where the latest approved email of the same kind disagrees, the file wins and the skill says so.",
      figures: [
        {
          value: "600 · 390",
          label: "Desktop and mobile, every email both; the phone gets its own crop",
        },
        { value: "40 · 30", label: "Text margins and the rhythm between elements" },
        {
          value: "Ultralight",
          label: "Plain Ultralight is the voice; Nantes Light for serif headlines",
        },
        {
          value: "#252525",
          label: "Off-black on #FAFAFA off-white, greiges and soft panels between",
        },
        { value: "≤ 5 lines", label: "A block of body text on desktop; seven on a phone" },
        { value: "1 goal", label: "One main button, repeated lower in a long email" },
      ],
    },
    {
      id: "ews-skill",
      key: "The skill",
      title: { pre: "One skill,", em: "every kind of email." },
      line: "Email moved out of the design skill into its own, between the brief and the people who decide; their words become its checks. It carries 36 checks, all advice for now, and three dated cases from this week, not run yet.",
      rows: [
        {
          label: "Promo and sale",
          value:
            "One offer, read in the first screen: the offer, product and end date in live text",
        },
        {
          label: "Editorial",
          value:
            "A lot of words, made light: one lead per section, pictures that match their words or none",
        },
        {
          label: "Another kind",
          value: "Read from the latest two or three of its kind in the file",
        },
        { label: "Next", value: "The next Black Friday request becomes its first promo case" },
      ],
    },
  ],
};

/** The three `skill-run` panels of the `workstream` group, under one head. */
export function suriRuns(frame: SuriFrame): ArcSectionOf<"skill-run">[] {
  const head = {
    eyebrow: frame.eyebrow,
    title: frame.title ?? SURI_RUN_TITLE,
    sub: SURI_RUN_SUB,
  };
  return SURI_WORKSTREAM_ORDER.map((which, i) => ({
    id: `in-practice-${SURI_WORKSTREAMS[which].id}`,
    kind: "skill-run" as const,
    ...menu(frame, "In practice", i === 0),
    worked: {
      group: "workstream",
      id: SURI_WORKSTREAMS[which].id,
      label: SURI_WORKSTREAMS[which].label,
    },
    head,
    ...SURI_RUNS[which],
  }));
}

/**
 * THE SEPT/OCT STATICS, ITERATED (2026-10-08, for the X-Bionic proposal):
 * the review workstream, in the case grammar. From
 * `suri-ai-studio/work/figma-variants/2026-10-07_sept-oct-core-iterations.md`
 * and the route-two commit of 8 October: the design rubric read a set the
 * head of design had sent back and named her three faults as its own
 * checks; then the set was iterated on two routes.
 *
 * ⚠ THE SET THAT WAS SENT BACK IS NOT SHOWN. A freelancer's frame, returned,
 * has no place on another brand's page; the shoot photo and the iterations
 * stand for it. By role, never by name.
 */
const ITR = "/arcs/suri/iterations";

export const SURI_ITERATIONS: ArcBreakdown = {
  eyebrow: "Review · Suri · paid social iterations · 8 Oct 2026",
  title: { pre: "The review", em: "before the review." },
  sub: "Suri's approved and rejected ads were written down as a design rubric. Read on a set of statics the head of design had sent back, it named the same three faults she did, each with a measurement.",
  page: {
    src: `${ITR}/route-2-sheet.webp`,
    alt: "Four Suri ads for the Core 1.0 toothbrush, each drawn whole by the model in its own layout, with the Good Housekeeping quote and the offer.",
    label: "Route two · four layouts",
    ratio: "scroll",
  },
  facts: [
    { label: "The set", value: "26 concepts, 3 ratios" },
    { label: "Routes", value: "Layered in Figma, or drawn whole" },
    { label: "Wordmark exact", value: "6 of 8 draws" },
    { label: "Words spelled right", value: "8 of 8 draws" },
  ],
  beats: [
    {
      id: "suri-it-read",
      key: "The read",
      title: { pre: "Her three notes,", em: "in the rubric's own words." },
      line: "Each fault the head of design named was already a check, with a measurement behind it. So the fix for every concept follows from the reading, not from taste in the moment.",
      rows: [
        {
          label: "Too much going on",
          value: "Six groups and two frosted devices; the fix keeps five or fewer",
        },
        {
          label: "No clear hierarchy",
          value: "Four left edges within 52 px; the fix puts the copy on one",
        },
        {
          label: "The product too low",
          value: "The handle in the bottom band; the photo re-cropped 300 px up",
        },
      ],
    },
    {
      id: "suri-it-routes",
      key: "Two routes",
      title: { pre: "Edit the photo,", em: "or draw the whole ad." },
      line: "Route one keeps the shoot and edits only the ground, with the hand and the brush measured unchanged. Route two draws the whole ad from the photo and the wordmark, and is read against the same rubric.",
      frames: [
        {
          src: `${ITR}/photo.webp`,
          alt: "The shoot photo: a hand with a pink scrunchie holding the Core 1.0 on a green checked quilt.",
          label: "The shoot, as delivered",
          ratio: "9:16",
        },
        {
          src: `${ITR}/route-1-ground.webp`,
          alt: "The same photo with only the quilt behind the hand edited to a calm green.",
          label: "Route one · only the ground edited",
          ratio: "9:16",
        },
        {
          src: `${ITR}/route-2-i2.webp`,
          alt: "A whole ad drawn by the model: the toothbrush on its stand on green linen, the quote above it.",
          label: "Route two · drawn whole",
          ratio: "9:16",
        },
        {
          src: `${ITR}/route-2-i4.webp`,
          alt: "Another whole ad drawn by the model: the toothbrush lying on dark green linen in a shaft of light.",
          label: "Route two · another layout",
          ratio: "9:16",
        },
      ],
    },
    {
      id: "suri-it-gate",
      key: "The gate",
      title: { pre: "Claude reads first.", em: "A person decides." },
      line: "The rubric flags, the designer fixes, and nothing goes live without the head of design. The model's opinion is never the last one.",
      rows: [
        { label: "Reads first", value: "The design rubric, on every frame" },
        { label: "Decides", value: "The head of design" },
        { label: "Ships", value: "Only what a person approved, retyped in the brand font" },
      ],
    },
  ],
};
