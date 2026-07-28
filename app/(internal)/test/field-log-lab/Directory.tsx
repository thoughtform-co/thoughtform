"use client";

import { useRef } from "react";

import type { FlTrack } from "./fieldLogData";

/**
 * Directory — the terminal file list, and the casefile's real navigation.
 *
 * Selecting a row swaps the right column, so the rows are a VERTICAL TABLIST
 * and `TrackPanel` is their tabpanel. (A listbox would be the wrong mapping:
 * nothing is being chosen for submission, a view is being switched.) Roving
 * tabindex, ↑/↓ + Home/End.
 *
 * Row grammar is the section-menu lab's terminal tree demoted to a file
 * register: mono caps, a glyph, a dotted hairline between rows, and the
 * active row as an inverse-video gold block.
 */
interface DirectoryProps {
  tracks: readonly FlTrack[];
  activeId: string;
  onSelect: (id: string) => void;
  /** Id of the panel the rows govern. */
  controls: string;
  /** Prefixes the row ids so two clients' rows never collide. */
  idPrefix: string;
}

export function Directory({ tracks, activeId, onSelect, controls, idPrefix }: DirectoryProps) {
  const listRef = useRef<HTMLUListElement | null>(null);
  const activeIdx = Math.max(
    0,
    tracks.findIndex((t) => t.id === activeId)
  );

  const move = (next: number) => {
    const i = (next + tracks.length) % tracks.length;
    onSelect(tracks[i].id);
    listRef.current?.querySelectorAll<HTMLButtonElement>("[role='tab']")[i]?.focus();
  };

  return (
    <div className="fll-dir" data-fl-zone="directory">
      <div className="fll-dir__head">
        <span className="fll-desig">Directory · /{idPrefix}/</span>
        <span className="fll-dir__count">{tracks.length} items</span>
      </div>

      <ul
        className="fll-dir__list"
        role="tablist"
        aria-orientation="vertical"
        aria-label="Casefile contents"
        ref={listRef}
      >
        {tracks.map((t, i) => {
          const on = i === activeIdx;
          return (
            <li key={t.id}>
              <button
                type="button"
                role="tab"
                id={`${idPrefix}-row-${t.id}`}
                className="fll-row"
                data-on={on || undefined}
                aria-selected={on}
                aria-controls={controls}
                tabIndex={on ? 0 : -1}
                onClick={() => onSelect(t.id)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    move(i + 1);
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    move(i - 1);
                  } else if (e.key === "Home") {
                    e.preventDefault();
                    move(0);
                  } else if (e.key === "End") {
                    e.preventDefault();
                    move(tracks.length - 1);
                  }
                }}
              >
                <i className="fll-row__glyph" data-icon={t.icon} aria-hidden="true" />
                <span className="fll-row__file">{t.file}</span>
                <span className="fll-row__meta">{t.meta}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
