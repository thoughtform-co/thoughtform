"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import {
  advanceScrambles,
  queueScramble,
  scrambleDuration,
  scrambleFrame,
  type ScrambleJob,
} from "@/lib/home-v2/captionScramble";
import { clamp01 } from "@/lib/math";
import { CHARACTER_ERAS, resolveCharacterEraHologram } from "@/lib/voidwalker/characterEras";
import { voidwalkerHologramProgressRef } from "@/lib/voidwalker/voidwalkerHologramClock";

import { useVoidwalkerHologramScroll } from "../../hooks/useVoidwalkerHologramScroll";

import { HoloEraPanels, eraPositionLabel } from "./HoloEraPanels";
import { HoloFigure } from "./HoloFigure";

/**
 * VoidwalkerHologram — the composition that mounts inside
 * `#voidwalker` on the home page.
 *
 * ⚠ THIS IS THE PRODUCTION SIDE OF THE LAB (ADR-082 U2). The look-dev
 * harness at `/test/voidwalker-holo-lab` wraps this same figure and
 * these same panels in a knob bar. Anything tuned there — the
 * treatment, the type ladder, the head-line anchor — lands here without
 * a translation, because both surfaces render the SAME `.vwh` DOM off
 * the SAME `voidwalker-hologram.css`.
 *
 * ⚠ TWO THINGS ARE DELIBERATELY STILL LOOK-DEV.
 *
 * 1. THE PROJECTOR BASE is a DOM MOCK. On the real page the site's own
 *    brandmark flattens and descends into that position — a WebGL
 *    choreography against `BrandmarkPhysicsCoreActor`'s camera-welded
 *    park, its own pass. The gold disc + ring + glow sits here as the
 *    seat that mark will eventually take; the composition above it does
 *    not change when it does.
 * 2. ERA SWITCHING IS DELIBERATE. The stage scroll clock owns only entry,
 *    reading hold and exit; choosing one of the six loadouts remains a
 *    tab, pointer, or keyboard action.
 *
 * ⚠ FIVE OF THE SIX ERAS RENDER THE THOUGHTFORM ASSET. Only the
 * thoughtform-era hologram exists so far (the `voidwalker-avatar` skill's
 * wave 20260826-thoughtform-v5). The other five era buttons switch the
 * copy panels but keep the same figure; the follow-up batch runs the
 * remaining five through the same pipeline. Author holograms lift here
 * by extending the era registry with a validated `hologram` field. The
 * resolver keeps the canonical Thoughtform pair as the visible fallback.
 */

const SCRAMBLE_ARM_AT = 0.05;
const SCRAMBLE_REARM_BELOW = 0.02;
const SCRAMBLE_STAGGER_S = 0.09;

/**
 * ⚠ THE ARRIVAL DECODE IS SCROLL-OWNED; ONLY AN ERA CLICK IS TIMED.
 *
 * ADR-082 U4 requires the initial materialization to be scroll-owned and
 * reversible, with the timed materialize reserved for deliberate era-button
 * changes — and the first cut did not honour it here. The decode ARMED on a
 * scroll threshold but then ran on `performance.now()`, so the destination
 * title resolved on a wall clock while the source name faded on a scroll
 * clock. Two uncoupled effects is what "it glitches at the end, but not
 * properly" describes: scrolling back left the title resolved, and scrubbing
 * did not scrub the decode.
 *
 * `scrambleFrame` is a pure function of elapsed `t` with no internal latch, so
 * feeding it a scroll-derived `t` makes the whole decode reversible for free.
 * `advanceScrambles` is NOT used on this path — it drops finished jobs, which
 * is precisely the latch we cannot have.
 *
 * The window opens just after entry and closes past the renderer takeover
 * (`[0, .08]`), so the title is already opaque while its last characters land:
 * it resolves IN PLACE rather than flashing complete at the seam.
 */
const TITLE_DECODE_WINDOW: readonly [number, number] = [0.02, 0.18];

