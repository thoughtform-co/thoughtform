/**
 * The machine brain in depth (owner, 2026-10-15: "with the machine brain I'm
 * missing depth, like an actual three.js / webgl"). The same model as
 * `brain.ts`, built as a scene: two hemispheres of thick glass extruded from
 * their own outlines and bevelled into pillows, the pods the same way, and
 * the machine inside at real depths: boards and chips as plates, lenses as
 * stacked rings, the spine as a column of tori, the coils as tubes, the fine
 * circuitry on a back plane. It sways a few degrees so the depth reads.
 *
 * ⚠ AN ORTHOGRAPHIC CAMERA ON THE MODEL'S OWN UNITS. At rest the silhouette
 * is the 2D one to the unit, so the painter's block, ports, cables and
 * signals (`paintBrain.ts`, which still draws those) and every overlay the
 * act lays round the brain stay anchored. Traces sit on z = 0, where the
 * sway moves them least, because the 2D signals run along them.
 *
 * Offscreen: one WebGL canvas the act draws into its own 2D canvas.
 */

import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

import { BRAIN3D_BOX, type BrainModel, type Pt } from "@/components/arcs/figures/foundation/brain";
import type { Tone } from "@/components/arcs/figures/foundation/paintBrain";


export interface Brain3D {
  /** Render one frame at `w`×`h` device px; returns the canvas to draw. */
  render(o: { w: number; h: number; now: number; split: number; light: boolean; tone: Tone }): HTMLCanvasElement;
  dispose(): void;
}

const v3 = (p: Pt, z = 0) => new THREE.Vector3(p.x, -p.y, z);

function centroid(pts: Pt[]): Pt {
  let x = 0;
  let y = 0;
  for (const p of pts) {
    x += p.x;
    y += p.y;
  }
  return { x: x / pts.length, y: y / pts.length };
}

/** A pillow of glass from a closed outline: inset by the bevel so the
    silhouette lands on the outline, then extruded and rounded. */
function pillow(outline: Pt[], thick: number, bevel: number, round: number): THREE.BufferGeometry {
  const c = centroid(outline);
  const shape = new THREE.Shape();
  outline.forEach((p, i) => {
    const dx = p.x - c.x;
    const dy = p.y - c.y;
    const d = Math.hypot(dx, dy) || 1;
    const q = { x: p.x - (dx / d) * bevel, y: p.y - (dy / d) * bevel };
    if (i) shape.lineTo(q.x, -q.y);
    else shape.moveTo(q.x, -q.y);
  });
  shape.closePath();
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: thick,
    bevelEnabled: true,
    bevelThickness: round,
    bevelSize: bevel,
    bevelSegments: 10,
    curveSegments: 6,
    steps: 1,
  });
  g.translate(0, 0, -thick / 2);
  g.computeVertexNormals();
  return g;
}

