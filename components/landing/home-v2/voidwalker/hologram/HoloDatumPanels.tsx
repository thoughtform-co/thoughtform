"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode, type RefObject } from "react";

import {
  MediaLightbox,
  useWalkthrough,
} from "@/components/landing/home-v2/services/casefile/MediaLightbox";
import {
  CHARACTER_ERAS,
  eraMedia,
  eraMediaDuration,
  eraMediaEmbedSrc,
  eraMediaKindLabel,
  eraPressBeatIds,
  HOLO_FIGURE_SPAN,
  resolveCharacterEraHologram,
  type CharacterEraMedia,
} from "@/lib/voidwalker/characterEras";
import { ERA_MARKS, type EraMark, type EraMarkKey } from "@/lib/voidwalker/eraMarks";
import {
  VOIDWALKER_BEATS,
  vwOutletKind,
  vwPlain,
  type VwPress,
} from "@/lib/voidwalker/voidwalkerData";

import { EraMediaStack } from "./EraMediaStack";

/**
 * HoloDatumPanels — the D2 "datum rails" composition (owner's wave-2 pick,
 * 2026-08-31). Nothing gates it: the comparison flag `VOIDWALKER_DATUM_STAGE`
 * did its job and is DELETED with the losing composition (ADR-082 U19;
 * ADR-070 U35's doctrine).
 *
 * ⚠ NOTHING IS DRAWN TO THE FIGURE, AND SINCE ADR-082 U21 NOTHING IS DRAWN
 * BETWEEN THE PANELS EITHER. Wave 1 tied each panel to the hologram with a
 * leader line landing on a shoulder or a knee, and the owner's read was that
 * the line CLAIMS a relationship the record does not have — "it implies scope
 * is linked to my shoulder, and that's not really the case". U19 replaced them
 * with two full-width construction rails plus a ground datum; the owner then
 * removed all three ("these long horizontal lines … remove those"). ALIGNMENT
 * is what carries the tie now, and it always was — the rails only drew it.
 *
 * ⚠ THE HEADS AND BODIES ARE STILL SEPARATE GRID ITEMS. The rails they were
 * built for are gone, but the split is what puts both columns' heads on ONE
 * row whatever their content does; merged, each panel's rule would land
 * wherever its own box did and the four would no longer agree.
 *
 * ⚠ THE ERAS MOVED FROM THE HUD GUTTER TO A BAND AT THE FOOT. ADR-082 U9 put
 * the scrubber on the left rail precisely so it cost no column; this spends a
 * band on it instead, deliberately, because the owner's ruling is that the
 * selector reads as character-select on BOTH breakpoints. The gutter is left
 * empty rather than refilled.
 *
 * ⚠ THE FIGURE ARRIVES AS A NODE. `VoidwalkerHologram` still owns `HoloFigure`
 * and its materialize epoch — this composition only decides where the figure
 * sits, because on this layout it sits INSIDE the stage grid rather than
 * beside it, and the handoff target on the slot must not move house.
 *
 * ⚠ THE THREE HANDOFF TARGETS ARE LOAD-BEARING. The About→Voidwalker receiver
 * publishes `data-vw-handoff="ready"` only when `portrait` (the slot, in the
 * figure node), `dossier` (the top-left seat, SCOPE here) and `era-title` (the
 * mast heading) all measure. Losing any one silently disarms the `-120svh`
 * station overlap rather than erroring.
 */

/* ⚠ THE FIGURE STOP IS A MARK, THE OTHER THREE ARE WORDS (owner: "do we need
   those tabs above if we have corresponding avatars at the bottom?"). They
   were never redundant — the band picks WHICH ERA, the row picks WHAT YOU
   READ about it — but both were drawn as a full-width row of equal cells with
   a gold active state, so they rhymed and read as one control said twice. A
   mark beside three words is plainly not another row of stops.

   ⚠ SELECTING AN ERA DOES NOT RESET THE VIEW. The tighter version was to drop
   the figure stop and let the band mean "show me this era's figure", but
   switching era while reading RECORD would throw the reading away — and
   comparing one reading across eras is what a five-stop band is FOR. */
