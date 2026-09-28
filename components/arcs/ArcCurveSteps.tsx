"use client";

/**
 * ArcCurveSteps — the curve's three states (ADR-130 U5, Moira's `CurveSteps`
 * ported): the front edge, then a price under every name, then the surface
 * of the second dial behind it.
 *
 * THE ROOM SEES THE CLAIM FIRST. The first time the curve is properly on
 * screen it drops to the front edge alone, and the two buttons build it back:
 * more intelligence finishes more, here is what it costs, and every model has
 * an effort setting on top. The server sends the whole figure, which is also
 * what a reader without script, a reader who prefers less motion, and paper
 * get. Every state change happens in a callback, never in an effect's body.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";

type Step = 0 | 1 | 2;

export function ArcCurveSteps({
  shows,
  stage,
  caption,
}: {
  /** The two buttons: the prices, then the effort dial. */
  shows: readonly [string, string];
  stage: ReactNode;
  caption: ReactNode;
}) {
  const [step, setStep] = useState<Step>(2);
  const figure = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = figure.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        io.disconnect();
        if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) setStep(0);
      },
      { threshold: 0.6 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <figure className="arc-cv" data-step={step} ref={figure}>
      <div className="arc-cv__stage">
        {stage}
        <span className="arc-cv__shows">
          <button
            type="button"
            className="arc-cv__show"
            aria-pressed={step >= 1}
            onClick={(e) => {
              setStep(step >= 1 ? 0 : 1);
              if (e.detail > 0) e.currentTarget.blur();
            }}
          >
            {shows[0]}
          </button>
          <button
            type="button"
            className="arc-cv__show"
            aria-pressed={step === 2}
            onClick={(e) => {
              setStep(step === 2 ? 1 : 2);
              if (e.detail > 0) e.currentTarget.blur();
            }}
          >
            {shows[1]}
          </button>
        </span>
      </div>
      {caption}
    </figure>
  );
}
