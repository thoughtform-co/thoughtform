"use client";

/**
 * ArcHoloLabels — the drawing's words, as real DOM, tracking their anchors.
 *
 * ⚠ NOTHING IS EVER LETTERED ON THE OBJECT. The register's one hard law
 * (`.claude/rules/proof.md` §The BOARD archetype): the Intelligence Map city
 * printed its district plaques through their own plates 10–13 times a sheet,
 * at every viewport, in both themes, with every containment guard green. Here
 * the words are PT Mono in the page's own type, they carry hrefs where the
 * record has them, and they follow the object rather than being drawn into it.
 *
 * ⚠ A FULL BOARD DROPS, IT NEVER PRINTS THROUGH (Moira's rule). The declutter
 * pushes blocks apart and the leader carries the displacement; when a lane is
 * genuinely out of room the LOWEST-PRIORITY block is hidden rather than
 * overlapped. Nothing is lost from the page — every string is also in the
 * beat's own copy, which is what makes dropping honest.
 *
 * ⚠ NOT A SCROLL WRITER (ADR-002). It reads a channel and writes inline
 * transforms; the rAF is gated three ways — the mode attribute, an
 * IntersectionObserver and document visibility — because the anchors cannot
 * change while any of those is false.
 */

import { useEffect, useMemo, useRef } from "react";

import {
  layoutHoloLabels,
  type LabelBox,
  type LabelMetrics,
} from "@/components/holo-program/holoLabelLayout";
import type { AnchorChannel } from "@/components/holo-stage/stageAnchors";

export interface HoloLabelSpec {
  id: string;
  /** The mono chrome line — a key, a date, a lane name. */
  key?: string;
  /** The reading line. */
  text: string;
  /** An in-page link, where the record has one. */
  href?: string;
  /** ADR-106's dial law: a FILLED node is a person's hand, an OPEN one the
   *  model. The whole reading on the horizon, and it needs no legend. */
  by?: "person" | "model";
  /** Lower goes first when the board is full. */
  priority?: number;
}

/**
 * ⚠ NOT `labelMetrics`, AND THE DIFFERENCE IS THE CONTENT. That one is solved
 * for the trajectory's stations — a date over a name over a hovered sentence,
 * 140–200px wide and two lines tall. These blocks are a mono key over one
 * short line ("Nu", "2024", "minuten"), and measuring a four-character year
 * against a 200px box invents collisions that are not on the screen: on the
 * first live shoot three of nine curve labels dropped with nothing touching.
 *
 * ⚠ THE STAND-OFF IS THE OTHER HALF. At the trajectory's ~22–32px a label
 * lands ON the object it names — the rings there are thin and these are
 * volumes — so it is a third again, and it is what keeps the words off the
 * faces the register forbids lettering.
 */
export function stageLabelMetrics(width: number): LabelMetrics {
  const clamp = (lo: number, v: number, hi: number) => Math.min(hi, Math.max(lo, v));
  return {
    blockW: Math.round(clamp(84, 0.082 * width, 156)),
    blockH: Math.round(clamp(26, 0.026 * width, 44)),
    standOff: Math.round(clamp(34, 0.030 * width, 52)),
    pad: 12,
  };
}