/** The glass's rim: light where the surface turns away from the eye. */
function rimMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(1, 1, 1) }, uPower: { value: 3.2 }, uGain: { value: 1.5 } },
    vertexShader: /* glsl */ `
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal);
        vV = vec3(0.0, 0.0, 1.0);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uPower;
      uniform float uGain;
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        float f = pow(1.0 - abs(dot(normalize(vN), vV)), uPower) * uGain;
        gl_FragColor = vec4(uColor * f, f);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

export function createBrain3D(m: BrainModel): Brain3D | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, premultipliedAlpha: true });
  } catch {
    return null;
  }
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = env;

  const B = BRAIN3D_BOX;
  const camera = new THREE.OrthographicCamera(B.x0, B.x1, -B.y0, -B.y1, -1000, 1000);
  camera.position.set(0, 0, 500);
  camera.lookAt(0, 0, 0);

  const brain = new THREE.Group();
  scene.add(brain);

  // Light: a key from the upper left, front; a warm glow inside the machine.
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(-300, 320, 400);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xffe6b0, 0.6);
  fill.position.set(320, -120, 200);
  scene.add(fill);
  const core = new THREE.PointLight(0xf0c86a, 1.6, 600, 1.2);
  core.position.set(0, 10, 0);
  scene.add(core);
  scene.add(new THREE.AmbientLight(0xffffff, 0.15));

  // ── Materials, coloured per frame from the theme ────────────────────────
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xf2ead8,
    metalness: 0,
    roughness: 0.04,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    transparent: true,
    opacity: 0.05,
    depthWrite: false,
    side: THREE.FrontSide,
    envMapIntensity: 0.9,
  });
  const rimMat = rimMaterial();
  const tubeMat = new THREE.MeshPhysicalMaterial({
    color: 0xf2ead8,
    roughness: 0.08,
    clearcoat: 1,
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
    envMapIntensity: 1.6,
  });
  const boardMat = new THREE.MeshStandardMaterial({ color: 0x15120c, roughness: 0.45, metalness: 0.6 });
  const chipMat = new THREE.MeshStandardMaterial({ color: 0x2a2214, roughness: 0.3, metalness: 0.8, emissive: 0xcaa554, emissiveIntensity: 0.18 });
  const goldLine = new THREE.LineBasicMaterial({ color: 0xcaa554, transparent: true, opacity: 0.95 });
  const inkLine = new THREE.LineBasicMaterial({ color: 0xebe3d6, transparent: true, opacity: 0.85 });
  const goldDim = new THREE.LineBasicMaterial({ color: 0xcaa554, transparent: true, opacity: 0.32 });
  const ringMat = new THREE.MeshStandardMaterial({ color: 0xcaa554, metalness: 0.9, roughness: 0.25, emissive: 0xcaa554, emissiveIntensity: 0.35 });
  const spineMat = new THREE.MeshStandardMaterial({ color: 0xd8cfbf, metalness: 0.85, roughness: 0.3 });
  const dotMat = new THREE.PointsMaterial({ color: 0x7a9e6a, size: 1.7, sizeAttenuation: false, transparent: true, opacity: 0.85, depthWrite: false });

  const disposables: { dispose(): void }[] = [inkLine, glassMat, rimMat, tubeMat, boardMat, chipMat, goldLine, goldDim, ringMat, spineMat, dotMat, env, pmrem];
  const keep = <T extends { dispose(): void }>(x: T) => {
    disposables.push(x);
    return x;
  };

  /** Everything on one side of the fissure, so the middle beat can loosen it. */
  const sides: Record<-1 | 1, THREE.Group> = { [-1]: new THREE.Group(), [1]: new THREE.Group() } as Record<-1 | 1, THREE.Group>;
  brain.add(sides[-1], sides[1]);
  const sideOf = (x: number): -1 | 1 => (x < 0 ? -1 : 1);

  // ── The glass: hemispheres and pods ─────────────────────────────────────
  const glassGeos: THREE.BufferGeometry[] = [];
  m.glass.forEach((g) => {
    const geo = keep(pillow(g.outline, 46, 16, 68));
    glassGeos.push(geo);
    const s = sideOf(centroid(g.outline).x);
    sides[s].add(new THREE.Mesh(geo, glassMat), new THREE.Mesh(geo, rimMat));
    sides[s].add(new THREE.LineLoop(keep(new THREE.BufferGeometry().setFromPoints(g.outline.map((p) => v3(p, 0)))), inkLine));
    // The swoops of glass through it, at the front of the pillow.
    g.tubes.forEach((t, j) => {
      if (t.path.length < 2) return;
      const curve = new THREE.CatmullRomCurve3(t.path.map((p) => v3(p, 34 - j * 9)));
      const tg = keep(new THREE.TubeGeometry(curve, Math.max(16, t.path.length * 2), Math.max(1.2, t.w * 0.28), 8, false));
      sides[s].add(new THREE.Mesh(tg, tubeMat));
    });
    // Its inner walls as thin light, one at the front, one at the back.
    g.walls.forEach((w, j) => {
      const lg = keep(new THREE.BufferGeometry().setFromPoints(w.map((p) => v3(p, j % 2 ? -52 : 52))));
      sides[s].add(new THREE.Line(lg, goldDim));
    });
  });
  m.pods.forEach((p) => {
    const geo = keep(pillow(p.outline, 26, 10, 34));
    brain.add(new THREE.Mesh(geo, glassMat), new THREE.Mesh(geo, rimMat));
    brain.add(new THREE.LineLoop(keep(new THREE.BufferGeometry().setFromPoints(p.outline.map((q) => v3(q, 0)))), inkLine));
    p.lens.r.forEach((r, j) => {
      const tg = keep(new THREE.TorusGeometry(r, 1.1, 8, 48));
      const ring = new THREE.Mesh(tg, ringMat);
      ring.position.copy(v3(p.lens.c, 6 - j * 7));
      brain.add(ring);
    });
  });

  // ── The machine inside, at depth ────────────────────────────────────────
  m.boards.forEach((b, i) => {
    const s = sideOf(b.x + b.w / 2);
    const z = [-26, 4, 22, -10, 14, -32][i % 6];
    const plate = keep(new THREE.BoxGeometry(b.w, b.h, 5));
    const mesh = new THREE.Mesh(plate, i % 3 === 0 ? chipMat : boardMat);
    mesh.position.set(b.x + b.w / 2, -(b.y + b.h / 2), z);
    sides[s].add(mesh);
    const edges = new THREE.LineSegments(keep(new THREE.EdgesGeometry(plate)), goldLine);
    edges.position.copy(mesh.position);
    sides[s].add(edges);
    if (b.pins.length) {
      const pins = keep(new THREE.BufferGeometry().setFromPoints(b.pins.flatMap(([a, c]) => [v3(a, z), v3(c, z)])));
      sides[s].add(new THREE.LineSegments(pins, goldDim));
    }
  });
  for (const t of m.traces) {
    const lg = keep(new THREE.BufferGeometry().setFromPoints(t.map((p) => v3(p, 0))));
    sides[sideOf(centroid(t).x)].add(new THREE.Line(lg, goldLine));
  }
  m.lenses.forEach((l) => {
    const s = sideOf(l.c.x);
    l.r.forEach((r, j) => {
      const ring = new THREE.Mesh(keep(new THREE.TorusGeometry(r, 0.9, 8, 40)), ringMat);
      ring.position.copy(v3(l.c, 18 - j * 10));
      sides[s].add(ring);
    });
  });
  m.coils.forEach((c) => {
    if (c.path.length < 2) return;
    const s = sideOf(centroid(c.path).x);
    const curve = new THREE.CatmullRomCurve3(c.path.map((p) => v3(p, -16)));
    sides[s].add(new THREE.Mesh(keep(new THREE.TubeGeometry(curve, c.path.length * 3, 6, 10, false)), tubeMat));
    const ribs = keep(new THREE.BufferGeometry().setFromPoints(c.ribs.flatMap(([a, b]) => [v3(a, -16), v3(b, -16)])));
    sides[s].add(new THREE.LineSegments(ribs, goldLine));
  });
  {
    const micro = keep(new THREE.BufferGeometry().setFromPoints(m.micro.flatMap(([a, b]) => [v3(a, -48), v3(b, -48)])));
    brain.add(new THREE.LineSegments(micro, goldDim));
  }
  // The spine: a corrugated column of tori down the fissure.
  {
    const ribs = Math.max(8, m.spine.ribs.length);
    const top = m.spine.left[0]?.y ?? -160;
    const bottom = m.spine.left[m.spine.left.length - 1]?.y ?? 112;
    const half = Math.max(5, ((m.spine.right[0]?.x ?? 7) - (m.spine.left[0]?.x ?? -7)) / 2);
    const torus = keep(new THREE.TorusGeometry(half, 2.2, 8, 24));
    for (let i = 0; i < ribs; i++) {
      const ring = new THREE.Mesh(torus, spineMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(0, -(top + ((bottom - top) * i) / (ribs - 1)), 0);
      brain.add(ring);
    }
  }

  // ── The loose half (the middle beat): the right glass as particles ──────
  const loose = new THREE.Group();
  {
    const pts: number[] = [];
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
    glassGeos.forEach((geo) => {
      const pos = geo.getAttribute("position");
      for (let i = 0; i < pos.count; i += 5) {
        if (pos.getX(i) > 4) pts.push(pos.getX(i) + rnd() * 5, pos.getY(i) + rnd() * 5, pos.getZ(i) + rnd() * 5);
      }
    });
    // and a loose cloud inside, where the machine was
    for (const b of m.boards) {
      if (b.x < 0) continue;
      for (let i = 0; i < 26; i++) pts.push(b.x + b.w * (0.5 + rnd() * 0.7), -(b.y + b.h * (0.5 + rnd() * 0.7)), rnd() * 40);
    }
    const pg = keep(new THREE.BufferGeometry());
    pg.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    loose.add(new THREE.Points(pg, dotMat));
  }
  loose.visible = false;
  brain.add(loose);

  const col = new THREE.Color();
  return {
    render({ w, h, now, split, light, tone }) {
      const cv = renderer.domElement;
      if (cv.width !== w || cv.height !== h) renderer.setSize(w, h, false);

      col.set(light ? "#2a2214" : tone.ink);
      inkLine.color.set(light ? "#2a2214" : tone.ink);
      rimMat.uniforms.uColor.value.copy(col);
      rimMat.blending = light ? THREE.NormalBlending : THREE.AdditiveBlending;
      glassMat.color.set(light ? "#3a2e18" : "#f2ead8");
      glassMat.opacity = light ? 0.06 : 0.05;
      goldLine.color.set(tone.gold);
      goldDim.color.set(tone.gold);
      ringMat.color.set(tone.gold);
      ringMat.emissive.set(tone.gold);
      chipMat.emissive.set(tone.gold);
      dotMat.color.set(tone.green);

      // The middle beat: the left crisp, the right loose particles.
      const isLoose = split > 0.5;
      sides[1].visible = !isLoose;
      loose.visible = isLoose;

      // A slow sway, a few degrees, so the depth reads and the anchors hold.
      const t = now / 1000;
      brain.rotation.y = 0.2 * Math.sin(t * 0.42);
      brain.rotation.x = 0.06 * Math.sin(t * 0.31 + 1.2);
      core.intensity = 1.4 + 0.3 * Math.sin(t * 1.7);

      renderer.render(scene, camera);
      return cv;
    },
    dispose() {
      for (const d of disposables) d.dispose();
      renderer.dispose();
    },
  };
}
