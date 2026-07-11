"use client";

import { useRef, type CSSProperties } from "react";
import { PROJECT_CASES } from "./toolCardData";
import { useStackedCardsScroll } from "./useStackedCardsScroll";
import { NotchOutline } from "./NotchOutline";
import { ToolCardConsole, toolCardTitleId } from "./ToolCardConsole";
import { ToolsHeaderDecode } from "./ToolsHeaderDecode";
import "./tools-cards.css";

/**
 * ToolsCardStack — the landing #tools card stack: the vorszk-style
 * sticky-sibling mechanic carrying the four tool cards in the CONSOLE
 * PLATE skin (ADR-030; the /test/project-cards lab keeps the five-variant
 * registry for look-dev — this is the shipped V2 chrome, hardcoded).
 *
 * Each `.pcl-slot` is `position: sticky` with a cascading top offset; the
 * covering card is literally the next sibling scrolling up. Slots carry
 * explicit z-index (never rely on tree-order painting of sticky elements)
 * and are POSITIONING ONLY — the recession transform and the notch clip
 * live on `.pcl-card` inside, so sticky never sits under a transform.
 *
 * No Lenis here: the landing route owns wheel gestures natively
 * (ADR-029's services wheel hook depends on that) and the stack mechanic
 * is plain scroll listeners.
 */

/** The shipped chrome — the lab registry's "V2 Console" entry, frozen. */
const CONSOLE_CHROME = { corner: "bl", notch: 24, stroke: "solid" } as const;

export function ToolsCardStack() {
  const runwayRef = useRef<HTMLElement | null>(null);
  useStackedCardsScroll(runwayRef);

  return (
    <section
      ref={runwayRef}
      className="pcl-stack pcl-stack--v2"
      data-pc-active="0"
      aria-label="Tools in production"
      style={{ "--pc-n": PROJECT_CASES.length } as CSSProperties}
    >
      {/* Null leaf — decodes the station-shell eyebrow on first view
          (the eyebrow lives in the parsed HTML, outside this root). */}
      <ToolsHeaderDecode />

      {PROJECT_CASES.map((data, i) => (
        <div
          key={data.id}
          className="pcl-slot"
          data-pc-slot
          data-pc-index={i}
          style={{ "--i": i, zIndex: i + 1 } as CSSProperties}
        >
          <article
            className="pcl-card"
            data-corner={CONSOLE_CHROME.corner}
            data-stroke={CONSOLE_CHROME.stroke}
            aria-labelledby={toolCardTitleId(data.id)}
            style={{ "--ch": `${CONSOLE_CHROME.notch}px` } as CSSProperties}
          >
            <ToolCardConsole data={data} index={i} />
            <NotchOutline corner={CONSOLE_CHROME.corner} notch={CONSOLE_CHROME.notch} />
            <div className="pcl-card__dim" aria-hidden="true" />
          </article>
        </div>
      ))}

      <div className="pcl-stack__tail" aria-hidden="true" />
    </section>
  );
}
