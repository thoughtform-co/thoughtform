"use client";

/**
 * ShellNewsOrbit — the four "billions on the same layer" news cards
 * orbiting the gimbal sphere during the corridor epilogue (ADR-018
 * epilogue extension).
 *
 * Design constraints:
 *   - Each card face is painted to an offscreen 2D canvas and uploaded
 *     as a `THREE.CanvasTexture` on a plane mesh. This keeps the cards
 *     in TRUE 3D space — they correctly occlude behind the gimbal
 *     sphere as they swing around (a DOM/`drei <Html>` overlay would
 *     paint flat on top of the canvas, breaking the depth).
 *   - Cards billboard toward the camera each frame so the text always
 *     reads upright. The orbit's tilt is preserved in their POSITION
 *     (so the ring reads as a true 3D loop) — only the card's
 *     ORIENTATION is reset to face the camera.
 *   - Mounted as a sibling of the gyro assembly inside the accretion
 *     shell, so the cards inherit the shell's epilogue X-slide (they
 *     migrate right with the sphere) but are NOT subject to the
 *     gyro's pointer tilt — they orbit at their own steady rate.
 *   - Pointer events are guarded at the canvas level: `useDepthScroll`
 *     writes `data-corridor-epilogue="true"` on `<html>` only inside
 *     the epilogue scroll channel, and CSS flips the canvas to
 *     `pointer-events: auto` only then. So the raycaster on the card
 *     meshes is dormant outside the epilogue.
 *   - Reduced-motion / mobile fall back to a STATIC ring (no orbital
 *     spin, no Y bob), but cards still fade in via `epilogueProgress`
 *     so the visual landing reads.
 */

import { ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { SIGNAL_CARDS, type SignalCardData } from "@/lib/home-v2/signalCards";
import {
  EPILOGUE_NEWS_RING_RADIUS,
  EPILOGUE_NEWS_RING_TILT_X,
  EPILOGUE_NEWS_SPIN_SPEED,
} from "./shellGeom";

interface ShellNewsOrbitProps {
  reducedMotion?: boolean;
}

/** Card plane dimensions in shell-local world units. Aspect ~0.75
 *  matches the screenshot reference (Active Theory / Aether signal
 *  card). Picked so the four cards comfortably fit on the ring at
 *  the EPILOGUE_NEWS_RING_RADIUS without intersecting each other. */
const CARD_WIDTH = 0.95;
const CARD_HEIGHT = 1.27;

/** Canvas texture resolution. 2x oversampled relative to the rendered
 *  pixel size at standard viewport so PT Mono labels stay crisp under
 *  perspective scale and slight rotation. */
const TEX_W = 512;
const TEX_H = 684;

/** Hover scale boost (multiplier on the card's base scale). Subtle —
 *  the orbital motion is doing most of the visual work; hover just
 *  signals interactivity. */
const HOVER_SCALE = 1.06;
/** Lerp speed for the hover scale + emissive transitions. Higher
 *  values snap faster. */
const HOVER_LERP = 12;

/** Bob amplitude (shell-local units) and frequency (Hz). Gentle —
 *  reads as floating, not bouncing. */
const BOB_AMP = 0.04;
const BOB_FREQ = 0.6;

/** Threshold below which the orbit is fully hidden (no raycast, no
 *  draw). Saves the GPU + the pointer plumbing while the user is in
 *  the calibrated corridor. */
const EPILOGUE_EPSILON = 0.002;

// ── Canvas face painting ──────────────────────────────────────────

/** Wrap text into lines that fit `maxWidth` at the current `ctx` font.
 *  Returns the line array (may be 1+ lines). No hyphenation. */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Paint one signal card face onto a fresh 2D canvas. Dark void fill
 *  with a 1px gold-dim outline, gold corner brackets, mark + corner
 *  badge at the top, headline + byline at the bottom — same grammar
 *  as the Atlas Entity Card / Loop Signal card, restyled into the
 *  Thoughtform gold-HUD palette. */
function drawCardFace(card: SignalCardData): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = TEX_W;
  canvas.height = TEX_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  // Background: dark void with a faint vertical gradient — gives the
  // card a slight "lit from above" read without needing a real light.
  const bg = ctx.createLinearGradient(0, 0, 0, TEX_H);
  bg.addColorStop(0, "rgba(18, 15, 12, 0.94)");
  bg.addColorStop(1, "rgba(8, 7, 6, 0.94)");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, TEX_W, TEX_H);

  // Inner panel inset — a 1px gold-tinted ribbon that reads as the
  // card's display surface. The actual chrome border lives in the
  // outer stroke + brackets below.
  ctx.fillStyle = "rgba(202, 165, 84, 0.04)";
  ctx.fillRect(20, 20, TEX_W - 40, TEX_H - 40);

  // Outer chrome border (gold-dim).
  ctx.strokeStyle = "rgba(202, 165, 84, 0.42)";
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, TEX_W - 20, TEX_H - 20);

  // Corner brackets — gold, 30px arms. Reads as a HUD readout chassis.
  const bracketSize = 30;
  const bracketInset = 10;
  ctx.strokeStyle = "#CAA554";
  ctx.lineWidth = 3;
  type Bracket = readonly [number, number, 1 | -1, 1 | -1];
  const corners: readonly Bracket[] = [
    [bracketInset, bracketInset, 1, 1],
    [TEX_W - bracketInset, bracketInset, -1, 1],
    [bracketInset, TEX_H - bracketInset, 1, -1],
    [TEX_W - bracketInset, TEX_H - bracketInset, -1, -1],
  ];
  for (const [x, y, sx, sy] of corners) {
    ctx.beginPath();
    ctx.moveTo(x + sx * bracketSize, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + sy * bracketSize);
    ctx.stroke();
  }

  // Identity mark (top-left). Falls back to system mono when PT Mono
  // hasn't loaded; the visual still reads.
  ctx.fillStyle = "rgba(236, 227, 214, 0.92)";
  ctx.font = "600 32px 'PT Mono', 'Menlo', 'Consolas', monospace";
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.fillText(card.mark, 38, 38);

  // Corner badge (top-right) — gold, smaller.
  ctx.fillStyle = "#CAA554";
  ctx.font = "600 24px 'PT Mono', 'Menlo', 'Consolas', monospace";
  ctx.textAlign = "right";
  ctx.fillText(card.corner, TEX_W - 38, 44);

  // Mid-card horizontal accent rule — separates the identity strip
  // from the headline block.
  const accentY = Math.round(TEX_H * 0.42);
  ctx.strokeStyle = "rgba(202, 165, 84, 0.28)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(38, accentY);
  ctx.lineTo(TEX_W - 38, accentY);
  ctx.stroke();

  // Mini tick on the accent line — micro-detail that reads as
  // instrument graticule, not decoration.
  ctx.fillStyle = "#CAA554";
  ctx.fillRect(38, accentY - 3, 12, 2);

  // Kicker (above headline) — gold, uppercase mono.
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(202, 165, 84, 0.75)";
  ctx.font = "500 15px 'PT Mono', 'Menlo', 'Consolas', monospace";
  const kickerY = accentY + 26;
  ctx.fillText(card.kicker.toUpperCase(), 38, kickerY);

  // Headline — the load-bearing claim. Dawn-coloured sans, wrapped
  // to ~3 lines max.
  ctx.fillStyle = "rgba(236, 227, 214, 0.97)";
  ctx.font = "500 30px 'PP Neue Montreal', system-ui, sans-serif";
  const headlineY = kickerY + 36;
  const headlineMaxW = TEX_W - 76;
  const headlineLines = wrapText(ctx, card.headline, headlineMaxW);
  const headlineLineHeight = 38;
  for (let i = 0; i < Math.min(headlineLines.length, 3); i++) {
    ctx.fillText(headlineLines[i], 38, headlineY + i * headlineLineHeight);
  }

  // Byline (bottom strip). Sits above a thin gold under-rule so the
  // metadata reads as a "filed by" footer.
  const bylineY = TEX_H - 58;
  ctx.strokeStyle = "rgba(202, 165, 84, 0.2)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(38, bylineY - 14);
  ctx.lineTo(TEX_W - 38, bylineY - 14);
  ctx.stroke();
  ctx.fillStyle = "rgba(202, 165, 84, 0.7)";
  ctx.font = "500 14px 'PT Mono', 'Menlo', 'Consolas', monospace";
  ctx.fillText(card.byline.toUpperCase(), 38, bylineY);

  return canvas;
}

