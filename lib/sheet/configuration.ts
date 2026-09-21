/**
 * lib/sheet/configuration — a client's intelligence configuration, read off
 * the proposal the client was sent (ADR-118 U2).
 *
 * The owner's brief for the `/arcs` dossier: "a visual of the intelligence
 * configuration … a simplified version that really talks about the specific
 * needs and the briefing of what they want." The CENTRE is the types of work
 * the setup is for — the proposal's own workstreams — and AROUND it are what
 * it runs on and inside (`lib/arcs/stack.ts`).
 *
 * ⚠ EVERY VALUE IS THE PROPOSAL'S OWN. A row is a workstream's `name` and its
 * `work` line; a link is a stack item the workstream's `where` or `runs`
 * sentence NAMES. Nothing is authored for the drawing, so the drawing cannot
 * say something the page the client reads does not. `sheet-configuration`
 * pins each proposal's result with `toEqual`: an edit to a proposal's prose
 * that changes its board fails there, loudly, rather than moving a chip.
 *
 * ⚠ A PLACEHOLDER IS NOT A WORKSTREAM. `next: { name: "[Next team]" }` is the
 * scaffold's own marker for "a team not yet named", and a dashed ghost row
 * lettering a bracketed placeholder would print the scaffold on the owner's
 * page; it is dropped, and a named next (Hungry Minds' Localisation) is drawn.
 *
 * Imports `lib/arcs` types and the stack vocabulary; pure.
 */

import { STACK, STACK_KIND_LABEL, stackItem } from "@/lib/arcs/stack";
import type { StackItem } from "@/lib/arcs/stack";
import type { ArcSection } from "@/lib/arcs/types";

import type { SheetConfigLink, SheetConfigRow, SheetConfiguration } from "./types";

type ConfigurationSection = Extract<ArcSection, { kind: "configuration" }>;
type BoardSection = Extract<ArcSection, { kind: "board" }>;
type ListGroupsSection = Extract<ArcSection, { kind: "list-groups" }>;

/**
 * A workstream's `work` line — `"stills and video, M1"` — as the row's note
 * and its module tag. A line with no trailing module is all note.
 */
export function splitWork(work: string): { note?: string; tag?: string } {
  const m = /^(.*?),\s*(M\d+)$/.exec(work.trim());
  if (!m) return work.trim() ? { note: work.trim() } : {};
  return m[1] ? { note: m[1], tag: m[2] } : { tag: m[2] };
}

const link = (item: StackItem, users: number): SheetConfigLink => ({
  id: item.id,
  kind: item.kind,
  kicker: STACK_KIND_LABEL[item.kind],
  name: item.name,
  users,
});

/**
 * The links in the order a board draws them: grouped by the vocabulary's own
 * order of kinds, the most-used first inside a kind, the vocabulary's order
 * breaking a tie — so one proposal edit cannot reshuffle an unrelated chip.
 */
function ordered(links: SheetConfigLink[]): SheetConfigLink[] {
  const rank = (l: SheetConfigLink) => STACK.findIndex((s) => s.id === l.id);
  const kinds = [...new Set(STACK.map((s) => s.kind))];
  return [...links].sort(
    (a, b) =>
      kinds.indexOf(a.kind) - kinds.indexOf(b.kind) || b.users - a.users || rank(a) - rank(b)
  );
}

/** A proposal arc's `configuration` section, drawn. */
export function configurationFromSection(s: ConfigurationSection): SheetConfiguration {
  const rows: SheetConfigRow[] = s.teams.map((t) => ({
    id: t.id,
    name: t.name,
    ...splitWork(t.work),
  }));
  if (s.next && !/^\[/.test(s.next.name.trim()))
    rows.push({ id: "next", name: s.next.name, ...splitWork(s.next.work), ghost: true });
  const links = STACK.map((item) =>
    link(item, s.teams.filter((t) => item.match.test(`${t.where} ${t.runs}`)).length)
  ).filter((l) => l.users > 0);
  return { rows, links: ordered(links) };
}

/**
 * A client page's board and phases, drawn — Trinny London's pitch, whose
 * proposal is not an arc (ADR-098 U2) and whose record is the pitch page's
 * own (`lib/arcs/content/trinny-london-offer.ts`). The rows are the three
 * phase plates (name + module); the links are the configured board's
 * "Where it runs" tools, and each is used by the whole configuration — the
 * board draws the tools as peers of one capability, never per phase.
 */
export function configurationFromBoard(
  board: BoardSection,
  phases: ListGroupsSection
): SheetConfiguration {
  const configured = board.states[1];
  const rows: SheetConfigRow[] = phases.groups.map((g) => ({
    id: g.id,
    name: g.blurb ?? g.label,
    ...(/^(M\d+)\b/.exec(g.label) ? { tag: /^(M\d+)\b/.exec(g.label)![1] } : {}),
  }));
  const links = configured.tools.items
    .map((t) => stackItem(t.id))
    .filter((item): item is StackItem => item !== undefined)
    .map((item) => link(item, rows.length));
  return { rows, links: ordered(links) };
}
