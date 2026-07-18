"use client";

import type { SectionMenuProps } from "../stations";

/**
 * R4 · TERMINAL TREE — a phosphor filesystem session.
 *
 * A prompt header over a rule, then an ASCII tree: `├─`/`└─` connectors,
 * names in mono. The active section is an inverse-video gold block (the
 * rolodex U8 bar, demoted to a row accent) with a `▾`/`▸` disclosure.
 * Inside the Arc, sub-rows hang under a `│` pipe and the active sub ends
 * with a blinking block cursor.
 */
export function SectionMenuTerminal({
  stations,
  activeTopId,
  activeSubId,
  expanded,
  onSelect,
}: SectionMenuProps) {
  const lastIdx = stations.length - 1;

  return (
    <nav className="smenu smenu--terminal" aria-label="Section tree">
      <div className="smterm-head" aria-hidden="true">
        TF://JOURNEY — {String(stations.length).padStart(2, "0")} STN
      </div>
      <ul className="smterm-list">
        {stations.map((st, i) => {
          const active = st.id === activeTopId;
          const isArc = st.id === "arc";
          const isLast = i === lastIdx;
          const showArcSubs = isArc && expanded && st.subs;
          return (
            <li key={st.id} className="smterm-item" data-active={active || undefined}>
              <button
                type="button"
                className="smterm-row"
                aria-current={active || undefined}
                onClick={() => onSelect(st.id)}
              >
                <span className="smterm-branch" aria-hidden="true">
                  {isLast ? "└─" : "├─"}
                </span>
                <span className="smterm-name">
                  {st.hideActiveName && active ? "····" : st.name}
                </span>
                {isArc && (
                  <span className="smterm-disc" aria-hidden="true">
                    {expanded ? "▾" : "▸"}
                  </span>
                )}
              </button>

              {showArcSubs && (
                <ul className="smterm-subs">
                  {st.subs!.map((sub, j) => {
                    const sActive = sub.id === activeSubId;
                    const subLast = j === st.subs!.length - 1;
                    return (
                      <li
                        key={sub.id}
                        className="smterm-subitem"
                        data-active={sActive || undefined}
                      >
                        <button
                          type="button"
                          className="smterm-subrow"
                          aria-current={sActive || undefined}
                          onClick={() => onSelect(sub.id)}
                        >
                          <span className="smterm-pipe" aria-hidden="true">
                            {`│   ${subLast ? "└─" : "├─"}`}
                          </span>
                          <span className="smterm-subname">
                            ·{sub.num} {sub.name}
                          </span>
                          {sActive && (
                            <span className="smterm-cursor" aria-hidden="true">
                              █
                            </span>
                          )}
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
