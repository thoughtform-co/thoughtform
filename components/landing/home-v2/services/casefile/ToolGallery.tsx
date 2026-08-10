import Image from "next/image";
import { useCallback, useRef, useState } from "react";

import type { ProjectCase } from "@/components/landing/v7/tools-cards/toolCardData";

import { MediaLightbox, restoreFocusAfterUnmount, useCloseOnCasefileFold } from "./MediaLightbox";
import { ConsoleFrame } from "./console/ConsoleFrame";
import { ConsoleRail } from "./console/ConsoleRail";
import { TOOL_WIREFRAMES } from "./wireframes/toolWireframes";

/**
 * ToolGallery — the four production tools, one in view, at panel scale.
 *
 * STRUCTURE (owner's field template — ADR-068):
 *
 *   ┌ rail ──────────────────────────────────────────────┐
 *   │ ◆ BRIEFING AGENT  ◇ IMAGE & VIDEO  ◇ UGC DUBBER  … │  the HANDLE
 *   ├────────────────────────────────────────────────────┤
 *   │ ┌ FEED · IN SERVICE 2025 ── WALKTHROUGH · 1:20 ─┐  │
 *   │ ⌐                                               ¬  │  ← the bay wraps
 *   │       the authored wireframe, bled to the walls     │    the ONE button
 *   │ ⌐ ▶ WATCH WALKTHROUGH ····················· 1:20 ¬ │
 *   │                                                     │  ← air
 *   │ ┌─────────────────┐ ┌─────────────────┐            │
 *   │ │ PERMISSIONED …  │ │ PROACTIVE …     │            │  ← 2×2 notched
 *   │ │ ───────────────  │ │ ─────────────── │            │    capability
 *   │ └ one-line claim  ┘ └ one-line claim  ┘            │    blocks
 *   └────────────────────────────────────────────────────┘
 *
 * ── The 2026-08-07 evening pass (owner) ─────────────────────────────────
 *
 * ⚠ THE DESIGNATION STUTTER IS GONE. `.fl-tool__hd` printed the full
 * functional name one row under a rail station that had just named the same
 * tool — verbatim for mímir and babylon ("BRIEFING AGENT" over
 * "BRIEFING AGENT"). ADR-068 split one designation by role (handle on the
 * rail, name on the plate) and for two of four tools the split produced two
 * identical strings. The owner's read: "we have the briefing agent title
 * underneath the briefing agent tab." The rail is the designation now; the
 * full name survives where it is doing work — the walkthrough button's
 * `aria-label` and the lightbox label.
 *
 * ⚠ `IN SERVICE {year} —` MOVED TO THE BAY'S TOP LINE, and the placement was
 * measured against the alternative. The other candidate was the route's
 * caption row (BEFORE-left · IN SERVICE-centre · NOW-right), and it fails on
 * a rung that already exists: at ≤760h `casefile.css` CROPS the caption and
 * meta bands out of the SVG (`margin: -2.143%`), so the fact would simply
 * vanish at 720p — and moving it to the bay only at compact heights means
 * two homes for one string. The bay's line survives every rung, already
 * reads as chrome-on-the-housing, and already carries a date-shaped value
 * (the duration) on its right. One home, all viewports.
 *
 * ⚠ THE FOOT IS REMOVED FROM THIS PLATE (owner). ADR-066's law — "a plate
 * with nothing to say still omits it" — is unchanged; what changed is the
 * owner's ruling on whether the tools plate has anything to say THERE. It
 * cost ~90px of field on a plate whose detail 2×2 was being cropped out of
 * existence at wide-and-short viewports, and its sentence restates what the
 * route draws and the four plates answer. `subline` / `shift` stay in
 * `toolCardData.ts`: the Arc card and `ToolCardConsole` still read them.
 *
 * ── What this replaced, and why ─────────────────────────────────────────
 *
 * ⚠ THE 2×2 RENDERS `capabilities` NOW (ADR-068 U2, owner 2026-08-08). The
 * 08-07 pass had deleted the capability tiles from this plate and seated a
 * WHO/WHAT Q&A register in the grid instead; the owner then filled the
 * blocks with the portfolio site's capability copy — title + one-sentence
 * claim — and the Q&A register (`ToolDetailFact`, `ProjectCase.detail`)
 * left with its guards. What did NOT come back is the `.fl-caps` form:
 * sixteen tiles behind a four-station rail, which the smoke still bans on
 * this plate. One canonical array now feeds the Arc card AND this grid.
 *
 * ⚠ THE RAIL CARRIES THE HANDLE, THE PLATE CARRIES THE NAME. The stations
 * print `ProjectCase.tab` (≤14 chars) and the plate header prints the full
 * functional name. That is ADR-066's own escape hatch taken rather than its
 * conclusion reversed: the diamond was hidden at four stations because
 * `AI IMAGE & VIDEO SUITE` needed 136px against 122.9 available, and the
 * owner answered by renaming the handles instead of shrinking the mark. The
 * arithmetic was real; it is now moot. See `console.css`.
 *
 * ⚠ NO ORDINAL, NO ID, NO CODENAME ANYWHERE IN THIS MARKUP. Not on the rail,
 * not in the header, not on the bay's FEED line — the mockup's `T-01` is an
 * ordinal in costume and ADR-066 retired the whole family. The codename
 * survives as the lightbox's label, which is the one place it is doing work.
 *
 * · THE BAY IS CHROME AROUND THE SAME ONE BUTTON. `.fl-shot` is unchanged —
 *   still the whole frame as the walkthrough trigger, still the halftone
 *   veil (ADR-064 U2), still bleeding to its box edges. What the bay adds
 *   is a housing: a FEED line and four corner brackets.
 *   ⚠ THE RUN PLATE AND THE TRANSPORT CHEVRONS ARE DELETED (owner,
 *   2026-08-08 — "we don't need the Run button. I just think we need a
 *   super clear, minimalistic walkthrough button"). The fused bottom bar
 *   IS that button now: play cue, WATCH WALKTHROUGH, duration — nothing
 *   else. Deleting the plate also freed the frame's dead centre for the
 *   wireframes, which used to author around a ~98×40 covered middle.
 * · WHAT THE FRAME HOLDS IS PER TOOL (ADR-068 D5; ALL FOUR drawn since U3).
 *   `TOOL_WIREFRAMES` maps a tool to an AUTHORED drawing of its interface;
 *   a tool absent from it renders its duotoned capture (dormant today).
 *   Only the inner element swaps — the veil, the bay and the button are the
 *   same on both branches, because what changes is the evidence, not the
 *   housing. ⚠ The drawing
 *   takes NO filter and mounts NO `<img>`: ADR-064 U2's line is AUTHORED vs
 *   CAPTURED, and the duotone is the recipe for arbitrary screenshot
 *   colour. The smoke asserts both halves, per tool.
 * · THE BLOCKS ARE THE TOOL'S OWN FOUR CLAIMS (ADR-068 U2). Not a fixed
 *   questionnaire any more — each tool leads with what it actually does,
 *   the way the portfolio site presents it. The registry pins the shape
 *   (exactly four, title ≤24, desc ≤95) rather than the questions.
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

/** "AI Image & Video Suite" from the em-segmented title. The header renders
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

  /* AUTHORED or CAPTURED, per tool (ADR-068 D5). Absent ⇒ the capture. */
  const Wireframe = TOOL_WIREFRAMES[active.id];

  const capture = (
    <span className="fl-shot__frame">
      {Wireframe ? (
        /* Keyed with the tool so a station switch remounts the drawing
           rather than reconciling one tool's geometry onto another's. */
        <Wireframe key={active.id} />
      ) : (
        <Image
          key={active.id}
          className="fl-shot__img"
          src={active.image.src}
          alt={active.image.alt}
          width={active.image.width}
          height={active.image.height}
          sizes="(min-width: 1800px) 900px, 640px"
        />
      )}
    </span>
  );

  return (
    <ConsoleFrame
      className="fl-plate fl-plate--tools"
      rootRef={rootRef}
      rail={
        /* ⚠ THE STATION IS THE HANDLE (`tab`), NOT THE FULL NAME. The full
           name moved one row down, to the plate header, which is what bought
           the rail its diamond back — see the header comment above. */
        <ConsoleRail
          stations={tools.map((t) => ({ id: t.id, name: t.tab }))}
          activeIdx={activeIdx}
          onActive={onActive}
          label="Production tools"
        />
      }
      /* ⚠ NO `foot` — the tools plate omits it now (owner, 2026-08-07). See
         the header comment. ADR-066's foot law is intact: the map row still
         prints its sentence, the films row still prints nothing, and this
         plate joins the films. `subline` / `shift` are untouched data. */
    >
      <div className="fl-toolbody">
        {/* THE BAY — a housing around the capture, not a second frame
            around a frame. Its walls carry the FEED line and the transport
            marks; the capture inside still bleeds to those walls
            (ADR-064). */}
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
              FEED · IN SERVICE <em>{active.year} —</em>
            </span>
            {active.walkthrough ? (
              <span>
                WALKTHROUGH · <em>{active.walkthrough.duration}</em>
              </span>
            ) : (
              <span>NO WALKTHROUGH</span>
            )}
          </div>

          {active.walkthrough ? (
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
              aria-label={`Watch the ${titleText(active)} walkthrough — ${active.walkthrough.duration}${
                Wireframe ? ". Interface, drawn." : ""
              }`}
              onClick={(e) => {
                returnFocusRef.current = e.currentTarget;
                setWatching(true);
              }}
            >
              {capture}
              {/* THE ONE CLEAR AFFORDANCE (owner, 2026-08-08): play cue,
                  action, duration. The five transport chevrons left with the
                  RUN plate — decoration reads as controls on a bar whose
                  whole job is to be unmistakably one button. */}
              <span className="fl-shot__bar" aria-hidden="true">
                <i className="fl-shot__cue" />
                Watch walkthrough
                <b>{active.walkthrough.duration}</b>
              </span>
            </button>
          ) : (
            <div className="fl-shot" data-static>
              {capture}
            </div>
          )}
        </div>

        {/* THE DETAIL — the tool's four capability blocks (ADR-068 U2,
            owner 2026-08-08): title + one-sentence claim, straight from
            `ProjectCase.capabilities`, the same canonical four the Arc card
            tiles print. No accents: four claims, one voice. Notched on the
            BOTTOM-LEFT alone: one notch says ORIENTED / CONNECTED
            (ADR-065), which is what a plate reading off the instrument
            above it is.
            ⚠ THE BLOCKS SEAT ONCE, ON ROW ARRIVAL — never on a station
            switch (owner, 2026-08-08: "four frames that should already be
            there"). TrackPanel is keyed per ROW upstream, so this list
            mounts exactly once per row and the seat plays then; the ul
            carries NO tool key and the plates are keyed BY POSITION, so a
            station switch swaps title/desc text in place with zero motion.
            Capabilities are registry-pinned at exactly four, which is what
            makes index keys safe. The WIREFRAME keeps its `key={active.id}`
            — that remount is deliberate. */}
        <ul className="fl-detail">
          {active.capabilities.map((cap, i) => (
            <li
              className="fl-detail__plate"
              style={{ animationDelay: `${120 + i * 55}ms` }}
              key={i}
            >
              <span className="fl-detail__in">
                <span className="fl-detail__t">{cap.title}</span>
                <i className="fl-detail__rule" aria-hidden="true" />
                <span className="fl-detail__d">{cap.desc}</span>
              </span>
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
