"use client";

import { useEffect, useRef, useState } from "react";

import { ASSEMBLY_VB } from "@/components/xb-proposal/offer/Assembly";
import { OfferPinned } from "@/components/xb-proposal/offer/OfferPinned";

/**
 * ArcOfferPortFit — seats S1 A's drawing where the page's About seats its
 * diagram (owner, 2026-10-11: "move that visual a bit to the right and make
 * it a bit bigger … If we look at the About section … that's much better
 * aligned"; then, at his 2560px window, "still not fixed").
 *
 * The drawing is the kit's own, untouched; only its viewBox is solved per
 * screen so that:
 *   1. its BODY (the board, the layer, the team plates: every polygon,
 *      measured across the three steps) is as tall as the About's ring and
 *      centred on the ring's centre, the way the portrait sits in it;
 *   2. its label column, which hangs to the right of the body, ends at
 *      least 32px clear of the right rail; on a laptop that wins over (1)
 *      and the body slides left only as far as it must;
 *   3. its labels never letter under 12px, and the whole drawing fits the
 *      stage's height.
 * Until it has measured (and with no JS) the drawing rests cropped to its
 * ink on the band's right edge.
 */
const CROP = "23 71 581 474";
/* Drawing units, measured on the assembly at this frame's 13.5px type. */
const BODY = { left: 30.8, right: 421.2, top: 111, bottom: 536.7 };
const INK = { top: 79, bottom: 536.7, right: 596 };
const TYPE = 13.5;
const RAIL_CLEAR = 32;

export function ArcOfferPortFit() {
  const ref = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState<{ viewBox: string; align: string }>({
    viewBox: CROP,
    align: "xMaxYMid meet",
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const solve = () => {
      raf = 0;
      const svg = el.querySelector<SVGSVGElement>(".xbA__fig svg");
      const orbit = document.querySelector<HTMLElement>("#about .arc-about__orbit");
      const rail = document.querySelector<HTMLElement>(".hud__rail--r");
      if (!svg || !orbit) return;
      const fig = svg.getBoundingClientRect();
      const ring = orbit.getBoundingClientRect();
      if (!fig.width || !fig.height || !ring.width) return;
      const railX = rail ? rail.getBoundingClientRect().left : window.innerWidth - 64;

      const bodyH = BODY.bottom - BODY.top;
      const bodyCx = (BODY.left + BODY.right) / 2;
      const inkH = INK.bottom - INK.top;
      const tail = INK.right - bodyCx; // body centre to the labels' end
      const maxEnd = railX - RAIL_CLEAR;
      /* Where the artifact page seats the body in this box: its column
         stopped 36px short of the band's edge, the 600 × 592 box centred. */
      const k1 = Math.min((fig.width - 36) / ASSEMBLY_VB.w, fig.height / ASSEMBLY_VB.h);
      const was = fig.left + (fig.width - 36 - ASSEMBLY_VB.w * k1) / 2 + bodyCx * k1;
      /* (1) the body as tall as the ring, (3) within the stage, over the floor */
      let k = Math.min(ring.height / bodyH, fig.height / inkH);
      let cx = ring.left + ring.width / 2;
      if (cx + tail * k > maxEnd) {
        /* (2) the labels reach the rail first: never smaller than it was,
           never left of where it was, so the body stops growing once
           growing would push it back left of its old seat */
        k = Math.min(k, (maxEnd - fig.left) / (INK.right - BODY.left), (maxEnd - was - 24) / tail);
        k = Math.max(k, k1 * 1.05);
        cx = Math.min(maxEnd - tail * k, ring.left + ring.width / 2);
      }
      k = Math.max(k, 12 / TYPE);
      /* never back into the text column */
      cx = Math.max(cx, fig.left + (bodyCx - BODY.left) * k);

      const w = fig.width / k;
      const h = fig.height / k;
      const vx = bodyCx - (cx - fig.left) / k;
      const vy = (INK.top + INK.bottom) / 2 - h / 2;
      const viewBox = [vx, vy, w, h].map((v) => v.toFixed(2)).join(" ");
      setFit((f) => (f.viewBox === viewBox ? f : { viewBox, align: "xMinYMin meet" }));
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(solve);
    };
    schedule();
    const ro = new ResizeObserver(schedule);
    ro.observe(el);
    const orbit = document.querySelector("#about .arc-about__orbit");
    if (orbit) ro.observe(orbit);
    window.addEventListener("resize", schedule);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} className="xb xb-in-frame">
      <OfferPinned viewBox={fit.viewBox} align={fit.align} layerMark />
    </div>
  );
}
