/**
 * useTurnScroll — the ONE writer for the turn AND the proposal (ADR-095,
 * extended in U5, the scene since ADR-102).
 *
 * Reads `#turn`'s rect once per scroll frame and drives the whole beat from
 * it, all pure functions of that rect (`turnClock.ts`):
 *   - `brandmarkMorphRef.progress` — the particle morph the corridor's
 *     parked mark and the armillary read per frame;
 *   - `brandmarkMorphRef.veil` — the mark put away once the copy owns the
 *     centre, and taken further as the proposal arrives;
 *   - the ground's wash, through a fragment shader (`turnWash.ts`) or, where
 *     WebGL is refused, a CSS gradient on the same canvas;
 *   - `--tm-*` on each `[data-tm]` product — its pose on the arc into rest,
 *     and back out of frame as the beat ends;
 *   - the copy's decode (`./turnDecode`), written straight into each
 *     `[data-tl-decode]` node, plus `--tl-cta-o` on the block;
 *   - `--tl-turn` / `data-tl-turn` on `#turn` — the smoke's observable.
 *
 * …and then, off `#proposition`'s OWN rect:
 *   - `data-tl-prop` — its ARRIVAL (ADR-099), published for the capture and
 *     the smoke to converge on. It does not drive the record's LAYOUT: that
 *     is an arc beat, and this writer touches its ground and its veil and
 *     nothing inside it until the scene opens.
 *   - `data-tl-prop-arrive` — `await` / `in` / `out` (ADR-101 §A), the
 *     hysteresis stamp the configuration's STRIKE hangs on. The one thing
 *     here that is not a pure function of scroll, and the reason it is a
 *     stamp rather than a channel: a burst has a direction and a memory,
 *     which a progress value does not.
 *   - THE SCENE (ADR-102) — `--tl-scene` / `data-tl-scene`, the station's
 *     pinned clock in viewport units, and everything it drives inside the
 *     sticky stage: the board's head and the ledger closing, the four nodes
 *     folding into the chip with their ribbons, the chip's hand-over to the
 *     carrier, the plates' bands and their unrolls, the title and the
 *     paragraph opening. Every one of them a pure function of `sv`.
 *
 * ⚠ ONE WRITER, THREE STATIONS, AND THAT IS DELIBERATE. This effect already
 * held `#proposition`, its canvas and its rect for the shared ground; a
 * second hook would mean two rAFs racing over one mark's veil, which has
 * exactly one owner by contract.
 *
 * ⚠ THE SCENE'S LAYOUT IS KEYED ON A STAMP THIS WRITER PUBLISHES, AND IT
 * FAILS OPEN. `data-tl-scene` on `#proposition` is what makes the station
 * tall, the slot sticky and the phases beat absolute; it is written only once
 * the board, its four nodes, the three plates and their heads have all
 * resolved AND the slot has been verified to compute `sticky`. Absent — a
 * phone, a short window, reduced motion, a root that never mounted — the
 * page is two flowing beats with the arcs' own seam between them, which is
 * the inert page and reads whole. A layout that needed the writer to be
 * running would be a page that can go wrong with nothing to say so.
 *
 * Passive listeners, one rAF, delta-gated (the `useStackedCardsScroll`
 * pattern). It parks — progress 0, veil 0, every var cleared, every stamp
 * removed, every line restored to its true text — whenever the capable rung
 * does not match or the stage does not compute `sticky`, so the reduced-motion
 * and phone paths get the composition standing still and readable.
 *
 * THREE-FREE. The morph target's builder is reached through `load()` in the
 * spec below — a dynamic edge, so the route page's static graph stays clear
 * of `three` (landing-import-doctrine); the wash is raw WebGL and imports
 * nothing.
 */

