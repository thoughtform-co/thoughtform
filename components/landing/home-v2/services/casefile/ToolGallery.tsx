import Image from "next/image";
import { useCallback, useRef, useState } from "react";

import type { ProjectCase } from "@/components/landing/v7/tools-cards/toolCardData";

import { MediaLightbox, restoreFocusAfterUnmount, useCloseOnCasefileFold } from "./MediaLightbox";
import { RouteDiagram } from "./RouteDiagram";
import { ConsoleFrame } from "./console/ConsoleFrame";
import { ConsoleRail } from "./console/ConsoleRail";
import { TOOL_WIREFRAMES } from "./wireframes/toolWireframes";

/**
 * ToolGallery — the four production tools, one in view, at panel scale.
 *
 * STRUCTURE (owner's field template — ADR-068, de-cramped 2026-08-07 pm):
 *
 *   ┌ rail ──────────────────────────────────────────────┐
 *   │ ◆ BRIEFING AGENT  ◇ IMAGE & VIDEO  ◇ UGC DUBBER  … │  the HANDLE
 *   ├────────────────────────────────────────────────────┤
 *   │                                                     │  ← air
 *   │ THE ROUTE BEFORE                     THE ROUTE NOW  │
 *   │ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐  ›››  ┌════════════┐      │  ← RouteDiagram
 *   │ └──┘ └──┘ └──┘ └──┘ └──┘       └ ONE BRIEF ═┘      │
 *   │ FIVE SOURCES · BY HAND      ONE SURFACE · WHILE …   │
 *   │                                                     │  ← air
 *   │ ┌ FEED · IN SERVICE 2025 ── WALKTHROUGH · 1:20 ─┐  │
 *   │ ⌐                  ┌ RUN ┐                      ¬  │  ← the bay wraps
 *   │        the capture, bled to the bay's walls         │    the ONE button
 *   │ ⌐ ››››› ▶ WATCH WALKTHROUGH ················ 1:20 ¬ │
 *   │                                                     │  ← air
 *   │ ┌─────────────────┐ ┌─────────────────┐            │
 *   │ │ WHO IT SERVES   │ │ WHAT IT REPLACED│            │  ← 2×2 notched
 *   │ │ ───────────────  │ │ ─────────────── │            │    Q&A plates
 *   │ └ STRATEGY · BRAND┘ └ MANUAL DIGGING  ┘            │
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
 * ⚠ THE FOUR CAPABILITY TILES ARE GONE FROM THIS PLATE (owner, 2026-08-07).
 * They were four claims per tool behind a four-station rail — SIXTEEN tiles
 * a reader would have to walk to compare anything — and none of them
 * answered the question a case-study reader actually arrives with, which is
 * what the tool is FOR and who has it. `ProjectCase.capabilities` is
 * untouched and still canonical for the Arc orbit card and
 * `ToolCardConsole`; what changed is what the CASEFILE renders.
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
 * · THE ROUTE IS THE ARGUMENT. A Software-for-Few tool's claim is that a
 *   route a reader can COUNT collapses to one module, so the plate draws the
 *   count. See `RouteDiagram.tsx` for the geometry and its three binding
 *   measurements.
 * · THE BAY IS CHROME AROUND THE SAME ONE BUTTON. `.fl-shot` is unchanged —
 *   still the whole frame as the walkthrough trigger, still the halftone
 *   veil (ADR-064 U2), still bleeding to its box edges. What the bay adds
 *   is a housing: a FEED line, four corner brackets and the transport
 *   marks. ⚠ The RUN plate over the capture is DECORATION (`aria-hidden`,
 *   `pointer-events: none`) — a second interactive element inside a button
 *   is not a control, it is a bug.
 * · WHAT THE FRAME HOLDS IS PER TOOL (ADR-068 D5). `TOOL_WIREFRAMES` maps a
 *   tool to an AUTHORED drawing of its interface; a tool absent from it
 *   renders its duotoned capture. Only the inner element swaps — the veil,
 *   the RUN plate, the bay and the button are the same on both branches,
 *   because what changes is the evidence, not the housing. ⚠ The drawing
 *   takes NO filter and mounts NO `<img>`: ADR-064 U2's line is AUTHORED vs
 *   CAPTURED, and the duotone is the recipe for arbitrary screenshot
 *   colour. The smoke asserts both halves, per tool.
 * · THE FACTS ARE A COMPARISON INSTRUMENT NOW. Four fixed questions, the
 *   same four on every tool, so running down the rail reads four answers to
 *   one question instead of four unrelated claims. `ToolDetailFact` pins
 *   that mechanically.
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

/** The transport marks on the watch bar — five chevrons, the first lit.
 *  Decorative: the bar already carries the duration and the whole frame is
 *  the control. */
