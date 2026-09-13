"use client";

import { useEffect, useRef, useState } from "react";

import { fitExt } from "@/components/landing/home-v2/services/casefile/map/pda/pdaFit";
import type { ArcMotion, ArcSectionOf, BoardState } from "@/lib/arcs/types";

import { rung } from "../arcMotion";
import { Bed, Diamond, Letter, Module, Ribbon } from "./boardGlyphs";
import { EXT_MAX, VB, boardGeom, type BoardGeom, type Role } from "./boardLayout";

/**
 * ArcBoardRow — the two boards, side by side (ADR-100).
 *
 * ⚠ THE ONLY SCRIPT ON THIS BEAT IS A MEASUREMENT. One `ResizeObserver` on
 * the row reads its box's aspect and hands `fitExt` the extension both crops
 * may grow by (ADR-070 U12: a static crop letterboxes at one end of the
 * viewport range or the other, and the owner's own window is the tall end).
 * The server renders `e = 0` — the fixed crop, which `xMidYMid meet` seats
 * whole — so the no-JS render is the same drawing with its slack split.
 *
 * ⚠ SIDE BY SIDE ONLY. Below 961px the boards stack and the row's aspect is
 * tall for the wrong reason; the extension is zero there and each svg sizes
 * itself by its own viewBox.
 *
 * The arrival is CSS: the row carries `.arc-reveal` and every group carries a
 * role, and `arcs.css` lights them on a delay ladder once the beat's observer
 * lands `is-in`. Nothing here toggles a class.
 */
const SIDE_BY_SIDE = "(min-width: 961px)";
const ROLES: readonly Role[] = ["head", "seat", "layer", "card", "tools", "sockets", "foot"];

export function ArcBoardRow({
  section,
  motion,
}: {
  section: ArcSectionOf<"board">;
  motion: ArcMotion;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [ext, setExt] = useState(0);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const mq = window.matchMedia(SIDE_BY_SIDE);
    const measure = (w: number, h: number) => {
      if (!mq.matches || !(w > 0) || !(h > 0)) {
        setExt(0);
        return;
      }
      // Only the ASPECT enters the arithmetic — a translate is invisible to
      // it and a uniform ancestor scale cancels, which is what makes one
      // read safe on a subtree the reveal moves as it arrives.
      setExt(fitExt({ cropW: VB.row, cropH: VB.h, maxW: 0, maxH: EXT_MAX }, h / w).extH);
    };
    const ro = new ResizeObserver((entries) => {
      const r = entries[0]?.contentRect;
      if (r) measure(r.width, r.height);
    });
    ro.observe(el);
    const onMq = () => {
      const r = el.getBoundingClientRect();
      measure(r.width, r.height);
    };
    mq.addEventListener("change", onMq);
    return () => {
      ro.disconnect();
      mq.removeEventListener("change", onMq);
    };
  }, []);

  const [today, configured] = section.states;
  return (
    <div
      ref={rootRef}
      className="arc-board arc-reveal"
      role="group"
      aria-label={`${today.label}, and ${configured.label.toLowerCase()}`}
      {...rung(motion, 0.14)}
    >
      <Board state={today} ext={ext} uid={`arc-board-${section.id}-today`} />
      <Board state={configured} ext={ext} uid={`arc-board-${section.id}-configured`} />
    </div>
  );
}

function Board({ state, ext, uid }: { state: BoardState; ext: number; uid: string }) {
  const g = boardGeom(state, ext);
  return (
    <figure
      className={`arc-board__state arc-board__state--${state.mode}`}
      data-board-state={state.mode}
    >
      <svg
        className="arc-board__svg"
        viewBox={`0 0 ${g.vb.w} ${g.vb.h}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={state.alt}
      >
        {/* ⚠ ONE PATTERN PAIR PER SVG, ids from the section id and the mode:
            `url(#…)` resolves against the document, and two boards on one
            page sharing an id would be a silent collision. */}
        <defs>
          <pattern id={`${uid}-au`} width="7" height="7" patternUnits="userSpaceOnUse">
            <path
              d="M0 7L7 0"
              stroke="var(--arc-board-gold-line)"
              strokeOpacity="0.34"
              strokeWidth="1"
            />
          </pattern>
          <pattern id={`${uid}-vd`} width="7" height="7" patternUnits="userSpaceOnUse">
            <path
              d="M0 7L7 0"
              stroke="var(--arc-board-green)"
              strokeOpacity="0.4"
              strokeWidth="1"
            />
          </pattern>
        </defs>

        {g.bed ? (
          <g data-board-role="bed" className="arc-board__in">
            <Bed bed={g.bed} />
          </g>
        ) : null}

        {/* The ribbons go under the modules, so their entries are hidden by
            the opaque plates — R4's own order. */}
        {g.lanes.map((lane) => (
          <g key={lane.id} data-board-lane={lane.id}>
            <Ribbon lane={lane} hatchId={`${uid}-${lane.paint === "green" ? "vd" : "au"}`} />
          </g>
        ))}

        {ROLES.map((role) => (
          <RoleGroup key={role} role={role} g={g} />
        ))}
      </svg>
    </figure>
  );
}

/** Everything of one role, in one group the ladder can light. */
function RoleGroup({ role, g }: { role: Role; g: BoardGeom }) {
  const modules = g.modules.filter((m) => m.role === role);
  const letters = g.letters.filter((l) => l.role === role);
  const diamonds = g.diamonds.filter((d) => d.role === role);
  if (
    modules.length === 0 &&
    letters.length === 0 &&
    diamonds.length === 0 &&
    role !== "head" &&
    role !== "foot"
  ) {
    return null;
  }
  const line = role === "head" ? g.datum : role === "foot" ? g.foot : null;
  return (
    <g data-board-role={role} className={role === "card" ? "arc-board__bloom" : "arc-board__in"}>
      {line ? (
        <line x1={line.x1} y1={line.y} x2={line.x2} y2={line.y} stroke="var(--arc-board-edge)" />
      ) : null}
      {modules.map((m) => (
        <Module key={m.id} m={m} />
      ))}
      {diamonds.map((d) => (
        <Diamond key={d.id} d={d} />
      ))}
      {letters.map((l) => (
        <Letter key={l.slot} l={l} />
      ))}
    </g>
  );
}
