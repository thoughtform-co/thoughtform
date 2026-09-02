import * as THREE from "three";

import { type PulsarFrame, type Vec3 } from "@/lib/latent-flight/pulsar";
import { VISTA } from "@/lib/latent-flight/vistaPalette";

import { rawColor } from "./color";

import {
  coneFragment,
  coneVertex,
  coronaFragment,
  coronaVertex,
  discFragment,
  discVertex,
  flashFragment,
  flashVertex,
  lineFragment,
  lineVertex,
} from "../shaders/pulsar";

/**
 * The neutron star — the vista's hero, built as a hierarchy that carries the
 * physics in its transforms:
 *
 *   root (position)
 *   ├── core sphere, corona quad (billboarded)
 *   └── spinFrame (quaternion: local +Z = the spin axis)
 *       ├── disc glow + three hairline rings (⟂ spin), jets (±Z), spin axis
 *       └── spinGroup (rotation.z = phase)
 *           └── magGroup (rotation.y = α: local +Z = the magnetic axis)
 *               ├── beams (±Z)
 *               └── dipole field lines
 *
 * So `setPhase` turns the beams and the field cage about the spin axis and
 * nothing else moves; the disc rotates only in its shader. The DRAWING
 * carries the object: hairlines at dawn .22–.28; the glow is secondary.
 */

export interface NeutronStar {
  root: THREE.Group;
  flash: THREE.Mesh;
  /** Place the star and orient its frame. `near`/`far` bound the depth fade. */
  setFrame(frame: PulsarFrame, position: Vec3): void;
  setPhase(phase: number): void;
  setCrossing(c: number): void;
  setTime(t: number): void;
  /** Turn the corona to face the camera. */
  billboard(q: THREE.Quaternion): void;
  dispose(): void;
}

const CORE_R = 0.12;
const CORONA_SIZE = 1.6;
const DISC_IN = 1.1;
const DISC_OUT = 2.9;
const DISC_RINGS = [1.4, 2.0, 2.8];
const JET_LEN = 9;
const BEAM_LEN = 28;
const SHELLS = [1.6, 2.2, 3.0, 4.0, 5.2];
const MERIDIANS = 8;
const SAMPLES = 64;
const LINE_START_R = 0.3;

function dipoleLines(): Float32Array {
  const out: number[] = [];
  for (const L of SHELLS) {
    const s0 = Math.sqrt(Math.min(1, LINE_START_R / L));
    const theta0 = Math.asin(s0);
    for (let m = 0; m < MERIDIANS; m++) {
      const phi = (m / MERIDIANS) * Math.PI * 2;
      let px = 0;
      let py = 0;
      let pz = 0;
      for (let i = 0; i <= SAMPLES; i++) {
        const theta = theta0 + ((Math.PI - 2 * theta0) * i) / SAMPLES;
        const st = Math.sin(theta);
        const r = L * st * st;
        const x = r * st * Math.cos(phi);
        const y = r * st * Math.sin(phi);
        const z = r * Math.cos(theta);
        if (i > 0) out.push(px, py, pz, x, y, z);
        px = x;
        py = y;
        pz = z;
      }
    }
  }
  return Float32Array.from(out);
}

function ringLine(radius: number, segments: number): Float32Array {
  const out: number[] = [];
  for (let i = 0; i < segments; i++) {
    const a0 = (i / segments) * Math.PI * 2;
    const a1 = ((i + 1) / segments) * Math.PI * 2;
    out.push(Math.cos(a0) * radius, Math.sin(a0) * radius, 0, Math.cos(a1) * radius, Math.sin(a1) * radius, 0);
  }
  return Float32Array.from(out);
}

