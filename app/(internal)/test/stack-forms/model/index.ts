export * from "./stack";
export * from "./project";
export * from "./draw";

/** What every drawing of the stack is handed, and all it is handed. */
export interface FormProps {
  /** 0 closed, 1 opened. */
  open: number;
  /** "hold" is the rest frame: reduced motion, off screen, or a still. */
  motion: "run" | "hold";
}
