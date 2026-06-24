import * as THREE from "three";
import { describe, expect, it } from "vitest";

import { sampleBrandmark3D } from "@/lib/brandmark/sampleBrandmark3D";

/**
 * The volumetric Services hologram samples the real 3D brandmark mesh. These
 * tests stand in a BoxGeometry for the GLB (12 hard edges, flat caps) so the
 * sampler's contract can be checked without WebGL or asset loading:
 *   - it's wireframe-first with a sparse surface fill + shell dust,
 *   - every particle carries a unit normal (for the Fresnel facing term),
 *   - the flat home collapses Z to 0 (silhouette for the fly-in morph),
 *   - it's deterministic for a fixed seed (no jitter on remount/HMR).
 */
describe("sampleBrandmark3D", () => {
  const geometry = new THREE.BoxGeometry(2, 2, 1);

  it("produces wire, surface and shell parts with consistent buffer lengths", () => {
    const s = sampleBrandmark3D(geometry, {
      wireCount: 240,
      surfaceCount: 80,
      shellCount: 50,
      seed: 7,
    });

    expect(s.count).toBeGreaterThan(0);
    expect(s.armHomes).toHaveLength(s.count * 3);
    expect(s.domeHomes).toHaveLength(s.count * 3);
    expect(s.flatHomes).toHaveLength(s.count * 3);
    expect(s.normals).toHaveLength(s.count * 3);
    expect(s.seeds).toHaveLength(s.count);
    expect(s.parts).toHaveLength(s.count);
    expect(s.edge).toHaveLength(s.count);
    expect(s.angles).toHaveLength(s.count);

    const parts = new Set(Array.from(s.parts));
    expect(parts.has(0)).toBe(true); // wire
    expect(parts.has(1)).toBe(true); // scan accent
    expect(parts.has(2)).toBe(true); // shell dust
    expect(parts.has(3)).toBe(true); // surface fill
  });

  it("collapses flat-home Z to 0 and keeps arm-home Z (real depth)", () => {
    const s = sampleBrandmark3D(geometry, { wireCount: 200, surfaceCount: 40, shellCount: 0 });
    let flatZMax = 0;
    let armZMax = 0;
    for (let i = 0; i < s.count; i++) {
      flatZMax = Math.max(flatZMax, Math.abs(s.flatHomes[i * 3 + 2]));
      armZMax = Math.max(armZMax, Math.abs(s.armHomes[i * 3 + 2]));
    }
    expect(flatZMax).toBe(0);
    expect(armZMax).toBeGreaterThan(0);
  });

  it("emits unit-length normals", () => {
    const s = sampleBrandmark3D(geometry, { wireCount: 100, surfaceCount: 40, shellCount: 10 });
    for (let i = 0; i < s.count; i += 13) {
      const len = Math.hypot(s.normals[i * 3], s.normals[i * 3 + 1], s.normals[i * 3 + 2]);
      expect(Math.abs(len - 1)).toBeLessThan(1e-3);
    }
  });

  it("is deterministic for a fixed seed", () => {
    const opts = { wireCount: 160, surfaceCount: 60, shellCount: 30, seed: 3 } as const;
    const a = sampleBrandmark3D(geometry, opts);
    const b = sampleBrandmark3D(geometry, opts);
    expect(a.count).toBe(b.count);
    expect(Array.from(a.armHomes)).toEqual(Array.from(b.armHomes));
    expect(Array.from(a.domeHomes)).toEqual(Array.from(b.domeHomes));
    expect(Array.from(a.normals)).toEqual(Array.from(b.normals));
  });

  it("omits shell dust when shellCount is 0", () => {
    const s = sampleBrandmark3D(geometry, { wireCount: 120, surfaceCount: 20, shellCount: 0 });
    expect(Array.from(s.parts).some((p) => p === 2)).toBe(false);
  });

  it("samples multiple geometries as one centered model", () => {
    const left = new THREE.BoxGeometry(1, 1, 1);
    const right = new THREE.BoxGeometry(1, 1, 1);
    right.applyMatrix4(new THREE.Matrix4().makeTranslation(4, 0, 0));

    const s = sampleBrandmark3D([left, right], {
      wireCount: 240,
      surfaceCount: 80,
      shellCount: 0,
      seed: 11,
    });

    let minX = Infinity;
    let maxX = -Infinity;
    for (let i = 0; i < s.count; i++) {
      const x = s.armHomes[i * 3];
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
    }
    expect(s.count).toBe(320);
    expect(minX).toBeLessThan(-0.6);
    expect(maxX).toBeGreaterThan(0.6);

    left.dispose();
    right.dispose();
  });

  it("can add depth struts that connect front and back extrusion faces", () => {
    const s = sampleBrandmark3D(geometry, {
      wireCount: 0,
      depthStrutCount: 60,
      surfaceCount: 0,
      shellCount: 0,
      seed: 13,
    });

    let zRange = 0;
    for (let i = 0; i < s.count; i++) {
      zRange = Math.max(zRange, Math.abs(s.armHomes[i * 3 + 2]));
    }
    expect(s.count).toBe(60);
    expect(zRange).toBeGreaterThan(0.2);
    expect(Array.from(s.parts).every((part) => part === 0 || part === 1)).toBe(true);
  });

  it("emits a dome buffer that is a bounded blob distinct from the wireframe", () => {
    const s = sampleBrandmark3D(geometry, {
      wireCount: 150,
      surfaceCount: 40,
      shellCount: 20,
      radius: 1,
    });
    let maxR = 0;
    let differs = false;
    for (let i = 0; i < s.count; i++) {
      const r = Math.hypot(s.domeHomes[i * 3], s.domeHomes[i * 3 + 1], s.domeHomes[i * 3 + 2]);
      maxR = Math.max(maxR, r);
      if (Math.abs(s.domeHomes[i * 3] - s.armHomes[i * 3]) > 1e-3) differs = true;
    }
    // makeDomePoint magnitude is radius * DOME_RADIUS_MUL(1.05) * [0.5..1].
    expect(maxR).toBeLessThanOrEqual(1.1);
    expect(maxR).toBeGreaterThan(0.5);
    expect(differs).toBe(true);
  });
});