// ── Component ─────────────────────────────────────────────────────

export function ShellNewsOrbit({ reducedMotion = false }: ShellNewsOrbitProps) {
  const groupRef = useRef<THREE.Group>(null);
  const cardRefs = useRef<(THREE.Mesh | null)[]>([]);
  // Per-card hover state (mirrored into a ref so useFrame can read it
  // without triggering re-renders).
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const hoverRef = useRef<number | null>(null);
  useEffect(() => {
    hoverRef.current = hoveredIdx;
  }, [hoveredIdx]);

  // Per-card current scale (smoothed toward hover target so the hover
  // pop reads as an ease, not a step).
  const cardScales = useRef<number[]>(SIGNAL_CARDS.map(() => 1));

  const { gl, camera } = useThree();

  // Build one CanvasTexture per card — memoized so the offscreen
  // canvases are painted exactly once per mount (re-painting on every
  // frame would blow the CPU). Cleaned up on unmount.
  const textures = useMemo(() => {
    if (typeof document === "undefined") return null;
    return SIGNAL_CARDS.map((card) => {
      const tex = new THREE.CanvasTexture(drawCardFace(card));
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy?.() ?? 1);
      tex.needsUpdate = true;
      return tex;
    });
  }, [gl]);

  // Geometry is shared across all four cards.
  const geometry = useMemo(() => new THREE.PlaneGeometry(CARD_WIDTH, CARD_HEIGHT), []);

  // One material per card so we can fade them in independently if we
  // ever want a stagger (currently they reveal together via the
  // shared epilogue envelope, but per-card opacity is the right
  // primitive to have).
  const materials = useMemo(() => {
    if (!textures) return null;
    return textures.map(
      (tex) =>
        new THREE.MeshBasicMaterial({
          map: tex,
          transparent: true,
          opacity: 0,
          depthWrite: false, // transparent planes shouldn't punch the depth buffer
          side: THREE.DoubleSide,
          toneMapped: false,
        })
    );
  }, [textures]);

  useEffect(() => {
    return () => {
      geometry.dispose();
      textures?.forEach((t) => t.dispose());
      materials?.forEach((m) => m.dispose());
    };
  }, [geometry, textures, materials]);

  // Cursor management — the WebGL canvas owns the cursor while it's
  // pointer-events: auto, so we set it imperatively on the DOM
  // canvas element from the hover state.
  useEffect(() => {
    const canvasEl = gl.domElement;
    if (!canvasEl) return;
    canvasEl.style.cursor = hoveredIdx !== null ? "pointer" : "";
    return () => {
      canvasEl.style.cursor = "";
    };
  }, [hoveredIdx, gl]);

  // Click handler — opens the source article in a new tab.
  const handleClick = useCallback((idx: number) => {
    const card = SIGNAL_CARDS[idx];
    if (!card || typeof window === "undefined") return;
    window.open(card.href, "_blank", "noopener,noreferrer");
  }, []);

  // Vector reused inside useFrame to avoid allocations.
  const cameraWorldPos = useRef(new THREE.Vector3());

  useFrame(({ clock }) => {
    const group = groupRef.current;
    if (!group) return;
    if (!materials || !textures) return;

    const { epilogueProgress, active, armed } = useDepthGatewayStore.getState().transform;

    // Bail if the corridor isn't engaged at all, or if we're still
    // inside the calibrated corridor (epilogueProgress 0).
    if (!active && !armed) {
      group.visible = false;
      return;
    }
    if (epilogueProgress <= EPILOGUE_EPSILON) {
      group.visible = false;
      return;
    }
    group.visible = true;

    // Smoothstep for a soft ease at both ends of the epilogue.
    const ep = epilogueProgress;
    const epEased = ep <= 0 ? 0 : ep >= 1 ? 1 : ep * ep * (3 - 2 * ep);

    const t = clock.elapsedTime;
    // Per-frame spin progresses linearly; on top, the EPILOGUE drives
    // a one-shot DEPLOY rotation so cards rotate INTO place as the
    // user scrolls into the beat (not just spinning idly).
    const deploy = epEased * Math.PI; // ~half-turn deploy across the epilogue
    const spin = reducedMotion ? 0 : t * EPILOGUE_NEWS_SPIN_SPEED;
    const total = SIGNAL_CARDS.length;
    const hovered = hoverRef.current;

    // Get camera world position once per frame for billboarding.
    camera.getWorldPosition(cameraWorldPos.current);

    for (let i = 0; i < total; i++) {
      const mesh = cardRefs.current[i];
      const mat = materials[i];
      if (!mesh || !mat) continue;

      // Base orbit angle: equal spread across the ring, plus the
      // shared deploy + spin.
      const theta = (i / total) * Math.PI * 2 + deploy + spin;

      // Position on the tilted ring. We compute it on the X-Z plane
      // first then apply a small X-axis tilt by lifting points based
      // on sin(theta). This reads as a ring tipped toward the camera,
      // so cards in front appear larger and cards behind the sphere
      // are correctly occluded.
      const r = EPILOGUE_NEWS_RING_RADIUS;
      const baseX = Math.cos(theta) * r;
      const baseZ = Math.sin(theta) * r;
      const tiltY = baseZ * Math.sin(EPILOGUE_NEWS_RING_TILT_X);
      const tiltedZ = baseZ * Math.cos(EPILOGUE_NEWS_RING_TILT_X);
      const bobY = reducedMotion ? 0 : Math.sin(t * BOB_FREQ + i * 0.9) * BOB_AMP;

      mesh.position.set(baseX, tiltY + bobY, tiltedZ);

      // Billboard: orient the card to face the camera. lookAt computes
      // a rotation matrix from this mesh's WORLD position to the
      // camera's world position, so the card stays readable from any
      // viewing angle.
      mesh.lookAt(cameraWorldPos.current);

      // Hover-driven scale (smoothed toward target each frame).
      const target = hovered === i ? HOVER_SCALE : 1;
      const current = cardScales.current[i];
      const next = current + (target - current) * Math.min(1, HOVER_LERP * 0.016);
      cardScales.current[i] = next;
      mesh.scale.setScalar(next * (0.85 + 0.15 * epEased));

      // Opacity ramps with the epilogue and lifts on hover so the
      // active card reads brighter than its neighbours.
      const hoverBoost = hovered === i ? 0.12 : 0;
      mat.opacity = Math.min(1, epEased + hoverBoost);
    }
  });

  if (!materials || !textures) return null;

  return (
    <group ref={groupRef} visible={false}>
      {SIGNAL_CARDS.map((card, i) => (
        <mesh
          key={card.id}
          ref={(node) => {
            cardRefs.current[i] = node;
          }}
          geometry={geometry}
          material={materials[i]}
          frustumCulled={false}
          renderOrder={2}
          onPointerOver={(e: ThreeEvent<PointerEvent>) => {
            e.stopPropagation();
            setHoveredIdx(i);
          }}
          onPointerOut={() => setHoveredIdx((prev) => (prev === i ? null : prev))}
          onClick={(e: ThreeEvent<MouseEvent>) => {
            e.stopPropagation();
            handleClick(i);
          }}
        />
      ))}
    </group>
  );
}
