import { SheetShell } from "@/components/sheet/SheetShell";
import { ThemeLock } from "@/components/landing/v7/ThemeLock";
import { THEME_TOGGLE } from "@/components/landing/v7/themeToggle";
import type { SheetChapter } from "@/lib/sheet/composition";
import { sliceV7Sections } from "@/lib/v7-parse";

import { TrinnyBench } from "./TrinnyBench";

// Sheet order is load-bearing (ADR-058): landing.css carries the @font-face
// block and the token chain; theme.css is LAST of the production set; the
// corner instruments after it; the route's own sheet last of all so its
// scoped rules win.
import "@/components/landing/v7/landing.css";
import "@/components/sheet/sheet.css";
import "@/components/sheet/instrument.css";
import "@/components/landing/v7/theme.css";
import "@/components/landing/v7/rail-instruments/rail-instruments.css";
import "./trinny-bench.css";

/**
 * /test/trinny-bench — the Trinny London brand bench (ADR-120).
 *
 * A live module, not a curated one: generate a product image with the
 * ship's harness or drop one in, and have the rubric grade it three times
 * with the colour measured in code. The judgment lives in the sibling repo
 * (`Arcs_Trinny London/skill/references/`); this page is its face, in the
 * pitch page's register: parchment, one coral wash, the client's yellow on
 * the one primary control.
 *
 * SERVER component because `sliceV7Sections` reads the prototype off disk
 * for the HUD chrome (`[]` = frame only, no stations), exactly as
 * `/test/arcs-instrument-kit` does. Light-locked (ADR-093): the row in
 * `LIGHT_LOCKED_ROUTES`, the leaf below, and the switch rule in the sheet.
 *
 * `?offline=1` rehearses the whole page against the harness's deterministic
 * fake grader, with the colour layer still real: no spend, same choreography.
 */

const CHAPTERS: readonly SheetChapter[] = [
  { id: "run", label: "Run", primary: true },
  { id: "skill", label: "Skill" },
  { id: "evals", label: "Evals" },
];

export default async function TrinnyBenchRoute({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const offline = sp.offline === "1";
  const slice = sliceV7Sections([]);
  return (
    <>
      {THEME_TOGGLE && <ThemeLock />}
      <div className="tb-root">
        <div className="tb-wash" aria-hidden="true" />
        <SheetShell
          hudHtml={slice.hudHtml}
          bodyClass={slice.bodyClass}
          page="trinny-bench"
          profile="instrument"
          chapters={CHAPTERS}
        >
          <TrinnyBench offline={offline} />
        </SheetShell>
      </div>
    </>
  );
}
