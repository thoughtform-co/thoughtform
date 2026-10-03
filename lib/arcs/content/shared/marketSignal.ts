import type { ArcSectionOf } from "../../types";

/**
 * THE MARKET'S RECORD (ADR-136's signal, hoisted by ADR-143): the four dated
 * clippings under "The labs just bet billions on the two things only your team
 * can write." Two public bets on the context (the labs' deployment companies)
 * and two results on the evaluations, each with its source and date. The
 * archetype, its second and third house cuts and the class-one deck all draw
 * it (the registry guard found the class deck's copy the day it was hoisted); each page
 * authors its own head and caption and spreads these columns, so a corrected
 * figure lands on every page at once. `arcs-registry` pins every reader `toBe`
 * this array.
 *
 * ⚠ THE FIGURES ARE THE SOURCES', DATED ON EACH CARD. A clipping is a record
 * and may carry digits (ADR-136's split digit ban); nothing here is Loop's.
 */
export const MARKET_SIGNAL_COLUMNS: ArcSectionOf<"signal">["columns"] = [
  {
    id: "context",
    plate: "context",
    label: "The context",
    line: "The labs are paying to embed engineers who write a company's way of working down.",
    cards: [
      {
        id: "openai",
        mark: "OpenAI",
        corner: "$10B",
        tag: "Joint venture",
        kicker: "Launch · May 2026",
        title: "OpenAI launches the Deployment Company.",
        dek: [
          { text: "$4B from 19 investment partners", strong: true },
          {
            text: " at a $10B valuation, and about 150 forward deployed engineers from day one, to build AI into how companies work.",
          },
        ],
        source: "openai.com",
        date: "11 May 2026",
        href: "https://openai.com/index/openai-launches-the-deployment-company/",
      },
      {
        id: "anthropic",
        mark: "Anthropic",
        corner: "$1.5B",
        tag: "Joint venture",
        kicker: "Launch · May 2026",
        title: "Anthropic's $1.5B answer.",
        dek: [
          { text: "With Blackstone, Hellman & Friedman and Goldman Sachs: " },
          { text: "engineers placed inside mid-sized companies", strong: true },
          { text: " to bring Claude into their most important work." },
        ],
        source: "CNBC",
        date: "4 May 2026",
        href: "https://www.cnbc.com/2026/05/04/anthropic-goldman-blackstone-ai-venture.html",
      },
    ],
  },
  {
    id: "evals",
    plate: "evals",
    label: "The evaluations",
    line: "The teams that write down what good looks like are pulling ahead.",
    cards: [
      {
        id: "lennys",
        mark: "Lenny's",
        corner: "35→83%",
        tag: "Hiring · Results",
        kicker: "Newsletter · Sep 2026",
        title: "Nearly half of 25 product job openings ask for evals.",
        dek: [
          { text: "Ramp's receipt matching: " },
          { text: "35% to 83% precision", strong: true },
          { text: ". Shopify's workflow builder: " },
          { text: "2.2× faster, 68% cheaper", strong: true },
          { text: ". Cursor's routing: " },
          { text: "41% lower cost.", strong: true },
        ],
        source: "Lenny's Newsletter",
        date: "22 Sep 2026",
        href: "https://www.lennysnewsletter.com/p/advanced-evals-how-to-find-and-fix",
      },
      {
        id: "claude",
        mark: "Claude",
        corner: "90.5%",
        tag: "Engineering blog",
        kicker: "Engineering · Sep 2026",
        title: "Anthropic automates designing the evals.",
        dek: [
          {
            text: "Claude interviews you, builds the tests and the grader, and pauses for your approval. On support tickets held back from tuning: ",
          },
          { text: "78.6% to 90.5%", strong: true },
          { text: ", at about a fifth of the cost." },
        ],
        source: "claude.dev",
        date: "28 Sep 2026",
        href: "https://claude.dev/blog/automating-eval-design-and-hillclimbing/",
      },
    ],
  },
];
