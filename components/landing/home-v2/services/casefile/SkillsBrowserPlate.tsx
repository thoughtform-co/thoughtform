"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import type {
  CaseIntelligence,
  CaseRegistryGroup,
  CaseSkillEntry,
  CaseTeamDraw,
} from "@/lib/cases/types";

import { skillSymbol } from "./skillSymbol";
import {
  ALLOC_MICRO,
  countColumn,
  projectField,
  type PlacedSkill,
  type Projection,
} from "./skillsFieldLayout";

/**
 * SkillsBrowserPlate — the Intelligence Map as ONE PERSISTENT FIELD that
 * morphs between three projections (ADR-056 U17; owner: "I want the same
 * artifacts, which are the skills in those squares, to morph, not just
 * shift positions into new configurations... in a way that fits how we're
 * building this Intelligence Map, the way it's clustered, maybe
 * transforming into a heat map").
 *
 * THREE PROJECTIONS OF ONE DATASET, on one selector:
 *   · SUBSTRATE — 5 rows by shape of work. The default.
 *   · TEAM — 14 rows, each carrying its consumption band.
 *   · ALLOCATION — the tiles regroup under the four capability tiers their
 *     team leans on and shrink to heat cells; the column heads carry the
 *     reach-against-draw pair. The clusters are deliberately lopsided: the
 *     Skills mass sits on Everyday while the consumption mass sits on Deep
 *     and Frontier, and that gap IS the argument.
 *
 * THE MORPH IS THE POINT, and it is why the DOM is flat. All 47 tiles are
 * direct children of one supergrid, keyed by name, in ordinal order, in
 * every projection — React never remounts them, so the same elements can
 * fly. `skillsFieldLayout` says which grid cell each lands in; a FLIP
 * inverts the difference and lets CSS play it back.
 *
 * ⚠ CHILD ORDER IS INVARIANT: 47 tiles, then one chrome node. If chrome
 * ever interleaved with tiles per projection, React would MOVE tile nodes
 * to satisfy order, and `insertBefore` on a connected node cancels a
 * running transition — the morph would die mid-flight. Grid placement
 * ignores DOM order, so the chrome still paints where the math puts it.
 *
 * ⚠ THIS IS NOT THE FLIP ADR-031 REJECTED. That one (`ServicesExitPills`)
 * flew chips ACROSS THE VIEWPORT between two unrelated surfaces and read
 * as detached ornament. This is intra-container: the same artifacts
 * reconfiguring inside one field, which is exactly what the ordinal's
 * "identity, not position, like an atomic number" contract describes.
 *
 * POINTER EVENTS: `.fl-skills` is the FOURTH opt-in on the casefile host,
 * safe because the host is `visibility: hidden` until `data-proof-live`.
 */
interface SkillsBrowserPlateProps {
  groups: readonly CaseRegistryGroup[];
  skills: readonly CaseSkillEntry[];
  /** Presence turns the ALLOCATION projection on. Absent = the two-way
   *  lattice, which is what a second client without the data would get. */
  intelligence?: CaseIntelligence;
  teamDraw?: readonly CaseTeamDraw[];
}

const STATUS_FILL: Record<string, string> = {
  Shipped: "ship",
  "In use": "use",
  "In build": "build",
  Scoped: "scoped",
};

const PROJECTION_LABEL: Record<Projection, string> = {
  substrate: "Substrate",
  team: "Team",
  allocation: "Allocation",
};

/** Flight duration, stagger spread, and the cushion before we call it
 *  settled. Max flight = 450 + 120 = 570ms; the timer adds 60ms of slack
 *  so the class comes off after the last tile has actually landed. */
const FLY_MS = 450;
const STAGGER_MS = 120;
const SETTLE_MS = FLY_MS + STAGGER_MS + 60;

interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
  );
}

