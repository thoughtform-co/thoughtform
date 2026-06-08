/**
 * gyroLabStore — state for the 3D gimbaled Navigate gyroscope.
 *
 * Holds the toggle that swaps the flat Navigate compass (`ShellSubstrate`)
 * for the 3D gimbaled gyroscope (`ShellSubstrateGyro`) inside
 * `BrandmarkAccretionShell`, plus the live tuning knobs the
 * `GyroLabPanel` writes and `ShellSubstrateGyro` reads imperatively in
 * its `useFrame` loop.
 *
 * As of 2026-06-08, `enabled` defaults to `true` so the production home
 * page and `/test/home-v2` both render the gyro. The lab route
 * (`/test/navigate-gyroscope`) keeps the `GyroLabPanel` overlay for live
 * tuning. The flat `ShellSubstrate` remains in code as a fallback —
 * setting `enabled` to `false` (programmatically or via the panel)
 * restores the previous flat compass read.
 *
 * `gyroTilt` is a plain mutable ref (not Zustand state) so DOM projected
 * elements can read the current assembly bank without triggering React
 * re-renders.
 */

import { create } from "zustand";

/** Current gimbaled assembly bank in radians — written by
 *  `BrandmarkAccretionShell`, read by DOM projection when `enabled`. */
export const gyroTilt = { x: 0, y: 0, z: 0 };

export interface GyroLabState {
  /** Master switch — defaults to true (gyro is the production read).
   *  Set to false to restore the flat `ShellSubstrate` compass. */
  enabled: boolean;
  /** Gimbal cage ring count (0..3). */
  ringCount: number;
  /** Sparse surface-particle accent on the globe. */
  showParticles: boolean;
  /** Wireframe attitude-globe radius (world units). */
  globeRadius: number;
  /** Meridian / parallel line density scalar (0.4 .. 1.5). */
  globeDensity: number;
  /** Surface particle count scalar (0.2 .. 1.5). */
  particleDensity: number;
  /** Pointer bank amplitude (degrees). */
  mouseAmpDeg: number;
  /** Idle spin + drift speed multiplier. */
  idleSpeed: number;
  /** Patch one or more fields. */
  set: (patch: Partial<Omit<GyroLabState, "set" | "reset">>) => void;
  /** Restore every tunable to its default (and disable the lab). */
  reset: () => void;
}

/** Canonical defaults for the 3D gimbal model. */
export const GYRO_LAB_DEFAULTS = {
  enabled: true,
  ringCount: 3,
  showParticles: true,
  globeRadius: 0.72,
  globeDensity: 1.0,
  particleDensity: 0.7,
  mouseAmpDeg: 28,
  idleSpeed: 1,
} as const;

export const useGyroLabStore = create<GyroLabState>((set) => ({
  ...GYRO_LAB_DEFAULTS,
  set: (patch) => set(patch),
  reset: () => {
    gyroTilt.x = 0;
    gyroTilt.y = 0;
    gyroTilt.z = 0;
    set({ ...GYRO_LAB_DEFAULTS });
  },
}));
