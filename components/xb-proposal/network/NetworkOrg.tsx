"use client";

/* "Marketing first, then every team.", and then the view draws back (owner,
   2026-10-13: "it's important that we zoom out and see a full network of
   nodes … Maybe Marketing can then collapse and we see the other ones grow.
   Maybe they can also move up a bit because now they're super symmetrically
   connected … showcase how it's a smaller part of a bigger organizational
   node").

   The first act is `NetworkPlug`'s, by reference: the stack is taken from
   the steps' section where it was left, turns to face the reader and becomes
   the three courses of one module, and the Marketing housing closes round
   it. Then, where the proposal runs its ribbons out of that one large frame:

     · THE VIEW DRAWS BACK. Marketing's module shrinks to a node and moves
       off the middle; the camera pulls back about it, so the organisation's
       housing and the six other teams come into the frame from outside it.
       "X-Bionic" leaves Marketing's band for the housing's.
     · THEN EVERY TEAM. A ribbon runs from Marketing to each team in turn;
       as it lands the team's node grows from its band into the same module,
       its three courses empty but the first, "Navigate next".

   The seats and the ribbons are `orgLayout.ts` (pure, tested): four columns
   whose rows do not line up, level and plumb runs with 45-degree cuts.
   The plates, the camera, the frame's grammar, the hand-over from the steps'
   section and the title are `NetworkPlug`'s own. One scroll reader; reduced
   motion reads the last frame; `?netp=0..1` pins a moment for stills. */

import { type CSSProperties, useEffect, useRef, useState } from "react";

import { MastheadTitle } from "../Masthead";

import {
  at,
  type Cam,
  camIso,
  clamp01,
  COURSE_GAP,
  COURSE_H,
  COURSES,
  cutBox,
  DEPTS,
  dzEnd,
  dzStart,
  ease,
  END_K,
  ES_CENTRE,
  ES_VB_W,
  FR,
  H,
  ISO_PITCH,
  ISO_YAW,
  lerp,
  offsetLine,
  pathOf,
  PLATES,
  ptsOf,
  S,
  seg,
  STACK_AT,
  TITLE,
  TONES,
  TOP_Z,
  W,
  ZC_END,
  ZC_START,
} from "./NetworkPlug";
import {
  COURSES_AT,
  HOUSING,
  MARKETING,
  NODE,
  NODE_K,
  NODE_PAD,
  portOf,
  RIBBON,
  ROUTES,
  SEATS,
  STATE_DY,
  TURNS,
} from "./orgLayout";

type Pt = [number, number];

if (SEATS.some((s, i) => s.name !== DEPTS[i]?.name)) {
  throw new Error("NetworkOrg: the seats no longer follow NetworkPlug's departments");
}

/* the frontal camera's unit at scale 1: `camIso`'s own */
export const U_FRONT = 26 * Math.sqrt(1.5);
/* a course at node size, and the three of them */
export const BAR = {
  w: S * U_FRONT * NODE_K,
  h: COURSE_H * U_FRONT * NODE_K,
  pitch: COURSE_GAP * U_FRONT * NODE_K,
};
export const BARS_H = 2 * BAR.pitch + BAR.h;

/* the big frame's middle and Marketing's node's: what the camera pulls back
   about, and how far (the frame's width over a node's) */
export const FRAME_MID: Pt = [(FR.x0 + FR.x1) / 2, (FR.y0 + FR.y1) / 2];
export const NODE_MID: Pt = [MARKETING.x + NODE.w / 2, MARKETING.y + NODE.h / 2];
export const Z0 = (FR.x1 - FR.x0) / NODE.w;

/* -- the scroll's four acts ---------------------------------------------- */

/* Retuned 2026-10-19 (owner: "you have to scroll one or two times … that
   should be almost instant and the next scroll should be the zoom-out so you
   don't lose your momentum"): the module is whole about 45svh into the pin
   and the view draws back straight after, with no beat of stillness; the
   pin is 240svh (was 330) and the teams keep their pace in svh. */
export const T = {
  turn: [0.02, 0.11],
  frame: [0.1, 0.15],
  zoom: [0.19, 0.44],
  ribs: 0.45,
  step: 0.074,
  draw: 0.096,
  grow: 0.062,
} as const;