export function SkillsBrowserPlate({
  groups,
  skills,
  intelligence,
  teamDraw,
}: SkillsBrowserPlateProps) {
  const canAllocate = Boolean(intelligence?.tiers.length && teamDraw?.length);
  const projections: Projection[] = canAllocate
    ? ["substrate", "team", "allocation"]
    : ["substrate", "team"];

  const [projection, setProjection] = useState<Projection>("substrate");
  const [selected, setSelected] = useState<PlacedSkill | null>(null);
  const [hovered, setHovered] = useState<PlacedSkill | null>(null);

  const stageRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLButtonElement | null>(null);
  /** Tile rects captured at click, RELATIVE to the field. */
  const prevRectsRef = useRef<Map<string, Rect>>(new Map());
  const settleTimerRef = useRef<number | null>(null);

  /** Ordinal is registry order and never changes with the projection. */
  const placed = useMemo<PlacedSkill[]>(
    () => skills.map((skill, i) => ({ skill, ordinal: i + 1 })),
    [skills]
  );

  const layout = useMemo(
    () =>
      projectField({
        placed,
        groups,
        teamDraw,
        tiers: intelligence?.tiers,
        projection,
      }),
    [placed, groups, teamDraw, intelligence, projection]
  );

  /** Which nav row and cell a skill sits in — the arrow-key model. */
  const navIndex = useMemo(() => {
    const m = new Map<string, { row: number; cell: number }>();
    layout.navRows.forEach((row, r) =>
      row.forEach((p, c) => m.set(p.skill.name, { row: r, cell: c }))
    );
    return m;
  }, [layout]);

  const bandByTeam = useMemo(
    () => new Map((teamDraw ?? []).map((t) => [t.team, t.band])),
    [teamDraw]
  );
  const tierByTeam = useMemo(
    () => new Map((teamDraw ?? []).map((t) => [t.team, t.tier])),
    [teamDraw]
  );

  /* THE PLATE IS NEVER NAMELESS (owner: "when you just enter that part of
     the proof, it doesn't say anything"). With no pointer and nothing
     picked, the register names the first Skill. */
  const active = hovered ?? selected ?? placed[0] ?? null;

  const close = useCallback((restoreFocus = true) => {
    setSelected(null);
    if (restoreFocus) anchorRef.current?.focus();
    anchorRef.current = null;
  }, []);

  /* ── The morph ─────────────────────────────────────────────────────────
     Two one-shot measurements, both click-driven — nothing here runs per
     frame on a surface that sits over live WebGL. */

  const startMorph = (next: Projection) => {
    if (next === projection) return;
    close(false);

    if (prefersReducedMotion()) {
      prevRectsRef.current.clear();
      setProjection(next);
      return;
    }

    const field = fieldRef.current;
    if (!field) {
      setProjection(next);
      return;
    }

    /* An interrupted flight is captured MID-TRANSFORM, because
       getBoundingClientRect includes transforms — so a second click
       retargets from wherever the tiles currently are, for free. */
    if (settleTimerRef.current) window.clearTimeout(settleTimerRef.current);

    const fieldRect = field.getBoundingClientRect();
    const prev = new Map<string, Rect>();
    field.querySelectorAll<HTMLElement>("[data-fl-skill]").forEach((el) => {
      const r = el.getBoundingClientRect();
      prev.set(el.dataset.flSkill ?? "", {
        // Relative to the field: the plate's ancestor translates during the
        // casefile's arrival, and relative rects cancel that out.
        left: r.left - fieldRect.left,
        top: r.top - fieldRect.top,
        width: r.width,
        height: r.height,
      });
    });
    prevRectsRef.current = prev;
    setProjection(next);
  };

  /* Invert BEFORE paint, so the first painted frame still shows the old
     geometry and there is never a flash at the destination. */
  useLayoutEffect(() => {
    const field = fieldRef.current;
    const prev = prevRectsRef.current;
    if (!field || prev.size === 0) return;

    const fieldRect = field.getBoundingClientRect();
    const tiles = Array.from(field.querySelectorAll<HTMLElement>("[data-fl-skill]"));

    for (const el of tiles) {
      const before = prev.get(el.dataset.flSkill ?? "");
      if (!before) continue;
      const r = el.getBoundingClientRect();
      const left = r.left - fieldRect.left;
      const top = r.top - fieldRect.top;
      const dx = before.left - left;
      const dy = before.top - top;
      const sx = r.width > 0 ? before.width / r.width : 1;
      const sy = r.height > 0 ? before.height / r.height : 1;
      el.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
    }

    // Imperative, never rendered: a re-render mid-flight must not clobber it.
    field.dataset.morph = "1";
    prevRectsRef.current = new Map();

    let raf2 = 0;
    const raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => {
        // Play: the transition runs from the inverted matrix to computed
        // `none`. The rest state is pure grid layout, never a stored
        // transform, so zero-at-rest holds even across a mid-flight resize.
        for (const el of tiles) el.style.transform = "";
      });
    });

    settleTimerRef.current = window.setTimeout(() => {
      delete field.dataset.morph;
      for (const el of tiles) el.style.transform = "";
      settleTimerRef.current = null;
    }, SETTLE_MS);

    return () => {
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
    };
  }, [projection]);

  useEffect(
    () => () => {
      if (settleTimerRef.current) window.clearTimeout(settleTimerRef.current);
    },
    []
  );

  /* Escape closes the panel; so does a pointer landing outside it. */
  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
      }
    };
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || anchorRef.current?.contains(t)) return;
      close(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [selected, close]);

  const focusTile = (name: string) => {
    fieldRef.current
      ?.querySelector<HTMLButtonElement>(`[data-fl-skill="${CSS.escape(name)}"]`)
      ?.focus();
  };

  /* ROVING TABINDEX over the nav rows, which are the VISUAL rows — the
     same chunking the geometry uses, so an arrow always lands on the tile
     that looks like the neighbour. */
  const onTileKeyDown = (e: React.KeyboardEvent, name: string) => {
    const at = navIndex.get(name);
    if (!at) return;
    const { navRows } = layout;
    const row = navRows[at.row];
    let next: PlacedSkill | undefined;

    if (e.key === "ArrowLeft") next = row[at.cell - 1];
    else if (e.key === "ArrowRight") next = row[at.cell + 1];
    else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      const step = e.key === "ArrowUp" ? -1 : 1;
      const target = navRows[(at.row + step + navRows.length) % navRows.length];
      next = target?.[Math.min(at.cell, (target?.length ?? 1) - 1)];
    } else if (e.key === "Home") next = row[0];
    else if (e.key === "End") next = row[row.length - 1];
    else return;

    e.preventDefault();
    if (!next) return;
    setHovered(next);
    focusTile(next.skill.name);
  };

  if (!active) return null;

  const tabTarget = active.skill.name;
  const activeTier = tierByTeam.get(active.skill.team);
  const activeGroup = groups.find((g) => g.name === active.skill.engine);

  return (
    <div className="fl-plate fl-plate--registry fl-skills" data-proj={projection}>
      <div className="fl-skills__head">
        <span className="fl-skills__views" role="tablist" aria-label="Intelligence map projection">
          {projections.map((p) => (
            <button
              key={p}
              type="button"
              role="tab"
              className="fl-skills__viewbtn"
              data-on={projection === p || undefined}
              aria-selected={projection === p}
              onClick={() => startMorph(p)}
            >
              {PROJECTION_LABEL[p]}
            </button>
          ))}
        </span>

        {/* THE NAME REGISTER. The tiles carry a symbol, not a name, so
            without this the field says nothing to a first-time reader.
            It is lit on arrival and streams as the hand sweeps. */}
        <span className="fl-skills__name" aria-live="polite">
          <b className="fl-skills__name-ord">{String(active.ordinal).padStart(2, "0")}</b>
          <span className="fl-skills__name-txt">{active.skill.name}</span>
          <i className="fl-skills__name-meta">
            {active.skill.team} · {active.skill.status}
          </i>
        </span>

        <span className="fl-skills__key" aria-hidden="true">
          {projection === "allocation"
            ? (["reach", "draw"] as const).map((k) => (
                <span key={k} className="fl-skills__key-item">
                  <i className="fl-skills__key-sw" data-kind={k} />
                  {k === "reach" ? "Reach" : "Draw"}
                </span>
              ))
            : (["Shipped", "In use", "In build", "Scoped"] as const).map((s) => (
                <span key={s} className="fl-skills__key-item">
                  <i className="fl-skills__key-sw" data-fill={STATUS_FILL[s]} />
                  {s}
                </span>
              ))}
        </span>
      </div>

      <div className="fl-skills__stage" ref={stageRef} onMouseLeave={() => setHovered(null)}>
        <div
          className="fl-skills__field"
          ref={fieldRef}
          data-proj={projection}
          role="group"
          aria-label={
            projection === "substrate"
              ? "Skills by shape of work"
              : projection === "team"
                ? "Skills by team"
                : "Skills by the tier their team leans on"
          }
        >
          {/* THE 47, ALWAYS FIRST AND ALWAYS IN ORDINAL ORDER. */}
          {placed.map((p) => {
            const at = layout.tiles.get(p.skill.name);
            const band = bandByTeam.get(p.skill.team);
            return (
              <button
                key={p.skill.name}
                type="button"
                className="fl-skills__tile"
                data-fl-skill={p.skill.name}
                data-fill={STATUS_FILL[p.skill.status] ?? "scoped"}
                data-band={band}
                data-on={p.skill.name === selected?.skill.name || undefined}
                data-lit={p.skill.name === active.skill.name || undefined}
                aria-expanded={p.skill.name === selected?.skill.name}
                aria-label={`${p.ordinal}. ${p.skill.name}. ${p.skill.engine}, ${p.skill.team}, ${p.skill.status}${
                  projection === "allocation" && tierByTeam.get(p.skill.team)
                    ? `, ${tierByTeam.get(p.skill.team)} tier`
                    : ""
                }.`}
                tabIndex={p.skill.name === tabTarget ? 0 : -1}
                style={{
                  gridRow: at?.row,
                  gridColumn: at?.column,
                  // One property carries the whole stagger — no JS timers.
                  ["--fl-fly-delay" as string]: `${Math.round(
                    ((p.ordinal - 1) / Math.max(1, placed.length - 1)) * STAGGER_MS
                  )}ms`,
                }}
                onMouseEnter={() => setHovered(p)}
                onFocus={() => setHovered(p)}
                onClick={(e) => {
                  e.stopPropagation();
                  // A rect measured mid-transform would anchor nothing.
                  if (fieldRef.current?.dataset.morph) return;
                  if (selected?.skill.name === p.skill.name) {
                    close();
                    return;
                  }
                  anchorRef.current = e.currentTarget;
                  setSelected(p);
                }}
                onKeyDown={(e) => onTileKeyDown(e, p.skill.name)}
              >
                <span className="fl-skills__ord">{p.ordinal}</span>
                <span className="fl-skills__sym">{skillSymbol(p.skill.name)}</span>
              </button>
            );
          })}

          {/* CHROME, one node keyed by projection so it swaps atomically
              while the tiles persist. `display: contents` lets its
              children take grid cells of their own. */}
          <div className="fl-skills__chrome" key={projection} style={{ display: "contents" }}>
            {projection === "allocation"
              ? layout.chrome.map((head) => (
                  <div
                    className="fl-skills__chead"
                    key={head.key}
                    style={{ gridRow: 1, gridColumn: `${head.column} / span ${head.span ?? 1}` }}
                  >
                    <span className="fl-skills__chead-name">{head.label}</span>
                    {head.tier?.note ? (
                      <span className="fl-skills__chead-note">{head.tier.note}</span>
                    ) : null}
                    <span className="fl-skills__bars">
                      {(
                        [
                          ["reach", head.tier?.reach ?? 0],
                          ["draw", head.tier?.draw ?? 0],
                        ] as const
                      ).map(([kind, value]) => (
                        <span className="fl-skills__bar-row" key={kind}>
                          <i
                            className="fl-skills__bar"
                            data-kind={kind}
                            style={{ ["--fl-bar" as string]: `${value}%` }}
                            aria-hidden="true"
                          />
                          <b className="fl-skills__bar-val">{value}%</b>
                        </span>
                      ))}
                    </span>
                  </div>
                ))
              : layout.chrome.map((row) => (
                  <span key={row.key} style={{ display: "contents" }}>
                    <span
                      className="fl-skills__row-name"
                      style={{ gridRow: row.row, gridColumn: 1 }}
                      aria-hidden="true"
                    >
                      {row.label}
                    </span>
                    <span
                      className="fl-skills__row-count"
                      style={{ gridRow: row.row, gridColumn: countColumn(projection) }}
                      aria-hidden="true"
                    >
                      {row.count}
                    </span>
                    {projection === "team" ? (
                      <i
                        className="fl-skills__band"
                        data-band={row.band}
                        style={{ gridRow: row.row, gridColumn: countColumn(projection) + 1 }}
                        aria-hidden="true"
                      />
                    ) : null}
                  </span>
                ))}

            {/* The empty tier's note, and the litmus rail. */}
            {projection === "allocation" ? (
              <>
                {layout.chrome
                  .filter((h) => !placed.some((p) => tierByTeam.get(p.skill.team) === h.label))
                  .map((h) => (
                    <p
                      className="fl-skills__cnote"
                      key={`note-${h.key}`}
                      style={{ gridRow: 2, gridColumn: `${h.column} / span ${h.span ?? 1}` }}
                    >
                      Ambient. Every seat, no single workflow.
                    </p>
                  ))}
                <div
                  className="fl-skills__rail"
                  style={{ gridColumn: 4 * (ALLOC_MICRO + 1), gridRow: "1 / -1" }}
                >
                  {intelligence?.reads.map((read) => (
                    <div className="fl-skills__read" key={read.team}>
                      <span className="fl-skills__read-top">
                        <span className="fl-skills__read-team">{read.team}</span>
                        <span className="fl-skills__read-lens">{read.lens}</span>
                      </span>
                      <p className="fl-skills__read-why">{read.why}</p>
                    </div>
                  ))}
                  {intelligence?.trend ? (
                    <p className="fl-skills__trend">
                      <span className="fl-skills__trend-label">{intelligence.trend.label}</span>
                      {intelligence.trend.points.map((pt) => (
                        <span className="fl-skills__trend-pt" key={pt.stamp}>
                          <i>{pt.stamp}</i>
                          {pt.value}
                        </span>
                      ))}
                    </p>
                  ) : null}
                </div>
              </>
            ) : null}
          </div>
        </div>

        {/* THE SLIDE PANEL (owner: "there shouldn't be a pop-up. They
            should slide a panel on the right side inwards... the same
            height, but it just slides inwards, and it can be a bit
            transparent"). It lives INSIDE the stage, so the plate's
            `overflow: hidden` and the case's iris never fight it. */}
        {selected ? (
          <div
            className="fl-skills__panel"
            ref={panelRef}
            data-open="1"
            role="dialog"
            aria-label={selected.skill.name}
          >
            <p className="fl-skills__panel-top">
              <span className="fl-skills__panel-engine">{selected.skill.engine}</span>
              <span
                className="fl-skills__panel-status"
                data-fill={STATUS_FILL[selected.skill.status] ?? "scoped"}
              >
                {selected.skill.status}
              </span>
              <span className="fl-skills__panel-ord">
                {String(selected.ordinal).padStart(2, "0")} / {skills.length}
              </span>
              {/* The close sits IN the top line: at 800h the panel is the
                  stage's 144px and a bottom-anchored button costs a line
                  the summary needs more. */}
              <button
                type="button"
                className="fl-skills__panel-close"
                aria-label="Close"
                onClick={() => close()}
              >
                ✕
              </button>
            </p>
            <h4 className="fl-skills__panel-name">{selected.skill.name}</h4>
            <p className="fl-skills__panel-team">{selected.skill.team}</p>
            {selected.skill.summary ? (
              <p className="fl-skills__panel-body">{selected.skill.summary}</p>
            ) : null}
            {tierByTeam.get(selected.skill.team) ? (
              <p className="fl-skills__panel-tier">
                Runs on the {tierByTeam.get(selected.skill.team)} tier
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <p className="fl-skills__readout">
        <span className="fl-skills__readout-team">
          {projection === "allocation"
            ? "The work decides the model"
            : `${skills.length} Skills · ${groups.length} shapes · ${new Set(skills.map((s) => s.team)).size} teams`}
        </span>
        <i className="fl-skills__readout-ld" aria-hidden="true" />
        <span className="fl-skills__readout-status">
          {projection === "allocation"
            ? "Reach is not draw"
            : projection === "team"
              ? activeTier
                ? `${activeTier} tier`
                : ""
              : (activeGroup?.gloss ?? "")}
        </span>
      </p>
    </div>
  );
}
