import Image from "next/image";
import { useCallback, useRef, useState } from "react";

import type { ProjectCase } from "@/components/landing/v7/tools-cards/toolCardData";

import { MediaLightbox, restoreFocusAfterUnmount, useCloseOnCasefileFold } from "./MediaLightbox";

/**
 * ToolGallery — the four production tools, one in view, at panel scale.
 *
 * STRUCTURE (owner, 2026-07-31, third pass — "take a step back and fix it
 * properly"):
 *
 *   ┌ tabs ──────────────────────────────────────────────┐
 *   │ 01 · MÍMIR   02 · VESPER   03 · BABYLON   04 · …   │  codename = chrome
 *   │ BRIEFING AGENT   AI IMAGE & VIDEO SUITE   …        │  NAME = the label
 *   ├───────────────────────────┬────────────────────────┤
 *   │ BRAND INTELLIGENCE        │                        │
 *   │ Loop's own knowledge,     │   screenshot, BLED to  │
 *   │ structured.               │   the box edges        │
 *   │ Mímir unifies customer…   │                        │
 *   │ MÍMIR · INVENT · 2025     │ ▶ WATCH WALKTHROUGH 1:20│  ← the frame IS
 *   └───────────────────────────┴────────────────────────┘     the button
 *
 * Three decisions carried in markup:
 *
 * · THE FUNCTIONAL NAME LEADS. The tabs' strong line is what the tool IS
 *   ("Briefing Agent"), because a visitor cannot be expected to know the
 *   codenames; the codename rides above as chrome with the ordinal. Owner:
 *   "don't just use the internal naming."
 * · THE SHOT IS ARCHITECTURE, NOT A THUMBNAIL. It fills its half of the
 *   plate to the box edges (cover, top-anchored — dashboards lead with
 *   their header), and the walkthrough affordance is a full-width bar FUSED
 *   to its bottom edge rather than a pill floated over it. The whole frame
 *   is one button: a ~350x200 target instead of a 130x26 one.
 * · ONE GRID. The body splits 50/50 with no gap; the tabs are quarters of
 *   the same rail; the capability tiles in the panel foot (TrackPanel) sit
 *   on the same 50% split. The misalignment complaint was three stacked
 *   zones each with a private grid.
 *
 * CONTROLLED, NOT SELF-CONTAINED: `activeIdx` is owned by `TrackPanel`
 * because the panel foot's capability tiles follow the tool in view. The
 * panel is keyed per track upstream, so the gallery resets to tool 01 on a
 * row change for free.
 */
interface ToolGalleryProps {
  tools: readonly ProjectCase[];
  activeIdx: number;
  onActive: (idx: number) => void;
}

/** "AI Image & Video Suite" from the em-segmented title. The tab renders
 *  mono caps, so the gold-em split would be invisible there anyway. */
function titleText(tool: ProjectCase): string {
  return tool.title.map((s) => s.text).join("");
}

/** "Performance · Creative Strategy" -> "Performance". The full strings run
 *  to 38 chars; every surface here prints the department only. */
function dept(tool: ProjectCase): string {
  return tool.team.split("·")[0].trim();
}

export function ToolGallery({ tools, activeIdx, onActive }: ToolGalleryProps) {
  const [watching, setWatching] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const active = tools[activeIdx] ?? tools[0];

  const close = useCallback(() => {
    setWatching(false);
    const target = returnFocusRef.current;
    returnFocusRef.current = null;
    restoreFocusAfterUnmount(target);
  }, []);

  useCloseOnCasefileFold(rootRef, watching, close);

  // Roving tab index, same keyboard grammar as the client tabs above.
  const move = (i: number) => {
    if (i < 0 || i >= tools.length) return;
    onActive(i);
    tabsRef.current?.querySelectorAll<HTMLButtonElement>("[role='tab']")[i]?.focus();
  };

  if (!active) return null;

  return (
    <div className="fl-plate fl-plate--tools" ref={rootRef}>
      <div className="fl-tooltabs" role="tablist" aria-label="Production tools" ref={tabsRef}>
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
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") {
                e.preventDefault();
                move(i + 1);
              } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                move(i - 1);
              } else if (e.key === "Home") {
                e.preventDefault();
                move(0);
              } else if (e.key === "End") {
                e.preventDefault();
                move(tools.length - 1);
              }
            }}
          >
            <span className="fl-tooltab__code">
              {tool.index} · {tool.codename}
            </span>
            <span className="fl-tooltab__name">{titleText(tool)}</span>
          </button>
        ))}
      </div>

      <div className="fl-toolbody">
        <div className="fl-toolid">
          <span className="fl-toolid__kicker">{active.tagline}</span>
          <p className="fl-toolid__lead">{active.subline}</p>
          {/* The `shift` sentence — the one-line abstract of what the tool
              changed. It reads HERE, at the brief column's own copy size,
              and nowhere else in the panel. */}
          <p className="fl-toolid__desc">{active.shift}</p>
          <span className="fl-toolid__meta">
            {active.codename} · {active.mode} · {dept(active)} · {active.year}
          </span>
        </div>

        {active.walkthrough ? (
          <button
            type="button"
            className="fl-shot"
            aria-haspopup="dialog"
            aria-label={`Watch the ${titleText(active)} walkthrough — ${active.walkthrough.duration}`}
            onClick={(e) => {
              returnFocusRef.current = e.currentTarget;
              setWatching(true);
            }}
          >
            <Image
              key={active.id}
              className="fl-shot__img"
              src={active.image.src}
              alt={active.image.alt}
              width={active.image.width}
              height={active.image.height}
              sizes="480px"
            />
            <span className="fl-shot__bar" aria-hidden="true">
              <i className="fl-shot__cue" />
              Watch walkthrough
              <b>{active.walkthrough.duration}</b>
            </span>
          </button>
        ) : (
          <div className="fl-shot" data-static>
            <Image
              key={active.id}
              className="fl-shot__img"
              src={active.image.src}
              alt={active.image.alt}
              width={active.image.width}
              height={active.image.height}
              sizes="480px"
            />
          </div>
        )}
      </div>

      {watching && active.walkthrough ? (
        <MediaLightbox
          src={active.walkthrough.src}
          label={`${active.codename} · ${titleText(active)}`}
          meta={`Walkthrough · ${active.walkthrough.duration}`}
          onClose={close}
        />
      ) : null}
    </div>
  );
}
