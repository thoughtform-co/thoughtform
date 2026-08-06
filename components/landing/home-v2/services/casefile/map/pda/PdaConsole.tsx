"use client";

import { useCallback, useMemo, useState } from "react";

import type { CaseMapDistrict, CaseMapShape, CaseMapWork } from "@/lib/cases/types";

import { VH, VW, ViewConfiguration, ViewSubstrate, ViewWork } from "./PdaViews";
import { type PdaView, crossing, footCopy, pdaTotals, selectWorks } from "./pdaRecord";

/**
 * THE WORK-TO-INTELLIGENCE MAP, as a held instrument.
 *
 * A faithful port of the owner's `thoughtform-intelligence-map-v18.html` into
 * the casefile's right panel. The chrome is the point as much as the drawing:
 * an orbit ring behind, a chamfered outer frame, a chamfered console with a
 * gold badge in its head, a depth rail down the left, a scan sweep on every
 * view change, and a centred foot that says what the reader is looking at.
 *
 * ── Three readings, direct access, any order ─────────────────────────────
 * The rail is the navigation. It is not a tab strip: a tab strip is a web
 * control, and this is an instrument changing what it displays. `1` `2` `3`
 * select and `Escape` returns to the work.
 *
 * ── Two clocks, and only one of them replays ─────────────────────────────
 * A VIEW CHANGE runs the entrance — the scan sweeps, cartridges pop in, wires
 * draw, tongues seat. A HOVER must not: re-running the arrival on every
 * pointer move is the difference between an instrument and a toy. `still`
 * carries that distinction into the views, which drop their animation classes
 * when it is set, and `viewTick` is what re-keys the sweep so it plays once
 * per change rather than once per render.
 *
 * ── Keys are bound on the PLATE, never `document` ────────────────────────
 * The corridor has its own key handling, and React's synthetic events reach
 * this node from whatever descendant has focus.
 *
 * ⚠ POINTER OPT-IN. `.fl-pda` is an `auto` island on a host that is
 * `pointer-events: none`, and it stays scoped here — lifting it to the host
 * puts a full-bleed catcher over the ring's hit areas at z 4
 * (`.claude/rules/proof.md`).
 */

interface Props {
  shapes: readonly CaseMapShape[];
  districts: readonly CaseMapDistrict[];
  works: readonly CaseMapWork[];
  /** Draw against the approved envelope — a STATUS, never an amount. */
  envelope: "WITHIN" | "AT" | "OVER";
  /** The snapshot date printed in the head. */
  snap?: string;
}

