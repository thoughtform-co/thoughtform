"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  LENS_LINES,
  RANGES,
  RANGE_HINTS,
  SUBSTRATES,
  SUBSTRATE_BY_ID,
  TEAMS,
  TEAM_LABEL_LINES,
  WORKS,
  WORK_BY_ID,
  type ComponentKey,
  type ImapWork,
} from "../imapData";
import {
  FRAME_CHAMFER,
  LOCK_LEN,
  MARK,
  NODE_IDS,
  TIER_COLS,
  TRACE_PAIRS,
  brackets,
  buildLayout,
  chamfer,
  diamond,
  layoutTargets,
  r2,
  run,
  type Box,
  type ImapLayout,
  type NodeTarget,
} from "./imapGeometry";

/**
 * IntelligenceField — the Intelligence Map as ONE BOUNDED PLOT read at THREE
 * SEMANTIC RANGES. Round 3, rev B.
 *
 * ── WHAT IS THE OWNER'S, AND UNTOUCHED ────────────────────────────────────
 * The FLOW. Three semantic ranges, wheel-zoomed over the field, with a
 * persistent node registry — 8 works, 6 component stations, 6 substrates — that
 * lerps toward a target at k = 0.12 (0.17 on opacity) inside ONE rAF loop that
 * stops dead at rest. Nodes NEVER REMOUNT: they are stable children of one
 * parent keyed by a non-display id, so a range change is a glide, not a
 * crossfade (ADR-061's identity law, and the reason the map can claim "the work
 * node never disappears"). His click semantics, keyboard map, guided auto-trace
 * and cancel-on-interaction are all as they were.
 *
 * ── WHAT REV B REPLACED, AND WHY ──────────────────────────────────────────
 * 1. NO FIXED viewBox. Rev A drew into `0 0 1000 672` at
 *    `preserveAspectRatio="none"` and was verified at two viewports where the
 *    panel happened to be 1.49:1. The panel's aspect follows the WINDOW; at
 *    ~1.05:1 every shape printed 30 % narrower than drawn — discs became eggs.
 *    The viewBox is now `0 0 w h` from the MEASURED box, 1:1 at every aspect,
 *    and the whole layout is computed in CSS pixels (`buildLayout`).
 * 2. NO CIRCLES. Rev A drew concentric rings, discs and arcs behind an argument
 *    that "celestial grammar" exempted them from DESIGN.md's "diamonds replace
 *    all circles". It does not. There is no `<circle>`, `<ellipse>`, arc or
 *    border-radius here: frames are chamfered rectangles, the selection is four
 *    corner brackets, marks are diamonds, ranges are tick rulers.
 * 3. NO POLAR ROSETTE. Ranges 02/03 are a cartesian plot — four capability
 *    columns × seven team rows — so a work sits at its (team, allocation)
 *    coordinate, and the two lenses become WHICH AXIS IS LIT rather than a
 *    crossfade between two diagrams. No two works share a cell, so the grid
 *    separates all eight by construction, with no correction table.
 * 4. INSTRUMENT CHROME. A chamfered frame, an orthogonal graticule, a bottom
 *    tick ruler whose stops are the four capability names, a left band of team
 *    names, corner readouts pinned inside the frame, and right-angle wire runs
 *    with junction diamonds at range 01 — the grammar of the owner's own panel
 *    references, which rev A had none of.
 *
 * Type floors hold (9 micro / 10 chrome / 11 identity / 12 copy / 17 core
 * title), and every string is HTML at real px positioned from the same node
 * state in the same rAF tick — the SVG carries geometry only.
 */

/* ══ Types ═════════════════════════════════════════════════════════════ */

export type Depth = 0 | 1 | 2;
export type Lens = "team" | "allocation";

export interface FieldView {
  depth: Depth;
  lens: Lens;
  work: string;
  substrate: string;
}

interface Props {
  initial: FieldView;
  autoplay: boolean;
  onView: (view: FieldView) => void;
}

interface NodeState extends NodeTarget {
  tx: number;
  ty: number;
  ts: number;
  to: number;
}

interface Engine {
  kick: () => void;
  snap: () => void;
}

