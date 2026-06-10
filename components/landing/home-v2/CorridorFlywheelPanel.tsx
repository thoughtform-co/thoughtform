"use client";

import { useEffect, useRef } from "react";
import { epilogueBand } from "@/lib/home-v2/epilogueTimeline";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";

/**
 * CorridorFlywheelPanel — the LEFT-half "flywheel in practice" panel
 * that takes over the post-Build epilogue (ADR-018 epilogue v4).
 *
 * Concept (v4, 2026-06-10): once the user crosses past the Build
 * park, the gyro assembly DOCKS rightward via
 * `getEpilogueDockTransform` while this panel claims the left ~44vw.
 * It is an editorial illustration of how Navigate / Encode / Build
 * land in a real organisation — three retro-futuristic HUD frames
 * that scroll into view one at a time and ACCUMULATE, ending with
 * the whole flywheel readable beside the docked artifact.
 *
 * Structure:
 *
 *     THE FLYWHEEL                       (kicker, eyebrow)
 *     The flywheel in PRACTICE.          (title — gold em on accent)
 *
 *     ┌── 01 · NAVIGATE ──── LOG-22 ─┐
 *     │ Every team starts here.       │
 *     │ LEGAL              DONE       │
 *     │ FINANCE            DONE       │   FRAME_1 [0.28, 0.46]
 *     │ STUDIO             DONE       │
 *     │ PRODUCT DESIGN     DONE       │
 *     │ CRO                QUEUED     │
 *     │ EXPANSION          QUEUED     │
 *     │ "Same short kickoff..."       │
 *     └───────────────────────────────┘
 *           ┊  ONE RECORD  ┊            (dotted connector)
 *     ┌── 02 · ENCODE ────── REC-01 ─┐
 *     │ The work feeds the layer.     │
 *     │ MEETING   recorded · transcr. │   FRAME_2 [0.48, 0.66]
 *     │ SKILL     captured ...        │
 *     │ LIBRARY   shared · versioned  │
 *     │ GITHUB    graduates to ...    │
 *     │ "Captured once, ..."          │
 *     └───────────────────────────────┘
 *           ┊  ONE LAYER   ┊
 *     ┌── 03 · BUILD ─────── PAT-03 ─┐
 *     │ Patterns become tools.        │
 *     │ Creative strategy   BRIEFING  │
 *     │ Product marketing   BRIEFING  │   FRAME_3 [0.68, 0.86]
 *     │ Campaign mgmt       BRIEFING  │
 *     │ ┌── MARKETING INTELLIGENCE ─┐ │
 *     │ │   (aka Briefing Agent)    │ │
 *     │ └───────────────────────────┘ │
 *     │ "Three teams ..."             │
 *     └───────────────────────────────┘
 *
 * Contract: written per-frame via inline styles (opacity + transform)
 * driven by the depth store. No React state churn per scroll tick;
 * the component re-mounts only when the corridor (re-)engages.
 */

interface FlywheelRow {
  /** Left-aligned PT Mono uppercase label. */
  label: string;
  /** Right-aligned value or status chip text. */
  value: string;
  /** Optional status chip variant — drives chip colour tier:
   *    - `done`    : Atreides green (provenance)
   *    - `queued`  : dawn (neutral, "in queue")
   *    - `live`    : gold (active wayfinding)
   *    - `briefing`: gold-dim (pending pattern) */
  status?: "done" | "queued" | "live" | "briefing";
}

interface FlywheelFrame {
  /** Stable id for keys + data attributes. */
  id: string;
  /** Numbered ordinal (e.g. "01"). */
  ordinal: string;
  /** Phase name (e.g. "NAVIGATE"). */
  phase: string;
  /** Tiny telemetry readout in the eyebrow row. Mono, 9px-ish; reads
   *  as a station code (LOG-22, REC-01, PAT-03). */
  telemetry: string;
  /** PP Neue Montreal heading (one short statement). */
  heading: string;
  /** 4–7 manifest rows. */
  rows: readonly FlywheelRow[];
  /** Optional inset OUTPUT tile (used by Build frame to render the
   *  Marketing Intelligence agent that emerges from the pattern). */
  output?: { label: string; sub?: string };
  /** Closing caption — one or two declarative sentences. */
  caption: string;
}