export function moment(p: number, frame: readonly [number, number] = T.frame) {
  const from = (i: number) => T.ribs + (TURNS as readonly number[]).indexOf(i) * T.step;
  return {
    turn: ease(seg(p, T.turn[0], T.turn[1])),
    frame: ease(seg(p, frame[0], frame[1])),
    zoom: ease(seg(p, T.zoom[0], T.zoom[1])),
    rib: (i: number) => ease(seg(p, from(i), from(i) + T.draw)),
    grow: (i: number) => ease(seg(p, from(i) + T.draw - 0.01, from(i) + T.draw + T.grow)),
    on: (i: number) => p >= from(i) + T.draw - 0.005,
  };
}

type Reading = {
  p: number;
  q: number;
  from: { x: number; y: number; k: number } | null;
};

/** Marketing's name on its band, before the view draws back. */
const ORG = "X-Bionic";

/** For a page that letters the module itself (the swarm lab): when
    Marketing's frame comes on, and the stretch its name is typed over, on
    the pin's clock. Absent, the frame and its name fade in together over
    `T.frame`. */
export type Lettered = {
  frame: readonly [number, number];
  name: readonly [number, number];
};

export function NetworkOrg({
  lettered,
  org = ORG,
}: {
  lettered?: Lettered;
  /** The organisation the drawing names; `null` for a page read by anyone
      (the cases page): Marketing alone, and "The organisation" on its housing. */
  org?: string | null;
} = {}) {
  const MKT_NAME = org ? `${org} · Marketing` : "Marketing";
  const runway = useRef<HTMLDivElement>(null);
  const fig = useRef<HTMLDivElement>(null);
  const [r, setR] = useState<Reading>({ p: 0, q: 0, from: null });

  /* `NetworkPlug`'s reader, as it stands: the pinned scroll, and the stack's
     seat in the steps' section for the hand-over */
  useEffect(() => {
    const fp = new URLSearchParams(window.location.search).get("netp");
    /* below the frame tier the section draws its last frame for the column
       (`.xno-phone`), so nothing reads the scroll or takes the steps' stack */
    const fixedP =
      fp !== null
        ? clamp01(Number(fp))
        : window.matchMedia("(prefers-reduced-motion: reduce), (max-width: 960px)").matches
          ? 1
          : null;
    const el = runway.current;
    const box = fig.current;
    const es = document.querySelector<HTMLElement>(".es");
    const esSvg = es?.querySelector<SVGSVGElement>(".es-svg") ?? null;
    const esPin = es?.querySelector<HTMLElement>(".es-pin") ?? null;
    let raf = 0;
    const read = () => {
      raf = 0;
      if (fixedP !== null || !el || !box) {
        setR({ p: fixedP ?? 1, q: 1, from: null });
        return;
      }
      const rr = el.getBoundingClientRect();
      const vh = document.documentElement.clientHeight;
      const p = clamp01(-rr.top / Math.max(1, rr.height - vh));
      const q = clamp01(1 - rr.top / vh);
      let from: Reading["from"] = null;
      if (es && esSvg && esPin) {
        const f = box.getBoundingClientRect();
        const kF = f.width / W;
        const s = esSvg.getBoundingClientRect();
        const kES = s.width / ES_VB_W;
        const lift = esPin.getBoundingClientRect().top;
        from = {
          x: (s.left + ES_CENTRE[0] * kES - f.left) / kF,
          y: (s.top + ES_CENTRE[1] * kES - lift - f.top) / kF,
          k: kES / kF,
        };
        if (q > 0) es.setAttribute("data-handed", "");
        else es.removeAttribute("data-handed");
      }
      setR({ p, q, from });
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    const first = requestAnimationFrame(read);
    if (fixedP !== null) return () => cancelAnimationFrame(first);
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      cancelAnimationFrame(first);
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
      if (raf) cancelAnimationFrame(raf);
      es?.removeAttribute("data-handed");
    };
  }, []);

  const st = moment(r.p, lettered?.frame);
  const z = st.zoom;
  /* the name, typed: how much of it, and the head while it types */
  const typed = lettered
    ? Math.floor(MKT_NAME.length * seg(r.p, lettered.name[0], lettered.name[1]) + 1e-6)
    : MKT_NAME.length;
  const travel = ease(r.q);
  const k0 = r.from?.k ?? 1;

  /* the camera on the stack: to the big frame's seat as it turns, then to
     Marketing's node as the view draws back */
  const seatX = lerp(STACK_AT[0], MARKETING.x + COURSES_AT.dx, z);
  const seatY = lerp(STACK_AT[1], MARKETING.y + COURSES_AT.dy, z);
  const cam: Cam = {
    yaw: lerp(ISO_YAW, 0, st.turn),
    pitch: lerp(ISO_PITCH, 0, st.turn),
    cx: r.from ? lerp(r.from.x, seatX, travel) : seatX,
    cy: r.from ? lerp(r.from.y, seatY, travel) : seatY,
    k: lerp(lerp(k0, END_K, st.turn), NODE_K, z),
    zc: lerp(ZC_START, ZC_END, st.turn),
  };
  const isos = [0, 1, 2].map((i) => camIso(cam, lerp(dzStart(i), dzEnd(i), st.turn)));
  const platesOut = 1 - seg(st.turn, 0.8, 0.97);
  const coursesIn = seg(st.turn, 0.78, 0.92);
  const th = lerp(0.4, COURSE_H, seg(st.turn, 0.82, 1));
  const shown = r.q > 0 || !r.from;

  /* Marketing's own frame, from the module's housing to a node */
  const fr = {
    x0: lerp(FR.x0, MARKETING.x, z),
    x1: lerp(FR.x1, MARKETING.x + NODE.w, z),
    y0: lerp(FR.y0, MARKETING.y, z),
    y1: lerp(FR.y1, MARKETING.y + NODE.h, z),
    cut: lerp(FR.cut, NODE.cut, z),
    band: lerp(FR.band, NODE.band, z),
  };

  /* everything else, through the camera that pulls back about Marketing */
  const Z = lerp(Z0, 1, z);
  const mid: Pt = [lerp(FRAME_MID[0], NODE_MID[0], z), lerp(FRAME_MID[1], NODE_MID[1], z)];
  const world = `translate(${mid[0].toFixed(2)} ${mid[1].toFixed(2)}) scale(${Z.toFixed(4)}) translate(${-NODE_MID[0]} ${-NODE_MID[1]})`;
  const seen = (x: number, y: number): Pt => [
    mid[0] + (x - NODE_MID[0]) * Z,
    mid[1] + (y - NODE_MID[1]) * Z,
  ];
  const worldIn = seg(z, 0.3, 0.9);
  const offs = Array.from(
    { length: RIBBON.wires },
    (_, k) => (k - (RIBBON.wires - 1) / 2) * RIBBON.pitch
  );

  return (
    <div className="xn xno" ref={runway}>
      <div className="xn-pin">
        <MastheadTitle lines={TITLE} />
        <div className="xn-fig" ref={fig}>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="xn-svg"
            role="img"
            aria-label={`The stack of three plates, your team, the layer and your agents, travels down from the section above and turns to face the reader as one module of three courses, inside a notched frame: ${MKT_NAME}. Then the view draws back: Marketing is one node inside the organisation's frame, and circuit ribbons run from it to the six other teams, each of which grows into the same module and starts its own Navigate next: product design, sales, customer care, technology, operations and finance.`}
          >
            <defs>
              {/* what arrives from outside the frame arrives through its edge */}
              <clipPath id="xno-frame">
                <rect x={-48} y={-24} width={W + 96} height={H + 48} />
              </clipPath>
            </defs>

            <g clipPath="url(#xno-frame)">
              <g transform={world} opacity={worldIn} className="xno-world">
                {/* the organisation: the same housing, at the frame's size */}
                <polygon
                  className="xn-frame__body xno-housing"
                  points={cutBox(HOUSING.x0, HOUSING.y0, HOUSING.x1, HOUSING.y1, HOUSING.cut)}
                />
                <polygon
                  className="xn-frame__band"
                  points={ptsOf([
                    [HOUSING.x0, HOUSING.y0],
                    [HOUSING.x1 - HOUSING.cut, HOUSING.y0],
                    [HOUSING.x1, HOUSING.y0 + HOUSING.cut],
                    [HOUSING.x1, HOUSING.y0 + HOUSING.band],
                    [HOUSING.x0, HOUSING.y0 + HOUSING.band],
                  ])}
                />
                <line
                  className="xn-frame__rule"
                  x1={HOUSING.x0}
                  x2={HOUSING.x1}
                  y1={HOUSING.y0 + HOUSING.band}
                  y2={HOUSING.y0 + HOUSING.band}
                />

                {/* the ribbons, a faint lane first */}
                {ROUTES.map((line, i) => (
                  <g key={SEATS[i].name}>
                    {offs.map((o) => (
                      <path
                        key={`t${o}`}
                        d={pathOf(offsetLine(line as Pt[], o))}
                        className="xn-lane"
                      />
                    ))}
                    {offs.map((o) => (
                      <path
                        key={`w${o}`}
                        d={pathOf(offsetLine(line as Pt[], o))}
                        pathLength={1}
                        className="xn-rib"
                        style={{ strokeDashoffset: 1 - st.rib(i) }}
                      />
                    ))}
                  </g>
                ))}

                {/* the six other teams: a band until its ribbon lands, then
                    the same module, grown */}
                {SEATS.map((s, i) => {
                  const g = st.grow(i);
                  const h = lerp(NODE.collapsed, NODE.h, g);
                  const [px, py] = portOf(s);
                  const bx = s.x + (NODE.w - BAR.w) / 2;
                  const by = s.y + COURSES_AT.dy - BARS_H / 2;
                  return (
                    <g key={s.name} className="xn-dept" data-on={st.on(i) ? "" : undefined}>
                      <polygon
                        className="xn-frame__body"
                        points={cutBox(s.x, s.y, s.x + NODE.w, s.y + h, NODE.cut)}
                      />
                      <polygon
                        className="xn-frame__band"
                        points={ptsOf([
                          [s.x, s.y],
                          [s.x + NODE.w - NODE.cut, s.y],
                          [s.x + NODE.w, s.y + NODE.cut],
                          [s.x + NODE.w, s.y + NODE.band],
                          [s.x, s.y + NODE.band],
                        ])}
                      />
                      <line
                        className="xn-frame__rule"
                        x1={s.x}
                        x2={s.x + NODE.w}
                        y1={s.y + NODE.band}
                        y2={s.y + NODE.band}
                      />
                      {/* its three courses: empty but the first */}
                      {g > 0.02 &&
                        [0, 1, 2].map((j) => (
                          <rect
                            key={j}
                            className="xno-slot"
                            data-first={j === 0 ? "" : undefined}
                            x={bx}
                            y={by + j * BAR.pitch}
                            width={BAR.w}
                            height={BAR.h}
                            stroke={TONES[j]}
                            opacity={seg(g, 0.35 + j * 0.15, 0.7 + j * 0.15)}
                          />
                        ))}
                      <rect
                        className="xn-port"
                        x={px - 3}
                        y={py - 3}
                        width={6}
                        height={6}
                        opacity={st.rib(i) >= 1 ? 1 : 0.35}
                      />
                    </g>
                  );
                })}
              </g>
            </g>

            {/* Marketing: the module's housing, then one node among seven */}
            <g style={{ opacity: st.frame }}>
              <polygon
                points={cutBox(fr.x0, fr.y0, fr.x1, fr.y1, fr.cut)}
                className="xn-frame__body"
              />
              <polygon
                className="xn-frame__band"
                points={ptsOf([
                  [fr.x0, fr.y0],
                  [fr.x1 - fr.cut, fr.y0],
                  [fr.x1, fr.y0 + fr.cut],
                  [fr.x1, fr.y0 + fr.band],
                  [fr.x0, fr.y0 + fr.band],
                ])}
              />
              <line
                x1={fr.x0}
                x2={fr.x1}
                y1={fr.y0 + fr.band}
                y2={fr.y0 + fr.band}
                className="xn-frame__rule"
              />
              {/* where its ribbons leave, once the view has drawn back */}
              {ROUTES.map((line, i) => (
                <rect
                  key={i}
                  className="xn-port"
                  x={line[0][0] - 3}
                  y={line[0][1] - 3}
                  width={6}
                  height={6}
                  opacity={seg(z, 0.9, 1) * (st.rib(i) > 0 ? 1 : 0.35)}
                />
              ))}
            </g>

            {/* the stack itself, the steps section's own plates */}
            {shown && platesOut > 0.01 && (
              <g opacity={platesOut} className="xno-plates">
                {[2, 1, 0].map((i) => {
                  const Plate = PLATES[i];
                  return <Plate key={i} iso={isos[i]} />;
                })}
              </g>
            )}
            {/* the courses they become */}
            {shown && coursesIn > 0 && (
              <g opacity={coursesIn} className="xno-courses">
                {[2, 1, 0].map((i) => {
                  const pr = isos[i].p;
                  const z1 = TOP_Z[i];
                  const z0 = z1 - th;
                  const front = [pr(0, S, z1), pr(S, S, z1), pr(S, S, z0), pr(0, S, z0)];
                  const [right] = pr(S, S, z1);
                  const fy = pr(S, S, z1 - th / 2)[1];
                  return (
                    <g key={i} stroke={TONES[i]}>
                      <polygon
                        className="xn-face"
                        points={front.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ")}
                      />
                      <line
                        x1={right - 30 * cam.k}
                        x2={right - 12 * cam.k}
                        y1={fy}
                        y2={fy}
                        strokeOpacity={0.8}
                      />
                    </g>
                  );
                })}
              </g>
            )}
          </svg>

          {/* every word, seated in the frame */}
          <div className="xn-words">
            {/* the organisation's name leaves Marketing's band for its own */}
            <span
              className="xn-band"
              style={{
                ...at(fr.x0 + lerp(18, NODE_PAD, z), fr.y0 + fr.band / 2),
                opacity: (lettered ? 1 : st.frame) * (1 - seg(z, 0.15, 0.45)),
              }}
            >
              {MKT_NAME.slice(0, typed)}
              {typed > 0 && typed < MKT_NAME.length && <i className="xno-caret" />}
            </span>
            <span
              className="xn-band xno-word"
              style={{
                ...at(fr.x0 + lerp(18, NODE_PAD, z), fr.y0 + fr.band / 2),
                opacity: seg(z, 0.45, 0.75),
              }}
            >
              Marketing
            </span>
            <span
              className="xn-band xno-word xno-org-name"
              style={{
                ...at(...seen(HOUSING.x0 + 18, HOUSING.y0 + HOUSING.band / 2)),
                opacity: seg(z, 0.7, 1),
              }}
            >
              {org ?? "The organisation"}
            </span>
            <span
              className="xn-band xn-state xno-word"
              style={{
                ...at(fr.x0 + lerp(18, NODE_PAD, z), lerp(FR.y1 - 26, MARKETING.y + STATE_DY, z)),
                opacity: st.frame,
              }}
            >
              Run by your team
            </span>
            {shown &&
              COURSES.map((c, i) => {
                const pr = isos[i].p;
                const [x, y] = pr(0, S, TOP_Z[i] - th / 2);
                return (
                  <span
                    key={c}
                    className="xn-course"
                    data-tone={i}
                    style={{
                      ...at(x + 16, y),
                      /* too small to letter once the view has drawn back */
                      opacity: seg(st.turn, 0.9, 1) * (1 - seg(z, 0, 0.22)),
                    }}
                  >
                    {c}
                  </span>
                );
              })}
            {SEATS.map((s, i) => {
              const on = st.on(i);
              return [
                <span
                  key={s.name}
                  className="xn-band xn-band--dept xno-word"
                  data-on={on ? "" : undefined}
                  style={
                    {
                      ...at(...seen(s.x + NODE_PAD, s.y + NODE.band / 2)),
                      opacity: worldIn,
                    } as CSSProperties
                  }
                >
                  {s.name}
                </span>,
                <span
                  key={`${s.name}-next`}
                  className="xn-next xno-word"
                  style={{
                    ...at(...seen(s.x + NODE_PAD, s.y + STATE_DY)),
                    opacity: seg(st.grow(i), 0.75, 1),
                  }}
                >
                  Navigate next
                </span>,
              ];
            })}
          </div>
        </div>
      </div>

      {/* Below the frame tier (owner, 2026-10-21, on a phone): the camera's
          frame is 1200 units wide with every team's words seated over it, so
          at 390px they ran off both edges and through each other. There the
          section is its last frame laid out for the column: Marketing's
          module and its three courses, then the six teams on one ribbon,
          each its band, its three courses and "Navigate next". The same
          records, never a second copy. */}
      <div className="xno-phone">
        <MastheadTitle lines={TITLE} />
        <div className="xno-phone__fig">
          <div className="xno-phone__mod" data-lit="">
            <span className="xno-phone__band">{MKT_NAME}</span>
            <ol className="xno-phone__courses">
              {COURSES.map((c, i) => (
                <li key={c} data-tone={i}>
                  {c}
                </li>
              ))}
            </ol>
          </div>
          <ul className="xno-phone__teams">
            {SEATS.map((s) => (
              <li key={s.name}>
                <div className="xno-phone__mod">
                  <span className="xno-phone__band">{s.name}</span>
                  <span className="xno-phone__slots" aria-hidden>
                    <i />
                    <i />
                    <i />
                  </span>
                  <span className="xno-phone__next">Navigate next</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
