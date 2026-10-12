import { Specimen } from "../Specimen";
import type { KitSection } from "../types";

/** Board S · the shape system, drawn. */
export const SYSTEM: readonly KitSection[] = [
  {
    id: "system",
    board: "system",
    code: "S",
    name: "The shape system",
    note: "Every primitive the proposal draws with, and what it leaves out.",
    C: Specimen,
  },
];
