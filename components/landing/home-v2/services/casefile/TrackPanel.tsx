"use client";

import type { CSSProperties } from "react";

import { TrackVisual } from "./TrackVisual";
import type { CaseTrack } from "@/lib/cases/types";

/**
 * TrackPanel — the right column. Preview head, evidence plate, readouts,
 * dotted-leader context rows, provenance line.
 *
 * It is the `tabpanel` for the directory's row tablist, so it carries the
 * ARIA wiring and a `key` on the track id upstream (a fresh subtree per
 * track, which is what lets the plate fade in on swap without React
 * reconciling one plate kind into another).
 */
interface TrackPanelProps {
  track: CaseTrack;
  /** DOM id of the directory row that selects this panel. */
  labelledBy: string;
  id: string;
}

export function TrackPanel({ track, labelledBy, id }: TrackPanelProps) {
  const solo = track.visual.kind === "readouts";

  return (
    <div
      className="fl-panel"
      id={id}
      role="tabpanel"
      aria-labelledby={labelledBy}
      tabIndex={0}
      data-solo={solo || undefined}
    >
      <div className="fl-panel__head" data-fl-panel style={{ "--ci-off": 0.4 } as CSSProperties}>
        <span className="fl-desig">{track.preview}</span>
        <span className="fl-desig fl-desig--r">{track.vizLabel}</span>
      </div>

      {solo ? null : (
        <div
          className="fl-panel__viz"
          data-fl-zone="plate"
          data-fl-panel
          style={{ "--ci-off": 0.44 } as CSSProperties}
          data-kind={track.visual.kind}
        >
          <TrackVisual visual={track.visual} />
        </div>
      )}

      <div
        className="fl-panel__foot"
        data-fl-zone="readouts"
        data-fl-panel
        style={{ "--ci-off": 0.52 } as CSSProperties}
      >
        <ul className="fl-readouts" data-solo={solo || undefined}>
          {track.readouts.map((r, i) => (
            <li className="fl-readout" key={i}>
              {/* `data-wide` lets a value like "5 → 130+" or "Days → min"
                  drop a size step instead of wrapping mid-figure. */}
              <span className="fl-readout__v" data-wide={r.value.length > 4 || undefined}>
                {r.value}
              </span>
              <span className="fl-readout__k">{r.label}</span>
            </li>
          ))}
        </ul>

        <ul className="fl-ctx">
          {track.context.map((c, i) => (
            <li className="fl-ctx__row" key={i}>
              <span className="fl-ctx__k">{c.k}</span>
              <i className="fl-ctx__ld" aria-hidden="true" />
              <span className="fl-ctx__v">{c.v}</span>
            </li>
          ))}
        </ul>

        <p className="fl-source">{track.source}</p>
      </div>
    </div>
  );
}
