import type { HTMLAttributes, ReactNode, RefObject } from "react";

/**
 * THE CONSOLE FRAME — the casefile's right panel as ONE INSTRUMENT.
 *
 * Four directory rows, four kinds of evidence, one held device that changes
 * what it displays (ADR-064). The chrome is the Intelligence Map's, lifted
 * out of `map/pda/PdaConsole.tsx` unchanged: an orbit ring behind, a
 * chamfered outer frame, a chamfered opaque console with a scanline over it.
 * Both frames bleed past the plate's edges and are clipped by it, which is
 * what makes the console read as an object sitting IN something rather than
 * as a box drawn on the page.
 *
 * ── What it does NOT do ─────────────────────────────────────────────────
 * It does not touch the content. Each plate keeps its own interior — the
 * map's reading rail and SVG, the films' 2-tab rail, the tools' 50/50 grid —
 * because those were designed against their own material and the ADR-056 U9
 * pass in particular was hand-tuned down to a 760px-tall viewport. The frame
 * is the box, not the layout.
 *
 * And it does not filter imagery. The gold lives in the chrome; the evidence
 * keeps the colour it was made in (ADR-056 U5, owner). That split — chrome
 * vs evidence, not photo vs screenshot — is the whole reason a shared frame
 * is the right answer to "make the rows feel uniform".
 *
 * ── Slots ───────────────────────────────────────────────────────────────
 * `rail` and `foot` are rendered as DIRECT flex children of the console, so
 * a caller's rail keeps its own flex sizing rather than inheriting a
 * wrapper's. That is load-bearing for the map, whose rail is
 * `flex: 0 0 clamp(32px, 7%, 44px)` — a percentage of the CONSOLE's height,
 * which an intermediate auto-height wrapper would resolve to nothing.
 *
 * The foot is optional and stays that way: ADR-056's "the right panel has no
 * generic foot" binds. The map prints a sentence that changes with the
 * reading; a row with nothing to say prints nothing.
 */

interface Props extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** A tab strip or reading rail, seated on the console's top edge. */
  rail?: ReactNode;
  /** A centred caption. Omit unless the row has something to say. */
  foot?: ReactNode;
  /** Extra classes for the plate root — the kind's own vocabulary hook. */
  className?: string;
  /**
   * The plate root, for a plate that binds native listeners on it.
   *
   * ⚠ KEYS AND WHEEL BIND ON THE PLATE, NEVER `document` — the corridor has
   * its own key handling, and React registers `wheel` as passive on its root
   * container, so a plate that must `preventDefault` needs the element.
   */
  rootRef?: RefObject<HTMLDivElement | null>;
  /**
   * A small-screen substitute, rendered as a SIBLING of the console rather
   * than inside it — so a plate can hide the console below the desktop gate
   * and show something else in the same slot. Only the map has one today (a
   * stream index); a plate without one lets `console.css` unwrap the console
   * into ordinary flow instead, or its content vanishes with the chrome.
   */
  fallback?: ReactNode;
}

export function ConsoleFrame({
  children,
  rail,
  foot,
  className,
  rootRef,
  fallback,
  ...rest
}: Props) {
  return (
    <div className={className ? `fl-con ${className}` : "fl-con"} ref={rootRef} {...rest}>
      {/* v18's rig is 840x1050 inside a 1160x1230 orbit space at offset
          160/90 — so the crop IS the bleed, and the element itself never
          overhangs its box. */}
      <svg
        className="fl-con__orbit"
        viewBox="160 90 840 1050"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {/* ⚠ AN ARC MAY LEAVE THIS BOX SIDEWAYS, NEVER THROUGH THE TOP OR
            BOTTOM — and the bound is arithmetic, so it holds at every
            viewport. With `preserveAspectRatio="none"` the ellipses map
            linearly onto `.fl-con`, so the screen radii are
            `RX = rx·W/840` and `RY = ry·H/1050` against a half-box of `W/2`
            and `H/2`. Staying inside vertically is therefore `ry < 525` at
            ANY height, and exiting sideways is `rx ≥ 420` at any width.

            The first ellipse used to be `rx 410 ry 600`: 600 overshot the top
            by 38px, so the arc was cropped, re-entered at the top edge, and
            was swallowed again by the opaque console 7px below — leaving two
            14px stubs at 30.8° in the gap band. At four stations they landed
            on the tab dividers (measured: one straddling x=154, the other
            2.8px off x=447), which is why they read as diagonals coming out
            of the tabs. The second ellipse always satisfied both bounds,
            which is why only one pair ever appeared. */}
        <ellipse cx="580" cy="615" rx="470" ry="500" />
        <ellipse cx="580" cy="615" rx="560" ry="470" />
      </svg>
      <i className="fl-con__outer" aria-hidden="true" />

      <div className="fl-con__console">
        {rail}
        <div className="fl-con__mid">
          <div className="fl-con__field">{children}</div>
        </div>
        {foot ? <div className="fl-con__foot">{foot}</div> : null}
      </div>
      {fallback}
    </div>
  );
}