export function ArcHoloLabels({
  channel,
  labels,
}: {
  channel: AnchorChannel;
  labels: readonly HoloLabelSpec[];
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const leadRef = useRef<SVGPathElement | null>(null);
  const items = useRef<Record<string, HTMLLIElement | null>>({});
  /* ⚠ THE MAP IS DERIVED, NOT WRITTEN THROUGH A REF DURING RENDER. Assigning
     `prio.current` in the body is a ref access during render; the frame loop
     needs a stable reader, so the value is memoised and an effect hands it to
     the loop. */
  const priority = useMemo(
    () => Object.fromEntries(labels.map((l, i) => [l.id, l.priority ?? i])),
    [labels]
  );
  const prio = useRef<Record<string, number>>(priority);
  useEffect(() => {
    prio.current = priority;
  }, [priority]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const section = host.closest("section");

    let raf = 0;
    let onScreen = false;
    let tracking = false;

    /* ⚠ THE STALE-TRANSFORM PATH IS THE ONE THAT BREAKS THE FALLBACK. A canvas
       error resets `data-holo` to "static" and the SVG comes back — with the
       labels frozen at whatever the last live frame wrote. Clear on every
       stop, and on unmount. */
    const clear = () => {
      for (const el of Object.values(items.current)) {
        if (!el) continue;
        el.style.transform = "";
        el.style.width = "";
        el.style.opacity = "";
        el.style.zIndex = "";
        el.removeAttribute("data-dropped");
      }
      if (leadRef.current) leadRef.current.setAttribute("d", "");
      tracking = false;
    };

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (section?.getAttribute("data-holo") !== "live" || document.visibilityState !== "visible") {
        if (tracking) clear();
        return;
      }
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (w === 0 || h === 0) return;
      const anchors = channel.read();
      if (anchors.length === 0) return;

      const m = stageLabelMetrics(w);
      const boxes = layoutHoloLabels(anchors, { w, h }, m);
      let d = "";
      const placed: { id: string; el: HTMLLIElement }[] = [];
      for (const b of boxes) {
        const el = items.current[b.id];
        if (!el) continue;
        if (!b.visible) {
          el.style.opacity = "0";
          el.setAttribute("data-dropped", "");
          continue;
        }
        el.removeAttribute("data-dropped");
        /* ⚠ THE BLOCK'S WIDTH IS WRITTEN, NOT DECLARED. The solver separates
           boxes `m.blockW` wide; the stylesheet capped them at a literal, so
           at 1194px of canvas it pushed 98px apart while the text ran to 200
           — measured as `retry` printing through `ask` with the declutter
           reporting a clean lane. Mirroring the clamp in CSS is the other way
           round, and a second place for one number to be wrong. */
        el.style.width = `${m.blockW}px`;
        /* ⚠ THE WHOLE TRANSFORM IS WRITTEN HERE, CENTRING INCLUDED. An inline
           write REPLACES the CSS one, so a stylesheet's `translate(-50%,-50%)`
           would simply vanish — the lab's own recorded bug, one folder over. */
        el.style.transform = `translate3d(${b.x.toFixed(1)}px, ${b.y.toFixed(1)}px, 0) translate3d(-50%, -50%, 0)`;
        el.style.opacity = String(0.42 + b.frontness * 0.58);
        el.style.zIndex = String(Math.round(b.frontness * 100));
        d += leaderPath(b, m);
        placed.push({ id: b.id, el });
      }
      /* ⚠ THE DROP PASS MEASURES THE RENDERED BOX, NOT THE SOLVER'S MODEL OF
         IT. `m.blockH` is one nominal block; a gate's label wraps to three
         lines and stands half again as tall, so a model-based walk reported a
         clean board while `Stapt terug en tekent opnieuw` printed through
         `Jij zet het doel en de checks` — ADR-070's finding, which this
         estate has now made four times: a guard that measures a model of the
         drawing rather than the drawing. Ten elements, once per frame. */
      dropOverlaps(placed, prio.current);
      /* One path for every leader — one DOM write per frame, not twenty. */
      if (leadRef.current) leadRef.current.setAttribute("d", d);
      tracking = true;
    };

    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting === onScreen) return;
        onScreen = e.isIntersecting;
        if (onScreen) {
          raf = requestAnimationFrame(tick);
        } else {
          cancelAnimationFrame(raf);
          raf = 0;
          clear();
        }
      },
      { rootMargin: "20% 0px" }
    );
    io.observe(host);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      clear();
    };
  }, [channel]);

  return (
    <div className="arc-holo__labels" ref={hostRef}>
      <svg className="arc-holo__leads" aria-hidden="true" focusable="false">
        <path ref={leadRef} d="" />
      </svg>
      <ul>
        {labels.map((l) => {
          const Tag = l.href ? "a" : "span";
          return (
            <li
              className="arc-holo__lbl"
              key={l.id}
              data-holo-lbl={l.id}
              data-by={l.by}
              ref={(el) => {
                items.current[l.id] = el;
              }}
            >
              <Tag className="arc-holo__hit" {...(l.href ? { href: l.href } : {})}>
                {l.key ? <span className="arc-holo__key">{l.key}</span> : null}
                <span className="arc-holo__text">{l.text}</span>
              </Tag>
              {l.by ? <i className="arc-holo__node" aria-hidden="true" /> : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * Hide what the declutter could not separate, cheapest block first.
 *
 * ⚠ IT IS A MECHANISM, NOT A SAFETY NET. Twenty blocks hung off a drawing in a
 * beat one viewport tall genuinely do not all fit at 1280×720, and the
 * declutter's own note (one folder over) records that two labels overlap at
 * rest before anyone turns anything. Printing through is the worse answer, and
 * nothing is lost from the PAGE: every string is also in the beat's own copy,
 * which is what makes dropping honest.
 */
function dropOverlaps(
  placed: readonly { id: string; el: HTMLLIElement }[],
  priority: Record<string, number>
): void {
  const rects = placed.map((p) => p.el.getBoundingClientRect());
  const out = new Set<string>();
  for (let i = 0; i < placed.length; i++) {
    for (let j = i + 1; j < placed.length; j++) {
      const a = placed[i];
      const b = placed[j];
      if (out.has(a.id) || out.has(b.id)) continue;
      const A = rects[i];
      const B = rects[j];
      if (A.left >= B.right || B.left >= A.right || A.top >= B.bottom || B.top >= A.bottom) continue;
      const pa = priority[a.id] ?? 99;
      const pb = priority[b.id] ?? 99;
      /* The cheaper block goes; on a tie the one further back, so a name in
         front of the object never loses its slot to one behind it. */
      out.add(pa === pb ? (A.top <= B.top ? b.id : a.id) : pa > pb ? a.id : b.id);
    }
  }
  for (const p of placed) {
    if (!out.has(p.id)) continue;
    p.el.style.opacity = "0";
    p.el.setAttribute("data-dropped", "");
  }
}

/** From the anchor to the block's near edge, as one `M…L…` run. */
function leaderPath(b: LabelBox, m: { blockW: number; blockH: number }): string {
  const dx = b.x - b.ax;
  const dy = b.y - b.ay;
  const len = Math.hypot(dx, dy) || 1;
  const t = Math.max(0, len - Math.min(m.blockH / 2, m.blockW / 2)) / len;
  const ex = b.ax + dx * t;
  const ey = b.ay + dy * t;
  return `M${b.ax.toFixed(1)} ${b.ay.toFixed(1)}L${ex.toFixed(1)} ${ey.toFixed(1)}`;
}
