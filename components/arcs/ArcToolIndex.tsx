import { PROJECT_CASES } from "@/components/landing/v7/tools-cards/toolCardData";
import type { ArcMotion, ArcSectionOf } from "@/lib/arcs/types";

import { ArcBeat } from "./ArcBeat";
import { ArcSectionHead } from "./ArcSectionHead";
import { rung } from "./arcMotion";
import { arcTitleText } from "./chrome";

interface ArcToolIndexProps {
  section: ArcSectionOf<"tool-index">;
  index: number;
  motion?: ArcMotion;
}

/**
 * ArcToolIndex — the tools chapter head, with the four records it opens
 * (ADR-079).
 *
 * ⚠ IT REPLACED A BARE `head`. That was the right shape while the four
 * dossiers shared a scroll with it; once every tool owns a viewport of its
 * own, a masthead with nothing underneath spends a whole screen being a
 * divider — and a divider is not worth a screen.
 *
 * The reference this surface is built from (the CP2077 database board) puts
 * an INDEX where the reader arrives and the record beside it. That is the
 * shape here, laid flat: number, codename, what it is, mode — and every row
 * opens its own beat.
 *
 * ⚠ IT CARRIES NO COPY. Each line is the record's own `codename`, `subline`
 * and `mode` out of `PROJECT_CASES`, the same contract `dossier` has: a
 * hand-written index is a second description of four tools this page already
 * draws in full, and the two drift the first time either is edited.
 *
 * ⚠ ORDER IS THE SECTION LIST'S, NOT THE REGISTRY'S. The trajectory runs
 * "for the creative process" before "around it", so the page orders its
 * dossiers Vesper → Mímir → Babylon → Heimdall while `PROJECT_CASES` stays
 * in its own canonical order. Reading the registry's order here would print
 * an index that disagrees with the beats it points at.
 */
export function ArcToolIndex({ section, index, motion = "reveal" }: ArcToolIndexProps) {
  return (
    <ArcBeat
      id={section.id}
      kind="tool-index"
      className="arc-section arc-sec arc-sec--tindex"
      ariaLabel={section.ariaLabel ?? arcTitleText(section.head.title)}
      motion={motion}
    >
      <div className="arc-band">
        <ArcSectionHead
          head={section.head}
          kind="tool-index"
          index={index}
          sectionId={section.id}
          motion={motion}
        />

        <nav className="arc-tindex arc-reveal" aria-label="The tools" {...rung(motion, 0.14, 0)}>
          <ol>
            {TOOL_ORDER.map((id, i) => {
              const rec = PROJECT_CASES.find((c) => c.id === id);
              if (!rec) return null;
              return (
                <li className="arc-tindex__row" key={id}>
                  <a className="arc-tindex__hit" href={`#tool-${id}`}>
                    <span className="arc-tindex__n">{String(i + 1).padStart(2, "0")}</span>
                    <span className="arc-tindex__name">{rec.codename}</span>
                    <span className="arc-tindex__tag">{rec.subline}</span>
                    <span className="arc-tindex__mode">{rec.mode}</span>
                  </a>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>
    </ArcBeat>
  );
}

/**
 * The page's own order — for the creative process, then around it. Pinned
 * against the section list by `arcs-registry.test.ts`: an index that points
 * at beats in a different order than it lists them is the defect this
 * constant exists to make impossible.
 */
export const TOOL_ORDER = ["vesper", "mimir", "babylon", "heimdall"] as const;
