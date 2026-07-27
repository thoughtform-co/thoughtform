"use client";

import { useEffect } from "react";

import { advanceScrambles, queueScramble, type ScrambleJob } from "@/lib/home-v2/captionScramble";

/**
 * ProofRevealController — the `#proof` mission-report decode (ADR-054 U1).
 *
 * The report head PINS across its own runway, and its copy arrives the way
 * the services masthead's does (ADR-044): the title lines DECODE through
 * the canonical `captionScramble` kernel with the station-header CRT cursor
 * riding the line still resolving, while the lede TYPES on beside them.
 * Neither moves — no rise, no fade. Two stations, one reveal recipe.
 *
 * It differs from `ServicesMasthead` in exactly two ways, both forced by
 * the surface:
 *
 *   1. The markup is PARSE-INJECTED (`lib/v7-parse/proofStation.ts`), not
 *      JSX, so this is a controller that finds nodes and mutates them in
 *      place — the `RailManifestController` precedent. It renders nothing.
 *   2. `#proof` has NO scroll clock to read (ADR-054: no scroll writer on
 *      this station), so arrival is an IntersectionObserver on the head.
 *      That adds no scroll listener and no writer — the observer only
 *      fires at the crossing.
 *
 * Contracts kept from the services controller:
 *   - Writes text and attributes ONLY inside its own subtree.
 *   - Silent reconstruction: a reload already inside #proof paints the full
 *     copy with no replay; leaving upward re-arms it.
 *   - Enhanced tier only (≥961px + no reduced motion) — mobile / PRM / no-JS
 *     keep the static full text, which is what the markup already ships.
 *   - Strict-Mode safe: all loop state is effect-local, and cleanup restores
 *     the full text.
 */

/** Per-line start stagger (title line 1 → line 2), seconds. */
const LINE_STAGGER_S = 0.18;
/** Lede print rate — sized to finish just after the title resolves. */
const PARA_CHARS_PER_S = 220;
/** Head start the title gets before the first lede character prints. */
const PARA_START_DELAY_S = 0.12;
/** Fraction of the head that must be on screen to fire the decode. */
const REVEAL_RATIO = 0.35;

export function ProofRevealController() {
  useEffect(() => {
    // Enhanced tier only — mirrors the services masthead's gate.
    const enhanced = window.matchMedia(
      "(min-width: 961px) and (prefers-reduced-motion: no-preference)"
    ).matches;
    if (!enhanced) return;

    const head = document.querySelector<HTMLElement>("#proof .proof__report");
    const typed = document.querySelector<HTMLElement>("#proof .proof__lede-typed");
    if (!head || !typed) return;

    const targets = Array.from(head.querySelectorAll<HTMLElement>(".proof__title-text")).map(
      (el) => ({ el, text: el.textContent ?? "" })
    );
    if (targets.length === 0) return;

    const paraText = typed.textContent ?? "";
    const jobs: ScrambleJob[] = [];
    let raf = 0;
    let state: "armed" | "typing" | "done" = "done";
    let paraStartSec = 0;
    let paraRunning = false;
    // A mutable Text node + persistent cursor, so per-frame updates touch
    // only text data — never innerHTML, never React reconciliation.
    const paraNode = document.createTextNode("");
    const paraCursor = document.createElement("span");
    paraCursor.className = "proof__cursor proof__cursor--para";
    paraCursor.setAttribute("aria-hidden", "true");
    paraCursor.textContent = "█";

    /** The CRT cursor rides the FIRST title line still decoding. */
    const placeCursor = () => {
      let placed = false;
      for (const t of targets) {
        const show = state === "typing" && !placed && t.el.textContent !== t.text;
        if (show) placed = true;
        t.el.parentElement?.toggleAttribute("data-live", show);
      }
    };

    const settle = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
      jobs.length = 0;
      paraRunning = false;
      state = "done";
      for (const t of targets) {
        t.el.textContent = t.text;
        t.el.parentElement?.removeAttribute("data-live");
      }
      typed.textContent = paraText;
      head.setAttribute("data-reveal", "done");
    };

    const tick = () => {
      raf = 0;
      const nowSec = performance.now() / 1000;
      advanceScrambles(jobs, nowSec);
      placeCursor();

      let paraDone = true;
      if (paraRunning) {
        const t = nowSec - paraStartSec;
        const n = t <= 0 ? 0 : Math.min(paraText.length, Math.floor(t * PARA_CHARS_PER_S));
        if (paraNode.data.length !== n) paraNode.data = paraText.slice(0, n);
        paraDone = n >= paraText.length;
        if (paraDone && paraCursor.isConnected) {
          typed.textContent = paraText; // drops the cursor with the last char
        }
      }

      if (jobs.length === 0 && paraDone) {
        state = "done";
        head.setAttribute("data-reveal", "done");
        return; // rAF loop ends — reveal complete
      }
      raf = requestAnimationFrame(tick);
    };

    const begin = () => {
      state = "typing";
      head.setAttribute("data-reveal", "typing");
      const now = performance.now() / 1000;
      targets.forEach((t, i) => queueScramble(jobs, t.el, t.text, now + i * LINE_STAGGER_S));
      paraRunning = true;
      paraStartSec = now + PARA_START_DELAY_S;
      paraNode.data = "";
      typed.replaceChildren(paraNode, paraCursor);
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const arm = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
      jobs.length = 0;
      state = "armed";
      paraRunning = false;
      for (const t of targets) t.el.textContent = "";
      typed.textContent = "";
      placeCursor();
      head.setAttribute("data-reveal", "armed");
    };

    // Arm immediately unless the head is already on screen (reload inside
    // #proof reconstructs silently, per the rolodex first-paint rule).
    const startRect = head.getBoundingClientRect();
    const alreadyVisible =
      startRect.top < window.innerHeight * (1 - REVEAL_RATIO) && startRect.bottom > 0;
    if (alreadyVisible) settle();
    else arm();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (state === "armed") begin();
          } else if (state !== "armed" && entry.boundingClientRect.top > 0) {
            // Left downward (the head is below the viewport) — the reader
            // scrolled back above the station, so re-arm for the replay.
            arm();
          }
        }
      },
      { threshold: REVEAL_RATIO }
    );
    observer.observe(head);

    // Tab-return safety (the services precedent): a hide mid-reveal can
    // leave the copy blank with no further observer callback to fix it.
    const onVisibility = () => {
      if (document.hidden || state === "armed") return;
      settle();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      if (raf) cancelAnimationFrame(raf);
      jobs.length = 0;
      for (const t of targets) {
        t.el.textContent = t.text;
        t.el.parentElement?.removeAttribute("data-live");
      }
      typed.textContent = paraText;
      head.removeAttribute("data-reveal");
    };
  }, []);

  return null;
}
