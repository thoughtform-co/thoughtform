import type { CSSProperties, ReactNode } from "react";

import type { ArcMotion, ArcSectionKind } from "@/lib/arcs/types";

import { noTail, tailFor } from "./arcMotion";

interface ArcBeatProps {
  id: string;
  kind: ArcSectionKind;
  className: string;
  ariaLabel: string;
  motion: ArcMotion;
  children: ReactNode;
}

/**
 * ArcBeat — the section wrapper both motion systems share (ADR-057).
 *
 * In `reveal` mode it renders exactly the ADR-052 `<section>` and
 * nothing else, which is what makes v1 byte-identity a property of the
 * code rather than a promise (pinned by the markup test).
 *
 * In `terminal` mode the section becomes a beat: a PINNED STAGE
 * followed by a TAIL. The stage's height is content-driven; its sticky
 * pin is `top: vh − stageH` (the writer measures it) — a stage shorter
 * than the viewport pins the moment its top reaches the viewport top, a
 * taller one reads through its overflow and then pins on its last
 * viewport. Either way the tail is the scroll the fold plays across,
 * with the stage held still for all of it.
 *
 * Two layers, and the split is load-bearing:
 *
 *   `.arc-stage` — carries the OPAQUE VOID (ADR-008): every arc section
 *     must shield the killed gateway radial, so this element is never
 *     clipped and never faded.
 *   `.arc-plane` — transparent. The iris `clip-path` and the departure
 *     tail live HERE precisely because clipping the void-carrier would
 *     punch a hole in the page.
 */
export function ArcBeat({ id, kind, className, ariaLabel, motion, children }: ArcBeatProps) {
  if (motion !== "terminal") {
    return (
      <section id={id} className={className} aria-label={ariaLabel}>
        {children}
      </section>
    );
  }
  const tailless = noTail(kind);
  return (
    <section
      id={id}
      className={className}
      aria-label={ariaLabel}
      data-arc-beat=""
      data-arc-notail={tailless ? "" : undefined}
      style={tailless ? undefined : ({ "--beat-tail": `${tailFor(kind)}svh` } as CSSProperties)}
    >
      <div className="arc-stage">
        <div className="arc-plane">{children}</div>
      </div>
      {tailless ? null : <i className="arc-beat__tail" aria-hidden="true" />}
    </section>
  );
}
