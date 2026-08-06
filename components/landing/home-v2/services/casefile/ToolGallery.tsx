import Image from "next/image";
import { useCallback, useRef, useState } from "react";

import type { ProjectCase } from "@/components/landing/v7/tools-cards/toolCardData";

import { MediaLightbox, restoreFocusAfterUnmount, useCloseOnCasefileFold } from "./MediaLightbox";
import { ConsoleFrame } from "./console/ConsoleFrame";
import { ConsoleRail } from "./console/ConsoleRail";

/**
 * ToolGallery — the four production tools, one in view, at panel scale.
 *
 * STRUCTURE (owner, 2026-08-06 — "move the text to the bottom, and between
 * the thumbnail and the text put a few blocks"):
 *
 *   ┌ rail ──────────────────────────────────────────────┐
 *   │ ◆ BRIEFING AGENT   ◇ AI IMAGE & VIDEO SUITE   …    │  the FUNCTION only
 *   ├────────────────────────────────────────────────────┤
 *   │                                                    │
 *   │        the capture, FULL WIDTH, bled to the         │
 *   │        console's own inner edges                    │
 *   │ ▶ WATCH WALKTHROUGH ··························· 1:20│  ← the frame IS
 *   ├────────────────────────────────────────────────────┤     the button
 *   │ PERMISSIONED GRAPH      │ PROACTIVE BRIEFING        │
 *   │ Customer voice, paid…   │ Relevant insights surface…│
 *   │ HEADLESS SUBSTRATE      │ SHARED BI LAYER           │
 *   ├─ foot ─────────────────────────────────────────────┤
 *   │  Loop's own knowledge, structured. Mímir unifies…   │
 *   │        MÍMIR · INVENT · PERFORMANCE · 2025          │
 *   └────────────────────────────────────────────────────┘
 *
 * Four decisions carried in markup:
 *
 * · THE FUNCTIONAL NAME IS THE WHOLE LABEL (owner, 2026-08-06). The rail says
 *   what the tool IS ("Briefing Agent") and nothing else — the `01 · MÍMIR`
 *   chrome line above it is gone, along with every other ordinal on this
 *   surface. That keeps the half of ADR-056 U9 that mattered ("don't just use
 *   the internal naming") and drops the half that put internal naming back one
 *   line higher. The codename survives as provenance, not as a label.
 * · CONTEXT LIVES AT THE BOTTOM, and that is now the rule for every plate that
 *   has any. The left identity column is gone: it took half the width from the
 *   one thing a reader came to see. The subline and the `shift` sentence are
 *   the console FOOT, exactly as the map's reading sentence has been.
 * · THE SHOT IS ARCHITECTURE, NOT A THUMBNAIL. Full width now, bleeding to the
 *   console's inner edges (cover, top-anchored — dashboards lead with their
 *   header; a `contain` letterbox was the "plastered on" read), with the
 *   walkthrough affordance a full-width bar FUSED to its bottom edge. The whole
 *   frame is one button.
 *   ⚠ THE 16:10 BOUND IS GONE, and its reasoning inverts rather than lapsing.
 *   ADR-056 U9 bounded the window because a HALF-WIDTH column made it tall and
 *   narrow over a wide capture, cropping away most of it. Full width makes it
 *   wide and short, which is the shape `cover` + a top anchor wants; the image
 *   takes whatever the facts and the foot leave, over a floor.
 * · THE FACTS SIT BETWEEN THEM. Four capability blocks, straight off
 *   `ProjectCase.capabilities` — a capture shows a tool running and says
 *   nothing about what it does.
 *
 * CONTROLLED, NOT SELF-CONTAINED: `activeIdx` is owned by `TrackPanel`. The
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
    <ConsoleFrame
      className="fl-plate fl-plate--tools"
      rootRef={rootRef}
      rail={
        <ConsoleRail
          stations={tools.map((t) => ({ id: t.id, name: titleText(t) }))}
          activeIdx={activeIdx}
          onActive={onActive}
          label="Production tools"
        />
      }
      /* ⚠ CONTEXT GOES TO THE FOOT, ON EVERY PLATE THAT HAS ANY (owner,
         2026-08-06). The map already printed its sentence here; the tools
         plate spent half its width on a left text column instead, which
         halved the capture. Moving it down is what lets the shot run the
         full panel — and the sentence inherits the foot's own centred sans
         for free, so the two rows finally read in one voice.

         SUBLINE THEN SHIFT, in ONE paragraph. Two stacked blocks cost a
         line box and read as two claims; the subline is the lead of the
         sentence that follows it. The lead is DAWN at weight 500, not gold
         — gold as small text measures ~1.8:1 on the parchment ground
         (ADR-058), and a foot is the last place to spend that. */
      /* ⚠ THE FOOT IS THE SENTENCE ALONE (owner, 2026-08-06). The
         `MÍMIR · INVENT · PERFORMANCE · 2025` provenance line that sat under
         it is deleted as clutter — it was four pieces of metadata a reader of
         a case study never asked for, printed at chrome size under the one
         sentence that explains the tool. The codename now survives only as
         the lightbox's label, which is the one place it is doing work. */
      foot={
        <div className="fl-toolfoot">
          <p>
            <b>{active.subline}</b> {active.shift}
          </p>
        </div>
      }
    >
      <div className="fl-toolbody">
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
            <span className="fl-shot__frame">
              <Image
                key={active.id}
                className="fl-shot__img"
                src={active.image.src}
                alt={active.image.alt}
                width={active.image.width}
                height={active.image.height}
                sizes="(min-width: 1800px) 900px, 640px"
              />
            </span>
            <span className="fl-shot__bar" aria-hidden="true">
              <i className="fl-shot__cue" />
              Watch walkthrough
              <b>{active.walkthrough.duration}</b>
            </span>
          </button>
        ) : (
          <div className="fl-shot" data-static>
            <span className="fl-shot__frame">
              <Image
                key={active.id}
                className="fl-shot__img"
                src={active.image.src}
                alt={active.image.alt}
                width={active.image.width}
                height={active.image.height}
                sizes="(min-width: 1800px) 900px, 640px"
              />
            </span>
          </div>
        )}

        {/* THE FACTS, between the capture and the sentence (owner,
            2026-08-06 — "a few blocks like we have on our shards repo").
            `ProjectCase.capabilities` is a pinned 4-tuple and this is where
            it was always meant to read: a screenshot shows a tool running
            and says nothing about what it does, and the foot's sentence is
            one claim, not four. `.fl-caps` is the tools foot's own grammar,
            revived — the CSS never left, only its renderer did. */}
        <ul className="fl-caps fl-caps--tool">
          {active.capabilities.map((c, i) => (
            <li className="fl-cap" key={i}>
              <span className="fl-cap__t">{c.title}</span>
              <span className="fl-cap__d">{c.desc}</span>
            </li>
          ))}
        </ul>
      </div>

      {watching && active.walkthrough ? (
        <MediaLightbox
          src={active.walkthrough.src}
          label={`${active.codename} · ${titleText(active)}`}
          meta={`Walkthrough · ${active.walkthrough.duration}`}
          onClose={close}
        />
      ) : null}
    </ConsoleFrame>
  );
}
