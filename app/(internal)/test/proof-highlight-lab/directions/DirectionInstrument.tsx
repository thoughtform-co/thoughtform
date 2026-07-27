import type { ReactNode } from "react";

import { BarcodeStrip, TickRuler } from "@/components/landing/v7/tools-cards/chrome";

import { LAB_CASE, LAB_HIGHLIGHT_EXTRAS as X } from "../proofHighlightLabData";

/**
 * B — MISSION INSTRUMENT. The same slab, read as hardware.
 *
 * Where A files a document, this one takes a measurement: four oversized gauge
 * cells on tick rulers, the artefact in a scope frame, and a telemetry tape
 * across the foot. No prose at all — the case argued entirely in numbers.
 *
 * The `.pcl-*` atoms (TickRuler, BarcodeStrip) inherit their mono face and
 * night ink from `.pcl-stack` in production; `.phl-pclscope` stands in for
 * that here, or the rulers render in the wrong family.
 */
export function DirectionInstrument({ capture }: { capture: ReactNode }) {
  const period = LAB_CASE.report.meta.find((m) => m.label === "Period")?.value ?? "";

  return (
    <article className="phl-shell phl-in">
      <div className="phl-shell__bd phl-pclscope">
        <div className="phl-rail phl-rail--head">
          <span className="phl-rail__mark">{X.logmark}</span>
          <span className="phl-rail__mid">{X.expedition}</span>
          <span className="phl-rail__idx">
            {LAB_CASE.client} · {period}
          </span>
        </div>

        <div className="phl-in__body">
          {/* ── Left: the gauge cluster ────────────────────────────────── */}
          <div className="phl-in__gauges">
            {X.impactStats.map((s, i) => (
              <div className="phl-gauge" key={s.label}>
                <span className="phl-gauge__idx">{String(i + 1).padStart(2, "0")}</span>
                <span className="phl-gauge__v">{s.value}</span>
                <div className="phl-gauge__ruler" aria-hidden="true">
                  <TickRuler ticks={41} />
                </div>
                <span className="phl-gauge__l">{s.label}</span>
                {s.detail ? <span className="phl-gauge__d">{s.detail}</span> : null}
              </div>
            ))}
          </div>

          {/* ── Right: the artefact under a scope ──────────────────────── */}
          <figure className="phl-in__scope">
            <figcaption className="phl-capture__cap">
              <span>SCOPE — THE ARC · RUN AT LOOP</span>
            </figcaption>
            <div className="phl-capture__frame phl-in__scopeframe">
              <span className="phl-capture__ref">{X.captureRef}</span>
              {capture}
              {/* Bearing reticle — the scope's own graticule, drawn over the
                  subject so the artefact reads as something being measured. */}
              <svg className="phl-in__reticle" viewBox="0 0 100 100" aria-hidden="true">
                <circle cx="50" cy="50" r="34" />
                <circle cx="50" cy="50" r="20" />
                <path d="M50 4v14M50 82v14M4 50h14M82 50h14" />
                {Array.from({ length: 24 }, (_, i) => {
                  const a = (i / 24) * Math.PI * 2;
                  const r0 = i % 6 === 0 ? 40 : 43;
                  return (
                    <path
                      key={i}
                      d={`M${50 + r0 * Math.cos(a)} ${50 + r0 * Math.sin(a)}L${
                        50 + 46 * Math.cos(a)
                      } ${50 + 46 * Math.sin(a)}`}
                    />
                  );
                })}
              </svg>
              <span className="phl-capture__tag">{X.captureTag}</span>
            </div>
          </figure>
        </div>

        {/* Telemetry tape — the one row of prose-adjacent context. */}
        <div className="phl-rail phl-rail--foot phl-in__tape">
          <span className="phl-rail__mark">
            <i className="phl-dia" aria-hidden="true" />
            {X.logCode}
          </span>
          <span className="phl-in__tapefields">
            <b>OPERATOR</b> {X.operator.replace("OPERATOR — ", "")}
            <b>MANDATE</b> {X.mandate}
            <b>STATUS</b> IN SERVICE
          </span>
          <span className="phl-in__barcode" aria-hidden="true">
            <BarcodeStrip seed={LAB_CASE.slug} bars={36} />
          </span>
        </div>
      </div>
    </article>
  );
}
