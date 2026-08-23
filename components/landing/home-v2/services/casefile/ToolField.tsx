import Image from "next/image";

import type { ProjectCase } from "@/components/landing/v7/tools-cards/toolCardData";

import { TOOL_WIREFRAMES } from "./wireframes/toolWireframes";

/**
 * ToolField — the tool dossier's BODY: the bay around the one walkthrough
 * button, and the four capability blocks beneath it (ADR-068).
 *
 * Lifted verbatim out of `ToolGallery` (ADR-072) so that TWO surfaces mount
 * ONE source of this markup: the casefile's tools plate on the landing (at
 * panel scale, behind the four-station rail) and the portfolio arc's
 * dossier beats (at page scale, one tool per beat). The markup below is
 * pinned byte-for-byte by `tests/lib/tool-gallery-markup.test.tsx`; the
 * comments that explain each block moved here with the block they explain.
 *
 * What stays with the CALLER: the console housing (`ConsoleFrame`), the
 * rail, the walkthrough state (`useWalkthrough`) and the lightbox. The
 * field only reports the click — `onWatch(trigger)` — because only the
 * caller knows where focus has to return to.
 */
interface ToolFieldProps {
  tool: ProjectCase;
  /** The walkthrough trigger was pressed; `trigger` is the button, for focus restore. */
  onWatch: (trigger: HTMLElement) => void;
}

/** "AI Image & Video Suite" from the em-segmented title. The header renders
 *  mono caps, so the gold-em split would be invisible there anyway. */
export function titleText(tool: ProjectCase): string {
  return tool.title.map((s) => s.text).join("");
}

/**
 * THE BAY — a housing around the capture, not a second frame around a
 * frame. Its walls carry the FEED line and the transport marks; the capture
 * inside still bleeds to those walls (ADR-064).
 */
export function ToolBay({ tool, onWatch }: ToolFieldProps) {
  /* AUTHORED or CAPTURED, per tool (ADR-068 D5). Absent ⇒ the capture. */
  const Wireframe = TOOL_WIREFRAMES[tool.id];

  const capture = (
    <span className="fl-shot__frame">
      {Wireframe ? (
        /* Keyed with the tool so a station switch remounts the drawing
           rather than reconciling one tool's geometry onto another's. */
        <Wireframe key={tool.id} />
      ) : (
        <Image
          key={tool.id}
          className="fl-shot__img"
          src={tool.image.src}
          alt={tool.image.alt}
          width={tool.image.width}
          height={tool.image.height}
          sizes="(min-width: 1800px) 900px, 640px"
        />
      )}
    </span>
  );

  return (
    <div className="fl-bay">
      {/* ⚠ THE FOUR GOLD CORNER BRACKETS ARE DELETED (owner, 2026-08-10).
          ADR-065's third grammar — framed but not a device — but the bay
          is ALREADY framed: it carries a full gold-15 border, the FEED
          line and the watch bar. The brackets registered a housing that
          was never in doubt, and four gold-40 marks at the corners of a
          drawing whose whole gold budget is ONE CTA plate spent the
          signal colour on chrome. The bay's border is the housing now.
          (`.fl-bay__br*` and its light override left with them.) */}

      {/* ⚠ `IN SERVICE {year} —` LIVES HERE, AND THIS IS ITS ONLY HOME
          (owner, 2026-08-07). Still no ordinal, no id, no codename:
          the mockup's `T-01` stays retired (ADR-066), and the smoke's
          bay-scoped `/\bT-\d/` scan plus its leading-ordinal scan both
          still run over this line. A four-digit year mid-string trips
          neither. */}
      <div className="fl-bay__top" aria-hidden="true">
        <span>
          FEED · IN SERVICE <em>{tool.year} —</em>
        </span>
        {tool.walkthrough ? (
          <span>
            WALKTHROUGH · <em>{tool.walkthrough.duration}</em>
          </span>
        ) : (
          <span>NO WALKTHROUGH</span>
        )}
      </div>

      {tool.walkthrough ? (
        <button
          type="button"
          className="fl-shot"
          aria-haspopup="dialog"
          /* ⚠ ONE LABEL, AND IT STAYS THE ACTION. The drawing is
             `aria-hidden`, so the wireframe branch appends the one
             clause that says what the bay is showing — WITHOUT the
             codename (ADR-066 keeps that off every label on this
             surface) and without restating the tool's name, which the
             first half of this string already carries. On the capture
             branch nothing is appended: the image's `alt` never
             reached the a11y tree anyway, because an `aria-label` on a
             button overrides its contents. */
          aria-label={`Watch the ${titleText(tool)} walkthrough — ${tool.walkthrough.duration}${
            Wireframe ? ". Interface, drawn." : ""
          }`}
          onClick={(e) => onWatch(e.currentTarget)}
        >
          {capture}
          {/* THE ONE CLEAR AFFORDANCE (owner, 2026-08-08): play cue,
              action, duration. The five transport chevrons left with the
              RUN plate — decoration reads as controls on a bar whose
              whole job is to be unmistakably one button. */}
          <span className="fl-shot__bar" aria-hidden="true">
            <i className="fl-shot__cue" />
            Watch walkthrough
            <b>{tool.walkthrough.duration}</b>
          </span>
        </button>
      ) : (
        <div className="fl-shot" data-static>
          {capture}
        </div>
      )}
    </div>
  );
}

/**
 * THE DETAIL — the tool's four capability blocks (ADR-068 U2, owner
 * 2026-08-08): title + one-sentence claim, straight from
 * `ProjectCase.capabilities`, the same canonical four the Arc card tiles
 * print. No accents: four claims, one voice. Notched on the BOTTOM-RIGHT
 * alone (ADR-065 U5 — a seated set takes its housing's diagonal).
 *
 * ⚠ THE BLOCKS SEAT ONCE, ON ROW ARRIVAL — never on a station switch
 * (owner, 2026-08-08: "four frames that should already be there"). On the
 * landing, TrackPanel is keyed per ROW upstream, so this list mounts
 * exactly once per row and the seat plays then; the ul carries NO tool key
 * and the plates are keyed BY POSITION, so a station switch swaps
 * title/desc text in place with zero motion. Capabilities are
 * registry-pinned at exactly four, which is what makes index keys safe.
 * The WIREFRAME keeps its `key={tool.id}` — that remount is deliberate.
 */
export function CapabilityBlocks({ capabilities }: { capabilities: ProjectCase["capabilities"] }) {
  return (
    <ul className="fl-detail">
      {capabilities.map((cap, i) => (
        <li className="fl-detail__plate" style={{ animationDelay: `${120 + i * 55}ms` }} key={i}>
          <span className="fl-detail__in">
            <span className="fl-detail__t">{cap.title}</span>
            <i className="fl-detail__rule" aria-hidden="true" />
            <span className="fl-detail__d">{cap.desc}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Body: ONE COLUMN — bay, detail (owner, 2026-08-07). */
export function ToolField({ tool, onWatch }: ToolFieldProps) {
  return (
    <div className="fl-toolbody">
      <ToolBay tool={tool} onWatch={onWatch} />
      <CapabilityBlocks capabilities={tool.capabilities} />
    </div>
  );
}
