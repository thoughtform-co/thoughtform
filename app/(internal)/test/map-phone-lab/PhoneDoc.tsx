"use client";

import { useEffect, useMemo, type CSSProperties, type ReactNode } from "react";

import { ConsoleRail } from "@/components/landing/home-v2/services/casefile/console/ConsoleRail";
import { ProofCard } from "@/components/landing/home-v2/services/proof-stack/ProofCard";
import {
  proofStackClient,
  proofStackTracks,
} from "@/components/landing/home-v2/services/proof-stack/proofOrder";

import { MPL_READINGS, MPL_STATIONS, type MplModel, type MplReading } from "./models";
import { VariantDeck } from "./VariantDeck";
import { VariantPick } from "./VariantPick";
import { VariantRows } from "./VariantRows";
import type { MplId } from "./variants";

/**
 * ONE PHONE DOCUMENT, at the real viewport (the lab's single mode; the board
 * mounts one per direction in an iframe). ⚠ The frame is PRODUCTION's: the
 * pile's own classes under `proof-stack.css`'s split rules, which only fire
 * at a real phone viewport (`max-width: 960px` and `min-height: 681px`) —
 * that is why the board uses iframes rather than boxes on a desktop page.
 *
 *   · the four projects' head bands above, as the reader sees them when the
 *     last field is pinned: the REAL record cards, each clipped to its peek,
 *     receding by the depth the stack hook would have written;
 *   · the map card's field sheet on its own pin line, built from
 *     `ProofCard`'s field markup — `shipped` mounts the real `ProofCard`
 *     (its rail is the console's, portalled into the tabs), the directions
 *     get the same shell with the real `ConsoleRail` in the tab row and the
 *     direction in the bay.
 */

const DRAWINGS: Record<
  Exclude<MplId, "shipped">,
  (p: {
    model: MplModel;
    reading: MplReading;
    sel: string;
    onSel: (id: string) => void;
  }) => ReactNode
> = {
  pick: (p) => <VariantPick {...p} />,
  rows: (p) => <VariantRows {...p} />,
  deck: (p) => <VariantDeck key={p.reading} {...p} />,
};

function FieldSheet({
  reading,
  onReading,
  label,
  children,
}: {
  reading: MplReading;
  onReading: (r: MplReading) => void;
  label: string;
  children: ReactNode;
}) {
  const idx = MPL_READINGS.indexOf(reading);
  return (
    <article className="pf-card pf-card--field" aria-label={label}>
      <div className="pf-card__body">
        <div className="pf-card__field" data-proof-settled="">
          <div className="pf-card__tabs">
            <ConsoleRail
              stations={MPL_STATIONS}
              activeIdx={idx}
              onActive={(i) => onReading(MPL_READINGS[i] ?? "work")}
              label="Map readings"
            />
          </div>
          <div className="pf-card__bay">{children}</div>
          <div className="pf-card__foot" />
        </div>
      </div>
    </article>
  );
}

export function PhoneDoc({
  v,
  model,
  reading,
  onReading,
  sel,
  onSel,
  stamp,
}: {
  v: MplId;
  model: MplModel;
  reading: MplReading;
  onReading: (r: MplReading) => void;
  sel: string;
  onSel: (id: string) => void;
  stamp: string;
}) {
  const tracks = useMemo(() => proofStackTracks(), []);
  const client = useMemo(() => proofStackClient(), []);
  const map = tracks[tracks.length - 1]!;

  /* `shipped` keeps the console's own reading state; the lab drives it by
     pressing the real rail's tab, so `?r=` means the same thing in every
     column. */
  useEffect(() => {
    if (v !== "shipped") return;
    const i = MPL_READINGS.indexOf(reading);
    const tab = document.querySelectorAll<HTMLButtonElement>(".mpl-pile [role='tab']")[i];
    if (tab && tab.getAttribute("aria-selected") !== "true") tab.click();
  }, [v, reading]);

  return (
    <div className="mpl-phone">
      <div
        className="pf-stack pf-stack--split mpl-pile"
        style={
          client.accentRgb ? ({ "--pf-accent-rgb": client.accentRgb } as CSSProperties) : undefined
        }
      >
        <div className="pf-stack__runway" style={{ "--pc-n": tracks.length + 1 } as CSSProperties}>
          {tracks.map((t, k) => (
            <div
              key={t.id}
              className="pf-slot pf-slot--record mpl-pile__band"
              data-pc-index={2 * k}
              data-pc-panel="record"
              style={
                {
                  "--i": k,
                  zIndex: 2 * k + 1,
                  /* The depth the stack hook writes once the last field has
                     seated: every later slot entered, the record's own field
                     subtracted by the cover channel. */
                  "--pc-depth": 2 * (tracks.length - 1 - k) + 1,
                  "--pc-cover": 1,
                } as CSSProperties
              }
            >
              <ProofCard track={t} client={client} panel="record" />
            </div>
          ))}
          <div
            className="pf-slot pf-slot--field"
            data-pc-index={2 * tracks.length - 1}
            data-pc-panel="field"
            style={{ "--i": tracks.length, zIndex: 2 * tracks.length } as CSSProperties}
          >
            {v === "shipped" ? (
              <ProofCard track={map} client={client} panel="field" />
            ) : (
              <FieldSheet
                reading={reading}
                onReading={onReading}
                label={map.arc?.title ?? map.project}
              >
                {DRAWINGS[v]({ model, reading, sel, onSel })}
              </FieldSheet>
            )}
          </div>
        </div>
      </div>
      <p className="mpl-read" data-stamp={stamp} aria-hidden="true" />
    </div>
  );
}