const FRAMES: readonly FlywheelFrame[] = [
  {
    id: "navigate",
    ordinal: "01",
    phase: "NAVIGATE",
    telemetry: "LOG-22",
    heading: "Every team starts here.",
    rows: [
      { label: "LEGAL", value: "DONE", status: "done" },
      { label: "FINANCE", value: "DONE", status: "done" },
      { label: "STUDIO", value: "DONE", status: "done" },
      { label: "PRODUCT DESIGN", value: "DONE", status: "done" },
      { label: "CRO  ·  EXPANSION", value: "QUEUED", status: "queued" },
    ],
    caption:
      "Same short kickoff, same intelligence. Each team leaves with one workflow worth capturing as a skill.",
  },
  {
    id: "encode",
    ordinal: "02",
    phase: "ENCODE",
    telemetry: "REC-01",
    heading: "The work feeds the layer.",
    rows: [
      { label: "MEETING", value: "recorded · transcribed" },
      { label: "SKILL", value: "captured from the work" },
      { label: "LIBRARY", value: "shared · versioned" },
      { label: "GITHUB", value: "graduates to monorepo" },
    ],
    caption: "Captured once, the workflow lands in a shared library the next team builds on.",
  },
  {
    id: "build",
    ordinal: "03",
    phase: "BUILD",
    telemetry: "PAT-03",
    heading: "Patterns become tools.",
    rows: [
      { label: "Creative strategy", value: "BRIEFING", status: "briefing" },
      { label: "Product marketing", value: "BRIEFING", status: "briefing" },
      { label: "Campaign mgmt", value: "BRIEFING", status: "briefing" },
    ],
    output: { label: "MARKETING INTELLIGENCE", sub: "(aka Briefing Agent)" },
    caption:
      "Three teams doing the same work is a skill worth sharing. Three teams needing the same tool is one worth building.",
  },
];

const CONNECTOR_LABELS = ["ONE RECORD", "ONE LAYER"] as const;

/** Pixel slide distance each block travels while its band ramps. The
 *  "scrolls into view" feel comes from this short upward translate
 *  paired with an opacity ramp; tuned small (40px / 60px) so the
 *  motion reads as a settle, not a fly-in. */
const TITLE_SLIDE_PX = 40;
const FRAME_SLIDE_PX = 60;

/** Threshold below which we treat a value as 0 to suppress redundant
 *  inline writes during steady-state idle. */
const EPS = 0.002;

