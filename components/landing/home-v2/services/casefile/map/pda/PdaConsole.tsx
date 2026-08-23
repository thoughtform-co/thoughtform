"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { SERVICES_SCROLL_OWNED_MEDIA } from "@/components/landing/home-v2/unifiedServicesInstrument";
import type { CaseMapDistrict, CaseMapShape, CaseMapWork, CaseSkillEntry } from "@/lib/cases/types";

import { ConsoleFrame } from "../../console/ConsoleFrame";
import { type ConsoleStation, ConsoleRail } from "../../console/ConsoleRail";

import {
  ViewCarrier,
  carrierChipMorphIn,
  carrierChipMorphOut,
  carrierChipRotation,
  carrierLayout,
  carrierPlate,
  carrierSkillDock,
  carrierSkillNameRect,
} from "./PdaCarrier";
import {
  ViewConfiguration,
  configExt,
  configLayout,
  configSkillNameRect,
} from "./PdaConfiguration";
import type { PdaEntry } from "./PdaEntry";
import { ViewWork, gridRect, workExt, workLayout } from "./PdaViews";
import { PDA_FLIGHT_GUARD_MS, pdaFlight } from "./pdaFlight";
import type { FlightRect } from "./pdaFlight";
import { type PdaView, crossing, footCopy, pdaTotals, selectWorks } from "./pdaRecord";
import { PDA_WHEEL_REST, type PdaWheelState, pdaWheelStep } from "./pdaWheel";

/**
 * THE WORK-TO-INTELLIGENCE MAP, as a held instrument.
 *
 * A faithful port of the owner's `thoughtform-intelligence-map-v18.html` into
 * the casefile's right panel: a reading rail across the top and a scan sweep
 * on every view change. (The centred foot the port carried is gone — owner,
 * 2026-08-08; the drawing owns that height now.)
 *
 * ⚠ THE CHROME IS NOT HERE ANY MORE (ADR-064). The orbit ring, the chamfered
 * bezel, the console and its scanline are `ConsoleFrame`, shared with the
 * three other evidence plates so the panel reads as ONE instrument that
 * changes what it displays. This file owns the map's own vocabulary and
 * hands the frame two slots: `rail` and a small-screen `fallback`.
 *
 * ── Three readings, direct access, any order ─────────────────────────────
 * The rail is the navigation, and since 2026-08-06 (owner) it runs
 * HORIZONTALLY across the top of the console instead of down its left edge.
 * It is still not a tab strip to look at: diamonds and a hairline spine, with
 * the lit segment travelling to the reading it opened — a marker pointing into
 * the field, not a selected tab. `1` `2` `3` select and `Escape` returns to
 * the work.
 *
 * ⚠ THE RAIL IS NOT THIS FILE'S ANY MORE, and it lost its ORDINALS. It is
 * `ConsoleRail`, shared with the three other evidence plates, because the
 * owner's "all the tabs should be styled the same" resolved in this rail's
 * favour — it was the most designed of the four. `01 WORK` is now `WORK`: the
 * spine carries order positionally, and the reading's full title survives as
 * the SVG's accessible name.
 *
 * ⚠ The move is paid for in HEIGHT, and the field binds on height (ADR-063):
 * the drawing is authored 780x850 PORTRAIT into a landscape box, so it
 * letterboxes ~200px of width at 1280x720 while every pixel of height scales
 * the type. The rail's ~27px costs the drawing ~7 % of its scale and buys it
 * nothing back, because the ~53px of width it returns was already surplus.
 * Do not spend more height here without re-measuring the rendered type.
 *
 * ── The wheel, while the pointer is on the console ───────────────────────
 * Scroll changes the READING here rather than the directory row underneath
 * (owner, 2026-08-06). The decision is `pdaWheel.ts` — pure and tested — and
 * the contract that makes it safe is the RELEASE: at the last reading in the
 * direction of travel the wheel is handed straight back to the page. This
 * beat is scroll-pinned, so an instrument that kept it would be a trap on the
 * whole document.
 *
 * ── Two clocks, and only one of them replays ─────────────────────────────
 * A VIEW CHANGE runs the entrance — the scan sweeps, cartridges pop in, wires
 * draw, tongues seat. A HOVER must not: re-running the arrival on every
 * pointer move is the difference between an instrument and a toy. `still`
 * carries that distinction into the views, which drop their animation classes
 * when it is set, and `viewTick` is what re-keys the sweep so it plays once
 * per change rather than once per render.
 *
 * ── One object survives the view change, and it FLIES ─────────────────────
 * The selected work is the persistent object on this surface: reading 01 draws
 * it as a cartridge in the grid, reading 02 draws it as the core, and the core
 * IS that cartridge at `CORE_K`. So a change between those two readings does
 * not replace it — it moves, from the home it had to the home it is getting,
 * while everything else re-rasters around it on the sweep. That is what makes
 * three readings read as ONE display switching rather than three pictures, and
 * it is why the readings can stay terminal display-switching (owner) instead
 * of becoming a zoom: the field never scales, one object travels across it.
 *
 * `entry` is which of the three gestures the selection takes on the transition
 * just committed — `flight` between 01 and 02, `bloom` arriving from a reading
 * that had no home for it, `raster` otherwise. It is STATE, not a ref, because
 * it has to survive hover repaints: an object mid-flight whose class was gated
 * on `still` would snap the moment the pointer entered it.
 *
 * ⚠ ONE RECT READ PER TRANSITION, at the click, before the state changes —
 * `pdaFlight` does the rest arithmetically. No rAF, no measurement after the
 * fact, and an interrupted flight falls back to the raster rather than reading
 * the painted pose (ADR-061's bound on this surface).
 *
 * ── Keys are bound on the PLATE, never `document` ────────────────────────
 * The corridor has its own key handling, and React's synthetic events reach
 * this node from whatever descendant has focus.
 *
 * ⚠ POINTER OPT-IN. `.fl-pda` is an `auto` island on a host that is
 * `pointer-events: none`, and it stays scoped here — lifting it to the host
 * puts a full-bleed catcher over the ring's hit areas at z 4
 * (`.claude/rules/proof.md`).
 */

