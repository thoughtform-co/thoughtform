"use client";

import type { CSSProperties } from "react";

import type { CharacterEra, CharacterEraId } from "@/lib/voidwalker/characterEras";

interface Props {
  eras: readonly CharacterEra[];
  activeId: CharacterEraId;
  onSelect: (id: CharacterEraId) => void;
}

/**
 * The era rail — a horizontal strip of six pips under the stage. The
 * ACTIVE pip letters the wardrobe title in full; the others letter the
 * `short` label. Clicks scroll-nudge the runway to that era (the
 * scroll hook stays the single writer of the CSS var).
 *
 * ⚠ Buttons over anchors: the era is a selector on the same page, not
 * a navigation. Anchors here would fire `hashchange` and steal the
 * corridor's own scroll intent.
 */
export function CharacterEraRail({ eras, activeId, onSelect }: Props) {
  return (
    <nav className="ch-rail" aria-label="Era rail — pick a version">
      <ol className="ch-rail__list">
        {eras.map((era, i) => {
          const active = era.id === activeId;
          return (
            <li key={era.id} className="ch-rail__item" data-active={active || undefined}>
              <button
                type="button"
                className="ch-rail__pip"
                aria-current={active ? "true" : undefined}
                onClick={() => onSelect(era.id)}
                style={{ ["--ch-rail-i" as string]: i } as CSSProperties}
              >
                <span className="ch-rail__ord" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="ch-rail__year">{era.year}</span>
                <span className="ch-rail__name">{active ? era.wardrobe : era.short}</span>
                <span className="ch-rail__diamond" aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
