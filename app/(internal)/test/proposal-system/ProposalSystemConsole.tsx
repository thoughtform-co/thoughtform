"use client";

import { useState } from "react";

import {
  PS_DIRECTIONS,
  PS_KNOB_LIST,
  directionOf,
  knobsFor,
  psHref,
  type PsKnobs,
  type PsTheme,
} from "@/lib/proposal-system/variants";

/**
 * ProposalSystemConsole — the lattice lab's console, every control a LINK:
 * the page is a server route, so a knob is a navigation (the instrument
 * lab's rows, `InstrumentLabShell.tsx`, with `<a>` for `<button>`).
 */
export function ProposalSystemConsole({ knobs, theme }: { knobs: PsKnobs; theme: PsTheme }) {
  const [open, setOpen] = useState(false);
  const dirId = directionOf(knobs);
  const dirDef = PS_DIRECTIONS.find((d) => d.id === dirId);
  return (
    <div className="lat-lab ps-lab">
      <aside
        className="lat-console"
        data-open={open || undefined}
        role="group"
        aria-label="Proposal system controls"
      >
        <div className="lat-console__row">
          <span className="lat-console__title">Direction</span>
          {PS_DIRECTIONS.map((d) => (
            <a
              key={d.id}
              className="lat-btn"
              data-on={dirId === d.id || undefined}
              aria-current={dirId === d.id ? "true" : undefined}
              title={d.question}
              href={psHref(knobsFor(d.id), theme)}
            >
              {d.id} · {d.name}
            </a>
          ))}
          <span className="lat-console__rule" aria-hidden="true" />
          <span className="lat-console__title">Theme</span>
          {(["dark", "light"] as const).map((t) => (
            <a
              key={t}
              className="lat-btn"
              data-on={theme === t || undefined}
              aria-current={theme === t ? "true" : undefined}
              href={psHref(knobs, t)}
            >
              {t}
            </a>
          ))}
          <button
            type="button"
            className="lat-btn lat-btn--fold"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
          >
            {open ? "Hide" : "Show"}
          </button>
        </div>
        {PS_KNOB_LIST.map(({ key, def }) => (
          <div className="lat-console__row" key={key}>
            <span className="lat-console__title">{def.label}</span>
            {def.values.map((v) => (
              <a
                key={v}
                className="lat-btn"
                data-on={knobs[key] === v || undefined}
                aria-current={knobs[key] === v ? "true" : undefined}
                title={def.note}
                href={psHref({ ...knobs, [key]: v }, theme)}
              >
                {v}
              </a>
            ))}
          </div>
        ))}
        <p className="lat-thesis">
          <b>{dirDef ? `${dirDef.id} · ${dirDef.name}` : "Mixed"}</b>
          {dirDef
            ? dirDef.question
            : "a hand-mixed set — no direction claims it, and the stamp says so."}
        </p>
      </aside>
    </div>
  );
}