export function CorridorFlywheelPanel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  // Frames render as `<article>` and connectors as `<div>`; both
  // satisfy the broader `HTMLElement` type the panel writes inline
  // styles to.
  const frameRefs = useRef<(HTMLElement | null)[]>([]);
  const connectorRefs = useRef<(HTMLElement | null)[]>([]);

  // Cache of last-written values so we skip writes on frames where
  // nothing meaningful changed. The arrays are sized in lockstep with
  // FRAMES / CONNECTOR_LABELS so the indices line up with refs.
  const lastTitle = useRef<number>(-1);
  const lastFrames = useRef<number[]>(FRAMES.map(() => -1));
  const lastConnectors = useRef<number[]>(CONNECTOR_LABELS.map(() => -1));
  const lastEngaged = useRef<boolean | null>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const t = useDepthGatewayStore.getState().transform;
      const ep = t.epilogueProgress;
      // Show the panel as soon as the user crosses into the epilogue
      // and the corridor is engaged. Outside the epilogue the panel
      // is invisible AND non-painting — `display: none` toggled via a
      // data attribute so it doesn't allocate layout while the user
      // is reading the corridor.
      const engaged = (t.active || t.armed) && ep > 0.001;
      if (engaged !== lastEngaged.current) {
        lastEngaged.current = engaged;
        if (containerRef.current) {
          containerRef.current.dataset.engaged = engaged ? "true" : "false";
        }
      }
      if (!engaged) return;

      const titleT = epilogueBand(ep, "TITLE_IN");
      const frameTs: [number, number, number] = [
        epilogueBand(ep, "FRAME_1"),
        epilogueBand(ep, "FRAME_2"),
        epilogueBand(ep, "FRAME_3"),
      ];

      // Title — opacity tracks the band; transform slides up from
      // +TITLE_SLIDE_PX to 0 as the band fills.
      if (titleRef.current && Math.abs(titleT - lastTitle.current) > EPS) {
        lastTitle.current = titleT;
        const slide = TITLE_SLIDE_PX * (1 - titleT);
        titleRef.current.style.opacity = titleT.toFixed(3);
        titleRef.current.style.transform = `translate3d(0, ${slide.toFixed(2)}px, 0)`;
      }

      // Frames — same recipe at a larger slide distance. Each frame
      // RIDES its own band, so they appear in cascade as the user
      // scrolls and PERSIST after their band saturates (band returns
      // 1 once epilogueProgress passes its end). End state at
      // epilogueProgress = 1: all three frames at full opacity, no
      // residual slide.
      for (let i = 0; i < frameTs.length; i++) {
        const node = frameRefs.current[i];
        if (!node) continue;
        const op = frameTs[i];
        if (Math.abs(op - lastFrames.current[i]) <= EPS) continue;
        lastFrames.current[i] = op;
        const slide = FRAME_SLIDE_PX * (1 - op);
        node.style.opacity = op.toFixed(3);
        node.style.transform = `translate3d(0, ${slide.toFixed(2)}px, 0)`;
      }

      // Connectors — fade in with the LATER of the two frames they
      // bridge. Reads as "frame N docks; the dotted line to frame
      // N+1 emerges; frame N+1 follows." Capped by the earlier
      // frame's reveal so the connector never paints over a frame
      // that hasn't started yet (paranoia; FRAME_2 / FRAME_3 bands
      // are strictly ordered already).
      for (let i = 0; i < connectorRefs.current.length; i++) {
        const node = connectorRefs.current[i];
        if (!node) continue;
        const op = Math.min(frameTs[i], frameTs[i + 1] ?? 0);
        if (Math.abs(op - lastConnectors.current[i]) <= EPS) continue;
        lastConnectors.current[i] = op;
        node.style.opacity = op.toFixed(3);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={containerRef}
      className="home-v2-flywheel-panel"
      data-engaged="false"
      aria-hidden="false"
    >
      <div ref={titleRef} className="home-v2-flywheel-panel__head">
        <div className="home-v2-flywheel-panel__kicker">
          <span className="home-v2-flywheel-panel__kicker-pip" aria-hidden="true" />
          <span>The flywheel</span>
        </div>
        <h2 className="home-v2-flywheel-panel__title">
          The flywheel <em>in practice</em>.
        </h2>
      </div>

      <div className="home-v2-flywheel-panel__stack">
        {FRAMES.map((frame, idx) => (
          <div key={frame.id} className="home-v2-flywheel-panel__cell">
            {idx > 0 && (
              <div
                ref={(el) => {
                  connectorRefs.current[idx - 1] = el;
                }}
                className="home-v2-flywheel-connector"
                aria-hidden="true"
              >
                <span className="home-v2-flywheel-connector__rule" />
                <span className="home-v2-flywheel-connector__diamond" />
                <span className="home-v2-flywheel-connector__label">
                  {CONNECTOR_LABELS[idx - 1]}
                </span>
                <span className="home-v2-flywheel-connector__diamond" />
                <span className="home-v2-flywheel-connector__rule" />
              </div>
            )}
            <article
              ref={(el) => {
                frameRefs.current[idx] = el;
              }}
              className="home-v2-flywheel-frame"
              data-flywheel-frame={frame.id}
            >
              <span
                aria-hidden="true"
                className="home-v2-flywheel-frame__corner home-v2-flywheel-frame__corner--tl"
              />
              <span
                aria-hidden="true"
                className="home-v2-flywheel-frame__corner home-v2-flywheel-frame__corner--tr"
              />
              <span
                aria-hidden="true"
                className="home-v2-flywheel-frame__corner home-v2-flywheel-frame__corner--bl"
              />
              <span
                aria-hidden="true"
                className="home-v2-flywheel-frame__corner home-v2-flywheel-frame__corner--br"
              />
              <header className="home-v2-flywheel-frame__head">
                <span className="home-v2-flywheel-frame__pip" aria-hidden="true" />
                <span className="home-v2-flywheel-frame__cartouche">
                  <span className="home-v2-flywheel-frame__ordinal">{frame.ordinal}</span>
                  <span className="home-v2-flywheel-frame__sep" aria-hidden="true">
                    ·
                  </span>
                  <span className="home-v2-flywheel-frame__phase">{frame.phase}</span>
                </span>
                <span className="home-v2-flywheel-frame__telemetry">{frame.telemetry}</span>
              </header>
              <h3 className="home-v2-flywheel-frame__heading">{frame.heading}</h3>
              <ul className="home-v2-flywheel-frame__rows">
                {frame.rows.map((row, ri) => (
                  <li key={ri} className="home-v2-flywheel-frame__row">
                    <span className="home-v2-flywheel-frame__row-label">{row.label}</span>
                    <span
                      className={[
                        "home-v2-flywheel-frame__row-value",
                        row.status ? `home-v2-flywheel-frame__row-value--${row.status}` : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {row.value}
                    </span>
                  </li>
                ))}
              </ul>
              {frame.output && (
                <div className="home-v2-flywheel-frame__output">
                  <span
                    className="home-v2-flywheel-frame__output-corner home-v2-flywheel-frame__output-corner--tl"
                    aria-hidden="true"
                  />
                  <span
                    className="home-v2-flywheel-frame__output-corner home-v2-flywheel-frame__output-corner--tr"
                    aria-hidden="true"
                  />
                  <span
                    className="home-v2-flywheel-frame__output-corner home-v2-flywheel-frame__output-corner--bl"
                    aria-hidden="true"
                  />
                  <span
                    className="home-v2-flywheel-frame__output-corner home-v2-flywheel-frame__output-corner--br"
                    aria-hidden="true"
                  />
                  <span className="home-v2-flywheel-frame__output-label">{frame.output.label}</span>
                  {frame.output.sub && (
                    <span className="home-v2-flywheel-frame__output-sub">{frame.output.sub}</span>
                  )}
                </div>
              )}
              <p className="home-v2-flywheel-frame__caption">{frame.caption}</p>
            </article>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Plain-text mirror of the flywheel content, used by the static
 *  fallback path in `HomeCorridor` so reduced-motion / no-WebGL
 *  visitors get the post-Build editorial without any motion or
 *  HUD chrome. */
export function FallbackFlywheelSummary() {
  return (
    <section className="home-v2-fallback-flywheel">
      <p className="home-v2-fallback-flywheel__kicker">The flywheel</p>
      <h2>
        The flywheel <em>in practice</em>.
      </h2>
      {FRAMES.map((frame) => (
        <article key={frame.id} className="home-v2-fallback-flywheel__frame">
          <p className="home-v2-fallback-flywheel__cartouche">
            {frame.ordinal} · {frame.phase}
          </p>
          <h3>{frame.heading}</h3>
          <ul>
            {frame.rows.map((row, ri) => (
              <li key={ri}>
                <span>{row.label}</span>
                <span>{row.value}</span>
              </li>
            ))}
          </ul>
          {frame.output && (
            <p className="home-v2-fallback-flywheel__output">
              <strong>{frame.output.label}</strong>
              {frame.output.sub ? ` ${frame.output.sub}` : ""}
            </p>
          )}
          <p>{frame.caption}</p>
        </article>
      ))}
    </section>
  );
}
