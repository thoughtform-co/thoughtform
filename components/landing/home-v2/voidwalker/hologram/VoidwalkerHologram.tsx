"use client";

import type React from "react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import {
  advanceScrambles,
  queueScramble,
  scrambleDuration,
  scrambleFrame,
  type ScrambleJob,
} from "@/lib/home-v2/captionScramble";
import { clamp01 } from "@/lib/math";
import {
  CHARACTER_ERAS,
  holoFigureFit,
  holoFigureHeadShare,
  resolveCharacterEraHologram,
} from "@/lib/voidwalker/characterEras";
import { neighbourEras } from "@/lib/voidwalker/holoGlitch";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import {
  VOIDWALKER_PHONE_RUNWAY,
  VOIDWALKER_PHONE_RUNWAY_MEDIA,
} from "../../unifiedServicesInstrument";
import { voidwalkerHologramProgressRef } from "@/lib/voidwalker/voidwalkerHologramClock";

import {
  VOIDWALKER_PHONE_ERA_BAND,
  voidwalkerEraPickRef,
  voidwalkerEraScrubRef,
  voidwalkerProgressForEra,
} from "@/lib/voidwalker/voidwalkerHologramClock";
import { useVoidwalkerHologramScroll } from "../../hooks/useVoidwalkerHologramScroll";

