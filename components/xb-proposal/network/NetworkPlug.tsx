"use client";

/* The stack plugs in, and Marketing is only the first team (owner,
   2026-10-12). After "Embed, encode, run." the closed stack of three plates
   slides down into this section and turns to face the reader; the module it
   becomes takes its seat inside a notched frame, X-Bionic's Marketing, in the
   intelligence configuration's own housing (TR and BL cut, the gold head
   band). There it wires out to the five creative workstreams: Production
   first, with Thoughtform, then the rest, until all five are run by the team.
   Then the frame's right edge sends eight-wire ribbons, the configuration
   board's own circuit lanes, out to the departments that plug in next.

   One camera, one object. The plates are the steps section's own (8 units
   square, team green, layer gold, agents dawn, the closed stack's spacing at
   the same unit), projected by a true orthographic camera whose yaw and pitch
   run from the isometric (45 and 35.26 degrees: exactly the kit's `makeIso`)
   to 0, so the turn is a rotation, never a crossfade. As it turns the plates
   thicken into the three courses of one module.

   Every wire starts on the edge it leaves and ends on the edge it names,
   computed from the same numbers that draw those edges. Line work is SVG in
   a 1200 x 560 frame; every word is DOM seated in percent of the same frame
   and sized in `cqw` of it, so type and drawing scale together. One scroll
   reader; reduced motion reads the last frame; `?netp=0..1` pins a moment
   for stills. */

import { type CSSProperties, useEffect, useRef, useState } from "react";

import { MastheadTitle } from "../Masthead";

const W = 1200;
const H = 560;
const S = 8;
/* The steps section's unit (u 26): the stack arrives at the size it left. */
const SCALE = 26;
const ISO_YAW = Math.PI / 4;
const ISO_PITCH = Math.atan(1 / Math.SQRT2);
/* The closed stack's spacing there (72 drawing px), and the module's. */
const GAP0 = 72 / 26;
const H0 = 0.4;
const GAP1 = 1.24;
const H1 = 1.0;
/* The module at rest is drawn a step larger than the stack it turned from. */
const ZOOM = 1.2;

const GREEN = "var(--xn-green)";
const GOLD = "var(--xb-gold)";
const DAWN = "var(--xb-text)";
const TONES = [GREEN, GOLD, DAWN] as const;
const COURSE = ["Your team", "The layer", "Your agents"] as const;

const TITLE = ["Marketing first,", "then every team."] as const;

type P = [number, number];

/* -- the frame: X-Bionic's Marketing, in the configuration's housing ---- */

const FR = { x0: 20, x1: 740, y0: 20, y1: 540, cut: 26, band: 38 };
/* where the stack enters (top), where it turns, its seat in the frame */
const ENTER: P = [380, 96];
const TURN: P = [380, 290];
const SEAT: P = [206, 300];

/* The five workstreams, in the order they plug in: a column on the frame's
   right, one trunk from the module. */
const STREAMS = [
  "Creative production",
  "Creative ops",
  "Creative review",
  "Creative strategy",
  "Creative technology",
] as const;
const CARD = { x: 456, w: 256, h: 64, gap: 18 };
const CARD_Y = STREAMS.map(
  (_, i) => 300 - (5 * CARD.h + 4 * CARD.gap) / 2 + i * (CARD.h + CARD.gap)
);
const TRUNK_X = 404;

/* The departments that plug in next, outside the frame. */
const DEPTS = ["Product design", "Technology", "Operations", "Sales"] as const;
const DEPT = { x: 918, w: 262, h: 72 };
const DEPT_Y = [92, 204, 316, 428];
const RIB_Y0 = [240, 280, 320, 360];
const RIB_JOG = [768, 820, 820, 768];
const WIRES = 8;
const PITCH = 3.4;