function buildRegistry(): Map<string, NodeState> {
  return new Map(
    NODE_IDS.map((id) => [
      id,
      { x: 0, y: 0, scale: 0.35, opacity: 0, tx: 0, ty: 0, ts: 0.35, to: 0 },
    ])
  );
}

/** His settle constants. 0.12 on geometry, 0.17 on opacity — light leads. */
const K = 0.12;
const K_OPACITY = 0.17;
const WHEEL_THRESHOLD = 85;
const WHEEL_LOCK_MS = 720;

/** Two lines of 11px identity — the label's own height, needed by the paint. */
const IDENT_H = 26;
const IDENT_GAP = 14;

/**
 * The selected node's meta — his per-range variation, reduced to the ONE FACT
 * THE CURRENT GRATICULE DOES NOT ENCODE, on one 9px line.
 *   range 02 (substrate bus, neither axis lit) → the allocation lane
 *   range 03 / TEAM (a row is lit)             → the allocation lane
 *   range 03 / ALLOCATION (a column is lit)    → the delegation mode
 */
function nodeMeta(work: ImapWork, depth: Depth, lens: Lens): string {
  if (depth === 2 && lens === "allocation") return work.mode;
  return work.tier;
}

/* ══ The component ═════════════════════════════════════════════════════ */

