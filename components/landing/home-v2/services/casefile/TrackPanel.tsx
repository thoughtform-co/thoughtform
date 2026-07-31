"use client";

import { useState, type CSSProperties } from "react";

import { PROJECT_CASES } from "@/components/landing/v7/tools-cards/toolCardData";
import type { CaseTrack } from "@/lib/cases/types";

import { TrackVisual } from "./TrackVisual";

/**
 * TrackPanel — the right column. Preview head, evidence plate, readouts,
 * dotted-leader context rows, provenance line.
 *
 * It is the `tabpanel` for the directory's row tablist, so it carries the
 * ARIA wiring and a `key` on the track id upstream (a fresh subtree per
 * track, which is what lets the plate fade in on swap without React
 * reconciling one plate kind into another).
 *
 * IT OWNS THE TOOL SELECTION (ADR-056 Update 9). The `tools` plate is a
 * gallery whose selected tool drives THIS FOOT — the capability tiles, the
 * context rows and the provenance line all come from the tool in view rather
 * than the track. That is why the state lives here and not in the gallery:
 * it is the lowest node that sees both. The upstream `key` means it resets to
 * tool 01 whenever the row changes, for free.
 */
interface TrackPanelProps {
  track: CaseTrack;
  /** DOM id of the directory row that selects this panel. */
  labelledBy: string;
  id: string;
}

export function TrackPanel({ track, labelledBy, id }: TrackPanelProps) {
  const visual = track.visual;
  const solo = visual.kind === "readouts";
  const [toolIdx, setToolIdx] = useState(0);

  /* The tool in view, when this row is the gallery. `resolveTools` in
     TrackVisual filters unknown ids the same way; the registry test pins that
     none drop, so index alignment holds. */
  const tool =
    visual.kind === "tools"
      ? (PROJECT_CASES.find((c) => c.id === visual.toolIds[toolIdx]) ?? null)
      : null;

  /* WHILE A TOOL IS IN VIEW, THE FOOT IS THE CAPABILITIES AND NOTHING ELSE
     (owner, 2026-07-31, third pass). The context row and the provenance line
     both duplicated words the plate now carries at reading size — mode, team
     and year live on the tool's identity meta line, the `shift` sentence
     reads beside the screenshot, and status is already in the panel head
     ("FLEET — IN PRODUCTION"). Dropping them is what buys the four tiles the
     room to read at `--fl-copy`, and it collapses the foot from three
     private grids down to the plate's own 50% rail. */
  const contextRows = tool ? [] : track.context;
  const source = tool ? null : track.source;

  return (
    <div
      className="fl-panel"
      id={id}
      role="tabpanel"
      aria-labelledby={labelledBy}
      tabIndex={0}
      data-solo={solo || undefined}
    >
      <div
        className="fl-panel__head"
        data-fl-panel
        style={{ "--ci-off": 0.4, "--fl-dx": "48px" } as CSSProperties}
      >
        <span className="fl-desig">{track.preview}</span>
        <span className="fl-desig fl-desig--r">{track.vizLabel}</span>
      </div>

      {solo ? null : (
        <div
          className="fl-panel__viz"
          data-fl-zone="plate"
          data-fl-panel
          style={{ "--ci-off": 0.44, "--fl-dx": "48px" } as CSSProperties}
          data-kind={track.visual.kind}
        >
          <TrackVisual visual={track.visual} toolIdx={toolIdx} onToolIdx={setToolIdx} />
        </div>
      )}

      <div
        className="fl-panel__foot"
        data-fl-zone="readouts"
        data-fl-panel
        style={{ "--ci-off": 0.52, "--fl-dy": "40px" } as CSSProperties}
      >
        {tool ? (
          /* CAPABILITY TILES, not readouts (owner, 2026-07-31): what the tool
             DOES beats a count of tools. Different shape from a readout — a
             title and a line, not a figure and a label — so it is a separate
             list rather than the `data-wide` figure markup. */
          <ul className="fl-caps">
            {tool.capabilities.map((c, i) => (
              <li className="fl-cap" key={i}>
                <span className="fl-cap__t">{c.title}</span>
                <span className="fl-cap__d">{c.desc}</span>
              </li>
            ))}
          </ul>
        ) : (
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
        )}

        {contextRows.length ? (
          <ul className="fl-ctx">
            {contextRows.map((c, i) => (
              <li className="fl-ctx__row" key={i}>
                <span className="fl-ctx__k">{c.k}</span>
                <i className="fl-ctx__ld" aria-hidden="true" />
                <span className="fl-ctx__v">{c.v}</span>
              </li>
            ))}
          </ul>
        ) : null}

        {source ? <p className="fl-source">{source}</p> : null}
      </div>
    </div>
  );
}
