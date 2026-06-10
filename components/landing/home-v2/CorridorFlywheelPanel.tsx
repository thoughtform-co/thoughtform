"use client";

import { useEffect, useRef } from "react";
import {
  EPILOGUE_BANDS,
  GRID_IN_STAGGER,
  band,
  epilogueBand,
} from "@/lib/home-v2/epilogueTimeline";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";

/**
 * CorridorFlywheelPanel — the RIGHT-half "flywheel in practice" panel
 * (ADR-018 epilogue v4.1, Glyphic grid pass).
 *
 * Concept (v4.1, 2026-06-10): once the user crosses past the Build
 * park, the gyro assembly DOCKS leftward via
 * `getEpilogueDockTransform` while this panel claims the right
 * column, grid-locked to the right HUD rail. Three minimal cards
 * (Navigate / Encode / Build) settle as a STATIC grid below the
 * title — they all arrive together (small per-card stagger reads as
 * a settle, not a cascade) and rest for the rest of the epilogue.
 *
 * Encode is the soft visual emphasis: it carries the gold ordinal
 * fill + a faint gold wash + brighter dotted border, because it is
 * the Thoughtform claim — the encoded judgment is the asset that
 * compounds. Navigate and Build read at the same hierarchy as each
 * other, slightly muted relative to Encode.
 *
 * Structure:
 *
 *     THE FLYWHEEL                                    (kicker)
 *     The flywheel in PRACTICE.                       (title — gold em)
 *     ───────────────────────────────────────────  o  (hairline + pip)
 *     [01] NAVIGATE
 *     Headline.                                       (PP Neue Montreal)
 *     One short supporting sentence.                  (muted dawn)
 *     ───────────────────────────────────────────  o
 *     [02] ENCODE                       <- soft gold highlight
 *     Headline.
 *     Supporting sentence.
 *     ───────────────────────────────────────────  o
 *     [03] BUILD
 *     Headline.
 *     Supporting sentence.
 *
 * Contract: the panel rAF loop writes opacity + transform inline per
 * card off the depth store. No React state churn per scroll tick;
 * the component re-mounts only when the corridor (re-)engages.
 */

interface FlywheelCard {
  /** Stable id for keys + data attributes. */
  id: "navigate" | "encode" | "build";
  /** Numbered ordinal (e.g. "01"). */
  ordinal: string;
  /** Phase name (e.g. "NAVIGATE"). */
  phase: string;
  /** PP Neue Montreal headline (one short, declarative line). */
  headline: string;
  /** One short supporting sentence (muted dawn). */
  support: string;
  /** Soft highlight flag — Encode is the resting emphasis. */
  core?: boolean;
}

const CARDS: readonly FlywheelCard[] = [
  {
    id: "navigate",
    ordinal: "01",
    phase: "NAVIGATE",
    headline: "Work with the intelligence inside real work.",
    support:
      "Hands-on sessions in your own workflows, not demos. Each one ends with a workflow worth keeping.",
  },
  {
    id: "encode",
    ordinal: "02",
    phase: "ENCODE",
    headline: "Encode the judgment that makes work good.",
    support:
      "That judgment becomes substrate — skills any model can inherit, versioned and shared. The asset that compounds.",
    core: true,
  },
  {
    id: "build",
    ordinal: "03",
    phase: "BUILD",
    headline: "Build tools on the layer.",
    support:
      "When several teams need the same thing, the substrate becomes a tool. Agents, automations, capabilities.",
  },
];

/** Pixel slide distance the title block travels while its band
 *  ramps. Small (40px) so the motion reads as a settle. */
const TITLE_SLIDE_PX = 40;

/** Pixel slide distance each card travels while its staggered band
 *  ramps. Also small — the cards arrive as a group, so each one only
 *  needs a short upward translate to feel like it lands rather than
 *  pops. */
const CARD_SLIDE_PX = 36;

/** Threshold below which we treat a value as 0 to suppress redundant
 *  inline writes during steady-state idle. */
const EPS = 0.002;

