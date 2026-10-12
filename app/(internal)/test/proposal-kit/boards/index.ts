import type { KitBoard, KitSection } from "../types";

import { CLOSE } from "./close";
import { FLOW } from "./flow";
import { JOB } from "./job";
import { SYSTEM } from "./system";

/** Board order is page order: the system first, then the three sections in
    the order the proposal reads them. Each board lists its control first. */
export const BOARDS: readonly { key: KitBoard; label: string; sections: readonly KitSection[] }[] =
  [
    { key: "system", label: "System", sections: SYSTEM },
    { key: "flow", label: "Flow", sections: FLOW },
    { key: "job", label: "Job card", sections: JOB },
    { key: "close", label: "Closing run", sections: CLOSE },
  ];

export const isBoard = (v: unknown): v is KitBoard =>
  v === "system" || v === "flow" || v === "job" || v === "close";
