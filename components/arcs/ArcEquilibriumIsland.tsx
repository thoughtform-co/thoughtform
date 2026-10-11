"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import EquilibriumMount from "@/app/(marketing)/arcs/thoughtform/workshop-v3/EquilibriumMount";
import { eqLiftRef } from "@/components/holo-program/eqLiftRef";
import {
  axisRing,
  EQ_FRAME,
  EQ_GATE,
  eqProject,
  markLines,
} from "@/components/holo-program/equilibriumGeom";
import { ease, makeIso } from "@/components/xb-proposal/iso";
import { ASSEMBLY_ISO, LAYER_XY, layerMarkLines } from "@/components/xb-proposal/offer/Assembly";

/**
 * ArcEquilibriumIsland — the equilibrium's live hologram, and the hand-off
 * into the next section (owner, 2026-10-11: "that middle part then plugs into
 * the wider stack").
 *
 * 1. The hologram: `EquilibriumMount` portalled into the station's slot, the
 *    bloom off, armed at once (it only runs while on screen).
 * 2. The carrier: as the next section rises, the gate's gold ring and the
 *    brandmark lift out of the gate (the scene stops drawing its own mark,
 *    `eqLiftRef`) and travel, point for point, onto the X-Bionic layer's
 *    slot in S1 A's drawing: the ring flattens into the slab's top face and
 *    the mark lies down on it. Once the stage pins it HOLDS there, and as
 *    the layer arrives (S1 A's own first move) it hands over to the
 *    drawing's layer and the mark the drawing lays on it (`Assembly`'s
 *    `mark`): the same outline and the same lines in the same place, so
 *    nothing pops and nothing fades back to a ghost. Both ends are measured
 *    every frame, so the carrier stays welded to two things that are both
 *    moving.
 *
 * ⚠ The source is the gate AT REST (`eqProject`, the figure's own camera):
 * a reader who has turned the object sees the carrier leave from the rest
 * pose. ⚠ The target is S1 A's assembly at its first step: the layer's
 * ghost, x −5.6…2.0, y −2.6…2.6, its top at z 6.1, in `Assembly`'s own
 * projection (23px a unit, origin 226, 424), mapped through the drawing's
 * live screen matrix.
 */

const N = 96;
const A_ISO = makeIso(ASSEMBLY_ISO.u, ASSEMBLY_ISO.ox, ASSEMBLY_ISO.oy);
/* The layer's top face before it seats: three strata of 0.4 with 0.5 of air,
   from 3.9 (`Assembly`'s geometry at its first move). */
const SLAB = { ...LAYER_XY, top: 6.1 };

type Pt = [number, number];
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
const easeIO = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function signedArea(p: Pt[]) {
  let a = 0;
  for (let i = 0; i < p.length - 1; i++) a += p[i][0] * p[i + 1][1] - p[i + 1][0] * p[i][1];
  return a / 2;
}
const centroid = (p: Pt[]): Pt => [
  p.reduce((s, q) => s + q[0], 0) / p.length,
  p.reduce((s, q) => s + q[1], 0) / p.length,
];

/** The two shapes, once: the gate in the figure's frame px, the slot in
 *  Assembly's px, sampled to the same counts and aligned so nothing twists. */
function buildShapes() {
  const ringSrc: Pt[] = axisRing(EQ_GATE.x, EQ_GATE.outer, N).map((p) => {
    const q = eqProject(p);
    return [q.x, q.y];
  });
  const corners: Pt[] = [
    A_ISO.p(SLAB.x0, SLAB.y0, SLAB.top),
    A_ISO.p(SLAB.x1, SLAB.y0, SLAB.top),
    A_ISO.p(SLAB.x1, SLAB.y1, SLAB.top),
    A_ISO.p(SLAB.x0, SLAB.y1, SLAB.top),
  ].map((q) => [q[0], q[1]]);
  /* the rhombus's perimeter at N even steps, closed */
  const lens = corners.map((c, i) =>
    Math.hypot(corners[(i + 1) % 4][0] - c[0], corners[(i + 1) % 4][1] - c[1])
  );
  const total = lens.reduce((a, b) => a + b, 0);
  let rhomb: Pt[] = [];
  for (let k = 0; k < N; k++) {
    let d = (k / N) * total;
    let i = 0;
    while (d > lens[i]) d -= lens[i++];
    const a = corners[i];
    const b = corners[(i + 1) % 4];
    const f = d / lens[i];
    rhomb.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]);
  }
  /* same winding, then start where the ring starts */
  if (Math.sign(signedArea([...rhomb, rhomb[0]])) !== Math.sign(signedArea(ringSrc)))
    rhomb.reverse();
  const cs = centroid(ringSrc);
  const ct = centroid(rhomb);
  const a0 = Math.atan2(ringSrc[0][1] - cs[1], ringSrc[0][0] - cs[0]);
  let best = 0;
  let bestD = Infinity;
  rhomb.forEach((q, k) => {
    const a = Math.atan2(q[1] - ct[1], q[0] - ct[0]);
    const d = Math.abs(Math.atan2(Math.sin(a - a0), Math.cos(a - a0)));
    if (d < bestD) {
      bestD = d;
      best = k;
    }
  });
  rhomb = [...rhomb.slice(best), ...rhomb.slice(0, best)];
  const ringTgt: Pt[] = [...rhomb, rhomb[0]];

  /* the mark: the gate's own outline, and the same polylines lying on the slot */
  const markSrc: Pt[][] = markLines().map((l) =>
    l.map((p) => {
      const q = eqProject(p);
      return [q.x, q.y] as Pt;
    })
  );
  const markTgt: Pt[][] = layerMarkLines(A_ISO, SLAB.top).map((l) =>
    l.map((q) => [q[0], q[1]] as Pt)
  );
  return { ringSrc, ringTgt, markSrc, markTgt };
}

