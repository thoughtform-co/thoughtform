/**
 * The ten section marks — 16px stroke geometry, one per cluster seat.
 *
 * ⚠ THIS RE-OPENS A QUESTION THAT WAS ANSWERED "NO" ONCE. `glyphs.ts` retired
 * the v2 station silhouettes with a blunt verdict: at 14×10 every clip-path
 * cut collapsed to the same rectangle, four of six were still
 * indistinguishable re-cut at 18×12, and "this codebase has deliberately
 * never had an icon vocabulary".
 *
 * What is different here, and why it is worth a second look rather than a
 * repeat: that set was a BORDERED BOX with its outline notched, so every mark
 * shared the same silhouette and differed only in where a corner was bitten
 * off. These are open stroke figures on an empty field — the difference
 * between marks is the whole drawing, not a notch in a shared rectangle. The
 * box was the problem, not the drawing.
 *
 * What is NOT settled is the second half of that verdict — whether these read
 * as instrument geometry or as app icons. `contact` (an up arrow over a
 * baseline) and `about` (a diamond over a plinth) are the two most at risk;
 * `hero`, `encode` and `services` read most HUD-native. The `nExplain` layer
 * prints every name at once, which is the fastest way to settle it: if you
 * need the labels to tell them apart, the set has failed the same way v2 did.
 *
 * `fill="none" stroke="currentColor"` throughout, so the cluster's three
 * states colour the marks and the theme flips them for free.
 */

import type { ReactElement } from "react";

/** 24-unit viewBox, rendered at 16px — the mockup's proportions. */
const VB = "0 0 24 24";
const SW = 1.5;

function Mark({ children }: { children: React.ReactNode }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox={VB}
      fill="none"
      stroke="currentColor"
      strokeWidth={SW}
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

/**
 * Keyed by section id. A missing key renders nothing rather than throwing:
 * a new readout row should light up an unglyphed seat, not blank the page.
 *
 * ⚠ NOT EVERY KEY IS SEATED. The live roster (ADR-059 U3) is `hero` ·
 * `thesis` · `arc` · `proof` · `services` · `about` top-left and `contact`
 * bottom-right. `navigate` / `encode` / `build` are drawn but unseated —
 * the Arc took one mark for all three — and so is `practice`. They are kept
 * because they are still real beats and a real station, so a roster change
 * does not have to re-draw them; `encode`'s bracket vocabulary is also what
 * the settings corner's session mark borrows.
 */
export const SECTION_GLYPHS: Readonly<Record<string, ReactElement>> = {
  // ── The journey, top-left ─────────────────────────────────────────────
  /** A reticle — the window, sighted. */
  hero: (
    <Mark>
      <path d="M12 5 19 12 12 19 5 12Z" />
      <path d="M12 1v2.5M12 20.5V23M1 12h2.5M20.5 12H23" />
    </Mark>
  ),
  /** A trace — the claim, as a signal on a scope. */
  thesis: (
    <Mark>
      <path d="M2 13h4l2.5-7 3.5 12 3-9.5 2 4.5h5" />
    </Mark>
  ),
  /**
   * Three chevrons — the Arc's three beats as one advance.
   *
   * ⚠ A SEQUENCE, NOT A LOOP, and that is a compromise worth knowing about.
   * The Arc is a flywheel (navigate → encode → build → navigate), and a
   * loop is what it means — but the shape law bans circles, every other
   * mark in this set is straight-line, and a closed cycle with an arrowhead
   * is exactly the kind of detail the v2 silhouettes proved dies at this
   * size. Three chevrons say "a run of three", which is at least what a
   * reader actually scrolls. Open for the same judgement as the rest of the
   * set.
   */
  arc: (
    <Mark>
      <path d="M4 7l4 5-4 5M10 7l4 5-4 5M16 7l4 5-4 5" />
    </Mark>
  ),
  /** A compass needle. Unseated since U3 — the Arc carries all three beats. */
  navigate: (
    <Mark>
      <path d="M12 3l4.5 14.5L12 14l-4.5 3.5Z" />
      <path d="M7 21h10" />
    </Mark>
  ),
  /** Registration brackets closing on a lattice — judgment, crystallised. */
  encode: (
    <Mark>
      <path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5" />
      <path
        fill="currentColor"
        stroke="none"
        d="M9 9h2.4v2.4H9zM12.8 9h2.4v2.4h-2.4zM9 12.8h2.4v2.4H9zM12.8 12.8h2.4v2.4h-2.4z"
      />
    </Mark>
  ),
  /** Offset strata — the layer, built on. */
  build: (
    <Mark>
      <path d="M7 6.5h13M4 12h13M7 17.5h13" />
    </Mark>
  ),

  // ── Dock ──────────────────────────────────────────────────────────────
  /** Stacked files — the casefile. */
  proof: (
    <Mark>
      <path d="M8.5 7.5v-2h4l1.2 1.5H19v2M6.2 11V9h4l1.2 1.5h6.4v2M4 20.5v-6h4.2l1.2 1.5H20v4.5z" />
    </Mark>
  ),
  /** Solid stubs running into dashed extensions — the offer's plate cluster. */
  services: (
    <Mark>
      <path d="M4 7h3M4 12h3M4 17h3" />
      <path strokeDasharray="1 3" d="M10 7h10M10 12h10M10 17h10" />
    </Mark>
  ),
  /** A mark above a plinth — the navigator. */
  about: (
    <Mark>
      <path d="M12 4l3.2 3.2L12 10.4 8.8 7.2Z" />
      <path d="M5 20v-1.6l4.4-4.4h5.2L19 18.4V20" />
    </Mark>
  ),
  /** A spine with its markers — the through-line, beats on one line
   *  (ADR-074). The lower diamond is filled: the line has been walked. */
  voidwalker: (
    <Mark>
      <path d="M12 2.5v19" />
      <path d="M12 6.2l2.3 2.3L12 10.8 9.7 8.5Z" />
      <path d="M12 13.8l2.3 2.3L12 18.4l-2.3-2.3Z" fill="currentColor" />
    </Mark>
  ),
  /** A standard on a mast — dispatches from the practice. */
  practice: (
    <Mark>
      <path d="M7 2.5v19" />
      <path d="M7 4.5h10.5l-3 3.5 3 3.5H7" />
    </Mark>
  ),
  /** Transmit. */
  contact: (
    <Mark>
      <path d="M12 19V6M7.5 10.5 12 6l4.5 4.5M4.5 21.5h15" />
    </Mark>
  ),
};
