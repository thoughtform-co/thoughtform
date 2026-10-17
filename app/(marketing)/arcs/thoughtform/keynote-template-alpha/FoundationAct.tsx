"use client";

import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import {
  BRAIN_VIEW_FRONT,
  BRAIN_VIEW_ISO,
  brainIsoBox,
  brainIsoFlank,
  brainIsoPoint,
  brainIsoRoots,
  brainIsoSvg,
  brainMedialL,
  type BrainChip,
  type BrainIsoBox,
  type BrainIsoOptions,
  type BrainView,
} from "@/components/arcs/figures/foundation/brainIso";
import { tendrilFiles, type TendrilFile } from "@/components/arcs/figures/foundation/layerTendrils";
import { holeScreen, holeSeed, holeStep, paintHole, type HoleScreen } from "@/components/arcs/figures/foundation/mathHole";
import type { Flat } from "@/components/arcs/figures/foundation/isoKit";
import { latticeAt, pickLattice } from "@/app/(internal)/test/proposal-swarm/engine/lattice";
import { COVER, coverOf, engraved, LIP_REACH } from "@/app/(internal)/test/proposal-swarm/engine/mark";
import { paletteOf, parseRgb, type Rgb, type Tones } from "@/app/(internal)/test/proposal-swarm/engine/palette";
import { PLATES, SIDE as PLATE_SIDE } from "@/app/(internal)/test/stack-forms/model";
import { kOf, type Lattice, STYLE, tierSizes } from "@/app/(internal)/test/stack-forms/swarm/dots";
import { type Place, type Tone } from "@/components/arcs/figures/foundation/paintBrain";
import {
  CARD,
  FACING,
  PLATE,
  SCREEN_X,
  SHEET,
  STACK_L,
  VB,
  axesAt,
  cable,
  capabilityTop,
  lerp,
  plateCorner,
  plateOrigin,
  plateSocket,
  proj,
  sheetPoses,
  smooth,
  U,
  type M6,
  type P2,
} from "@/components/arcs/figures/foundation/scene";
import { advanceScrambles, queueScramble, type ScrambleJob } from "@/lib/home-v2/captionScramble";
import { KEYNOTE_ARC } from "@/lib/arcs/content/keynote-template-alpha";


/**
 * FoundationAct — one scene across seven beats (ADR-156 U5 to U9, forked for
 * the keynote in ADR-159): what it can make, intelligence as the interface,
 * the middle, every desk, the shoggoth, the brain alone (their own), latent
 * space. The examples face the reader one by one as
 * modules, their head in the frame over their picture as Unsiloed builds its
 * cards, and lie down in the stack on the left, whose capability axis grows
 * with it; the floor falls away and the stack cascades to the centre; the
 * machine brain (`brain.ts`) hangs over it and its cables plug into every
 * plate the moment the beat lands. After the line about software the brain
 * returns: between a tool and a collaborator, inside the rings of the
 * knowledge work it is growing into, as the shoggoth with its tentacles and
 * mask, and once more alone (ADR-159: legible, and still its own). Last,
 * latent space: a field of particles round a line.
 *
 * ⚠ THE BRAIN IS ONE OBJECT (owner, 2026-10-16: "right now the brain
 * disappears but then reappears in a later section"). Between two of its
 * beats a voice stands (not software, the alien question, Goodfire's line);
 * those beats are the act's too: the brain stays, pushed back and dimmed
 * behind the words, and comes forward again when the next beat parks. Its
 * seat eases from pose to pose, its picture crossfades (whole, split,
 * masked), and the first time it is seen after being gone it MANIFESTS:
 * the plates drawn one after another from the floor to the crown, both
 * hemispheres together, the machine on the crowns last (the kit's own build
 * order through `brainIso`'s `reveal`), never a scanline.
 *
 * ⚠ TENDRILS, NOT A BLOCK (owner: "I don't think we need those so-called
 * blocks at the bottom of the brain. I think it needs tendrils"). The stem,
 * the block and the manifold are not drawn (`base: "tendrils"`); hoses hang
 * from eight roots on the hemispheres' undersides, sway and curl, a ferrule
 * at the mouth and a plug at the tip. On the interface beat seven of them
 * are the cords into the plates, from the left roots round the stack's left
 * side into the plates' left edges, from the right round the right, one
 * over the back ("spread them out ... so they really touch all the
 * different angles").
 *
 * The statements and the prowl between its beats are not its concern:
 * while one of them is up no id in `IDS` is active and the act hides.
 *
 * ⚠ A READER on the talk's scroll (one passive listener, one rAF) that
 * writes only its own layer. It is shown only while one of its beats is the
 * beat up (`data-uxm-active`, the tail's reader), above the terminal tier.
 * The modules are SVG on exact plane matrices (`scene.ts`); the brain is
 * baked ONCE per pose into a layer and only its signals move; the cords,
 * rings, tentacles and the field are the live canvas; the words are DOM.
 */

const CUT = 22;
const W = CARD.w;
const H = CARD.h;
const chamferPts = (w: number, h: number, cut: number, x = 0, y = 0): [number, number][] => [
  [x, y],
  [x + w - cut, y],
  [x + w, y + cut],
  [x + w, y + h],
  [x + cut, y + h],
  [x, y + h - cut],
];
const chamferOf = (pts: [number, number][]) => `M${pts.map(([x, y]) => `${x} ${y}`).join(" L")} Z`;
const OUTER = chamferPts(W, H, CUT);
const chamfer = chamferOf(OUTER);
/** The card's geometry (U10, owner 2026-10-17: "why is it so small? I like
    the full bleed ... these cards need to feel like full-bleed interfaces:
    minimalistic"), in card units (560 × 540): a slim head (the title and its
    line), the picture full bleed under it to the card's three other edges,
    and one button on a film, the plate `PLAY` at the picture's foot. The
    talk's `MEDIA` is the Ghent card's and stays as it was. */
const PAD = 24;
const HEAD = 86;
const PLAY = { x: PAD, y: H - PAD - 34, w: 112, h: 34 } as const;
/** The picture's clip: the card's own chamfer, so the bleed meets its cut. */
const media = chamfer;
const mat = (m: M6) => `matrix(${m.map((v) => v.toFixed(4)).join(" ")})`;
const apply = (m: M6, x: number, y: number): P2 => ({ x: m[0] * x + m[2] * y + m[4], y: m[1] * x + m[3] * y + m[5] });

/** The tray a plate sits on: its little grid, a margin past its edges. */
const TRAY = 26;
const trayPath = (() => {
  const d: string[] = [chamferOf(chamferPts(W + 2 * TRAY, H + 2 * TRAY, CUT + 10, -TRAY, -TRAY))];
  for (let x = -TRAY; x <= W + TRAY; x += 35) d.push(`M${x} ${-TRAY} L${x} ${H + TRAY}`);
  for (let y = -TRAY; y <= H + TRAY; y += 35) d.push(`M${-TRAY} ${y} L${W + TRAY} ${y}`);
  return d.join(" ");
})();

/** The cords: no two alike (owner: "not all be the same size ... gold,
    green, white, red"). Width in viewBox px. */
const CORDS = [
  { tone: "gold", w: 3.4 },
  { tone: "green", w: 1.4 },
  { tone: "ink", w: 2.4 },
  { tone: "red", w: 1.1 },
  { tone: "gold", w: 2.2 },
  { tone: "green", w: 2.8 },
  { tone: "ink", w: 1.6 },
] as const;

/** The brain's seat in a beat: where, how large, how present. */
type Pose = Place & { a: number };
/** Behind a voice: pushed back, smaller, dim (owner, 2026-10-16: "moves
    slightly into the background with lower opacity"). */
const RECEDE: Pose = { x: 720, y: 330, s: 0.6, a: 0.28 };
/** Where the brain stands in each beat that has it, by the act's phase. */
const POSES: Record<number, Pose> = {
  1: { x: 806, y: 208, s: 0.68, a: 1 },
  // clear of the headline (owner, 2026-10-15: "too close to the text")
  2: { x: 720, y: 412, s: 0.84, a: 1 },
  3: { x: 720, y: 360, s: 0.74, a: 1 },
  4: RECEDE,
  5: { x: 720, y: 330, s: 0.78, a: 1 },
  // the layer (U5): the two hemispheres parted, the plate standing between
  // them; no head over it since U6, so it sits on the box's middle
  6: { x: 720, y: 410, s: 0.78, a: 1 },
  7: RECEDE,
  // the brain alone (ADR-159), centred under its head
  8: { x: 720, y: 400, s: 0.82, a: 1 },
};
/** Which picture each beat shows: whole, or split (the middle). The shoggoth
    is the whole brain with its smile drawn live over it (U4), never a mask;
    the layer beat draws the whole brain as its two halves (`left`, `right`). */
type Picture = "plain" | "split" | "mask" | "left" | "right";
const PICTURE: Record<number, Picture> = { 1: "plain", 2: "split", 3: "plain", 4: "plain", 5: "plain", 6: "plain", 7: "plain", 8: "plain" };
/** The layer beat (U5, U6). The plate stands upright in the gap the two
    hemispheres open (U6, owner: "this Thoughtform stack should stand
    upright, not horizontally"): its face square to the brain's L axis,
    about `LAYER_SIDE` brain units a side (the swarm's lattice nearest that
    size), its middle `LAYER_Z` brain units above the equator; each
    hemisphere moves `LAYER_PART` brain units out along L. */
const LAYER_SIDE = 210;
const LAYER_PART = 175;
const LAYER_Z = 22;
/** The heights the hemispheres' walls stand in, brain units: a tendril
    plugs in between them (U7). */
const WALL_Z: [number, number] = [-45, 92];
/** The brain's machining (U7, `brainIso`'s `chip`): none until he picks a
    direction at `/test/keynote-brain`. */
const BRAIN_CHIP: BrainChip = {};
/** How far the pointer moves the brain (owner, 2026-10-16: "when you move
    your mouse, the brain moved slightly ... just enough for a little fun"),
    in viewBox px at the brain's scale 1. */
const PARALLAX = { x: 12, y: 8 } as const;
/** The manifest: the plates from the floor to the crown, in this many
    steps over this many seconds. */
const STEPS = 12;
const MANIFEST = 0.9;

/**
 * The camera's path (ADR-159 U2, owner: the brain "rotated so it's more
 * central ... also tilt up so that, when you land [on the middle], you can
 * really see the frontal view while still maintaining a 3D POV"). Two legs
 * on one parameter `t`: 0 → 1 the TURN, from the stack's isometric (where
 * the brain must share the cards' camera) to face on; 1 → 2 the TILT, from
 * the isometric's height down to the frontal view's. Each phase has its
 * station on the path; the brain eases along it by the clock, and the
 * picture is rasterised at `VIEW_STEPS` frames a leg.
 */
const VIEW_T: Record<number, number> = { 1: 0, 2: 2, 3: 2, 4: 2, 5: 2, 6: 0, 7: 2, 8: 2 };
const VIEW_STEPS = 12;
function viewOf(t: number): BrainView {
  const u = Math.max(0, Math.min(2, t));
  if (u <= 1) return { azimuth: BRAIN_VIEW_ISO.azimuth * (1 - u), elevation: BRAIN_VIEW_ISO.elevation };
  const w = u - 1;
  return { azimuth: BRAIN_VIEW_FRONT.azimuth, elevation: BRAIN_VIEW_ISO.elevation + (BRAIN_VIEW_FRONT.elevation - BRAIN_VIEW_ISO.elevation) * w };
}
/**
 * A camera: a frame of the path, and the pointer's lean (ADR-159 U5, owner:
 * "when you move your mouse, I want to be able to rotate the brain a bit,
 * not too much"): the yaw and pitch steps the pointer adds, `LEAN_STEP`
 * degrees each, at most `LEAN_YAW` and `LEAN_PITCH` steps either way, only
 * once the brain stands whole at a station of the path. Each lean is a
 * picture of its own, rasterised ahead a couple a frame.
 */
