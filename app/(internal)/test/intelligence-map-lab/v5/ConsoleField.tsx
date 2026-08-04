"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

import { WORKS, WORK_BY_ID, type ComponentKey, type ImapWork } from "../imapData";
import {
  COMPLEXITY,
  CONTRACT,
  FLOW_BANDS,
  LANE_AGGREGATE,
  LEGEND,
  LEVELS,
  MODULES,
  STREAMS,
  VIEWS,
  flowBand,
  type Level,
  type View,
} from "./consoleFixture";
import {
  MARK,
  buildConsole,
  diamond,
  parkSeat,
  r2,
  type Box,
  type ConsoleLayout,
} from "./consoleLayout";

/**
 * ConsoleField — variant v5. THE THREE-LEVEL CONSOLE.
 *
 * ══ WHAT THIS FIXES ══════════════════════════════════════════════════════
 * His console v3 had four ranges and four DIFFERENT layouts, so scrolling read
 * as four slides rather than as one zoom — "discombobulated when people scroll
 * through". Here there is ONE architecture and three depths of it:
 *
 *   L1  01 WORKSTREAMS   THE MAP OF WORK          all eight, as chips
 *   L2  02 CONFIGURATION WHAT RUNS IT             one chip, expanded
 *   L3  03 OPERATION     WHAT RUNS THROUGH IT     the same, energized
 *
 * ══ THE CONTINUITY IS ONE DOM NODE ═══════════════════════════════════════
 * A chip does not fade out while a master plate fades in — THE CHIP IS THE
 * MASTER PLATE. Every workstream owns one `.imc-chip` element, keyed by its work
 * id, mounted once and never remounted. A level change rewrites its `transform`,
 * `width` and `height` from the kernel and the browser interpolates; its three
 * content faces (chip / master / parked stub) cross-fade inside it. The six PINS
 * travel with it, from a stub row on the chip's shoulder to a column on the
 * master plate's right edge, and each pin is where its wire starts — so the six
 * stubs of L1 visibly EXTEND into the six runs of L2. The other seven chips park
 * on the bottom rail keeping their code and their pins.
 *
 * ══ VIEWS ARE NOT LEVELS ═════════════════════════════════════════════════
 * His correction, taken literally: BY TEAM / BY SUBSTRATE / BY ALLOCATION regroup
 * the same eight chips at L1 and do not exist at L2 or L3. `V` and `L` do nothing
 * once you are inside a workstream, because there is nothing there to organise.
 *
 * ══ L3 IS FLOW, NOT A PRICE ══════════════════════════════════════════════
 * The open question his round-5 note left was what the third level even is.
 * Consumption cannot be a level and must never be a label: it is what runs
 * THROUGH the configuration, read against the workload. So L3 adds discrete dot
 * flow on the existing wires at a density band taken from the workstream's
 * relative draw, a workload register (cadence, input mass, complexity class, and
 * why this intelligence), a proof strip on EVALS, a checkpoint gate on PERSON —
 * and moves nothing. The register's height is RESERVED at L2 for exactly that
 * reason, and the two L3 card overlays live in a reserved card foot.
 */

const CONFIG_LINE = "SIX MODULES WIRED INTO ONE WORKSTREAM · THE WORK IS THE UNIT";
const AUTO_LINE = "AUTO TOUR / MOVE POINTER TO TAKE CONTROL";

export interface ConsoleView {
  level: Level;
  work: string;
  view: View;
}

interface Props {
  initial: ConsoleView;
  autoplay: boolean;
  onView: (next: ConsoleView) => void;
}

