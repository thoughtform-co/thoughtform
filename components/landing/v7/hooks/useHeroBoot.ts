"use client";

import { useEffect } from "react";
import type { RefObject } from "react";

import { advanceScrambles, queueScramble, type ScrambleJob } from "@/lib/home-v2/captionScramble";

/**
 * useHeroBoot — the hero's terminal boot (owner, 2026-07-16), shared by
 * the landing and the arc pages (ADR-075).
 *
 * The headline scramble-decodes line by line (the caption kernel — the
 * same glitch as the corridor captions and the services masthead), the
 * paragraph TYPES with a block cursor, and the CTA buttons UNFURL
 * centre-out like the arc console frames.
 *
 * LCP discipline (ADR-039): this NEVER holds text blank before
 * hydration — it re-decodes the ALREADY-PAINTED text at hydration as a
 * one-shot boot moment. LCP is recorded on the first largest paint and a
 * post-paint mutation does not retract it. Reduced motion skips the whole
 * boot (text stays as painted, buttons visible via the `data-m` path).
 *
 * Lifted out of `LandingPage` for ADR-075 so `/arcs/[slug]` boots its
 * hero identically. ONE generalisation came with the move: the line
 * collector now walks text nodes RECURSIVELY, so a headline carrying the
 * arcs' upright-gold `<em>` pivot decodes both halves instead of leaving
 * the gold one resolved while the rest scrambles. The landing's own
 * headline has no child elements, so its output is unchanged — pinned by
 * `tests/lib/hero-boot.test.tsx` in both shapes.
 *
 * All three effects it drives are already styled in landing.css
 * (`.hero__headline-line`, `.hero__type-cursor`,
 * `.hero__cta[data-unfurl]`), which the arcs import — no new CSS.
 */

const HEADLINE_START_S = 0.12;
const HEADLINE_STAGGER_S = 0.16;
const DESC_START_S = 0.55;
const DESC_CHARS_PER_S = 220;

/**
 * Every non-empty text node under `el`, in document order.
 *
 * ⚠ RECURSIVE ON PURPOSE, and the wrapper goes INSIDE the node's own
 * parent — so an `<em>`'s text becomes `<em><span class="…line">…</span></em>`
 * and keeps its gold. `.hero__headline-line` is `inline-block`, so a span
 * inside an inline `<em>` costs no layout. `<br>` elements are never text
 * nodes, so they stay outside every span, which is what keeps the line
 * breaks where the author put them.
 */
function textNodesOf(el: HTMLElement): Text[] {
  const out: Text[] = [];
  const walk = (node: Node) => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        if (child.textContent && child.textContent.trim()) out.push(child as Text);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        walk(child);
      }
    }
  };
  walk(el);
  return out;
}

export function useHeroBoot(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const headline = root.querySelector<HTMLElement>(".hero__headline");
    const desc = root.querySelector<HTMLElement>(".hero__desc");
    const cta = root.querySelector<HTMLElement>(".hero__cta");
    if (!headline || !desc || !cta) return;

    // 1. Headline lines — wrap each text node in a span (the scramble
    //    kernel writes textContent, so `<br/>` and `<em>` must stay
    //    outside it), blank, then queue staggered decodes.
    const lines: HTMLElement[] = [];
    for (const node of textNodesOf(headline)) {
      const span = document.createElement("span");
      span.className = "hero__headline-line";
      span.textContent = node.textContent;
      node.replaceWith(span);
      lines.push(span);
    }
    const jobs: ScrambleJob[] = [];
    const t0 = performance.now() / 1000;
    const lineTargets = lines.map((el) => el.textContent ?? "");
    lines.forEach((el) => {
      el.textContent = "";
    });

    // 2. Paragraph typewriter — mutable text node + CRT block cursor
    //    (the ServicesMasthead intro recipe).
    const descText = desc.textContent ?? "";
    desc.textContent = "";
    const descNode = document.createTextNode("");
    const cursor = document.createElement("span");
    cursor.className = "hero__type-cursor";
    cursor.textContent = "█";
    desc.append(descNode, cursor);

    // 3. Buttons — clip shut now, unfurl on cue (CSS owns the motion).
    cta.setAttribute("data-unfurl", "shut");

    const CTA_AT_S = DESC_START_S + descText.length / DESC_CHARS_PER_S + 0.15;

    let raf = 0;
    let booted = false;
    let ctaOpened = false;
    const tick = () => {
      const nowSec = performance.now() / 1000;
      const t = nowSec - t0;
      if (!booted) {
        booted = true;
        lines.forEach((el, i) => {
          queueScramble(jobs, el, lineTargets[i], t0 + HEADLINE_START_S + i * HEADLINE_STAGGER_S);
        });
      }
      advanceScrambles(jobs, nowSec);
      // Typewriter advance (clamped, whole chars).
      const typed = Math.max(0, Math.min(descText.length, (t - DESC_START_S) * DESC_CHARS_PER_S));
      const head = Math.floor(typed);
      if (descNode.textContent !== descText.slice(0, head)) {
        descNode.textContent = descText.slice(0, head);
      }
      if (!ctaOpened && t >= CTA_AT_S) {
        ctaOpened = true;
        cta.setAttribute("data-unfurl", "open");
      }
      const done = jobs.length === 0 && head >= descText.length && ctaOpened;
      if (done) {
        cursor.remove();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [rootRef]);
}
