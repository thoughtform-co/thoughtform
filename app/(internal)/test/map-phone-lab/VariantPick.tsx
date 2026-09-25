"use client";

import { useState } from "react";

import type { CaseMapShapeKey } from "@/lib/cases/types";

import { Mark, Position, Spine } from "./kit";
import { shapeFor, streamOf, type MplModel, type MplReading } from "./models";

/**
 * ONE STREAM — one thing per reading, tied by one selected stream (ADR-069's
 * persistent object at phone size): picked in WORK, drawn in CONFIGURATION,
 * lit in LAYER.
 *
 *   WORK           the 20 shown streams as a 4×5 field of state tiles
 *                  (production's own grid, `PDA_COLS × PDA_ROWS`), each the
 *                  team code and the state mark only; ONE caption under the
 *                  field names the picked stream.
 *   CONFIGURATION  that stream as a spine, and a stepper through the 20.
 *   LAYER          five bars, one per shape, each cut into one cell per
 *                  Skill (the count is the cells — no numeral); the picked
 *                  stream's shapes outlined, the open one filled; its
 *                  sentence under the bars, its Skills where the bay is tall.
 */
export function VariantPick({
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
      <div className="mpl-v mpl-pick" data-reading="work">
        <div className="mpl-pick__field" role="listbox" aria-label="Streams">
          {model.streams.map((x) => (
            <button
              key={x.id}
              type="button"
              role="option"
              aria-selected={x.id === s.id}
              aria-label={x.title}
              className="mpl-pick__tile"
              data-on={x.id === s.id || undefined}
              data-led={x.configured ? undefined : ""}
              onClick={() => onSel(x.id)}
            >
              <Mark led={!x.configured} />
              <span className="mpl-pick__code">{x.dept}</span>
            </button>
          ))}
        </div>
        <div className="mpl-pick__caption">
          <p className="mpl-pick__title">{s.title}</p>
          <p className="mpl-pick__meta">
            <span>{s.deptName}</span>
            <span>{s.lane}</span>
          </p>
        </div>
      </div>
    );
  }

  if (reading === "configuration") {
    return (
      <div className="mpl-v mpl-pick" data-reading="configuration">
        <Spine s={s} />
        <div className="mpl-stepper">
          <button
            type="button"
            className="mpl-stepper__b"
            aria-label="Previous stream"
            onClick={() => step(-1)}
          >
            <span aria-hidden="true">‹</span>
          </button>
          <Position n={model.streams.length} i={idx} />
          <button
            type="button"
            className="mpl-stepper__b"
            aria-label="Next stream"
            onClick={() => step(1)}
          >
            <span aria-hidden="true">›</span>
          </button>
        </div>
      </div>
    );
  }

  const shape = model.shapes.find((sh) => sh.key === open) ?? model.shapes[0]!;
  const most = Math.max(...model.shapes.map((sh) => sh.skills.length));
  return (
    <div className="mpl-v mpl-pick" data-reading="layer">
      <div className="mpl-pick__bars" role="listbox" aria-label="Shapes">
        {model.shapes.map((sh) => (
          <button
            key={sh.key}
            type="button"
            role="option"
            aria-selected={sh.key === open}
            className="mpl-pick__bar"
            data-on={sh.key === open || undefined}
            data-tap={s.taps.includes(sh.key) || undefined}
            onClick={() => setOpen(sh.key)}
          >
            <span className="mpl-pick__barname">{sh.name}</span>
            <span
              className="mpl-pick__cells"
              aria-hidden="true"
              style={{ width: `${(100 * sh.skills.length) / most}%` }}
            >
              {sh.skills.map((k) => (
                <i key={k.id} />
              ))}
            </span>
          </button>
        ))}
      </div>
      <div className="mpl-pick__open">
        <p className="mpl-sentence">{shape.meaning}</p>
        <p className="mpl-pick__skills">
          {shape.skills.map((k) => (
            <span key={k.id} data-flag={k.flagship || undefined}>
              {k.short}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}
