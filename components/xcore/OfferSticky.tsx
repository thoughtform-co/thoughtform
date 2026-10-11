"use client";

import { useEffect, useRef, useState } from "react";

import { BANKS, CLAUDE, OFFER_HEAD, PHASES, WORKSTREAMS } from "./data";
import { at, Fig, notched, Pin, trace, type Box } from "./fig";

/**
 * O2 · Three phases, read down (Unsiloed's "from raw document to LLM-ready
 * data"). The words stay pinned on the left while the scroll walks the
 * three steps; on the right one board is drawn top to bottom, upstream to
 * downstream, and each step lights its own row. Without JS, or before the
 * first scroll, the board reads whole.
 */
export const O2_BOX: Box = { W: 640, H: 600 };
const B = O2_BOX;
const TEAM = { y: 58, h: 66, w: 136, xs: [24, 174, 324, 474] } as const;
const CHIP = { x: 64, y: 206, w: 512, h: 168 } as const;
const CL = { x: 64, y: 470, w: 512, h: 106 } as const;
const DOWN = [176, 320, 464] as const;

export function OfferSticky({ id }: { id: string }) {
  const ref = useRef<HTMLElement>(null);
  const [phase, setPhase] = useState(3);
  const [pin, setPin] = useState<"pre" | "on" | "post">("pre");
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const read = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const run = r.height - window.innerHeight;
      const p = run > 0 ? Math.min(1, Math.max(0, -r.top / run)) : 1;
      setPhase(p < 0.3 ? 1 : p < 0.64 ? 2 : 3);
      // ⚠ NOT `position: sticky`: the arc shell's body is its own scroll
      // container (overflow-y: auto) while the document scrolls, so a
      // sticky child resolves against a scrollport that never moves and
      // lands a viewport low. Fixed while the runway is on screen instead.
      setPin(r.top > 0 ? "pre" : r.bottom < window.innerHeight ? "post" : "on");
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const teamX = TEAM.xs.map((x) => x + TEAM.w / 2);
  return (
    <section ref={ref} id={id} className="xc-sec xc-runway" data-phase={phase} data-pin={pin}>
      <span id={`${id}-1`} className="xc-mark" style={{ top: 0 }} />
      <span id={`${id}-2`} className="xc-mark" style={{ top: "100svh" }} />
      <span id={`${id}-3`} className="xc-mark" style={{ top: "200svh" }} />
      <div className="xc-pin-frame">
        <div className="arc-band">
          <div className="xc-split">
            <div className="xc-split__text">
              <p className="xc-eyebrow">
                <span className="xc-eyebrow__mark" aria-hidden="true" />
                {OFFER_HEAD.eyebrow}
                <span className="xc-route">O2 · three phases</span>
              </p>
              <h2 className="xc-title">
                {OFFER_HEAD.title}
                <span className="xc-title__dim"> {OFFER_HEAD.dim}</span>
              </h2>
              <ol className="xc-phases">
                {PHASES.map((p, i) => (
                  <li key={p.id} className="xc-phase" data-on={i + 1 === phase ? "" : undefined}>
                    <span className="xc-phase__n">{p.n}</span>
                    <span className="xc-phase__t">{p.title}</span>
                    <span className="xc-phase__l">{p.line}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="xc-split__fig">
              <Fig
                box={B}
                className="xc-board xc-board--down"
                label="The offering read down: the team's four workstreams, the layer they write, X-Bionic's Claude Enterprise with the layer installed."
                svg={
                  <>
                    <path className="xc-housing" d={notched(0.5, 0.5, B.W - 1, B.H - 1, 16)} />
                    <pattern id="xc-dots-2" width="20" height="20" patternUnits="userSpaceOnUse">
                      <circle cx="1" cy="1" r="0.9" className="xc-dot" />
                    </pattern>
                    <rect x={1} y={1} width={B.W - 2} height={B.H - 2} fill="url(#xc-dots-2)" />
                    <line className="xc-rule" x1={1} y1={160} x2={B.W - 1} y2={160} />
                    <line className="xc-rule" x1={1} y1={432} x2={B.W - 1} y2={432} />

                    <g data-p="2">
                      {teamX.map((x) => (
                        <g key={x}>
                          <path
                            className="xc-trace"
                            d={trace([
                              [x, TEAM.y + TEAM.h],
                              [x, CHIP.y],
                            ])}
                          />
                          <Pin x={x} y={TEAM.y + TEAM.h} />
                          <Pin x={x} y={CHIP.y} lit />
                        </g>
                      ))}
                    </g>
                    <g data-p="3">
                      {DOWN.map((x, i) => (
                        <g key={x}>
                          <path
                            className="xc-trace xc-trace--lit"
                            d={trace([
                              [x + i * 0, CHIP.y + CHIP.h],
                              [x, CL.y],
                            ])}
                          />
                          <Pin x={x} y={CHIP.y + CHIP.h} lit />
                          <Pin x={x} y={CL.y} lit />
                        </g>
                      ))}
                    </g>

                    <g data-p="1">
                      {TEAM.xs.map((x) => (
                        <rect
                          key={x}
                          className="xc-node"
                          x={x}
                          y={TEAM.y}
                          width={TEAM.w}
                          height={TEAM.h}
                        />
                      ))}
                    </g>
                    <g data-p="2">
                      <path className="xc-chip" d={notched(CHIP.x, CHIP.y, CHIP.w, CHIP.h, 14)} />
                      <line
                        className="xc-chip__rule"
                        x1={CHIP.x}
                        y1={CHIP.y + 36}
                        x2={CHIP.x + CHIP.w}
                        y2={CHIP.y + 36}
                      />
                      {[1, 2].map((k) => (
                        <line
                          key={k}
                          className="xc-chip__seam"
                          x1={CHIP.x + (CHIP.w / 3) * k}
                          y1={CHIP.y + 48}
                          x2={CHIP.x + (CHIP.w / 3) * k}
                          y2={CHIP.y + CHIP.h - 12}
                        />
                      ))}
                    </g>
                    <g data-p="3">
                      <rect className="xc-node" x={CL.x} y={CL.y} width={CL.w} height={CL.h} />
                      <rect
                        className="xc-installed"
                        x={CL.x + 300}
                        y={CL.y + 12}
                        width={200}
                        height={28}
                      />
                      <line
                        className="xc-rule"
                        x1={CL.x}
                        y1={CL.y + 52}
                        x2={CL.x + CL.w}
                        y2={CL.y + 52}
                      />
                      {[1, 2, 3].map((k) => (
                        <line
                          key={k}
                          className="xc-rule"
                          x1={CL.x + (CL.w / 4) * k}
                          y1={CL.y + 52}
                          x2={CL.x + (CL.w / 4) * k}
                          y2={CL.y + CL.h}
                        />
                      ))}
                    </g>
                  </>
                }
              >
                <p className="xc-cellhead" style={at(B, 24, 22)}>
                  <span className="xc-cellhead__n">01</span>The team
                </p>
                <p className="xc-cellhead" style={at(B, 24, 176)}>
                  <span className="xc-cellhead__n">02</span>The layer
                </p>
                <p className="xc-cellhead" style={at(B, 24, 446)}>
                  <span className="xc-cellhead__n">03</span>Claude Enterprise
                </p>
                {WORKSTREAMS.map((w, i) => (
                  <div
                    key={w.id}
                    className="xc-nodetext"
                    data-p="1"
                    style={at(B, TEAM.xs[i], TEAM.y, TEAM.w, TEAM.h)}
                  >
                    <span className="xc-nodetext__meta">Creative</span>
                    <span className="xc-nodetext__name">
                      {w.name.replace("Creative ", "").replace(/^./, (c) => c.toUpperCase())}
                    </span>
                  </div>
                ))}
                <p
                  className="xc-chiphead"
                  data-p="2"
                  style={at(B, CHIP.x + 16, CHIP.y, CHIP.w - 32, 36)}
                >
                  <span>X-Bionic layer</span>
                  <span className="xc-chiphead__r">Plugin</span>
                </p>
                {BANKS.map((b, i) => (
                  <div
                    key={b.id}
                    className="xc-bankcol"
                    data-p="2"
                    style={at(
                      B,
                      CHIP.x + (CHIP.w / 3) * i + 16,
                      CHIP.y + 52,
                      CHIP.w / 3 - 28,
                      CHIP.h - 60
                    )}
                  >
                    <span className="xc-bank__name">{b.name}</span>
                    <span className="xc-bank__items">
                      {b.detail.map(([it]) => (
                        <span key={it}>{it}</span>
                      ))}
                    </span>
                  </div>
                ))}
                <div className="xc-nodetext" data-p="3" style={at(B, CL.x, CL.y, 290, 52)}>
                  <span className="xc-nodetext__name">{CLAUDE.name}</span>
                </div>
                <p
                  className="xc-installedtext"
                  data-p="3"
                  style={at(B, CL.x + 300, CL.y + 12, 200, 28)}
                >
                  + X-Bionic layer
                </p>
                {[...CLAUDE.surfaces.map((s) => s.split(" and ")[0]), ...CLAUDE.connectors].map(
                  (c, i) => (
                    <div
                      key={c}
                      className="xc-nodetext xc-nodetext--center"
                      data-p="3"
                      style={at(B, CL.x + (CL.w / 4) * i, CL.y + 52, CL.w / 4, CL.h - 52)}
                    >
                      <span className="xc-nodetext__meta">{c}</span>
                    </div>
                  )
                )}
              </Fig>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