import { HoloDatumPanels } from "./HoloDatumPanels";
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
 * 1. THE SEAT IS AN EMPTY BOX, AND THE DISC THAT SAT ON IT IS GONE (ADR-082
 *    U35, owner: "now it feels like I'm floating … If it's a separate
 *    element, I would just remove the circle"). It was a DOM mock of a
 *    brandmark descent that was never built — a gold disc, ring and glow —
 *    and every era's boots stood on its top edge, which read as a figure
 *    hovering over a platform. ⚠ THE BOX STAYS: the slot's floor, the desktop
 *    lift, the reticle's centre, the phone column's translate and the About
 *    handoff's portrait seat all read `.vwh__base`'s geometry, so only its
 *    PAINT went and nothing moved.
 * 2. ERA SWITCHING IS SCROLL-STEPPED AND CLICKABLE, AND EVERY CHANGE IS THE
 *    SAME TRANSITION. The one scroll writer derives the era from the runway
 *    (owner, 2026-08-27) and the band's chips, pointer or keyboard choose
 *    one directly; either way the figure changes by the glitch in
 *    `HoloFigure` (ADR-082 U42), never by the epoch-driven materialize, which
 *    is the figure lab's now.
 *
 * ⚠ FOUR OF THE FIVE ERAS CARRY THEIR OWN FIGURE; ONLY `loop` (the Intelligence
 * Architect, 2026) renders the canonical Thoughtform pair, which is also every
 * era's fallback. The others' waves and asset versions live in
 * `characterEras.ts` beside the paths, which is the one place they can be read
 * without going stale here; a new era lifts itself off the fallback by
 * extending the registry with a validated `hologram` field.
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
  const [reduced, setReduced] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLSpanElement>(null);
  // Set only by `pick`: distinguishes a deliberate era choice (timed, finite)
  // from arrival by scroll (scrubbed, reversible).
  const deliberateRef = useRef(false);

  const stageActive = useVoidwalkerHologramScroll(rootRef);

  /* ⚠ SCROLL STEPS THE ERAS BEFORE THE PAGE MOVES ON (owner, 2026-08-27).
     The runway already exists and is already pinned, so this needs no wheel
     capture and no second listener: the one scroll writer derives the index
     and hands it here. A scrubbed arrival is NOT deliberate — the title's
     decode stays scrubbed — and since ADR-082 U42 the figure's own glitch
     answers either kind of change the same way. */
  useEffect(() => {
    voidwalkerEraScrubRef.current = (index: number) => {
      setEraIdx((prev) => (prev === index ? prev : index));
    };
    return () => {
      voidwalkerEraScrubRef.current = null;
    };
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const era = CHARACTER_ERAS[eraIdx];
  const hologram = resolveCharacterEraHologram(era);
  /* The eras a step away — their posters are what the figure's glitch tears
     INTO, decoded ahead while the figure is near (ADR-082 U42).
     ⚠ ON THE PHONE RUNWAY, EVERY ERA (ADR-123): a fling crosses four slices
     in a beat, and a tear into an undecoded poster is a blank frame. */
  const phoneRunwayMedia = useMediaQuery(VOIDWALKER_PHONE_RUNWAY_MEDIA);
  const phoneRunway = VOIDWALKER_PHONE_RUNWAY && phoneRunwayMedia;
  const neighbours = useMemo(
    () =>
      (phoneRunway
        ? CHARACTER_ERAS.map((_, i) => i).filter((i) => i !== eraIdx)
        : neighbourEras(eraIdx, CHARACTER_ERAS.length)
      ).map((i) => resolveCharacterEraHologram(CHARACTER_ERAS[i]!)),
    [eraIdx, phoneRunway]
  );

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
   * acquisition is owned by the reversible runway morph; an era change is
   * the figure's own glitch (ADR-082 U42), whoever asked for it. Reverse
   * scroll below the floor restores the finals, blanks again, and permits a
   * clean replay instead of leaving a one-shot latch behind.
   */
  useLayoutEffect(() => {
    /* ⚠ ONE TARGET SINCE ADR-082 U23. The eyebrow's two lines are deleted, and
       the year did not follow them onto SCOPE's head: that head arrives on the
       0.16 rung of §G's ladder, whose ramp saturates around `--vwh-in` 0.655,
       while `TITLE_DECODE_WINDOW` closes at 0.18 — a scramble seated there
       would play out while the element is still transparent and then fade up
       already finished. The stagger machinery below is left generic on
       purpose; it simply has nothing to stagger against today. */
    const targets = [titleRef.current];
    if (targets.some((t) => !t)) return;

    const finals = [era.wardrobe];
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
    /* ⚠ NO EPOCH BUMP (ADR-082 U42). A click used to start HoloFigure's
       finite 900ms tear-in on the NEW figure plus a brightness-step settle;
       the era change itself is the transition now — the same canvas glitch a
       scrubbed arrival gets — so the two paths cannot disagree about what an
       era change looks like. `deliberate` still owns the TITLE's timed decode. */
    /* ⚠ A CLICK PINS THE SCROLL TO THAT ERA'S SLICE CENTRE. Without this the
       scroll spy resolves the runway's own position on the very next frame
       and overrides the choice — the casefile's browse band learned this and
       the two halves are one contract (ADR-056 U13). Failing to find the
       runway simply leaves the click as a plain selection. */
    const root = rootRef.current;
    const runway = root?.parentElement;
    if (!root || !runway) return;
    /* ADR-123: on the phone runway the band is the pinned `.vwd` (100dvh),
       so the travel is runway − band, MEASURED as the writer measures it,
       the slice table is the phone's edge-to-edge band, and the pick ref
       holds this era through the glide (the spy would otherwise step
       through every slice on the way). Off the runway rung the travel is
       ≤ 0 and a tap is a plain selection, as before. */
    const phone = runway.closest<HTMLElement>("#voidwalker")?.dataset.vwPhone === "runway";
    const travel = runway.offsetHeight - (phone ? root.offsetHeight : window.innerHeight);
    if (travel <= 0) return;
    const top = runway.getBoundingClientRect().top + window.scrollY;
    if (phone) voidwalkerEraPickRef.current = { era: i, at: performance.now() };
    window.scrollTo({
      top:
        top +
        voidwalkerProgressForEra(
          i,
          CHARACTER_ERAS.length,
          phone ? VOIDWALKER_PHONE_ERA_BAND : undefined
        ) *
          travel,
      behavior: "auto",
    });
  };

  /* ⚠ THE FIGURE IS A NODE THE COMPOSITION SEATS, not a sibling of it. The
     datum stage puts it INSIDE its grid (column 2, spanning the content
     rows) rather than beside the panels, and `HoloFigure` carries the
     `portrait` handoff target — so it is built once here, where the era
     lives, and handed down. `epoch` is the lab's button and never moves here. */
  const figureColumn = (
    <div
      className="vwh__column"
      data-vwh-region="figure"
      /* ⚠ THE HEAD LINE IS DECLARED ON THE COLUMN, NOT READ OFF THE SLOT
         (ADR-082 U28). The phone sheet lifts this column so every era's head
         lands on one line, and a custom property never inherits UPWARD — the
         slot's own `--holo-fit` is invisible to its parent, so the first cut,
         a rule on the column reading `var(--holo-fit, 1)`, measured a no-op
         at every era while it looked right. Same registry, same functions,
         one source; `--holo-fit` rides along for a sheet that wants it. */
      style={
        {
          "--holo-fit": holoFigureFit(hologram),
          "--holo-head": holoFigureHeadShare(hologram),
        } as React.CSSProperties
      }
    >
      <HoloFigure
        hologram={hologram}
        neighbours={neighbours}
        epoch={0}
        form="emissive"
        blend="plus-lighter"
        alpha={0.92}
        scanPitch={3}
        glow={1}
        reduced={reduced}
        initialMaterialization="scroll"
      />

      {/* The SEAT: geometry only, painted nothing — see file header. */}
      <div className="vwh__base" data-vwh-region="platform" aria-hidden="true" />
    </div>
  );

  return (
    <div
      className="vwd"
      data-vwh-era={era.id}
      data-vwh-region="character-sheet"
      data-testid="voidwalker-character-sheet"
      /* ADR-123: the SEAT the drawer and the hash anchor land on — the
         instrument, never the station (which keeps its padding off the
         pinned rungs). */
      data-station-seat=""
      ref={rootRef}
    >
      <HoloDatumPanels
        selectedEraIndex={eraIdx}
        onSelectEra={pick}
        identityRefs={{ title: titleRef }}
        figure={figureColumn}
      />
    </div>
  );
}