const MOBILE_READINGS = ["record", "scope", "transmission"] as const;
type DatumTab = "figure" | (typeof MOBILE_READINGS)[number];

/** `ERA / 03 OF 05`. Lived in `HoloEraPanels` until that composition was
 *  deleted (ADR-082 U19); it is the mast's own chrome, so it moved here with
 *  the mast rather than into a module of its own. */
export function eraPositionLabel(index: number, count = CHARACTER_ERAS.length): string {
  return `ERA / ${String(index + 1).padStart(2, "0")} OF ${String(count).padStart(2, "0")}`;
}

/** The mast line the scramble kernel writes through. `VoidwalkerHologram` owns
 *  the ref because it owns the decode; this composition only seats it.
 *  ⚠ IT WAS THREE UNTIL ADR-082 U23. The eyebrow's two lines are deleted with
 *  the eyebrow, and the year did NOT follow them into SCOPE's head: that head
 *  arrives on a later ladder rung than the decode window, so a scramble seated
 *  there would resolve while the element is still transparent. */
export interface HoloEraIdentityRefs {
  title: RefObject<HTMLSpanElement | null>;
}

/**
 * The figure mark: a standing figure on its ground line, on the particle-icon
 * grammar — rect-only, a 7×7 grid at integer cells, the 14px compact rung, no
 * text node and no pictogram. The GROUND LINE carries the signal: it is the
 * seat the boots land on. (It stood for the stage's gold projector disc until
 * ADR-082 U35 deleted the disc; the seat it marked is still there.)
 */
function FigureGlyph() {
  return (
    <svg className="vwd__tab__glyph" viewBox="0 0 7 7" width="14" height="14" aria-hidden="true">
      {/* ⚠ A WHOLE CELL OF AIR UNDER THE HEAD — packed into consecutive rows
          the rects merge into one blob at 14px. */}
      <rect className="vwd__tab__sk" x="3" y="0" width="1" height="1" />
      <rect className="vwd__tab__sk" x="2" y="2" width="3" height="1" />
      <rect className="vwd__tab__sk" x="3" y="3" width="1" height="1" />
      <rect className="vwd__tab__sk" x="2" y="4" width="1" height="1" />
      <rect className="vwd__tab__sk" x="4" y="4" width="1" height="1" />
      <rect className="vwd__tab__sig" x="1" y="6" width="5" height="1" />
    </svg>
  );
}

/**
 * The reticle: one thin ring around the figure with four marks on the
 * diagonals — the reference's own device at this house's weight (ADR-082 U23).
 *
 * ⚠ IT IS NOT THE ABOUT DRAWING. `#about`'s orbit is six rings, twenty
 * graduations, four spokes, three counter-rotating markers and four bearing
 * numerals, and it is `.voidwalker*`, a namespace this station may not borrow
 * (`voidwalker.css`'s own rule). That instrument SAYS something about the
 * portrait it surrounds; this ring seats a figure and says nothing, so it
 * carries the idea and none of the density.
 *
 * ⚠ AND NOTHING IS LETTERED ON IT. The reference's ring carries no type
 * either — its labels sit in the panels around it, which is where this
 * surface's already are.
 */
function FigureReticle() {
  /* The four marks sit on the DIAGONALS, where the panels' own alignment does
     not already point. On the cardinals they would double the grid the four
     heads draw. */
  const dots = [45, 135, 225, 315].map((deg) => {
    const rad = (deg * Math.PI) / 180;
    return { deg, x: +(96 * Math.sin(rad)).toFixed(3), y: +(-96 * Math.cos(rad)).toFixed(3) };
  });
  return (
    <svg className="vwd__reticle" viewBox="-100 -100 200 200" aria-hidden="true" focusable="false">
      <circle className="vwd__reticle__ring" cx="0" cy="0" r="96" />
      {/* The second ring is the reference's doubled edge, at a third of the
          weight — close enough to read as one drawn wall rather than as two
          rings with a gap between them. */}
      <circle className="vwd__reticle__ring2" cx="0" cy="0" r="92.5" />
      {dots.map((d) => (
        <circle className="vwd__reticle__dot" key={d.deg} cx={d.x} cy={d.y} r="2.2" />
      ))}
    </svg>
  );
}

