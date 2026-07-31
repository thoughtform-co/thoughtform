import Image from "next/image";
import { useCallback, useRef, useState } from "react";

import type { ProjectCase } from "@/components/landing/v7/tools-cards/toolCardData";

import { MediaLightbox, restoreFocusAfterUnmount, useCloseOnCasefileFold } from "./MediaLightbox";

/**
 * ToolGallery — the four production tools, one in view at a readable size.
 *
 * Replaces the stacked strip (four ~100x46 thumbnails), which was too small to
 * read and showed none of the capabilities that make a tool interesting.
 *
 * CONTROLLED, NOT SELF-CONTAINED. `activeIdx` is owned by `TrackPanel`, one
 * level up, because the PANEL FOOT has to follow the tool in view — the
 * capability tiles, the context rows and the provenance line all come from the
 * selected tool, not from the track. If this component owned the state the
 * foot could not see it. `TrackPanel` is keyed per track upstream, so the
 * gallery resets to tool 01 on a row change for free.
 *
 * The lightbox is shared with `FilmsPlate` (`MediaLightbox`) — same portal,
 * same scroll lock, same focus restore. Poster-first: no `<video>` element
 * exists until Watch walkthrough is clicked.
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
      <ul className="fl-toolnav">
        {tools.map((tool, i) => (
          <li key={tool.id}>
            <button
              type="button"
              className="fl-tool"
              data-on={i === activeIdx || undefined}
              aria-pressed={i === activeIdx}
              onClick={() => onActive(i)}
            >
              <span className="fl-tool__ix">{tool.index}</span>
              <span className="fl-tool__name">{tool.codename}</span>
              <span className="fl-tool__tag">{tool.tagline}</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="fl-toolshot">
        {/* Keyed so switching tools swaps the element rather than reusing one
            <img> — otherwise the browser paints the previous tool's bitmap
            until the new one decodes, which reads as the shot lagging the
            list by a frame. */}
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