export function ConsoleField({ initial, autoplay, onView }: Props) {
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [level, setLevelState] = useState<Level>(initial.level);
  const [work, setWork] = useState(initial.work);
  const [view, setViewState] = useState<View>(initial.view);
  const [hover, setHover] = useState<string | null>(null);
  const [pulsed, setPulsed] = useState<string | null>(null);
  const [sweep, setSweep] = useState(0);
  const [auto, setAuto] = useState(autoplay);

  const autoRef = useRef(autoplay);
  const timers = useRef<number[]>([]);
  const wheel = useRef({ accum: 0, lock: false });

  /* ── The measured box. The kernel's only input, so the geometry cannot be
        wrong at an aspect nobody screenshotted. ─────────────────────────── */
  useEffect(() => {
    const el = fieldRef.current;
    if (!el) return;
    const read = () => {
      const r = el.getBoundingClientRect();
      setBox({ w: Math.round(r.width), h: Math.round(r.height) });
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const L = useMemo(
    () => (box.w > 60 && box.h > 60 ? buildConsole(box.w, box.h) : null),
    [box.w, box.h]
  );

  const stopAuto = useCallback(() => {
    if (!autoRef.current) return;
    autoRef.current = false;
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    setAuto(false);
    setPulsed(null);
  }, []);

  const setLevel = useCallback(
    (next: Level, opts?: { auto?: boolean }) => {
      if (!opts?.auto) stopAuto();
      setLevelState((prev) => {
        if (prev === next) return prev;
        setSweep((s) => s + 1);
        return next;
      });
    },
    [stopAuto]
  );

  const setView = useCallback(
    (next: View, opts?: { auto?: boolean }) => {
      if (!opts?.auto) stopAuto();
      setViewState((prev) => {
        if (prev === next) return prev;
        setSweep((s) => s + 1);
        return next;
      });
    },
    [stopAuto]
  );

  /* HIS CLICK SEMANTICS. At L1 a chip OPENS (and the chip becomes the master
     plate on the way in). At L2/L3 the master plate zooms back OUT and a parked
     chip swaps the subject without changing level — so the parked stack is a
     selector, not a decoration. */
  const clickChip = useCallback(
    (id: string, opts?: { auto?: boolean }) => {
      if (!opts?.auto) stopAuto();
      setPulsed(null);
      if (level === 0) {
        setWork(id);
        setSweep((s) => s + 1);
        setLevelState(1);
        return;
      }
      if (id === work) {
        setSweep((s) => s + 1);
        setLevelState(0);
        return;
      }
      setWork(id);
    },
    [level, work, stopAuto]
  );

  /* Publish once per settled state, never inside a setter — a URL write is a
     side effect and belongs after the render that changed. */
  useEffect(() => {
    onView({ level, work, view });
  }, [level, work, view, onView]);

  /* ── The guided tour: L1 → view sweep → BRAND COPY → L2 → L3. It plays on
        load and ANY interaction takes it away for good. ──────────────────── */
  useEffect(() => {
    if (!autoplay) return;
    /* The tour's click cannot go through `clickChip` — that closure captures the
       level it was built at, and re-running this effect on every level change
       would restart the tour. It writes the same pair the L1 click writes. */
    const clickChipAuto = (id: string) => {
      setPulsed(null);
      setWork(id);
      setSweep((s) => s + 1);
      setLevelState(1);
    };
    const finish = () => {
      autoRef.current = false;
      setAuto(false);
    };
    /* REDUCED MOTION GETS NO TOUR — and the cancel is QUEUED rather than called
       in the effect body, so the mount does not cascade a second render. */
    const steps: [number, () => void][] = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches
      ? [[0, finish]]
      : [
          [1500, () => setView("substrate", { auto: true })],
          [3100, () => setView("allocation", { auto: true })],
          [4700, () => setView("team", { auto: true })],
          [5900, () => setPulsed("W05")],
          [7100, () => clickChipAuto("W05")],
          [9100, () => setLevel(2, { auto: true })],
          [11600, finish],
        ];
    steps.forEach(([at, run]) => {
      timers.current.push(
        window.setTimeout(() => {
          if (autoRef.current) run();
        }, at)
      );
    });
    return () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current = [];
    };
  }, [autoplay, setLevel, setView]);

  /* ── Wheel over the field zooms between levels — his accumulator and his
        lock, so one flick is one level. ─────────────────────────────────── */
  useEffect(() => {
    const el = fieldRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      stopAuto();
      if (wheel.current.lock) return;
      wheel.current.accum += e.deltaY;
      if (Math.abs(wheel.current.accum) < 70) return;
      const dir = wheel.current.accum > 0 ? 1 : -1;
      wheel.current.accum = 0;
      wheel.current.lock = true;
      window.setTimeout(() => {
        wheel.current.lock = false;
      }, 620);
      setLevel(clampLevel(level + dir));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [level, setLevel, stopAuto]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (/^[1-3]$/.test(e.key)) return setLevel((Number(e.key) - 1) as Level);
      if (e.key === "+" || e.key === "=") return setLevel(clampLevel(level - 1));
      if (e.key === "-" || e.key === "_") return setLevel(clampLevel(level + 1));
      if (e.key === "Escape") return setLevel(clampLevel(level - 1));
      /* VIEWS ONLY EXIST AT L1, so `v` and `l` are inert once you are inside a
         workstream. That inertness is the design, not a missing feature. */
      if ((k === "v" || k === "l") && level === 0) {
        const i = VIEWS.findIndex((v) => v.id === view);
        return setView(VIEWS[(i + 1) % VIEWS.length].id);
      }
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        const i = WORKS.findIndex((w) => w.id === work);
        const next = (i + (e.key === "ArrowRight" ? 1 : WORKS.length - 1)) % WORKS.length;
        stopAuto();
        setWork(WORKS[next].id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [level, view, work, setLevel, setView, stopAuto]);

  useEffect(() => {
    const el = fieldRef.current;
    if (!el) return;
    const kill = () => stopAuto();
    el.addEventListener("pointerdown", kill, { passive: true });
    el.addEventListener("pointermove", kill, { passive: true, once: true });
    return () => {
      el.removeEventListener("pointerdown", kill);
      el.removeEventListener("pointermove", kill);
    };
  }, [stopAuto]);

  const target = WORK_BY_ID.get(work) ?? WORKS[0];
  const stream = STREAMS[target.id];
  const spec = LEVELS[level];
  const viewSpec = VIEWS.find((v) => v.id === view) ?? VIEWS[0];
  const band = flowBand(stream.load);

  return (
    <div className="iml">
      <div className="iml__head">
        <div className="iml__ident">
          <span className="iml__title">
            WORK-TO-INTELLIGENCE CONSOLE <b>THREE LEVELS</b>
          </span>
        </div>
        <p className="iml__status">
          <span>
            LEVEL{" "}
            <b>
              {spec.ord} {spec.name}
            </b>
          </span>
          <span>
            {level === 0 ? "VIEW" : "WORKSTREAM"}{" "}
            <b>{level === 0 ? viewSpec.label : `${target.id} / ${stream.name}`}</b>
          </span>
        </p>
      </div>

      <p className="iml__hint">{spec.hint}</p>

      <div className="iml__field" ref={fieldRef}>
        <div className="imc" data-level={level} data-view={view} data-auto={auto || undefined}>
          {L ? (
            <>
              <Geometry L={L} work={target} hover={hover} band={band} />

              {/* ── The persistent chips. ONE element per workstream. ──── */}
              {WORKS.map((wk) => (
                <Chip
                  key={wk.id}
                  L={L}
                  work={wk}
                  level={level}
                  view={view}
                  selectedId={target.id}
                  pulsed={pulsed === wk.id}
                  onSelect={() => clickChip(wk.id)}
                  onHover={setHover}
                />
              ))}

              {/* ── The six modules. They belong to L2/L3; at L1 they ARE the
                     chip's six pins, which is the whole continuity claim. ── */}
              {MODULES.map((mod, i) => (
                <ModuleCard key={mod.key} L={L} index={i} mod={mod} work={target} level={level} />
              ))}

              <RailLabels L={L} level={level} view={view} work={target} hover={hover} />

              <WorkloadRegister L={L} work={target} level={level} />
              <ContractRail L={L} work={target} level={level} />
              <TargetStrip L={L} work={target} level={level} />
              <ViewSwitch L={L} view={view} level={level} onPick={setView} />
              <LevelRail L={L} level={level} onPick={setLevel} />

              <p className="imc-note" data-auto={auto || undefined} style={bandStyle(L.bot)}>
                {auto
                  ? AUTO_LINE
                  : level === 0
                    ? viewSpec.line
                    : level === 1
                      ? CONFIG_LINE
                      : LEGEND}
              </p>

              {sweep > 0 ? <i className="imc-sweep" key={sweep} aria-hidden="true" /> : null}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

const clampLevel = (v: number): Level => (v < 0 ? 0 : v > 2 ? 2 : (v as Level));

const bandStyle = (b: Box): CSSProperties => ({
  left: b.x,
  top: b.y,
  width: b.w,
  height: b.h,
});

const boxStyle = (b: Box): CSSProperties => ({
  transform: `translate(${b.x}px, ${b.y}px)`,
  width: b.w,
  height: b.h,
});

/* ══ The geometry layer ═══════════════════════════════════════════════════
   SVG carries LINES AND MARKS ONLY. Every readable string is HTML at real px in
   the layer above, which is round 3's lesson: `<text>` inside a scaled viewBox
   falls under the type floors at the panel sizes that matter. ══════════════ */

function Geometry({
  L,
  work,
  hover,
  band,
}: {
  L: ConsoleLayout;
  work: ImapWork;
  hover: string | null;
  band: number;
}) {
  const lit = hover ?? work.id;
  const litWork = WORK_BY_ID.get(lit) ?? work;

  return (
    <svg
      className="imc__svg"
      width={L.w}
      height={L.h}
      viewBox={`0 0 ${L.w} ${L.h}`}
      aria-hidden="true"
    >
      <path className="imc-frame" d={L.boardPath} />

      {/* ── L1 · BY TEAM ─────────────────────────────────────────────── */}
      <g className="imc-g imc-g--team">
        {L.teamRails.map((rail) => (
          <g key={rail.team} data-on={rail.team === litWork.team || undefined}>
            <path className="imc-rail" d={`M ${rail.x0} ${rail.y} H ${rail.x1}`} />
            {WORKS.filter((w) => w.team === rail.team).map((w) => {
              const seat = L.seats.team[w.id];
              if (!seat) return null;
              return (
                <g key={w.id} data-on={w.id === lit || undefined}>
                  <path className="imc-junction" d={diamond(seat.x, rail.y, MARK.junction)} />
                  <path
                    className="imc-junction"
                    d={diamond(seat.x + seat.w, rail.y, MARK.junction)}
                  />
                </g>
              );
            })}
          </g>
        ))}
      </g>

      {/* ── L1 · BY SUBSTRATE ────────────────────────────────────────── */}
      <g className="imc-g imc-g--substrate">
        {L.subRails.map((rail) => (
          <path
            key={rail.id}
            className="imc-rail imc-rail--sub"
            data-band={rail.band}
            data-on={litWork.substrates.includes(rail.id) || undefined}
            d={`M ${rail.x0} ${rail.y} H ${rail.x1}`}
          />
        ))}
        {WORKS.map((w) => {
          const seat = L.seats.substrate[w.id];
          const lane = L.subLanes[w.id];
          if (!seat) return null;
          const cy = r2(seat.y + seat.h / 2);
          const used = L.subRails.filter((r) => w.substrates.includes(r.id));
          if (!used.length) return null;
          const ys = [cy, ...used.map((r) => r.y)];
          return (
            <g key={w.id} data-on={w.id === lit || undefined}>
              <path
                className="imc-trace"
                d={`M ${r2(seat.x + seat.w)} ${cy} H ${lane} M ${lane} ${r2(Math.min(...ys))} V ${r2(Math.max(...ys))}`}
              />
              <path className="imc-joint" d={diamond(lane, cy, MARK.joint)} />
              {used.map((r) => (
                <path
                  key={r.id}
                  className="imc-junction imc-junction--used"
                  d={diamond(lane, r.y, MARK.jUsed)}
                />
              ))}
            </g>
          );
        })}
      </g>

      {/* ── L1 · BY ALLOCATION · the dot-matrix density strips ───────── */}
      <g className="imc-g imc-g--allocation">
        {L.allocLanes.map((lane) => (
          <g key={lane.tier}>
            <path
              className="imc-rail imc-rail--lane"
              d={`M ${L.work.x} ${r2(lane.strip.y + lane.strip.h + 5)} H ${r2(L.work.x + L.work.w)}`}
            />
            <DotMatrix box={lane.strip} fill={LANE_AGGREGATE[lane.tier].load} />
          </g>
        ))}
      </g>

      {/* ── L2 / L3 · the runs ───────────────────────────────────────── */}
      <g className="imc-g imc-g--switch">
        {L.wires.map((wire) => (
          <g key={wire.key}>
            <path
              className="imc-wire"
              d={wire.d}
              style={{ "--imc-len": wire.len } as CSSProperties}
            />
            <path
              className="imc-flow"
              d={wire.d}
              data-rev={wire.reverse || undefined}
              style={{ strokeDasharray: FLOW_BANDS[band].dash }}
            />
            {wire.joints.map((j, i) => (
              <path key={i} className="imc-joint" d={diamond(j.x, j.y, MARK.joint)} />
            ))}
            {wire.key === "human" ? (
              <path className="imc-gate" d={diamond(wire.joints[1].x, wire.joints[1].y, 6)} />
            ) : null}
          </g>
        ))}
      </g>
    </svg>
  );
}

function DotMatrix({ box, fill }: { box: Box; fill: number }) {
  const cols = 14;
  const rows = 3;
  const on = Math.round((cols * rows * fill) / 100);
  const dx = box.w / cols;
  const dy = box.h / rows;
  const dots: { d: string; on: boolean }[] = [];
  for (let c = 0; c < cols; c += 1) {
    for (let r = 0; r < rows; r += 1) {
      dots.push({
        d: diamond(r2(box.x + dx * (c + 0.5)), r2(box.y + dy * (r + 0.5)), 1.9),
        on: c * rows + r < on,
      });
    }
  }
  return (
    <g className="imc-dots">
      {dots.map((dot, i) => (
        <path key={i} className="imc-dot" data-on={dot.on || undefined} d={dot.d} />
      ))}
    </g>
  );
}

/* ══ The chip — chip, master plate and parked stub in ONE element ═════════ */

function Chip({
  L,
  work,
  level,
  view,
  selectedId,
  pulsed,
  onSelect,
  onHover,
}: {
  L: ConsoleLayout;
  work: ImapWork;
  level: Level;
  view: View;
  selectedId: string;
  pulsed: boolean;
  onSelect: () => void;
  onHover: (id: string | null) => void;
}) {
  const stream = STREAMS[work.id];
  const selected = work.id === selectedId;
  const face: "chip" | "master" | "stub" = level === 0 ? "chip" : selected ? "master" : "stub";
  const seat =
    face === "chip"
      ? (L.seats[view][work.id] ?? L.master)
      : face === "master"
        ? L.master
        : parkSeat(L, work.id, selectedId);
  const pins = face === "master" ? L.masterPins : face === "stub" ? L.parkPins : L.chipPins;

  return (
    <button
      type="button"
      className="imc-chip"
      data-face={face}
      data-sel={selected || undefined}
      data-pulse={pulsed || undefined}
      style={boxStyle(seat)}
      onClick={onSelect}
      onMouseEnter={() => onHover(work.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(work.id)}
      onBlur={() => onHover(null)}
      aria-label={`${work.id} ${stream.name}`}
    >
      <span className="imc-plate" aria-hidden="true" />

      {/* Face 1 · the chip. THE THIRD LINE IS WHAT THIS VIEW DOES NOT ORGANISE
          BY: printing the team again on a team rail is the duplicate taxonomy the
          proof rules warn about, so BY TEAM shows the capability lane instead and
          the other two views show the team. Same chip, same shape, no repeat. */}
      <span className="imc-chip__face imc-chip__face--chip">
        <span className="imc-chip__code">{work.id}</span>
        <span className="imc-chip__name">{stream.name}</span>
        <span className="imc-chip__team">{view === "team" ? `${work.tier} LANE` : work.team}</span>
      </span>

      {/* Face 2 · the master plate */}
      <span className="imc-chip__face imc-chip__face--master">
        {/* `W02 / WORKSTREAM` + `FRONTIER` measured 155px against the master's
            137px inner measure. The word WORKSTREAM is already on the level rail
            and the title below IS the workstream, so the code line carries the
            id and the capability lane instead. */}
        <span className="imc-chip__code">
          {work.id}
          <em>{work.tier} LANE</em>
        </span>
        <span className="imc-chip__title">{stream.name}</span>
        <span className="imc-chip__barlabel">BAR</span>
        <span className="imc-chip__bar">{work.bar}</span>
      </span>

      {/* Face 3 · the parked stub */}
      <span className="imc-chip__face imc-chip__face--stub">
        <span className="imc-chip__code">{work.id}</span>
      </span>

      {/* THE LOCK RIDES INSIDE THE PLATE. Four corner brackets as HTML rather
          than an SVG path, because an SVG bracket recomputed per render would
          JUMP to the new seat while the plate was still travelling to it — the
          one mark that proves the chip and the master are the same object has to
          animate with the object. */}
      <span className="imc-chip__lock" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>

      {/* The six pins travel between the faces. */}
      <span className="imc-pins" aria-hidden="true">
        {MODULES.map((mod, i) => (
          <i
            key={mod.key}
            className="imc-pin"
            style={{ left: pins[i].x, top: pins[i].y }}
            data-face={face}
          />
        ))}
      </span>
    </button>
  );
}

/* ══ The module cards ════════════════════════════════════════════════════ */

function ModuleCard({
  L,
  index,
  mod,
  work,
  level,
}: {
  L: ConsoleLayout;
  index: number;
  mod: (typeof MODULES)[number];
  work: ImapWork;
  level: Level;
}) {
  const [value, note] = work.components[mod.key as ComponentKey];
  const stream = STREAMS[work.id];
  const box = L.cards[mod.key];

  return (
    <article
      className="imc-card"
      data-key={mod.key}
      data-on={level > 0 || undefined}
      style={{ ...boxStyle(box), transitionDelay: `${60 + index * 40}ms` }}
    >
      <span className="imc-plate" aria-hidden="true" />
      {/* HIS CARD HAS THE ROLE TOP-RIGHT AT 6PX. At the 9px floor `C / CONTEXT`
          plus `LOCAL GROUNDING` measures 163px against a 117px card measure, so
          the role takes its own line, right-aligned. The card has the height:
          91px against 82px of content including L3's reserved foot. */}
      <span className="imc-card__head">
        <span className="imc-card__code">
          {mod.code} / {mod.label}
        </span>
        <span className="imc-card__role">{mod.role}</span>
      </span>
      <span className="imc-card__value">{value}</span>
      <span className="imc-card__note">{note}</span>

      {/* L3 overlays. They sit in the card's RESERVED foot, so nothing moves. */}
      {/* THE PROOF STRIP CARRIES VERDICTS ONLY. The eval count is already this
          card's value, and printing it again beside six glyphs wrapped it to two
          lines against the 103px card measure. Filled = cleared the bar, hollow =
          flagged and escalated to the human checkpoint. */}
      {mod.key === "eval" ? (
        <span className="imc-card__proof" data-on={level === 2 || undefined}>
          <em>LAST 6</em>
          <i className="imc-verdicts" aria-hidden="true">
            {stream.verdicts.map((v, i) => (
              <b key={i} data-pass={v || undefined} />
            ))}
          </i>
        </span>
      ) : null}
      {mod.key === "human" ? (
        <span className="imc-card__check" data-on={level === 2 || undefined}>
          HUMAN CHECKPOINT
        </span>
      ) : null}
    </article>
  );
}

/* ══ The label layer ═════════════════════════════════════════════════════
   HTML AT REAL PX, in the same coordinate space the SVG uses. That is round 3's
   lesson and it is why the rails carry readable names at 9px instead of `<text>`
   that shrinks with the viewBox. A rail with no name is a decoration. ═══════ */

function RailLabels({
  L,
  level,
  view,
  work,
  hover,
}: {
  L: ConsoleLayout;
  level: Level;
  view: View;
  work: ImapWork;
  hover: string | null;
}) {
  const lit = WORK_BY_ID.get(hover ?? work.id) ?? work;
  const on = (want: View) => (level === 0 && view === want) || undefined;

  return (
    <div className="imc-labels" aria-hidden="true">
      {L.teamRails.map((rail) => (
        <span key={rail.team}>
          <span
            className="imc-tlabel"
            data-on={on("team")}
            data-lit={rail.team === lit.team || undefined}
            style={{ left: rail.labelX, top: rail.labelY }}
          >
            {rail.lines.map((line) => (
              <b key={line}>{line}</b>
            ))}
          </span>
          {/* A TERMINATOR, not decoration: a team rail runs 300px past its last
              chip, and a bare count on a void backing closes it and says how many
              workstreams the team owns. */}
          <span
            className="imc-tcount"
            data-on={on("team")}
            data-lit={rail.team === lit.team || undefined}
            style={{ left: rail.x1, top: rail.y }}
          >
            <b>{String(rail.count).padStart(2, "0")}</b>
          </span>
        </span>
      ))}

      {L.subRails.map((rail) => (
        <span
          key={rail.id}
          className="imc-slabel"
          data-on={on("substrate")}
          data-lit={lit.substrates.includes(rail.id) || undefined}
          style={{ left: rail.labelX, top: rail.labelY }}
        >
          <i>
            {rail.id}
            <em>{String(rail.count).padStart(2, "0")}</em>
          </i>
          {rail.lines.map((line) => (
            <b key={line}>{line}</b>
          ))}
        </span>
      ))}

      {L.allocLanes.map((lane) => (
        <span
          key={lane.tier}
          className="imc-lane"
          data-on={on("allocation")}
          data-lit={lane.tier === lit.tier || undefined}
          style={{ left: lane.headX, top: lane.headY, width: L.work.w }}
        >
          <b>{lane.tier}</b>
          <em style={{ marginLeft: lane.strip.x - lane.headX + lane.strip.w + 10 }}>
            {LANE_AGGREGATE[lane.tier].band} DRAW
          </em>
          <i>{String(lane.count).padStart(2, "0")}</i>
        </span>
      ))}
    </div>
  );
}

/* ══ The workload register — L3's answer, reserved at L2 ═════════════════ */

function WorkloadRegister({ L, work, level }: { L: ConsoleLayout; work: ImapWork; level: Level }) {
  const stream = STREAMS[work.id];
  return (
    <section
      className="imc-panel imc-panel--load"
      data-on={level > 0 || undefined}
      data-live={level === 2 || undefined}
      style={boxStyle(L.register)}
    >
      <span className="imc-plate" aria-hidden="true" />
      <h4 className="imc-panel__label">
        WORKLOAD<em>{level === 2 ? stream.band : "IDLE"}</em>
      </h4>
      {/* A LABELLED ROW THAT WRAPS, not a `dt`/`dd` pair on two lines each:
          `INPUT MASS` plus `HIGH VOLUME · SHORT ITEMS` is 166px against a 137px
          measure, so a two-column register cannot exist here — but a flowing
          row with a gold label reads as a register and costs one line when it
          fits and two when it does not. */}
      <div className="imc-load">
        <p className="imc-load__row">
          <em>CADENCE</em>
          {stream.cadence}
        </p>
        <p className="imc-load__row">
          <em>MASS</em>
          {stream.inputMass}
        </p>
        <p className="imc-load__row">
          <em>CLASS</em>
          {COMPLEXITY[work.tier]}
        </p>
      </div>
      <p className="imc-load__why">
        <em>WHY THIS INTELLIGENCE</em>
        {stream.why}
      </p>
    </section>
  );
}

/* ══ The operating contract — his rail, three delegation levels ══════════ */

function ContractRail({ L, work, level }: { L: ConsoleLayout; work: ImapWork; level: Level }) {
  return (
    <section
      className="imc-panel imc-panel--contract"
      data-on={level > 0 || undefined}
      style={boxStyle(L.contract)}
    >
      <span className="imc-plate" aria-hidden="true" />
      <h4 className="imc-panel__label">OPERATING CONTRACT</h4>
      {/* ⚠ NO OWNER BLOCK HERE. It was clipped silently at the binding 611×403 —
          the rail is 70px, the label plus three steps is 67, and `overflow:
          hidden` swallowed the rest without a symptom. The owner now rides the
          target strip at L2/L3, where it has 300px of measure and is not a
          second copy of anything. */}
      <ul className="imc-contract">
        {CONTRACT.map((step) => (
          <li key={step.mode} data-on={step.mode === work.mode || undefined}>
            {step.mode}
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ══ Chrome ══════════════════════════════════════════════════════════════ */

function TargetStrip({ L, work, level }: { L: ConsoleLayout; work: ImapWork; level: Level }) {
  const stream = STREAMS[work.id];
  /* AT L1 THE VIEW SWITCH SHARES THIS BAND, so the third slot goes: `TARGET`
     + subject + `CREATIVE + BRAND` measured 266px against the 201px the switch
     leaves, and the chip publishes the team, the tier and the substrate count
     anyway. At L2/L3 there is no switch, so the slot carries the OWNER — which
     the 66px contract rail has no room for. */
  return (
    <p
      className="imc-target"
      data-wide={level > 0 || undefined}
      style={{ left: L.top.x, top: L.top.y + 3 }}
    >
      <em>{level === 0 ? "TARGET" : "OPEN"}</em>
      <strong>
        {work.id} / {stream.name}
      </strong>
      {level === 0 ? null : <span>OWNER {work.team}</span>}
    </p>
  );
}

function ViewSwitch({
  L,
  view,
  level,
  onPick,
}: {
  L: ConsoleLayout;
  view: View;
  level: Level;
  onPick: (v: View) => void;
}) {
  return (
    <div
      className="imc-views"
      data-on={level === 0 || undefined}
      style={{ left: L.top.x, top: L.top.y, width: L.top.w, height: L.top.h }}
      aria-label="View"
      aria-hidden={level !== 0}
    >
      {VIEWS.map((v) => (
        <button
          type="button"
          key={v.id}
          className="imc-views__btn"
          data-on={v.id === view || undefined}
          onClick={() => onPick(v.id)}
          tabIndex={level === 0 ? 0 : -1}
        >
          {v.label}
        </button>
      ))}
    </div>
  );
}

function LevelRail({
  L,
  level,
  onPick,
}: {
  L: ConsoleLayout;
  level: Level;
  onPick: (l: Level) => void;
}) {
  return (
    <nav
      className="imc-levels"
      style={{ left: L.rail.x, top: L.rail.y, width: L.rail.w, height: L.rail.h }}
      aria-label="Level"
    >
      {LEVELS.map((spec) => (
        <button
          type="button"
          key={spec.level}
          className="imc-levels__btn"
          data-on={spec.level === level || undefined}
          onClick={() => onPick(spec.level)}
        >
          <b>
            {spec.ord} {spec.name}
          </b>
          <em>
            {spec.sub.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </em>
        </button>
      ))}
    </nav>
  );
}
