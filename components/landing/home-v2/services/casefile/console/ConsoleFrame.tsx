import type { HTMLAttributes, ReactNode, RefObject } from "react";

/**
 * THE CONSOLE FRAME — the casefile's right panel as ONE INSTRUMENT.
 *
 * Four directory rows, four kinds of evidence, one held device that changes
 * what it displays (ADR-064).
 *
 * ⚠ THE CHROME IS ONE PANEL NOW (owner, 2026-08-07 — "super clean with a
 * notch in the top-left"). The orbit ring and the outer bezel are DELETED:
 * the owner's mockup panel (`proof-page-blocks-left.html`, `.panel`) is a
 * single chamfered box — one hairline, one radial gold glow off the top
 * edge, one scanline, one opaque ground — and the three-line stack of
 * ellipse + bezel + console was reading as decoration around the evidence
 * rather than as the housing of it. What is left is that panel, in
 * `console.css`; the plates below are untouched.
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
 * generic foot" binds. ⚠ As of the owner's 2026-08-08 declutter NO plate
 * prints one — the map's reading sentence and the Studio sheets' captions
 * left last (the smoke asserts the absence on every row). The slot survives
 * as the frame's context mechanism, not as an invitation.
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
      {/* ⚠ THE ORBIT SVG AND THE `.fl-con__outer` BEZEL ARE DELETED (owner,
          2026-08-07). They were v18's rig — two ellipses in an 840×1050
          viewBox behind a second chamfered frame — and ADR-067 spent a whole
          pass proving `ry < 525` / `rx ≥ 420` so the arcs would stop cropping
          through the console's top edge. That bound is now moot rather than
          wrong: there is no ring to bound. If a future pass wants ambient
          arcs back, the arithmetic is in ADR-064 / ADR-067 and in the smoke
          case that used to read `ry` off these ellipses. */}
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
