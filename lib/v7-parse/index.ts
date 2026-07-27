/**
 * Public surface of the v7-parse pipeline.
 *
 * All callers (the marketing route, lab routes, and tests) should
 * import from `@/lib/v7-parse`. Internals live in sibling modules
 * (`parseBody`, `stationOps`, `extractText`, `scopeCss`, `hudTicks`,
 * `sliceSections`) so each concern is independently readable and
 * testable. The Phase 1 unit tests in `tests/lib/v7-parse.test.ts`
 * cover the contract documented here.
 */

import { join } from "path";

import { parseV7Html } from "./parseBody";
import type { ParseOptions, V7Content } from "./types";

export type {
  FillSlotSpec,
  ParseOptions,
  RelocateStationSpec,
  V7Content,
  V7CorridorText,
  V7Slice,
} from "./types";

export { extractV7Text } from "./extractText";
export { sliceV7Sections } from "./sliceSections";
export { buildProofStationHtml } from "./proofStation";

/**
 * Production homepage caller (`app/(marketing)/page.tsx`). Reads the
 * canonical v7 prototype + tokens and applies any optional surgery
 * (station removal, relocation, corridor mount placeholder).
 */
export function getV7Content(options?: ParseOptions): V7Content {
  const htmlPath = join(process.cwd(), "public/prototypes/v7/landing-v7-motion.html");
  const tokensPath = join(process.cwd(), "public/prototypes/v7/tokens.css");
  return parseV7Html(htmlPath, tokensPath, options);
}

/**
 * Forked variant that points at the Claude-workshop prototype HTML
 * but reuses the same parse pipeline — including the optional station
 * surgery, which `/claude-workshop` uses to swap its middle stations
 * for the depth corridor (ADR-053, the homepage-variant recipe).
 */
export function getClaudeWorkshopContent(options?: ParseOptions): V7Content {
  const htmlPath = join(process.cwd(), "public/prototypes/v7/landing-claude-workshop.html");
  const tokensPath = join(process.cwd(), "public/prototypes/v7/tokens.css");
  return parseV7Html(htmlPath, tokensPath, options);
}