import { useEffect } from "react";
import { brandmarkMorphRef, type BrandmarkMorphSpec } from "@/lib/brandmark/morphTargetRef";
import {
  arriveNext,
  chipAway,
  ctaInOf,
  ctaInkOf,
  ctaOutOf,
  feather,
  foldPose,
  introOpen,
  markVeil,
  morphOf,
  plateState,
  productPose,
  propArrival,
  propClose,
  sceneProgress,
  scenePast,
  titleOpen,
  turnProgress,
  unrollY,
  wireRetract,
  PROP_ARRIVE_IN,
  PROP_ARRIVE_OUT,
  SCENE_FOLD_ORDER,
  washOf,
  type Arrive,
  type Centre,
  type PlateState,
  type ProductRest,
} from "./turnClock";
import { measureSeam, mountSeamLayer, parkSeam, writeSeam, type SeamMeasure } from "./seamCarrier";
import { turnDecodeFrame } from "./turnDecode";
import { createTurnWash, type TurnWash } from "./turnWash";

/** The inverse of the stack's inert rung — where the beat is live. */
export const TURN_CAPABLE_QUERY =
  "(min-width: 961px) and (min-height: 681px) and (prefers-reduced-motion: no-preference)";

/** Trinny London's coral (the Naked Ambition tube — the route's
 *  `--tl-brand-rgb`), and a lighter rim for the wireframe's limb. The WebGL
 *  golds are exempt from CSS by design, so these are literals here, beside
 *  the route token they mirror. */
export const TURN_MORPH_COLOR = "#F06850";
export const TURN_MORPH_ACCENT = "#F5907E";
export const TURN_MORPH_LIFT = 0.12;

export function trinnyMorphSpec(): BrandmarkMorphSpec {
  return {
    id: "trinny-london",
    load: () => import("../mark/buildTrinnyTarget"),
    color: TURN_MORPH_COLOR,
    accent: TURN_MORPH_ACCENT,
    lift: TURN_MORPH_LIFT,
  };
}

const PRODUCT_VARS = ["--tm-dx", "--tm-dy", "--tm-dr", "--tm-s", "--tm-o"] as const;
/** The scene's channels on the STAGE, which every clipped object inside reads. */
const SCENE_STAGE_VARS = ["--tl-ap-prop", "--tl-ap-title", "--tl-ap-intro"] as const;
const FOLD_VARS = ["--tl-fx", "--tl-fy", "--tl-fs", "--tl-fo"] as const;

/** Everything about the scene that changes only on a relayout. */
interface SceneMeasure {
  /** The configured board's svg — the fold's coordinate space. */
  svg: SVGSVGElement;
  /** The chip's centre, in the board's own user units. */
  chip: Centre;
  /** The four nodes in `SCENE_FOLD_ORDER`, each with its centre. */
  nodes: { el: SVGGElement; c: Centre }[];
  /** Their ribbons, in the same order. */
  lanes: SVGGElement[];
  /** The three plates, their bands, and the two heights the unroll runs between. */
  plates: { el: HTMLElement; headH: number; plateH: number }[];
  /** The station's pinned scroll, in viewports — read off its own box. */
  runwayVh: number;
}

