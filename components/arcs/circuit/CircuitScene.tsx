"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { advanceScrambles, queueScramble, type ScrambleJob } from "@/lib/home-v2/captionScramble";
import type { ArcTitle } from "@/lib/arcs/types";

import { TYPE_CHARS_PER_S, UNTYPE_CPS } from "../arcMotion";
import { ArcTitleText, arcTitleText } from "../chrome";
import type { CircuitState } from "./circuitLayout";

/**
 * CircuitScene — the pinned stage the configuration travels on (ADR-133).
 *
 * ONE STICKY FRAME, THREE BEATS. The section is a runway; the stage pins at
 * the frame's top and the reader's scroll walks it through the three states of
 * one drawing. Two markers in the runway say where each beat begins, and an
 * IntersectionObserver on a band at the frame's midline reads which the reader
 * is past — never a scroll listener (the page's one writer is `useArcScroll`,
 * ADR-002), never a clock.
 *
 * A STATE CHANGE IS ONE ATTRIBUTE. `data-cir-state` on the figure picks each
 * part's pose from the custom properties the drawing already carries, and the
 * sheet's transitions play the travel on the compositor — which is what keeps
 * it glued, where a main-thread writer lags the wheel by a step (ADR-102's
 * finding).
 *
 * THE HEAD DECODES IN PLACE (the masthead law, ADR-044 / ADR-057): the
 * eyebrow and the title scramble from the outgoing beat's words into the
 * incoming's at a fixed position, and the paragraph un-types and types. Each
 * decoding box is held open by GHOSTS of all three beats' text, so the head
 * never reflows the drawing under it.
 *
 * ⚠ THE SCENE ARMS ITSELF, AND ONLY WHERE IT CAN RUN: a desktop frame with
 * motion allowed. Anywhere else the stamp is absent and the section reads as
 * the three beats in flow, each drawn at rest (reduced motion, ≤960px, no
 * script and print — the ADR-102 fail-open).
 */

export interface CircuitHeadText {
  eyebrow: string;
  title: ArcTitle;
  sub: string;
}

const SCENE_MEDIA = "(min-width: 961px) and (prefers-reduced-motion: no-preference)";

