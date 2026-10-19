import type { CSSProperties } from "react";

import type { Figure } from "../types";

type SheetFigure = Extract<Figure, { kind: "sheet" }>;

const letter = (i: number) => String.fromCharCode(65 + i);

/**
 * Sheet: a spreadsheet as the team had it, in the look of the app it lived
 * in (a light grid, lettered columns, numbered rows, a tab at the foot).
 * The faults are marked on their cells by number and named in the legend
 * under the grid; nothing else is lettered.
 */
export function Sheet({ figure }: { figure: SheetFigure }) {
  const marks = new Map(figure.marks.map((m) => [`${m.row}:${m.col}`, m.n]));
  return (
    <div className="gsh">
      <div className="gsh-bar">
        <span className="gsh-file">{figure.file}</span>
        <span className="gsh-fx">
          <i>fx</i>
          <code>=TEXTJOIN(&quot;_&quot;, TRUE, A2:R2)</code>
        </span>
      </div>
      <div className="gsh-grid">
        <table>
          <thead>
            <tr>
              <th className="gsh-corner" />
              {figure.columns.map((c, i) => (
                <th key={i} style={{ "--w": `${c.w ?? 1}` } as CSSProperties}>
                  {letter(i)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="gsh-head">
              <td className="gsh-n">1</td>
              {figure.columns.map((c) => (
                <td key={c.label}>{c.label}</td>
              ))}
            </tr>
            {figure.rows.map((r, ri) => (
              <tr key={ri}>
                <td className="gsh-n">{ri + 2}</td>
                {r.map((cell, ci) => {
                  const n = marks.get(`${ri}:${ci}`);
                  return (
                    <td key={ci} data-mark={n ? "" : undefined}>
                      <span>{cell}</span>
                      {n ? <b className="gsh-mark">{n}</b> : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="gsh-foot">
        <span className="gsh-tab">{figure.tab}</span>
        <ol className="gsh-notes">
          {figure.notes.map((x) => (
            <li key={x.n}>
              <b className="gsh-mark">{x.n}</b>
              {x.text}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
