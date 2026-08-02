"use client";

import { useEffect, useRef, useState, type ReactElement } from "react";
import { createPortal } from "react-dom";

import { READOUT_SECTIONS } from "@/lib/rail-manifest/sectionLabel";

import { CLUSTER_ZONES, JOURNEY_MARKS } from "./clusters";
import { SECTION_GLYPHS } from "./sectionGlyphs";
import { useJourneyMarks, useScrollReadouts } from "./useJourneyMarks";

/**
 * The rail instruments (ADR-059) — the whole journey as one row of marks in
 * the TOP-LEFT corner, plus the right rail's telemetry. Settings is the
 * bottom-right corner and lives in `SettingsCluster`.
 *
 * Ported from `/test/hud-instruments-lab` route `r4` after three rounds
 * there. What survived and what did not is the useful part:
 *
 *   - it was TWO clusters, approach top-left and destinations bottom-right,
 *     with grouping-by-corner carrying the meaning. The bottom-right became
 *     the settings corner (owner, 2026-08-02), so they merged into one row
 *     and the grouping survives as rules inside it — a weaker signal, and
 *     the acknowledged cost of the four-corner scheme.
 *   - the left rail's STATION ROSTER was tried and NOT taken. The ladder
 *     stays a ladder; this row is the left side's whole contribution.
 *   - the corner REGISTER (`cBr`) is dropped, because it printed
 *     `scroll01 × 100` and so does BEARING in the telemetry stack two
 *     lines away. Relocating it would have duplicated a live value; the
 *     lab only got away with it because the two were never on screen
 *     together.
 *   - detent-PROPORTIONAL placement was rejected twice before this: a
 *     column of marks at their true scroll offsets is a scale, and a scale
 *     reads as a progress bar however it is styled. Position here is
 *     STRUCTURE — which corner a mark sits in says what kind of section it
 *     is, and only state moves.
 *
 * ⚠ THIS IS A LEAF, AND IT MUST STAY ONE. `LandingPage` owns a
 * `dangerouslySetInnerHTML` body with nested `createRoot`s inside it; a
 * re-render there re-applies that markup and silently orphans them. All
 * state lives in here, exactly as `LightModeToggle` and `CelestialEditorGate`
 * keep theirs.
 *
 * ⚠ `createPortal`, never `createRoot`. The ban is on `createRoot` into
 * `[data-rail-manifest-root]`, whose skeleton is parse-injected and mutated
 * in place — but one React root is the right answer everywhere here.
 *
 * Hosting INSIDE `.hud__corner--tl` and `.hud__rail--r` is the whole point
 * for these two —
 * the marks inherit the ADR-031 U16 hero-curtain clip, the ticks'
 * percentage box, the rail's wordmark-clearing bottom terminus and every
 * responsive gate, none of which then has to be re-declared and kept in
 * step.
 */

interface Hosts {
  cornerTl: HTMLElement;
  right: HTMLElement;
}

type MarkState = "ahead" | "passed" | "here";

const stateFor = (seat: number, active: number): MarkState =>
  active === seat ? "here" : active > seat ? "passed" : "ahead";

/**
 * ⚠ NO LABEL, deliberately — unlike the lab, which prints one under every
 * mark for its `nExplain` scaffolding.
 *
 * Two reasons, and the second is the load-bearing one. The label band sits
 * at y 64–76, which on this page is occupied: measured collisions with
 * `services-masthead__desig` ("SVC / TITLE · 01") and the corridor's
 * `home-v2-stack-label__num`. Above the row is unavailable — the corner's
 * curtain inset saturates at 0px — so there is nowhere for it to go.
 *
 * And it would be the THIRD place the active section is named, after the
 * ADR-055 nav corner and the right rail's vertical name. The gold mark says
 * where you are; something else already says what it is called.
 */
function Mark({ id, state }: { id: string; state: MarkState }): ReactElement {
  return (
    <span className="rin-mark" data-state={state} data-mark={id}>
      {SECTION_GLYPHS[id] ?? null}
    </span>
  );
}

/** Tick fractions on the 13-rung ladder the telemetry seats against. */
const TICK = { bearing: 2 / 12, sector: 6 / 12, local: 11 / 12 } as const;

