/**
 * lib/musings/mastheadData — the musings masthead's record (ADR-119 U1).
 * Pure, three-free, no DOM.
 *
 * The owner, on the live read of ADR-119 (2026-09-22): _"the placement of the
 * hero one and the paragraphs is completely different from the services
 * section. The services section has the type of typography, font size, etc.,
 * that we want, so I'm not sure what went wrong here."_
 *
 * ⚠ **THE GRAMMAR IS COPIED, NEVER IMPORTED — AND `ServicesMasthead` COULD NOT
 * BE IMPORTED IF IT WERE WANTED.** It takes zero props, finds its own stage by
 * `closest(".services-stage")`, and every clock it reads is a `--svc-*`
 * channel written by a hook that does not run here; it is also ABSOLUTE inside
 * a pinned stage, where this head is in flow. The canonical in-flow copy of
 * that same grammar already exists — `components/arcs/ArcSectionHead.tsx` plus
 * `arcs.css`, whose own header names the original and whose sheet states the
 * law ("grammars COPIED, never imported") — and this is the third instance of
 * it, on a landing station.
 *
 * What is copied, rung for rung, from `services.css`'s `.services-masthead`:
 * the two-column split (title left, brief right, sharing one top line), the
 * designation labels hung above each block, the single gold state chip, the
 * coordinate stamps dropped under each block's foot, the two registration
 * crosses, the masked dot-grid lift, and the type ladder — PP Neue Montreal at
 * `clamp(26px, 3vw, 44px)` / 0.04em / 1.1 with the gold-washed text shadow,
 * the em line gold at `--weight-lit`, PT Mono 9.5px at the eyebrow rung and
 * 8px at the coord rung.
 *
 * ⚠ **THE TITLE IS AUTHORED UPPERCASE AND THE SHEET DECLARES NO
 * `text-transform`** — ADR-092's own recipe, and the reason the copy lives in
 * this module rather than being transformed in CSS: a `text-transform:
 * uppercase` on a PP Neue Montreal element is a finding the type ratchet
 * fails, and the services masthead's own strings are authored the same way
 * ("AI CAPABILITY / YOUR TEAM OWNS.").
 */

/** One line of the display title. `em` is the gold rung. */
export interface MastheadLine {
  text: string;
  em?: boolean;
}

export interface MastheadRecord {
  /** The eyebrow over the title, and the one over the brief. */
  desigTitle: string;
  desigBrief: string;
  /** The single gold survey element. */
  state: string;
  titleLines: MastheadLine[];
  brief: string;
}

/**
 * Deterministic decorative coordinate stamp.
 *
 * ⚠ COPIED from `components/arcs/chrome.tsx`'s `coordStamp`, which is where
 * this grammar's stamps come from — ten lines of FNV against a module that
 * also exports JSX and pulls `lib/arcs/types` onto whatever imports it. The
 * landing's import doctrine is what makes the copy the right call; the
 * arithmetic is identical and `musings-shelf.test.ts` pins it against the
 * original's published values.
 *
 * It is a HASH of the id, so the stamps are stable across SSR and hydration
 * and there is no `Math.random` anywhere near the head.
 */
export function coordStamp(seed: string, salt: number): string {
  let h = (2166136261 ^ salt) >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  const a = (h >>> 12) % 4096;
  const b = h % 4096;
  return `${String(a).padStart(4, "0")} / ${String(b).padStart(4, "0")}`;
}

/**
 * The record.
 *
 * ⚠ `NOTES FROM` / `THE PRACTICE.` is the owner's own title for this station,
 * split across the two lines the grammar carries with the em — and the gold
 * rung on the SECOND line, which is where the services masthead puts it.
 * ⚠ The brief letters no digit and makes no claim the station cannot show:
 * the cards under it are the notes.
 */
export const MUSINGS_MASTHEAD: MastheadRecord = {
  desigTitle: "MUS / TITLE · 01",
  desigBrief: "MUS / BRIEF · 02",
  state: "OPEN",
  titleLines: [{ text: "NOTES FROM" }, { text: "THE PRACTICE.", em: true }],
  brief:
    "Working notes from inside the engagements — what an intelligence layer is made of, and what it takes to keep one running.",
};

/** The display title as one readable string — the heading's accessible name. */
export const MUSINGS_TITLE_TEXT = MUSINGS_MASTHEAD.titleLines.map((l) => l.text).join(" ");

/** The two stamps, in the order the head prints them. */
export const MUSINGS_COORDS = [coordStamp("musings", 1), coordStamp("musings", 2)] as const;
