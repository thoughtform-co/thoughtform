"use client";

import { useState, type CSSProperties } from "react";

import type { CaseTrack } from "@/lib/cases/types";

import { TrackVisual } from "./TrackVisual";

/**
 * The right column is one visual instrument: a compact designation rail and
 * the selected track's visual. Evidence and readout content live in the
 * left-column `TrackProofRegister`, so this panel never divides its height
 * with a generic footer.
 *
 * This is the `tabpanel` governed by `Directory`. It remains keyed by track
 * upstream, which preserves the plate's arrival behavior and resets the
 * controlled tool gallery to its first item whenever the row changes.
 */
interface TrackPanelProps {
  track: CaseTrack;
  /** DOM id of the directory row that selects this panel. */
  labelledBy: string;
  id: string;
}

export function TrackPanel({ track, labelledBy, id }: TrackPanelProps) {
  const [toolIdx, setToolIdx] = useState(0);

  return (
    <div className="fl-panel" id={id} role="tabpanel" aria-labelledby={labelledBy} tabIndex={0}>
      <div
        className="fl-panel__head"
        data-fl-panel
        style={{ "--ci-off": 0.4, "--fl-dx": "48px" } as CSSProperties}
      >
        <span className="fl-desig">{track.preview}</span>
        <span className="fl-desig fl-desig--r">{track.vizLabel}</span>
      </div>

      <div
        className="fl-panel__viz"
        data-fl-zone="plate"
        data-fl-panel
        style={{ "--ci-off": 0.44, "--fl-dx": "48px" } as CSSProperties}
        data-kind={track.visual.kind}
      >
        <TrackVisual visual={track.visual} toolIdx={toolIdx} onToolIdx={setToolIdx} />
      </div>
    </div>
  );
}
