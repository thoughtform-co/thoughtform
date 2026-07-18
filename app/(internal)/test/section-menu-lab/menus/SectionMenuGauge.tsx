"use client";

import type { LabStation, SectionMenuProps } from "../stations";

/**
 * R2 · GAUGE MANIFEST — sections as OpenVMS system meters.
 *
 * A heading strip, then one row per station: index + name + a
 * bracket-framed track whose fill IS the journey position (completed
 * dim-full, active partial, upcoming empty) + a percent readout. Inside
 * the Arc, the row expands into three indented sub-gauges with their own
 * fills.
 */

/** Journey fill for a station at list-position `i` vs the active index. */
function fillFor(i: number, activeIdx: number): number {
  if (i < activeIdx) return 1; // traversed — full, dim
  if (i === activeIdx) return 0.5; // parked mid-station
  return 0; // ahead — empty
}

/** Sub-gauge fill: the parked sub sits mid, earlier subs full, later empty. */
function subFillFor(j: number, activeSubJ: number): number {
  if (activeSubJ < 0) return 0;
  if (j < activeSubJ) return 1;
  if (j === activeSubJ) return 0.5;
  return 0;
}

function GaugeTrack({ fill, wide }: { fill: number; wide?: boolean }) {
  return (
    <span className={`smgauge-track${wide ? "" : " smgauge-track--sub"}`} aria-hidden="true">
      <i className="smgauge-fill" style={{ width: `${Math.round(fill * 100)}%` }} />
    </span>
  );
}

export function SectionMenuGauge({
  stations,
  activeTopId,
  activeSubId,
  expanded,
  onSelect,
}: SectionMenuProps) {
  const activeIdx = stations.findIndex((s) => s.id === activeTopId);
  const arc = stations.find((s) => s.id === "arc") as LabStation | undefined;
  const activeSubJ = arc?.subs?.findIndex((s) => s.id === activeSubId) ?? -1;

  return (
    <nav className="smenu smenu--gauge" aria-label="Section manifest">
      <div className="smgauge-head" aria-hidden="true">
        JOURNEY / {String(stations.length).padStart(2, "0")} STN
      </div>
      <ul className="smgauge-list">
        {stations.map((st, i) => {
          const active = st.id === activeTopId;
          const fill = fillFor(i, activeIdx);
          const showArcSubs = st.id === "arc" && expanded && st.subs;
          return (
            <li key={st.id} className="smgauge-item" data-active={active || undefined}>
              <button
                type="button"
                className="smgauge-row"
                data-state={i < activeIdx ? "done" : active ? "active" : "ahead"}
                aria-current={active || undefined}
                onClick={() => onSelect(st.id)}
              >
                <span className="smgauge-num">{st.num}</span>
                <span className="smgauge-name">{st.hideActiveName && active ? "—" : st.name}</span>
                <GaugeTrack fill={fill} wide />
                <span className="smgauge-read">{Math.round(fill * 100)}</span>
              </button>

              {showArcSubs && (
                <ul className="smgauge-subs">
                  {st.subs!.map((sub, j) => {
                    const sActive = sub.id === activeSubId;
                    const sFill = subFillFor(j, activeSubJ);
                    return (
                      <li
                        key={sub.id}
                        className="smgauge-subitem"
                        data-active={sActive || undefined}
                      >
                        <button
                          type="button"
                          className="smgauge-subrow"
                          aria-current={sActive || undefined}
                          onClick={() => onSelect(sub.id)}
                        >
                          <span className="smgauge-subnum">·{sub.num}</span>
                          <span className="smgauge-subname">{sub.name}</span>
                          <GaugeTrack fill={sFill} />
                          <span className="smgauge-read">{Math.round(sFill * 100)}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