/**
 * One of the era stage's drawn marks (`lib/voidwalker/eraMarks.ts`, ADR-082
 * U35): the facts grid's four and the press cards' three thumbnails. Rect-only
 * on the 7×7 lattice, `crispEdges`, no text node — the same grammar as
 * `FigureGlyph` and `PressArrow`. The three layers are three classes so the
 * SHEET owns their dawn ladder (and light re-derives it through the token).
 * ⚠ 21px = a 3px cell: the size is the sheet's, and it stays an INTEGER
 * multiple of the lattice or the mark goes soft.
 */
function EraMarkSvg({ mark, className }: { mark: EraMark; className: string }) {
  const cells = (pts: EraMark["sk"], layer: "sk" | "sig" | "dr") =>
    pts.map(([x, y]) => (
      <rect
        key={`${layer}${x}-${y}`}
        className={`vwd__mk__${layer}`}
        x={x}
        y={y}
        width="1"
        height="1"
      />
    ));
  return (
    <svg
      className={className}
      viewBox="0 0 7 7"
      width="21"
      height="21"
      aria-hidden="true"
      focusable="false"
    >
      {cells(mark.dr, "dr")}
      {cells(mark.sk, "sk")}
      {cells(mark.sig, "sig")}
    </svg>
  );
}

/**
 * The link-out mark: a 7×7 pixel arrow, up and to the right — on the SAME
 * grammar `FigureGlyph` uses one panel over (rect-only, integer cells,
 * `crispEdges`, no text node). It is drawn because PT Mono HAS NO U+2197: a
 * typed arrow would fall to a system face in the middle of a mono line.
 *
 * ⚠ IT SAYS ONE TRUE THING AND ONLY WHERE IT IS TRUE: this record opens
 * somewhere. It renders ONLY on an entry with a public URL (`VwPress.href`), so
 * a record that links nowhere carries no mark rather than a dimmed one — the
 * U26 document glyph lit one rule of four to say the same thing, which asked
 * the reader to compare a mark against its neighbours to read it.
 *
 * ⚠ DAWN AT REST, as every mark in this column has been since U26: gold on
 * this station is the era band's "you are here".
 */
function PressArrow() {
  return (
    /* ⚠ 14px = a 2px cell. The size is the sheet's (`--vwd-press-mark`); these
       attributes are the pre-CSS fallback and are kept equal to it, because it
       has to stay an INTEGER multiple of the 7-cell lattice or it goes soft. */
    <svg className="vwd__press__arrow" viewBox="0 0 7 7" width="14" height="14" aria-hidden="true">
      <rect x="2" y="0" width="5" height="1" />
      <rect x="6" y="1" width="1" height="4" />
      <rect x="5" y="1" width="1" height="1" />
      <rect x="4" y="2" width="1" height="1" />
      <rect x="3" y="3" width="1" height="1" />
      <rect x="2" y="4" width="1" height="1" />
      <rect x="1" y="5" width="1" height="1" />
      <rect x="0" y="6" width="1" height="1" />
    </svg>
  );
}

/**
 * The one dialog for whatever the front card holds. Each kind names the ONE
 * transport the CSP allows for it (`CharacterEraMedia`'s own note), and the
 * lightbox already has a branch per transport — so this is a switch, not a
 * second lightbox (rules/proof.md: "One lightbox, `MediaLightbox`").
 */
