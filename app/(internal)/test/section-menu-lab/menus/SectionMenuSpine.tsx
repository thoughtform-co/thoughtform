"use client";

import type { SectionMenuProps } from "../stations";

/**
 * R5 · ASTROGATION SPINE — a plotted star-route.
 *
 * A vertical polyline: solid behind the active node (traversed), dashed
 * ahead (upcoming). Stations are outline-diamond waypoints; the active
 * one wears a rotated-square reticle. Inside the Arc, a hairline spur
 * branches to a short sub-line carrying the three beat waypoints.
 */
export function SectionMenuSpine({
  stations,
  activeTopId,
  activeSubId,
  expanded,
  onSelect,
}: SectionMenuProps) {
  const n = stations.length;
  const frac = (i: number) => (n > 1 ? i / (n - 1) : 0);

  const arcIdx = stations.findIndex((s) => s.id === "arc");
  const servicesIdx = stations.findIndex((s) => s.id === "services");
  const arc = stations[arcIdx];
  const subs = arc?.subs ?? [];

  const subFrac = (j: number) => {
    const a = frac(arcIdx);
    const b = servicesIdx > arcIdx ? frac(servicesIdx) : a + 0.14;
    const t = [0.32, 0.5, 0.68][j] ?? 0.5;
    return a + (b - a) * t;
  };

  const activeIdx = stations.findIndex((s) => s.id === activeTopId);
  const activeSubJ = subs.findIndex((s) => s.id === activeSubId);
  const caretFrac = activeSubJ >= 0 ? subFrac(activeSubJ) : frac(activeIdx);

  const showSpur = expanded && subs.length > 0;
  const spurTop = frac(arcIdx) * 100;
  const spurSpan = showSpur ? (subFrac(subs.length - 1) - frac(arcIdx)) * 100 : 0;

  return (
    <nav className="smenu smenu--spine" aria-label="Section route">
      <div className="smspine-plot">
        <i
          className="smspine-line smspine-line--past"
          style={{ height: `${caretFrac * 100}%` }}
          aria-hidden="true"
        />
        <i
          className="smspine-line smspine-line--future"
          style={{ top: `${caretFrac * 100}%` }}
          aria-hidden="true"
        />

        {showSpur && (
          <>
            <i className="smspine-spur__elbow" style={{ top: `${spurTop}%` }} aria-hidden="true" />
            <i
              className="smspine-spur__line"
              style={{ top: `${spurTop}%`, height: `${spurSpan}%` }}
              aria-hidden="true"
            />
          </>
        )}

        {stations.map((st, i) => {
          const active = st.id === activeTopId;
          const past = i < activeIdx;
          return (
            <button
              key={st.id}
              type="button"
              className="smspine-node"
              style={{ top: `${frac(i) * 100}%` }}
              data-active={active || undefined}
              data-past={past || undefined}
              aria-current={active || undefined}
              onClick={() => onSelect(st.id)}
            >
              <i className="smspine-diamond" aria-hidden="true" />
              {active && <i className="smspine-ret" aria-hidden="true" />}
              <span className="smspine-name">{st.hideActiveName && active ? "" : st.name}</span>
            </button>
          );
        })}

        {showSpur &&
          subs.map((sub, j) => {
            const sActive = sub.id === activeSubId;
            return (
              <button
                key={sub.id}
                type="button"
                className="smspine-sub"
                style={{ top: `${subFrac(j) * 100}%` }}
                data-active={sActive || undefined}
                aria-current={sActive || undefined}
                onClick={() => onSelect(sub.id)}
              >
                <i className="smspine-sub__diamond" aria-hidden="true" />
                {sActive && <i className="smspine-sub__ret" aria-hidden="true" />}
                <span className="smspine-sub__name">
                  ·{sub.num} {sub.name}
                </span>
              </button>
            );
          })}
      </div>
    </nav>
  );
}
