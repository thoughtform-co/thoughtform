import type { ArcChatAside, ArcSectionOf } from "../../types";

/**
 * The workshop's practical beats that read the same for every worked example
 * (ADR-139, hoisted by ADR-143): the horizon's two timelines, the four steps
 * after `/skill-feedback`, and getting started. The second cut and the third
 * house cut both show them; each page passes its own eyebrow (the number
 * differs) and whether the beat is one of its chapters, and spreads the rest
 * — the `FRONTIER_CURVE` precedent: share the record, author the frame.
 * `arcs-registry` and the v3 route test pin the bodies `toBe` these.
 */

/* ── The horizon: a tool you operate, and an agent on a long task ───────── */

export const THE_HORIZON_RECORD: Pick<
  ArcSectionOf<"horizon">,
  "axis" | "operated" | "agent" | "note"
> = {
  axis: { from: "five minutes", to: "half a day" },
  operated: {
    label: "A tool you operate",
    check: "you check",
    steps: 8,
    line: "You check after every step, eight times over.",
  },
  agent: {
    label: "An agent on a long task",
    start: "You set the goal and the checks",
    gates: [
      { kind: "check", at: 0.27, label: "Checks its own work" },
      { kind: "retry", at: 0.52, label: "Steps back and tries again" },
      { kind: "ask", at: 0.77, label: "Stops and asks you" },
    ],
    end: "You judge the result",
  },
  note: "Small slips compound. One slip in twenty every ten minutes leaves a four-hour task about a three-in-ten chance of ending clean. Checks that catch a slip early keep it going.",
};

export function theHorizon(eyebrow: string, chapter = false): ArcSectionOf<"horizon"> {
  return {
    id: "the-horizon",
    kind: "horizon",
    menuLabel: "The horizon",
    ...(chapter ? { menuPrimary: true as const } : {}),
    head: {
      eyebrow,
      title: { pre: "It can only work for hours", em: "when it has the context and the evals." },
      sub: "A tool you operate needs you at every step. An agent on a long task checks its work against the evals, retries when it slips, and stops to ask when it should.",
    },
    ...THE_HORIZON_RECORD,
  };
}

/* ── What happens after `/skill-feedback` ────────────────────────────────── */

export const FEEDBACK_STEPS: Extract<ArcChatAside, { kind: "steps" }> = {
  kind: "steps",
  label: "What happens next",
  items: [
    {
      id: "sorted",
      title: "It is sorted",
      body: "Claude names the kind of mistake, which file the fix belongs in, and who fixes it.",
    },
    {
      id: "decided",
      title: "The owner decides",
      body: "They ask what is waiting on them and choose: fix it, later, close it, or send it on.",
    },
    {
      id: "drafted",
      title: "A draft fix, with a test",
      body: "The case that caught it joins the evals, and all of them run again. Claude never merges.",
    },
    {
      id: "delivered",
      title: "Everyone gets it",
      body: "A person merges, and the new version reaches everyone who has the plugin.",
    },
  ],
};

/* ── Getting started ─────────────────────────────────────────────────────── */

export const GET_STARTED_CARDS: ArcSectionOf<"cards">["cards"] = [
  {
    id: "open",
    n: "01",
    kicker: "In Claude",
    title: "Open Customize",
    body: "In the left panel. Plugins, skills and connectors are all on that one page.",
  },
  {
    id: "find",
    n: "02",
    kicker: "Plugins, then Discover",
    title: "Find your team's plugin",
    body: "It is offered under your organisation. Add the one your team owns, and the shelf keeps it current.",
  },
  {
    id: "on",
    n: "03",
    kicker: "Once",
    title: "Turn it on",
    body: "Every skill in it comes on together, everywhere you use Claude. Skills and Connectors on the same page show what you have and what it can reach.",
  },
];

export function getStarted(eyebrow: string, chapter = false): ArcSectionOf<"cards"> {
  return {
    id: "get-started",
    kind: "cards",
    menuLabel: "Get started",
    ...(chapter ? { menuPrimary: true as const } : {}),
    columns: 3,
    head: {
      eyebrow,
      title: { pre: "Your team's plugin", em: "is one click away." },
      sub: "Plugins, skills and connectors all live in one place. Turn the plugin on once, and every skill in it is on in every Claude you use.",
    },
    cards: GET_STARTED_CARDS,
  };
}
