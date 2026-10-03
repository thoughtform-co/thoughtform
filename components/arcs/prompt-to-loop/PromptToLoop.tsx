"use client";

import { useEffect, useRef } from "react";

import { ArcBeat } from "@/components/arcs/ArcBeat";
import { ArcSectionHead } from "@/components/arcs/ArcSectionHead";
import { rung } from "@/components/arcs/arcMotion";

import { PROMPT_TO_LOOP_SLIDES, type PromptToLoopSlide } from "./promptToLoopSlides";

/**
 * Prompt to Loop — the owner's breakdown of one motion video, from one prompt
 * to a 10-second ad, in the lecture where the anchor beat was (ADR-141 U3,
 * owner 2026-10-02: "integrate this … verbatim … replace the anchor 12").
 *
 * ⚠ ONE RECORD, TWO PAGES (ADR-143). The AP lecture shows it whole; the
 * workshop's third house cut splits it around its economics chapter (the
 * cost slide, then the chapter, then "Now it's a skill"). So it lives here,
 * beside the arcs' components, and its media under `public/arcs/prompt-to-loop/`,
 * rather than in either route's folder. `slides` takes a run of the record in
 * its own order; omitted, the whole breakdown renders. The sound toggle is
 * wired only where the opening film is in the run.
 *
 * Each slide is an `.arc-section` with the arc's OWN head (the title left, the
 * paragraph right, the decode, the crosses), so it reads as the rest of the
 * lecture does; the body under it is the breakdown's markup verbatim
 * (`promptToLoopSlides.ts`, generated), styled by its own rules scoped under `.ptl`
 * with Thoughtform's tokens (`prompt-to-loop.css`).
 *
 * ⚠ NOT AN ARC SECTION KIND. Thirteen bespoke bodies are one person's
 * breakdown, not a reusable grammar, so they render here rather than through
 * `ArcSectionRenderer`, and the lecture's sixteen-section law counts the arc's
 * own beats only.
 *
 * The one behaviour the breakdown carried in a script is the sound toggle on
 * the opening film; it is wired here, on the slide's own nodes.
 */
export function PromptToLoop({
  startIndex,
  slides = PROMPT_TO_LOOP_SLIDES,
}: {
  startIndex: number;
  slides?: readonly PromptToLoopSlide[];
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const video = root?.querySelector<HTMLVideoElement>("#ptl-hero");
    const button = root?.querySelector<HTMLButtonElement>("#ptl-snd");
    if (!video || !button) return;
    /* `autoplay` set through injected markup can stay paused; start it muted. */
    video.muted = true;
    void video.play().catch(() => {});
    const toggle = () => {
      video.muted = !video.muted;
      if (!video.muted) void video.play().catch(() => {});
      button.textContent = video.muted ? "Sound on" : "Sound off";
      button.setAttribute("aria-pressed", String(!video.muted));
    };
    button.addEventListener("click", toggle);
    return () => button.removeEventListener("click", toggle);
  }, []);

  return (
    <div ref={rootRef} className="ptl-run">
      {slides.map((slide, i) => (
        <ArcBeat
          key={slide.id}
          id={slide.id}
          kind="media"
          className="arc-section arc-sec ptl-sec"
          ariaLabel={`${slide.pre} ${slide.em}`}
          motion="reveal"
        >
          <div className="arc-band">
            <ArcSectionHead
              head={{
                eyebrow: slide.eyebrow,
                title: { pre: slide.pre, em: slide.em },
                sub: slide.sub,
              }}
              kind="media"
              index={startIndex + i}
              sectionId={slide.id}
            />
            <div
              className="ptl arc-reveal"
              {...rung("reveal", 0.22)}
              dangerouslySetInnerHTML={{ __html: slide.body }}
            />
          </div>
        </ArcBeat>
      ))}
    </div>
  );
}
