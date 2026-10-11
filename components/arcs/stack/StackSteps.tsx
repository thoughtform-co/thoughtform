"use client";

/**
 * StackSteps — the approach's three states (the proposal system, 2026-10-10),
 * on `ArcCurveSteps`' law: the server sends the figure whole (step 2), which
 * is what a reader without script, a reader who prefers less motion, and
 * paper get; the first time the figure is properly on screen it drops to
 * step 0 (the team on the organisation's slab, nothing written), and the
 * three steps on the rail build it back: the layer written, then Claude's
 * run along its edge. Every state change happens in a callback.
 *
 * `data-step` on the figure is the one attribute: the sheet reads it for the
 * static states, `ArcHoloStageMount` reads it for the hologram's groups.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";

type Step = 0 | 1 | 2;

export function StackSteps({
  steps,
  children,
}: {
  steps: readonly { id: string; n: string; label: string; when: string }[];
  children: ReactNode;
}) {
  const [step, setStep] = useState<Step>(2);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) setStep(0);
      },
      { threshold: 0.6 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className="arc-hand--figure arc-hand" data-hand-figure="stack" data-step={step} ref={root}>
      <ol className="arc-hand__rail" role="tablist" aria-label="The approach, step by step">
        {steps.map((s, i) => [
          i > 0 ? (
            <li key={`${s.id}-run`} className="arc-hand__rail-run" aria-hidden="true">
              ›››
            </li>
          ) : null,
          <li key={s.id} role="presentation">
            <button
              type="button"
              role="tab"
              className="arc-hand__rail-step"
              aria-selected={step === i}
              data-hand-lit={step === i ? "" : undefined}
              onClick={(e) => {
                setStep(i as Step);
                if (e.detail > 0) e.currentTarget.blur();
              }}
            >
              <span className="arc-hand__step-n">{s.n}</span>
              <span className="arc-hand__rail-label">{s.label}</span>
              <span className="arc-hand__when">{s.when}</span>
            </button>
          </li>,
        ])}
      </ol>
      {children}
    </div>
  );
}
