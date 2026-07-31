import Image from "next/image";
import { useCallback, useRef, useState } from "react";

import type { ProjectCase } from "@/components/landing/v7/tools-cards/toolCardData";

import { MediaLightbox, restoreFocusAfterUnmount, useCloseOnCasefileFold } from "./MediaLightbox";

/**
 * ToolGallery — the four production tools, one in view at a readable size.
 *
 * LAYOUT (owner, 2026-07-31, second pass): the switcher is a HORIZONTAL tab
 * row across the top, which frees the left column for the selected tool's
 * concise description. The first pass put the switcher in that column and
 * left the tool unexplained inside the plate — the description was three
 * zones away at the very bottom of the panel, at 8.5px.
 *
 * The tabs are deliberately NOT the client tabs above them: those are
 * left-packed, larger, and marked by an underline. These distribute across
 * the full width, carry an `01–04` ordinal, and mark the active one with a
 * gold rule + wash. Same family, clearly a different rank.
 *
 * CONTROLLED, NOT SELF-CONTAINED. `activeIdx` is owned by `TrackPanel`
 * because the PANEL FOOT follows the tool in view — the capability tiles and
 * the context rows both come from the selected tool. If this component owned
 * the state the foot could not see it. `TrackPanel` is keyed per track
 * upstream, so the gallery resets to tool 01 on a row change for free.
 */
interface ToolGalleryProps {
  tools: readonly ProjectCase[];
  activeIdx: number;
  onActive: (idx: number) => void;
}

export function ToolGallery({ tools, activeIdx, onActive }: ToolGalleryProps) {
  const [watching, setWatching] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const active = tools[activeIdx] ?? tools[0];

  const close = useCallback(() => {
    setWatching(false);
    const target = returnFocusRef.current;
    returnFocusRef.current = null;
    restoreFocusAfterUnmount(target);
  }, []);

  useCloseOnCasefileFold(rootRef, watching, close);

  if (!active) return null;

  return (
    <div className="fl-plate fl-plate--tools" ref={rootRef}>
      <div className="fl-tooltabs" role="tablist" aria-label="Production tools">
        {tools.map((tool, i) => (
          <button
            key={tool.id}
            type="button"
            role="tab"
            className="fl-tooltab"
            data-on={i === activeIdx || undefined}
            aria-selected={i === activeIdx}
            tabIndex={i === activeIdx ? 0 : -1}
            onClick={() => onActive(i)}
          >
            <span className="fl-tooltab__ix">{tool.index}</span>
            <span className="fl-tooltab__name">{tool.codename}</span>
          </button>
        ))}
      </div>

      <div className="fl-toolbody">
        <div className="fl-toolbrief">
          <span className="fl-toolbrief__tag">{active.tagline}</span>
          {/* The `shift` sentence, moved here from the panel's provenance line
              (owner: "don't know if we need the utter bottom text"). It is the
              one-sentence abstract of what the tool changed — it belongs
              beside the screenshot at reading size, not at 8.5px three zones
              down. The bottom line is gone for this row, not duplicated. */}
          <p className="fl-toolbrief__body">{active.shift}</p>
        </div>

        <div className="fl-toolshot">
          {/* Keyed so switching tools swaps the element rather than reusing
              one <img> — otherwise the browser paints the previous tool's
              bitmap until the new one decodes, which reads as the shot
              lagging the tabs by a frame. */}
          <Image
            key={active.id}
            className="fl-toolshot__img"
            src={active.image.src}
            alt={active.image.alt}
            width={active.image.width}
            height={active.image.height}
            sizes="440px"
          />
          {active.walkthrough ? (
            <button
              type="button"
              className="fl-toolwatch"
              aria-haspopup="dialog"
              onClick={(e) => {
                returnFocusRef.current = e.currentTarget;
                setWatching(true);
              }}
            >
              <i className="fl-toolwatch__cue" aria-hidden="true" />
              Watch walkthrough
            </button>
          ) : null}
        </div>
      </div>

      {watching && active.walkthrough ? (
        <MediaLightbox
          src={active.walkthrough.src}
          label={`${active.codename} · ${active.tagline}`}
          meta="Walkthrough"
          onClose={close}
        />
      ) : null}
    </div>
  );
}