export function CorridorFlywheelPanel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  // Cards render as `<article>` elements; `HTMLElement` is the right
  // shared supertype for the inline-style writes below.
  const cardRefs = useRef<(HTMLElement | null)[]>([]);

  // Cache of last-written values so we skip writes on tiles where
  // nothing meaningful changed. Sized in lockstep with CARDS so the
  // indices line up with refs.
  const lastTitle = useRef<number>(-1);
  const lastCards = useRef<number[]>(CARDS.map(() => -1));
  const lastEngaged = useRef<boolean | null>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const t = useDepthGatewayStore.getState().transform;
      const ep = t.epilogueProgress;
      // Show the panel as soon as the user crosses into the
      // epilogue and the corridor is engaged. Outside the epilogue
      // the panel is invisible AND non-painting — `data-engaged`
      // toggles a CSS-driven opacity gate so the panel doesn't
      // composite while the user is reading the corridor.
      const engaged = (t.active || t.armed) && ep > 0.001;
      if (engaged !== lastEngaged.current) {
        lastEngaged.current = engaged;
        if (containerRef.current) {
          containerRef.current.dataset.engaged = engaged ? "true" : "false";
        }
      }
      if (!engaged) return;

      const titleT = epilogueBand(ep, "TITLE_IN");

      // Title — opacity tracks the band; transform slides up from
      // +TITLE_SLIDE_PX to 0 as the band fills.
      if (titleRef.current && Math.abs(titleT - lastTitle.current) > EPS) {
        lastTitle.current = titleT;
        const slide = TITLE_SLIDE_PX * (1 - titleT);
        titleRef.current.style.opacity = titleT.toFixed(3);
        titleRef.current.style.transform = `translate3d(0, ${slide.toFixed(2)}px, 0)`;
      }

      // Cards — each one rides the GRID_IN base band offset by
      // `i * GRID_IN_STAGGER`. The stagger is small (0.02) so the
      // three arrive within ~6svh of each other and read as a single
      // settle. Once their band saturates they hold at opacity 1
      // through the rest of the epilogue.
      const grid = EPILOGUE_BANDS.GRID_IN;
      for (let i = 0; i < CARDS.length; i++) {
        const node = cardRefs.current[i];
        if (!node) continue;
        const offset = i * GRID_IN_STAGGER;
        const op = band(ep, grid.start + offset, grid.end + offset);
        if (Math.abs(op - lastCards.current[i]) <= EPS) continue;
        lastCards.current[i] = op;
        const slide = CARD_SLIDE_PX * (1 - op);
        node.style.opacity = op.toFixed(3);
        node.style.transform = `translate3d(0, ${slide.toFixed(2)}px, 0)`;
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

      <ol className="home-v2-flywheel-panel__grid">
        {CARDS.map((card, idx) => (
          <li key={card.id} className="home-v2-flywheel-panel__cell">
            <article
              ref={(el) => {
                cardRefs.current[idx] = el;
              }}
              className="home-v2-flywheel-card"
              data-flywheel-card={card.id}
              data-core={card.core ? "true" : "false"}
            >
              <span className="home-v2-flywheel-card__rule" aria-hidden="true" />
              <span className="home-v2-flywheel-card__pip" aria-hidden="true" />
              <header className="home-v2-flywheel-card__head">
                <span className="home-v2-flywheel-card__ordinal" aria-hidden="true">
                  {card.ordinal}
                </span>
                <span className="home-v2-flywheel-card__phase">{card.phase}</span>
              </header>
              <h3 className="home-v2-flywheel-card__headline">{card.headline}</h3>
              <p className="home-v2-flywheel-card__support">{card.support}</p>
            </article>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Plain-text mirror of the flywheel content, used by the static
 *  fallback path in `HomeCorridor` so reduced-motion / no-WebGL
 *  visitors get the post-Build editorial without any motion or
 *  HUD chrome. Same minimal three-card model as the live panel. */
export function FallbackFlywheelSummary() {
  return (
    <section className="home-v2-fallback-flywheel">
      <p className="home-v2-fallback-flywheel__kicker">The flywheel</p>
      <h2>
        The flywheel <em>in practice</em>.
      </h2>
      <ol className="home-v2-fallback-flywheel__grid">
        {CARDS.map((card) => (
          <li key={card.id} data-core={card.core ? "true" : "false"}>
            <p className="home-v2-fallback-flywheel__cartouche">
              {card.ordinal} · {card.phase}
            </p>
            <h3>{card.headline}</h3>
            <p>{card.support}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
