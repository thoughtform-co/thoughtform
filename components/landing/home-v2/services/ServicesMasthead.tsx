"use client";

import { useEffect, useRef } from "react";

import { SERVICES_MASTHEAD } from "./serviceData";
import { advanceScrambles, queueScramble, type ScrambleJob } from "@/lib/home-v2/captionScramble";

/**
 * ServicesMasthead — the #services register handover (ADR-044, 2026-07-16).
 *
 * Full-caps title LEFT / intro plate RIGHT in the stage's upper band —
 * the Linear-style editorial split promoted from /test/services-wordmark
 * (columns pulled `--hud-margin + 8vw` inboard of the rail guides). This is
 * SECTION-level copy only: per-card copy stays baked on the WebGL card faces
 * (ADR-029 guardrail — no DOM text console beside the ring) and this band
 * never reads `data-active-step`.
 *
 * REVEAL (owner, 2026-07-16; amended 2026-07-27): everything launches
 * TOGETHER on section arrival. The title lines decode through the
 * canonical `captionScramble` kernel (the corridor caption-chrome idiom)
 * with the station-header CRT cursor riding the line being decoded, while
 * the paragraph TYPES on beside them. Both resolve within the same ~0.9s
 * window.
 *
 * The copy DOES NOT MOVE AND DOES NOT CROSSFADE (owner, 2026-07-27): the
 * band's 18px entrance rise and its `--svc-content-in` opacity ramp are
 * gone from `.services-masthead` (services.css) — the arrival clock now
 * fades in the survey CHROME only. The glitch is the entire reveal, and
 * it plays on copy that is already parked at full strength. Do not
 * re-attach an entrance transform or an entrance opacity to this band, and
 * do not give the title/intro a `data-m` role — both would put the motion
 * back under the decode. `#proof` carries the same contract (ADR-054 U1).
 * Rules honoured:
 *   - The arrival clock stays the single scroll writer: this controller
 *     only READS `--svc-content-in` off `.services-stage` (via a
 *     MutationObserver on its per-frame style writes — the
 *     ServicesRailRegister precedent) and writes text/attrs ONLY inside
 *     its own subtree.
 *   - Silent reconstruction: a reload already inside #services paints the
 *     full text + open plate with no replay (the rolodex first-paint
 *     philosophy). Dropping back below the section re-arms everything.
 *   - Enhanced tier only (≥961px + no reduced motion — the stage's
 *     hologram gate): mobile / PRM / no-JS keep the static open plate.
 *   - Strict-Mode safe: all loop state is effect-local; cleanup restores
 *     the full text and the open plate.
 */

/** Arrival-clock crossing that (together with the park gate below) starts
 *  the decode. Kept as a real threshold mostly for the LAB replays, which
 *  drive this clock directly (0 → 1) with the stage always parked; in
 *  production the park is the later, governing condition. */
const REVEAL_AT = 0.45;
/** Clock floor that re-arms the reveal for a replay on re-entry (the lab
 *  replay path; in production the unpark observer re-arms first). */
const REARM_BELOW = 0.05;
/**
 * PARK GATE (owner, 2026-07-27 round 2): the decode may only run — and the
 * resolved copy may only be visible — while the sticky stage is PARKED at
 * the viewport top. Measured, the arrival clock is not that signal:
 * `--svc-content-in` crosses REVEAL_AT while the stage is still ~100-200px
 * below its pin (forward), and on reverse scroll the stage unpins and
 * travels ~300px with the full text still shown before the clock reaches
 * REARM_BELOW — the "masthead moves up when scrolling back" complaint. So
 * the controller also watches the stage's park state via an
 * IntersectionObserver whose root is a thin band at the top of the
 * viewport (the `#proof` PIN_BAND recipe, ProofRevealController):
 * begin fires at clock ∧ parked, and the moment the stage UNPARKS upward
 * the whole masthead re-arms (instant blank — never a fade on moving
 * text). No scroll listener, no writer — the arrival clock stays the
 * single scroll writer and the observer only fires at the crossing.
 */
const PIN_BAND = 0.02;
/** Per-target start stagger (title line 1 → title line 2), s. */
const TARGET_STAGGER_S = 0.18;
/** Paragraph typewriter rate — a fast print sweep, sized so the copy
 *  finishes just after the 0.55s aperture unfold completes. */
const PARA_CHARS_PER_S = 220;
/** Head start the aperture gets before the first paragraph character
 *  prints (the slit needs to crack open first). */
const PARA_START_DELAY_S = 0.12;

