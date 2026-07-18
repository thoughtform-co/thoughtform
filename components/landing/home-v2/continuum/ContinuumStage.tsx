"use client";

import { useRef } from "react";

import { CONTINUUM_STAGE, type ContinuumSegment } from "./continuumStageData";
import { useContinuumStageScroll } from "../hooks/useContinuumStageScroll";
import { CONTINUUM_RAIL_STAGE } from "../unifiedServicesInstrument";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";

/**
 * ContinuumStage — the pinned #continuum rail stage (ADR-049, capable
 * desktop only).
 *
 * A 200svh runway (`.continuum-stage-root`, the portal slot) pins this
 * sticky, TRANSPARENT stage over the still-live corridor canvas. The
 * receded brandmark re-emerges to mid-prominence in the OPEN CENTRE (the
 * WebGL mark owns that band — nothing DOM paints there), its near-
 * horizontal waist ring re-brightens, and a reticle thumb travels the
 * tool ↔ collaborator spectrum along that ring. This DOM stage carries
 * only the readable chrome — the masthead (restyled to the Services
 * masthead recipe), the three spectrum labels registered left/centre/
 * right under the ring, the instrument readout, and the CTA.
 *
 * Beats (windows in `lib/services-ring/continuumStageMath.ts`, mirrored to
 * CSS vars by useContinuumStageScroll):
 *
 *   0 APPROACH — the mark re-emerges + eases closer; the waist ring
 *                re-brightens; the thumb's opacity gate opens.
 *   1 COPY     — the masthead + labels reveal (scrubbed --continuum-copy-in
 *                with per-child --ci-off stagger — the about-stage.css
 *                recipe; NEVER useRevealMotion: portal nodes are
 *                unobserved and .is-in is one-shot).
 *   2 HOLD     — the reading state; the tail restores the fail-opaque
 *                shield and everything dies together under #practice.
 *
 * Copy strings live in `continuumStageData.ts`, lockstep with the static
 * `.crail` fallback markup. Below the media gate the static crail owns the
 * section (no duplicate DOM; the hook never engages so `data-continuum-mode`
 * stays absent and the runway stays flat — fail-static).
 */

function LedeText({ segments }: { segments: readonly ContinuumSegment[] }) {
  return (
    <>
      {segments.map((seg, i) =>
        typeof seg === "string" ? <span key={i}>{seg}</span> : <em key={i}>{seg.em}</em>
      )}
    </>
  );
}

