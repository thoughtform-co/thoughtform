import type { ArcHead, ArcMotion, ArcSectionKind } from "@/lib/arcs/types";

import { ArcDecodeTitle, ArcDecodeWord, ArcTypeCopy } from "./ArcDecodeText";
import { rung } from "./arcMotion";
import { coordStamp, padIndex, sectionDesig } from "./chrome";

interface ArcSectionHeadProps {
  head: ArcHead;
  kind: ArcSectionKind;
  index: number;
  sectionId: string;
  align?: "split" | "center";
  motion?: ArcMotion;
}

/**
 * ArcSectionHead — the services-masthead grammar rebuilt IN FLOW
 * (ADR-052): designation label + station-voice title left, state chip +
 * intro copy right, the gold ORIGIN cross claiming the title head and
 * the dawn CLOSE cross the brief foot, each block on a masked dot-grid
 * lift. The corridor original (services.css `.services-masthead`) is
 * absolutely positioned and coupled to `--svc-*` scroll vars — this is
 * the static two-column form for stacked arc sections.
 *
 * Under terminal motion (ADR-057) the head takes rung 0.06 and NO
 * TRAVEL VARS AT ALL. That is the whole ask: the masthead does not rise,
 * does not crossfade, and does not move while it resolves — the decode
 * IS the reveal (the services.css law, verbatim). Its chrome (grid,
 * crosses, coord stamps) fades in off `data-reveal`, which only appears
 * once the stage has parked.
 */
export function ArcSectionHead({
  head,
  kind,
  index,
  sectionId,
  align = "split",
  motion = "reveal",
}: ArcSectionHeadProps) {
  const eyebrow = head.eyebrow ?? sectionDesig(kind, index);
  const split = align === "split" && Boolean(head.sub || head.state);
  const centered = align === "center";
  const terminal = motion === "terminal";
  return (
    <header
      className={`arc-head ${split ? "arc-head--split" : "arc-head--solo"}${centered ? " arc-head--center" : ""} arc-reveal`}
      {...(terminal ? { "data-arc-still": "" } : {})}
      {...rung(motion, 0.06)}
    >
      <div className="arc-head__lead">
        <i className="arc-head__grid" aria-hidden="true" />
        <i className="arc-head__mark arc-head__mark--origin" aria-hidden="true" />
        <ArcDecodeWord text={eyebrow} motion={motion} className="arc-head__desig" />
        <ArcDecodeTitle title={head.title} motion={motion} className="arc-title arc-head__title" />
        <span className="arc-head__coord" aria-hidden="true">
          {coordStamp(sectionId, 1)}
        </span>
      </div>
      {split ? (
        <div className="arc-head__intro">
          <i className="arc-head__grid" aria-hidden="true" />
          <ArcDecodeWord
            text={`ARC / BRIEF · ${padIndex(index)}`}
            motion={motion}
            className="arc-head__desig"
          />
          {head.state ? (
            <span className="arc-head__state" aria-hidden="true">
              {head.state}
            </span>
          ) : null}
          {head.sub ? (
            <ArcTypeCopy text={head.sub} motion={motion} className="arc-head__copy" />
          ) : null}
          <span className="arc-head__coord arc-head__coord--r" aria-hidden="true">
            {coordStamp(sectionId, 2)}
          </span>
          <i className="arc-head__mark arc-head__mark--close" aria-hidden="true" />
        </div>
      ) : centered && head.sub ? (
        <ArcTypeCopy
          text={head.sub}
          motion={motion}
          className="arc-head__copy arc-head__copy--center"
        />
      ) : null}
    </header>
  );
}
