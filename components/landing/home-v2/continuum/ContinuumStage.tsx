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
 *   · the masthead (stage-flow copy, scrubbed off `--continuum-copy-in`
 *     with per-child --ci-off — the about-stage recipe; NEVER
 *     useRevealMotion: portal nodes are unobserved and .is-in is
 *     one-shot), and
 *   · the docked instrument, which it REGISTERS into
 *     `continuumBandAnchorsRef` — the corridor canvas
 *     (ContinuumBandSliderAnchors) is the single writer of its
 *     transform/opacity every frame. Without the corridor writer it
 *     never paints (opacity 0 default).
 *
 * Update 9 — ONE RIGID INSTRUMENT. The caps and reticle already rode the
 * band projection, but the centre seat (the "AI lives here" stop + the
 * readout) was screen-anchored at a fixed --continuum-axis-y, so it
 * drifted against them under the approach zoom and pointer-look and the
 * whole label layer read as discombobulated chrome floating over the mark.
 * Now the seat projects to the band's MIDPOINT too — caps, reticle and
 * seat translate as one body. Three more moves finish the integration:
 *   · terminal end-cap hierarchy — the cap function lines demote to
 *     telemetry grade under dashed drop-leaders, leaving the seat's
 *     statement as the only bold title;
 *   · lighting reciprocity — the projector publishes --cap-lit / --seat-lit
 *     from the head's proximity, so the DOM chrome lights as the shader's
 *     comet head docks at each pole and crosses the seat;
 *   · the readout goes LIVE off the same sweep, and the chrome types on
 *     (writer-owned `data-continuum-assembled`) as the window opens.
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
  const seatRef = useRef<HTMLDivElement>(null);
  const readoutToolRef = useRef<HTMLSpanElement>(null);
  const readoutCollabRef = useRef<HTMLSpanElement>(null);
  const capable = useMediaQuery("(min-width: 961px) and (prefers-reduced-motion: no-preference)");
  useContinuumStageScroll(stageRef);

  // Register the docked-chrome elements for the corridor-side projector
  // (ContinuumBandSliderAnchors). Re-runs when the media gate flips so a
  // desktop resize re-registers the freshly-rendered elements; cleanup
  // nulls the handles so the projector never writes into a detached tree.
  // ALL handles register atomically in this one effect — the projector's
  // guard requires the structural ones together (U9).
  useEffect(() => {
    const anchors = continuumBandAnchorsRef.current;
    anchors.leftEl = bandCapLeftRef.current;
    anchors.rightEl = bandCapRightRef.current;
    anchors.reticleEl = reticleRef.current;
    anchors.seatEl = seatRef.current;
    anchors.readoutToolEl = readoutToolRef.current;
    anchors.readoutCollabEl = readoutCollabRef.current;
    anchors.stageEl = stageRef.current;
    return () => {
      anchors.leftEl = null;
      anchors.rightEl = null;
      anchors.reticleEl = null;
      anchors.seatEl = null;
      anchors.readoutToolEl = null;
      anchors.readoutCollabEl = null;
      anchors.stageEl = null;
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
              Since U9 the centre seat projects to the band's midpoint too, so
              all three dock to the same geometry. The stops still carry the
              kicker/title/body the static `.crail__stops-grid` fallback
              exposes identically (regression guard, ADR-049 / plan 6.2). */}
          {/* The Tool / Collaborator caps carry their READABLE description
              now — the copy hangs UNDER the pole label as an absolutely-
              positioned block (`__cap-copy`), so it rides the cap's projected
              transform and reads as "attached to the rail endpoint" (owner
              2026-07-19). The cap BOX's first row (`__cap-axis`) stays the one
              label row, so the projector's `-50%` anchor still centres the
              label on the band; the copy hangs below via top:100%.

              U9 terminal end-cap hierarchy: the function line demotes from a
              15px bold `.crail__t` (which competed with the centre seat's
              statement — three shouting titles) to TELEMETRY grade
              (`__cap-fn`: 10px tracked mono, dawn-50 lifting to gold as the
              head docks) with a zero-padded pole bearing, and a dashed
              drop-leader (`__cap-leader`) tethers the copy block back up to
              the band axis so it reads as hung from the instrument rather
              than floating beside it. Decorative chrome (dash, pole, leader)
              is aria-hidden; the label + copy are semantic. */}
          <div
            ref={bandCapLeftRef}
            className="continuum-stage__band-cap continuum-stage__band-cap--l"
          >
            {/* Rev d: the cap is a STATION — the plate label with its copy
                column hung directly beneath it: small dashed connector, then
                the CENTRED telemetry line + body, no frame. The station
                wrapper (plate-sized) is the anchor; connector + copy are
                absolute children centred on the plate. */}
            <div className="continuum-stage__cap-axis">
              <div className="continuum-stage__cap-station">
                <span className="continuum-stage__band-label">{toolStop.kicker}</span>
                <span className="continuum-stage__cap-leader" aria-hidden="true" />
                <div className="continuum-stage__cap-copy">
                  <div className="continuum-stage__cap-fn">
                    {toolStop.bearing ? (
                      <span className="continuum-stage__cap-index">{toolStop.bearing} · </span>
                    ) : null}
                    {toolStop.title.join(" ")}
                  </div>
                  <p className="continuum-stage__cap-body">{toolStop.body}</p>
                </div>
              </div>
              <span className="continuum-stage__band-dash" aria-hidden="true" />
              <span className="continuum-stage__band-pole" aria-hidden="true" />
            </div>
          </div>
          <div
            ref={bandCapRightRef}
            className="continuum-stage__band-cap continuum-stage__band-cap--r"
          >
            <div className="continuum-stage__cap-axis">
              <span className="continuum-stage__band-pole" aria-hidden="true" />
              <span
                className="continuum-stage__band-dash continuum-stage__band-dash--flip"
                aria-hidden="true"
              />
              <div className="continuum-stage__cap-station">
                <span className="continuum-stage__band-label">{collabStop.kicker}</span>
                <span className="continuum-stage__cap-leader" aria-hidden="true" />
                <div className="continuum-stage__cap-copy">
                  <div className="continuum-stage__cap-fn">
                    {collabStop.bearing ? (
                      <span className="continuum-stage__cap-index">{collabStop.bearing} · </span>
                    ) : null}
                    {collabStop.title.join(" ")}
                  </div>
                  <p className="continuum-stage__cap-body">{collabStop.body}</p>
                </div>
              </div>
            </div>
          </div>
          <div ref={reticleRef} className="continuum-stage__reticle" aria-hidden="true">
            <span className="continuum-stage__reticle-ring" />
            <span className="continuum-stage__reticle-cross" />
            <span className="continuum-stage__reticle-diamond" />
          </div>

          {/* ── The centre SEAT — the readable "AI lives here" stop + the live
              readout, the mark's own ½ position on the spectrum. The Tool /
              Collaborator stops moved UP onto their rail caps (above); only
              this middle stop stays under the mark.

              U9: position:fixed and PROJECTED to the band's midpoint by the
              corridor writer (like the caps), not screen-anchored at a fixed
              --continuum-axis-y — that mismatch was the drift that made the
              label layer read as pasted on. The writer owns transform +
              --seat-gain; CSS owns the vertical drop (`top`) and the
              per-child --ci scroll reveal composes underneath the gain. */}
          {/* Rev e (owner: "shouldn't the middle thing be aligned with Tool
              and Collaborator?"): the seat becomes a STATION matching the
              caps exactly — kicker PROMOTED to a plate sitting ON the band
              line (same __band-label treatment, lit via --seat-lit instead
              of --cap-lit), a small connector, then the centred copy column.
              Before this the kicker rendered at telemetry scale inside the
              copy flow, so it landed a full drop BELOW the Tool/Collaborator
              plates instead of beside them — the three-position row
              (TOOL — AI LIVES HERE — COLLABORATOR) never actually lined up. */}
          <div ref={seatRef} className="continuum-stage__spectrum">
            <div className="continuum-stage__labels continuum-stage__labels--mid">
              <div
                className="continuum-stage__stop continuum-stage__stop--m"
                style={{ ["--ci-off" as string]: 0.3 }}
              >
                <div
                  className={
                    "crail__k" + (midStop.kickerMod ? ` crail__k--${midStop.kickerMod}` : "")
                  }
                >
                  {midStop.kicker}
                </div>
                <span className="continuum-stage__seat-leader" aria-hidden="true" />
                <div className="continuum-stage__seat-copy">
                  <div className="crail__t">
                    {midStop.title.map((line, j) => (
                      <span key={j} className="continuum-stage__stop-line">
                        {line}
                      </span>
                    ))}
                  </div>
                  <div className="crail__b">{midStop.body}</div>

                  {/* LIVE readout (U9) — the seat column's last line. The
                      corridor projector writes the two value spans every
                      frame from the slider head's sweep — complementary
                      weights that always sum to 1.00. The surrounding label
                      text is static; only the numbers move. Reveals with the
                      stop (no own --ci-off), types on last in the
                      assembly. */}
                  <div className="continuum-stage__readout">
                    <span className="continuum-stage__readout-line">
                      {CONTINUUM_STAGE.readout.prefix} · {CONTINUUM_STAGE.readout.toolLabel}{" "}
                      <span ref={readoutToolRef}>{CONTINUUM_STAGE.readout.rest}</span>
                      {" — "}
                      {CONTINUUM_STAGE.readout.collabLabel}{" "}
                      <span ref={readoutCollabRef}>{CONTINUUM_STAGE.readout.rest}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
