"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ProofDossier } from "@/components/landing/home-v2/services/dossier/ProofDossier";

import { StageBed } from "./StageBed";
import { buildDossierContent, type StatSet } from "./dossierLabData";
import { PDL_VARIANTS } from "./variants";

interface ShellProps {
  hudHtml: string;
  bodyClass: string;
}

/** Mark dim the bed starts at — the value the production constant will
 *  copy if the owner leaves it alone. */
const DEFAULT_MARK_DIM = 0.45;

/**
 * ProofDossierLabShell — lab state, the injected HUD frame, and the console.
 *
 * Deep-link state (`?v=` cut, `?stats=`, `?still=`, `?console=`) is read in
 * a MOUNT EFFECT and written back through `history.replaceState` — never
 * `useSearchParams`, which forces a CSR bailout of the whole route (the
 * section-menu / anchor / card-face lab convention).
 *
 * The window under judgement is the PRODUCTION component. Nothing here is a
 * lab fork of it: the shell only supplies content, two presentation knobs,
 * and the stage clock — the same three things `ServicesStage` will supply.
 */
export function ProofDossierLabShell({ hudHtml, bodyClass }: ShellProps) {
  const [variantIdx, setVariantIdx] = useState(0);
  const [statSet, setStatSet] = useState<StatSet>("impact");
  const [still, setStill] = useState(true);
  const [markDim, setMarkDim] = useState(DEFAULT_MARK_DIM);
  const [open, setOpen] = useState(true);
  const [box, setBox] = useState<{ w: number; h: number; budget: number }>({
    w: 0,
    h: 0,
    budget: 0,
  });
  const stageRef = useRef<HTMLDivElement | null>(null);
  const winRef = useRef<HTMLDivElement | null>(null);

  // Adopt deep-linked state AFTER mount (SSR renders the defaults; reading
  // location in the initialiser would mismatch hydration).
  //
  // `react-hooks/set-state-in-effect` flags the writes below: this is the
  // sanctioned exception — the URL IS the external system being subscribed
  // to, it is read exactly once per mount, and the alternative
  // (`useSearchParams`) forces a CSR bailout of the whole route.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const v = q.get("v");
    if (v) {
      const byId = PDL_VARIANTS.findIndex((a) => a.id === v);
      if (byId >= 0) setVariantIdx(byId);
      else {
        const n = Number(v);
        if (Number.isFinite(n) && n >= 0 && n < PDL_VARIANTS.length) setVariantIdx(n);
      }
    }
    if (q.get("stats") === "shipped") setStatSet("shipped");
    if (q.get("still") === "0") setStill(false);
    if (q.get("console") === "0") setOpen(false);
    const dim = Number(q.get("dim"));
    if (Number.isFinite(dim) && dim >= 0 && dim <= 1) setMarkDim(dim);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const commit = useCallback(
    (next: { variantIdx?: number; statSet?: StatSet; still?: boolean }) => {
      const v = next.variantIdx ?? variantIdx;
      const s = next.statSet ?? statSet;
      const st = next.still ?? still;
      if (next.variantIdx !== undefined) setVariantIdx(next.variantIdx);
      if (next.statSet !== undefined) setStatSet(next.statSet);
      if (next.still !== undefined) setStill(next.still);
      const url = new URL(window.location.href);
      url.searchParams.set("v", PDL_VARIANTS[v].id);
      if (s === "shipped") url.searchParams.set("stats", "shipped");
      else url.searchParams.delete("stats");
      if (st) url.searchParams.delete("still");
      else url.searchParams.set("still", "0");
      window.history.replaceState(null, "", url.toString());
    },
    [variantIdx, statSet, still]
  );

  /**
   * Replay the reveal by re-driving the stage clock: drop below the
   * controller's re-arm floor, then cross its threshold. Both are inline
   * style writes, which is exactly what the dossier's MutationObserver
   * listens for.
   *
   * Spaced by a TIMEOUT, not rAF: the two writes must land as separate
   * mutation records (synchronous writes to one property coalesce), and
   * rAF is throttled to a standstill in hidden documents — a rAF-spaced
   * replay fired while the pane is hidden strands the window blank.
   */
  const replay = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    stage.style.setProperty("--svc-proof-in", "0");
    window.setTimeout(() => {
      stage.style.setProperty("--svc-proof-in", "1");
    }, 60);
  }, []);

  /** Height meter — the direct instrument for the 72svh budget. */
  useEffect(() => {
    const read = () => {
      const el = winRef.current?.querySelector<HTMLElement>(".svc-dossier__win");
      if (!el) return;
      setBox({
        w: Math.round(el.clientWidth),
        h: Math.round(el.offsetHeight),
        budget: Math.round(window.innerHeight * 0.72),
      });
    };
    read();
    const ro = new ResizeObserver(read);
    const el = winRef.current;
    if (el) ro.observe(el);
    window.addEventListener("resize", read);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", read);
    };
  }, [variantIdx, statSet]);

  const variant = PDL_VARIANTS[variantIdx];
  const content = buildDossierContent(statSet);
  const over = box.budget > 0 && box.h > box.budget;

  return (
    <main className={`pdl home-v2-root ${bodyClass}`} data-theme="dark" data-variant={variant.id}>
      {/* The real HUD chrome — rails, 13-tick ladders, corner brackets,
          wordmark — so the window is judged inside the actual frame. */}
      <div
        className="pdl__hud home-v2-hud-root"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: hudHtml }}
      />

      {/* Reproduces `.stations`' content box: `--rail-inset` is defined as
          `--band-margin − --hud-content-inset`, i.e. it assumes the content
          box has already eaten one inset. Without this the window's
          band-relative width resolves against the wrong column. */}
      <div className="pdl-stationbox" ref={winRef}>
        <StageBed markDim={markDim} still={still} stageRef={stageRef}>
          <ProofDossier content={content} cascade={variant.cascade} density={variant.density} />
        </StageBed>
      </div>

      {/* ── Lab console ─────────────────────────────────────────────── */}
      <div
        className="pdl-console"
        data-open={open || undefined}
        aria-label="Proof dossier lab controls"
      >
        <div className="pdl-chips" role="tablist" aria-label="Dossier cuts">
          {PDL_VARIANTS.map((a, i) => (
            <button
              key={a.id}
              type="button"
              role="tab"
              className="pdl-chip"
              data-on={i === variantIdx || undefined}
              aria-selected={i === variantIdx}
              onClick={() => commit({ variantIdx: i })}
            >
              {a.label}
            </button>
          ))}
          <button
            type="button"
            className="pdl-chip pdl-chip--caret"
            aria-expanded={open}
            aria-label={open ? "Collapse console" : "Expand console"}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? "▾" : "▴"}
          </button>
        </div>

        {open ? (
          <>
            <p className="pdl-thesis">{variant.thesis}</p>
            <p className="pdl-prov">
              <span className="pdl-prov__diamond" aria-hidden="true" />
              {variant.provenance}
            </p>

            <div className="pdl-toggles">
              <button type="button" className="pdl-toggle" onClick={replay}>
                <i className="pdl-toggle__led" aria-hidden="true" />
                REPLAY
              </button>
              <button
                type="button"
                className="pdl-toggle"
                data-on={statSet === "impact" || undefined}
                aria-pressed={statSet === "impact"}
                onClick={() => commit({ statSet: statSet === "impact" ? "shipped" : "impact" })}
              >
                <i className="pdl-toggle__led" aria-hidden="true" />
                {statSet === "impact" ? "IMPACT" : "SHIPPED"} STATS
              </button>
              <button
                type="button"
                className="pdl-toggle"
                data-on={still || undefined}
                aria-pressed={still}
                onClick={() => commit({ still: !still })}
              >
                <i className="pdl-toggle__led" aria-hidden="true" />
                MARK {still ? "STILL" : "GLOW"}
              </button>
            </div>

            <label className="pdl-field">
              <span className="pdl-field__label">MARK DIM · {markDim.toFixed(2)}</span>
              <input
                className="pdl-range"
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={markDim}
                onChange={(e) => setMarkDim(Number(e.target.value))}
              />
            </label>

            <span className="pdl-meter" data-warn={over || undefined}>
              WINDOW · {box.w} × {box.h} / {box.budget}
              {over ? " · OVER" : ""}
            </span>
          </>
        ) : null}
      </div>

      <p className="pdl-gate-warn">
        Widen to ≥1101×760 — the dossier is judged against the desktop band.
      </p>
    </main>
  );
}
