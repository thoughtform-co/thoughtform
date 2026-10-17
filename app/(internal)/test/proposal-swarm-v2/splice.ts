import type { ArcMenuItem } from "@/components/arcs/ArcShell";
import type { ArcSection } from "@/lib/arcs/types";

/**
 * Where the dossier goes: in place of the proposal's four job panels, which
 * sit between the second line ("Two brands") and the offer. Pure; the page
 * renders the two halves around the dossier and numbers the second half from
 * where the first left off, so every later section keeps the swarm page's
 * number (`ArcSectionRenderer`'s `indexOffset`).
 *
 * The record is not edited. The line keeps the owner's sentence but for one
 * word: with Loop among the cases, "other brands" no longer holds (owner,
 * 2026-10-17: all three cases together, the line adjusted, in this lab only).
 */

/** The jobs this lab takes out, by id and in order. */
export const JOB_IDS = ["job-production", "job-ops", "job-review", "job-strategy"] as const;
export const BEFORE_ID = "proof-brands";
export const AFTER_ID = "offer";

/** What the menu lists where the jobs were. Round 02 switches the cases in
 *  place, so it is the dossier itself ("The cases", a chapter of the page),
 *  and never both the dossier and a case inside it: nested elements cross the
 *  active band together and flicker. */
export interface DossierEntry {
  id: string;
  label: string;
  primary?: boolean;
}

/** The dossier's own menu entry. */
export const DOSSIER_ENTRY: DossierEntry = { id: "cases", label: "The cases", primary: true };

export interface Spliced {
  /** Sections drawn before the dossier (from the third on). */
  head: readonly ArcSection[];
  /** Sections drawn after it. */
  tail: readonly ArcSection[];
  /** `indexOffset` for `head` and for `tail`. */
  headOffset: number;
  tailOffset: number;
  menu: readonly ArcMenuItem[];
}

export const LINE = { pre: "How we've made brands", em: "self-sufficient with AI." } as const;

export function spliceCases(
  sections: readonly ArcSection[],
  drawn: number,
  cases: readonly DossierEntry[]
): Spliced {
  const at = sections.findIndex((s) => s.kind === "job");
  if (at < 0) throw new Error("proposal-swarm-v2: the proposal has no job panels to replace");
  let end = at;
  while (end < sections.length && sections[end].kind === "job") end += 1;
  const ids = sections.slice(at, end).map((s) => s.id);
  if (ids.length !== JOB_IDS.length || ids.some((id, i) => id !== JOB_IDS[i])) {
    throw new Error(`proposal-swarm-v2: the job run is ${ids.join(", ")}, not the four panels`);
  }
  if (sections[at - 1]?.id !== BEFORE_ID || sections[end]?.id !== AFTER_ID) {
    throw new Error(
      `proposal-swarm-v2: the jobs no longer sit between ${BEFORE_ID} and ${AFTER_ID}`
    );
  }
  if (at < drawn) throw new Error("proposal-swarm-v2: the jobs moved into the drawn opening");

  /* the line keeps its sentence but for "other"; its menu entry passes to
     what is put in the jobs' place */
  const relined = sections.map((s) =>
    s.id === BEFORE_ID && s.kind === "interstitial"
      ? ({ ...s, line: { ...LINE }, menuLabel: undefined, menuPrimary: undefined } as ArcSection)
      : s
  );

  const menu: ArcMenuItem[] = [];
  relined.forEach((s, i) => {
    if (i >= at && i < end) {
      if (i === at) {
        for (const c of cases) menu.push({ id: c.id, label: c.label, primary: c.primary });
      }
      return;
    }
    if (s.menuLabel) menu.push({ id: s.id, label: s.menuLabel, primary: s.menuPrimary });
  });

  return {
    head: relined.slice(drawn, at),
    tail: relined.slice(end),
    headOffset: drawn,
    tailOffset: end,
    menu,
  };
}
