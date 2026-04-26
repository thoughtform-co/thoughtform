"use client";

import { BUILD_CASES } from "./buildCaseData";
import { BuildCaseSlide } from "./BuildCaseSlide";

/**
 * Renders the four creative-tech build cases as alternating editorial
 * slides inside the v7 Build station. Mounted via {@link BuildCasesPortal}
 * into the `[data-build-cases-root]` placeholder declared in the v7 HTML
 * prototype, so this component always sits inside an opaque `var(--void)`
 * shield and does not need its own background.
 */
export function BuildCases() {
  return (
    <div className="build-cases__list" role="list">
      {BUILD_CASES.map((study, i) => (
        <BuildCaseSlide key={study.id} study={study} index={i} total={BUILD_CASES.length} />
      ))}
    </div>
  );
}
