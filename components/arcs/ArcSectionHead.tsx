import type { ArcHead, ArcSectionKind } from "@/lib/arcs/types";

import { ArcTitleText, coordStamp, padIndex, sectionDesig } from "./chrome";

interface ArcSectionHeadProps {
  head: ArcHead;
  kind: ArcSectionKind;
  index: number;
  sectionId: string;
  align?: "split" | "center";
}

/**
 * ArcSectionHead — the services-masthead grammar rebuilt IN FLOW
 * (ADR-052): designation label + station-voice title left, state chip +
 * intro copy right, the gold ORIGIN cross claiming the title head and
 * the dawn CLOSE cross the brief foot, each block on a masked dot-grid
 * lift. The corridor original (services.css `.services-masthead`) is
 * absolutely positioned and coupled to `--svc-*` scroll vars — this is
 * the static two-column form for stacked arc sections.
 */
export function ArcSectionHead({
  head,
  kind,
  index,
  sectionId,
  align = "split",
}: ArcSectionHeadProps) {
  const eyebrow = head.eyebrow ?? sectionDesig(kind, index);
  const split = align === "split" && Boolean(head.sub || head.state);
  const centered = align === "center";
  return (
    <header
      className={`arc-head ${split ? "arc-head--split" : "arc-head--solo"}${centered ? " arc-head--center" : ""} arc-reveal`}
    >
      <div className="arc-head__lead">
        <i className="arc-head__grid" aria-hidden="true" />
        <i className="arc-head__mark arc-head__mark--origin" aria-hidden="true" />
        <span className="arc-head__desig" aria-hidden="true">
          {eyebrow}
        </span>
        <h2 className="arc-title arc-head__title">
          <ArcTitleText title={head.title} />
        </h2>
        <span className="arc-head__coord" aria-hidden="true">
          {coordStamp(sectionId, 1)}
        </span>
      </div>
      {split ? (
        <div className="arc-head__intro">
          <i className="arc-head__grid" aria-hidden="true" />
          <span className="arc-head__desig" aria-hidden="true">
            {`ARC / BRIEF · ${padIndex(index)}`}
          </span>
          {head.state ? (
            <span className="arc-head__state" aria-hidden="true">
              {head.state}
            </span>
          ) : null}
          {head.sub ? <p className="arc-head__copy">{head.sub}</p> : null}
          <span className="arc-head__coord arc-head__coord--r" aria-hidden="true">
            {coordStamp(sectionId, 2)}
          </span>
          <i className="arc-head__mark arc-head__mark--close" aria-hidden="true" />
        </div>
      ) : centered && head.sub ? (
        <p className="arc-head__copy arc-head__copy--center">{head.sub}</p>
      ) : null}
    </header>
  );
}