function lineMaterial(opacity: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: lineVertex,
    fragmentShader: lineFragment,
    uniforms: {
      uColor: { value: rawColor(VISTA.dawn) },
      uOpacity: { value: opacity },
      uNear: { value: 100 },
      uFar: { value: 140 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

function coneMaterial(
  noise: THREE.Texture,
  len: number,
  opacity: number,
  turb: number,
  fall: number
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: coneVertex,
    fragmentShader: coneFragment,
    uniforms: {
      uNoise: { value: noise },
      uColor: { value: rawColor(VISTA.dawn) },
      uGoldLit: { value: rawColor(VISTA.goldLit) },
      uLen: { value: len },
      uTime: { value: 0 },
      uOpacity: { value: opacity },
      uCross: { value: 0 },
      uTurb: { value: turb },
      uFall: { value: fall },
    },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
}

/** An open cone with its narrow end at the origin, extending along +Y. */
function coneGeometry(rTip: number, rBase: number, len: number, segments: number) {
  const g = new THREE.CylinderGeometry(rTip, rBase, len, segments, 1, true);
  g.translate(0, len / 2, 0);
  return g;
}

export function createNeutronStar(noise: THREE.Texture): NeutronStar {
  const root = new THREE.Group();
  const disposables: { dispose(): void }[] = [];

  // ── The core and its corona ────────────────────────────────────────────
  const coreMat = new THREE.MeshBasicMaterial({
    color: rawColor(VISTA.dawn).multiplyScalar(2.4),
    toneMapped: false,
  });
  const core = new THREE.Mesh(new THREE.SphereGeometry(CORE_R, 12, 8), coreMat);
  core.renderOrder = 1;
  disposables.push(core.geometry, coreMat);

  const coronaMat = new THREE.ShaderMaterial({
    vertexShader: coronaVertex,
    fragmentShader: coronaFragment,
    uniforms: {
      uColor: { value: rawColor(VISTA.dawn) },
      uGoldLit: { value: rawColor(VISTA.goldLit) },
      uGain: { value: 1 },
      uTint: { value: 0 },
      uOpacity: { value: 1 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const corona = new THREE.Mesh(new THREE.PlaneGeometry(CORONA_SIZE, CORONA_SIZE), coronaMat);
  corona.renderOrder = 1;
  disposables.push(corona.geometry, coronaMat);

  // ── The spin frame: disc, rings, jets, axis ────────────────────────────
  const spinFrame = new THREE.Group();

  const discMat = new THREE.ShaderMaterial({
    vertexShader: discVertex,
    fragmentShader: discFragment,
    uniforms: {
      uNoise: { value: noise },
      uDawn: { value: rawColor(VISTA.dawn) },
      uHot: { value: rawColor(VISTA.dawnHot) },
      uRin: { value: DISC_IN },
      uRout: { value: DISC_OUT },
      uTime: { value: 0 },
      uSpin: { value: 0.35 },
      uOpacity: { value: 1 },
    },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
  const disc = new THREE.Mesh(new THREE.RingGeometry(DISC_IN, DISC_OUT, 128, 1), discMat);
  disc.renderOrder = 1;
  disposables.push(disc.geometry, discMat);

  const ringMat = lineMaterial(0.22);
  const rings = DISC_RINGS.map((r) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(ringLine(r, 96), 3));
    const l = new THREE.LineSegments(g, ringMat);
    l.renderOrder = 1;
    disposables.push(g);
    return l;
  });
  disposables.push(ringMat);

  const jetGeom = coneGeometry(0.55, 0.06, JET_LEN, 24);
  const jetMat = coneMaterial(noise, JET_LEN, 0.1, 0.25, 1.6);
  const jetN = new THREE.Mesh(jetGeom, jetMat);
  jetN.rotation.x = Math.PI / 2;
  const jetS = new THREE.Mesh(jetGeom, jetMat);
  jetS.rotation.x = -Math.PI / 2;
  jetN.renderOrder = jetS.renderOrder = 1;
  disposables.push(jetGeom, jetMat);

  const axisMat = lineMaterial(0.28);
  const axisGeom = new THREE.BufferGeometry();
  axisGeom.setAttribute(
    "position",
    new THREE.BufferAttribute(Float32Array.from([0, 0, -JET_LEN * 1.1, 0, 0, JET_LEN * 1.1]), 3)
  );
  const axis = new THREE.LineSegments(axisGeom, axisMat);
  axis.renderOrder = 1;
  disposables.push(axisGeom, axisMat);

  spinFrame.add(disc, ...rings, jetN, jetS, axis);

  // ── The spinning magnetic frame: beams + the field cage ────────────────
  const spinGroup = new THREE.Group();
  const magGroup = new THREE.Group();

  const beamGeom = coneGeometry(1.8, 0.05, BEAM_LEN, 20);
  const beamMat = coneMaterial(noise, BEAM_LEN, 0.12, 0.35, 2.4);
  const beamN = new THREE.Mesh(beamGeom, beamMat);
  beamN.rotation.x = Math.PI / 2;
  const beamS = new THREE.Mesh(beamGeom, beamMat);
  beamS.rotation.x = -Math.PI / 2;
  beamN.renderOrder = beamS.renderOrder = 1;
  disposables.push(beamGeom, beamMat);

  const fieldMat = lineMaterial(0.28);
  const fieldGeom = new THREE.BufferGeometry();
  fieldGeom.setAttribute("position", new THREE.BufferAttribute(dipoleLines(), 3));
  const field = new THREE.LineSegments(fieldGeom, fieldMat);
  field.renderOrder = 1;
  disposables.push(fieldGeom, fieldMat);

  magGroup.add(beamN, beamS, field);
  spinGroup.add(magGroup);
  spinFrame.add(spinGroup);
  root.add(core, corona, spinFrame);

  // ── The flash: screen-space, added to the scene beside the root ────────
  const flashMat = new THREE.ShaderMaterial({
    vertexShader: flashVertex,
    fragmentShader: flashFragment,
    uniforms: {
      uColor: { value: rawColor(VISTA.gold) },
      uAlpha: { value: 0 },
    },
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  });
  const flash = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), flashMat);
  flash.frustumCulled = false;
  flash.renderOrder = 999;
  disposables.push(flash.geometry, flashMat);

  const lineMats = [ringMat, axisMat, fieldMat];
  const basis = new THREE.Matrix4();
  const vx = new THREE.Vector3();
  const vy = new THREE.Vector3();
  const vz = new THREE.Vector3();

  return {
    root,
    flash,
    setFrame(frame, position) {
      root.position.set(position[0], position[1], position[2]);
      vx.set(frame.x[0], frame.x[1], frame.x[2]);
      vy.set(frame.y[0], frame.y[1], frame.y[2]);
      vz.set(frame.spin[0], frame.spin[1], frame.spin[2]);
      basis.makeBasis(vx, vy, vz);
      spinFrame.quaternion.setFromRotationMatrix(basis);
      magGroup.rotation.y = frame.tilt;
      const dist = Math.hypot(position[0], position[1], position[2]);
      for (const m of lineMats) {
        m.uniforms.uNear.value = dist - 6;
        m.uniforms.uFar.value = dist + 6;
      }
    },
    setPhase(phase) {
      spinGroup.rotation.z = phase;
    },
    setCrossing(c) {
      beamMat.uniforms.uCross.value = c;
      coronaMat.uniforms.uGain.value = 1 + 1.2 * c;
      coronaMat.uniforms.uTint.value = 0.6 * c;
      flashMat.uniforms.uAlpha.value = 0.04 * c;
      flash.visible = c > 0.001;
    },
    setTime(t) {
      discMat.uniforms.uTime.value = t;
      jetMat.uniforms.uTime.value = t;
      beamMat.uniforms.uTime.value = t;
    },
    billboard(q) {
      corona.quaternion.copy(q);
    },
    dispose() {
      for (const d of disposables) d.dispose();
    },
  };
}