export function PdaConsole({ shapes, districts, works, envelope, snap = "08·2026" }: Props) {
  const shown = useMemo(() => selectWorks(districts, works), [districts, works]);
  const totals = useMemo(() => pdaTotals(shapes, districts, works), [shapes, districts, works]);
  const cross = useMemo(
    () => crossing(shapes, districts, works, shown),
    [shapes, districts, works, shown]
  );

  const [view, setView] = useState<PdaView>(1);
  const [selectedId, setSelectedId] = useState(shown[0]?.id ?? "");
  const [hover, setHover] = useState<string | null>(null);
  const [lit, setLit] = useState<string | null>(null);
  /** Bumped on every view change; re-keys the sweep so it plays once. */
  const [viewTick, setViewTick] = useState(0);
  /** True once the reader has moved the pointer inside the current view. */
  const [still, setStill] = useState(false);

  const selected = shown.find((w) => w.id === selectedId) ?? shown[0];

  const go = useCallback((next: PdaView) => {
    setView(next);
    setHover(null);
    setLit(null);
    setStill(false);
    setViewTick((t) => t + 1);
  }, []);

  const open = useCallback((id: string) => {
    setSelectedId(id);
    setHover(null);
    setLit(null);
    setStill(false);
    setView(2);
    setViewTick((t) => t + 1);
  }, []);

  /* A hover repaints WITHOUT replaying the entrance. */
  const hoverWork = useCallback((id: string | null) => {
    setStill(true);
    setHover(id);
  }, []);
  const hoverPart = useCallback((k: string | null) => {
    setStill(true);
    setLit(k);
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const next = e.key === "1" ? 1 : e.key === "2" ? 2 : e.key === "3" ? 3 : null;
    if (next) {
      e.preventDefault();
      go(next as PdaView);
      return;
    }
    if (e.key === "Escape" && view !== 1) {
      e.preventDefault();
      go(1);
    }
  };

  const foot = footCopy(view, totals, shown.length);

  const STATIONS: readonly { v: PdaView; name: string; ord: string }[] = [
    { v: 1, name: "WORK", ord: "01" },
    { v: 2, name: "CONFIGURATION", ord: "02" },
    { v: 3, name: "SUBSTRATE", ord: "03" },
  ];

  return (
    <div
      className="fl-plate fl-plate--pda fl-pda"
      data-view={view}
      data-envelope={envelope.toLowerCase()}
      onKeyDown={onKeyDown}
    >
      {/* The rig: an orbit ring behind the device, and a second frame around
          it. Both bleed past the plate's edges and are clipped by it, which
          is what makes the console read as an object sitting IN something
          rather than as a box drawn on the page. */}
      {/* v18's rig is 840x1050 inside a 1160x1230 orbit space at offset
          160/90 — so the crop IS the bleed, and the element itself never
          overhangs its box. */}
      <svg
        className="fl-pda__orbit"
        viewBox="160 90 840 1050"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <ellipse cx="580" cy="615" rx="410" ry="600" />
        <ellipse cx="580" cy="615" rx="560" ry="470" />
      </svg>
      <i className="fl-pda__outer" aria-hidden="true" />

      <div className="fl-pda__console">
        <div className="fl-pda__head">
          <span className="fl-pda__badge">
            <s aria-hidden="true">◆</s>Intelligence map
          </span>
          <span className="fl-pda__meta">
            <span>Loop Earplugs</span>
            <span>
              Snap <em>{snap}</em>
            </span>
          </span>
        </div>

        <div className="fl-pda__mid">
          <nav className="fl-pda__depth" aria-label="Map readings">
            <i className="fl-pda__spine" aria-hidden="true" />
            {STATIONS.map((s) => (
              <button
                className="fl-pda__stn"
                key={s.v}
                type="button"
                data-on={view === s.v ? "" : undefined}
                aria-current={view === s.v ? "true" : undefined}
                onClick={() => go(s.v)}
              >
                <i aria-hidden="true" />
                <b>{s.name}</b>
                <em>{s.ord}</em>
              </button>
            ))}
          </nav>

          <div className="fl-pda__field">
            {/* The sweep. Keyed on the view tick so it plays once per change
                and never on a hover repaint. */}
            <i className="fl-pda__scan" key={viewTick} aria-hidden="true" />
            <svg
              className="fl-pda__svg"
              viewBox={`0 0 ${VW} ${VH}`}
              preserveAspectRatio="xMidYMid meet"
              role="group"
              aria-label={`Work-to-intelligence map, reading ${view}`}
            >
              {view === 1 ? (
                <ViewWork
                  works={shown}
                  hover={hover}
                  onHover={hoverWork}
                  onOpen={open}
                  still={still}
                />
              ) : null}
              {view === 2 && selected ? (
                <ViewConfiguration work={selected} lit={lit} onLit={hoverPart} still={still} />
              ) : null}
              {view === 3 ? (
                <ViewSubstrate
                  teams={cross.teams}
                  shapes={cross.shapes}
                  lit={lit}
                  onLit={hoverPart}
                  still={still}
                />
              ) : null}
            </svg>
          </div>
        </div>

        <div className="fl-pda__foot">
          <h5>{foot.title}</h5>
          <p>{foot.body}</p>
        </div>
      </div>

      {/* Below the desktop gate the drawing is dropped for a DELIBERATE
          fallback — the reading that never needed the projection. */}
      <div className="fl-pda__list">
        <div className="fl-pda__list-head">
          <span>Index · streams by team</span>
          <span>{`${shown.length} / ${totals.modules}`}</span>
        </div>
        {districts.map((d) => {
          const rows = shown.filter((w) => w.team === d.id);
          if (!rows.length) return null;
          return (
            <section className="fl-pda__list-group" key={d.id}>
              <h4>{d.name}</h4>
              {rows.map((w) => (
                <div
                  className="fl-pda__list-row"
                  key={w.id}
                  data-person={w.configured ? undefined : ""}
                >
                  <i aria-hidden="true">{w.configured ? "◆" : "○"}</i>
                  <span>{w.title}</span>
                  <em>{w.lane}</em>
                </div>
              ))}
            </section>
          );
        })}
        <p className="fl-pda__list-foot">{foot.body}</p>
      </div>
    </div>
  );
}
