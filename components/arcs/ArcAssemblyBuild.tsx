"use client";

import { useEffect, useRef, useState } from "react";

import { Assembly } from "@/components/xb-proposal/offer/Assembly";

/**
 * ArcAssemblyBuild — S1 · A, the pinned build, in the vision console's left
 * cell (owner, 2026-10-11: "port S1 A Pinned Build to the section"). The
 * drawing is the lab's own `Assembly`, imported, never redrawn; this island
 * only drives its `p` (1 → 3: the team, the layer, the layer seated in
 * Claude Enterprise) from the section's runway.
 *
 * The pin: the section carries a runway after its band (`.arc-lev__run`,
 * rendered by `ArcLeverage`), the band is sticky, and its `top` is written
 * here as `--lev-pin`: the head's datum when the band fits the screen,
 * otherwise the band's last screen, so the console is whole while it builds.
 * Below the fill rhythm's gate (961px, or reduced motion) nothing pins and
 * the drawing rests built. With no JS it rests built too.
 */
const PIN_MEDIA = "(min-width: 961px) and (prefers-reduced-motion: no-preference)";
/* The assembly's own box is 600 × 592 with empty air above the team and
   below the board; the cell crops to the drawing's measured extent across
   all three steps (30.8 → 607.6, 77.9 → 536.7) plus 8 units. Same drawing,
   less letterbox: the console is ~110px shorter at 1280. */
const CROP = "22 70 594 475";
const FLOOR = 16;
/* The labels letter at 14.5 user units; at this scale of the crop they
   paint at 12px, the type floor, so the drawing is never capped smaller. */
const TYPE_FLOOR = 12 / 14.5;

export function ArcAssemblyBuild({ label, viewBox }: { label: string; viewBox?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [p, setP] = useState(3);

  useEffect(() => {
    const el = ref.current;
    const section = el?.closest("section");
    const band = section?.querySelector<HTMLElement>(":scope > .arc-band");
    const run = section?.querySelector<HTMLElement>(":scope > .arc-lev__run");
    if (!el || !section || !band || !run) return;
    const mq = window.matchMedia(PIN_MEDIA);
    let top = 0;
    let datum = 0;
    let raf = 0;

    const svg = el.querySelector("svg");
    const head = band.querySelector<HTMLElement>(":scope > .arc-head");
    const con = band.querySelector<HTMLElement>(":scope > .arc-lev");
    /* The pin, solved per screen. First choice: the whole band (title and
       console) on screen, the drawing capped by height to make room, never
       below the type floor. Otherwise the title leaves the screen whole
       (never half a line at the top) and the console sits centred. */
    const measure = () => {
      if (!svg) return;
      svg.style.removeProperty("max-width");
      if (!mq.matches) {
        section.style.removeProperty("--lev-pin");
        return;
      }
      const vh = window.innerHeight;
      datum = parseFloat(getComputedStyle(section).paddingTop) || 0;
      /* The head's eyebrow and marks hang above its box: they count. */
      const bandTop = band.getBoundingClientRect().top;
      let lift = 0;
      let headEnd = 0;
      if (head)
        for (const n of [head, ...head.querySelectorAll<HTMLElement>("*")]) {
          const r = n.getBoundingClientRect();
          if (!r.height) continue;
          lift = Math.max(lift, bandTop - r.top);
          headEnd = Math.max(headEnd, r.bottom - bandTop);
        }
      const box = svg.viewBox.baseVal;
      const svgH = svg.getBoundingClientRect().height;
      const room = vh - 2 * FLOOR - lift - (band.offsetHeight - svgH);
      if (room < svgH && room >= box.height * TYPE_FLOOR) {
        svg.style.maxWidth = `${Math.floor((room * box.width) / box.height)}px`;
      }
      const bandH = band.offsetHeight;
      if (bandH + lift <= vh - 2 * FLOOR) {
        top = Math.max(FLOOR + lift, Math.min(datum, vh - FLOOR - bandH));
      } else {
        const conTop = con ? con.offsetTop : 0;
        const conH = con ? con.offsetHeight : bandH;
        top = Math.min(-headEnd - 1, (vh - conH) / 2 - conTop, vh - FLOOR - conTop - conH);
      }
      section.style.setProperty("--lev-pin", `${top}px`);
    };
    const read = () => {
      raf = 0;
      if (!mq.matches) {
        setP(3);
        return;
      }
      const r = section.getBoundingClientRect();
      const span = run.offsetHeight;
      const t = span > 0 ? Math.min(1, Math.max(0, (top - datum - r.top) / span)) : 1;
      setP(1 + 2 * t);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    const onResize = () => {
      measure();
      onScroll();
    };

    measure();
    read();
    const ro = new ResizeObserver(onResize);
    ro.observe(band);
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    window.addEventListener("resize", onResize);
    mq.addEventListener("change", onResize);
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("resize", onResize);
      mq.removeEventListener("change", onResize);
      if (raf) cancelAnimationFrame(raf);
      section.style.removeProperty("--lev-pin");
    };
  }, []);

  return (
    <div ref={ref} className="arc-lev__build" data-lev-step={p < 1.5 ? 1 : p < 2.5 ? 2 : 3}>
      <svg
        viewBox={viewBox ?? CROP}
        role="img"
        aria-label={label}
        style={{
          display: "block",
          width: "100%",
          marginInline: "auto",
          height: "auto",
          overflow: "visible",
          fontFamily: "var(--lv-mono)",
          fontSize: 14.5,
          letterSpacing: "0.08em",
        }}
      >
        <Assembly p={p} />
      </svg>
    </div>
  );
}