export function useTurnScroll(): void {
  useEffect(() => {
    const turn = document.querySelector<HTMLElement>(".tl-root #turn");
    const stage = turn?.querySelector<HTMLElement>("[data-tl-turn-stage]");
    const root = document.querySelector<HTMLElement>(".tl-root");
    if (!turn || !stage || !root) return;
    const products = Array.from(turn.querySelectorAll<HTMLElement>("[data-tm]"));
    // The LIVE layers only. Each sits absolutely over an in-flow ghost that
    // holds the true box and the accessible text, so a wider glyph run can
    // never move the block (the house decode's own markup contract).
    const lines = Array.from(turn.querySelectorAll<HTMLElement>("[data-tl-decode]"));
    const canvas = turn.querySelector<HTMLCanvasElement>("[data-tl-turn-wash]");
    // The proposal carries the SAME ground (ADR-095 U4) — same shader, same
    // token, one viewport-locked field — so the coral does not resolve out
    // from under the reader at the seam.
    const prop = document.querySelector<HTMLElement>(".tl-root #proposition");
    const propCanvas = prop?.querySelector<HTMLCanvasElement>("[data-tl-prop-wash]") ?? null;
    const propGround = prop?.querySelector<HTMLElement>(".tl-prop__ground") ?? null;
    /* The scene's STAGE (ADR-102): the configuration's slot, which the route
       sheet pins once this writer stamps the station. The board and the
       phases mount INSIDE it, lazily, on approach.
       ⚠ THE STATION IS STATIC MARKUP; ITS BEATS ARE NOT. `#phases`, the
       board and every node the scene moves do not exist when this effect
       runs, and a query taken here returns null FOREVER — which reads as a
       scene that never opens, with nothing throwing. They are resolved in
       `measure()`, which the observers below re-run on the mount frame. */
    const sceneStage = prop?.querySelector<HTMLElement>("[data-tl-config-root]") ?? null;
    const mq = window.matchMedia(TURN_CAPABLE_QUERY);

    // The true strings, read from the server-rendered text once. They are
    // never re-read: from here the decode owns `textContent`.
    const truth = lines.map((el) => el.textContent ?? "");

    let wash: TurnWash | null = null;
    if (canvas) {
      wash = createTurnWash(canvas, root);
      // No WebGL (or the context was refused): the same element takes a CSS
      // gradient instead. A ground with banding beats no ground at all.
      if (!wash) stage.dataset.tlWash = "css";
    }
    let propWash: TurnWash | null = null;
    if (propCanvas && prop) {
      propWash = createTurnWash(propCanvas, root);
      if (!propWash) prop.dataset.tlWash = "css";
    }

    let raf = 0;
    let live = false;
    let stageW = 0;
    let stageH = 0;
    let rests: ProductRest[] = [];
    let lastP = -1;
    let lastQ = -1;
    let lastSv = -1;
    let lastPropA = -1;
    let lastHandoff = -1;
    /* The scene, and the carrier layer inside its stage. Null until the
       configuration's root has mounted and the station has taken its pin,
       which makes the whole scene a no-op rather than a set of channels
       written onto an empty stage.
       ⚠ THE LAYER IS MOUNTED FROM `measure()`, NEVER HERE. The stage is a
       React root's container, and a root's first `render` CLEARS the
       container before committing its tree — a layer appended at effect
       time is gone by the time the beats exist, with nothing thrown and the
       readout saying "no layer". Mounted once the beats have resolved, it is
       a non-React child React leaves alone. */
    let seamLayer: HTMLElement | null = null;
    let scene: SceneMeasure | null = null;
    let seam: SeamMeasure | null = null;
    let lastChip = -1;
    let lastPast = -1;
    let lastPlate: PlateState[] = [];
    /* ⚠ THE STRIKE IS THE ONLY STATE THIS WRITER KEEPS, and it is state
       because a burst has a DIRECTION. Everything else here is a pure
       function of a rect and survives being recomputed from nothing. */
    let propArrive: Arrive | null = null;

    /** Write a stamp only when it changes — an attribute write restarts every
     *  animation under it, so an un-gated one would re-strike every frame. */
    const stamp = (host: HTMLElement | null, name: string, was: Arrive | null, now: Arrive) => {
      if (host && was !== now) host.setAttribute(name, now);
      return now;
    };

    /** Put the scene away: every stamp and every channel it wrote, gone.
     *  ⚠ ABSENT MEANS SHOWN, on every one of them — this is the path the
     *  phone, the short window and reduced motion take. */
    const parkScene = () => {
      if (prop) {
        prop.removeAttribute("data-tl-scene");
        prop.removeAttribute("data-tl-scene-past");
        prop.removeAttribute("data-tl-chip");
        prop.style.removeProperty("--tl-scene");
      }
      if (sceneStage) for (const v of SCENE_STAGE_VARS) sceneStage.style.removeProperty(v);
      if (scene) {
        for (const n of scene.nodes) for (const v of FOLD_VARS) n.el.style.removeProperty(v);
        for (const l of scene.lanes) l.style.removeProperty("--tl-wire");
        for (const pl of scene.plates) {
          pl.el.removeAttribute("data-tl-plate");
          pl.el.style.removeProperty("--tl-unroll-y");
        }
      }
      parkSeam(seamLayer);
      lastChip = -1;
      lastPast = -1;
      lastPlate = [];
      lastSv = -1;
    };

    const park = () => {
      brandmarkMorphRef.current.progress = 0;
      brandmarkMorphRef.current.veil = 0;
      turn.style.removeProperty("--tl-turn");
      turn.removeAttribute("data-tl-turn");
      stage.style.removeProperty("--tl-wash");
      stage.style.removeProperty("--tl-cta-o");
      for (const el of products) for (const v of PRODUCT_VARS) el.style.removeProperty(v);
      lines.forEach((el, i) => {
        el.textContent = truth[i];
      });
      /* ⚠ THE PARKED PROPOSAL IS FULLY LIT, and since ADR-099 it is lit by
         construction rather than by a fail-open default. Its record is an arc
         beat with the arcs' own reveal opt-in, so on the phone and under
         reduced motion it simply stands; there is no `--tp-in` channel left
         to write, and therefore no path on which parking could hide it. */
      turn.removeAttribute("data-tl-handoff");
      // ⚠ BOTH fail open: parked, the proposal keeps its ground.
      prop?.removeAttribute("data-tl-ground");
      lastHandoff = -1;
      prop?.removeAttribute("data-tl-prop");
      /* ⚠ AND THE STRIKE FAILS OPEN. Parked is the phone, the short window
         and reduced motion, where the arcs' own reveal stands the record up on
         its own; an ABSENT stamp means SHOWN, exactly as the ground's does one
         rule over. Leaving `await` behind here would blank a whole beat on the
         paths that cannot un-blank it. */
      prop?.removeAttribute("data-tl-prop-arrive");
      propArrive = null;
      parkScene();
      wash?.draw(0);
      propWash?.draw(0);
      prop?.style.removeProperty("--tl-wash");
      lastP = -1;
      lastQ = -1;
      lastPropA = -1;
    };

    /**
     * Resolve everything the scene moves, and stamp the station once — and
     * only once — all of it is there.
     *
     * ⚠ STAMP FIRST, THEN VERIFY THE PIN. The sticky rule is keyed on the
     * stamp, so the slot cannot compute `sticky` before it is written; and a
     * stamped station whose slot did NOT take the pin (an ancestor grew an
     * `overflow`, say) would be a four-viewport station with a scene that
     * scrolls straight through it, so the stamp comes back off.
     */
    const measureScene = (): SceneMeasure | null => {
      if (!prop || !sceneStage || !live) {
        parkScene();
        return null;
      }
      const svg = prop.querySelector<SVGSVGElement>(
        '[data-board-state="configured"] .arc-board__svg'
      );
      const card = svg?.querySelector<SVGGraphicsElement>(
        '[data-board-module="card"] .arc-board__plate'
      );
      const nodes = SCENE_FOLD_ORDER.map(
        (role) => svg?.querySelector<SVGGElement>(`[data-board-role="${role}"]`) ?? null
      );
      const lanes = SCENE_FOLD_ORDER.map(
        (role) => svg?.querySelector<SVGGElement>(`[data-board-lane="${role}"]`) ?? null
      );
      const phases = prop.querySelector<HTMLElement>("#phases");
      const plates = phases ? [...phases.querySelectorAll<HTMLElement>(".arc-plate")] : [];
      const heads = plates.map((p) => p.querySelector<HTMLElement>(".arc-plate__head"));
      if (
        !svg ||
        !card ||
        nodes.some((n) => !n) ||
        lanes.some((l) => !l) ||
        plates.length !== 3 ||
        heads.some((h) => !h)
      ) {
        parkScene();
        return null;
      }
      if (!prop.hasAttribute("data-tl-scene")) prop.setAttribute("data-tl-scene", "");
      if (getComputedStyle(sceneStage).position !== "sticky") {
        parkScene();
        return null;
      }
      const vh = window.innerHeight;
      /* ⚠ `getBBox` IS BLIND TO AN ELEMENT'S OWN TRANSFORM, which is what
         makes this safe to re-run mid-scene: a folded node reports the box
         it has at rest, so its centre — and every displacement solved from
         it — is the same number at every `sv`. */
      const cb = card.getBBox();
      const chip: Centre = { cx: cb.x + cb.width / 2, cy: cb.y + cb.height / 2 };
      const centreOf = (g: SVGGraphicsElement): Centre => {
        const b = g.getBBox();
        return { cx: b.x + b.width / 2, cy: b.y + b.height / 2 };
      };
      return {
        svg,
        chip,
        nodes: nodes.map((el) => ({ el: el!, c: centreOf(el!) })),
        lanes: lanes.map((l) => l!),
        plates: plates.map((el, i) => ({
          el,
          headH: heads[i]!.offsetHeight,
          plateH: el.offsetHeight,
        })),
        runwayVh: Math.max(0, (prop.getBoundingClientRect().height - vh) / Math.max(1, vh)),
      };
    };

    /**
     * One frame of the scene, at clock `sv`. Called from `frame()` and — once,
     * synchronously — from `measure()` the moment the stamp lands, so the
     * stage never paints a frame with the phases standing lit over the board
     * (every channel's ABSENT value is "shown").
     */
    const writeScene = (sv: number, svgRect: DOMRect, stageRect: DOMRect) => {
      if (!scene || !prop || !sceneStage) return;
      prop.style.setProperty("--tl-scene", sv.toFixed(3));
      prop.setAttribute("data-tl-scene", sv.toFixed(2));
      /* ⚠ THE ARRIVAL STRIKE MAY NOT REPLAY OVER A FOLDED BOARD. A deep
         reload mid-scene seeds `in` (`arriveNext`'s own rule) and would run
         the settle ladder's opacity over nodes this clock has already put
         away; the sheet scopes every strike rule away from this stamp.
         ⚠ A LATCH, NOT A CHANNEL. Set once the withdraw has opened and
         cleared only when the record strikes OUT (see `frame`): cleared on
         the way back down the scene it re-matches every `:not()`-scoped
         `animation:` rule, and a rule that starts matching again RESTARTS its
         animation — the whole strike, ladders and all, replaying over a
         board the reader is scrolling back through (measured: eleven
         animations running at the pin on the way back up). */
      if (scenePast(sv) && lastPast !== 1) {
        lastPast = 1;
        prop.setAttribute("data-tl-scene-past", "");
      }
      sceneStage.style.setProperty("--tl-ap-prop", propClose(sv).toFixed(4));
      sceneStage.style.setProperty("--tl-ap-title", titleOpen(sv).toFixed(4));
      sceneStage.style.setProperty("--tl-ap-intro", introOpen(sv).toFixed(4));
      scene.nodes.forEach((n, k) => {
        const pose = foldPose(k, sv, n.c, scene!.chip);
        n.el.style.setProperty("--tl-fx", `${pose.fx.toFixed(2)}px`);
        n.el.style.setProperty("--tl-fy", `${pose.fy.toFixed(2)}px`);
        n.el.style.setProperty("--tl-fs", pose.scale.toFixed(4));
        n.el.style.setProperty("--tl-fo", pose.opacity.toFixed(4));
      });
      scene.lanes.forEach((l, k) => {
        l.style.setProperty("--tl-wire", wireRetract(k, sv).toFixed(4));
      });
      /* The chip's group is put away by a STAMP rather than by the layer's
         presence, so it fails open: a parked writer leaves a whole chip on
         the board. Delta-gated, because an attribute write is a style
         invalidation on everything under it. */
      const away = chipAway(sv) ? 1 : 0;
      if (lastChip !== away) {
        lastChip = away;
        if (away) prop.setAttribute("data-tl-chip", "away");
        else prop.removeAttribute("data-tl-chip");
      }
      scene.plates.forEach((pl, i) => {
        const st = plateState(i, sv);
        if (lastPlate[i] !== st) {
          lastPlate[i] = st;
          if (st) pl.el.setAttribute("data-tl-plate", st);
          else pl.el.removeAttribute("data-tl-plate");
        }
        if (st === "unroll") {
          pl.el.style.setProperty(
            "--tl-unroll-y",
            `${unrollY(i, sv, pl.headH, pl.plateH).toFixed(2)}px`
          );
        } else {
          pl.el.style.removeProperty("--tl-unroll-y");
        }
      });
      if (seam && seamLayer) writeSeam(seamLayer, seam, sv, svgRect, stageRect);
    };

    const measure = () => {
      live = mq.matches && getComputedStyle(stage).position === "sticky";
      stageW = stage.clientWidth;
      stageH = stage.clientHeight;
      // Layout values, transform-free: placement rides the `translate`
      // property, which `offsetLeft/Top` never see.
      rests = products.map((el) => ({
        cx: el.offsetLeft + el.offsetWidth / 2,
        cy: el.offsetTop + el.offsetHeight / 2,
      }));
      wash?.resize();
      propWash?.resize();
      scene = measureScene();
      if (scene && sceneStage && !seamLayer) seamLayer = mountSeamLayer(sceneStage);
      seam =
        scene && seamLayer && root && sceneStage ? measureSeam(seamLayer, root, sceneStage) : null;
      if (scene && prop && sceneStage) {
        lastPlate = [];
        lastChip = -1;
        lastPast = -1;
        writeScene(
          sceneProgress(prop.getBoundingClientRect().top, window.innerHeight, scene.runwayVh),
          scene.svg.getBoundingClientRect(),
          sceneStage.getBoundingClientRect()
        );
      }
    };

    const frame = () => {
      raf = 0;
      if (!live) {
        park();
        return;
      }
      /* ⚠ EVERY RECT THIS FRAME NEEDS, READ BEFORE THE FIRST STYLE WRITE.
         Seven boxes across two stations; interleaving a `--tl-wash` write
         between two of them buys a forced synchronous layout per frame for
         nothing. */
      const vh = window.innerHeight;
      const rect = turn.getBoundingClientRect();
      const propRect = prop ? prop.getBoundingClientRect() : null;
      const canvasRect = canvas ? canvas.getBoundingClientRect() : null;
      const propCanvasRect = propCanvas ? propCanvas.getBoundingClientRect() : null;
      const groundRect = propGround ? propGround.getBoundingClientRect() : null;
      const stageRect = scene && sceneStage ? sceneStage.getBoundingClientRect() : null;
      const svgRect = scene ? scene.svg.getBoundingClientRect() : null;
      const p = turnProgress(rect.top, rect.height, vh);

      /* ⚠ BOTH GROUNDS ARE PAINTED BEFORE THE PROGRESS GATE BELOW, and each
         off its OWN canvas's rect.

         The field is viewport-locked, so a canvas that MOVES has to be
         repainted even when its amount has not changed — and `p` saturates at
         1 the moment `#turn` leaves, which is exactly when its stage releases
         and its canvas starts travelling. Gated with everything else, the
         turn's ground froze at the origin it held when `p` reached 1 and then
         scrolled away carrying that stale image, out of register with the
         proposal's by the height of the travel: a hard line across the seam,
         measured. The proposal's has the same problem from the other side —
         it has a viewport and a half to cross after `p` is spent.

         ⚠ And it is the CANVAS's rect, never its station's: the grounds are
         absolutely positioned and their stations carry padding of their own,
         so the two boxes differ. Each wash keeps its own delta gate, so this
         costs a rect read and nothing else. */
      if (canvasRect) {
        wash?.draw(washOf(p), canvasRect.top, canvasRect.left);
      }
      if (propWash && prop && propCanvasRect) {
        /* ⚠ THE FEATHER IS SOLVED FROM THE GROUND'S RECT EVERY FRAME (ADR-102).
           The canvas is viewport-sized and sticky inside a ground four
           viewports tall, so the ground's END is not the canvas's end until
           the last viewport — `feather()` maps where the ground's bottom
           actually is into this canvas's own fractions. Delta-gated inside. */
        if (groundRect) {
          const f = feather(groundRect.bottom, propCanvasRect.bottom, propCanvasRect.height, vh);
          propWash.setFeather(f.lo, f.hi);
        }
        // Constant: the ground does not resolve, it FEATHERS. Only its origin
        // moves, which is what keeps its field continuous with the turn's
        // across the seam.
        propWash.draw(1, propCanvasRect.top, propCanvasRect.left);
        if (lastPropA !== 1) {
          lastPropA = 1;
          prop.style.setProperty("--tl-wash", "1");
        }
      }

      /* -- The ground's handoff (U6) --------------------------------
         The two stations OVERLAP by `--tl-prop-lead` now, so for half a
         viewport after the turn's stage unpins both grounds are in the
         frame. The proposal's reaches up past the release point (see the
         CSS), so from that frame on it covers the viewport by itself and
         the turn's is simply switched off -- no cross-fade, because
         `washOf` has saturated at 1 since p 0.68 and the proposal paints
         a constant 1 on a field locked to the same origin. Same amount,
         same field: the step is a no-op on the pixels.

         ⚠ STAMPED ON THE STATION, NOT THE STAGE, so one rule reaches the
         canvas AND the no-WebGL gradient; and delta-gated, because this is
         a boolean that flips once per pass. */
      const handoff = p >= 1 ? 1 : 0;
      if (lastHandoff !== handoff) {
        lastHandoff = handoff;
        if (handoff) {
          turn.setAttribute("data-tl-handoff", "1");
          prop?.removeAttribute("data-tl-ground");
        } else {
          turn.removeAttribute("data-tl-handoff");
          prop?.setAttribute("data-tl-ground", "hold");
        }
      }

      /* ── The proposal's own clock (ADR-099) ────────────────────────────
         `q` is the station's ARRIVAL, one viewport wide. It was the pinned
         stretch of a sticky stage (U5) — blank while the section travelled,
         powering on once it stopped — and that is what left a bare frame
         between the two beats: a pin cannot begin until the thing above it
         has ended. The record scrolls in now, so the two overlap.
         ⚠ Read off `#proposition`'s rect, never the turn's: the two stations
         overlap by `--tl-prop-lead`, so the turn's `p` saturates while this
         one is still arriving — which is exactly the overlap ADR-099 wanted,
         and it can only be measured on the station that is moving. */
      const q = propRect ? propArrival(propRect.top, vh) : 0;

      /* ── The scene's clock (ADR-102) ───────────────────────────────────
         `sv` is how far the station's top has passed the frame's top, in
         viewports — 0 on the frame the record is struck in (q = 1 IS the pin),
         the runway at its release. Off the same rect as `q`.
         ⚠ IT JOINS THE DELTA GATE, WHICH IS NOT OPTIONAL. `p` and `q` both
         saturate the moment the record lands, so from that frame on they
         agree forever — which is the whole of the scene's scroll. A gate on
         those two alone returns before the scene is ever written. */
      const sv = scene && propRect ? sceneProgress(propRect.top, vh, scene.runwayVh) : 0;

      if (
        lastP >= 0 &&
        Math.abs(p - lastP) < 0.0005 &&
        Math.abs(q - lastQ) < 0.0005 &&
        Math.abs(sv - lastSv) < 0.0005
      )
        return;
      lastP = p;
      lastQ = q;
      lastSv = sv;

      brandmarkMorphRef.current.progress = morphOf(p);
      /* Both stations, one channel — additive. `veilOf` saturates at
         `p = 0.72` and `q` opens at `p ≈ 0.55`, so the turn hands the mark
         over rather than racing it: 0.72 by the end of the turn, 0.94 as the
         record lands (ADR-099, re-keyed by ADR-101 §A). */
      brandmarkMorphRef.current.veil = markVeil(p, q);
      turn.style.setProperty("--tl-turn", p.toFixed(3));
      turn.setAttribute("data-tl-turn", p.toFixed(2));

      /* The arrival is still PUBLISHED — the capture and the smoke converge
         on it rather than on a solved `y`, and the ground's own swap reads
         the same rect. What it no longer drives is the record: that is an arc
         beat, so nothing here writes its opacity. */
      prop?.setAttribute("data-tl-prop", q.toFixed(2));

      /* ⚠ THE CONFIGURATION STRIKES, IT DOES NOT RISE (ADR-101 §A). `q` is
         1 exactly when `p` is, under the 100svh lead, so the trigger frame is
         the one where the turn is spent AND the head is on its datum: the
         record is already composed and seated when the burst fires, which is
         the only way a strike can read as materialising rather than as a
         second entrance. */
      propArrive = stamp(
        prop,
        "data-tl-prop-arrive",
        propArrive,
        arriveNext(propArrive, q, PROP_ARRIVE_IN, PROP_ARRIVE_OUT)
      );
      /* The scene-past latch releases only here — the record leaving the way
         it came is the one moment a replayed strike is the right thing. */
      if (propArrive === "out" && lastPast === 1) {
        lastPast = 0;
        prop?.removeAttribute("data-tl-scene-past");
      }

      if (scene && stageRect && svgRect) writeScene(sv, svgRect, stageRect);

      // The channel the CSS fallback and the smoke read; the canvas itself
      // is painted above, outside this gate.
      stage.style.setProperty("--tl-wash", washOf(p).toFixed(3));

      for (let i = 0; i < products.length; i++) {
        const el = products[i];
        const k = Number(el.dataset.tm) || 0;
        const pose = productPose(k, p, rests[i], stageW, stageH, products.length);
        el.style.setProperty("--tm-dx", `${pose.dx.toFixed(1)}px`);
        el.style.setProperty("--tm-dy", `${pose.dy.toFixed(1)}px`);
        el.style.setProperty("--tm-dr", `${pose.dr.toFixed(2)}deg`);
        el.style.setProperty("--tm-s", pose.scale.toFixed(3));
        el.style.setProperty("--tm-o", pose.opacity.toFixed(3));
      }

      const pIn = ctaInOf(p);
      const pOut = ctaOutOf(p);
      stage.style.setProperty("--tl-cta-o", ctaInkOf(p).toFixed(3));
      for (let i = 0; i < lines.length; i++) {
        const next = turnDecodeFrame(truth, i, pIn, pOut);
        if (lines[i].textContent !== next) lines[i].textContent = next;
      }
    };

    const schedule = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(frame);
    };
    /* Declared before `relayout` so it can drain the observer: see below. */
    let mo: MutationObserver | null = null;
    const relayout = () => {
      measure();
      /* ⚠ MEASURING MUTATES THE SUBTREE IT WATCHES. `measureSeam` resolves
         every token through a probe element appended inside the board and the
         first plate and removed again — childList mutations inside the stage,
         which is exactly what the observer below listens for. Left queued,
         they fire the observer, which re-measures, which appends probes, which
         fires the observer: a synchronous loop that never yields to a frame
         and hangs the tab with nothing thrown. Draining the records here
         discards the mutations this measurement made and nothing else. */
      mo?.takeRecords();
      lastP = -1;
      lastSv = -1;
      schedule();
    };

    measure();
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", relayout, { passive: true });
    mq.addEventListener("change", relayout);

    /* ⚠ AND THE NESTED ROOTS ARE WATCHED, BECAUSE THEY ARRIVE LATE. The
       configuration's root and `#offer`'s beats are lazy: the station boxes
       are server-rendered and empty, and everything the scene measures
       appears inside them one approach later.
       ⚠ A `ResizeObserver` ON THE SLOT IS BLIND ONCE THE SLOT IS THE STAGE.
       It fires on the mount frame today because mounting the beats grows the
       slot — but the stamped slot is a fixed `100svh`, so from then on a font
       swap, an image settling or a re-mount changes nothing about its box and
       the observer never fires again, with `measureSeam` returning null
       forever and nothing throwing. A `MutationObserver` on the slot's
       subtree is the signal that says 'the thing you could not find is here
       now'; the resize observer stays for the offer's root and the window.
       ⚠ The carrier layer lives INSIDE that subtree and re-writes its text
       every frame of a decode, so its own mutations are filtered out — or
       the writer would re-measure the whole scene on every frame it moved. */
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => relayout());
    if (ro) {
      for (const sel of [
        ".tl-root [data-tl-config-root]",
        ".tl-root [data-tl-offer-root]",
      ] as const) {
        const el = document.querySelector<HTMLElement>(sel);
        if (el) ro.observe(el);
      }
    }
    mo =
      typeof MutationObserver === "undefined" || !sceneStage
        ? null
        : new MutationObserver((records) => {
            const layer = seamLayer;
            if (layer && records.every((r) => layer.contains(r.target))) return;
            relayout();
          });
    if (mo && sceneStage) {
      mo.observe(sceneStage, { childList: true, subtree: true });
      // The initial measure above ran before the observer existed; nothing to drain.
    }

    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      ro?.disconnect();
      mo?.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", relayout);
      mq.removeEventListener("change", relayout);
      park();
      seamLayer?.remove();
      wash?.dispose();
      propWash?.dispose();
    };
  }, []);
}
