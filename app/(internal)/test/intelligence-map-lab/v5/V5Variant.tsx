"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { CasefileChrome } from "../CasefileChrome";
import { WORKS } from "../imapData";
import { ConsoleField, type ConsoleView } from "./ConsoleField";
import { LEVELS, STREAMS, VIEWS, type Level, type View } from "./consoleFixture";

/**
 * V5Variant — ROUND 5, the three-level console, inside the real casefile chrome.
 *
 * ── URL CONTRACT ───────────────────────────────────────────────────────────
 *   ?v=5                (the default — reachable with no params at all)
 *   ?level=0|1|2        01 WORKSTREAMS · 02 CONFIGURATION · 03 OPERATION
 *   ?work=W01..W08      which workstream holds the master seat
 *   ?view=team|substrate|allocation   L1 only; ignored at L2/L3 by construction
 *   ?theme=light|dark · ?autoplay=0 · ?dev=0
 *
 * ⚠ An EXPLICIT `?level` disables the guided tour, the same rule v4 inherited
 * from his prototype: a deep link asks for one frame, and the tour would walk
 * away from it. That is what makes the screenshot recipe deterministic.
 */
export function V5Variant({
  initialLevel,
  initialWork,
  initialView,
  autoplay,
  showConsole,
}: {
  initialLevel: Level;
  initialWork: string;
  initialView: View;
  autoplay: boolean;
  showConsole: boolean;
}) {
  const [view, setView] = useState<ConsoleView>({
    level: initialLevel,
    work: initialWork,
    view: initialView,
  });
  const [fit, setFit] = useState<{ over: boolean; head: number; hint: number; field: number }>({
    over: false,
    head: 0,
    hint: 0,
    field: 0,
  });
  const vizRef = useRef<HTMLDivElement | null>(null);

  /** One writer for the URL, so the strip, the console and a reload agree. */
  const onView = useCallback((next: ConsoleView) => {
    setView(next);
    const url = new URL(window.location.href);
    url.searchParams.set("v", "5");
    url.searchParams.set("level", String(next.level));
    url.searchParams.set("work", next.work);
    /* A view is an L1 property. Writing it at L2/L3 would publish state the
       instrument does not have there. */
    if (next.level === 0) url.searchParams.set("view", next.view);
    else url.searchParams.delete("view");
    window.history.replaceState(null, "", url.toString());
  }, []);

  /* THE BUDGET METER: a screenshot must never flatter a composition that does
     not actually fit. Reds when the field's content exceeds its box. */
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
        <ConsoleField
          initial={{ level: initialLevel, work: initialWork, view: initialView }}
          autoplay={autoplay}
          onView={onView}
        />
      </CasefileChrome>

      {showConsole ? (
        <div className="iml-console" aria-label="Lab controls">
          <div className="iml-console__chips">
            <span className="iml-console__label">Level</span>
            {LEVELS.map((spec) => (
              <button
                type="button"
                key={spec.level}
                className="iml-console__chip"
                data-on={view.level === spec.level || undefined}
                onClick={() => go({ level: spec.level })}
              >
                {spec.ord} {spec.name}
              </button>
            ))}
            <span className="iml-console__label">View</span>
            {VIEWS.map((v) => (
              <button
                type="button"
                key={v.id}
                className="iml-console__chip"
                data-on={view.view === v.id || undefined}
                onClick={() => go({ level: 0, view: v.id })}
              >
                {v.id}
              </button>
            ))}
          </div>

          <div className="iml-console__chips">
            <span className="iml-console__label">Workstream</span>
            {WORKS.map((work) => (
              <button
                type="button"
                key={work.id}
                className="iml-console__chip"
                data-on={view.work === work.id || undefined}
                onClick={() => go({ work: work.id })}
                title={STREAMS[work.id].name}
              >
                {work.id}
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
            Round 5 · one architecture, three zoom levels. Wheel over the field or 1/2/3 to change
            level; click a chip to open it, click the master plate to zoom out; V cycles the L1
            views; ← → cycle workstreams; Esc zooms out.
          </span>
        </div>
      ) : null}
    </>
  );

  /* A dev-strip jump is a NAVIGATION: the console owns its own registry and
     remounting it from a URL is the only way to get a clean deterministic frame
     (and it pins the tour off, since `level` becomes explicit). */
  function go(next: Partial<ConsoleView>) {
    const merged = { ...view, ...next };
    const url = new URL(window.location.href);
    url.searchParams.set("v", "5");
    url.searchParams.set("level", String(merged.level));
    url.searchParams.set("work", merged.work);
    url.searchParams.set("view", merged.view);
    window.location.href = url.toString();
  }
}