interface Cam {
  vi: number;
  py: number;
  pp: number;
}
const LEAN_STEP = 2;
const LEAN_YAW = 4;
const LEAN_PITCH = 2;
const FLAT = (vi: number): Cam => ({ vi, py: 0, pp: 0 });
const camKey = (c: Cam) => `${c.vi}|${c.py}|${c.pp}`;
const viewAt = (c: Cam): BrainView => {
  const v = viewOf(c.vi / VIEW_STEPS);
  return { azimuth: v.azimuth + c.py * LEAN_STEP, elevation: v.elevation + c.pp * LEAN_STEP };
};
/** The brain's bounds and roots at a camera, once each. */
const BOXES = new Map<string, BrainIsoBox>();
const ROOTS = new Map<string, Flat[]>();
function boxAt(c: Cam): BrainIsoBox {
  const key = camKey(c);
  let b = BOXES.get(key);
  if (!b) BOXES.set(key, (b = brainIsoBox(viewAt(c))));
  return b;
}
function rootsAt(c: Cam): Flat[] {
  const key = camKey(c);
  let r = ROOTS.get(key);
  if (!r) ROOTS.set(key, (r = brainIsoRoots(viewAt(c))));
  return r;
}
/** The middle beat's two cards, in the viewBox. */
const SIDE = { w: 340, h: 158, y: 400, tool: 70, collab: 1030 } as const;

type Card = {
  id: string;
  kind: string;
  year: string;
  title: string;
  caption: string;
  media?: { type: "image" | "video"; src: string; poster?: string; alt: string };
};

/** The act's beats in page order; their index is the act's phase. The
    voices between the drawn beats are the act's too, so the brain holds. */
const IDS = ["capability", "the-interface", "an-intelligence", "every-desk", "an-alien", "shoggoth", "the-layer", "already-clean", "their-own", "latent-space"] as const;

function findSpecs() {
  const s = IDS.map((id) => KEYNOTE_ARC.sections.find((x) => x.id === id));
  const fig = <T extends string>(i: number, id: T) => {
    const x = s[i];
    return x?.kind === "figure" && x.figure.id === id ? x.figure : null;
  };
  const cap = fig(0, "capability");
  const cards: readonly Card[] = cap && cap.id === "capability" ? cap.cards : [];
  const ifc = fig(1, "interface");
  const mid = fig(2, "middle");
  const know = fig(3, "knowledge");
  const shog = fig(5, "shoggoth");
  const lay = fig(6, "layer");
  const own = fig(8, "brain");
  const lat = fig(9, "latent");
  const middle = mid && mid.id === "middle" ? mid : null;
  const knowledge = know && know.id === "knowledge" ? know : null;
  const shoggoth = shog && shog.id === "shoggoth" ? shog : null;
  const layer = lay && lay.id === "layer" ? lay : null;
  const theirOwn = own && own.id === "brain" ? own : null;
  const latent = lat && lat.id === "latent" ? lat : null;
  const eyebrows = s.map((x) => (x?.kind === "figure" ? (x.eyebrow ?? x.head?.eyebrow ?? "") : ""));
  const none = { title: "", line: "" };
  const heads: { title: string; line: string }[] = [
    // U6: the wake-up call, moved onto the stack as its head
    { title: cap && cap.id === "capability" ? (cap.title ?? "") : "", line: "" },
    { title: ifc && ifc.id === "interface" ? ifc.mind : "", line: "" },
    { title: middle?.line ?? "", line: "" },
    { title: knowledge?.line ?? "", line: "" },
    none,
    { title: shoggoth?.title ?? "", line: shoggoth?.line ?? "" },
    { title: layer?.title ?? "", line: layer?.line ?? "" },
    none,
    { title: theirOwn?.title ?? "", line: theirOwn?.line ?? "" },
    none,
  ];
  return { cards, middle, knowledge, latent, eyebrows, heads };
}

