"use client";

import { useRef, type CSSProperties } from "react";
import { PROJECT_CASES } from "./toolCardData";
import { STACK, useStackedCardsScroll } from "./useStackedCardsScroll";
import { NotchOutline } from "./NotchOutline";
import { ToolCardConsole } from "./ToolCardConsole";
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
const CONSOLE_CHROME = { corner: "bl", notch: 40, stroke: "solid" } as const;

export function ToolsCardStack() {
  const runwayRef = useRef<HTMLElement | null>(null);
  useStackedCardsScroll(runwayRef);

  return (
    <section
      ref={runwayRef}
      className="pcl-stack pcl-stack--v2"
      data-pc-active="0"
      style={
        {
          "--pc-top-base": `${STACK.topBase}px`,
          "--pc-peek": `${STACK.peek}px`,
          "--pc-n": STACK.count,
        } as CSSProperties
      }
    >
      <div className="pcl-rail" aria-hidden="true">
        <ol className="pcl-rail__inner">
          {PROJECT_CASES.map((c) => (
            <li key={c.id} className="pcl-rail__dia" />
          ))}
        </ol>
      </div>

      {PROJECT_CASES.map((data, i) => (
        <div
          key={data.id}
          className="pcl-slot"
          data-pc-slot
          style={{ "--i": i, zIndex: i + 1 } as CSSProperties}
        >
          <article
            className="pcl-card"
            data-corner={CONSOLE_CHROME.corner}
            data-stroke={CONSOLE_CHROME.stroke}
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