interface Props {
  shapes: readonly CaseMapShape[];
  districts: readonly CaseMapDistrict[];
  works: readonly CaseMapWork[];
  /** Reading 03's atoms — one lettered plate per named Skill. */
  skills: readonly CaseSkillEntry[];
  /** Draw against the approved envelope — a STATUS, never an amount. */
  envelope: "WITHIN" | "AT" | "OVER";
}

export function PdaConsole({ shapes, districts, works, skills, envelope }: Props) {
  const shown = useMemo(() => selectWorks(districts, works, skills), [districts, works, skills]);
  const totals = useMemo(() => pdaTotals(shapes, districts, works), [shapes, districts, works]);
  const cross = useMemo(
    () => crossing(shapes, districts, works, shown),
    [shapes, districts, works, shown]
  );

  const [view, setView] = useState<PdaView>(1);
  const [selectedId, setSelectedId] = useState(shown[0]?.id ?? "");
  const [hover, setHover] = useState<string | null>(null);
  const [lit, setLit] = useState<string | null>(null);
  /** Bumped on every view change; re-keys the sweep so it plays once. */
  const [viewTick, setViewTick] = useState(0);
  /** True once the reader has moved the pointer inside the current view. */
  const [still, setStill] = useState(false);
  /** How the WORK CARD enters the reading just opened. */
  const [entry, setEntry] = useState<PdaEntry>({ kind: "raster" });
  /** How the SKILL CHIP enters — the second persistent object (ADR-071). */
  const [skillEntry, setSkillEntry] = useState<PdaEntry>({ kind: "raster" });
  /**
   * True once the configuration has been shown at all. Until then nothing
   * marks a selection: the rest state is `shown[0]`, and lighting a record the
   * reader has not asked for claims they left it open.
   */
  const [hasOpened, setHasOpened] = useState(false);

  const selected = shown.find((w) => w.id === selectedId) ?? shown[0];

  const svgRef = useRef<SVGSVGElement>(null);
  /** When the last flight began, so an interrupted one can decline to fly. */
  const flightAtRef = useRef(-Infinity);

  /**
   * ⚠ ALL THREE READINGS ARE ELASTIC, AND THIS IS THE ONE MEASUREMENT THAT
   * MAKES THEM SO (ADR-070 U12, generalised in U15).
   *
   * The console's field is capped at 850px wide but grows with the viewport's
   * height, so it is landscape on a laptop and portrait on a tall monitor.
   * `meet` fits by the smaller ratio, so a single crop letterboxes at one end
   * or the other — 270px of dead panel at 845 × 950 on reading 02, measured,
   * and 265px on reading 03 which nobody measured until the owner said so.
   * Each crop is derived from the field now, and each reading's own chain
   * absorbs the difference.
   *
   * ⚠ THE ASPECT IS THE STATE, not a per-reading `ext`. Three readings sharing
   * one number is what keeps them a single measurement; a reading that grew
   * its own observer would re-measure the same box three times and could
   * disagree with the flight about which board is live.
   *
   * ⚠ NO FEEDBACK LOOP, and that is structural rather than lucky: the SVG is
   * absolutely positioned to fill the plate, so its box is set by CSS and a
   * `viewBox` change cannot move it. The quantiser is belt and braces for
   * sub-pixel resize noise, not the thing that makes this safe — its step is
   * ~0.004, which is 3.7 units on a 932-wide crop.
   *
   * ⚠ A TRANSLATE IS INVISIBLE HERE and a uniform scale cancels — the proof
   * ladder moves this subtree as it arrives, and only the ASPECT is read.
   */
  const [aspect, setAspect] = useState(0);
  useEffect(() => {
    const el = svgRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const read = () => {
      const b = el.getBoundingClientRect();
      if (!(b.width >= 1) || !(b.height >= 1)) return;
      const next = b.height / b.width;
      setAspect((prev) => (Math.abs(next - prev) < 0.004 ? prev : next));
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /** Each reading at this field's shape, and the crop that exactly contains
   *  it. ⚠ ONE SOURCE for the attribute AND for the flight — they are the same
   *  object by construction, so the two cannot drift. */
  const layout1 = useMemo(() => workLayout(workExt(aspect)), [aspect]);
  const layout2 = useMemo(() => configLayout(configExt(aspect)), [aspect]);
  /** ⚠ READING 03 IS HEIGHT-FIXED AND GROWS ITS CROP'S WIDTH, alone among the
   *  three — see `PdaCarrier`. U25's SECTION drawing was elastic the other way
   *  and needed its own layout beside this one; it was retired with its flag
   *  (ADR-070 U34), so there is one reading-03 crop again. */
  const carrier3 = useMemo(() => carrierPlate(aspect), [aspect]);
  /** ⚠ THE CARRIER'S CELLS — the flight's destination for reading 03's skill
   *  chip needs to know which cell to land on. Cell layout is pure and does
   *  not depend on `aspect`, so it computes once per record change. */
  const carrierCells = useMemo(
    () => carrierLayout({ shapes: cross.shapes, skills }).cells,
    [cross.shapes, skills]
  );
  const viewBox = view === 1 ? layout1.crop : view === 2 ? layout2.crop : carrier3.crop;
  /* ⚠ THESE MIRRORS KEEP THE WHEEL LISTENER STABLE, and that is the whole
     reason they are refs. `go` sits in the native listener's dependency array;
     threading `view` or `selectedId` through it as values would tear the
     non-passive `wheel` listener down and re-add it on every reading change and
     every selection — on the one control whose contract is that it releases the
     page cleanly (ADR-063). `viewRef` predates this; `selRef` joins it for the
     flight, which needs to know which record is open without re-subscribing. */
  const viewRef = useRef(view);
  viewRef.current = view;
  const selRef = useRef(selectedId);
  selRef.current = selectedId;

  /**
   * THE FLAVOUR, decided once per transition.
   *
   * The selected work is the persistent object on this instrument and it
   * has THREE homes now (ADR-069 U2, 2026-08-17): reading 01's grid
   * cartridge, reading 02's core seat card, and reading 03's estate
   * footprint. A flight computes for any pair where both homes exist;
   * everything else is the reading's own entrance.
   *
   * ⚠ **READING 03's HOME DEPENDS ON WHICH DRAWING IS MOUNTED** (ADR-070 U33).
   * U24's divided plate had no home at all, so 01 → 03 was always raster and
   * 03 → 01 a bloom in place. Both current drawings have one, and they are
   * different objects: SECTION's is one of twenty ghost footprints, wearing the
   * cartridge's own lit-edge grammar; the CARRIER's is the card seated in its
   * hub, which is the shared `Cartridge` at `HUB_K`. Neither is interpolated —
   * each walks the arithmetic its own drawing paints.
   *
   * ⚠ The guards are all cheap and all necessary: an in-flight interrupt
   * would compute its start pose from a rect the object has not reached,
   * and a collapsed box is what the desktop gate leaves behind
   * (`display: none`), where the arithmetic would divide by zero.
   */
  /**
   * THE WORK CARD'S HOME PER READING (ADR-071).
   *
   * ⚠ **NO HOME ON THE CARRIER SINCE ADR-071.** U33 seated the work card in
   * the carrier's hub as a THIRD HOME; ADR-071 replaced it with the seated
   * cell (a highlight, not a card) — so `workRectFor(3, ...)` returns `null`
   * and 1↔3, 2↔3 fall back to bloom / raster. SECTION's flag path still uses
   * the estate footprint, which is byte-identical to before.
   */
  const workRectFor = useCallback(
    (view: PdaView, id: string): { crop: string; rect: FlightRect } | null => {
      if (view === 1) {
        const i = shown.findIndex((w) => w.id === id);
        if (i < 0) return null;
        return { crop: layout1.crop, rect: gridRect(i, layout1) };
      }
      if (view === 2) {
        return { crop: layout2.crop, rect: layout2.core };
      }
      /* ⚠ READING 03 HAS NO WORK HOME, AND THAT IS ADR-071's SPLIT. The work
         card is a 1↔2 object; the carrier's 2↔3 object is the SKILL chip
         (`skillRectFor`). U25's SECTION drawing did give the work a third home
         — one of twenty ghost footprints — and it was retired with its flag
         (ADR-070 U34), so this returns null for every id rather than for a
         flag. */
      return null;
    },
    [shown, layout1, layout2]
  );

  /**
   * THE SKILL CHIP'S HOME PER READING (ADR-071).
   *
   * ⚠ **THE SKILL IS THE 2↔3 OBJECT** — no home on reading 01 (the grid
   * shows work cards, not chips). The chip's home on reading 02 is the
   * config board's SKILL slot (`layout2.skillChip`), and on the carrier it
   * is the arc midpoint of the cell whose skill id matches the argument.
   */
  const skillRectFor = useCallback(
    (view: PdaView, skillId: string): { crop: string; rect: FlightRect } | null => {
      if (view === 2) return { crop: layout2.crop, rect: layout2.skillChip };
      if (view === 3) {
        const cell = carrierCells.find((c) => c.skill.id === skillId);
        if (!cell) return null;
        return { crop: carrier3.crop, rect: carrierSkillDock(cell) };
      }
      return null;
    },
    [layout2, carrier3, carrierCells]
  );

  /**
   * TWO ENTRIES, ONE RECT READ. The click's own rect is measured HERE — the
   * outgoing crop is still the one in the attribute — and both flights are
   * decided against it. Returning a pair rather than one lets the console
   * commit them in the same `enter(...)` call: two objects that fly during
   * the same view change but land on different homes.
   *
   * ⚠ **THE INTERRUPT GUARD IS SHARED.** Both flights use the same clock
   * (`flightAtRef`), so a re-clicked transition falls back to raster on
   * BOTH — a rearmed skill flight beside a rastered work card would show
   * one object gliding while the other snapped, which reads as a bug.
   *
   * ⚠ **THE ROTATION IS COMPUTED FROM THE DESTINATION**, and the sign
   * depends on the direction (see `PdaCarrier`'s `ChipArrival` for why):
   * on 2→3, `dr = -carrierChipRotation` compensates for the destination
   * wrapper's baked rotation so the source pose is unrotated; on 3→2, `dr =
   * +carrierChipRotation` replays the source's tangent orientation at the
   * unrotated config destination.
   */
  const entryFor = useCallback(
    (from: PdaView, to: PdaView, id: string, skillId: string | null) => {
      const still: PdaEntry = { kind: "raster" };
      const rest = { work: still, skill: still as PdaEntry };
      if (from === to) return rest;

      const now = performance.now();
      if (now - flightAtRef.current < PDA_FLIGHT_GUARD_MS) return rest;

      const el = svgRef.current;
      if (!el) return rest;

      const box = el.getBoundingClientRect();

      /* THE WORK CARD's ENTRY — flight between 1 and 2, bloom coming back
         off the carrier onto either home, raster otherwise. */
      const workSrc = workRectFor(from, id);
      const workDst = workRectFor(to, id);
      let work: PdaEntry;
      if (!workSrc || !workDst) {
        /* ⚠ 3→2 BLOOMS TOO (ADR-071 extension). The carrier no longer seats
           the work card, so 3→2 has no source rect — the work card must
           still show up at the seat. The old fallback covered 3→1 only. */
        work = from === 3 && (to === 1 || to === 2) ? { kind: "bloom" } : { kind: "raster" };
      } else {
        const vars = pdaFlight(box, workSrc.crop, workSrc.rect, workDst.crop, workDst.rect);
        work = vars ? { kind: "flight", ...vars } : { kind: "raster" };
      }

      /* THE SKILL CHIP's ENTRY — flight between 2 and 3 only. Every other
         pair leaves it rastered: reading 01 has no chip home, and a chip
         flight to/from an absent home would be a gesture landing nowhere.

         ⚠ **TWO INSTRUMENTS PER FLIGHT SINCE ADR-071 U1.** The PLATE's
         journey is a SHAPE MORPH — `carrierChipMorphIn/Out` emit a path pair
         (rect ⇄ the cell's own ring, same command structure) that CSS `d`
         interpolates, so the plate genuinely becomes the cell instead of a
         frame floating onto it. The NAME flies its own `pdaFlight`, computed
         on the name's OWN rects (left-anchored in the chip, centre-anchored
         on the arc — the plate's centre-to-centre vars would make it jump
         sideways at liftoff). The plate vars are consumed by the morph
         projection and never leave this closure. */
      let skill: PdaEntry = still;
      if (skillId && (from === 2 || from === 3) && (to === 2 || to === 3)) {
        const cell = carrierCells.find((c) => c.skill.id === skillId);
        const skillSrc = skillRectFor(from, skillId);
        const skillDst = skillRectFor(to, skillId);
        if (cell && skillSrc && skillDst) {
          const plate = pdaFlight(box, skillSrc.crop, skillSrc.rect, skillDst.crop, skillDst.rect);
          const name = cell.skill.short.toUpperCase();
          const nameSrc =
            from === 2 ? configSkillNameRect(layout2, name) : carrierSkillNameRect(cell, name);
          const nameDst =
            to === 2 ? configSkillNameRect(layout2, name) : carrierSkillNameRect(cell, name);
          const nameVars = pdaFlight(box, skillSrc.crop, nameSrc, skillDst.crop, nameDst);
          if (plate && nameVars) {
            const rotation = carrierChipRotation(cell);
            /* 2→3: the name's destination render is tangent-rotated (baked
               wrapper), `dr` cancels it at liftoff. 3→2: the destination is
               unrotated, `dr` replays the tangent it left with. */
            const dr = to === 3 ? -rotation : rotation;
            const morph =
              to === 3
                ? carrierChipMorphIn(cell, plate)
                : carrierChipMorphOut(cell, plate, layout2.skillChip);
            skill = { kind: "flight", ...nameVars, dr, morph };
          }
        }
      }

      /* ⚠ ONLY BUMP THE GUARD IF A REAL FLIGHT IS BEING RETURNED. Falling
         back to raster without arming the guard means the next click can
         start a flight immediately, which is the honest recovery from a
         missing rect. */
      if (work.kind === "flight" || skill.kind === "flight") flightAtRef.current = now;

      return { work, skill };
    },
    [workRectFor, skillRectFor, carrierCells, layout2]
  );

  const enter = useCallback((next: PdaView, gestures: { work: PdaEntry; skill: PdaEntry }) => {
    setView(next);
    setEntry(gestures.work);
    setSkillEntry(gestures.skill);
    if (next === 2) setHasOpened(true);
    setHover(null);
    setLit(null);
    setStill(false);
    setViewTick((t) => t + 1);
  }, []);

  /**
   * ⚠ THE SKILL ID FOR THE CURRENT SELECTION, read via ref so the callbacks
   * below can capture it without threading `selected` through the wheel's
   * dependency array (see the ref block above for the same reason). Rebuilt
   * per render so a `selectedId` change is picked up on the next transition.
   */
  const selectedSkillIdRef = useRef<string | null>(null);
  selectedSkillIdRef.current = shown.find((w) => w.id === selectedId)?.skillId ?? null;

  const go = useCallback(
    (next: PdaView) => {
      enter(next, entryFor(viewRef.current, next, selRef.current, selectedSkillIdRef.current));
    },
    [enter, entryFor]
  );

  const open = useCallback(
    (id: string) => {
      /* The rect read happens HERE, before anything changes — the outgoing
         reading is still on screen and its crop is still the one in the
         attribute. The clicked stream's skill id is what the chip's flight
         needs, so it is read alongside. */
      const nextSkillId = shown.find((w) => w.id === id)?.skillId ?? null;
      const gesture = entryFor(viewRef.current, 2, id, nextSkillId);
      setSelectedId(id);
      enter(2, gesture);
    },
    [enter, entryFor, shown]
  );

  /* A hover repaints WITHOUT replaying the entrance. */
  const hoverWork = useCallback((id: string | null) => {
    setStill(true);
    setHover(id);
  }, []);
  const hoverPart = useCallback((k: string | null) => {
    setStill(true);
    setLit(k);
  }, []);

  /* ── The wheel ─────────────────────────────────────────────────────────
     A NATIVE, NON-PASSIVE listener on the plate. React registers `wheel` as
     passive on its root container, so an `onWheel` prop cannot
     `preventDefault` — the page would scroll anyway and the reading would
     change on top of it.

     Two gates, both re-read per event because both can change under a
     long-lived listener: the tier in which scroll owns this beat at all (a
     resize to mobile makes the casefile static flow content, where swallowing
     a wheel event would break ordinary page scrolling), and `data-proof-settled`
     on the stage — while the arrival ladder is still travelling the reader is
     scrolling INTO the beat, and an instrument that grabbed the wheel there
     would stop them at its threshold. */
  const rootRef = useRef<HTMLDivElement>(null);
  const wheelRef = useRef<PdaWheelState>(PDA_WHEEL_REST);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (!window.matchMedia(SERVICES_SCROLL_OWNED_MEDIA).matches) return;
      if (!el.closest("[data-proof-settled]")) return;

      const r = pdaWheelStep(wheelRef.current, {
        deltaY: e.deltaY,
        deltaMode: e.deltaMode,
        at: e.timeStamp,
        view: viewRef.current,
        pageHeight: window.innerHeight,
      });
      wheelRef.current = r.state;
      if (r.capture) e.preventDefault();
      if (r.next) go(r.next);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [go]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const next = e.key === "1" ? 1 : e.key === "2" ? 2 : e.key === "3" ? 3 : null;
    if (next) {
      e.preventDefault();
      go(next as PdaView);
      return;
    }
    if (e.key === "Escape" && view !== 1) {
      e.preventDefault();
      go(1);
    }
  };

  const foot = footCopy(view, totals, shown.length);

  /* ⚠ NO ORDINALS (owner, 2026-08-06). `01 WORK` became `WORK` when every
     other ordinal on the surface went — the rail's travelling spine already
     says which of three this is, positionally, which is the only reason the
     numeral was affordable to lose. The reading's full title survives as the
     SVG's accessible name. */
  const STATIONS: readonly ConsoleStation[] = [
    { id: "work", name: "WORK" },
    { id: "configuration", name: "CONFIGURATION" },
    { id: "substrate", name: "SUBSTRATE" },
  ];

  return (
    <ConsoleFrame
      className="fl-plate fl-plate--pda fl-pda"
      data-view={view}
      data-envelope={envelope.toLowerCase()}
      onKeyDown={onKeyDown}
      rootRef={rootRef}
      /* ⚠ NO HEAD. The badge said "Intelligence map" beside a left column
         already headed INTELLIGENCE MAP, and the meta said "Loop Earplugs"
         beside a tab, a directory path and a masthead that all say it
         (owner, 2026-08-06). The rail takes the console's top edge and the
         drawing takes the height back — which is the ONLY reason the type
         below could grow at all. Do not reinstate a title bar here without
         re-measuring the drawing's rendered type. */
      rail={
        /* SHARED WITH EVERY OTHER PLATE now (2026-08-06). This rail's own
           grammar became the house grammar rather than the map keeping a
           private one — see `console/ConsoleRail.tsx`. */
        <ConsoleRail
          stations={STATIONS}
          activeIdx={view - 1}
          onActive={(i) => go((i + 1) as PdaView)}
          label="Map readings"
        />
      }
      /* ⚠ NO FOOT (owner, 2026-08-08 — "remove the text at the bottom of
         the right panel"). The 08-06 pass had already reduced it to the
         sentence alone; this pass removes the sentence too, and the drawing
         takes the height. `footCopy` still runs: `foot.title` is the SVG's
         accessible name and `foot.body` survives on the small-screen
         fallback list, where there is no drawing to say it. */
      /* Below the desktop gate the drawing is dropped for a DELIBERATE
         fallback — the reading that never needed the projection. */
      fallback={
        <div className="fl-pda__list">
          <div className="fl-pda__list-head">
            <span>Index · streams by team</span>
            <span>{`${shown.length} / ${totals.modules}`}</span>
          </div>
          {districts.map((d) => {
            const rows = shown.filter((w) => w.team === d.id);
            if (!rows.length) return null;
            return (
              <section className="fl-pda__list-group" key={d.id}>
                <h4>{d.name}</h4>
                {rows.map((w) => (
                  <div
                    className="fl-pda__list-row"
                    key={w.id}
                    data-person={w.configured ? undefined : ""}
                  >
                    <i aria-hidden="true">{w.configured ? "◆" : "○"}</i>
                    <span>{w.title}</span>
                    <em>{w.lane}</em>
                  </div>
                ))}
              </section>
            );
          })}
          <p className="fl-pda__list-foot">{foot.body}</p>
        </div>
      }
    >
      {/* The sweep. Keyed on the view tick so it plays once per change and
          never on a hover repaint. */}
      <i className="fl-pda__scan" key={viewTick} aria-hidden="true" />
      {/* ⚠ ONE SVG FOR ALL THREE READINGS, and the flight depends on it: the
          box is the same before and after the crop swaps, so a single rect read
          serves both sides of the mapping.
          ⚠ `xMidYMin`, NOT `xMidYMid` (ADR-070 U3, owner: "why do we have so
          much space above WHO OWNS IT"). The console's field outgrows the
          crop's aspect at tall viewports and `YMid` split the slack into a
          floating void band ABOVE the drawing; `YMin` docks the drawing to
          the rail and the slack collects below as ground clearance. At the
          binding 1280×720 field the two are identical (no vertical slack).
          ⚠ `fitCrop` in pdaFlight.ts HARDCODES this anchor — the attribute
          and the arithmetic move together or the flight lands wrong by half
          the letterbox. */}
      <svg
        ref={svgRef}
        className="fl-pda__svg"
        viewBox={viewBox}
        preserveAspectRatio="xMidYMin meet"
        role="group"
        /* The reading's title is no longer PRINTED (the rail names it),
                 so it lands here instead — a screen reader still hears which
                 of the three drawings it is in. */
        aria-label={`Work-to-intelligence map — ${foot.title}`}
      >
        {view === 1 ? (
          <ViewWork
            works={shown}
            hover={hover}
            onHover={hoverWork}
            onOpen={open}
            still={still}
            selId={selectedId}
            showSel={hasOpened}
            entry={entry}
            layout={layout1}
          />
        ) : null}
        {view === 2 && selected ? (
          <ViewConfiguration
            work={selected}
            layout={layout2}
            /* The five shapes, with their derived Skill counts — the same
               projection reading 03 crosses. The drawing draws a bar for the
               ones THIS stream taps and leaves the estate to 03. */
            shapes={cross.shapes}
            lit={lit}
            onLit={hoverPart}
            still={still}
            entry={entry}
            skillEntry={skillEntry}
            /* ⚠ THE ROSTER ENTRY, resolved here (ADR-071). The projection
               splits its knowledge — `PdaWork.skillId` is the id, the roster
               is the record — so the join happens at the mount point rather
               than inside every drawing that needs the name and engine. */
            skill={
              selected.skillId ? (skills.find((s) => s.id === selected.skillId) ?? null) : null
            }
          />
        ) : null}
        {view === 3 ? (
          <ViewCarrier
            shapes={cross.shapes}
            skills={skills}
            /* ⚠ `hasOpened`, NOT just `selected`. The rest state is `shown[0]`,
               and lighting a cell for a record the reader never asked for
               claims they left it open. */
            selected={hasOpened ? (selected ?? null) : null}
            still={still}
            entry={entry}
            skillEntry={skillEntry}
            onLit={hoverPart}
          />
        ) : null}
      </svg>
    </ConsoleFrame>
  );
}
