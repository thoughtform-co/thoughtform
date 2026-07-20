"use client";

import { useEffect, useRef } from "react";

/**
 * AnchorHorizonLayer — the lab-owned SHARED HORIZON chrome.
 *
 * All four routes hang a rule that spans RAIL TO RAIL, so the top-left H1
 * and the top-right paragraph stop reading as two disconnected floats and
 * start sharing one doubly-anchored horizon (the tmux/Bloomberg statusline
 * and avionics annunciator grammar).
 *
 * The horizontal frame geometry comes from the REAL tokens (`--hud-margin`
 * for the rail rules, `--band-top` for the strip), so the chrome is exact by
 * construction. The VERTICAL seats and the per-column lock extents can only
 * come from the live text, so this layer measures the masthead and publishes
 * the result as px vars.
 *
 * Those vars go on the LAB ROOT (`.sal`), not on this layer's own element.
 * Custom properties inherit downward only, and two consumers sit OUTSIDE this
 * subtree: `--sal-baseline-y` is composed on `.sal` (so the seat toggle can
 * switch it), and V1's intro re-seat targets `.services-masthead__intro`
 * inside `.sal-stationbox`. Publishing on the layer would leave both reading
 * the `50vh` fallback. `.sal` is lab-owned, so this still touches no
 * production node — the layer remains a pure reader of `.services-masthead`.
 */

/** Ascent as a fraction of font-size — good enough for PP Neue Montreal and
 *  the mono faces; residual error is what the console's NUDGE knob absorbs. */
const ASCENT_RATIO = 0.78;

/** Baseline of an element's FIRST line, in viewport px.
 *  A line box of height `lh` centres the `fs` em box, and the baseline sits
 *  one ascent below that em box's top. */
function firstBaseline(el: Element): number {
  const rect = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  const fs = Number.parseFloat(cs.fontSize) || 16;
  const lhRaw = Number.parseFloat(cs.lineHeight);
  const lh = Number.isFinite(lhRaw) ? lhRaw : fs * 1.2;
  return rect.top + (lh - fs) / 2 + fs * ASCENT_RATIO;
}

interface AnchorHorizonLayerProps {
  variant: string;
}

export function AnchorHorizonLayer({ variant }: AnchorHorizonLayerProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current?.closest<HTMLElement>(".sal");
    if (!root) return;

    const measure = () => {
      const lead = document.querySelector<HTMLElement>(".services-masthead__lead");
      const intro = document.querySelector<HTMLElement>(".services-masthead__intro");
      if (!lead || !intro) return;

      // The title-line spans are display:block (they fill the column), so the
      // TEXT extent comes from the inner inline span each one wraps.
      const lines = Array.from(
        lead.querySelectorAll<HTMLElement>(".services-masthead__title-line")
      );
      const textSpans = lines
        .map((l) => l.querySelector<HTMLElement>("span:not(.services-masthead__cursor)"))
        .filter((s): s is HTMLElement => Boolean(s));
      if (!lines.length || !textSpans.length) return;

      const spanRects = textSpans.map((s) => s.getBoundingClientRect());
      const leadL = Math.min(...spanRects.map((r) => r.left));
      const leadR = Math.max(...spanRects.map((r) => r.right));
      const introRect = intro.getBoundingClientRect();

      const set = (name: string, px: number) => root.style.setProperty(name, `${px.toFixed(2)}px`);

      set("--sal-lead-l", leadL);
      set("--sal-lead-r", leadR);
      set("--sal-line1-l", spanRects[0].left);
      set("--sal-line1-r", spanRects[0].right);
      set("--sal-intro-l", introRect.left);
      set("--sal-intro-r", introRect.right);
      set("--sal-line1-bottom", firstBaseline(lines[0]));
      set("--sal-line2-bottom", firstBaseline(lines[lines.length - 1]));
      set("--sal-intro-line1-bottom", firstBaseline(intro));

      // Block FEET (V4). A stem has to fall from the bottom of the block it
      // belongs to, not from its first baseline — the intro's first line sits
      // ~66px above the title's second, so first-baseline stems come out
      // 76px tall on one column and 10px on the other and read as brackets
      // flanking the paragraph rather than legs standing on a datum.
      set("--sal-lead-bottom", lead.getBoundingClientRect().bottom);
      set("--sal-intro-bottom", introRect.bottom);
    };

    measure();

    // The masthead's decode/typewriter mutates text nodes, so ResizeObserver
    // on the columns catches reflow; fonts.ready catches the FOUT reflow that
    // would otherwise leave the chrome seated against fallback metrics.
    const ro = new ResizeObserver(measure);
    const lead = document.querySelector(".services-masthead__lead");
    const intro = document.querySelector(".services-masthead__intro");
    if (lead) ro.observe(lead);
    if (intro) ro.observe(intro);

    window.addEventListener("resize", measure);
    document.fonts?.ready.then(measure).catch(() => {});
    // The reveal replays over ~0.9s; re-measure across it so the chrome
    // tracks the growing text rather than snapping at the end.
    const settle = window.setInterval(measure, 120);
    const stopSettle = window.setTimeout(() => window.clearInterval(settle), 2400);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
      window.clearInterval(settle);
      window.clearTimeout(stopSettle);
    };
  }, [variant]);

  return (
    <div ref={rootRef} className="sal-anchor" aria-hidden="true">
      {variant === "v1" && (
        <>
          <i className="sal-bar" />
          <i className="sal-bar__lock sal-bar__lock--lead" />
          <i className="sal-bar__lock sal-bar__lock--intro" />
          <span className="sal-cap sal-cap--l">◀ 04 / SERVICES</span>
          <span className="sal-cap sal-cap--r">SRC BUS ▶</span>
        </>
      )}

      {variant === "v2" && (
        <>
          <i className="sal-strip" />
          <span className="sal-strip__label sal-strip__label--l">SECTION 04</span>
          <span className="sal-strip__label sal-strip__label--c">SERVICES</span>
          <span className="sal-strip__label sal-strip__label--r">SRC BUS</span>
        </>
      )}

      {variant === "v3" && (
        <>
          <i className="sal-seg sal-seg--l" />
          <i className="sal-seg sal-seg--m" />
          <i className="sal-seg sal-seg--r" />
        </>
      )}

      {variant === "v4" && (
        <>
          <i className="sal-bar sal-bar--faint" />
          <i className="sal-foot sal-foot--lead-l" />
          <i className="sal-foot sal-foot--lead-r" />
          <i className="sal-foot sal-foot--intro-l" />
          <i className="sal-foot sal-foot--intro-r" />
        </>
      )}
    </div>
  );
}