export function CircuitScene({
  heads,
  brief,
  coords,
  drawing,
}: {
  heads: Record<CircuitState, CircuitHeadText>;
  /** The right column's designation, e.g. "ARC / BRIEF · 07". */
  brief: string;
  coords: readonly [string, string];
  /** The live figure, server-rendered at state `a`. */
  drawing: ReactNode;
}) {
  const runRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const run = runRef.current;
    const section = run?.closest("section");
    if (!run || !section) return;
    const figure = run.querySelector<HTMLElement>("[data-cir-state]");
    const eyebrow = run.querySelector<HTMLElement>("[data-cir-eyebrow]");
    const pre = run.querySelector<HTMLElement>("[data-cir-pre]");
    const em = run.querySelector<HTMLElement>("[data-cir-em]");
    const sub = run.querySelector<HTMLElement>("[data-cir-sub]");
    const title = run.querySelector<HTMLElement>("[data-cir-title]");
    const marks = Array.from(run.querySelectorAll<HTMLElement>("[data-cir-mark]"));
    if (!figure || !eyebrow || !pre || !em || !sub || !title) return;

    const media = window.matchMedia(SCENE_MEDIA);
    let io: IntersectionObserver | null = null;
    let raf: number | null = null;
    let state: CircuitState = "a";
    const past: Record<string, boolean> = { b: false, c: false };
    const jobs: ScrambleJob[] = [];
    let typing: { phase: "out" | "in"; t0: number; from: string; to: string } | null = null;

    const now = () => performance.now() / 1000;

    const tick = () => {
      raf = null;
      const t = now();
      advanceScrambles(jobs, t);
      if (typing) {
        const el = sub;
        const dt = t - typing.t0;
        if (typing.phase === "out") {
          const left = Math.max(0, typing.from.length - Math.floor(dt * UNTYPE_CPS));
          el.textContent = typing.from.slice(0, left);
          if (left === 0) typing = { phase: "in", t0: t, from: "", to: typing.to };
        } else {
          const shown = Math.min(typing.to.length, Math.floor(dt * TYPE_CHARS_PER_S));
          el.textContent = typing.to.slice(0, shown);
          if (shown === typing.to.length) typing = null;
        }
      }
      if (jobs.length > 0 || typing) raf = window.requestAnimationFrame(tick);
    };
    const wake = () => {
      if (raf === null) raf = window.requestAnimationFrame(tick);
    };

    const go = (next: CircuitState) => {
      if (next === state) return;
      state = next;
      figure.setAttribute("data-cir-state", next);
      const h = heads[next];
      const t0 = now();
      queueScramble(jobs, eyebrow, h.eyebrow, t0);
      queueScramble(jobs, pre, h.title.pre ?? "", t0 + 0.05);
      queueScramble(jobs, em, h.title.em ?? "", t0 + 0.1);
      title.setAttribute("aria-label", arcTitleText(h.title));
      typing = { phase: "out", t0, from: sub.textContent ?? "", to: h.sub };
      wake();
    };

    /* Settle every decode at once — a hidden document stops rAF, and a
       decode that never finishes strands blank copy. */
    const settle = () => {
      const h = heads[state];
      jobs.length = 0;
      eyebrow.textContent = h.eyebrow;
      pre.textContent = h.title.pre ?? "";
      em.textContent = h.title.em ?? "";
      sub.textContent = h.sub;
      typing = null;
    };

    const arm = () => {
      if (!media.matches) {
        section.removeAttribute("data-circuit-scene");
        io?.disconnect();
        io = null;
        state = "a";
        figure.setAttribute("data-cir-state", "a");
        settle();
        return;
      }
      section.setAttribute("data-circuit-scene", "");
      if (io) return;
      io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const key = (entry.target as HTMLElement).dataset.cirMark ?? "";
            const mid = entry.rootBounds ? entry.rootBounds.top : window.innerHeight / 2;
            past[key] = entry.isIntersecting || entry.boundingClientRect.top < mid;
          }
          go(past.c ? "c" : past.b ? "b" : "a");
        },
        { rootMargin: "-49.5% 0px -50% 0px", threshold: 0 }
      );
      marks.forEach((m) => io?.observe(m));
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") settle();
    };

    arm();
    media.addEventListener("change", arm);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      media.removeEventListener("change", arm);
      document.removeEventListener("visibilitychange", onVisibility);
      io?.disconnect();
      if (raf !== null) window.cancelAnimationFrame(raf);
      section.removeAttribute("data-circuit-scene");
    };
  }, [heads]);

  const order: CircuitState[] = ["a", "b", "c"];
  const a = heads.a;
  return (
    <div className="arc-cir-run" ref={runRef}>
      <i className="arc-cir-run__mark" data-cir-mark="b" aria-hidden="true" />
      <i className="arc-cir-run__mark" data-cir-mark="c" aria-hidden="true" />
      <div className="arc-cir-pin">
        <div className="arc-band">
          <header className="arc-head arc-head--split arc-cir-head arc-reveal">
            <div className="arc-head__lead">
              <i className="arc-head__grid" aria-hidden="true" />
              <i className="arc-head__mark arc-head__mark--origin" aria-hidden="true" />
              <span className="arc-head__desig arc-cir-dec arc-cir-dec--inline" aria-hidden="true">
                {order.map((s) => (
                  <span key={s} className="arc-cir-dec__ghost">
                    {heads[s].eyebrow}
                  </span>
                ))}
                <span className="arc-cir-dec__live" data-cir-eyebrow="">
                  {a.eyebrow}
                </span>
              </span>
              <h2
                className="arc-title arc-head__title arc-cir-dec"
                data-cir-title=""
                aria-label={arcTitleText(a.title)}
              >
                {order.map((s) => (
                  <span key={s} className="arc-cir-dec__ghost" aria-hidden="true">
                    <ArcTitleText title={heads[s].title} />
                  </span>
                ))}
                <span className="arc-cir-dec__live" aria-hidden="true">
                  <span data-cir-pre="">{a.title.pre}</span> <em data-cir-em="">{a.title.em}</em>
                </span>
              </h2>
              <span className="arc-head__coord" aria-hidden="true">
                {coords[0]}
              </span>
            </div>
            <div className="arc-head__intro">
              <i className="arc-head__grid" aria-hidden="true" />
              <span className="arc-head__desig" aria-hidden="true">
                {brief}
              </span>
              <p className="arc-head__copy arc-cir-dec">
                {order.map((s) => (
                  <span key={s} className="arc-cir-dec__ghost" aria-hidden="true">
                    {heads[s].sub}
                  </span>
                ))}
                <span className="arc-cir-dec__live" data-cir-sub="">
                  {a.sub}
                </span>
              </p>
              <span className="arc-head__coord arc-head__coord--r" aria-hidden="true">
                {coords[1]}
              </span>
              <i className="arc-head__mark arc-head__mark--close" aria-hidden="true" />
            </div>
          </header>
        </div>
        <div className="arc-band">{drawing}</div>
      </div>
    </div>
  );
}
