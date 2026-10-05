import type { ArcChatAside, ArcSectionOf, ArcTitle } from "../../types";

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