export function RailInstruments({
  containerRef,
}: {
  containerRef: React.RefObject<HTMLElement | null>;
}) {
  const [hosts, setHosts] = useState<Hosts | null>(null);
  const ready = hosts !== null;

  const { activeIdx, seat, label } = useJourneyMarks(ready);

  const bearingRef = useRef<HTMLElement>(null);
  const localRef = useRef<HTMLElement>(null);
  useScrollReadouts(ready, { bearing: bearingRef, local: localRef });

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const brkTl = root.querySelector<HTMLElement>(".hud__corner--tl");
    const railR = root.querySelector<HTMLElement>(".hud__rail--r");
    if (!brkTl || !railR) return;

    const cornerTl = document.createElement("div");
    cornerTl.className = "rin-host";
    brkTl.appendChild(cornerTl);

    // ⚠ NOT `[data-tools-rail-root]`, tempting as it is — that slot has sat
    // empty since ADR-044 retired `ServicesRailRegister`, but `services.css`
    // still owns it: `[data-tools-rail-root] > div` forces
    // `position: absolute; inset: 0` on every direct child at a specificity
    // this file cannot beat with a single class, which stretched the dock
    // cluster to the rail's full 62×692 box. The same block also hides that
    // slot at a breakpoint these instruments do not share. Our own host owes
    // nothing to either.
    const right = document.createElement("div");
    right.className = "rin-host";
    railR.appendChild(right);

    // One attribute, one writer: the CSS keys the bracket suppression off
    // this, so a frame with no instruments keeps its brackets.
    document.documentElement.dataset.railInstruments = "on";
    setHosts({ cornerTl, right });

    return () => {
      setHosts(null);
      cornerTl.remove();
      right.remove();
      delete document.documentElement.dataset.railInstruments;
    };
  }, [containerRef]);

  if (!hosts) return null;

  return (
    <>
      {createPortal(
        <div className="rin-cl rin-cl--journey" aria-hidden="true">
          <span className="rin-cl__zone">{CLUSTER_ZONES.journey}</span>
          <span className="rin-cl__row">
            {JOURNEY_MARKS.map((mark) => (
              <span key={mark.id} className="rin-cl__seat">
                {mark.ruleBefore && <i className="rin-cl__rule" />}
                {/* Two clocks, one row — see the note in `clusters.ts`.
                    The Arc's beats exist only on the manifest index; `proof`
                    exists only on the readout index. */}
                <Mark
                  id={mark.id}
                  state={stateFor(mark.idx, mark.clock === "beat" ? activeIdx : seat)}
                />
              </span>
            ))}
          </span>
        </div>,
        hosts.cornerTl
      )}

      {createPortal(
        <>
          {/* Every value here is real: BEARING is document scroll, SECTOR
              the readout's own seat, LOCAL progress through the section
              holding the viewport midline. No invented telemetry. */}
          <span className="rin-tele" aria-hidden="true" style={{ top: pct(TICK.bearing) }}>
            <b className="rin-tele__k">Bearing</b>
            <i className="rin-tele__rule" />
            <b className="rin-tele__v" ref={bearingRef}>
              000
            </b>
          </span>
          <span className="rin-tele" aria-hidden="true" style={{ top: pct(TICK.sector) }}>
            <b className="rin-tele__k">Sector</b>
            <i className="rin-tele__rule" />
            <b className="rin-tele__v">{`${pad(seat + 1)}/${pad(READOUT_SECTIONS.length)}`}</b>
          </span>
          <span className="rin-tele" aria-hidden="true" style={{ top: pct(TICK.local) }}>
            <b className="rin-tele__k">Local</b>
            <i className="rin-tele__rule" />
            <b className="rin-tele__v" ref={localRef}>
              0.00
            </b>
          </span>

          <span className="rin-vertname" aria-hidden="true">
            {label}
          </span>
        </>,
        hosts.right
      )}
    </>
  );
}

const pct = (f: number) => `${(f * 100).toFixed(3)}%`;
const pad = (n: number) => String(n).padStart(2, "0");