const CHEVRONS = [0, 1, 2, 3, 4];

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
      {/* ⚠ DECORATION, NOT A CONTROL. The FRAME is the button; this plate is
          the machine's own RUN key drawn over the feed, so it is
          `aria-hidden` and takes no pointer. Its ground lights on the
          BUTTON's hover, which is why the rule lives on `.fl-shot:hover`. */}
      <span className="fl-run" aria-hidden="true">
        <svg viewBox="0 0 98 40" preserveAspectRatio="xMidYMid meet">
          {/* TR + BL, the house diagonal (ADR-065). The mockup drew a
              right-pointing arrow tab; an arrow is a direction, and this is a
              key on a housing. */}
          <path className="fl-run__bg" d="M1,1 H85 L97,13 V39 H13 L1,27 Z" />
          <text x="49" y="24.5" textAnchor="middle" fontSize="10" letterSpacing="3">
            RUN
          </text>
        </svg>
      </span>
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
        {/* THE STACK — route and bay, CENTRED in what the detail leaves
            (the mockup's `.stack`). It is what spends the freed height on
            AIR rather than on bigger content: at 2560×1330 the field has
            ~200px more than the drawing wants, and `space-evenly` on the
            body plus this centring put it between the blocks instead of
            into a taller screenshot. */}
        <div className="fl-toolstack">
          <RouteDiagram route={active.route} toolId={active.id} />

          {/* THE BAY — a housing around the capture, not a second frame
              around a frame. Its walls carry the FEED line and the transport
              marks; the capture inside still bleeds to those walls
              (ADR-064). */}
          <div className="fl-bay">
            <span className="fl-bay__br fl-bay__br--tl" aria-hidden="true" />
            <span className="fl-bay__br fl-bay__br--tr" aria-hidden="true" />
            <span className="fl-bay__br fl-bay__br--bl" aria-hidden="true" />
            <span className="fl-bay__br fl-bay__br--br" aria-hidden="true" />

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
                  Wireframe ? ". Session interface, drawn." : ""
                }`}
                onClick={(e) => {
                  returnFocusRef.current = e.currentTarget;
                  setWatching(true);
                }}
              >
                {capture}
                <span className="fl-shot__bar" aria-hidden="true">
                  <i className="fl-shot__chevs">
                    {CHEVRONS.map((i) => (
                      <svg key={i} viewBox="0 0 17 9" data-on={i === 0 || undefined}>
                        <path d="M0,0 H11 L17,4.5 L11,9 H0 Z" />
                      </svg>
                    ))}
                  </i>
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
        </div>

        {/* THE DETAIL — four fixed questions, this tool's four answers.
            Notched on the BOTTOM-LEFT alone: one notch says ORIENTED /
            CONNECTED (ADR-065), which is what a plate reading off the
            instrument above it is. Keyed with the tool so the seat replays
            on a switch. */}
        <ul className="fl-detail" key={active.id}>
          {active.detail.map((d, i) => (
            <li
              className="fl-detail__plate"
              data-accent={d.accent}
              style={{ animationDelay: `${780 + i * 55}ms` }}
              key={d.q}
            >
              <span className="fl-detail__in">
                <span className="fl-detail__q">{d.q}</span>
                <i className="fl-detail__rule" aria-hidden="true" />
                <span className="fl-detail__a">{d.a}</span>
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
