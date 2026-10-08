"use client";

import { useState, type CSSProperties } from "react";

import {
  CLIENT_HREF,
  CLIENT_NAME,
  RUN_MODE_LABEL,
  clientsOf,
  type Workstream,
} from "@/lib/services-workstreams/record";

/**
 * The EVIDENCE DECK — what a workstream card opens (the ring's drawer is off
 * on this lab). A pile of client folders beside the front card, one per
 * client whose work sits in that workstream: what the work is, how far it
 * runs without a person, the skill, who decides, the line of proof, and the
 * way into the page where the whole artifact lives.
 *
 * The folders are the proof stack's grammar (ADR-097): glass, a flat gold
 * lip on the lattice's clipped ring (`.lat-frame`, TR — an oriented set),
 * the head a BAND, the children square. ONE FOLDER OPEN, the rest a band
 * each, so the pile never outgrows the frame. They strike in on a
 * centre-out aperture — pure motion, no opacity flash (ADR-097 U12).
 */

/** Rows an open folder lists before "and n more", by the seat's height. */
const rowsFor = (h: number) => (h < 560 ? 2 : h < 680 ? 3 : 4);

interface EvidenceDeckProps {
  workstream: Workstream;
  /** Viewport-px seat, beside the front card. */
  seat: { left: number; top: number; width: number; maxHeight: number };
  onClose: () => void;
}

export function EvidenceDeck({ workstream, seat, onClose }: EvidenceDeckProps) {
  const [openIdx, setOpenIdx] = useState(0);
  const rows = rowsFor(seat.maxHeight);
  const style = {
    left: `${seat.left}px`,
    top: `${seat.top}px`,
    width: `${seat.width}px`,
    maxHeight: `${seat.maxHeight}px`,
  } as CSSProperties;

  return (
    <aside className="svw-deck" style={style} aria-label={`The work behind ${workstream.name}`}>
      <div className="svw-deck__head">
        <span className="svw-deck__kicker">The work behind {workstream.name}</span>
        <button type="button" className="svw-deck__close" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>
      {clientsOf(workstream).map((client, i) => {
        const entries = workstream.entries.filter((e) => e.client === client);
        const href = CLIENT_HREF[client];
        const open = openIdx === i;
        return (
          <article
            key={client}
            className="svw-folder lat-frame"
            data-cut="tr"
            style={{ "--svw-i": i } as CSSProperties}
          >
            <button
              type="button"
              className="svw-folder__band"
              aria-expanded={open}
              onClick={() => setOpenIdx(i)}
            >
              <span className="svw-folder__client">{CLIENT_NAME[client]}</span>
              <span className="svw-folder__count">
                {entries.length} {entries.length === 1 ? "piece" : "pieces"} of work
              </span>
            </button>
            {open && (
              <>
                <ul className="svw-folder__rows">
                  {entries.slice(0, rows).map((e) => (
                    <li key={e.id} className="svw-row" data-mode={e.runMode}>
                      <span className="svw-row__title">{e.title}</span>
                      <span className="svw-row__mode">{RUN_MODE_LABEL[e.runMode]}</span>
                      <span className="svw-row__meta">
                        {[e.skill, e.gate].filter(Boolean).join(" · ")}
                      </span>
                      {e.proof && <span className="svw-row__proof">{e.proof}</span>}
                    </li>
                  ))}
                </ul>
                {entries.length > rows && (
                  <p className="svw-folder__more">And {entries.length - rows} more on the record</p>
                )}
                {href && (
                  <a className="svw-folder__link" href={href}>
                    See {CLIENT_NAME[client]}&rsquo;s work <span aria-hidden="true">→</span>
                  </a>
                )}
              </>
            )}
          </article>
        );
      })}
    </aside>
  );
}
