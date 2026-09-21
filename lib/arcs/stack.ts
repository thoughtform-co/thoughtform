/**
 * lib/arcs/stack — what a client's intelligence configuration is LINKED to
 * (ADR-118 U2): the language model it runs on, the model classes it calls,
 * and the tools it runs inside.
 *
 * The owner, 2026-09-21, on the `/arcs` dossier: "At the center, we should
 * showcase the type of intelligence configuration: generate images, generate
 * ads, or generate a video … Around it, we can link the LLM they use, like
 * whether they use Figma, etc. It should just really be a scalable thing."
 * The centre is the proposal's own workstreams; this is the ring around it.
 *
 * ⚠ NOTHING HERE IS AUTHORED PER CLIENT. A proposal already SAYS where each
 * workstream runs, in prose (`where: "Claude, writing into Figma"`), so the
 * links are DERIVED: each matcher below is run over a workstream's own
 * `where` and `runs` sentences (`lib/sheet/configuration.ts`), and
 * `sheet-configuration.test.ts` pins every proposal's result with `toEqual`.
 * A structured field beside the prose would be a second description of one
 * fact, free to disagree with the page a client reads; a derivation cannot.
 *
 * ⚠ THE VOCABULARY IS OPEN AND SMALL ON PURPOSE. A new tool a proposal names
 * is one row here, and it appears on every board that names it. A tool the
 * proposal never names is never drawn — a board that showed a stack the
 * proposal does not claim would be the dossier inventing the engagement.
 * Model names stay generic ("Image generation"), as the proposals say it.
 *
 * ⚠ MATCH THE PROPOSAL'S OWN SPELLING. `Claude` and `Figma` are proper nouns
 * and match case-sensitively; a model class is lower-case in a sentence and
 * matches either way. Zero imports, like the rest of `lib/arcs`.
 */

/** Which side of the drawing an item sits on: the intelligence, or the tools. */
export type StackKind = "llm" | "model" | "design" | "ops";

export interface StackItem {
  id: string;
  kind: StackKind;
  /** As the drawing letters it — the chip's name. */
  name: string;
  /** Finds the item in a workstream's own sentence. */
  match: RegExp;
}

/** The chip's kicker, per kind — a short code, the reference's REF / COOL. */
export const STACK_KIND_LABEL: Record<StackKind, string> = {
  llm: "LLM",
  model: "Model",
  design: "Design",
  ops: "Ops",
};

/** The two things a drawing sits either side of its centre: what the
 *  configuration RUNS ON, and what it runs INSIDE. */
export const STACK_SIDE: Record<StackKind, "runs" | "inside"> = {
  llm: "runs",
  model: "runs",
  design: "inside",
  ops: "inside",
};

export const STACK: readonly StackItem[] = [
  { id: "claude", kind: "llm", name: "Claude", match: /\bClaude\b/ },
  {
    id: "image-generation",
    kind: "model",
    name: "Image generation",
    match: /\bimage generation\b/i,
  },
  {
    id: "video-generation",
    kind: "model",
    name: "Video generation",
    match: /\bvideo generation\b/i,
  },
  { id: "figma", kind: "design", name: "Figma", match: /\bFigma\b/ },
  { id: "monday", kind: "ops", name: "Monday", match: /\bMonday\b/ },
  { id: "slack", kind: "ops", name: "Slack", match: /\bSlack\b/ },
];

export function stackItem(id: string): StackItem | undefined {
  return STACK.find((s) => s.id === id);
}
