"use client";

/* Direction A · the pinned build. The words hold still on the left; on the
   right one isometric drawing assembles in three moves as the reader
   scrolls: the team, then the layer drawn out of the team's work, then the
   layer seated in the company's Claude Enterprise beside Shopify and
   analytics. `step` fixes a move for a still; without it the scroll drives. */

import { useEffect, useRef, useState } from "react";
import { OFFER } from "../copy";
import { Stage } from "../Frame";
import { ASSEMBLY_VB, Assembly } from "./Assembly";

const VB_W = ASSEMBLY_VB.w;
const VB_H = ASSEMBLY_VB.h;

export function OfferPinned({ step }: { step?: 1 | 2 | 3 }) {
  const fixed = step !== undefined;
  const runway = useRef<HTMLDivElement>(null);
  const [p, setP] = useState<number>(step ?? 1);

  useEffect(() => {
    if (fixed) return;
    let raf = 0;
    const read = () => {
      raf = 0;
      const el = runway.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const span = r.height - window.innerHeight;
      const t = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
      setP(1 + 2 * t);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [fixed]);

  const active = p < 1.5 ? 1 : p < 2.5 ? 2 : 3;
  const stage = (
    <Stage route={fixed ? `S1 · A · step ${step}` : "S1 · A · pinned build"}>
      <div className="xbA">
        <div className="xbA__text">
          <div className="xb-eyebrow">{OFFER.eyebrow}</div>
          <h2 className="xb-title">
            {OFFER.title[0]}
            <br />
            <span>{OFFER.title[1]}</span>
          </h2>
          <ol className="xbA__steps">
            {OFFER.steps.map((s, i) => (
              <li key={s.n} className="xbA__step" data-on={active === i + 1 || undefined}>
                <span className="xbA__n">{s.n}</span>
                <span className="xbA__head">{s.head}</span>
                <p className="xbA__body">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
        <div className="xbA__fig">
          <svg
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label="The team, the layer and Claude Enterprise, drawn as one assembly"
          >
            <Assembly p={p} />
          </svg>
        </div>
      </div>
    </Stage>
  );

  if (fixed) return stage;
  return (
    <div ref={runway} className="xbA-runway">
      <div className="xbA-pin">{stage}</div>
    </div>
  );
}
