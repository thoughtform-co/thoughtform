"use client";

import { useEffect, useRef } from "react";

import { CONTINUUM_STAGE, type ContinuumSegment } from "./continuumStageData";
import { useContinuumStageScroll } from "../hooks/useContinuumStageScroll";
import { CONTINUUM_RAIL_STAGE } from "../unifiedServicesInstrument";
import { continuumBandAnchorsRef } from "@/lib/services-ring/continuumBandAnchorsRef";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";

/**
 * ContinuumStage — the pinned #continuum rail stage (ADR-049 Update 6,
 * capable desktop only).
 *
 * A 150svh runway (`.continuum-stage-root`, the portal slot) pins this
 * sticky, TRANSPARENT stage over the still-live corridor canvas. The
 * tool ↔ collaborator slider is INTEGRATED INTO the brandmark itself: the
 * mark's inner horizontal wireframe band lights up in its own shader (soft
 * base glow + a bright head with a comet trail — the `uBand*` block), and
 * the slider's crisp chrome docks to the band's PROJECTED geometry — the
 * navigator reticle rides the glowing head (condenses at the mark's
 * centre seat, launches to the Tool end, then swings the 7s Tool ↔
 * Collaborator ping-pong the fallback crail runs), and the Tool /
 * Collaborator caps hang off the band's endpoints. Nothing DOM paints a
 * rail — the mark's own dotted band IS the track. All of it assembles
 * DURING the About → Continuum approach (the formation clock) and snaps
 * together as the section pins.
 *
 * This component therefore renders only:
 *   · the masthead + the three readable stops + readout + CTA (stage-flow
 *     copy, scrubbed off `--continuum-copy-in` with per-child --ci-off —
 *     the about-stage recipe; NEVER useRevealMotion: portal nodes are
 *     unobserved and .is-in is one-shot), and
 *   · the docked chrome elements (caps + reticle), which it REGISTERS
 *     into `continuumBandAnchorsRef` — the corridor canvas
 *     (ContinuumBandSliderAnchors) is the single writer of their
 *     transform/opacity every frame. Without the corridor writer they
 *     never paint (opacity 0 default).
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
  const reticleRef = useRef<HTMLDivElement>(null);
  const capable = useMediaQuery("(min-width: 961px) and (prefers-reduced-motion: no-preference)");
  useContinuumStageScroll(stageRef);

  // Register the docked-chrome elements for the corridor-side projector
  // (ContinuumBandSliderAnchors). Re-runs when the media gate flips so a
  // desktop resize re-registers the freshly-rendered elements; cleanup
  // nulls the handles so the projector never writes into a detached tree.
  useEffect(() => {
    const anchors = continuumBandAnchorsRef.current;
    anchors.leftEl = bandCapLeftRef.current;
    anchors.rightEl = bandCapRightRef.current;
    anchors.reticleEl = reticleRef.current;
    return () => {
      anchors.leftEl = null;
      anchors.rightEl = null;
      anchors.reticleEl = null;
    };
  }, [capable]);

  // Below the gate the static .continuum + .crail fallback owns the
  // section — no duplicate DOM (the hook also never engages, so
  // `data-continuum-mode` stays absent and the runway stays flat).
  if (!CONTINUUM_RAIL_STAGE || !capable) return null;

  const [toolStop, midStop, collabStop] = CONTINUUM_STAGE.stops;

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
          {/* Two-column head — title LEFT / lede RIGHT, first lines aligned
              on the editorial band (owner 2026-07-19: "same structure as the
              services section", superseding the Update-2 centred head). The
              lede returns from the foot to the right column. */}
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

          {/* ── The slider chrome, DOCKED to the mark's lit band ──────────
              position: fixed elements whose transform/opacity are written
              per frame by the corridor canvas (continuumBandAnchorsRef):
              the Tool / Collaborator caps hang off the band's projected
              endpoints (outlined pole diamond + leader dash + label), and
              the navigator reticle (ring + crosshairs + gold diamond — the
              v7 `.crail__reticle` recipe) rides the projected slider head,
              i.e. the SAME point the shader's glowing pendulum head lights.
              Purely decorative chrome (aria-hidden) — the READABLE spectrum
              content is the three stop descriptions below (they carry the
              kicker/title/body the static `.crail__stops-grid` fallback
              exposes identically; regression guard, ADR-049 / plan 6.2). */}
          {/* The Tool / Collaborator caps carry their READABLE description
              now — the title + body hang UNDER the pole label as an
              absolutely-positioned block (`__cap-copy`), so they ride the
              cap's projected transform and read as "attached to the rail
              endpoint" (owner 2026-07-19). The cap BOX stays the one label
              row, so the projector's `-50%` anchor still centres the label on
              the band; the copy hangs below via top:100%. Decorative leader
              (dash + pole) is aria-hidden; the label + copy are semantic. */}
          <div ref={bandCapLeftRef} className="continuum-stage__band-cap continuum-stage__band-cap--l">
            <span className="continuum-stage__band-label">{toolStop.kicker}</span>
            <span className="continuum-stage__band-dash" aria-hidden="true" />
            <span className="continuum-stage__band-pole" aria-hidden="true" />
            <div className="continuum-stage__cap-copy">
              <div className="crail__t">
                {toolStop.title.map((line, j) => (
                  <span key={j} className="continuum-stage__stop-line">
                    {line}
                  </span>
                ))}
              </div>
              <div className="crail__b">{toolStop.body}</div>
            </div>
          </div>
          <div ref={bandCapRightRef} className="continuum-stage__band-cap continuum-stage__band-cap--r">
            <span className="continuum-stage__band-pole" aria-hidden="true" />
            <span className="continuum-stage__band-dash continuum-stage__band-dash--flip" aria-hidden="true" />
            <span className="continuum-stage__band-label">{collabStop.kicker}</span>
            <div className="continuum-stage__cap-copy">
              <div className="crail__t">
                {collabStop.title.map((line, j) => (
                  <span key={j} className="continuum-stage__stop-line">
                    {line}
                  </span>
                ))}
              </div>
              <div className="crail__b">{collabStop.body}</div>
            </div>
          </div>
          <div ref={reticleRef} className="continuum-stage__reticle" aria-hidden="true">
            <span className="continuum-stage__reticle-ring" />
            <span className="continuum-stage__reticle-cross" />
            <span className="continuum-stage__reticle-diamond" />
          </div>

          {/* ── The readable centre stop + readout + lede — beneath the mark,
              on the stage's copy reveal. The Tool / Collaborator stops moved
              UP onto their rail caps (above); only the middle "AI lives here"
              stop stays centred under the mark. The lede is relocated to the
              FOOT of the beat (owner 2026-07-19) — it keeps its continuum
              styling but now closes the section instead of opening it; the
              "See the practice" CTA is removed. */}
          <div className="continuum-stage__spectrum">
            <div className="continuum-stage__labels continuum-stage__labels--mid">
              <div
                className="continuum-stage__stop continuum-stage__stop--m"
                style={{ ["--ci-off" as string]: 0.3 }}
              >
                <div className="crail__tick" />
                <div
                  className={
                    "crail__k" + (midStop.kickerMod ? ` crail__k--${midStop.kickerMod}` : "")
                  }
                >
                  {midStop.kicker}
                </div>
                <div className="crail__t">
                  {midStop.title.map((line, j) => (
                    <span key={j} className="continuum-stage__stop-line">
                      {line}
                    </span>
                  ))}
                </div>
                <div className="crail__b">{midStop.body}</div>
              </div>
            </div>

            <div className="continuum-stage__readout" style={{ ["--ci-off" as string]: 0.5 }}>
              {CONTINUUM_STAGE.readout}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