function MediaDialog({
  item,
  meta,
  tab,
  onClose,
}: {
  item: CharacterEraMedia;
  meta: string;
  /** The card's own tab lettering (`Film 02`), so the dialog is that card. */
  tab: string;
  onClose: () => void;
}) {
  /* ⚠ THE DIALOG IS THE CARD AT DIALOG SCALE (ADR-082 U35, owner: the pop-up
     "needs to be uniform. It also needs to sit in a frame"). `frame` is the
     lightbox's additive seam: the same tab, the same lip, and ONE 16:9 box for
     a film, a video and a still alike. Every other caller passes nothing. */
  const frame = { tab };
  switch (item.kind) {
    case "embed":
      return (
        <MediaLightbox
          embed={{ src: eraMediaEmbedSrc(item), title: item.title }}
          label={item.title}
          meta={meta}
          frame={frame}
          onClose={onClose}
        />
      );
    case "video":
      return (
        <MediaLightbox
          src={item.src}
          label={item.title}
          meta={meta}
          frame={frame}
          onClose={onClose}
        />
      );
    case "image":
      return (
        <MediaLightbox
          image={{ src: item.src, alt: item.alt, width: item.width, height: item.height }}
          label={item.title}
          meta={meta}
          frame={frame}
          onClose={onClose}
        />
      );
  }
}

/**
 * One press record, as a CARD (ADR-082 U35, owner 2026-09-22: "I want them to
 * look like cards … on the left side, a thumbnail, and then we need a title and
 * then the medium" — the Ripperdoc's OWNED/STORE rows). This REVERSES U31's
 * tagged rows by his ruling, and it is not U29's bounded object come back:
 * that one's well held a DOCUMENT mark that said nothing the headline did not,
 * this one's thumbnail says what KIND of coverage it was (a newspaper, a
 * magazine, a broadcast — `vwOutletKind`), and the outlet reads under the
 * headline as the medium.
 *
 * ⚠ AN OUTLINE, NEVER A GROUND — the station's law since U29, and the >700px
 * paint sweep would not notice a card narrower than that painting one.
 * ⚠ THE WHOLE CARD IS STILL THE LINK where the record opens somewhere; one that
 * does not (the Gazet van Antwerpen piece) is the same card without the arrow,
 * a record rather than a dead button.
 */
function PressCard({ press }: { press: VwPress }) {
  const year = press.date ? press.date.slice(0, 4) : null;
  const kind: EraMarkKey = vwOutletKind(press.outlet);
  const body = (
    <>
      <span className="vwd__pcard__thumb" data-vwd-press-kind={kind} aria-hidden="true">
        <EraMarkSvg mark={ERA_MARKS[kind]} className="vwd__pcard__mark" />
      </span>
      <span className="vwd__pcard__text">
        <span className="vwd__pcard__title">{press.headline}</span>
        <span className="vwd__pcard__medium">
          {press.outlet}
          {year ? (
            <>
              <i aria-hidden="true"> · </i>
              {year}
            </>
          ) : null}
        </span>
      </span>
      {press.href ? <PressArrow /> : null}
    </>
  );
  if (!press.href) return <div className="vwd__pcard">{body}</div>;
  return (
    <a className="vwd__pcard" href={press.href} target="_blank" rel="noreferrer noopener">
      {body}
    </a>
  );
}

export interface HoloDatumPanelsProps {
  selectedEraIndex: number;
  onSelectEra: (index: number) => void;
  identityRefs?: HoloEraIdentityRefs;
  idPrefix?: string;
  /** `HoloFigure` plus the projector base, placed inside the stage grid. */
  figure: ReactNode;
  /**
   * ⚠ A LAB FIXTURE SEAM, AND PRODUCTION PASSES NOTHING. The record holds one
   * film on two eras today, so the pile's real subject — three or four cards,
   * a still among them — exists nowhere a reader can look at it. The datum
   * lab's `?media=` hands a pile in here for EVERY era; omitted, each era
   * reads its own `media` and the render is byte-identical. It still goes
   * through `eraMedia()`, so a fixture cannot show a card the guard would
   * refuse on the landing.
   */
  mediaFixture?: readonly CharacterEraMedia[];
}

