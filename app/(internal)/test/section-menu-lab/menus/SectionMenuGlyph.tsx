"use client";

import type { SectionMenuProps } from "../stations";
import { CornerBracket } from "./CornerBracket";

/**
 * R1 · GLYPH INDEX — the Departure-Mono glyph column as a station index.
 *
 * Stacked names with a zero-padded index gutter; brightness falls off
 * with distance from the active row. The active station is wrapped in a
 * four-corner bracket cursor that snaps between rows. Inside the Arc,
 * three sub-rows unfold below it, indented one glyph-width, each led by
 * a diamond marker.
 */
export function SectionMenuGlyph({
  stations,
  activeTopId,
  activeSubId,
  expanded,
  onSelect,
}: SectionMenuProps) {
  const activeIdx = stations.findIndex((s) => s.id === activeTopId);

  return (
    <nav className="smenu smenu--glyph" aria-label="Section index">
      <ul className="smg-list">
        {stations.map((st, i) => {
          const active = st.id === activeTopId;
          const dist = activeIdx < 0 ? 3 : Math.abs(i - activeIdx);
          const showArcSubs = st.id === "arc" && expanded && st.subs;
          return (
            <li key={st.id} className="smg-item" data-active={active || undefined}>
              <button
                type="button"
                className="smg-row"
                style={{ ["--d" as string]: String(dist) }}
                aria-current={active || undefined}
                onClick={() => onSelect(st.id)}
              >
                <span className="smg-idx">{st.num}</span>
                <span className="smg-name">{st.hideActiveName && active ? "" : st.name}</span>
                {active && <CornerBracket className="smg-cursor" />}
              </button>

              {showArcSubs && (
                <ul className="smg-subs">
                  {st.subs!.map((sub, j) => {
                    const sActive = sub.id === activeSubId;
                    return (
                      <li
                        key={sub.id}
                        className="smg-sub"
                        style={{ ["--j" as string]: String(j) }}
                        data-active={sActive || undefined}
                      >
                        <button
                          type="button"
                          className="smg-subrow"
                          aria-current={sActive || undefined}
                          onClick={() => onSelect(sub.id)}
                        >
                          <i className="smg-sub-diamond" aria-hidden="true" />
                          <span className="smg-sub-idx">·{sub.num}</span>
                          <span className="smg-sub-name">{sub.name}</span>
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
