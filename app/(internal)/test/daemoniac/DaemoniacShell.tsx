"use client";

// ═══════════════════════════════════════════════════════════════════
// DAEMONIAC LAB — the shell. Personal register look-dev: no production
// chrome, real tokens, both themes. The theme flip is a REAL attribute
// write on <html> with save/restore (the intelligence-config-lab
// pattern) so theme.css's parchment steps win exactly as they do in
// production.
// ═══════════════════════════════════════════════════════════════════

import { useEffect, useMemo, useRef, useState } from "react";

import { composeBind } from "@/lib/daemoniac/composeBind";

import { BindParticleField } from "./BindParticleField";
import { BindPlate } from "./BindPlate";
import { RECORD_SOURCES } from "./demoFleet";
import { SpecimenSheet } from "./SpecimenSheet";

type ViewMode = "plate" | "particles" | "overlay" | "specimen";
type LabTheme = "dark" | "light";

const SIZES = [360, 560, 760] as const;

const ALL_RECORDS = RECORD_SOURCES.flatMap((s) =>
  s.records.map((r) => ({ sourceId: s.id, sourceLabel: s.label, record: r }))
);

export function DaemoniacShell() {
  const [recordId, setRecordId] = useState(ALL_RECORDS[0].record.id);
  const [view, setView] = useState<ViewMode>("plate");
  const [theme, setTheme] = useState<LabTheme>("dark");
  const [size, setSize] = useState<(typeof SIZES)[number]>(560);
  const [showApparatus, setShowApparatus] = useState(true);
  const [progress, setProgress] = useState(1);
  const replayRaf = useRef(0);

  /* The INSCRIBE replay: ~2.4 s eased 0 → 1. A lab replay button is a
     click-driven clock; PRM jumps straight to the finished bind. */
  const inscribe = () => {
    window.cancelAnimationFrame(replayRaf.current);
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setProgress(1);
      return;
    }
    const t0 = performance.now();
    const DUR = 2400;
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / DUR);
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(eased);
      if (t < 1) replayRaf.current = window.requestAnimationFrame(step);
    };
    setProgress(0);
    replayRaf.current = window.requestAnimationFrame(step);
  };

  useEffect(() => () => window.cancelAnimationFrame(replayRaf.current), []);

  const active = ALL_RECORDS.find((e) => e.record.id === recordId) ?? ALL_RECORDS[0];
  const composition = useMemo(() => composeBind(active.record), [active.record]);

  /* Real attribute write, previous value restored on unmount. */
  useEffect(() => {
    const root = document.documentElement;
    const before = root.getAttribute("data-theme");
    root.setAttribute("data-theme", theme);
    return () => {
      if (before) root.setAttribute("data-theme", before);
      else root.removeAttribute("data-theme");
    };
  }, [theme]);

  return (
    <div className="dae-lab">
      <aside className="dae-lab__rail">
        <h1 className="dae-lab__title">DAEMONIAC</h1>
        <p className="dae-lab__sub">THE BIND IS A READING</p>

        {RECORD_SOURCES.map((source) => (
          <section key={source.id} className="dae-lab__group">
            <h2 className="dae-lab__head">{source.label}</h2>
            {source.records.map((r) => (
              <button
                key={r.id}
                type="button"
                className="dae-lab__row"
                data-active={r.id === recordId || undefined}
                onClick={() => setRecordId(r.id)}
              >
                <span className="dae-lab__row-name">{r.name}</span>
                <span className="dae-lab__row-meta">
                  {r.class} · {r.autonomy}
                </span>
              </button>
            ))}
          </section>
        ))}

        <section className="dae-lab__group">
          <h2 className="dae-lab__head">VIEW</h2>
          <div className="dae-lab__set">
            {(["plate", "particles", "overlay", "specimen"] as const).map((v) => (
              <button
                key={v}
                type="button"
                className="dae-lab__chip"
                data-active={view === v || undefined}
                onClick={() => setView(v)}
              >
                {v.toUpperCase()}
              </button>
            ))}
          </div>
        </section>

        <section className="dae-lab__group">
          <h2 className="dae-lab__head">GROUND</h2>
          <div className="dae-lab__set">
            {(["dark", "light"] as const).map((t) => (
              <button
                key={t}
                type="button"
                className="dae-lab__chip"
                data-active={theme === t || undefined}
                onClick={() => setTheme(t)}
              >
                {t === "dark" ? "VOID" : "PARCHMENT"}
              </button>
            ))}
          </div>
        </section>

        <section className="dae-lab__group">
          <h2 className="dae-lab__head">SIZE</h2>
          <div className="dae-lab__set">
            {SIZES.map((s) => (
              <button
                key={s}
                type="button"
                className="dae-lab__chip"
                data-active={size === s || undefined}
                onClick={() => setSize(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </section>

        <section className="dae-lab__group">
          <h2 className="dae-lab__head">APPARATUS</h2>
          <div className="dae-lab__set">
            <button
              type="button"
              className="dae-lab__chip"
              data-active={showApparatus || undefined}
              onClick={() => setShowApparatus((v) => !v)}
            >
              {showApparatus ? "ANNOTATED" : "BARE"}
            </button>
          </div>
        </section>

        {(view === "particles" || view === "overlay") && (
          <section className="dae-lab__group">
            <h2 className="dae-lab__head">INSCRIPTION</h2>
            <input
              type="range"
              className="dae-lab__scrub"
              min={0}
              max={100}
              value={Math.round(progress * 100)}
              onChange={(e) => setProgress(Number(e.target.value) / 100)}
              aria-label="Inscription progress"
            />
            <div className="dae-lab__set">
              <button type="button" className="dae-lab__chip" onClick={inscribe}>
                INSCRIBE
              </button>
            </div>
          </section>
        )}
      </aside>

      <main className="dae-lab__stage">
        {view !== "specimen" && (
          <div className="dae-lab__plate" style={{ width: size, height: size }}>
            {view !== "particles" && (
              <BindPlate
                composition={composition}
                showApparatus={showApparatus}
                className={view === "overlay" ? "dae-plate--under" : undefined}
              />
            )}
            {(view === "particles" || view === "overlay") && (
              <BindParticleField composition={composition} progress={progress} theme={theme} />
            )}
          </div>
        )}
        {view === "specimen" && (
          <SpecimenSheet records={ALL_RECORDS.map((e) => e.record)} active={active.record} />
        )}
      </main>
    </div>
  );
}
