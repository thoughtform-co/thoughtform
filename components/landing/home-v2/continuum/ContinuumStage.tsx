"use client";

import { useEffect, useRef } from "react";

import { CONTINUUM_STAGE, type ContinuumSegment } from "./continuumStageData";
import { useContinuumStageScroll } from "../hooks/useContinuumStageScroll";
import { CONTINUUM_RAIL_STAGE } from "../unifiedServicesInstrument";
import { continuumBandAnchorsRef } from "@/lib/services-ring/continuumBandAnchorsRef";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";

/**
 * ContinuumStage — the pinned #continuum rail stage (ADR-049, capable
 * desktop only).
 *
 * A 200svh runway (`.continuum-stage-root`, the portal slot) pins this
 * sticky, TRANSPARENT stage over the still-live corridor canvas. The
 * receded brandmark re-emerges to mid-prominence in the OPEN CENTRE (the
 * WebGL mark owns that band — nothing DOM paints there) and its inner
 * horizontal band lights up as the tool ↔ collaborator spectrum: a soft
 * base glow + a pendulum head with a comet trail, IN the mark's own shader
 * (ADR-049 Update 3 — no orbits, no axis chrome; the spectrum is the mark
 * itself). This DOM stage carries only the readable chrome — the masthead
 * (restyled to the Services masthead recipe), the Tool/Collaborator caps
 * DOCKED to the band's projected endpoints (written imperatively by the
 * corridor canvas via `continuumBandAnchorsRef` — the elements register
 * here, the per-frame transform/opacity comes from
 * `ContinuumBandLabelAnchors` in BrandmarkPhysicsCoreActor), the three
 * spectrum stops beneath, the instrument readout, and the CTA.
 *
 * Beats (windows in `lib/services-ring/continuumStageMath.ts`, mirrored to
 * CSS vars by useContinuumStageScroll):
 *
 *   0 APPROACH — the mark re-emerges + eases closer; the band's sweep is
 *                already breathing in (it pre-warms on the formT prelude
 *                during the #about exit slide); the docked caps fade in
 *                with the approach.
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
  const bandCapLeftRef = useRef<HTMLDivElement>(null);
  const bandCapRightRef = useRef<HTMLDivElement>(null);
  const capable = useMediaQuery("(min-width: 961px) and (prefers-reduced-motion: no-preference)");
  useContinuumStageScroll(stageRef);

  // Register the band-cap elements for the corridor-side projector
  // (ContinuumBandLabelAnchors). Re-runs when the media gate flips so a
  // desktop resize re-registers the freshly-rendered caps; cleanup nulls
  // the handles so the projector never writes into a detached tree.
  useEffect(() => {
    const anchors = continuumBandAnchorsRef.current;
    anchors.leftEl = bandCapLeftRef.current;
    anchors.rightEl = bandCapRightRef.current;
    return () => {
      anchors.leftEl = null;
      anchors.rightEl = null;
    };
  }, [capable]);

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

          {/* ── The spectrum IS the mark (ADR-049 Update 3) ───────────────
              The re-emerged WebGL brandmark behind this transparent stage
              lights its own inner horizontal band — base glow + pendulum
              head + comet trail, in the mark shader — so no DOM axis paints
              here anymore (the Update-1 interim axis is deleted). The only
              spectrum chrome this stage carries is the two Tool /
              Collaborator caps, DOCKED to the band's projected endpoints:
              position/opacity are written per frame by the corridor canvas
              (ContinuumBandLabelAnchors → continuumBandAnchorsRef), so they
              ride the instrument through pointer-look + the approach zoom.
              Decorative chrome — the READABLE spectrum content is the three
              stop descriptions below (they carry the kicker/title/body the
              static `.crail__stops-grid` fallback exposes identically), so
              the caps are aria-hidden and the stops are NOT (regression
              guard, ADR-049 / plan 6.2). The stops reveal on
              --continuum-copy-in. */}
          <div className="continuum-stage__spectrum">
            <div className="continuum-stage__band-caps" aria-hidden="true">
              <div ref={bandCapLeftRef} className="continuum-stage__band-cap">
                <span>Tool</span>
                <span className="continuum-stage__band-dash" />
              </div>
              <div ref={bandCapRightRef} className="continuum-stage__band-cap">
                <span className="continuum-stage__band-dash continuum-stage__band-dash--flip" />
                <span>Collaborator</span>
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