const FIRST = "With Thoughtform";
const OWNED = "Run by your team";

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
const ease = (t: number) => {
  const c = clamp01(t);
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const f = (n: number) => n.toFixed(2);
const at = (x: number, y: number): CSSProperties =>
  ({ "--px": (x / W).toFixed(5), "--py": (y / H).toFixed(5) }) as CSSProperties;

/* -- the camera --------------------------------------------------------- */

type Cam = { yaw: number; pitch: number; cx: number; cy: number; zc: number; k: number };

function project(c: Cam, x: number, y: number, z: number): P {
  const X = x - S / 2;
  const Y = y - S / 2;
  const Z = z - c.zc;
  const cy = Math.cos(c.yaw);
  const sy = Math.sin(c.yaw);
  const u = SCALE * c.k;
  return [
    c.cx + u * (X * cy - Y * sy),
    c.cy + u * ((X * sy + Y * cy) * Math.sin(c.pitch) - Z * Math.cos(c.pitch)),
  ];
}
const poly = (list: P[]) => list.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");

/** The courses at turn `e`: each plate's top z, its thickness, the centre. */
function courses(e: number) {
  const g = lerp(GAP0, GAP1, e);
  const h = lerp(H0, H1, e);
  return { h, tops: [0, -g, -2 * g], zc: (-2 * g - h) / 2 };
}

/** The module's front at rest, from the same camera the turn ends on. */
function restBox(seat: P) {
  const { tops, h, zc } = courses(1);
  const cam: Cam = { yaw: 0, pitch: 0, cx: seat[0], cy: seat[1], zc, k: ZOOM };
  const [l, t] = project(cam, 0, S, tops[0]);
  const [r, b] = project(cam, S, S, tops[2] - h);
  const rows = tops.map((z) => project(cam, 0, S, z - h / 2)[1]);
  return { l, r, t, b, mid: rows[1], rows };
}

/* -- the line work ------------------------------------------------------ */

/** The frame's outline, TR and BL cut. */
function frameOutline() {
  const { x0, x1, y0, y1, cut } = FR;
  return poly([
    [x0, y0],
    [x1 - cut, y0],
    [x1, y0 + cut],
    [x1, y1],
    [x0 + cut, y1],
    [x0, y1 - cut],
  ]);
}
/** The head band, its top-right corner cut with the frame's. */
function frameBand() {
  const { x0, x1, y0, cut, band } = FR;
  return poly([
    [x0, y0],
    [x1 - cut, y0],
    [x1, y0 + cut],
    [x1, y0 + band],
    [x0, y0 + band],
  ]);
}

/** One wire of a ribbon: across, a 45-degree jog, across again. The wire at
    offset `d` is the centre line offset by `d`, so its corners shift along
    the bisector by d * tan(22.5deg) and every wire stays parallel to its
    neighbours, at the same pitch on the diagonal as on the runs. */
const TAN = Math.SQRT2 - 1;
function ribbonWire(i: number, d: number) {
  const y0 = RIB_Y0[i];
  const y1 = DEPT_Y[i] + DEPT.h / 2;
  const dir = Math.sign(y1 - y0);
  const xa = RIB_JOG[i];
  const xb = xa + Math.abs(y1 - y0);
  return `M${FR.x1} ${f(y0 + d)}H${f(xa - dir * TAN * d)}L${f(xb + dir * TAN * d)} ${f(y1 + d)}H${DEPT.x}`;
}

/* -- the moment --------------------------------------------------------- */

function moment(p: number) {
  const wireAt = (i: number) => 0.4 + i * 0.045;
  const ribAt = (i: number) => 0.7 + i * 0.05;
  return {
    /* the stack slides down as it turns, then takes its seat */
    drop: ease(seg(p, 0, 0.24)),
    turn: ease(seg(p, 0.02, 0.28)),
    seat: ease(seg(p, 0.28, 0.38)),
    frame: ease(seg(p, 0.3, 0.4)),
    labels: seg(p, 0.34, 0.4),
    ports: seg(p, 0.38, 0.41),
    wire: (i: number) => ease(seg(p, wireAt(i), wireAt(i) + 0.08)),
    on: (i: number) => p >= wireAt(i) + 0.075,
    handed: p >= 0.66,
    rib: (i: number) => ease(seg(p, ribAt(i), ribAt(i) + 0.1)),
    dept: (i: number) => p >= ribAt(i) + 0.095,
  };
}

/* -- the drawing -------------------------------------------------------- */

function Module({ seat, e }: { seat: P; e: number }) {
  const { tops, h, zc } = courses(e);
  const cam: Cam = {
    yaw: lerp(ISO_YAW, 0, e),
    pitch: lerp(ISO_PITCH, 0, e),
    cx: seat[0],
    cy: seat[1],
    zc,
    k: lerp(1, ZOOM, e),
  };
  const pr = (x: number, y: number, z: number) => project(cam, x, y, z);
  const topFade = 1 - seg(e, 0.5, 0.9);
  /* painted bottom plate first: the upper plate sits in front */
  return (
    <g>
      {[2, 1, 0].map((i) => {
        const z1 = tops[i];
        const z0 = z1 - h;
        const tone = TONES[i];
        const quad = (x0: number, y0: number, x1: number, y1: number) =>
          poly([pr(x0, y0, z1), pr(x1, y0, z1), pr(x1, y1, z1), pr(x0, y1, z1)]);
        const [fr] = pr(S, S, z1);
        const fy = pr(S, S, z1 - h / 2)[1];
        return (
          <g key={i} stroke={tone} strokeWidth={1}>
            <polygon
              className="xn-face"
              points={poly([pr(S, 0, z1), pr(S, S, z1), pr(S, S, z0), pr(S, 0, z0)])}
            />
            <polygon className="xn-top" points={quad(0, 0, S, S)} />
            {topFade > 0.01 && (
              <g opacity={topFade} fill="none">
                {i === 0 &&
                  [
                    [1.6, 0.6],
                    [4.6, 1.9],
                    [1.6, 3.8],
                    [4.6, 5.0],
                  ].map(([x, y]) => (
                    <polygon key={`${x}${y}`} points={quad(x, y, x + 2.6, y + 2.6)} />
                  ))}
                {i === 1 &&
                  [2.25, 2.8, 3.35].map((r, k) => (
                    <polygon
                      key={r}
                      strokeOpacity={k === 1 ? 0.85 : 0.4}
                      strokeDasharray={k === 2 ? "2 4" : undefined}
                      points={poly(
                        Array.from({ length: 64 }, (_, a) => {
                          const t = (a / 64) * Math.PI * 2;
                          return pr(S / 2 + r * Math.cos(t), S / 2 + r * Math.sin(t), z1);
                        })
                      )}
                    />
                  ))}
                {i === 2 && (
                  <>
                    <polygon points={quad(3, 3, 5, 5)} />
                    {[
                      [0.7, 0.7],
                      [5.4, 1.4],
                      [0.9, 5.5],
                      [5.7, 5.6],
                    ].map(([x, y]) => (
                      <polygon
                        key={`${x}${y}`}
                        points={quad(x, y, x + 1.4, y + 1.4)}
                        strokeOpacity={0.6}
                      />
                    ))}
                  </>
                )}
              </g>
            )}
            <polygon
              className="xn-face"
              points={poly([pr(0, S, z1), pr(S, S, z1), pr(S, S, z0), pr(0, S, z0)])}
            />
            {/* the course's own lamp, on the front's right end */}
            <line x1={fr - 30} x2={fr - 12} y1={fy} y2={fy} strokeOpacity={seg(e, 0.75, 1) * 0.8} />
          </g>
        );
      })}
    </g>
  );
}

function Stack3({ x, y }: { x: number; y: number }) {
  return (
    <g className="xn-mini">
      {TONES.map((t, i) => (
        <rect key={i} x={x} y={y + i * 8} width={22} height={4} fill={t} />
      ))}
    </g>
  );
}

const cutCard = (x: number, y: number, w: number, h: number, c: number) =>
  poly([
    [x, y],
    [x + w - c, y],
    [x + w, y + c],
    [x + w, y + h],
    [x + c, y + h],
    [x, y + h - c],
  ]);

export function NetworkPlug() {
  const runway = useRef<HTMLDivElement>(null);
  const [p, setP] = useState(0);

  useEffect(() => {
    const fp = new URLSearchParams(window.location.search).get("netp");
    const fixedP =
      fp !== null
        ? clamp01(Number(fp))
        : window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? 1
          : null;
    const el = runway.current;
    let raf = 0;
    const read = () => {
      raf = 0;
      if (fixedP !== null || !el) {
        setP(fixedP ?? 1);
        return;
      }
      const r = el.getBoundingClientRect();
      const vh = document.documentElement.clientHeight;
      setP(clamp01(-r.top / Math.max(1, r.height - vh)));
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    /* the first reading lands on the next frame */
    const first = requestAnimationFrame(read);
    if (fixedP !== null) return () => cancelAnimationFrame(first);
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      cancelAnimationFrame(first);
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const st = moment(p);
  const m = restBox(SEAT);
  /* down while it turns, then across into its seat */
  const pos: P =
    st.seat > 0
      ? [lerp(TURN[0], SEAT[0], st.seat), lerp(TURN[1], SEAT[1], st.seat)]
      : [lerp(ENTER[0], TURN[0], st.drop), lerp(ENTER[1], TURN[1], st.drop)];
  const dx = pos[0] - SEAT[0];
  const dy = pos[1] - SEAT[1];
  /* the module's wires: one trunk out of its right edge, a branch per card */
  const wires = CARD_Y.map(
    (y) => `M${f(m.r)} ${f(m.mid)}H${TRUNK_X}V${f(y + CARD.h / 2)}H${CARD.x}`
  );
  const offs = Array.from({ length: WIRES }, (_, k) => (k - (WIRES - 1) / 2) * PITCH);

  return (
    <div className="xn" ref={runway}>
      <div className="xn-pin">
        <MastheadTitle lines={TITLE} />
        <div className="xn-fig">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="xn-svg"
            role="img"
            aria-label="The stack of three plates slides down and turns to face the reader, becoming one module inside X-Bionic's Marketing. It wires out to the five creative workstreams: production first with Thoughtform, then ops, review, strategy and technology, until all five are run by the team. From Marketing, circuit ribbons run out to the departments that take the same approach next: product design, technology, operations and sales."
          >
            {/* Marketing, in the configuration's housing */}
            <g style={{ opacity: st.frame }}>
              <polygon points={frameOutline()} className="xn-frame__body" />
              <polygon points={frameBand()} className="xn-frame__band" />
              <line
                x1={FR.x0}
                x2={FR.x1}
                y1={FR.y0 + FR.band}
                y2={FR.y0 + FR.band}
                className="xn-frame__rule"
              />
            </g>

            {/* the ribbons out of Marketing, a faint lane first */}
            {DEPTS.map((d, i) => (
              <g key={d} style={{ opacity: st.frame }}>
                {offs.map((o) => (
                  <path key={`t${o}`} d={ribbonWire(i, o)} className="xn-lane" />
                ))}
                {offs.map((o) => (
                  <path
                    key={`w${o}`}
                    d={ribbonWire(i, o)}
                    pathLength={1}
                    className="xn-rib"
                    style={{ strokeDashoffset: 1 - st.rib(i) }}
                  />
                ))}
              </g>
            ))}
            {DEPTS.map((d, i) => (
              <g
                key={d}
                className="xn-node xn-node--dept"
                style={{ opacity: st.frame }}
                data-on={st.dept(i) ? "" : undefined}
              >
                <polygon
                  className="xn-card"
                  points={cutCard(DEPT.x, DEPT_Y[i], DEPT.w, DEPT.h, 10)}
                />
                <Stack3 x={DEPT.x + 18} y={DEPT_Y[i] + 26} />
              </g>
            ))}

            {/* the workstreams' wires, a faint track first */}
            {wires.map((d, i) => (
              <path key={`t${i}`} d={d} className="xn-track" style={{ opacity: st.frame }} />
            ))}
            {wires.map((d, i) => (
              <path
                key={`w${i}`}
                d={d}
                pathLength={1}
                className="xn-wire"
                style={{ strokeDashoffset: 1 - st.wire(i) }}
              />
            ))}
            {STREAMS.map((s, i) => (
              <g
                key={s}
                className="xn-node"
                style={{ opacity: st.frame }}
                data-on={st.on(i) ? "" : undefined}
                data-first={i === 0 && st.on(0) && !st.handed ? "" : undefined}
              >
                <rect x={CARD.x} y={CARD_Y[i]} width={CARD.w} height={CARD.h} className="xn-card" />
                <Stack3 x={CARD.x + 16} y={CARD_Y[i] + 22} />
              </g>
            ))}
            <Module seat={pos} e={st.turn} />
            <g className="xn-ports">
              <rect x={m.r - 3} y={m.mid - 3} width={6} height={6} opacity={st.ports} />
              {RIB_Y0.map((y, i) => (
                <rect
                  key={y}
                  x={FR.x1 - 3}
                  y={y - 3}
                  width={6}
                  height={6}
                  opacity={st.rib(i) > 0 ? 1 : 0}
                />
              ))}
            </g>
          </svg>

          {/* every word, seated in the frame */}
          <div className="xn-words">
            <span
              className="xn-band"
              style={{ ...at(FR.x0 + 20, FR.y0 + FR.band / 2), opacity: st.frame }}
            >
              X-Bionic &middot; Marketing
            </span>
            {COURSE.map((c, i) => (
              <span
                key={c}
                className="xn-course"
                style={{ ...at(m.l + 14 + dx, m.rows[i] + dy), opacity: st.labels }}
              >
                {c}
              </span>
            ))}
            {STREAMS.map((s, i) => {
              const on = st.on(i);
              const first = i === 0 && on && !st.handed;
              return (
                <div
                  key={s}
                  className="xn-label"
                  data-on={on ? "" : undefined}
                  data-first={first ? "" : undefined}
                  style={{ ...at(CARD.x + 50, CARD_Y[i] + CARD.h / 2), opacity: st.frame }}
                >
                  <span className="xn-name">{s}</span>
                  <span className="xn-status" style={{ opacity: on ? 1 : 0 }}>
                    {first ? FIRST : OWNED}
                  </span>
                </div>
              );
            })}
            {DEPTS.map((d, i) => {
              const on = st.dept(i);
              return (
                <div
                  key={d}
                  className="xn-label"
                  data-on={on ? "" : undefined}
                  style={{ ...at(DEPT.x + 54, DEPT_Y[i] + DEPT.h / 2), opacity: st.frame }}
                >
                  <span className="xn-name">{d}</span>
                  <span className="xn-status" style={{ opacity: on ? 1 : 0 }}>
                    Plugs in next
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