export function VoidwalkerHologram() {
  const [eraIdx, setEraIdx] = useState(0);
  const [epoch, setEpoch] = useState(0);
  const [reduced, setReduced] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const kickerRef = useRef<HTMLSpanElement>(null);
  const titleRef = useRef<HTMLSpanElement>(null);
  const yearRef = useRef<HTMLSpanElement>(null);
  // Set only by `pick`: distinguishes a deliberate era choice (timed, finite)
  // from arrival by scroll (scrubbed, reversible).
  const deliberateRef = useRef(false);

  const stageActive = useVoidwalkerHologramScroll(rootRef);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const era = CHARACTER_ERAS[eraIdx];
  const hologram = resolveCharacterEraHologram(era);

  /**
   * THE MASTHEAD DECODES IN, LIKE THE SECTION BEFORE IT.
   *
   * `#about` scrambles his NAME and role toward their finals as the copy
   * clock arms (`AboutStage`, ADR-047 U7). This is the same kernel
   * (`lib/home-v2/captionScramble`) on the same three-target stagger, so
   * the era's name resolves the way his own does one section earlier
   * rather than simply fading up.
   *
   * ⚠ THE DECODE IS DESTRUCTIVE — it writes `textContent` — so every line
   * has a transparent in-flow GHOST generated from the final string and an
   * absolutely overlaid, aria-hidden LIVE span as the ref target. The wrapper
   * keeps that final as its accessible label; the generated ghost keeps the
   * mast's responsive footprint invariant while the live string is blank or
   * partial. It re-runs on every era switch. Initial figure
   * acquisition is owned by the reversible runway morph; only an explicit
   * era-button choice bumps the figure's finite materialize epoch. Reverse
   * scroll below the floor restores the finals, blanks again, and permits a
   * clean replay instead of leaving a one-shot latch behind.
   */
  useLayoutEffect(() => {
    const targets = [kickerRef.current, titleRef.current, yearRef.current];
    if (targets.some((t) => !t)) return;

    const finals = [eraPositionLabel(eraIdx), era.wardrobe, era.year];
    const restore = () => {
      targets.forEach((el, i) => {
        if (el) el.textContent = finals[i]!;
      });
    };
    if (reduced) {
      restore();
      return;
    }
    // Static/mobile/lab/fallback presentations carry finished copy and do
    // not need a permanent scroll-clock reader. Era clicks still retrigger
    // the finite figure materialize in `pick` below.
    if (!stageActive) {
      restore();
      return;
    }

    const jobs: ScrambleJob[] = [];
    let armed = false;
    let blanked = false;
    let raf = 0;

    // An era CLICK is a deliberate, finite event and keeps the timed path.
    // Arrival by scroll is scrubbed — see TITLE_DECODE_WINDOW.
    const deliberate = deliberateRef.current;
    deliberateRef.current = false;

    const blank = () => {
      blanked = true;
      targets.forEach((el) => {
        if (el) el.textContent = "";
      });
    };
    const arm = (nowSec: number) => {
      if (!blanked) blank();
      armed = true;
      targets.forEach((el, i) => {
        // Stagger so the era name lands between its two chrome lines.
        queueScramble(jobs, el as HTMLElement, finals[i]!, nowSec + i * SCRAMBLE_STAGGER_S);
      });
    };

    /** The scrubbed writer: one pure frame per target, from scroll alone. */
    const writeScrolled = (enter: number) => {
      const span = TITLE_DECODE_WINDOW[1] - TITLE_DECODE_WINDOW[0];
      const p = clamp01((enter - TITLE_DECODE_WINDOW[0]) / span);
      // The longest line plus the full stagger is the wall the scalar maps
      // onto, so every target finishes together at p = 1 however long its
      // own string is.
      const total =
        Math.max(...finals.map((f) => scrambleDuration("", f))) +
        SCRAMBLE_STAGGER_S * (finals.length - 1);
      targets.forEach((el, i) => {
        if (!el) return;
        const final = finals[i]!;
        const t = p * total - i * SCRAMBLE_STAGGER_S;
        if (t <= 0) {
          el.textContent = "";
          return;
        }
        el.textContent = scrambleFrame({ from: "", to: final }, t) ?? final;
      });
    };

    // Era switches while the stage is already live must blank before the
    // browser paints the new finals. Entry from above is blanked on the first
    // rAF after the scroll writer engages (the stage is still off-screen).
    const initial = voidwalkerHologramProgressRef.current;
    if (initial.engaged) {
      blank();
      if (deliberate && initial.enter >= SCRAMBLE_ARM_AT) arm(performance.now() / 1000);
    }

    const tick = () => {
      const clock = voidwalkerHologramProgressRef.current;

      if (!clock.engaged) {
        if (armed || blanked || jobs.length) {
          jobs.length = 0;
          armed = false;
          blanked = false;
          restore();
        }
        raf = requestAnimationFrame(tick);
        return;
      }

      if (deliberate) {
        // Finite, wall-clock, one-shot — an era choice is an EVENT.
        advanceScrambles(jobs, performance.now() / 1000);
        if (armed && clock.enter <= SCRAMBLE_REARM_BELOW) {
          jobs.length = 0;
          armed = false;
          blanked = false;
          restore();
        } else if (!armed) {
          if (!blanked) blank();
          if (clock.enter >= SCRAMBLE_ARM_AT) arm(performance.now() / 1000);
        }
      } else {
        // Scrubbed: position IS the decode, in both directions, with no
        // latch to unwind on reverse.
        if (!blanked) blank();
        writeScrolled(clock.enter);
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      jobs.length = 0;
      restore();
    };
  }, [era.id, era.wardrobe, era.year, eraIdx, reduced, stageActive]);

  const pick = (i: number) => {
    deliberateRef.current = true;
    setEraIdx(i);
    // The runway owns initial acquisition. A deliberate era choice is the
    // only event allowed to start HoloFigure's finite 900ms materialize.
    setEpoch((value) => value + 1);
  };

  return (
    <div
      className="vwh"
      data-vwh-era={era.id}
      data-vwh-region="character-sheet"
      data-testid="voidwalker-character-sheet"
      ref={rootRef}
    >
      <HoloEraPanels
        selectedEraIndex={eraIdx}
        onSelectEra={pick}
        identityRefs={{
          kicker: kickerRef,
          title: titleRef,
          year: yearRef,
        }}
      />

      <div className="vwh__column" data-vwh-region="figure">
        <HoloFigure
          hologram={hologram}
          epoch={epoch}
          form="emissive"
          blend="plus-lighter"
          alpha={0.92}
          scanPitch={3}
          glow={1}
          reduced={reduced}
          initialMaterialization="scroll"
        />

        {/* Placeholder for the brandmark descent — see file header. */}
        <div className="vwh__base" data-vwh-region="platform" aria-hidden="true">
          <span className="vwh__base__disc" />
          <span className="vwh__base__ring" />
          <span className="vwh__base__glow" />
        </div>
      </div>
    </div>
  );
}