export function ServicesMasthead() {
  const rootRef = useRef<HTMLElement | null>(null);
  const lineRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const typedRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    // Enhanced tier only — mirrors the stage's hologram/ring gate.
    const enhanced = window.matchMedia(
      "(min-width: 961px) and (prefers-reduced-motion: no-preference)"
    ).matches;
    if (!enhanced) return;

    const root = rootRef.current;
    const stage = root?.closest<HTMLElement>(".services-stage");
    const typed = typedRef.current;
    if (!root || !stage || !typed) return;

    const targetSources: Array<{ el: HTMLSpanElement | null; text: string }> =
      SERVICES_MASTHEAD.titleLines.map((line, i) => ({
        el: lineRefs.current[i] ?? null,
        text: line.text as string,
      }));
    const targets = targetSources.filter(
      (t): t is { el: HTMLSpanElement; text: string } => t.el !== null
    );
    if (targets.length === 0) return;

    const paraText: string = SERVICES_MASTHEAD.intro;
    const jobs: ScrambleJob[] = [];
    let raf = 0;
    let state: "armed" | "typing" | "done" = "armed";
    // Paragraph typewriter machinery: a mutable Text node + a persistent
    // cursor element, so per-frame updates touch only the text data
    // (never innerHTML, never React reconciliation).
    let paraStartSec = 0;
    let paraRunning = false;
    const paraNode = document.createTextNode("");
    const paraCursor = document.createElement("span");
    paraCursor.className = "services-masthead__cursor services-masthead__cursor--para";
    paraCursor.setAttribute("aria-hidden", "true");
    paraCursor.textContent = "█";

    // Fails open to 1 (parked) when the var is missing, the house
    // convention — a missing stage var can never blank a live section.
    const readClock = () => {
      const raw = Number.parseFloat(stage.style.getPropertyValue("--svc-content-in"));
      return Number.isFinite(raw) ? raw : 1;
    };

    // Park gate: the sticky stage is at (or within PIN_BAND of) the
    // viewport top. The masthead root is `inset: 0` inside the stage, so
    // its own rect IS the stage rect. Both labs mount the stage in a
    // full-viewport station box (top 0), so this reads parked there and
    // the clock-driven replay keeps working.
    const isParked = () => {
      const r = root.getBoundingClientRect();
      return r.top <= window.innerHeight * PIN_BAND && r.bottom > 0;
    };

    /** The CRT cursor rides the FIRST title line still decoding. */
    const placeCursor = () => {
      let placed = false;
      for (let i = 0; i < targets.length; i++) {
        const t = targets[i];
        const show = state === "typing" && !placed && t.el.textContent !== t.text;
        if (show) placed = true;
        t.el.parentElement?.toggleAttribute("data-live", show);
      }
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
        root.setAttribute("data-reveal", "done");
        return; // rAF loop ends — reveal complete
      }
      raf = requestAnimationFrame(tick);
    };

    const begin = () => {
      // Everything launches TOGETHER (owner, 2026-07-16): the title starts
      // its decode on the left while the plate unfolds (the armed slit
      // releases the moment the attr leaves "armed") and the paragraph
      // prints inside the opening aperture — the three resolve within the
      // same ~0.9s window.
      state = "typing";
      root.setAttribute("data-reveal", "typing");
      const now = performance.now() / 1000;
      targets.forEach((t, i) => queueScramble(jobs, t.el, t.text, now + i * TARGET_STAGGER_S));
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
      root.setAttribute("data-reveal", "armed");
    };

    const onClock = () => {
      const v = readClock();
      if (state === "armed" && v >= REVEAL_AT && isParked()) begin();
      else if (state !== "armed" && v < REARM_BELOW) arm();
    };

    // First sync: a reload already parked inside the section shows the
    // full text silently; arriving from the corridor arms the reveal.
    if (readClock() >= REVEAL_AT && isParked()) {
      state = "done";
      root.setAttribute("data-reveal", "done");
    } else {
      arm();
    }

    // `useServicesStageScroll` rewrites the stage's inline style per scroll
    // frame — observing it IS the clock (no new scroll listener, zero idle
    // cost; the rAF above runs only while a reveal is in flight).
    const observer = new MutationObserver(onClock);
    observer.observe(stage, { attributes: true, attributeFilter: ["style"] });

    // Park observer (the `#proof` PIN_BAND recipe): the clock writer
    // dedupes its writes, so once `--svc-content-in` saturates BEFORE the
    // pin no further mutation fires at the park moment — the crossing has
    // to be observed directly. Intersecting the top band = parked (try to
    // begin); leaving the band DOWNWARD (rect below the band) = the stage
    // unpinned toward the corridor, so re-arm NOW, while the copy has not
    // yet visibly travelled. Leaving upward (exit into #about) keeps the
    // resolved state — the exit envelope owns that fade.
    const parkObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (state === "armed" && readClock() >= REVEAL_AT) begin();
          } else if (state !== "armed" && entry.boundingClientRect.top > 0) {
            arm();
          }
        }
      },
      { rootMargin: `0px 0px -${(100 - PIN_BAND * 100).toFixed(2)}% 0px`, threshold: 0 }
    );
    parkObserver.observe(root);

    // Tab-return safety (2026-07-17): if the tab was hidden mid-reveal, or a
    // resume race left the controller armed (text cleared) while the stage
    // clock has already settled, the MutationObserver may not fire on return
    // (no fresh style mutation). Re-evaluate the clock on visibility resume
    // so the masthead copy can never stay blank after a tab switch.
    const onVisibility = () => {
      if (document.hidden) return;
      // Guarantee the copy is never left blank after a tab switch: if the
      // section has settled, force the resolved full-text state directly (a
      // hide mid-reveal or a resume race can leave the internal state out of
      // step with the observer, which won't re-fire without a fresh style
      // mutation). Below the reveal threshold, re-arm via onClock.
      if (readClock() >= REVEAL_AT && isParked()) {
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
        root.setAttribute("data-reveal", "done");
      } else if (state !== "armed" && !isParked()) {
        // Restored with the stage away from its park (scrolled while
        // hidden) — blank rather than show resolved copy on a moving
        // stage; the park observer re-fires the decode on re-entry.
        arm();
      } else {
        onClock();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      observer.disconnect();
      parkObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      if (raf) cancelAnimationFrame(raf);
      jobs.length = 0;
      for (const t of targets) {
        t.el.textContent = t.text;
        t.el.parentElement?.removeAttribute("data-live");
      }
      typed.textContent = paraText;
      root.removeAttribute("data-reveal");
    };
  }, []);

  const { survey } = SERVICES_MASTHEAD;

  return (
    <header className="services-masthead" ref={rootRef}>
      <div className="services-masthead__lead">
        {/* M2 survey plate: the title block is a surveyed panel — a masked
            dot-grid lift behind it, the gold origin registration mark
            claiming its head, a PT-Mono designation above, a coordinate
            stamp at its foot. All decorative (aria-hidden); geometry hangs
            off the block via --survey-* tokens and rides the band opacity. */}
        <i className="services-masthead__grid" aria-hidden="true" />
        <i className="services-masthead__mark services-masthead__mark--origin" aria-hidden="true" />
        <span className="services-masthead__desig" aria-hidden="true">
          {survey.titleDesig}
        </span>
        {/* The "Services · 04" eyebrow was retired here (owner, 2026-07-17)
            — the headline reads first, matching the corridor heads. */}
        {/* aria-label keeps the section heading stable for AT while the
            visual characters decode. */}
        <h2
          className="services-masthead__title"
          aria-label={SERVICES_MASTHEAD.titleLines.map((line) => line.text).join(" ")}
        >
          {SERVICES_MASTHEAD.titleLines.map((line, i) => (
            <span
              key={line.text}
              aria-hidden="true"
              className={
                line.em
                  ? "services-masthead__title-line services-masthead__title-line--em"
                  : "services-masthead__title-line"
              }
            >
              <span
                ref={(el) => {
                  lineRefs.current[i] = el;
                }}
              >
                {line.text}
              </span>
              <span className="services-masthead__cursor" aria-hidden="true">
                █
              </span>
            </span>
          ))}
        </h2>
        <span className="services-masthead__coord" aria-hidden="true">
          {survey.titleCoord}
        </span>
      </div>
      {/* Brief block — the second surveyed panel. Same survey furniture plus
          the one gold OPEN state chip at its head-right and the dawn CLOSE
          registration mark at its foot; the origin + close marks span the
          band corner-to-corner on one diagonal. The retired X1-B corner
          crosses stay in the JSX (LandingPage render-stability) — CSS keeps
          them hidden. */}
      <div className="services-masthead__intro">
        <i className="services-masthead__grid" aria-hidden="true" />
        <span className="services-masthead__desig" aria-hidden="true">
          {survey.briefDesig}
        </span>
        <span className="services-masthead__state" aria-hidden="true">
          {survey.state}
        </span>
        <span className="services-masthead__intro-cross is-tl" aria-hidden="true" />
        <span className="services-masthead__intro-cross is-tr" aria-hidden="true" />
        <span className="services-masthead__intro-cross is-bl" aria-hidden="true" />
        <span className="services-masthead__intro-cross is-br" aria-hidden="true" />
        <p className="services-masthead__intro-copy">
          <span className="services-masthead__intro-ghost" aria-hidden="true">
            {SERVICES_MASTHEAD.intro}
          </span>
          <span className="services-masthead__intro-typed" ref={typedRef}>
            {SERVICES_MASTHEAD.intro}
          </span>
        </p>
        <span className="services-masthead__coord services-masthead__coord--r" aria-hidden="true">
          {survey.briefCoord}
        </span>
        <i className="services-masthead__mark services-masthead__mark--close" aria-hidden="true" />
      </div>
    </header>
  );
}
