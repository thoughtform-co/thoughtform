"use client";

import { useState } from "react";

import type { CaseMapShapeKey } from "@/lib/cases/types";

import { Mark } from "./kit";
import { shapeFor, streamOf, type MplModel, type MplReading } from "./models";

/**
 * READOUT ROWS — the owner's travel-data grammar and nothing else
 * ([[readout-rows-framed-key]], /arcs ADR-118 U3): a framed key cell (a dawn
 * well, outlined), the value framed beside it on the shared edge and set
 * right, rows a few pixels apart. No drawing, no sentence above the rows.
 *
 *   WORK           one row per department, the value its streams' state
 *                  marks. Read-only (32px rows fit the 323px bay; a tappable
 *                  row would need 44).
 *   CONFIGURATION  a stepper row (the selection lives here), then OWNER ·
 *                  RUNS · REACHES · RUNS IN.
 *   LAYER          one row per shape, the value a run of Skill ticks (the
 *                  count is the ticks); the open row's key filled, its
 *                  sentence under the rows.
 */
export function VariantRows({
  model,
  reading,
  sel,
  onSel,
}: {
  model: MplModel;
  reading: MplReading;
  sel: string;
  onSel: (id: string) => void;
}) {
  const s = streamOf(model, sel);
  /* The open shape belongs to the stream it was opened for: a new pick
     re-opens LAYER on that stream's first shape (derived, never reset in an
     effect). */
  const [opened, setOpened] = useState<{ sel: string; key: CaseMapShapeKey } | null>(null);
  const open = opened && opened.sel === s.id ? opened.key : shapeFor(model, s).key;
  const setOpen = (key: CaseMapShapeKey) => setOpened({ sel: s.id, key });
  const idx = model.streams.findIndex((x) => x.id === s.id);
  const step = (d: number) => {
    const n = model.streams.length;
    onSel(model.streams[(idx + d + n) % n]!.id);
  };

  if (reading === "work") {
    return (
      <div className="mpl-v mpl-rows" data-reading="work">
        <ul className="mpl-rows__list">
          {model.depts.map((d) => (
            <li key={d.id} className="mpl-row mpl-row--static">
              <span className="mpl-row__k">{d.short}</span>
              <span className="mpl-row__v mpl-row__marks">
                {d.streams.map((x) => (
                  <Mark key={x.id} led={!x.configured} />
                ))}
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (reading === "configuration") {
    const rows: [string, string][] = [
      ["Owner", s.owner],
      ["Runs", s.runs],
      ["Reaches", s.reaches],
      ["Runs in", s.runsIn],
    ];
    return (
      <div className="mpl-v mpl-rows" data-reading="configuration">
        <div className="mpl-row mpl-row--step">
          <button
            type="button"
            className="mpl-row__k mpl-row__btn"
            aria-label="Previous stream"
            onClick={() => step(-1)}
          >
            <span aria-hidden="true">‹</span>
          </button>
          <span className="mpl-row__v mpl-row__title">{s.title}</span>
          <button
            type="button"
            className="mpl-row__k mpl-row__btn"
            aria-label="Next stream"
            onClick={() => step(1)}
          >
            <span aria-hidden="true">›</span>
          </button>
        </div>
        <ul className="mpl-rows__list">
          {rows.map(([k, v]) => (
            <li key={k} className="mpl-row" data-owner={k === "Owner" || undefined}>
              <span className="mpl-row__k">{k}</span>
              <span className="mpl-row__v">{v}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const shape = model.shapes.find((sh) => sh.key === open) ?? model.shapes[0]!;
  return (
    <div className="mpl-v mpl-rows" data-reading="layer">
      <ul className="mpl-rows__list" role="listbox" aria-label="Shapes">
        {model.shapes.map((sh) => (
          <li key={sh.key}>
            <button
              type="button"
              role="option"
              aria-selected={sh.key === open}
              className="mpl-row mpl-row--hit"
              data-on={sh.key === open || undefined}
              onClick={() => setOpen(sh.key)}
            >
              <span className="mpl-row__k">{sh.name}</span>
              <span className="mpl-row__v mpl-row__ticks" aria-hidden="true">
                {sh.skills.map((k) => (
                  <i key={k.id} data-flag={k.flagship || undefined} />
                ))}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <div className="mpl-rows__open">
        <p className="mpl-sentence">{shape.meaning}</p>
        <p className="mpl-rows__skills">
          {shape.skills.map((k) => (
            <span key={k.id}>{k.short}</span>
          ))}
        </p>
      </div>
    </div>
  );
}