export function ArcEquilibriumIsland({ plugInto }: { plugInto?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [slot, setSlot] = useState<Element | null>(null);
  const [overlay, setOverlay] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const ringRef = useRef<SVGPathElement>(null);
  const markRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    setSlot(ref.current?.parentElement?.querySelector("[data-tw-eq-canvas]") ?? null);
    setOverlay(Boolean(plugInto));
  }, [plugInto]);

  useEffect(() => {
    if (!plugInto || !overlay) return;
    const host = ref.current?.parentElement;
    const target = document.getElementById(plugInto);
    const svg = svgRef.current;
    if (!host || !target || !svg) return;
    const capable = window.matchMedia(
      "(min-width: 961px) and (prefers-reduced-motion: no-preference)"
    );
    const shapes = buildShapes();

    const toPath = (pts: Pt[], close: boolean) =>
      pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join("") +
      (close ? "Z" : "");

    const frame = () => {
      const fig = host.querySelector<HTMLElement>(".tw-eq__figure");
      const draw = target.querySelector<SVGSVGElement>(".xbA__fig svg");
      /* only over the LIVE hologram: the static drawing letters its own mark,
         and a carrier over it would put the mark on screen twice */
      const live = host.querySelector("#equilibrium")?.getAttribute("data-holo") === "live";
      const runway = target.querySelector<HTMLElement>(".xbA-runway");
      const vh = window.innerHeight;
      /* c: the vision's runway rising into the frame, 1 as the stage pins;
         a2: the layer arriving on the pinned stage (`Assembly`'s own clock,
         read off the same runway the drawing reads). */
      const rr = (runway ?? target).getBoundingClientRect();
      const c = clamp01(1 - rr.top / vh);
      const span = rr.height - vh;
      const a2 = runway && span > 0 ? ease(2 * clamp01(-rr.top / span)) : 0;
      if (!capable.matches || !live || !fig || !draw || c <= 0 || a2 >= 0.999) {
        svg.style.visibility = "hidden";
        eqLiftRef.current = c > 0 && capable.matches && live ? 1 : 0;
        return;
      }
      const m = draw.getScreenCTM();
      if (!m) return;
      const r = fig.getBoundingClientRect();
      const sx = r.width / EQ_FRAME.w;
      const sy = r.height / EQ_FRAME.h;
      const src = ([x, y]: Pt): Pt => [r.left + x * sx, r.top + y * sy];
      const tgt = ([x, y]: Pt): Pt => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f];
      const t = easeIO(seg(c, 0.04, 0.92));
      const mix = (a: Pt, b: Pt): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
      const ring = shapes.ringSrc.map((p, i) => mix(src(p), tgt(shapes.ringTgt[i])));
      const mark = shapes.markSrc.map((l, j) =>
        l.map((p, i) => mix(src(p), tgt(shapes.markTgt[j][i])))
      );
      ringRef.current?.setAttribute("d", toPath(ring, true));
      markRef.current?.setAttribute("d", mark.map((l) => toPath(l, false)).join(""));
      svg.setAttribute("viewBox", `0 0 ${window.innerWidth} ${vh}`);
      /* the line weight lands on the drawing's own, scaled with it */
      const k = Math.hypot(m.a, m.b);
      const sw = String(1 + (k - 1) * t);
      ringRef.current?.setAttribute("stroke-width", String(1.2 + (k - 1.2) * t));
      markRef.current?.setAttribute("stroke-width", sw);
      svg.style.opacity = String(1 - a2);
      svg.style.visibility = "visible";
      eqLiftRef.current = 1;
    };
    frame();
    window.addEventListener("scroll", frame, { passive: true });
    window.addEventListener("resize", frame);
    return () => {
      window.removeEventListener("scroll", frame);
      window.removeEventListener("resize", frame);
      eqLiftRef.current = 0;
    };
  }, [plugInto, overlay]);

  return (
    <div ref={ref} hidden>
      {slot ? createPortal(<EquilibriumMount armAt={0} bloom={false} />, slot) : null}
      {overlay
        ? createPortal(
            <svg
              ref={svgRef}
              className="arc-eq-carrier"
              aria-hidden="true"
              style={{
                position: "fixed",
                inset: 0,
                width: "100vw",
                height: "100vh",
                pointerEvents: "none",
                zIndex: 30,
                visibility: "hidden",
                overflow: "visible",
              }}
            >
              <path
                ref={ringRef}
                fill="rgba(var(--gold-rgb), 0.07)"
                stroke="var(--gold-line, #caa554)"
                strokeWidth={1.2}
                strokeLinejoin="round"
              />
              <path
                ref={markRef}
                fill="none"
                stroke="var(--gold-line, #caa554)"
                strokeWidth={1}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </svg>,
            document.body
          )
        : null}
    </div>
  );
}