export function ContinuumStage() {
  const stageRef = useRef<HTMLDivElement>(null);
  const capable = useMediaQuery("(min-width: 961px) and (prefers-reduced-motion: no-preference)");
  useContinuumStageScroll(stageRef);

  // Below the gate the static .continuum + .crail fallback owns the
  // section — no duplicate DOM (the hook also never engages, so
  // `data-continuum-mode` stays absent and the runway stays flat).
  if (!CONTINUUM_RAIL_STAGE || !capable) return null;

  return (
    <>
      {/* The invisible brandmark-journey rail anchor (ADR-049): the v7 DOM
          brandmark actor resolves its "rail" keyframe rect from
          querySelector("#continuum .crail__brand"). While the stage owns
          the section the static #crailBrand below is display:none'd with
          its fallback, so this empty anchor (placed first in document order
          via the pre-head portal slot) becomes that match — the rail→orbit
          transit then launches from the WebGL mark's centre. aria-hidden,
          no paint (its own reveal CSS is scoped to .crail--large
          .crail__brand, which this is not).

          CRITICAL: it must be a SIBLING of .continuum-stage, NOT inside it —
          .continuum-stage is display:none while not engaged, and a 0×0
          rail rect makes computeBrandmarkTransform return null every frame
          (journey.ts keyframeCentreY), freezing the whole brandmark journey
          page-wide. As a runway child it stays laid out (valid rect) in
          both the engaged and not-yet-engaged states. */}
      <div className="continuum-stage__brand crail__brand" aria-hidden="true" />

      <div className="continuum-stage" ref={stageRef} data-continuum-step="0">
        {/* The tail kill rides this inner wrapper (ADR-008 Rule 3: children,
            never the shielding station wrapper): as --continuum-bg-in → 1
            every visible child dies with the fail-opaque shield restoring
            under #practice. Per-child copy reveals compose beneath it. */}
        <div className="continuum-stage__inner">
          <header className="continuum-stage__head">
            <h2 className="continuum-stage__title" style={{ ["--ci-off" as string]: 0 }}>
              {CONTINUUM_STAGE.titleLines.map((line, i) => (
                <span
                  key={i}
                  className={
                    "continuum-stage__title-line" +
                    (line.em ? " continuum-stage__title-line--em" : "")
                  }
                >
                  {line.text}
                </span>
              ))}
            </h2>
            <p className="continuum-stage__lede" style={{ ["--ci-off" as string]: 0.08 }}>
              <LedeText segments={CONTINUUM_STAGE.lede} />
            </p>
          </header>

          {/* ── The spectrum, ON the mark ────────────────────────────────
              A BOLD horizontal tool ↔ collaborator axis painted across the
              re-emerged brandmark's centre (the WebGL mark sits behind this
              transparent stage, roughly at --continuum-axis-y). A traveling
              reticle glides the front span (Tool 1/6 ↔ Collaborator 5/6,
              THUMB_F_MIN/MAX) on the same 7s ping-pong the DOM crail uses.
              Purely decorative chrome — the READABLE spectrum content is the
              three stop descriptions below (they carry the kicker/title/body
              the static `.crail__stops-grid` fallback exposes identically), so
              the axis is aria-hidden and the stops are NOT (regression guard,
              ADR-049 / plan 6.2). The axis draws in on --continuum-approach
              (with the mark), the stops on --continuum-copy-in. */}
          <div className="continuum-stage__spectrum">
            <div className="continuum-stage__axis" aria-hidden="true">
              <div className="continuum-stage__axis-line" />
              <div className="continuum-stage__axis-tick continuum-stage__axis-tick--l" />
              <div className="continuum-stage__axis-tick continuum-stage__axis-tick--m" />
              <div className="continuum-stage__axis-tick continuum-stage__axis-tick--r" />
              <span className="continuum-stage__axis-cap continuum-stage__axis-cap--l">Tool</span>
              <span className="continuum-stage__axis-cap continuum-stage__axis-cap--r">
                Collaborator
              </span>
              <div className="continuum-stage__marker">
                <span className="continuum-stage__marker-ring" />
                <span className="continuum-stage__marker-core" />
                <span className="continuum-stage__marker-cross" />
              </div>
            </div>

            <div className="continuum-stage__labels">
              {CONTINUUM_STAGE.stops.map((stop, i) => (
                <div
                  key={stop.pos}
                  className={`continuum-stage__stop continuum-stage__stop--${stop.pos}`}
                  style={{ ["--ci-off" as string]: 0.16 + i * 0.06 }}
                >
                  <div className="crail__tick" />
                  <div
                    className={"crail__k" + (stop.kickerMod ? ` crail__k--${stop.kickerMod}` : "")}
                  >
                    {stop.kicker}
                  </div>
                  <div className="crail__t">
                    {stop.title.map((line, j) => (
                      <span key={j} className="continuum-stage__stop-line">
                        {line}
                      </span>
                    ))}
                  </div>
                  <div className="crail__b">{stop.body}</div>
                </div>
              ))}
            </div>

            <div className="continuum-stage__readout" style={{ ["--ci-off" as string]: 0.4 }}>
              {CONTINUUM_STAGE.readout}
            </div>

            <div className="continuum-stage__close" style={{ ["--ci-off" as string]: 0.48 }}>
              <a href={CONTINUUM_STAGE.cta.href} className="btn btn--ghost continuum-stage__cta">
                {CONTINUUM_STAGE.cta.label} <span className="arrow" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
