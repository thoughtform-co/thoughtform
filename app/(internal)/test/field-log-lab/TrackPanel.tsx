"use client";

import { TrackVisual } from "./TrackVisual";
import type { FlTrack } from "./fieldLogData";

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
  track: FlTrack;
  /** DOM id of the directory row that selects this panel. */
  labelledBy: string;
  id: string;
}

export function TrackPanel({ track, labelledBy, id }: TrackPanelProps) {
  const solo = track.visual.kind === "readouts";

  return (
    <div
      className="fll-panel"
      id={id}
      role="tabpanel"
      aria-labelledby={labelledBy}
      tabIndex={0}
      data-solo={solo || undefined}
    >
      <div className="fll-panel__head">
        <span className="fll-desig">{track.preview}</span>
        <span className="fll-desig fll-desig--r">{track.vizLabel}</span>
      </div>

      {solo ? null : (
        <div className="fll-panel__viz" data-fl-zone="plate" data-kind={track.visual.kind}>
          <TrackVisual visual={track.visual} />
        </div>
      )}

      <div className="fll-panel__foot" data-fl-zone="readouts">
        <ul className="fll-readouts" data-solo={solo || undefined}>
          {track.readouts.map((r, i) => (
            <li className="fll-readout" key={i}>
              {/* `data-wide` lets a value like "5 → 130+" or "Days → min"
                  drop a size step instead of wrapping mid-figure. */}
              <span className="fll-readout__v" data-wide={r.value.length > 4 || undefined}>
                {r.value}
              </span>
              <span className="fll-readout__k">{r.label}</span>
            </li>
          ))}
        </ul>

        <ul className="fll-ctx">
          {track.context.map((c, i) => (
            <li className="fll-ctx__row" key={i}>
              <span className="fll-ctx__k">{c.k}</span>
              <i className="fll-ctx__ld" aria-hidden="true" />
              <span className="fll-ctx__v">{c.v}</span>
            </li>
          ))}
        </ul>

        <p className="fll-source">{track.source}</p>
      </div>
    </div>
  );
}
