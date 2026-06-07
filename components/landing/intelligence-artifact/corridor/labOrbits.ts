/**
 * labOrbits — legacy six-orbit solar-system table for the corridor
 * lab variant (`CorridorArtifact`). The production home corridor now
 * uses the flat Encode cardinal primitive array (`SHELL_PRIMITIVES` in
 * `shellGeom.ts`); this table is kept here so the lab and home page can
 * diverge without sharing the same Encode metaphor.
 */

import {
  COLOR_GOLD,
  COLOR_SOURCES,
  COLOR_SURFACES,
} from "@/components/landing/intelligence-artifact/artifactGeom";

/** One inclined ellipse around the brandmark (lab / legacy orbits). */
export interface LabOrbit {
  id: string;
  rx: number;
  eccentricity: number;
  tilt: readonly [number, number, number];
  periodSec: number;
  dir: 1 | -1;
  phaseRad: number;
  pipRadius: number;
  color: number;
  baseAlpha: number;
}

/** Six inclined elliptical orbits — the pre-plug-array Encode read. */
export const LAB_ORBITS: readonly LabOrbit[] = [
  {
    id: "01",
    rx: 1.1,
    eccentricity: 0.92,
    tilt: [0.42, 0.0, 0.22],
    periodSec: 18,
    dir: -1,
    phaseRad: 0.6,
    pipRadius: 0.04,
    color: COLOR_SOURCES,
    baseAlpha: 0.7,
  },
  {
    id: "02",
    rx: 1.55,
    eccentricity: 0.6,
    tilt: [0.15, 0.62, -0.38],
    periodSec: 26,
    dir: 1,
    phaseRad: 1.4,
    pipRadius: 0.036,
    color: COLOR_SURFACES,
    baseAlpha: 0.55,
  },
  {
    id: "03",
    rx: 1.25,
    eccentricity: 0.95,
    tilt: [1.18, 0.28, 0.0],
    periodSec: 22,
    dir: -1,
    phaseRad: 2.1,
    pipRadius: 0.04,
    color: COLOR_SOURCES,
    baseAlpha: 0.65,
  },
  {
    id: "04",
    rx: 1.6,
    eccentricity: 0.55,
    tilt: [0.0, 1.25, 0.26],
    periodSec: 30,
    dir: 1,
    phaseRad: 3.6,
    pipRadius: 0.038,
    color: COLOR_GOLD,
    baseAlpha: 0.55,
  },
  {
    id: "05",
    rx: 1.0,
    eccentricity: 0.92,
    tilt: [0.72, -0.55, 0.62],
    periodSec: 14,
    dir: -1,
    phaseRad: 4.6,
    pipRadius: 0.032,
    color: COLOR_SURFACES,
    baseAlpha: 0.5,
  },
  {
    id: "06",
    rx: 1.5,
    eccentricity: 0.62,
    tilt: [-0.42, 0.45, -0.82],
    periodSec: 24,
    dir: 1,
    phaseRad: 5.4,
    pipRadius: 0.036,
    color: COLOR_SOURCES,
    baseAlpha: 0.6,
  },
];
