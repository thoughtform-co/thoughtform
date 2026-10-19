import type { CSSProperties } from "react";

import type { Figure } from "../types";

type ToolsFigure = Extract<Figure, { kind: "tools" }>;

/* Where each tool sits, in % of the figure, by how many there are. Apart,
   they are scattered and each is a trip; joined, they ring the one model
   that reads them. */
const APART = [
  [20, 20],
  [79, 16],
  [15, 70],
  [84, 66],
  [50, 86],
];
const JOINED = [
  [18, 22],
  [82, 22],
  [16, 72],
  [84, 72],
  [50, 88],
];
const CENTER = [50, 46];

/**
 * Tools: the apps a piece of work runs through, each a small window with
 * what it holds. Apart, a person sits in the middle and every path to a
 * tool is a dashed trip, the carrying named on it; joined, one model sits
 * there instead and every tool is wired to it by a solid line. The same
 * tools in the same order, so the two read as a before and an after.
 */
export function Tools({ figure }: { figure: ToolsFigure }) {
  const apart = figure.mode === "apart";
  const seats = apart ? APART : JOINED;
  return (
    <div className="csd-tools" data-mode={figure.mode}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {figure.tools.map((t, i) => {
          const [x, y] = seats[i % seats.length];
          return (
            <line
              key={t.name}
              x1={CENTER[0]}
              y1={CENTER[1]}
              x2={x}
              y2={y}
              className="csd-tools__path"
            />
          );
        })}
      </svg>
      {apart && figure.carry
        ? figure.carry.map((c, i) => {
            const [x, y] = seats[i % seats.length];
            return (
              <span
                key={c}
                className="csd-tools__carry"
                style={{ left: `${(x + CENTER[0]) / 2}%`, top: `${(y + CENTER[1]) / 2}%` } as CSSProperties}
              >
                {c}
              </span>
            );
          })
        : null}
      <div
        className="csd-tools__center"
        style={{ left: `${CENTER[0]}%`, top: `${CENTER[1]}%` } as CSSProperties}
      >
        <b>{figure.center.name}</b>
        <span>{figure.center.note}</span>
      </div>
      {figure.tools.map((t, i) => {
        const [x, y] = seats[i % seats.length];
        return (
          <div
            key={t.name}
            className="csd-tools__app"
            style={{ left: `${x}%`, top: `${y}%`, "--tone": t.tone } as CSSProperties}
          >
            <p className="csd-tools__bar">
              <i aria-hidden="true" />
              <b>{t.name}</b>
              <span>{t.holds}</span>
            </p>
            <ul>
              {t.lines.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
