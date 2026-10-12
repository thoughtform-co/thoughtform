import type { ComponentType } from "react";

export type KitBoard = "system" | "flow" | "job" | "close";

/**
 * One full-screen section of the lab: a control (production, untouched) or
 * one direction against it. The body renders its own wrapper, in the classes
 * production uses for that section, so what is judged is what would ship.
 */
export interface KitSection {
  /** Element id and still name, e.g. `flow-f1`. Letters, digits, dashes. */
  id: string;
  board: KitBoard;
  /** The short code on the lab tag, e.g. `F1`. */
  code: string;
  /** The direction's name, e.g. `Trace`. */
  name: string;
  /** Its one argument against the control, one line. */
  note: string;
  /** True for production as it ships. */
  control?: boolean;
  /** `job` is the 0-based index into `X_BIONIC_JOBS` (the job board only). */
  C: ComponentType<{ job: number }>;
}