export function IntelligenceField({ initial, autoplay, onView }: Props) {
  const [depth, setDepthState] = useState<Depth>(initial.depth);
  const [lens, setLensState] = useState<Lens>(initial.lens);
  const [workId, setWorkId] = useState(initial.work);
  const [subId, setSubId] = useState(initial.substrate);
  const [autoRunning, setAutoRunning] = useState(false);
  const [pulseId, setPulseId] = useState<string | null>(null);
  const [sweepKey, setSweepKey] = useState(0);
  /** The measured field box. Null until the observer has run once. */
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);

  const work = WORK_BY_ID.get(workId) ?? WORKS[0];
  const substrate = SUBSTRATE_BY_ID.get(subId) ?? SUBSTRATES[0];
  const traceWorks = useMemo(
    () => WORKS.filter((w) => w.substrates.includes(substrate.id)),
    [substrate.id]
  );

  /** THE LAYOUT IS A FUNCTION OF THE MEASURED BOX, and nothing else. */
  const layout = useMemo(() => (box ? buildLayout(box.w, box.h) : null), [box]);

  const [states] = useState(buildRegistry);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<Engine | null>(null);
  const seededRef = useRef(false);
  const viewRef = useRef<FieldView>({ ...initial });

  /* ── Measure. ONE ResizeObserver, and it is the only DOM read on the
        surface: the paint loop reads nothing. ───────────────────────────── */
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const read = () => {
      const r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) return;
      setBox((prev) =>
        prev && Math.abs(prev.w - r.width) < 0.5 && Math.abs(prev.h - r.height) < 0.5
          ? prev
          : { w: r.width, h: r.height }
      );
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* ══ THE ANIMATOR ═══════════════════════════════════════════════════
     ONE effect owns the engine: DOM handles, the settle loop, the edge
     recomputation and the paint. Rebuilt only when the LAYOUT changes, because a
     resize moves every target.
     ══════════════════════════════════════════════════════════════════ */

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !layout) return;
    /* Typed non-null up front: the paint helpers below are hoisted function
       declarations, and TypeScript will not carry a narrowing into those. */
    const L: ImapLayout = layout;
    const view = viewRef.current;

    const groups = new Map<string, SVGGElement>();
    root.querySelectorAll<SVGGElement>("[data-node]").forEach((el) => {
      groups.set(el.dataset.node as string, el);
    });
    const labels = new Map<string, HTMLElement[]>();
    root.querySelectorAll<HTMLElement>("[data-node-label]").forEach((el) => {
      const id = el.dataset.nodeLabel as string;
      const list = labels.get(id);
      if (list) list.push(el);
      else labels.set(id, [el]);
    });
    const edges = new Map<string, SVGPathElement>();
    root.querySelectorAll<SVGPathElement>("[data-edge]").forEach((el) => {
      edges.set(el.dataset.edge as string, el);
    });

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf: number | null = null;

    function paintEdges() {
      /* Range 01 · the wire runs. Right angles with a junction diamond at each
         elbow — a run is a path PLUS its joints, never a bare polyline. */
      const core = states.get(`work:${view.work}`)!;
      for (const s of L.stations) {
        const wire = edges.get(`run:${s.key}`);
        const joint = edges.get(`joint:${s.key}`);
        const node = states.get(`component:${s.key}`)!;
        const spine = s.side === "l" ? L.spineL : L.spineR;
        const from = { x: core.x + (s.side === "l" ? -L.core.w / 2 : L.core.w / 2), y: core.y };
        const to = { x: node.x + (s.side === "l" ? s.box.w / 2 : -s.box.w / 2), y: node.y };
        const r = run(from, to, spine);
        const shown = view.depth === 0 ? Math.min(core.opacity, node.opacity) : 0;
        if (wire) {
          wire.setAttribute("d", r.d);
          wire.style.opacity = String(shown);
        }
        if (joint) {
          joint.setAttribute("d", r.joints.map((j) => diamond(j.x, j.y, MARK.joint)).join(""));
          joint.style.opacity = String(shown);
        }
      }

      /* Ranges 02/03 · the traces. Dotted diagonals from a bus box's top edge to
         a work's mark — a trajectory, which is why it is dotted and not a run. */
      for (const pair of TRACE_PAIRS) {
        const path = edges.get(`trace:${pair.key}`);
        if (!path) continue;
        const w = states.get(`work:${pair.workId}`)!;
        const s = states.get(`substrate:${pair.subId}`)!;
        const active = pair.subId === view.substrate;
        const selected = pair.workId === view.work;
        path.setAttribute(
          "d",
          `M${r2(s.x)} ${r2(s.y - 21)}L${r2(w.x)} ${r2(w.y + MARK.workSel + 3)}`
        );
        path.style.opacity = view.depth === 1 ? String(active ? (selected ? 1 : 0.7) : 0.05) : "0";
        path.classList.toggle("imf-trace--on", active);
      }
    }

    function paint() {
      for (const [id, s] of states) {
        const g = groups.get(id);
        if (g) {
          g.setAttribute(
            "transform",
            `translate(${r2(s.x)} ${r2(s.y)}) scale(${s.scale.toFixed(3)})`
          );
          g.style.opacity = s.opacity.toFixed(3);
        }
        const bound = labels.get(id);
        if (!bound) continue;
        for (const el of bound) {
          const ox = Number(el.dataset.ox ?? 0);
          const oy = Number(el.dataset.oy ?? 0);
          /* px in, px out. The label MOVES with its node and never scales — real
             px is the whole reason it is HTML and not `<text>`. */
          el.style.left = `${r2(s.x + ox)}px`;
          el.style.top = `${r2(s.y + oy)}px`;
          el.style.opacity = s.opacity.toFixed(3);
        }
      }

      /* The work identities: one label per node, above or below its mark, the
         side fixed by the seat table so the grid's guarantee holds. */
      for (const w of WORKS) {
        const s = states.get(`work:${w.id}`)!;
        for (const el of labels.get(`ident:${w.id}`) ?? []) {
          el.style.left = `${r2(s.x + IDENT_GAP)}px`;
          el.style.top = `${r2(s.y - IDENT_H / 2)}px`;
          el.style.opacity = view.depth === 0 ? "0" : s.opacity.toFixed(3);
        }
      }

      /* The core's strings ride whichever work holds the centre. */
      const core = states.get(`work:${view.work}`)!;
      for (const el of labels.get("core") ?? []) {
        const ox = Number(el.dataset.ox ?? 0);
        const oy = Number(el.dataset.oy ?? 0);
        el.style.left = `${r2(core.x + ox)}px`;
        el.style.top = `${r2(core.y + oy)}px`;
        el.style.opacity = view.depth === 0 ? core.opacity.toFixed(3) : "0";
      }

      paintEdges();
    }

    function tick() {
      let moving = false;
      for (const s of states.values()) {
        s.x += (s.tx - s.x) * K;
        s.y += (s.ty - s.y) * K;
        s.scale += (s.ts - s.scale) * K;
        s.opacity += (s.to - s.opacity) * K_OPACITY;
        if (
          Math.abs(s.tx - s.x) > 0.08 ||
          Math.abs(s.ty - s.y) > 0.08 ||
          Math.abs(s.ts - s.scale) > 0.002 ||
          Math.abs(s.to - s.opacity) > 0.002
        ) {
          moving = true;
        }
      }
      paint();
      /* ZERO AT REST BY CONSTRUCTION: the loop does not idle, it stops. */
      if (moving) raf = requestAnimationFrame(tick);
      else raf = null;
    }

    const snap = () => {
      for (const s of states.values()) {
        s.x = s.tx;
        s.y = s.ty;
        s.scale = s.ts;
        s.opacity = s.to;
      }
      paint();
    };

    engineRef.current = {
      snap,
      kick() {
        /* REDUCED MOTION swaps the layout instantly: state := target, ONE paint,
           no loop. The sheet's `prefers-reduced-motion` block owns the rest. */
        if (reduced) {
          snap();
          return;
        }
        if (raf === null) raf = requestAnimationFrame(tick);
      },
    };
    /* A RESIZE IS NOT A TRANSITION: the geometry moved under the nodes, so the
       new frame is painted at once rather than animated toward. */
    snap();

    return () => {
      if (raf !== null) cancelAnimationFrame(raf);
      engineRef.current = null;
    };
  }, [layout, states]);

  /* ── Targets in, motion out. The ONLY writer of a node target. ───────── */
  useEffect(() => {
    const L = layout;
    if (!L) return;
    const view = viewRef.current;
    view.depth = depth;
    view.lens = lens;
    view.work = workId;
    view.substrate = subId;

    for (const [id, t] of layoutTargets(L, { depth, work: workId, substrate: subId })) {
      const s = states.get(id);
      if (!s) continue;
      s.tx = t.x;
      s.ty = t.y;
      s.ts = t.scale;
      s.to = t.opacity;
      /* On the very first pass every node is parked at 0,0 — an origin outside
         the field. Seed the geometry at the centre so the arrival is a bloom and
         not a slide in from the corner. */
      if (!seededRef.current) {
        s.x = L.centre.x;
        s.y = L.centre.y;
      }
    }
    seededRef.current = true;
    engineRef.current?.kick();
  }, [depth, lens, workId, subId, states, layout]);

  useEffect(() => {
    onView({ depth, lens, work: workId, substrate: subId });
  }, [depth, lens, workId, subId, onView]);

  /* ══ AUTO-TRACE — his choreography, with the permanent cancel ═══════ */

  const cancelledRef = useRef(!autoplay);
  const timersRef = useRef<number[]>([]);

  const cancelAuto = useCallback(() => {
    if (cancelledRef.current) return;
    cancelledRef.current = true;
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
    setAutoRunning(false);
    setPulseId(null);
  }, []);

  useEffect(() => {
    if (!autoplay) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      cancelledRef.current = true;
      return;
    }
    const after = (ms: number, fn: () => void) => {
      timersRef.current.push(
        window.setTimeout(() => {
          if (!cancelledRef.current) fn();
        }, ms)
      );
    };
    after(4300, () => {
      setAutoRunning(true);
      setWorkId("W05");
      setSubId("S02");
      setDepthState(0);
      setLensState("team");
      after(2400, () => {
        setDepthState(1);
        setSweepKey((k) => k + 1);
      });
      after(4400, () => {
        setPulseId("W03");
        after(2200, () => setPulseId(null));
      });
      after(6800, () => {
        setDepthState(2);
        setSweepKey((k) => k + 1);
      });
      after(9400, () => {
        setLensState("allocation");
        setSweepKey((k) => k + 1);
      });
      after(12000, () => setAutoRunning(false));
    });
    const timers = timersRef.current;
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [autoplay]);

  /* ══ Interaction — his semantics, unchanged ═════════════════════════ */

  const sweep = useCallback(() => setSweepKey((k) => k + 1), []);

  const setDepth = useCallback(
    (next: number, auto = false) => {
      const clamped = Math.max(0, Math.min(2, next)) as Depth;
      if (!auto) cancelAuto();
      setDepthState((current) => {
        if (current === clamped) return current;
        sweep();
        return clamped;
      });
    },
    [cancelAuto, sweep]
  );

  const setLens = useCallback(
    (next: Lens) => {
      cancelAuto();
      setLensState(next);
      setDepthState(2);
      sweep();
    },
    [cancelAuto, sweep]
  );

  /** His rule: a work clicked at range 01 zooms OUT to its substrate; clicked
   *  anywhere else it zooms IN to its configuration. */
  const selectWork = useCallback(
    (id: string) => {
      cancelAuto();
      const next = WORK_BY_ID.get(id);
      if (!next) return;
      setWorkId(id);
      setSubId((current) => (next.substrates.includes(current) ? current : next.substrates[0]));
      setDepthState((current) => (current === 0 ? 1 : 0));
      sweep();
    },
    [cancelAuto, sweep]
  );

  const selectSubstrate = useCallback(
    (id: string) => {
      cancelAuto();
      setSubId(id);
      setDepthState((current) => (current === 0 ? 1 : current));
      sweep();
    },
    [cancelAuto, sweep]
  );

  const cycleWork = useCallback(
    (step: 1 | -1) => {
      cancelAuto();
      setWorkId((current) => {
        const idx = WORKS.findIndex((w) => w.id === current);
        const next = WORKS[(idx + step + WORKS.length) % WORKS.length];
        setSubId((sub) => (next.substrates.includes(sub) ? sub : next.substrates[0]));
        return next.id;
      });
    },
    [cancelAuto]
  );

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let accum = 0;
    let locked = false;
    let unlock: number | null = null;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      cancelAuto();
      if (locked) return;
      accum += e.deltaY;
      if (Math.abs(accum) < WHEEL_THRESHOLD) return;
      const dir = accum > 0 ? 1 : -1;
      accum = 0;
      locked = true;
      setDepth(viewRef.current.depth + dir);
      unlock = window.setTimeout(() => {
        locked = false;
      }, WHEEL_LOCK_MS);
    };
    root.addEventListener("wheel", onWheel, { passive: false });
    const takeOver = () => cancelAuto();
    root.addEventListener("pointerdown", takeOver, { passive: true });
    root.addEventListener("pointermove", takeOver, { passive: true, once: true });
    root.addEventListener("touchstart", takeOver, { passive: true });
    return () => {
      root.removeEventListener("wheel", onWheel);
      root.removeEventListener("pointerdown", takeOver);
      root.removeEventListener("pointermove", takeOver);
      root.removeEventListener("touchstart", takeOver);
      if (unlock !== null) window.clearTimeout(unlock);
    };
  }, [cancelAuto, setDepth]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = e.key;
      if (key === "+" || key === "=") setDepth(viewRef.current.depth - 1);
      else if (key === "-" || key === "_") setDepth(viewRef.current.depth + 1);
      else if (key === "Escape") setDepth(viewRef.current.depth + 1);
      else if (key.toLowerCase() === "l")
        setLens(viewRef.current.lens === "team" ? "allocation" : "team");
      else if (key === "ArrowRight") cycleWork(1);
      else if (key === "ArrowLeft") cycleWork(-1);
      else if (key.toLowerCase() === "t") {
        cancelAuto();
        const el = document.documentElement;
        el.dataset.theme = el.dataset.theme === "light" ? "dark" : "light";
      } else return;
      cancelAuto();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [cancelAuto, cycleWork, setDepth, setLens]);

  /* ══ Readouts ═══════════════════════════════════════════════════════ */

  const range = RANGES[depth];
  const readout =
    depth === 0
      ? { kicker: "ONE WORK STREAM / ACTIVE", subject: work.title, detail: work.bar }
      : depth === 1
        ? {
            kicker: `SHARED SUBSTRATE / ${String(traceWorks.length).padStart(2, "0")} WORK STREAMS`,
            subject: substrate.title,
            detail: substrate.note,
          }
        : {
            kicker: `ESTATE / ${lens.toUpperCase()} LENS`,
            subject: substrate.title,
            detail: LENS_LINES[lens],
          };

  const L = layout;
  const relBox = (b: Box) => ({ x: -b.w / 2, y: -b.h / 2, w: b.w, h: b.h });

  return (
    <div className="iml" data-range={depth} data-lens={lens}>
      {/* ══ HEAD · 36px ═════════════════════════════════════════════ */}
      <div className="iml__head">
        <div className="iml__ident">
          <span className="iml__title">
            INTELLIGENCE FIELD<b>SEMANTIC RANGE / LIVE</b>
          </span>
        </div>
        <p className="iml__status" aria-live="polite">
          <span>
            RANGE <b>{range.ord}</b> / {range.name}
          </span>
          <span>
            TARGET <b>{work.id}</b>
            {depth > 0 ? (
              <>
                {" · "}TRACE <b>{substrate.id}</b>
              </>
            ) : null}
            {depth === 2 ? (
              <>
                {" · "}LENS <b>{lens.toUpperCase()}</b>
              </>
            ) : null}
          </span>
        </p>
      </div>

      <p className="iml__hint">{RANGE_HINTS[depth]}</p>

      {/* ══ FIELD ══════════════════════════════════════════════════ */}
      <div className="iml__field">
        <div
          className="imf"
          ref={rootRef}
          data-range={depth}
          data-lens={lens}
          data-auto={autoRunning || undefined}
        >
          {L ? (
            <>
              <svg
                className="imf__svg"
                viewBox={`0 0 ${r2(L.w)} ${r2(L.h)}`}
                width={r2(L.w)}
                height={r2(L.h)}
                aria-hidden="true"
                focusable="false"
              >
                {/* ── The frame: a chamfered rectangle, and the only boundary
                       the field has. ─────────────────────────────────────── */}
                <path className="imf-frame" d={chamfer(L.frame, FRAME_CHAMFER)} />

                {/* ── The graticule. Cells, not a rosette. Both axis families
                       are always drawn; the LENS decides which one is lit. ── */}
                <g className="imf-plot">
                  {(depth === 1 ? L.gridVTrace : L.gridV).map((d, i) => (
                    <path
                      className="imf-grid"
                      key={`v${i}`}
                      d={d}
                      data-on={
                        depth === 2 && lens === "allocation" && i === TIER_COLS.indexOf(work.tier)
                          ? ""
                          : undefined
                      }
                    />
                  ))}
                  {(depth === 1 ? L.gridHTrace : L.gridH).map((d, i) => (
                    <path
                      className="imf-grid"
                      key={`h${i}`}
                      d={d}
                      data-on={
                        depth === 2 && lens === "team" && i - 1 === TEAMS.indexOf(work.team)
                          ? ""
                          : undefined
                      }
                    />
                  ))}
                </g>

                {/* ── The bottom tick ruler. What makes the plot a scale. ── */}
                <g className="imf-ruler">
                  {L.ticks.map((t, i) => (
                    <path
                      className={t.major ? "imf-tick imf-tick--maj" : "imf-tick"}
                      key={i}
                      d={t.d}
                    />
                  ))}
                </g>

                <path className="imf-busrail" d={L.bus.rail} />

                {/* ── Edges: runs at range 01, traces at 02. ─────────────── */}
                <g className="imf-edges">
                  {L.stations.map((s) => (
                    <path className="imf-run" key={s.key} data-edge={`run:${s.key}`} />
                  ))}
                  {L.stations.map((s) => (
                    <path className="imf-joint" key={`j${s.key}`} data-edge={`joint:${s.key}`} />
                  ))}
                  {TRACE_PAIRS.map((p) => (
                    <path className="imf-trace" key={p.key} data-edge={`trace:${p.key}`} />
                  ))}
                </g>

                {/* ══ NODES — rendered ONCE, positioned imperatively, never
                       remounted. Every path is authored about its own origin. */}
                <g className="imf-nodes">
                  {WORKS.map((w) => (
                    <g
                      className="imf-work"
                      key={w.id}
                      data-node={`work:${w.id}`}
                      data-sel={w.id === workId || undefined}
                      data-pulse={pulseId === w.id || undefined}
                    >
                      {/* The core plate — range 01 only. */}
                      <g className="imf-work__core">
                        <path className="imf-corebox" d={chamfer(relBox(L.core), 10)} />
                        <path className="imf-coreinner" d={chamfer(relBox(L.coreInner), 7)} />
                        {/* THE FINGERPRINT, ANGULAR: six ticks on the plate's
                            edges where the six runs attach — the component
                            signature, without a ring of dots. */}
                        {L.stations.map((s, i) => {
                          const slot = Math.floor(i / 2);
                          const y = r2(-L.core.h / 2 + (L.core.h * (slot + 0.5)) / 3);
                          const x = s.side === "l" ? -L.core.w / 2 : L.core.w / 2;
                          const dir = s.side === "l" ? -1 : 1;
                          return (
                            <path
                              className="imf-fp"
                              key={s.key}
                              d={`M${r2(x)} ${y}L${r2(x + dir * 8)} ${y}`}
                            />
                          );
                        })}
                      </g>

                      {/* The plot mark — a diamond at the exact coordinate, in a
                          square lock when selected. */}
                      <g className="imf-work__mark">
                        <path className="imf-mark" d={diamond(0, 0, MARK.work)} />
                        {brackets(
                          {
                            x: -MARK.workSel - 3,
                            y: -MARK.workSel - 3,
                            w: (MARK.workSel + 3) * 2,
                            h: (MARK.workSel + 3) * 2,
                          },
                          6
                        ).map((d, i) => (
                          <path className="imf-lock" key={i} d={d} />
                        ))}
                      </g>

                      <rect
                        className="imf-hit"
                        x={-14}
                        y={-14}
                        width={28}
                        height={28}
                        onClick={() => selectWork(w.id)}
                      />
                    </g>
                  ))}

                  {L.stations.map((s) => (
                    <g className="imf-station" key={s.key} data-node={`component:${s.key}`}>
                      <path className="imf-stationbox" d={chamfer(relBox(s.box), 6)} />
                      <path
                        className="imf-pin"
                        d={diamond(s.side === "l" ? s.box.w / 2 : -s.box.w / 2, 0, MARK.pin)}
                      />
                    </g>
                  ))}

                  {SUBSTRATES.map((sub) => {
                    const b = L.bus.boxes.get(sub.id)!;
                    return (
                      <g
                        className="imf-sub"
                        key={sub.id}
                        data-node={`substrate:${sub.id}`}
                        data-sel={sub.id === subId || undefined}
                      >
                        <path className="imf-busbox" d={chamfer(relBox(b), 6)} />
                        <path className="imf-buspin" d={diamond(0, -b.h / 2 - 7, MARK.joint)} />
                        {brackets(relBox(b), LOCK_LEN).map((d, i) => (
                          <path className="imf-lock imf-lock--bus" key={i} d={d} />
                        ))}
                        <rect
                          className="imf-hit"
                          x={-b.w / 2}
                          y={-b.h / 2}
                          width={b.w}
                          height={b.h}
                          onClick={() => selectSubstrate(sub.id)}
                        />
                      </g>
                    );
                  })}
                </g>
              </svg>

              {/* ══ THE LABEL LAYER — every string at real px, in the same
                     coordinate space, positioned in the same rAF tick. ═════ */}

              {/* His BAR line is NOT in the core: at the 12px readable floor it
                  is 260px, and the target readout publishes it whole. */}
              <span
                className="imf-core__code"
                data-node-label="core"
                data-ox={0}
                data-oy={-L.core.h / 2 + 17}
              >
                {work.id} / WORK
              </span>
              <span className="imf-core__title" data-node-label="core" data-ox={0} data-oy={0}>
                {work.title}
              </span>
              <span
                className="imf-core__mode"
                data-node-label="core"
                data-ox={0}
                data-oy={L.core.h / 2 - 17}
              >
                {work.mode} / {work.tier}
              </span>

              {/* ── The eight work identities. ─────────────────────────── */}
              {WORKS.map((w) => (
                <button
                  type="button"
                  className="imf-ident"
                  key={w.id}
                  data-node-label={`ident:${w.id}`}
                  data-sel={w.id === workId || undefined}
                  data-trace={w.substrates.includes(substrate.id) || undefined}
                  style={{ width: `${L.labelW}px` }}
                  onClick={() => selectWork(w.id)}
                  aria-label={`${w.title} — ${w.team}, ${w.tier}, ${w.mode}`}
                >
                  <b>{w.title}</b>
                  <em>{nodeMeta(w, depth, lens)}</em>
                </button>
              ))}

              {/* ── The six stations · a label line over a value box. ──── */}
              {L.stations.map((s) => {
                const entry = work.components[s.key as ComponentKey];
                return (
                  <div
                    className="imf-comp"
                    key={s.key}
                    data-node-label={`component:${s.key}`}
                    data-ox={-s.box.w / 2}
                    data-oy={-s.box.h / 2}
                    style={{ width: `${s.box.w}px`, height: `${s.box.h}px` }}
                  >
                    <span className="imf-comp__code">
                      {s.code} / {s.label}
                    </span>
                    <b className="imf-comp__value">{entry[0]}</b>
                    <em className="imf-comp__note">{entry[1]}</em>
                  </div>
                );
              })}

              {/* ── The substrate bus contents. ────────────────────────── */}
              {SUBSTRATES.map((sub) => {
                const b = L.bus.boxes.get(sub.id)!;
                return (
                  <div
                    className="imf-sub__label"
                    key={sub.id}
                    data-node-label={`substrate:${sub.id}`}
                    data-ox={-b.w / 2}
                    data-oy={-b.h / 2}
                    data-sel={sub.id === subId || undefined}
                    style={{ width: `${b.w}px`, height: `${b.h}px` }}
                  >
                    <span>{sub.id}</span>
                    <b>{sub.title}</b>
                  </div>
                );
              })}

              {/* ── The axis names. Static: the graticule does not move. ── */}
              {/* THE X AXIS · the four capability lanes, named under their
                     columns. These ARE the ruler's numerals: a scale whose stops
                     are named beats a scale with invented figures beside it. */}
              {L.tierLabels.map((t) => (
                <span
                  className="imf-tier"
                  key={t.tier}
                  style={{ left: `${t.at.x}px`, top: `${t.at.y}px`, width: `${t.w}px` }}
                  data-on={t.tier === work.tier || undefined}
                >
                  {t.tier}
                </span>
              ))}
              {/* THE Y AXIS · the seven teams, beside their rows, on the
                     hand-wrapped display lines the fixtures carry. */}
              {(depth === 1 ? L.teamLabelsTrace : L.teamLabels).map((t) => (
                <span
                  className="imf-team"
                  key={t.team}
                  style={{ left: `${t.at.x}px`, top: `${t.at.y}px` }}
                  data-on={t.team === work.team || undefined}
                >
                  {TEAM_LABEL_LINES[t.team].map((line) => (
                    <i key={line}>{line}</i>
                  ))}
                </span>
              ))}

              {/* ── Corner readouts, pinned INSIDE the frame. ──────────── */}
              <div
                className="imf-readout"
                style={{ left: `${L.readout.x}px`, top: `${L.readout.y}px` }}
              >
                <span className="imf-readout__kicker">{readout.kicker}</span>
                <strong className="imf-readout__subject">{readout.subject}</strong>
                <span className="imf-readout__detail">{readout.detail}</span>
              </div>

              <span
                className="imf-corner imf-corner--bl"
                style={{ left: `${L.cornerBL.x}px`, top: `${L.cornerBL.y}px` }}
              >
                FIELD / 046
              </span>
              <span
                className="imf-corner imf-corner--br"
                style={{ left: `${L.cornerBR.x}px`, top: `${L.cornerBR.y}px` }}
              >
                LOCAL / 0.10
              </span>

              <p className="imf-auto" aria-hidden={!autoRunning}>
                AUTO TRACE / GUIDED SIGNAL — MOVE POINTER TO TAKE CONTROL
              </p>

              {/* ── The depth scale · three diamond detents. ───────────── */}
              <nav className="imf-depth" aria-label="Semantic range">
                {RANGES.map((r) => (
                  <button
                    type="button"
                    className="imf-depth__btn"
                    key={r.depth}
                    data-on={r.depth === depth || undefined}
                    onClick={() => setDepth(r.depth)}
                    aria-current={r.depth === depth}
                  >
                    <b>{r.name}</b>
                    <em>
                      {r.sub.map((line) => (
                        <span key={line}>{line}</span>
                      ))}
                    </em>
                  </button>
                ))}
              </nav>

              {/* ── The lens control · two buttons, no track. ──────────── */}
              <div className="imf-lens" aria-label="Estate lens">
                {(["team", "allocation"] as const).map((option) => (
                  <button
                    type="button"
                    className="imf-lens__btn"
                    key={option}
                    data-on={option === lens || undefined}
                    onClick={() => setLens(option)}
                    tabIndex={depth === 2 ? 0 : -1}
                  >
                    {option.toUpperCase()}
                  </button>
                ))}
              </div>

              <i className="imf-sweep" key={sweepKey} aria-hidden="true" />
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
