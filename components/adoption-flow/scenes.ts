"use client";

/** The client half of the options registry: each option's scene, camera and
 *  trackers, keyed by the same ids as `options.ts`. */

import type { ComponentType, RefObject } from "react";

import type { HoloPalette } from "@/components/holo-program/holoPalette";

import { AXIS_CAMERA, AXIS_TRACKERS, AxisScene } from "./AxisScene";
import { DISH_CAMERA, DISH_TRACKERS, DishScene } from "./DishScene";
import { FIELD_CAMERA, FIELD_TRACKERS, FieldScene } from "./FieldScene";
import type { P3, TrackerDef } from "./flowKit";
import type { FlowOptionId } from "./options";
import { STACK_CAMERA, STACK_TRACKERS, StackScene } from "./StackScene";

export interface FlowScene {
  camera: { azimuthDeg: number; elevationDeg: number; distance: number; target: P3; fov: number };
  trackers: TrackerDef[];
  Scene: ComponentType<{ palette: HoloPalette; trackers: RefObject<(HTMLElement | null)[]> }>;
}

export const FLOW_SCENES: Record<FlowOptionId, FlowScene> = {
  axis: { camera: AXIS_CAMERA, trackers: AXIS_TRACKERS, Scene: AxisScene },
  stack: { camera: STACK_CAMERA, trackers: STACK_TRACKERS, Scene: StackScene },
  field: { camera: FIELD_CAMERA, trackers: FIELD_TRACKERS, Scene: FieldScene },
  dish: { camera: DISH_CAMERA, trackers: DISH_TRACKERS, Scene: DishScene },
};
