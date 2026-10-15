"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";

import { advanceScrambles, queueScramble, type ScrambleJob } from "@/lib/home-v2/captionScramble";
import type { ArcFigureSpec } from "@/lib/arcs/types";

import { cardPose } from "./pose";

type CapabilitySpec = Extract<ArcFigureSpec, { id: "capability" }>;

/**
 * CapabilityStack — what AI could make, one thing at a time (ADR-156 U4,
 * owner 2026-10-15: "show an image ... it then rotates as if it goes back
 * onto the shelf, rotating on the x-axis, and we see the next thing ... but
 * don't make a bookshelf").
 *
 * One framed card is up at a time, in the house's frame. As the beat is
 * scrolled, the card's turn ends, it rotates back on its x-axis into the
 * stack of plates above, and the next card appears where it stands, its
 * title decoding in place (the house's scramble kernel). The stack is the
 * record growing: image, video, tools, mathematics.
 *
 * ⚠ A READER: one passive listener and one rAF, reading the beat's own
 * geometry (its park to the next beat's park); it writes only its cards'
 * transforms. Under reduced motion and below the terminal tier the cards
 * stand in a column, all of them, unposed (`figures.css`).
 */
export function CapabilityStack({ spec }: { spec: CapabilitySpec }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (!window.matchMedia("(min-width: 961px) and (prefers-reduced-motion: no-preference)").matches) return;
    const beat = root.closest<HTMLElement>("[data-arc-beat]");
    if (!beat) return;
    root.setAttribute("data-cap-live", "");
    const cards = Array.from(root.querySelectorAll<HTMLElement>("[data-cap-card]"));
    const titles = cards.map((c) => c.querySelector<HTMLElement>("[data-cap-title]"));
    const n = cards.length;
    const jobs: ScrambleJob[] = [];
    let scrambleRaf = 0;
    const tick = () => {
      scrambleRaf = 0;
      advanceScrambles(jobs, performance.now() / 1000);
      if (jobs.length) scrambleRaf = requestAnimationFrame(tick);
    };
    const wasFront = cards.map(() => false);

    const frame = () => {
      const r = beat.getBoundingClientRect();
      let next = beat.nextElementSibling as HTMLElement | null;
      while (next && !next.hasAttribute("data-arc-beat")) next = next.nextElementSibling as HTMLElement | null;
      const end = next ? next.getBoundingClientRect().top - r.top : r.height - window.innerHeight;
      const s = end > 0 ? -r.top / end : 0;
      cards.forEach((card, i) => {
        const p = cardPose(i, n, s);
        card.style.setProperty("--cap-rx", `${p.rx.toFixed(2)}deg`);
        card.style.setProperty("--cap-lift", p.lift.toFixed(4));
        card.style.setProperty("--cap-scale", p.scale.toFixed(4));
        card.toggleAttribute("data-cap-shown", p.shown);
        card.toggleAttribute("data-cap-stacked", p.stacked);
        card.toggleAttribute("data-cap-front", p.front);
        const t = titles[i];
        if (p.front && !wasFront[i] && t) {
          t.textContent = "";
          queueScramble(jobs, t, t.dataset.capTitle ?? "", performance.now() / 1000);
          if (!scrambleRaf) scrambleRaf = requestAnimationFrame(tick);
        }
        wasFront[i] = p.front;
      });
    };

    let raf = 0;
    const schedule = () => {
      if (!raf)
        raf = requestAnimationFrame(() => {
          raf = 0;
          frame();
        });
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    frame();
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (raf) cancelAnimationFrame(raf);
      if (scrambleRaf) cancelAnimationFrame(scrambleRaf);
      for (const t of titles) if (t) t.textContent = t.dataset.capTitle ?? "";
      root.removeAttribute("data-cap-live");
    };
  }, []);

  return (
    <div ref={rootRef} className="uxm-cap" role="list" aria-label={spec.alt}>
      {spec.cards.map((c, i) => (
        <article
          key={c.id}
          className="uxm-cap__card"
          role="listitem"
          data-cap-card=""
          data-cap-kind={c.kind}
          style={{ "--cap-i": i } as CSSProperties}
        >
          <header className="uxm-cap__band">
            <span className="uxm-cap__idx">
              {String(i + 1).padStart(2, "0")} · {c.kind}
            </span>
            <span className="uxm-cap__year">{c.year}</span>
          </header>
          <div className="uxm-cap__media">
            {c.media?.type === "image" ? (
              <Image src={c.media.src} alt={c.media.alt} fill sizes="(max-width: 960px) 100vw, 860px" />
            ) : null}
            {c.media?.type === "video" ? (
              <video src={c.media.src} poster={c.media.poster} muted loop autoPlay playsInline preload="none" aria-label={c.media.alt} />
            ) : null}
            {c.kind === "mathematics" ? <ProofTree /> : null}
          </div>
          <footer className="uxm-cap__foot">
            <h3 className="uxm-cap__title" data-cap-title={c.title}>
              {c.title}
            </h3>
            <p className="uxm-cap__caption">{c.caption}</p>
            <p className="uxm-cap__source">{c.source.label}</p>
          </footer>
          <span className="uxm-cap__tag" aria-hidden="true">
            {c.year} · {c.kind}
          </span>
        </article>
      ))}
    </div>
  );
}

/** A proof, drawn: premises at the top, steps branching and joining, one
 *  gold conclusion. No invented mathematics; the shape of an argument. */
function ProofTree() {
  const nodes: [number, number][] = [
    [80, 40], [200, 40], [320, 40], [440, 40],
    [140, 120], [300, 120], [400, 120],
    [220, 200], [380, 200],
    [300, 280],
  ];
  const links: [number, number][] = [
    [0, 4], [1, 4], [1, 5], [2, 5], [3, 6], [2, 6],
    [4, 7], [5, 7], [5, 8], [6, 8],
    [7, 9], [8, 9],
  ];
  return (
    <svg className="uxm-cap__proof" viewBox="0 0 520 320" aria-hidden="true">
      {links.map(([a, b]) => (
        <path key={`${a}-${b}`} d={`M${nodes[a][0]} ${nodes[a][1]} L${nodes[b][0]} ${nodes[b][1]}`} />
      ))}
      {nodes.map(([x, y], i) => (
        <rect
          key={i}
          x={x - 22}
          y={y - 11}
          width="44"
          height="22"
          data-cap-qed={i === nodes.length - 1 ? "" : undefined}
        />
      ))}
    </svg>
  );
}
