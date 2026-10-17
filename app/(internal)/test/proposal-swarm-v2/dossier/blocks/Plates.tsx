import type { CSSProperties } from "react";

import type { Cell, Figure } from "../types";

/**
 * Plates: references, keyframes, a strip of frames, a hinge. Cells share
 * their edges inside the one frame (a ruled field, never floating cards);
 * each picture is shown whole on the plate, its label beside it in mono.
 */
export function Plates({ figure }: { figure: Extract<Figure, { kind: "plates" }> }) {
  return (
    <div className="csd-plates">
      {figure.rows.map((row, r) => (
        <div
          key={r}
          className="csd-plates__row"
          style={{ gridTemplateColumns: row.map((c) => `minmax(0, ${c.span ?? 1}fr)`).join(" ") }}
        >
          {row.map((cell, i) => (
            <PlateCell key={`${r}-${i}`} cell={cell} />
          ))}
        </div>
      ))}
      {figure.tags?.length ? (
        <ul className="csd-plates__tags">
          {figure.tags.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function PlateCell({ cell }: { cell: Cell }) {
  if (cell.kind === "still") {
    return (
      <div className="csd-cell csd-cell--still" data-lit={cell.lit ? "" : undefined}>
        <div
          className="csd-cell__pic"
          style={{ "--r": cell.still.ratio.replace("/", " / ") } as CSSProperties}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- lab: published stills, fixed box */}
          <img src={cell.still.src} alt={cell.still.alt} loading="lazy" decoding="async" />
        </div>
        <p className="csd-cell__k">{cell.label}</p>
        {cell.note ? <p className="csd-cell__note">{cell.note}</p> : null}
      </div>
    );
  }
  if (cell.kind === "list") {
    return (
      <div className="csd-cell csd-cell--list">
        <p className="csd-cell__k">{cell.label}</p>
        <ol className="csd-cell__items" data-numbered={cell.numbered ? "" : undefined}>
          {cell.items.map((it, i) => (
            <li key={it.b}>
              {cell.numbered ? (
                <span className="csd-cell__n">{String(i + 1).padStart(2, "0")}</span>
              ) : null}
              <span className="csd-cell__b">{it.b}</span>
              {it.s ? <span className="csd-cell__s">{it.s}</span> : null}
            </li>
          ))}
        </ol>
      </div>
    );
  }
  if (cell.kind === "stat") {
    return (
      <div className="csd-cell csd-cell--stat">
        <p className="csd-cell__k">{cell.label}</p>
        <p className="csd-cell__big">
          {cell.big}
          {cell.small ? <small>{cell.small}</small> : null}
        </p>
        {cell.note ? <p className="csd-cell__note">{cell.note}</p> : null}
      </div>
    );
  }
  return (
    <div className="csd-cell csd-cell--safe">
      <p className="csd-cell__k">{cell.label}</p>
      <SafeBand />
      {cell.note ? <p className="csd-cell__note">{cell.note}</p> : null}
    </div>
  );
}

/**
 * Where text may go on a 9:16 feed frame: the app's bands are covered, the
 * text lives in the middle. The frame is the drawing; its three bands are
 * named beside it on straight leaders, never on their faces.
 */
function SafeBand() {
  return (
    <div
      className="csd-safe"
      role="img"
      aria-label="A 9:16 frame: the top band and the bottom band are covered by the app; all text sits in the middle"
    >
      <svg viewBox="0 0 180 320" aria-hidden="true" focusable="false">
        <rect className="csd-safe__frame" x="0.5" y="0.5" width="179" height="319" />
        <rect className="csd-safe__ban" x="0.5" y="0.5" width="179" height="27" />
        <rect className="csd-safe__ban" x="0.5" y="223" width="179" height="96.5" />
        <rect className="csd-safe__ok" x="10" y="36" width="160" height="180" />
      </svg>
      <ol className="csd-safe__keys" aria-hidden="true">
        <li style={{ top: "4.3%" }}>App bar</li>
        <li style={{ top: "39%" }} data-lit="">
          All text here
        </li>
        <li style={{ top: "84%" }}>Captions, buttons</li>
      </ol>
    </div>
  );
}
