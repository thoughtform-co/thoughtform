"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { SERVICES_SCROLL_OWNED_MEDIA } from "@/components/landing/home-v2/unifiedServicesInstrument";
import type { CaseMapDistrict, CaseMapShape, CaseMapWork } from "@/lib/cases/types";

import { ConsoleFrame } from "../../console/ConsoleFrame";

import { VIEW_BOX, ViewConfiguration, ViewSubstrate, ViewWork } from "./PdaViews";
import { type PdaView, crossing, footCopy, pdaTotals, selectWorks } from "./pdaRecord";
import { PDA_WHEEL_REST, type PdaWheelState, pdaWheelStep } from "./pdaWheel";

/**
 * THE WORK-TO-INTELLIGENCE MAP, as a held instrument.
 *
 * A faithful port of the owner's `thoughtform-intelligence-map-v18.html` into
 * the casefile's right panel: a reading rail across the top, a scan sweep on
 * every view change, and a centred foot that says what the reader is looking
 * at.
 *
 * ⚠ THE CHROME IS NOT HERE ANY MORE (ADR-064). The orbit ring, the chamfered
 * bezel, the console and its scanline are `ConsoleFrame`, shared with the
 * three other evidence plates so the panel reads as ONE instrument that
 * changes what it displays. This file owns the map's own vocabulary and
 * hands the frame three slots: `rail`, `foot`, and a small-screen `fallback`.
 *
 * ── Three readings, direct access, any order ─────────────────────────────
 * The rail is the navigation, and since 2026-08-06 (owner) it runs
 * HORIZONTALLY across the top of the console instead of down its left edge.
 * It is still not a tab strip: the stations keep their ordinals, diamonds and
 * hairline spine, and the lit segment travels along that spine to the reading
 * it opened — a marker pointing into the field, not a selected tab. `1` `2`
 * `3` select and `Escape` returns to the work.
 *
 * ⚠ The move is paid for in HEIGHT, and the field binds on height (ADR-063):
 * the drawing is authored 780x850 PORTRAIT into a landscape box, so it
 * letterboxes ~200px of width at 1280x720 while every pixel of height scales
 * the type. The rail's ~27px costs the drawing ~7 % of its scale and buys it
 * nothing back, because the ~53px of width it returns was already surplus.
 * Do not spend more height here without re-measuring the rendered type.
 *
 * ── The wheel, while the pointer is on the console ───────────────────────
 * Scroll changes the READING here rather than the directory row underneath
 * (owner, 2026-08-06). The decision is `pdaWheel.ts` — pure and tested — and
 * the contract that makes it safe is the RELEASE: at the last reading in the
 * direction of travel the wheel is handed straight back to the page. This
 * beat is scroll-pinned, so an instrument that kept it would be a trap on the
 * whole document.
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
}

export function PdaConsole({ shapes, districts, works, envelope }: Props) {
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

  /* ── The wheel ─────────────────────────────────────────────────────────
     A NATIVE, NON-PASSIVE listener on the plate. React registers `wheel` as
     passive on its root container, so an `onWheel` prop cannot
     `preventDefault` — the page would scroll anyway and the reading would
     change on top of it.

     Two gates, both re-read per event because both can change under a
     long-lived listener: the tier in which scroll owns this beat at all (a
     resize to mobile makes the casefile static flow content, where swallowing
     a wheel event would break ordinary page scrolling), and `data-proof-settled`
     on the stage — while the arrival ladder is still travelling the reader is
     scrolling INTO the beat, and an instrument that grabbed the wheel there
     would stop them at its threshold. */
  const rootRef = useRef<HTMLDivElement>(null);
  const wheelRef = useRef<PdaWheelState>(PDA_WHEEL_REST);
  const viewRef = useRef(view);
  viewRef.current = view;

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (!window.matchMedia(SERVICES_SCROLL_OWNED_MEDIA).matches) return;
      if (!el.closest("[data-proof-settled]")) return;

      const r = pdaWheelStep(wheelRef.current, {
        deltaY: e.deltaY,
        deltaMode: e.deltaMode,
        at: e.timeStamp,
        view: viewRef.current,
        pageHeight: window.innerHeight,
      });
      wheelRef.current = r.state;
      if (r.capture) e.preventDefault();
      if (r.next) go(r.next);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [go]);

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
    <ConsoleFrame
      className="fl-plate fl-plate--pda fl-pda"
      data-view={view}
      data-envelope={envelope.toLowerCase()}
      onKeyDown={onKeyDown}
      rootRef={rootRef}
      /* ⚠ NO HEAD. The badge said "Intelligence map" beside a left column
         already headed INTELLIGENCE MAP, and the meta said "Loop Earplugs"
         beside a tab, a directory path and a masthead that all say it
         (owner, 2026-08-06). The rail takes the console's top edge and the
         drawing takes the height back — which is the ONLY reason the type
         below could grow at all. Do not reinstate a title bar here without
         re-measuring the drawing's rendered type. */
      rail={
        /* The reading rail, across the top of the console. `__spine` is the
           lit segment: one element, translated to the active station in CSS
           off `data-view`, so the marker TRAVELS to the reading rather than
           three markers taking turns. */
        <nav className="fl-pda__depth" aria-label="Map readings">
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
              <em>{s.ord}</em>
              <b>{s.name}</b>
            </button>
          ))}
          <i className="fl-pda__spine" aria-hidden="true" />
        </nav>
      }
      /* ⚠ THE FOOT IS THE SENTENCE ALONE. Its title said "01 · THE WORK"
         directly under a lit tab reading "01 WORK" (owner, 2026-08-06) — the
         rail already names the reading, so the foot only has to say what the
         reading MEANS. `foot.title` is still the accessible name of the
         drawing; it is simply not printed twice. */
      foot={<p>{foot.body}</p>}
      /* Below the desktop gate the drawing is dropped for a DELIBERATE
         fallback — the reading that never needed the projection. */
      fallback={
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
      }
    >
      {/* The sweep. Keyed on the view tick so it plays once per change and
          never on a hover repaint. */}
      <i className="fl-pda__scan" key={viewTick} aria-hidden="true" />
      <svg
        className="fl-pda__svg"
        viewBox={VIEW_BOX[view]}
        preserveAspectRatio="xMidYMid meet"
        role="group"
        /* The reading's title is no longer PRINTED (the rail names it),
                 so it lands here instead — a screen reader still hears which
                 of the three drawings it is in. */
        aria-label={`Work-to-intelligence map — ${foot.title}`}
      >
        {view === 1 ? (
          <ViewWork works={shown} hover={hover} onHover={hoverWork} onOpen={open} still={still} />
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
    </ConsoleFrame>
  );
}