export function HoloDatumPanels({
  selectedEraIndex,
  onSelectEra,
  identityRefs,
  idPrefix = "voidwalker",
  figure,
  mediaFixture,
}: HoloDatumPanelsProps) {
  const era = CHARACTER_ERAS[selectedEraIndex] ?? CHARACTER_ERAS[0];
  const activeEraIndex = CHARACTER_ERAS.indexOf(era);
  const panelId = `${idPrefix}-datum-panel`;
  const chipRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [tab, setTab] = useState<DatumTab>("figure");

  const mediaFor = (e: (typeof CHARACTER_ERAS)[number] | undefined) =>
    eraMedia(mediaFixture ? { media: mediaFixture } : e);
  const media = mediaFor(era);
  /* ⚠ THE PILE'S FRONT IS KEYED ON THE ERA IT WAS CHOSEN IN. The era is
     scroll-derived as well as clicked (ADR-082 U10), so "reset the pile when
     the era changes" written as an effect would be a second writer racing the
     scroll clock and would paint one frame of the OLD index against the NEW
     era's pile. Derived, a stale choice simply stops matching and reads 0. */
  const [mediaPick, setMediaPick] = useState<{ era: string; i: number }>({ era: era.id, i: 0 });
  const mediaFront = mediaPick.era === era.id && mediaPick.i < media.length ? mediaPick.i : 0;
  const frontItem = media[mediaFront];
  const frontDuration = frontItem ? eraMediaDuration(frontItem) : undefined;

  const beat = VOIDWALKER_BEATS.find((b) => b.id === era.beatId);
  const facts = era.facts ?? [];

  const byId = new Map(VOIDWALKER_BEATS.map((b) => [b.id, b]));
  const press = eraPressBeatIds(era)
    .map((id) => byId.get(id)?.press)
    .filter((p): p is VwPress => Boolean(p));

  const { watching, open, close } = useWalkthrough();

  /* A transmission is a real record, never a placeholder. Reset during the
     deliberate selection event rather than repairing state in an effect: the
     target era is known here and the reader never sees an empty active tab. */
  const selectEra = (index: number) => {
    const next = CHARACTER_ERAS[index];
    if (tab === "transmission" && mediaFor(next).length === 0) setTab("record");
    onSelectEra(index);
  };

  const selectAndFocus = (index: number) => {
    selectEra(index);
    chipRefs.current[index]?.focus();
  };

  /* Roving focus, horizontal only — the band is one row, so ADR-082's ±3
     grid jump has nothing to jump over here. */
  const onChipKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const count = CHARACTER_ERAS.length;
    let next: number | null = null;
    switch (event.key) {
      case "ArrowLeft":
        next = (index - 1 + count) % count;
        break;
      case "ArrowRight":
        next = (index + 1) % count;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = count - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    selectAndFocus(next);
  };

  return (
    <section className="vwd__sheet" data-vwd-era={era.id} data-vwd-tab={tab}>
      {/* ⚠ THE EYEBROW IS DELETED (ADR-082 U23, owner). `ERA / 04 OF 05` and the
          year sat above the title and cost it its breathing room — and both were
          already on screen: the reel prints every era's year on its own stop and
          marks the open one with a lit diamond. The year survives on SCOPE's
          head rule, where a right-aligned value on a short rule is the
          reference's grammar and the reading side says it once.
          ⚠ `eraPositionLabel` STAYS EXPORTED — `/test/hud-panel-lab`'s era
          surface letters it in its own header row. */}
      <header className="vwd__mast" data-vwh-region="identity">
        <h2
          className="vwd__mast__title vwh__decode-line"
          aria-label={era.wardrobe}
          data-vwh-handoff-target="era-title"
          data-vwh-region="era-title"
          data-testid="voidwalker-era-title"
        >
          {/* The decode is DESTRUCTIVE — it writes `textContent` — so the line
              carries a transparent in-flow GHOST that holds the box and an
              absolutely overlaid LIVE span as the ref target. */}
          <span className="vwh__decode-ghost" data-copy={era.wardrobe} aria-hidden="true" />
          <span className="vwh__decode-live" aria-hidden="true" ref={identityRefs?.title}>
            {era.wardrobe}
          </span>
        </h2>
      </header>

      {/* The phone's reading switch. Absent on desktop, where all four panels
          are on screen at once and a tab state would change nothing. */}
      <nav className="vwd__tabs" aria-label="Era view">
        <button
          type="button"
          className="vwd__tab vwd__tab--figure"
          data-on={tab === "figure"}
          aria-pressed={tab === "figure"}
          aria-label="Figure"
          onClick={() => setTab("figure")}
        >
          <FigureGlyph />
        </button>
        {MOBILE_READINGS.map((t) => {
          const unavailable = t === "transmission" && media.length === 0;
          return (
            <button
              key={t}
              type="button"
              className="vwd__tab"
              data-on={t === tab}
              aria-pressed={t === tab}
              disabled={unavailable}
              onClick={() => setTab(t)}
            >
              {t}
              {/* "none", not "no film": the seat holds stills as well as films
                  since ADR-082 U31, so the absence is the SEAT's. */}
              {unavailable ? <span className="vwd__tab__note">none</span> : null}
            </button>
          );
        })}
      </nav>

      <div className="vwd__stage" id={panelId}>
        {/* The two construction rails used to render here (full width, on the
            head rows' bottom edges) — DELETED in ADR-082 U21, the owner's own
            ruling; alignment carries the tie now and the boundaries smoke
            fails any wide painted line that tries to come back. */}

        {/* ── UPPER LEFT · SCOPE ─────────────────────────────────────
            ⚠ Carries the `dossier` handoff target: it holds the top-left
            seat the About dossier flies into, and that target follows the
            SEAT, not the content. */}
        <p className="vwd__head" data-cell="ul">
          <span className="vwd__head__kicker">Scope</span>
          {/* ⚠ THE ERA'S DATE, AND IT IS THE ONLY PLACE THE READING SIDE SAYS IT
              (ADR-082 U23). This head already had the tag slot and the
              `space-between` that seats it; the reference puts a value exactly
              here, right-aligned on the panel's own rule. */}
          <span className="vwd__head__tag vwd__head__tag--year">{era.year}</span>
        </p>
        <div
          className="vwd__body"
          data-cell="ul"
          data-vwh-handoff-target="dossier"
          data-vwh-region="scope"
        >
          <p className="vwd__motto">{era.motto}</p>
          <p className="vwd__prose">{beat ? vwPlain(beat.body) : era.motto}</p>
        </div>

        {/* ── UPPER RIGHT · FACTS ────────────────────────────────── */}
        <p className="vwd__head" data-cell="ur">
          <span className="vwd__head__kicker">Facts</span>
          <span className="vwd__head__tag">{era.short}</span>
        </p>
        <div className="vwd__body" data-cell="ur" data-vwh-region="record">
          {/* ⚠ A GRID OF FOUR CELLS, THE SAME FOUR ON EVERY ERA (ADR-082 U35,
              Starfield's stat grid): the mark and the label on one line, the
              value under it. The mark rides INSIDE the `dt` — a `div` in a
              `dl` may hold only its terms and descriptions. */}
          <dl className="vwd__facts">
            {facts.map((f) => (
              <div className="vwd__facts__cell" key={f.k} data-vwd-fact={f.k.toLowerCase()}>
                <dt className="vwd__facts__k">
                  <EraMarkSvg
                    mark={ERA_MARKS[f.k.toLowerCase() as EraMarkKey]}
                    className="vwd__facts__mark"
                  />
                  {f.k}
                </dt>
                <dd className="vwd__facts__v">{f.v}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* ── LOWER LEFT · TRANSMISSION ──────────────────────────── */}
        {/* ⚠ THE TAG STATES THE ABSENCE. Without it this head cannot tell "no
            transmission" from `genai`'s "a film with no authored duration" —
            both printed nothing, so the reader saw an identical head above two
            different records. With a pile it reads the FRONT card's duration,
            so it follows the rotation; a still has none and prints nothing. */}
        <p className="vwd__head" data-cell="ll">
          <span className="vwd__head__kicker">Transmission</span>
          {frontItem ? (
            frontDuration ? (
              <span className="vwd__head__tag">{frontDuration}</span>
            ) : null
          ) : (
            <span className="vwd__head__tag">None</span>
          )}
        </p>
        <div className="vwd__body" data-cell="ll" data-vwh-region="transmission">
          {media.length > 0 ? (
            /* Keyed on the era: two eras' piles are different objects, and a
               card that outlived its era would transition its silhouette from
               one record's depth to another's. */
            <EraMediaStack
              key={era.id}
              items={media}
              front={mediaFront}
              onFront={(i) => setMediaPick({ era: era.id, i })}
              onOpen={open}
              idPrefix={`${idPrefix}-${era.id}`}
            />
          ) : (
            /* An absent transmission is a real reading, not an empty slot — and
               it is SAID rather than drawn. The dashed ghost frame this replaces
               was the empty-slot idiom itself. */
            <p className="vwd__absent">No transmission on record</p>
          )}
        </div>

        {/* ── LOWER RIGHT · ON RECORD ────────────────────────────── */}
        <p className="vwd__head" data-cell="lr">
          <span className="vwd__head__kicker">On record</span>
          {press.length > 0 ? (
            <span className="vwd__head__tag">
              {String(press.length).padStart(2, "0")} {press.length === 1 ? "item" : "items"}
            </span>
          ) : (
            <span className="vwd__head__tag">None</span>
          )}
        </p>
        <div className="vwd__body" data-cell="lr" data-vwh-region="on-record">
          {press.length > 0 ? (
            <div className="vwd__press-stack">
              {press.map((p) => (
                <PressCard key={`${p.outlet}-${p.headline.slice(0, 24)}`} press={p} />
              ))}
            </div>
          ) : (
            /* This seat used to render a heading over an empty stack — no text
               nodes at all, which is why the era probe reported three panels on
               `loop` where every other era has four. */
            <p className="vwd__absent">No press on record</p>
          )}
        </div>

        {/* ── THE FIGURE ─────────────────────────────────────────────
            The `.vwh` wrapper carries the token block and the slot rules;
            this sheet flattens its grid so `.vwh__column` fills the cell.
            ⚠ NEVER `data-vwh-ready` here — the slot would take
            `opacity: var(--vwh-morph, 0)` and vanish.
            ⚠ `--holo-span` IS THE REGISTRY'S `HOLO_FIGURE_SPAN`, WRITTEN HERE
            ONCE (ADR-082 U31). The desktop lift is solved on THIS element from
            the height every standing era paints, and a second hand-typed
            0.7343 in the sheet is a number that drifts the day a delivery
            re-cuts the floor era. This component is mounted whole by the landing
            and by both labs, so one write covers every home. */}
        <div
          className="vwd__figure"
          style={{ "--holo-span": HOLO_FIGURE_SPAN } as React.CSSProperties}
        >
          {/* ⚠ A SIBLING OF THE FIGURE, NEVER INSIDE IT. `.vwh__slot` is a grid
              with `place-items: end center` and its own isolation, so a child
              there becomes a grid item colliding with the media wrap; and
              `.vwd__vwh` is a single definite cell at two rungs, where an extra
              child takes a second column. The ring belongs to the COMPOSITION,
              which is also why it is drawn here and not in `HoloFigure`. */}
          <FigureReticle />
          <div className="vwh vwd__vwh" data-vwh-era={era.id}>
            {figure}
          </div>
        </div>

        {/* The ground datum stood here until ADR-082 U21 — a third long
            horizontal line. What seats the figure is its own seat box
            (`.vwh__base`), unpainted since ADR-082 U35 deleted the disc. */}
      </div>

      {/* ── THE ERA GALLERY ──────────────────────────────────────────
          ⚠ ALL FIVE IN A ROW FROM 701px UP (ADR-082 U31, owner 2026-09-21: the
          band "should be more like a sort of thumbnail gallery that should be a
          bit more clear"; asked whether it stays a centred reel he chose "all
          five in a row"). That knowingly reverses his own 2026-08-31 rolodex
          ruling (U20) and U23's text stops: five hairline-framed busts, the
          year lettered inside the frame's corner, the name under it, and the lit
          era takes gold on the frame, the name and a diamond seated on the
          frame's bottom edge. The lit frame MOVES; the row does not.

          ⚠ THE FRAME IS `display: contents` BELOW 701px, so the phone keeps
          U27's three-stop text reel byte for byte — the year falls back into
          the chip's own grid and the bust is `display: none`, which with
          `loading="lazy"` means it is never fetched there either.

          `--vwd-i` and `--vwd-d` are still written: the phone's reel reads both,
          and they are plain integers — the arithmetic lives in the sheet. */}
      <nav
        className="vwd__band"
        aria-label="Era"
        role="tablist"
        data-vwh-region="era-selector"
        data-testid="voidwalker-era-selector"
        style={
          { "--vwd-i": activeEraIndex, "--vwd-n": CHARACTER_ERAS.length } as React.CSSProperties
        }
      >
        <div className="vwd__band__track">
          {CHARACTER_ERAS.map((item, i) => {
            const selected = i === activeEraIndex;
            return (
              <button
                key={item.id}
                id={`${idPrefix}-era-tab-${item.id}`}
                ref={(node) => {
                  chipRefs.current[i] = node;
                }}
                type="button"
                role="tab"
                className="vwd__chip"
                aria-controls={panelId}
                aria-selected={selected}
                aria-label={`${item.year} — ${item.wardrobe}`}
                tabIndex={selected ? 0 : -1}
                data-on={selected}
                data-vwh-era-tab={item.id}
                onClick={() => selectEra(i)}
                onKeyDown={(event) => onChipKeyDown(event, i)}
                style={{ "--vwd-d": Math.abs(i - activeEraIndex) } as React.CSSProperties}
              >
                <span className="vwd__chip__frame">
                  {/* The bust belongs to the DELIVERY (`thumbPath`), so two eras
                      on one hologram share it by construction. Decorative: the
                      button already names the era. 192×128 is the file's own
                      size, declared so the frame reserves its box. */}
                  {/* eslint-disable-next-line @next/next/no-img-element -- a 7-10 KB
                      pre-cut WebP with alpha; the optimizer would re-encode it
                      for nothing and add a request hop per era. */}
                  <img
                    className="vwd__chip__thumb"
                    src={resolveCharacterEraHologram(item).thumbPath}
                    alt=""
                    width={192}
                    height={128}
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                  />
                  <span className="vwd__chip__year">{item.year}</span>
                </span>
                <span className="vwd__chip__name">{item.short}</span>
                <span className="vwd__chip__mark" aria-hidden="true" />
              </button>
            );
          })}
        </div>
      </nav>

      {watching && frontItem ? (
        <MediaDialog
          item={frontItem}
          meta={era.year}
          /* The front card's own lettering — `EraMediaStack`'s rule: the
             index only where there is a pile. */
          tab={
            media.length > 1
              ? `${eraMediaKindLabel(frontItem)} ${String(mediaFront + 1).padStart(2, "0")}`
              : eraMediaKindLabel(frontItem)
          }
          onClose={close}
        />
      ) : null}
    </section>
  );
}
