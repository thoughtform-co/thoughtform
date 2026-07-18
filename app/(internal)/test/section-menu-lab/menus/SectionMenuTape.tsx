"use client";

import type { SectionMenuProps } from "../stations";

/**
 * R3 · ALTITUDE TAPE — a vertical avionics tape on the midline.
 *
 * Its own hairline (not the HUD rail), a major tick + name per station,
 * minor ticks between. A gold caret + readout chip GLIDES to the active
 * tick (the one continuous-motion route). Inside the Arc, the Arc→
 * Services span gains three indented sub-ticks and the caret can lock to
 * a subsection.
 */
export function SectionMenuTape({
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

  // Sub-ticks resolve INTO the Arc→Services span so they read as extra
  // resolution on that leg of the tape.
  const subFrac = (j: number) => {
    const a = frac(arcIdx);
    const b = servicesIdx > arcIdx ? frac(servicesIdx) : a + 0.14;
    const t = [0.28, 0.5, 0.72][j] ?? 0.5;
    return a + (b - a) * t;
  };

  const activeIdx = stations.findIndex((s) => s.id === activeTopId);
  const activeSubJ = arc?.subs?.findIndex((s) => s.id === activeSubId) ?? -1;
  const caretFrac = activeSubJ >= 0 ? subFrac(activeSubJ) : frac(activeIdx);
  const caretNum =
    activeSubJ >= 0 ? `·${arc?.subs?.[activeSubJ].num}` : (stations[activeIdx]?.num ?? "00");

  // Minor ticks — midpoints between adjacent majors.
  const minors = Array.from({ length: Math.max(0, n - 1) }, (_, i) => (frac(i) + frac(i + 1)) / 2);

  return (
    <nav className="smenu smenu--tape" aria-label="Section tape">
      <div className="smtape-scale">
        <i className="smtape-line" aria-hidden="true" />

        {minors.map((f, k) => (
          <i
            key={`m${k}`}
            className="smtape-minor"
            style={{ top: `${f * 100}%` }}
            aria-hidden="true"
          />
        ))}

        {stations.map((st, i) => {
          const active = st.id === activeTopId;
          return (
            <button
              key={st.id}
              type="button"
              className="smtape-tick"
              style={{ top: `${frac(i) * 100}%` }}
              data-active={active || undefined}
              aria-current={active || undefined}
              onClick={() => onSelect(st.id)}
            >
              <i className="smtape-tick__mark" aria-hidden="true" />
              <span className="smtape-tick__num">{st.num}</span>
              <span className="smtape-tick__name">
                {st.hideActiveName && active ? "" : st.name}
              </span>
            </button>
          );
        })}

        {expanded &&
          arc?.subs?.map((sub, j) => {
            const sActive = sub.id === activeSubId;
            return (
              <button
                key={sub.id}
                type="button"
                className="smtape-sub"
                style={{ top: `${subFrac(j) * 100}%` }}
                data-active={sActive || undefined}
                aria-current={sActive || undefined}
                onClick={() => onSelect(sub.id)}
              >
                <i className="smtape-sub__mark" aria-hidden="true" />
                <span className="smtape-sub__name">
                  ·{sub.num} {sub.name}
                </span>
              </button>
            );
          })}

        <i className="smtape-caret" style={{ top: `${caretFrac * 100}%` }} aria-hidden="true" />
        <span className="smtape-chip" style={{ top: `${caretFrac * 100}%` }} aria-hidden="true">
          <b>{caretNum}</b> · T+0018
        </span>
      </div>
    </nav>
  );
}
