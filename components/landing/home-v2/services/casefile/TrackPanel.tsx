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
/** "INVENT" -> "Invent". The mode is stored caps for the card chrome; the
 *  register's own `text-transform` owns the casing here. */
function titleCase(s: string) {
  return s.charAt(0) + s.slice(1).toLowerCase();
}

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

  const contextRows = tool
    ? [
        { k: "Mode", v: titleCase(tool.mode) },
        /* DEPARTMENT ONLY. The dotted leader needs a value that does not
           wrap, and the full `team` strings run to 38 chars ("Performance ·
           Localization & Expansion") — three times the budget the register's
           three-up columns allow. The discipline after the "·" is already
           implied by the tool's own tagline above. */
        { k: "Team", v: tool.team.split("·")[0].trim() },
        { k: "Status", v: tool.status },
      ]
    : track.context;
  /* NO provenance line while a tool is in view (owner, 2026-07-31). The
     sentence that used to sit here IS the tool's `shift`, and it now reads
     inside the plate beside the screenshot at reading size — printing it
     twice would be the same words at two sizes, and dropping it here is what
     buys the capability tiles the room to be legible. */
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

        <ul className="fl-ctx">
          {contextRows.map((c, i) => (
            <li className="fl-ctx__row" key={i}>
              <span className="fl-ctx__k">{c.k}</span>
              <i className="fl-ctx__ld" aria-hidden="true" />
              <span className="fl-ctx__v">{c.v}</span>
            </li>
          ))}
        </ul>

        {source ? <p className="fl-source">{source}</p> : null}
      </div>
    </div>
  );
}
