import type { ArcSectionOf } from "../../types";

/**
 * The frontier curve's RECORD (ADR-130 U5, hoisted by ADR-136): the lanes,
 * their models and list prices, the other vendor's two points, the effort
 * dial's words and the dated note. The workshop archetype and the course's
 * class-one deck spread it into their `curve` sections and author only the
 * head; Plopsa's page keeps its Dutch copy of the same figure.
 *
 * ⚠ THE SAME FIGURE AS `/arcs/plopsa-workshop`, AND THE SAME NUMBERS. These
 * are the vendors' own list prices, read on the date in the note. The guard
 * only checks that output costs more than input; nothing checks that a
 * price is TRUE, so the pages move together when a vendor reprices: edit
 * here, and search the repo for the lane ids before touching the Dutch one.
 */
export const FRONTIER_CURVE: Pick<
  ArcSectionOf<"curve">,
  "axes" | "step" | "key" | "prices" | "effort" | "lanes" | "others" | "note"
> = {
  axes: { y: "What it can finish", x: "More intelligence →" },
  step: "The step",
  key: { own: "Claude" },
  prices: {
    show: "Show the price per token",
    unit: "Price per million tokens, in and out",
    promo: "Promotion",
    words: ["in", "out"],
  },
  effort: {
    axis: "← More effort",
    levels: ["Low", "High", "Max"],
    show: "Show the effort dial",
    note: "The second dial is effort. Turned up, the same model thinks longer about the same task, and spends more tokens doing it.",
  },
  lanes: [
    {
      id: "fast",
      label: "FAST",
      models: [
        { name: "Claude Sonnet 4.6", input: 3, output: 15 },
        { name: "Claude Haiku 4.5", input: 1, output: 5 },
      ],
    },
    {
      id: "everyday",
      label: "EVERYDAY",
      models: [{ name: "Claude Opus 5", input: 5, output: 25 }],
    },
    {
      id: "frontier",
      label: "FRONTIER",
      models: [{ name: "Claude Fable 5.1", input: 10, output: 50 }],
    },
  ],
  others: [
    {
      label: "OpenAI",
      points: [
        { t: 0.6, model: { name: "GPT-5.6 Sol", input: 4, output: 20, promo: true } },
        { t: 0.77, model: { name: "GPT-6 Astra", input: 10, output: 50 } },
      ],
    },
  ],
  note: "Source: METR. The task an agent finishes half the time roughly doubles every seven months. List prices from Anthropic's and OpenAI's own pages on 22 September 2026; the marked one is a promotion.",
};
