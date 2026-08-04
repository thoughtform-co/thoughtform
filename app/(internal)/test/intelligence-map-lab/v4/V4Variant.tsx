"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { CasefileChrome } from "../CasefileChrome";
import { RANGES, SUBSTRATES, WORKS } from "../imapData";
import { IntelligenceField, type FieldView } from "./IntelligenceField";

/**
 * V4Variant — ROUND 4, REV B, FROZEN.
 *
 * The cartesian/schematic instrument the owner approved as a KEEPER. Its
 * behaviour, its geometry and its URL contract are exactly what they were when he
 * signed off; the only change in the variant restructure is that this file now
 * mounts `CasefileChrome` instead of owning the chrome itself, and that the URL
 * carries `?v=4` alongside its own params.
 *
 * ── URL CONTRACT (unchanged) ───────────────────────────────────────────────
 *   ?v=4                required, since v5 is the default
 *   ?depth=0|1|2        which semantic range
 *   ?work=W01..W08      which work configuration holds the target
 *   ?substrate=S01..S06 which substrate holds the trace
 *   ?lens=team|allocation   the range-03 lens
 *   ?theme=light|dark · ?autoplay=0 · ?dev=0
 *
 * ⚠ An EXPLICIT `?depth` still disables autoplay, exactly as his prototype does:
 * a deep link is a request for a specific frame, and a guided read would walk
 * away from it. That is what makes the screenshot recipe deterministic.
 */
export function V4Variant({
  initialView,
  autoplay,
  showConsole,
}: {
  initialView: FieldView;
  autoplay: boolean;
  showConsole: boolean;
}) {
  const [view, setView] = useState<FieldView>(initialView);
  const [fit, setFit] = useState<{ over: boolean; head: number; hint: number; field: number }>({
    over: false,
    head: 0,
    hint: 0,
    field: 0,
  });
  const vizRef = useRef<HTMLDivElement | null>(null);

  /** One writer for the URL, so the strip, the field and a reload always agree. */
  const onView = useCallback((next: FieldView) => {
    setView(next);
    const url = new URL(window.location.href);
    url.searchParams.set("v", "4");
    url.searchParams.set("depth", String(next.depth));
    url.searchParams.set("work", next.work);
    url.searchParams.set("substrate", next.substrate);
    if (next.depth === 2) url.searchParams.set("lens", next.lens);
    else url.searchParams.delete("lens");
    window.history.replaceState(null, "", url.toString());
  }, []);

  /* THE BUDGET METER IS THE POINT: a screenshot must never flatter a composition
     that does not actually fit. A timeout, not rAF — fonts land after first
     layout and rAF is throttled to a standstill in a hidden pane. */
  useEffect(() => {
    const read = () => {
      const viz = vizRef.current;
      if (!viz) return;
      const head = viz.querySelector<HTMLElement>(".iml__head");
      const hint = viz.querySelector<HTMLElement>(".iml__hint");
      const field = viz.querySelector<HTMLElement>(".iml__field");
      if (!head || !hint || !field) return;
      setFit({
        over:
          field.scrollHeight - field.clientHeight > 1 || field.scrollWidth - field.clientWidth > 1,
        head: Math.round(head.getBoundingClientRect().height),
        hint: Math.round(hint.getBoundingClientRect().height),
        field: Math.round(field.getBoundingClientRect().height),
      });
    };
    read();
    const settle = window.setTimeout(read, 400);
    window.addEventListener("resize", read);
    return () => {
      window.clearTimeout(settle);
      window.removeEventListener("resize", read);
    };
  }, [view]);

  return (
    <>
      <CasefileChrome vizRef={vizRef}>
        <IntelligenceField initial={initialView} autoplay={autoplay} onView={onView} />
      </CasefileChrome>

      {showConsole ? (
        <div className="iml-console" aria-label="Lab controls">
          <div className="iml-console__chips">
            <span className="iml-console__label">Range</span>
            {RANGES.map((range) => (
              <button
                type="button"
                key={range.depth}
                className="iml-console__chip"
                data-on={view.depth === range.depth || undefined}
                onClick={() => go({ depth: range.depth })}
              >
                {range.ord} {range.name}
              </button>
            ))}
            <span className="iml-console__label">Lens</span>
            {(["team", "allocation"] as const).map((lens) => (
              <button
                type="button"
                key={lens}
                className="iml-console__chip"
                data-on={view.lens === lens || undefined}
                onClick={() => go({ depth: 2, lens })}
              >
                {lens}
              </button>
            ))}
          </div>

          <div className="iml-console__chips">
            <span className="iml-console__label">Work</span>
            {WORKS.map((work) => (
              <button
                type="button"
                key={work.id}
                className="iml-console__chip"
                data-on={view.work === work.id || undefined}
                onClick={() => go({ work: work.id })}
              >
                {work.id}
              </button>
            ))}
            <span className="iml-console__label">Trace</span>
            {SUBSTRATES.map((sub) => (
              <button
                type="button"
                key={sub.id}
                className="iml-console__chip"
                data-on={view.substrate === sub.id || undefined}
                onClick={() => go({ substrate: sub.id })}
              >
                {sub.id}
              </button>
            ))}
          </div>

          <div className="iml-console__chips">
            <span className="iml-console__label">Theme</span>
            {(["dark", "light"] as const).map((theme) => (
              <button
                type="button"
                key={theme}
                className="iml-console__chip"
                onClick={() => {
                  document.documentElement.dataset.theme = theme;
                }}
              >
                {theme}
              </button>
            ))}
            <span className="iml-console__meter" data-warn={fit.over || undefined}>
              {fit.over ? "Over" : "Fits"} · head {fit.head} · hint {fit.hint} · field {fit.field}
            </span>
          </div>

          <span className="iml-console__note">
            Round 4 rev B · the cartesian instrument (keeper). Wheel over the field, +/− or the
            right rail to change range; click a work or a substrate; ← → cycle works; L flips the
            lens; Esc zooms out; T flips theme.
          </span>
        </div>
      ) : null}
    </>
  );

  /* A dev-strip jump is a NAVIGATION, not a state write: the field owns its own
     registry and remounting it from a URL is the only way to get a clean
     deterministic frame (and it pins autoplay off, since `depth` is explicit). */
  function go(next: Partial<FieldView>) {
    const merged = { ...view, ...next };
    const url = new URL(window.location.href);
    url.searchParams.set("v", "4");
    url.searchParams.set("depth", String(merged.depth));
    url.searchParams.set("work", merged.work);
    url.searchParams.set("substrate", merged.substrate);
    url.searchParams.set("lens", merged.lens);
    window.location.href = url.toString();
  }
}