export function FoundationAct() {
  const { cards, middle, knowledge, latent, eyebrows, heads } = useMemo(() => findSpecs(), []);
  const n = cards.length;
  const axes = useMemo(() => axesAt(n, STACK_L), [n]);
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sheetRefs = useRef<(SVGGElement | null)[]>([]);
  const backRefs = useRef<(SVGGElement | null)[]>([]);
  const ghostRefs = useRef<(SVGGElement | null)[]>([]);
  const trayRefs = useRef<(SVGGElement | null)[]>([]);
  const joinRefs = useRef<(SVGPathElement | null)[]>([]);
  const tickRefs = useRef<(SVGGElement | null)[]>([]);
  const floorRef = useRef<SVGGElement>(null);
  const yAxisRef = useRef<SVGPathElement>(null);
  const yNameRef = useRef<SVGTextElement>(null);
  const leaderRef = useRef<SVGPathElement>(null);
  const eyebrowRef = useRef<HTMLSpanElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const lineRef = useRef<HTMLParagraphElement>(null);
  const playRef = useRef<HTMLButtonElement>(null);
  const theatreRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLVideoElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    if (!window.matchMedia("(min-width: 961px) and (prefers-reduced-motion: no-preference)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const talk = root.closest<HTMLElement>(".arc-root");
    talk?.setAttribute("data-act", "live");
    const field = latentField(latent?.nodes ?? []);
    const jobs: ScrambleJob[] = [];
    let scrambleRaf = 0;
    const tick = () => {
      scrambleRaf = 0;
      advanceScrambles(jobs, performance.now() / 1000);
      if (jobs.length) scrambleRaf = requestAnimationFrame(tick);
    };
    const scramble = (el: HTMLElement | null, text: string) => {
      if (!el) return;
      // A new word for this element cancels the one still decoding into it.
      for (let j = jobs.length - 1; j >= 0; j--) if (jobs[j].el === el) jobs.splice(j, 1);
      el.textContent = "";
      if (!text) return;
      queueScramble(jobs, el, text, performance.now() / 1000);
      if (!scrambleRaf) scrambleRaf = requestAnimationFrame(tick);
    };
    let facingIdx = -1;
    let phase = -1;
    let axisZ = capabilityTop(0);
    let landed = 0;
    let dpr = 1;
    let light = false;
    const tone: Tone = { ink: "rgb(235, 227, 214)", gold: "rgb(202, 165, 84)", lit: "rgb(240, 200, 106)", green: "rgb(122, 158, 106)", red: "rgb(255, 107, 53)" };
    /* The brain as a machined object, built with the anatomy kit in the
       stack's own camera (`brainIso.ts`), rasterised once per picture, per
       build step and per theme, and painted through this canvas, so
       everything round it keeps its order. */
    const pictures = new Map<string, HTMLImageElement | null>();
    let gone = false;
    const pictureOf = (kind: Picture, step = STEPS, cam: Cam = FLAT(0)): HTMLImageElement | null => {
      const key = `${kind}|${step}|${camKey(cam)}|${light}`;
      if (pictures.has(key)) return pictures.get(key) ?? null;
      pictures.set(key, null);
      const img = new Image();
      const opts: BrainIsoOptions = {
        base: "tendrils",
        split: kind === "split",
        mask: false,
        reveal: step / STEPS,
        view: viewAt(cam),
        only: kind === "left" ? -1 : kind === "right" ? 1 : undefined,
        chip: BRAIN_CHIP,
      };
      const url = URL.createObjectURL(new Blob([brainIsoSvg({ ...opts, light, ink: tone.ink, gold: tone.gold, lit: tone.lit, green: tone.green })], { type: "image/svg+xml" }));
      img.onload = () => {
        URL.revokeObjectURL(url);
        if (!gone) pictures.set(key, img);
      };
      img.src = url;
      return null;
    };
    /** The highest build step loaded at or under `step`, at a camera. */
    const readyUnder = (kind: Picture, step: number, cam: Cam): HTMLImageElement | null => {
      for (let k = step; k >= 1; k--) {
        const img = pictureOf(kind, k, cam);
        if (img) return img;
      }
      return null;
    };
    /** Every step of a picture at a camera, asked for ahead of its manifest. */
    const prime = (kind: Picture, cam: Cam) => {
      for (let k = 1; k <= STEPS; k++) pictureOf(kind, k, cam);
    };
    /** Pictures asked for ahead, a couple a frame so nothing stalls: the
        frames of a turn, and the leans at a station. */
    const queue: [Picture, Cam][] = [];
    const primeTurn = (kind: Picture, from: number, to: number) => {
      // In the turn's own order, so the frames wanted first come first.
      const a = Math.round(from * VIEW_STEPS);
      const b = Math.round(to * VIEW_STEPS);
      const d = b >= a ? 1 : -1;
      for (let vi = a; d > 0 ? vi <= b : vi >= b; vi += d) queue.push([kind, FLAT(vi)]);
    };
    const primeLeans = (kind: Picture, vi: number) => {
      for (let py = -LEAN_YAW; py <= LEAN_YAW; py++) {
        for (let pp = -LEAN_PITCH; pp <= LEAN_PITCH; pp++) {
          if (py || pp) queue.push([kind, { vi, py, pp }]);
        }
      }
    };
    prime("plain", FLAT(0));

    /* The brain's live state: its seat eases toward the beat's pose, its
       camera along the path, its picture crossfades when the beat changes
       it, and it manifests the first time it is seen after being gone. */
    const brain = {
      x: 0,
      y: 0,
      s: 0,
      a: 0,
      v: 0,
      cam: FLAT(0),
      seated: false,
      kind: "plain" as Picture,
      prev: null as Picture | null,
      fade: 1,
      shownAt: 0,
      last: 0,
      /** The stations whose leans have been asked for, by kind and frame. */
      leaned: new Set<string>(),
      /** How far the hemispheres stand apart, 0..1, eased by the clock (U5). */
      apart: 0,
    };
    /* The layer (U5): the swarm page's plate, built once a lattice, in the
       page's own tones over the ground the canvas sits on. */
    let layerSeat: LayerDots | null = null;
    let layerKey = "";
    const layerAt = (widthCss: number): LayerDots => {
      const pick = pickLattice(widthCss, dpr);
      const key = `${pick.a}|${pick.b}|${pick.n}|${dpr}`;
      if (!layerSeat || layerKey !== key) {
        layerSeat = layerDots(latticeAt(pick, dpr));
        layerKey = key;
      }
      return layerSeat;
    };
    const tones: Tones = { ground: [10, 9, 8], bone: [235, 227, 214], gold: [202, 165, 84], green: [122, 158, 106] };
    /** The first painted ground under an element, as three numbers. */
    const groundOf = (el: Element | null, fallback: Rgb): Rgb => {
      for (let e = el; e; e = e.parentElement) {
        const bg = getComputedStyle(e).backgroundColor;
        if (bg && bg !== "transparent" && !/rgba\([^)]*,\s*0\)$/.test(bg)) return parseRgb(bg, fallback);
      }
      return fallback;
    };
    /* The pointer, −1..1 across the screen, eased: the brain leans with it a
       little in every beat it is drawn (the hoses, cords, rings and runs
       read its seat, so they come along). */
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    const onPointer = (e: PointerEvent) => {
      pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    const size = () => {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
      const cs = getComputedStyle(canvas);
      tone.ink = cs.color || tone.ink;
      tone.gold = cs.getPropertyValue("--fa-gold").trim() || tone.gold;
      tone.lit = cs.getPropertyValue("--fa-lit").trim() || tone.lit;
      tone.green = cs.getPropertyValue("--fa-green").trim() || tone.green;
      tone.red = cs.getPropertyValue("--fa-red").trim() || tone.red;
      const was = light;
      light = document.documentElement.dataset.theme === "light";
      tones.ground = groundOf(canvas.parentElement, light ? [239, 233, 220] : [10, 9, 8]);
      tones.bone = parseRgb(tone.ink, tones.bone);
      tones.gold = parseRgb(tone.gold, tones.gold);
      tones.green = parseRgb(tone.green, tones.green);
      if (was !== light) {
        pictures.clear();
        brain.leaned.clear();
        prime(brain.kind, FLAT(brain.cam.vi));
      }
    };
    /**
     * The brain at this frame: eased to the phase's pose, its picture
     * crossfading, manifesting plate by plate when newly seen. Returns its
     * seat, how far the manifest has come, how present it is, and `draw`,
     * which paints it where the caller wants it in the stack of layers; or
     * null when the phase has no brain. Called once a frame.
     */
    const brainAt = (now: number): { pl: Place; seat: Place; cam: Cam; manifest: number; alpha: number; draw: () => void } | null => {
      const pose = POSES[phase];
      if (!pose) return null;
      if (!brain.seated) {
        brain.x = pose.x;
        brain.y = pose.y;
        brain.s = pose.s;
        brain.a = 0;
        brain.v = VIEW_T[phase] ?? 0;
        brain.cam = FLAT(Math.round(brain.v * VIEW_STEPS));
        brain.seated = true;
        brain.shownAt = now;
        brain.kind = PICTURE[phase];
        brain.prev = null;
        brain.fade = 1;
        brain.last = now;
        brain.apart = 0;
        prime(brain.kind, brain.cam);
      }
      // By the clock, not the frame: a throttled tab still arrives.
      const dt = Math.min(0.25, Math.max(0, (now - brain.last) / 1000));
      brain.last = now;
      const e = 1 - Math.exp(-dt * 9);
      brain.x += (pose.x - brain.x) * e;
      brain.y += (pose.y - brain.y) * e;
      brain.s += (pose.s - brain.s) * e;
      brain.a += (pose.a - brain.a) * e;
      // The camera takes its time: a turn, then a tilt, each about a second.
      // While the halves stand apart (U5) it holds the isometric, so they
      // close before the next beat's turn.
      const parting = phase === 6;
      const target = brain.apart > 0 && !parting ? 0 : (VIEW_T[phase] ?? 0);
      const ev = 1 - Math.exp(-dt * 4.5);
      brain.v += (target - brain.v) * ev;
      const vi = Math.round(brain.v * VIEW_STEPS);
      const station = Math.round(target * VIEW_STEPS);
      // The layer beat parts the brain once it stands whole at the isometric.
      const wantApart = parting && vi === 0 && (VIEW_T[phase] ?? 0) === 0 && now - brain.shownAt >= MANIFEST * 1000;
      brain.apart += ((wantApart ? 1 : 0) - brain.apart) * (1 - Math.exp(-dt * (wantApart ? 2.2 : 4)));
      if (brain.apart < 0.003) brain.apart = 0;
      else if (brain.apart > 0.997) brain.apart = 1;
      const want = PICTURE[phase];
      if (want !== brain.kind) {
        brain.prev = brain.kind;
        brain.kind = want;
        brain.fade = 0;
        pictureOf(want, STEPS, FLAT(station));
      }
      if (brain.fade < 1) brain.fade = Math.min(1, brain.fade + dt / 0.45);
      const manifest = Math.min(1, (now - brain.shownAt) / 1000 / MANIFEST);
      const step = Math.max(1, Math.ceil(manifest * STEPS));
      const k = canvas.width / VB.w;
      pointer.x += (pointer.tx - pointer.x) * e;
      pointer.y += (pointer.ty - pointer.y) * e;
      // The pointer's lean: a turn of the camera, once the brain stands
      // whole at its station (the frames between are the path's own).
      const standing = vi === station && manifest >= 1;
      const py = standing ? Math.max(-LEAN_YAW, Math.min(LEAN_YAW, Math.round(pointer.x * LEAN_YAW))) : 0;
      const pp = standing ? Math.max(-LEAN_PITCH, Math.min(LEAN_PITCH, Math.round(-pointer.y * LEAN_PITCH))) : 0;
      const cam: Cam = { vi, py, pp };
      brain.cam = cam;
      if (standing) {
        const key = `${brain.kind}|${vi}`;
        if (!brain.leaned.has(key)) {
          brain.leaned.add(key);
          primeLeans(brain.kind, vi);
        }
      }
      const seat: Place = { x: brain.x, y: brain.y, s: brain.s };
      const pl: Place = { x: brain.x + pointer.x * PARALLAX.x * brain.s, y: brain.y + pointer.y * PARALLAX.y * brain.s, s: brain.s };
      const s = pl.s * ISO_S;
      const draw = (img: HTMLImageElement, alpha: number, B: BrainIsoBox, dx = 0, dy = 0) => {
        ctx.globalAlpha = alpha;
        ctx.drawImage(img, (pl.x + dx + B.x0 * s) * k, (pl.y + dy + B.y0 * s) * k, (B.x1 - B.x0) * s * k, (B.y1 - B.y0) * s * k);
      };
      /**
       * The layer (U5, owner: "reveal the brain, move the two parts left
       * and right respectively, and place our Thoughtform-encoded layer
       * ... in between"; U6: "just the brain opened in the middle ... this
       * Thoughtform stack should stand upright"): the two hemispheres, each
       * moved out along the brain's own L axis, and the swarm page's plate
       * standing in the gap, its face square to L. The brain's isometric is
       * the lattice's, so L runs along the lattice's j and the plate's
       * thickness with it. Painted in depth order for this camera: the far
       * half, the plate over it, the near half over the plate's foot.
       */
      const drawParted = (left: HTMLImageElement, right: HTMLImageElement, alpha: number) => {
        const open = smooth(brain.apart);
        const V0 = viewAt(FLAT(0));
        const o = brainIsoPoint(0, 0, 0, V0);
        const l1 = brainIsoPoint(1, 0, 0, V0);
        const ux = l1[0] - o[0];
        const uy = l1[1] - o[1];
        // a brain unit on screen, device px (the isometric draws every axis alike)
        const unit = Math.hypot(ux, uy) * s * k;
        // the swarm's plate width for a face this side: its width is its side over cos 30
        const D = layerAt((1.73 * LAYER_SIDE * unit) / dpr);
        const side = D.L.m * D.L.g * Math.hypot(D.L.a, D.L.b);
        const part = LAYER_PART * open;
        const B = boxAt(FLAT(0));
        const near = uy > 0 ? 1 : -1;
        const half = (dir: 1 | -1) => draw(dir > 0 ? right : left, alpha, B, dir * part * ux * s, dir * part * uy * s);
        half(near > 0 ? -1 : 1);
        const mid = brainIsoPoint(0, 0, LAYER_Z, V0);
        const cx = (pl.x + mid[0] * s) * k;
        const cy = (pl.y + mid[1] * s) * k;
        // U7: the tendrils, files of the slab's own dots from its faces into
        // the hemispheres' medial walls, grown once the slab has printed.
        // Far files before the slab (it covers their roots), near ones after
        // it (the near half covers their tips).
        const z1 = brainIsoPoint(0, 0, 1, V0);
        const zUnit = Math.abs(z1[1] - o[1]) * s * k;
        const siteU = side / D.L.m / unit;
        const zAt = (T: number) => LAYER_Z + ((T - D.L.m / 2) * 2 * D.L.b * D.L.g) / zUnit;
        const tAt = (z: number) => Math.round(D.L.m / 2 + ((z - LAYER_Z) * zUnit) / (2 * D.L.b * D.L.g));
        const files = tendrilFiles(D.L, D.th, (_, T) => (part + brainMedialL(zAt(T), !!BRAIN_CHIP.die) - (D.th / 2) * siteU) / siteU, [tAt(WALL_Z[0]), tAt(WALL_Z[1])]);
        const grown = smooth((brain.apart - 0.82) / 0.18);
        const lay = { ox: Math.round(cx - D.centre[0]), oy: Math.round(cy - D.centre[1]), grown, now, tones, alpha, L: D.L };
        paintFiles(ctx, files, "far", lay);
        paintLayer(ctx, D, { cx, cy, tones, printed: smooth((brain.apart - 0.3) / 0.65), alpha });
        paintFiles(ctx, files, "near", lay);
        half(near);
        // A readout for the walks: the plate picked, its side, the parting and the tendrils, in brain units.
        root.dataset.faLayer = `${D.L.a}:${D.L.b} n${D.L.n} g${D.L.g} side${(side / unit).toFixed(0)} part${part.toFixed(0)} files${files.length} grown${grown.toFixed(2)} u${ux.toFixed(2)},${uy.toFixed(2)} s${s.toFixed(3)} k${k.toFixed(3)}`;
      };
      /** The whole picture at this camera, else at this frame of the path
          without the lean, else at the nearest frame that has loaded, with
          that picture's own bounds. */
      const whole = (kind: Picture): [HTMLImageElement, BrainIsoBox] | null => {
        const exact = pictureOf(kind, STEPS, cam);
        if (exact) return [exact, boxAt(cam)];
        if (py || pp) {
          const level = pictures.get(`${kind}|${STEPS}|${camKey(FLAT(vi))}|${light}`);
          if (level) return [level, boxAt(FLAT(vi))];
        }
        for (let d = 1; d <= 2 * VIEW_STEPS; d++) {
          for (const v of [vi - d, vi + d]) {
            if (v < 0 || v > 2 * VIEW_STEPS) continue;
            const img = pictures.get(`${kind}|${STEPS}|${camKey(FLAT(v))}|${light}`);
            if (img) return [img, boxAt(FLAT(v))];
          }
        }
        return null;
      };
      const manifesting = manifest < 1;
      const partial = manifesting ? readyUnder(brain.kind, step, FLAT(vi)) : null;
      const cur: [HTMLImageElement, BrainIsoBox] | null = manifesting ? (partial ? [partial, boxAt(FLAT(vi))] : null) : whole(brain.kind);
      const fading = brain.prev !== null && brain.fade < 1;
      const prev = fading ? whole(brain.prev as Picture) : null;
      const alpha = brain.a;
      const fade = brain.fade;
      // A readout for the walks: what the brain is doing this frame.
      root.dataset.faBrain = `${brain.kind} ${cur ? "ready" : "loading"} a${alpha.toFixed(2)} f${fade.toFixed(2)} m${manifest.toFixed(2)} v${brain.v.toFixed(2)} lean${py},${pp}`;
      return {
        pl,
        seat,
        cam,
        manifest,
        alpha,
        draw: () => {
          if (brain.apart > 0 && vi === 0) {
            const left = pictureOf("left", STEPS, FLAT(0));
            const right = pictureOf("right", STEPS, FLAT(0));
            if (left && right) {
              drawParted(left, right, alpha);
              ctx.globalAlpha = 1;
              return;
            }
          }
          if (prev) draw(prev[0], alpha * (1 - fade), prev[1]);
          if (cur) draw(cur[0], alpha * (fading ? fade : 1), cur[1]);
          ctx.globalAlpha = 1;
        },
      };
    };

    const clocks = () => {
      const els = IDS.map((id) => document.getElementById(id));
      const [cap, ifc] = els;
      if (!cap || !ifc) return null;
      const rc = cap.getBoundingClientRect();
      const ri = ifc.getBoundingClientRect();
      const a = ri.top - rc.top > 0 ? -rc.top / (ri.top - rc.top) : 0;
      const up = els.findIndex((el) => el?.hasAttribute("data-uxm-active"));
      return { up, a: Math.max(0, a) };
    };

    const frame = (now: number) => {
      const c = clocks();
      if (!c) return;
      root.toggleAttribute("data-fa-up", c.up >= 0);
      if (c.up < 0) {
        phase = -1;
        // gone: the next time it is seen it manifests again
        brain.seated = false;
        return;
      }
      if (c.up !== phase) {
        phase = c.up;
        landed = now;
        facingIdx = -1;
        root.dataset.faPhase = String(phase);
        const eb = eyebrows[phase];
        scramble(eyebrowRef.current, phase === 1 ? eb.split(" · ")[0] : eb);
        scramble(titleRef.current, heads[phase].title);
        if (lineRef.current) lineRef.current.textContent = heads[phase].line;
        if (!POSES[phase]) brain.seated = false;
        // A beat on another station of the camera's path: ask for the
        // frames between, and the beat's own picture at its station.
        if (POSES[phase] && brain.seated && VIEW_T[phase] !== brain.v) {
          primeTurn("plain", brain.v, VIEW_T[phase]);
          if (PICTURE[phase] !== "plain") queue.push([PICTURE[phase], FLAT(Math.round(VIEW_T[phase] * VIEW_STEPS))]);
        }
        // The layer beat parts the brain: its two halves, at the isometric.
        if (phase === 6) queue.unshift(["left", FLAT(0)], ["right", FLAT(0)]);
      }
      // The pictures asked for ahead, a couple a frame.
      for (let i = 0; i < 2 && queue.length; i++) {
        const [kd, cam] = queue.shift() as [Picture, Cam];
        pictureOf(kd, STEPS, cam);
      }
      const since = (now - landed) / 1000;
      const k = canvas.width / VB.w;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (phase < 2) {
        const a = phase === 1 ? Math.max(1, c.a) : c.a;
        const poses = sheetPoses(n, a);
        const o0 = plateOrigin(0, a);
        // The floor, its axis and the trays fall away as the stack leaves.
        const floor = 1 - smooth((a - 0.855) / 0.05);
        const fl = floorRef.current;
        if (fl) {
          fl.setAttribute("transform", `translate(${(o0.x - STACK_L.x).toFixed(1)} ${(o0.y - STACK_L.y).toFixed(1)})`);
          fl.style.opacity = floor.toFixed(3);
        }
        if (leaderRef.current) leaderRef.current.style.opacity = floor.toFixed(3);
        root.toggleAttribute("data-fa-floor", poses[0].seated && floor > 0.01);
        const inStack = poses.filter((p) => p.shown && !p.facing).length;
        axisZ += (capabilityTop(inStack) - axisZ) * 0.12;
        const tip = { x: axes.foot.x, y: axes.foot.y - axisZ * U };
        yAxisRef.current?.setAttribute(
          "d",
          `M${axes.foot.x} ${axes.foot.y} L${tip.x} ${tip.y.toFixed(1)} M${tip.x - 5} ${(tip.y + 9).toFixed(1)} L${tip.x} ${tip.y.toFixed(1)} L${tip.x + 5} ${(tip.y + 9).toFixed(1)}`
        );
        const yName = yNameRef.current;
        if (yName) {
          yName.setAttribute("transform", `translate(${axes.foot.x - 12} ${(tip.y + 4).toFixed(1)}) rotate(-90)`);
          yName.style.opacity = smooth((axisZ - 3.6) / 1.4).toFixed(3);
        }
        const leaders: string[] = [];
        poses.forEach((p, i) => {
          const g = sheetRefs.current[i];
          const back = backRefs.current[i];
          const ghost = ghostRefs.current[i];
          const tray = trayRefs.current[i];
          const join = joinRefs.current[i];
          const tk = tickRefs.current[i];
          if (!g || !back || !ghost || !tray || !join || !tk) return;
          const vis = p.shown ? "" : "hidden";
          g.setAttribute("transform", mat(p.m));
          g.style.visibility = vis;
          const bm: M6 = [p.m[0], p.m[1], p.m[2], p.m[3], p.m[4] + p.depth.x, p.m[5] + p.depth.y];
          back.setAttribute("transform", mat(bm));
          back.style.visibility = vis;
          join.setAttribute(
            "d",
            p.shown
              ? OUTER.map(([x, y]) => {
                  const f = apply(p.m, x, y);
                  return `M${f.x.toFixed(1)} ${f.y.toFixed(1)} l${p.depth.x.toFixed(1)} ${p.depth.y.toFixed(1)}`;
                }).join(" ")
              : ""
          );
          ghost.setAttribute("transform", mat(p.m));
          ghost.style.visibility = p.shown && p.ghosts > 0.01 ? "" : "hidden";
          ghost.style.opacity = p.ghosts.toFixed(3);
          tray.setAttribute("transform", mat(p.m));
          tray.style.visibility = p.seated && floor > 0.01 ? "" : "hidden";
          tray.style.opacity = floor.toFixed(3);
          tk.style.visibility = p.seated ? "" : "hidden";
          if (p.seated) {
            const t = axes.ticks[i];
            const corner = plateCorner(i, plateOrigin(i, a));
            leaders.push(`M${(t.x + o0.x - STACK_L.x).toFixed(1)} ${(t.y + o0.y - STACK_L.y).toFixed(1)} L${corner.x.toFixed(1)} ${corner.y.toFixed(1)}`);
          }
        });
        leaderRef.current?.setAttribute("d", leaders.join(" "));
        const f = phase === 0 ? poses.findIndex((p) => p.facing) : -1;
        root.toggleAttribute("data-fa-video", f >= 0 && cards[f]?.media?.type === "video");
        facingIdx = f;
        if (phase === 1) {
          const b = brainAt(now);
          if (b) {
            // The hoses and the cords hang from under the brain, so they are
            // drawn first. The cords grow one by one once the brain stands;
            // a root whose cord has started lets its hose go.
            const started = new Set<number>();
            for (let i = 0; i < n; i++) {
              if (cordGrow(since, i) > 0) started.add(CORD_PLAN[i % CORD_PLAN.length].root);
            }
            paintTendrils(ctx, b.pl, { k, dpr, tone, now, alpha: b.alpha, grow: b.manifest, cam: b.cam, skip: started });
            if (b.manifest >= 1) paintCords(ctx, b.pl, { k, dpr, tone, since, now, n, a, alpha: b.alpha, cam: b.cam });
            b.draw();
          }
        }
      } else if (phase === 2) {
        const b = brainAt(now);
        // The cards and the runs wait for the brain to stand whole, facing.
        const stood = !!b && b.manifest >= 1 && brain.fade >= 1 && b.alpha > 0.9 && brain.v > 1.95;
        root.toggleAttribute("data-fa-cards", stood);
        if (b) {
          paintTendrils(ctx, b.pl, { k, dpr, tone, now, alpha: b.alpha, grow: b.manifest, cam: b.cam });
          b.draw();
          if (stood) paintRuns(ctx, b.pl, { k, dpr, tone, since: since - 0.6, now, cam: b.cam });
        }
      } else if (phase === 3) {
        // The orbits hold still round the brain's seat; only the brain leans
        // with the pointer (U5).
        const b = brainAt(now);
        if (b) {
          paintRings(ctx, knowledge?.layers ?? [], b.seat, { k, dpr, tone, since, now, light }, false);
          paintTendrils(ctx, b.pl, { k, dpr, tone, now, alpha: b.alpha, grow: b.manifest, cam: b.cam });
          b.draw();
          paintRings(ctx, knowledge?.layers ?? [], b.seat, { k, dpr, tone, since, now, light }, true);
        }
      } else if (phase === 5) {
        // The shoggoth: its tentacles are its tendrils; the smile is
        // particles in the face's plane, over the whole brain (U4).
        const b = brainAt(now);
        if (b) {
          paintTentacles(ctx, b.pl, { k, dpr, tone, since, now, light }, false);
          b.draw();
          paintTentacles(ctx, b.pl, { k, dpr, tone, since, now, light }, true);
          paintSmile(ctx, b.pl, { k, dpr, tone, since, now, light, cam: b.cam });
        }
      } else if (phase === 6) {
        // The layer (U5): the brain turns back to the stack's isometric and
        // parts; the plate prints between its halves (`drawParted`). No
        // hoses, no smile, nothing under it.
        const b = brainAt(now);
        if (b) b.draw();
      } else if (phase === 4 || phase === 7 || phase === 8) {
        // Behind a voice (4, 7), receded; alone (8, ADR-159). After the
        // layer the halves close first; the tendrils wait for the whole.
        const b = brainAt(now);
        if (b) {
          if (brain.apart === 0) paintTendrils(ctx, b.pl, { k, dpr, tone, now, alpha: b.alpha, grow: b.manifest, cam: b.cam });
          b.draw();
        }
      } else if (phase === 9) {
        paintField(ctx, field, { k, dpr, tone, since, now, light });
      }
      if (phase !== 2) root.toggleAttribute("data-fa-cards", false);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    };

    // The film, played as itself: over the viewport with its sound. The
    // theatre is portalled to the body (no stacking context of the page's
    // can sit over it), so it is read at the moment of the click.
    const onPlay = () => {
      const theatre = theatreRef.current;
      const player = playerRef.current;
      const card = cards[facingIdx];
      if (!player || !theatre || !card?.media || card.media.type !== "video") return;
      player.src = card.media.src;
      player.muted = false;
      player.currentTime = 0;
      theatre.toggleAttribute("data-open", true);
      void player.play().catch(() => undefined);
      // U10: full screen ("a simple elegant button where I can show the video
      // full screen"); where the browser refuses, the theatre still fills the
      // viewport.
      void theatre.requestFullscreen?.().catch(() => undefined);
      closeRef.current?.focus();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && theatreRef.current?.hasAttribute("data-open")) closeTheatre();
    };
    // Leaving full screen (Escape included) leaves the theatre with it.
    const onFullscreen = () => {
      if (!document.fullscreenElement && theatreRef.current?.hasAttribute("data-open")) closeTheatre();
    };
    const playBtn = playRef.current;
    playBtn?.addEventListener("click", onPlay);
    window.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", onFullscreen);

    let raf = 0;
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      frame(t);
    };
    size();
    raf = requestAnimationFrame(loop);
    const ro = new ResizeObserver(size);
    ro.observe(canvas);
    const mo = new MutationObserver(size);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => {
      gone = true;
      cancelAnimationFrame(raf);
      if (scrambleRaf) cancelAnimationFrame(scrambleRaf);
      ro.disconnect();
      mo.disconnect();
      playBtn?.removeEventListener("click", onPlay);
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("fullscreenchange", onFullscreen);
      window.removeEventListener("pointermove", onPointer);
      talk?.removeAttribute("data-act");
    };
  }, [cards, n, middle, knowledge, latent, eyebrows, heads, axes]);

  /** Leave the theatre: the film stops and lets go of its source, and full
      screen ends with it. */
  function closeTheatre() {
    const player = playerRef.current;
    player?.pause();
    player?.removeAttribute("src");
    player?.load();
    theatreRef.current?.toggleAttribute("data-open", false);
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
  }
  const client = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );
  const s = FACING.s;
  // U10: the button is the facing card's own PLAY plate, a hit area seated
  // over the drawn plate, so it scales and stands with the card.
  const playAt = {
    left: `${((FACING.x + PLAY.x * s) / VB.w) * 100}%`,
    top: `${((FACING.y + PLAY.y * s) / VB.h) * 100}%`,
    width: `${((PLAY.w * s) / VB.w) * 100}%`,
    height: `${((PLAY.h * s) / VB.h) * 100}%`,
  };
  return (
    <div ref={rootRef} className="fa">
      <div className="fa__box">
        <svg className="fa__svg" viewBox={`0 0 ${VB.w} ${VB.h}`} aria-hidden="true">
          <defs>
            <clipPath id="fa-media">
              <path d={media} />
            </clipPath>
            {/* The glass of the middle beat's cards (ADR-159 U3): a wash of
                the page's ink, lighter at the top, on the ramp's own pair. */}
            <linearGradient id="fa-glass" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" style={{ stopColor: "rgb(var(--dawn-rgb))", stopOpacity: 0.085 }} />
              <stop offset="1" style={{ stopColor: "rgb(var(--dawn-rgb))", stopOpacity: 0.025 }} />
            </linearGradient>
          </defs>
          <g className="fa__stack">
            <g ref={floorRef} className="fa__floor">
              <path className="fa__grid" d={axes.grid} />
              <path className="fa__axis" d={`M${axes.x[0].x} ${axes.x[0].y} L${axes.x[1].x} ${axes.x[1].y}`} />
              <path ref={yAxisRef} className="fa__axis fa__axis--y" />
              <text ref={yNameRef} className="fa__axis-name" textAnchor="end">
                MODEL CAPABILITIES
              </text>
              {cards.map((c, i) => (
                <g key={c.id} ref={(el) => void (tickRefs.current[i] = el)}>
                  <path className="fa__axis" d={`M${axes.ticks[i].x - 6} ${axes.ticks[i].y} L${axes.ticks[i].x + 6} ${axes.ticks[i].y}`} />
                </g>
              ))}
            </g>
            <path ref={leaderRef} className="fa__leader" />
            {cards.map((c, i) => (
              <g key={c.id} data-kind={c.kind}>
                <g ref={(el) => void (trayRefs.current[i] = el)} className="fa__tray">
                  <path d={trayPath} />
                </g>
                <g ref={(el) => void (ghostRefs.current[i] = el)} className="fa__ghost">
                  <path d={chamfer} transform="translate(36 -27)" />
                  <path d={chamfer} transform="translate(24 -18)" />
                </g>
                <g ref={(el) => void (backRefs.current[i] = el)} className="fa__back">
                  <path d={chamfer} />
                </g>
                <path ref={(el) => void (joinRefs.current[i] = el)} className="fa__join" />
                <g ref={(el) => void (sheetRefs.current[i] = el)} className="fa__sheet">
                  <Module card={c} />
                </g>
              </g>
            ))}
          </g>
          {middle ? (
            <g className="fa__cards">
              <SideCard x={SIDE.tool} y={SIDE.y - SIDE.h / 2} spec={middle.tool} kind="tool" />
              <SideCard x={SIDE.collab} y={SIDE.y - SIDE.h / 2} spec={middle.collaborator} kind="collab" />
            </g>
          ) : null}
        </svg>
        <canvas ref={canvasRef} className="fa__dots" aria-hidden="true" />
        {latent ? (
          <figure className="fa__quote" aria-hidden="true">
            <blockquote>{latent.quote}</blockquote>
            <figcaption>{latent.source.label}</figcaption>
          </figure>
        ) : null}
        <button ref={playRef} type="button" className="fa__play" style={playAt} aria-label="Play with sound" />

      </div>
      {/* The head stands on the screen's own top datum, not the scene's
          box (ADR-159 U2, after Linear: "always placed properly on top"). */}
      <div className="fa__head" aria-hidden="true">
        <p className="fa__eyebrow">
          <span ref={eyebrowRef} />
        </p>
        <h3 ref={titleRef} className="fa__title" />
        <p ref={lineRef} className="fa__line" />
      </div>
      {client
        ? createPortal(
            <div
              ref={theatreRef}
              className="fa-theatre"
              role="dialog"
              aria-label="Film"
              onClick={(e) => {
                if (e.target === e.currentTarget) closeTheatre();
              }}
            >
              <video ref={playerRef} className="fa-theatre__video" controls playsInline />
              <button ref={closeRef} type="button" className="fa-theatre__close" onClick={closeTheatre}>
                Close <span aria-hidden="true">×</span>
              </button>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}

/**
 * One example as one module, a full-bleed screen (ADR-159 U10, owner
 * 2026-10-17: "I want a simple elegant button where I can show the video
 * full screen. Maybe that little explanation would be nice but we don't need
 * the date either"): the title and its line in a slim head, the picture
 * filling the rest of the card to its edges and its cut, and on a film one
 * plate, PLAY, at the picture's foot, which opens the film full screen. The
 * survey crosses stand on the card's own corners, as they did before U8.
 */
function Module({ card }: { card: Card }) {
  const film = card.media?.type === "video";
  const maths = card.kind === "mathematics";
  const y = HEAD;
  const h = H - HEAD;
  return (
    <>
      <path className="fa__ground" d={chamfer} />
      <g clipPath="url(#fa-media)">
        {card.media?.type === "image" ? <image href={card.media.src} x={0} y={y} width={W} height={h} preserveAspectRatio="xMidYMid slice" /> : null}
        {film && card.media ? (
          <foreignObject x={0} y={y} width={W} height={h}>
            <video className="fa__video" src={card.media.src} poster={card.media.poster} muted loop autoPlay playsInline preload="metadata" />
          </foreignObject>
        ) : null}
        {maths ? (
          <foreignObject x={0} y={y} width={W} height={h}>
            <MathHoleCanvas />
          </foreignObject>
        ) : null}
      </g>
      {/* No eyebrow on a module (owner, 2026-10-15): the title is the head. */}
      <text className="fa__mod-title" x={PAD} y="44">
        {card.title}
      </text>
      <text className="fa__mod-line" x={PAD} y="69">
        {card.caption}
      </text>
      <path className="fa__inset" d={`M0 ${HEAD} H${W}`} />
      {film ? (
        <g className="fa__play-plate">
          <rect x={PLAY.x} y={PLAY.y} width={PLAY.w} height={PLAY.h} />
          <text x={PLAY.x + PLAY.w / 2} y={PLAY.y + PLAY.h / 2 + 4} textAnchor="middle">
            ▶  PLAY
          </text>
        </g>
      ) : null}
      <path className="fa__edge" d={chamfer} />
      {[
        [0, 0],
        [W, H],
        [0, H],
      ].map(([cx, cy], j) => (
        <path key={j} className="fa__cross" d={`M${cx - 7} ${cy} L${cx + 7} ${cy} M${cx} ${cy - 7} L${cx} ${cy + 7}`} />
      ))}
    </>
  );
}

/** A line set on two, split at the word nearest its middle. */
function twoLines(line: string): [string, string] {
  const words = line.split(" ");
  const split = (i: number): [string, string] => [words.slice(0, i).join(" "), words.slice(i).join(" ")];
  let best = 1;
  for (let i = 2; i < words.length; i++) {
    const [a, b] = split(i);
    const [c, d] = split(best);
    if (Math.abs(a.length - b.length) < Math.abs(c.length - d.length)) best = i;
  }
  return split(best);
}

/** A card of the middle beat, in the modules' own make: a glass slab with
    its name and its one line, read at a glance (U10, owner 2026-10-17: "the
    text on them and the placement are really distracting because they feel
    flat and too small ... skip shit"). The talk's rows are not drawn. */
function SideCard({ x, y, spec, kind }: { x: number; y: number; spec: { label: string; line: string }; kind: "tool" | "collab" }) {
  const w = SIDE.w;
  const h = SIDE.h;
  const outer = chamferPts(w, h, 16, x, y);
  const back = chamferPts(w, h, 16, x + 12, y - 9);
  const [first, second] = twoLines(spec.line);
  return (
    <g className="fa__side" data-kind={kind}>
      <path className="fa__side-back" d={chamferOf(back)} />
      <path className="fa__join" d={outer.map(([px, py]) => `M${px} ${py} l12 -9`).join(" ")} />
      <path className="fa__ground" d={chamferOf(outer)} />
      <path className="fa__edge" d={chamferOf(outer)} />
      {/* The sheen: a hairline of light along the top edge of the glass. */}
      <path className="fa__side-sheen" d={`M${x + 1} ${y + 0.5} L${x + w - 16} ${y + 0.5}`} />
      <text className="fa__side-label" x={x + 24} y={y + 38}>
        {spec.label.toUpperCase()}
      </text>
      <text className="fa__side-title" x={x + 24} y={y + 86}>
        {first}
      </text>
      <text className="fa__side-title" x={x + 24} y={y + 122}>
        {second}
      </text>
      {[
        [x, y],
        [x + w, y + h],
        [x, y + h],
      ].map(([cx, cy], j) => (
        <path key={j} className="fa__cross" d={`M${cx - 6} ${cy} L${cx + 6} ${cy} M${cx} ${cy - 6} L${cx} ${cy + 6}`} />
      ))}
    </g>
  );
}

/** The machined brain's size against the old drawing's units. */
const ISO_S = 1.02;
/** A root's mouth in the viewBox at a frame of the camera's path: a hose
    hangs or a cord leaves here. */
function isoRootAt(pl: Place, i: number, cam: Cam): P2 {
  const roots = rootsAt(cam);
  const [x, y] = roots[i % roots.length];
  return { x: pl.x + x * pl.s * ISO_S, y: pl.y + y * pl.s * ISO_S };
}
/** A point on a hemisphere's outer flank in the viewBox, high, level or low. */
function isoFlankAt(pl: Place, side: -1 | 1, j: number, cam: Cam): P2 {
  const [x, y] = brainIsoFlank(side, j, viewAt(cam));
  return { x: pl.x + x * pl.s * ISO_S, y: pl.y + y * pl.s * ISO_S };
}
/**
 * The tendrils (owner, 2026-10-16): hoses hanging from the roots on the
 * hemispheres' undersides, each falling, swaying and curling at its end,
 * no two the same length or weight, a gold ferrule at its mouth and a plug
 * at its tip. `grow` is the manifest (they lengthen with it); `skip` are
 * the roots a cord uses instead.
 */
function paintTendrils(
  ctx: CanvasRenderingContext2D,
  pl: Place,
  o: { k: number; dpr: number; tone: Tone; now: number; alpha: number; grow: number; cam: Cam; skip?: ReadonlySet<number> }
) {
  const { k, dpr, tone } = o;
  const grow = smooth(o.grow);
  if (grow <= 0 || o.alpha <= 0.01) return;
  ctx.save();
  ctx.lineCap = "round";
  const roots = rootsAt(o.cam);
  for (let i = 0; i < roots.length; i++) {
    if (o.skip?.has(i)) continue;
    const a = isoRootAt(pl, i, o.cam);
    const len = (150 + ((i * 53) % 120)) * pl.s * grow;
    const sway = Math.sin(o.now / 2100 + i * 1.9) * 9 * pl.s;
    const side = i % 2 ? 1 : -1;
    const end = { x: a.x + (i - 3.5) * 10 * pl.s + sway, y: a.y + len };
    const pts = cable(a, end, { x: 0, y: 70 * pl.s * grow }, { x: side * 46 * pl.s, y: -28 * pl.s }, 36);
    const w = (2 + (i % 3) * 0.9) * pl.s;
    // The hose: a soft halo, the body, a thin gold core.
    ctx.strokeStyle = tone.ink;
    ctx.globalAlpha = 0.1 * o.alpha;
    ctx.lineWidth = (w + 5) * dpr;
    strokePath(ctx, pts, k);
    ctx.globalAlpha = 0.62 * o.alpha;
    ctx.lineWidth = w * dpr;
    strokePath(ctx, pts, k);
    ctx.strokeStyle = tone.gold;
    ctx.globalAlpha = 0.55 * o.alpha;
    ctx.lineWidth = Math.max(0.6, w * 0.28) * dpr;
    strokePath(ctx, pts, k);
    // The ferrule at the mouth, the plug at the tip.
    ctx.fillStyle = tone.gold;
    ctx.globalAlpha = 0.95 * o.alpha;
    const f = pts[3];
    ctx.fillRect(f.x * k - 3 * dpr, f.y * k - 4 * dpr, 6 * dpr, 8 * dpr);
    const t = pts[pts.length - 1];
    const r = (w + 2.5) * dpr;
    ctx.fillRect(t.x * k - r / 2, t.y * k - r / 2, r, r);
  }
  ctx.restore();
}

/** Which edge of a plate a cord plugs into. */
type Edge = "right" | "left" | "back";
/** Plate `i`'s socket on one of its edges and the edge's outward direction
    on screen: the right edge (the old one), the left edge (its upper-left
    side on screen), the back edge (its upper-right side). */
function socketAt(i: number, n: number, o: P2, edge: Edge): { at: P2; out: P2 } {
  const u = i / Math.max(1, n - 1);
  if (edge === "right") return { at: plateSocket(i, n, o), out: SCREEN_X };
  if (edge === "left") {
    return { at: proj({ x: i * PLATE.step, y: SHEET.h * (0.25 + 0.5 * u), z: i * PLATE.rise }, o), out: { x: -SCREEN_X.x, y: -SCREEN_X.y } };
  }
  return { at: proj({ x: i * PLATE.step + SHEET.w * (0.3 + 0.4 * u), y: 0, z: i * PLATE.rise }, o), out: { x: SCREEN_X.x, y: -SCREEN_X.y } };
}
/** Which root feeds plate `i`, by which edge (owner, 2026-10-16: "spread
    them out ... so they really touch all the different angles"): the right
    roots round the stack's right side into the right edges, the left roots
    round the left into the left edges, one over the back into the top plate.
    Roots are numbered left to right on screen; root 3 hangs free. */
const CORD_PLAN: readonly { root: number; edge: Edge }[] = [
  { root: 7, edge: "right" },
  { root: 0, edge: "left" },
  { root: 6, edge: "right" },
  { root: 1, edge: "left" },
  { root: 5, edge: "right" },
  { root: 2, edge: "left" },
  { root: 4, edge: "back" },
];
/** How far cord `i` has grown: after the manifest, one after another. */
const cordGrow = (since: number, i: number) => smooth((since - MANIFEST - 0.1 - i * 0.06) / 0.5);

const toneOf = (tone: Tone, name: string) =>
  name === "gold" ? tone.gold : name === "green" ? tone.green : name === "red" ? tone.red : tone.ink;

/**
 * The layer (ADR-159 U5, U6): the swarm page's middle plate, dot for dot,
 * STANDING UPRIGHT (U6). The same lattice (`engine/lattice.ts`), the same
 * population as `dots.ts`'s `layerPop` turned a quarter onto its side: its
 * top is the face that looks at the reader now, the strata run through its
 * thickness and show on its two near edges (the top edge lit, as the near
 * wall was, the end plain), and the mark is cut into the face as `mark.ts`
 * cuts it in `engrave` (the same `coverOf`, read square to the face): the
 * groove sunk to dim gold, the lip that faces the light caught in brighter
 * gold, the field as it stands, the rim lit. The slab is solid: its
 * silhouette takes the ground, so the far half does not show through.
 *
 * In lattice terms the face runs along `i` and up, the thickness along `j`
 * (0 the far face, the plate's floor; `th` the near face, its top). PURE:
 * built once a lattice, in device px from the lattice's origin.
 */
interface LayerDots {
  L: Lattice;
  count: number;
  x: Int32Array;
  y: Int32Array;
  tier: Uint8Array;
  style: Uint8Array;
  /** Its turn when the plate prints, 0..1: row by row up the screen. */
  rank: Float32Array;
  /** The slab's middle, in device px from the lattice's origin. */
  centre: [number, number];
  /** Its thickness, in sites along `j` (the plate's height, on its side). */
  th: number;
  /** The slab's silhouette, in device px from the lattice's origin. */
  outline: [number, number][];
}
function layerDots(L: Lattice): LayerDots {
  const plate = PLATES[1];
  const { m, n } = L;
  const A = L.a * L.g;
  const Bv = L.b * L.g;
  // A point of the slab, `I` along the face, `J` through it, `T` up it.
  const at = (I: number, J: number, T: number): [number, number] => [(I - J) * A, (I + J - 2 * T) * Bv];
  // The thickness and the strata, in the swarm's half-site rows (`kOf`).
  const kt = kOf(L, plate.top);
  const th = kt / 2;
  const rows: number[] = [];
  for (const b of plate.body) {
    const mid = Math.min(kt - 1, kOf(L, (b.z0 + b.z1) / 2));
    rows.push(mid);
    if (n >= 4 && mid + 1 < kt) rows.push(mid + 1);
  }
  const raw: { x: number; y: number; tier: number; style: number }[] = [];
  const push = ([x, y]: [number, number], tier: number, style: number) => raw.push({ x: Math.round(x), y: Math.round(y), tier, style });
  for (const kk of new Set(rows)) {
    const J = kk / 2;
    for (let I = 0; I <= m; I++) push(at(I, J, m), 2, STYLE.layerLit);
    for (let T = 0; T < m; T++) push(at(m, J, T), 1, STYLE.layer);
  }
  const c = PLATE_SIDE / 2;
  const half = m / 2;
  const cover = coverOf(m);
  // The mark square to the face: across the face is `I`, up it is `T`.
  const face = (I: number, T: number) => {
    const X = I - half;
    const Y = half - T;
    return cover(half + (X + Y) / Math.SQRT2, half + (Y - X) / Math.SQRT2);
  };
  const on = (I: number, T: number) => face(I, T) >= COVER;
  // The light from the top left of the screen: on the face, less `I`.
  const lit = (I: number, T: number) => face(I - LIP_REACH, T) - face(I + LIP_REACH, T);
  for (let I = 0; I <= m; I++) {
    for (let T = 0; T <= m; T++) {
      const rim = I === 0 || I === m || T === 0 || T === m;
      const r = Math.hypot(I / n - c, T / n - c);
      const [tier, style] = rim ? [2, STYLE.layerLit] : engraved(on(I, T), lit(I, T), [r < 3.5 ? 2 : 1, STYLE.layer]);
      push(at(I, th, T), tier, style);
    }
  }
  const order = raw.map((_, i) => i).sort((p, q) => raw[q].y - raw[p].y || raw[p].x - raw[q].x);
  const out: LayerDots = {
    L,
    count: raw.length,
    x: new Int32Array(raw.length),
    y: new Int32Array(raw.length),
    tier: new Uint8Array(raw.length),
    style: new Uint8Array(raw.length),
    rank: new Float32Array(raw.length),
    centre: at(half, th / 2, half),
    th,
    outline: [at(0, th, 0), at(m, th, 0), at(m, 0, 0), at(m, 0, m), at(0, 0, m), at(0, th, m)],
  };
  raw.forEach((d, i) => {
    out.x[i] = d.x;
    out.y[i] = d.y;
    out.tier[i] = d.tier;
    out.style[i] = d.style;
  });
  order.forEach((i, r) => {
    out.rank[i] = order.length > 1 ? r / (order.length - 1) : 0;
  });
  return out;
}
/** The plate on the canvas, its middle at `cx, cy` (device px), printed
    `printed` of the way from its foot up, in the page's tones, at `alpha`. */
function paintLayer(ctx: CanvasRenderingContext2D, D: LayerDots, o: { cx: number; cy: number; tones: Tones; printed: number; alpha: number }) {
  if (o.printed <= 0 || o.alpha <= 0) return;
  const pal = paletteOf([1, 1, 1], o.tones);
  const sizes = tierSizes(D.L);
  const ox = Math.round(o.cx - D.centre[0]);
  const oy = Math.round(o.cy - D.centre[1]);
  // The slab's body, risen as far as it has printed, in the page's ground.
  const pad = sizes[2];
  const ys = D.outline.map(([, y]) => y);
  const y0 = Math.min(...ys) - pad;
  const y1 = Math.max(...ys) + pad;
  const cut = y1 - (y1 - y0) * Math.min(1, o.printed * 1.15);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, oy + cut, ctx.canvas.width, oy + y1 - (oy + cut) + 1);
  ctx.clip();
  ctx.beginPath();
  D.outline.forEach(([x, y], i) => {
    const cx = ox + x + Math.sign(x - D.centre[0]) * pad;
    const cy = oy + y + Math.sign(y - D.centre[1]) * pad;
    if (i) ctx.lineTo(cx, cy);
    else ctx.moveTo(cx, cy);
  });
  ctx.closePath();
  ctx.globalAlpha = o.alpha;
  ctx.fillStyle = `rgb(${o.tones.ground.join(", ")})`;
  ctx.fill();
  ctx.restore();
  ctx.globalAlpha = o.alpha;
  let style = -1;
  for (let d = 0; d < D.count; d++) {
    if (D.rank[d] > o.printed) continue;
    if (D.style[d] !== style) {
      style = D.style[d];
      ctx.fillStyle = pal[style];
    }
    const size = sizes[D.tier[d]];
    ctx.fillRect(ox + D.x[d] - (size >> 1), oy + D.y[d] - (size >> 1), size, size);
  }
  ctx.globalAlpha = 1;
}

/**
 * The layer's tendrils (U7) on the canvas, one side's files: their standing
 * dots grown from the slab `grown` of the way, a plug where each meets its
 * wall, and two walkers a file running from the slab into the brain, the
 * swarm's palette and dot sizes. The slab's own lattice frame (`ox`, `oy`).
 */
function paintFiles(
  ctx: CanvasRenderingContext2D,
  files: readonly TendrilFile[],
  side: TendrilFile["side"],
  o: { ox: number; oy: number; grown: number; now: number; tones: Tones; alpha: number; L: Lattice }
) {
  if (o.grown <= 0 || o.alpha <= 0) return;
  const pal = paletteOf([1, 1, 1], o.tones);
  const sizes = tierSizes(o.L);
  const dot = (pts: Int32Array, i: number, size: number) => ctx.fillRect(o.ox + pts[2 * i] - (size >> 1), o.oy + pts[2 * i + 1] - (size >> 1), size, size);
  ctx.globalAlpha = o.alpha;
  files.forEach((f, which) => {
    if (f.side !== side) return;
    const n = f.pts.length / 2;
    const shown = Math.min(n, Math.ceil(n * o.grown));
    ctx.fillStyle = pal[STYLE.layerDim];
    for (let i = 0; i < shown; i++) dot(f.pts, i, sizes[1]);
    if (shown < n) return;
    ctx.fillStyle = pal[STYLE.layerLit];
    dot(f.pts, n - 1, sizes[3]);
    // the walkers: a lit head and two dots of tail, slab to wall
    for (const phase of [0, 0.5]) {
      const head = Math.floor((((o.now / 1000) * 7) / n + phase + which * 0.13) % 1 * n);
      ctx.fillStyle = pal[STYLE.layer];
      for (let t = 1; t <= 2; t++) if (head - t >= 0) dot(f.pts, head - t, sizes[2]);
      ctx.fillStyle = pal[STYLE.layerLit];
      dot(f.pts, head, sizes[3]);
    }
  });
  ctx.globalAlpha = 1;
}

/** A tone at an alpha: the tones are the sheet's `rgb()` / `rgba()` strings. */
function withAlpha(col: string, a: number): string {
  const m = /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/.exec(col);
  return m ? `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${a})` : col;
}

/**
 * The smile (ADR-159 U4, owner: "it doesn't really look like a smiley face
 * so I don't want a frame around it. I just want to use a particle system to
 * create a smiley face"): two closed, happy eyes and a smile as gold
 * particles in the brain's front plane, each with a soft glow, drifting a
 * little and breathing; no panel, no bezel. Drawn over the whole brain.
 */
const SMILE_F = 150;
const SMILE_STROKES: readonly { c: [number, number]; r: number; a0: number; a1: number; n: number }[] = [
  { c: [-28, 76], r: 12, a0: 0.15 * Math.PI, a1: 0.85 * Math.PI, n: 16 },
  { c: [28, 76], r: 12, a0: 0.15 * Math.PI, a1: 0.85 * Math.PI, n: 16 },
  { c: [0, 54], r: 38, a0: 1.18 * Math.PI, a1: 1.82 * Math.PI, n: 44 },
];
function paintSmile(ctx: CanvasRenderingContext2D, pl: Place, o: { k: number; dpr: number; tone: Tone; since: number; now: number; light: boolean; cam: Cam }) {
  const { k, tone } = o;
  const show = smooth((o.since - 0.8) / 0.9);
  if (show <= 0) return;
  const view = viewAt(o.cam);
  ctx.save();
  ctx.globalCompositeOperation = o.light ? "source-over" : "lighter";
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
  // Each sample of a stroke is three particles: one near the line and two
  // scattered off it, dimmer, so the face is a cloud that happens to be a
  // face (U5, owner: "too bloomy and too bright ... spread the particles
  // around a bit so it really feels like a face made out of particles").
  let i = 0;
  for (const s of SMILE_STROKES) {
    for (let j = 0; j <= s.n; j++) {
      const t = s.a0 + ((s.a1 - s.a0) * j) / s.n;
      const cl = s.c[0] + s.r * Math.cos(t);
      const cz = s.c[1] + s.r * Math.sin(t);
      for (let q = 0; q < 3; q++, i++) {
        const spread = q === 0 ? 2.6 : 8;
        const drift = Math.sin(o.now / 1700 + i * 1.3) * (q === 0 ? 1 : 2);
        const l = cl + rnd() * spread + drift;
        const z = cz + rnd() * spread;
        const [x, y] = brainIsoPoint(l, SMILE_F, z, view);
        const px = pl.x + x * pl.s * ISO_S;
        const py = pl.y + y * pl.s * ISO_S;
        const r = (q === 0 ? 0.9 + Math.abs(rnd()) * 0.7 : 0.55 + Math.abs(rnd()) * 0.5) * pl.s;
        const weight = q === 0 ? 1 : 0.45;
        const glow = ctx.createRadialGradient(px * k, py * k, 0, px * k, py * k, r * 2.4 * k);
        glow.addColorStop(0, withAlpha(tone.lit, 0.1 * weight));
        glow.addColorStop(1, withAlpha(tone.lit, 0));
        ctx.globalAlpha = show;
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(px * k, py * k, r * 2.4 * k, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = (0.42 + 0.18 * Math.sin(o.now / 900 + i)) * weight * show;
        ctx.fillStyle = tone.lit;
        ctx.fillRect(px * k - r * k, py * k - r * k, 2 * r * k, 2 * r * k);
      }
    }
  }
  ctx.restore();
}

function strokePath(ctx: CanvasRenderingContext2D, pts: P2[], k: number, upto = pts.length - 1) {
  ctx.beginPath();
  ctx.moveTo(pts[0].x * k, pts[0].y * k);
  for (let j = 1; j <= upto; j++) ctx.lineTo(pts[j].x * k, pts[j].y * k);
  ctx.stroke();
}

/** The cords: from the roots under the brain out and round into every
    plate, from three sides. */
function paintCords(
  ctx: CanvasRenderingContext2D,
  pl: Place,
  o: { k: number; dpr: number; tone: Tone; since: number; now: number; n: number; a: number; alpha: number; cam: Cam }
) {
  const { k, dpr, tone, n } = o;
  for (let i = 0; i < n; i++) {
    const cord = CORDS[i % CORDS.length];
    const plan = CORD_PLAN[i % CORD_PLAN.length];
    const from = isoRootAt(pl, plan.root, o.cam);
    const { at: to, out } = socketAt(i, n, plateOrigin(i, o.a), plan.edge);
    const reachOut = 80 + i * 22;
    // Down out of the brain first, then round the stack's side and in from
    // outside the plate's edge: a cord never crosses a plate's face.
    const dir = plan.edge === "left" ? -1 : 1;
    const da = plan.edge === "back" ? { x: 0, y: 90 } : { x: dir * (60 + i * 26), y: 110 };
    const pts = cable(from, to, da, { x: out.x * reachOut, y: out.y * reachOut }, 40);
    const grow = cordGrow(o.since, i);
    if (grow <= 0) continue;
    const upto = Math.max(1, Math.floor(grow * (pts.length - 1)));
    const col = toneOf(tone, cord.tone);
    ctx.strokeStyle = col;
    ctx.lineCap = "round";
    if (cord.w > 2) {
      ctx.globalAlpha = 0.16 * o.alpha;
      ctx.lineWidth = (cord.w + 5) * dpr;
      strokePath(ctx, pts, k, upto);
    }
    ctx.globalAlpha = 0.95 * o.alpha;
    ctx.lineWidth = cord.w * dpr;
    strokePath(ctx, pts, k, upto);
    ctx.lineCap = "butt";
    if (grow >= 1) {
      const end = pts[pts.length - 1];
      const s = (cord.w + 5) * dpr;
      ctx.fillStyle = col;
      ctx.fillRect(end.x * k - s / 2, end.y * k - s / 2, s, s);
      for (const off of [0, 0.34, 0.67]) {
        const t = (o.now / (1300 + i * 170) + off + i * 0.11) % 1;
        const q = pts[Math.floor(t * (pts.length - 1))];
        const r = (cord.w + 2.5) * dpr;
        ctx.globalAlpha = o.alpha;
        ctx.fillRect(q.x * k - r / 2, q.y * k - r / 2, r, r);
      }
    }
  }
}

/** The middle beat's runs: from the brain's left to the tool's card, squared
    as a board routes; from its right to the collaborator's, loose streams of
    particles running both ways. */
function paintRuns(ctx: CanvasRenderingContext2D, pl: Place, o: { k: number; dpr: number; tone: Tone; since: number; now: number; cam: Cam }) {
  const { k, dpr, tone } = o;
  const grow = smooth(o.since / 0.8);
  if (grow <= 0) return;
  const widths = [2.2, 1.2, 1.8];
  const pinY = [-40, 0, 40];
  for (let j = 0; j < 3; j++) {
    const a = isoFlankAt(pl, -1, j, o.cam);
    const end = { x: SIDE.tool + SIDE.w + 1, y: SIDE.y + pinY[j] };
    const bend = (a.x + end.x) / 2 + (j - 1) * 14;
    const pts: P2[] = [a, { x: bend, y: a.y }, { x: bend, y: end.y }, end];
    const dense: P2[] = [];
    for (let s = 0; s + 1 < pts.length; s++) {
      for (let q = 0; q < 12; q++) dense.push({ x: lerp(pts[s].x, pts[s + 1].x, q / 12), y: lerp(pts[s].y, pts[s + 1].y, q / 12) });
    }
    dense.push(end);
    ctx.strokeStyle = tone.gold;
    ctx.fillStyle = tone.gold;
    ctx.globalAlpha = 0.95;
    ctx.lineWidth = widths[j] * dpr;
    strokePath(ctx, dense, k, Math.max(1, Math.floor(grow * (dense.length - 1))));
    if (grow >= 1) {
      ctx.fillRect(end.x * k - 3 * dpr, end.y * k - 3 * dpr, 6 * dpr, 6 * dpr);
      for (const off of [0, 0.5]) {
        const t = (o.now / 1500 + off + j * 0.2) % 1;
        const q = dense[Math.floor(t * (dense.length - 1))];
        const r = (widths[j] + 3) * dpr;
        ctx.fillRect(q.x * k - r / 2, q.y * k - r / 2, r, r);
      }
    }
  }
  for (let j = 0; j < 3; j++) {
    const a = isoFlankAt(pl, 1, j, o.cam);
    const end = { x: SIDE.collab - 1, y: SIDE.y + pinY[j] };
    const pts = cable(a, end, { x: 80, y: (j - 1) * 60 }, { x: -80, y: (1 - j) * 30 }, 40);
    const col = j === 1 ? tone.ink : tone.green;
    ctx.strokeStyle = col;
    ctx.fillStyle = col;
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = 1 * dpr;
    strokePath(ctx, pts, k, Math.max(1, Math.floor(grow * (pts.length - 1))));
    if (grow < 1) continue;
    ctx.globalAlpha = 0.9;
    ctx.fillRect(end.x * k - 3 * dpr, end.y * k - 3 * dpr, 6 * dpr, 6 * dpr);
    for (let s = 0; s < 20; s++) {
      const dir = s % 2 ? 1 : -1;
      const base = (s / 20 + (dir * o.now) / (5200 + j * 600)) % 1;
      const t = base < 0 ? base + 1 : base;
      const q = pts[Math.floor(t * (pts.length - 1))];
      const jx = 3.5 * Math.sin(s * 12.9 + o.now / 600);
      const jy = 3.5 * Math.cos(s * 7.3 + o.now / 700);
      const r = (1.4 + (s % 3) * 0.7) * dpr;
      ctx.globalAlpha = 0.85;
      ctx.fillRect((q.x + jx) * k - r / 2, (q.y + jy) * k - r / 2, r, r);
    }
  }
}

/**
 * Every desk: three orbits of knowledge work round the brain, as a game
 * draws them (owner, 2026-10-16: "the orbits are pretty flat, whereas our
 * brain feels more 3D ... video-game-style physics so they rotate around
 * it"). Each ring is a circle in its own plane in 3D: tilted out of the
 * screen by its own angle, rolled off the horizontal by another, the plane
 * precessing slowly; the nodes run round it at a game's pace, the inner the
 * fastest, each way in turn. A simple perspective sets every point's size
 * and weight by its depth. Drawn in two passes: what lies behind the brain
 * under it, what lies before it over it, split by depth at every point.
 */
const ORBITS = [
  { tilt: 1.2, roll: 0.0, prec: 70000, spin: 52000, dir: 1 },
  { tilt: 1.0, roll: 0.42, prec: -95000, spin: 86000, dir: -1 },
  { tilt: 0.9, roll: -0.55, prec: 120000, spin: 128000, dir: 1 },
] as const;
/** The radii, held so the outer ring's near run stays inside the scene's
    box (U5: "the bottom part of the dotted-line orbits is cut off"). */
const ORBIT_RX = [300, 410, 500] as const;
/** The eye's distance, in viewBox px: the near side of a ring grows, the far
    side shrinks, enough to read as depth and not enough to leave the box. */
const ORBIT_EYE = 2600;
/** The arrival (U5, owner: "not with a simple opacity reveal, but by really
    starting to orbit around them with a nice speed ramp, not too fast"): the
    planets swing in through this much of a turn, decelerating into their
    cruise, while each ring draws on behind them. */
const ORBIT_BURST = 1.1;
function paintRings(
  ctx: CanvasRenderingContext2D,
  layers: readonly { label: string; domains: readonly string[] }[],
  pl: Place,
  o: { k: number; dpr: number; tone: Tone; since: number; now: number; light: boolean },
  near: boolean
) {
  const { k, dpr, tone } = o;
  const cy = pl.y + 10;
  /** A point of ring `li` at its angle `t`, in the viewBox, with its depth. */
  const at = (li: number, t: number): { x: number; y: number; z: number; sc: number } => {
    const O = ORBITS[li];
    const r = ORBIT_RX[li];
    const roll = O.roll + 0.12 * Math.sin(o.now / O.prec);
    const x0 = r * Math.cos(t);
    const y0 = r * Math.sin(t) * Math.cos(O.tilt);
    const z = r * Math.sin(t) * Math.sin(O.tilt);
    const x = x0 * Math.cos(roll) - y0 * Math.sin(roll);
    const y = x0 * Math.sin(roll) + y0 * Math.cos(roll);
    const sc = ORBIT_EYE / (ORBIT_EYE - z);
    return { x: pl.x + x * sc, y: cy + y * sc, z, sc };
  };
  ctx.save();
  ctx.globalCompositeOperation = o.light ? "source-over" : "lighter";
  ctx.font = `${11 * k}px "PT Mono", ui-monospace, monospace`;
  layers.forEach((layer, li) => {
    const start = 0.2 + li * 0.3;
    const show = smooth((o.since - start) / 0.4);
    if (show <= 0) return;
    const zmax = ORBIT_RX[li] * Math.sin(ORBITS[li].tilt);
    const O = ORBITS[li];
    const ringCol = li === 0 ? tone.gold : tone.ink;
    /* The planets' swing in, decelerating; the ring drawn on behind them. */
    const t0 = Math.max(0, o.since - start);
    const swing = ORBIT_BURST * (1 - Math.exp(-t0 / 1.1));
    const drawn = smooth(t0 / 1.6);
    const aStart = li * 0.4 + Math.PI * 0.5;
    // The ring: the runs of it on this side of the brain, as far as drawn.
    ctx.strokeStyle = ringCol;
    ctx.lineWidth = (li === 0 ? 1.3 : 1) * dpr;
    ctx.setLineDash(li === 2 ? [3 * dpr, 6 * dpr] : []);
    ctx.globalAlpha = (near ? 0.75 : 0.22) * show * (li === 2 ? 0.8 : 1);
    ctx.beginPath();
    let pen = false;
    const steps = Math.round(144 * drawn);
    for (let j = 0; j <= steps; j++) {
      const q = at(li, aStart + O.dir * (j / 144) * Math.PI * 2);
      if ((q.z >= 0) !== near) {
        pen = false;
        continue;
      }
      if (pen) ctx.lineTo(q.x * k, q.y * k);
      else ctx.moveTo(q.x * k, q.y * k);
      pen = true;
    }
    ctx.stroke();
    ctx.setLineDash([]);
    if (near && li > 0 && drawn >= 1) {
      // A soft light under the near run (U4: "some subtle light effects"),
      // and a glint travelling the ring ahead of its planets.
      ctx.globalAlpha = 0.07 * show;
      ctx.lineWidth = (li === 0 ? 9 : 7) * dpr;
      ctx.stroke();
      const ga = (o.now / (O.spin * 0.55)) * O.dir + li * 1.7;
      ctx.beginPath();
      let on = false;
      for (let j = -7; j <= 7; j++) {
        const q = at(li, ga + j * 0.011);
        if (q.z < 0) {
          on = false;
          continue;
        }
        if (on) ctx.lineTo(q.x * k, q.y * k);
        else ctx.moveTo(q.x * k, q.y * k);
        on = true;
      }
      ctx.strokeStyle = tone.lit;
      ctx.lineWidth = (li === 0 ? 2.2 : 1.6) * dpr;
      ctx.globalAlpha = 0.5 * show;
      ctx.stroke();
    }
    // Its nodes and their names, running round it. The two outer orbits
    // carry small planets, each a body lit from the upper left with a soft
    // glow (U4); the inner, gold orbit keeps its plain lit marks (U5, owner:
    // "just restore the yellow ones ... the rest is fine").
    const m = layer.domains.length;
    layer.domains.forEach((d, j) => {
      const t = (j / m) * Math.PI * 2 + ((o.now / O.spin) + swing) * O.dir + li * 0.4;
      const q = at(li, t);
      if ((q.z >= 0) !== near) return;
      const depth = 0.35 + 0.65 * ((q.z / zmax + 1) / 2);
      const col = li === 0 ? tone.lit : tone.ink;
      let reach = 10;
      if (li === 0) {
        ctx.globalAlpha = show * depth;
        ctx.fillStyle = col;
        const r = 4 * q.sc * dpr;
        ctx.fillRect(q.x * k - r / 2, q.y * k - r / 2, r, r);
      } else {
        const R = 4 * q.sc;
        reach = R * 2.4 + 4;
        const glow = ctx.createRadialGradient(q.x * k, q.y * k, 0, q.x * k, q.y * k, R * 3 * k);
        glow.addColorStop(0, withAlpha(col, 0.26));
        glow.addColorStop(1, withAlpha(col, 0));
        ctx.globalAlpha = show * depth;
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(q.x * k, q.y * k, R * 3 * k, 0, Math.PI * 2);
        ctx.fill();
        const body = ctx.createRadialGradient((q.x - R * 0.35) * k, (q.y - R * 0.35) * k, 0, q.x * k, q.y * k, R * k);
        body.addColorStop(0, withAlpha(col, 1));
        body.addColorStop(0.55, withAlpha(col, 0.85));
        body.addColorStop(1, withAlpha(col, 0.18));
        ctx.fillStyle = body;
        ctx.beginPath();
        ctx.arc(q.x * k, q.y * k, R * k, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = show * depth * 0.9;
      ctx.fillStyle = ringCol;
      const left = q.x < pl.x;
      ctx.textAlign = left ? "right" : "left";
      ctx.fillText(d.toUpperCase(), (q.x + (left ? -reach : reach)) * k, (q.y + 4) * k);
    });
    // The ring's name, in the legend under the figure.
    if (near) {
      const lx = pl.x - 260 + li * 190;
      const ly = 700;
      ctx.globalAlpha = 0.8 * show;
      ctx.strokeStyle = li === 0 ? tone.gold : tone.ink;
      ctx.lineWidth = (li === 0 ? 1.3 : 1) * dpr;
      ctx.setLineDash(li === 2 ? [3 * dpr, 6 * dpr] : []);
      ctx.beginPath();
      ctx.moveTo(lx * k, ly * k);
      ctx.lineTo((lx + 36) * k, ly * k);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = li === 0 ? tone.gold : tone.ink;
      ctx.textAlign = "left";
      ctx.fillText(layer.label.toUpperCase(), (lx + 46) * k, (ly + 4) * k);
    }
  });
  ctx.restore();
}

/**
 * The shoggoth's tentacles, as articulated arms (U5, owner: "a bit too
 * organic. Can we make it a bit more robotic? It can be wetware or
 * biomechanical"): twelve from under and around the brain, each a chain of
 * straight links tapering to its tip, a collar at every joint, a thin gold
 * core running through, a plug at the end; the same slow wave runs out
 * along the chain, but it bends only at the joints. Far ones first, under
 * the brain.
 */
function paintTentacles(ctx: CanvasRenderingContext2D, pl: Place, o: { k: number; dpr: number; tone: Tone; since: number; now: number; light: boolean }, near: boolean) {
  const { k, dpr, tone } = o;
  const grow = smooth((o.since - 0.6) / 1.6);
  if (grow <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = o.light ? "source-over" : "lighter";
  ctx.lineCap = "butt";
  const N = 12;
  const JOINTS = 11;
  for (let i = 0; i < N; i++) {
    const isNear = i % 3 !== 0;
    if (isNear !== near) continue;
    // Roots along the brain's underside, fanning out.
    const u = i / (N - 1);
    const root = isNear
      ? { x: pl.x + (u - 0.5) * 300 * pl.s, y: pl.y + (110 + 70 * Math.sin(u * Math.PI)) * pl.s }
      : { x: pl.x + (u - 0.5) * 380 * pl.s, y: pl.y - 40 * pl.s };
    const ang0 = isNear ? Math.PI / 2 - (u - 0.5) * 3.0 : -Math.PI / 2 + (u - 0.5) * 2.8;
    const len = (isNear ? 400 + 150 * Math.sin(i * 2.3) : 320 + 80 * Math.cos(i)) * pl.s * grow;
    const step = len / JOINTS;
    const pts: P2[] = [root];
    let p = root;
    for (let s = 1; s <= JOINTS; s++) {
      const f = s / JOINTS;
      // The heading is set at each joint, not summed: a wave travels out
      // along the arm and the tip curls, but the fan holds.
      const ang = ang0 + 0.3 * Math.sin(o.now / 1500 - f * 5 + i * 1.3) * (0.25 + f) + (f > 0.55 ? (i % 2 ? 1 : -1) * (f - 0.55) * 2.4 : 0);
      p = { x: p.x + Math.cos(ang) * step, y: p.y + Math.sin(ang) * step };
      pts.push(p);
    }
    const base = (isNear ? 9 : 6) * pl.s;
    const dim = isNear ? 1 : 0.5;
    for (let s = 1; s < pts.length; s++) {
      const f = s / JOINTS;
      const w = base * (1 - 0.8 * f) + 1.2;
      const a = pts[s - 1];
      const b = pts[s];
      // The link, a shade shorter than the joint to joint, so the collar
      // reads as a hinge between two parts.
      const gap = 0.1;
      const ax = a.x + (b.x - a.x) * gap;
      const ay = a.y + (b.y - a.y) * gap;
      const bx = b.x - (b.x - a.x) * gap;
      const by = b.y - (b.y - a.y) * gap;
      ctx.strokeStyle = tone.ink;
      ctx.globalAlpha = 0.34 * dim * (1 - 0.4 * f);
      ctx.lineWidth = w * dpr;
      ctx.beginPath();
      ctx.moveTo(ax * k, ay * k);
      ctx.lineTo(bx * k, by * k);
      ctx.stroke();
      // The core, gold, the whole way.
      ctx.strokeStyle = tone.gold;
      ctx.globalAlpha = 0.55 * dim * (1 - 0.3 * f);
      ctx.lineWidth = Math.max(0.6, w * 0.22) * dpr;
      ctx.beginPath();
      ctx.moveTo(a.x * k, a.y * k);
      ctx.lineTo(b.x * k, b.y * k);
      ctx.stroke();
      // The collar at the joint: a short bar across the arm.
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const l = Math.hypot(dx, dy) || 1;
      const nx = -dy / l;
      const ny = dx / l;
      const cw = w * 0.75;
      ctx.strokeStyle = tone.gold;
      ctx.globalAlpha = 0.8 * dim * (1 - 0.3 * f);
      ctx.lineWidth = 1.6 * dpr;
      ctx.beginPath();
      ctx.moveTo((a.x - nx * cw) * k, (a.y - ny * cw) * k);
      ctx.lineTo((a.x + nx * cw) * k, (a.y + ny * cw) * k);
      ctx.stroke();
    }
    // The plug at the tip.
    const tip = pts[pts.length - 1];
    const pr = (2.4 + 1.2 * dim) * pl.s;
    ctx.fillStyle = tone.gold;
    ctx.globalAlpha = 0.9 * dim;
    ctx.fillRect(tip.x * k - pr * k, tip.y * k - pr * k, 2 * pr * k, 2 * pr * k);
  }
  ctx.restore();
}

/** Latent space: points in depth, in clusters, and the named nodes among
    them, each tied to its nearest neighbours. */
type Field = { pts: { x: number; y: number; z: number; c: number }[]; nodes: { i: number; name: string; near: number[] }[] };
function latentField(names: readonly string[]): Field {
  let seed = 9;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-9)) * Math.cos(2 * Math.PI * rnd());
  const centres = Array.from({ length: 11 }, () => ({ x: (rnd() - 0.5) * 2.8, y: (rnd() - 0.5) * 1.2, z: (rnd() - 0.5) * 2.4 }));
  const pts = Array.from({ length: 1600 }, () => {
    const c = Math.floor(rnd() * centres.length);
    const s = 0.16 + rnd() * 0.18;
    return { x: centres[c].x + gauss() * s, y: centres[c].y + gauss() * s * 0.7, z: centres[c].z + gauss() * s, c };
  });
  const nodes = names.map((name, j) => {
    const i = Math.floor((j + 0.5) * (pts.length / names.length));
    const p = pts[i];
    const near = pts
      .map((q, qi) => ({ qi, d: (q.x - p.x) ** 2 + (q.y - p.y) ** 2 + (q.z - p.z) ** 2 }))
      .sort((a, b) => a.d - b.d)
      .slice(1, 6)
      .map((x) => x.qi);
    return { i, name, near };
  });
  return { pts, nodes };
}

function paintField(ctx: CanvasRenderingContext2D, f: Field, o: { k: number; dpr: number; tone: Tone; since: number; now: number; light: boolean }) {
  const { k, dpr, tone } = o;
  const show = smooth(o.since / 1.2);
  const yaw = o.now / 26000;
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const C = { x: 720, y: 430 };
  const S = 330;
  const proj = (p: { x: number; y: number; z: number }) => {
    const x = p.x * cy - p.z * sy;
    const z = p.x * sy + p.z * cy;
    const persp = 3.2 / (3.2 - z);
    return { x: C.x + x * S * persp, y: C.y + p.y * S * persp, z, persp };
  };
  ctx.save();
  ctx.globalCompositeOperation = o.light ? "source-over" : "lighter";
  const P = f.pts.map(proj);
  // The ties first, faint.
  ctx.strokeStyle = tone.gold;
  ctx.lineWidth = 0.7 * dpr;
  for (const n of f.nodes) {
    const a = P[n.i];
    for (const qi of n.near) {
      const b = P[qi];
      ctx.globalAlpha = 0.35 * show;
      ctx.beginPath();
      ctx.moveTo(a.x * k, a.y * k);
      ctx.lineTo(b.x * k, b.y * k);
      ctx.stroke();
    }
  }
  // The field, faded with depth, and kept quiet round the line at its centre.
  for (let i = 0; i < P.length; i++) {
    const q = P[i];
    const dx = (q.x - C.x) / 380;
    const dy = (q.y - C.y) / 150;
    const hush = Math.min(1, Math.sqrt(dx * dx + dy * dy));
    ctx.globalAlpha = show * (0.15 + 0.6 * ((q.z + 1.4) / 2.8)) * (0.25 + 0.75 * hush);
    ctx.fillStyle = f.pts[i].c % 3 === 0 ? tone.gold : tone.ink;
    const r = 1.6 * q.persp * dpr;
    ctx.fillRect(q.x * k - r / 2, q.y * k - r / 2, r, r);
  }
  // The named nodes: a ring, a point, a name.
  ctx.font = `${11 * k}px "PT Mono", ui-monospace, monospace`;
  for (const n of f.nodes) {
    const q = P[n.i];
    const dx = (q.x - C.x) / 300;
    const dy = (q.y - C.y) / 140;
    const clear = smooth((Math.sqrt(dx * dx + dy * dy) - 0.9) / 0.4);
    if (clear <= 0) continue;
    ctx.globalAlpha = show * clear;
    ctx.strokeStyle = tone.lit;
    ctx.lineWidth = 1.2 * dpr;
    ctx.beginPath();
    ctx.arc(q.x * k, q.y * k, 7 * q.persp * k, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = tone.lit;
    ctx.fillRect(q.x * k - 2 * dpr, q.y * k - 2 * dpr, 4 * dpr, 4 * dpr);
    ctx.globalAlpha = show * 0.9 * clear;
    ctx.fillStyle = tone.ink;
    ctx.textAlign = "left";
    ctx.fillText(n.name.toUpperCase(), (q.x + 12) * k, (q.y + 4) * k);
  }
  ctx.restore();
}

/**
 * The mathematics card's picture (U8, U9): the black hole of mathematics on
 * a terminal (`mathHole.ts`), live in the card's media rect. It runs only
 * while the act is up, and rasterises at the size the card is drawn on
 * screen, so the characters stay sharp on the facing card. Its cells are
 * the page's mono, `HOLE_CELL` CSS px high.
 */
const HOLE_CELL = 9;
function MathHoleCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const parts = holeSeed();
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const act = c.closest(".fa");
    let raf = 0;
    let last = performance.now();
    let frame = 0;
    let scale = 1;
    let screen: HoleScreen | null = null;
    let screenKey = "";
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      if (act && !act.hasAttribute("data-fa-up")) return;
      const w = c.clientWidth;
      const h = c.clientHeight;
      if (!w || !h) return;
      // the card is drawn scaled: rasterise at its size on screen
      if (frame++ % 30 === 0) scale = Math.max(1, Math.min(3, c.getBoundingClientRect().width / w));
      const dpr = Math.min(window.devicePixelRatio || 1, 2) * scale;
      const W = Math.round(w * dpr);
      const H = Math.round(h * dpr);
      if (c.width !== W || c.height !== H) {
        c.width = W;
        c.height = H;
      }
      const cs = getComputedStyle(c);
      const font = cs.fontFamily || '"PT Mono", ui-monospace, monospace';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // the grid: the mono's own advance at the cell's size
      const key = `${w}|${h}|${font}`;
      if (!screen || key !== screenKey) {
        ctx.font = `${Math.round(HOLE_CELL * 0.92)}px ${font}`;
        screen = holeScreen(w, h, HOLE_CELL, Math.max(4, ctx.measureText("M").width));
        screenKey = key;
      }
      if (!still) holeStep(parts, dt);
      paintHole(
        ctx,
        parts,
        screen,
        w,
        h,
        {
          ground: cs.backgroundColor || "rgb(5, 4, 3)",
          ink: cs.color || "rgb(235, 227, 214)",
          gold: cs.getPropertyValue("--fa-hole-gold").trim() || "#caa554",
        },
        font,
        t,
        still ? 0 : dt,
        // a larger horizon, the disk running past the frame and lying open
        // enough to read as a disk in cells this size; the prompt in from the
        // card's cut corner, on the card's own margin
        { size: 0.105, tilt: 0.34, inset: PAD }
      );
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <canvas
      ref={ref}
      className="fa__hole"
      role="img"
      aria-label="A black hole made of mathematics on a terminal: an accretion disk of characters falling into a blank horizon ringed in gold, the card's equations typed at a prompt"
    />
  );
}
