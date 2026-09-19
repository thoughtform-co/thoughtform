"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode, type RefObject } from "react";

import {
  MediaLightbox,
  useWalkthrough,
} from "@/components/landing/home-v2/services/casefile/MediaLightbox";
import { CHARACTER_ERAS, eraPressBeatIds } from "@/lib/voidwalker/characterEras";
import { VOIDWALKER_BEATS, vwPlain, type VwPress } from "@/lib/voidwalker/voidwalkerData";

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
 * The figure mark: a standing figure over its projector plane, on the
 * particle-icon grammar — rect-only, a 7×7 grid at integer cells, the 14px
 * compact rung, no text node and no pictogram. The DISC carries the signal
 * because the disc is the gold object on the stage itself.
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
 * The press mark: a record on file, on the SAME grammar `FigureGlyph` uses one
 * panel over — rect-only, a 7×7 grid at integer cells, the 14px rung, no text
 * node and no pictogram. Four left-aligned rules of unequal length: a column of
 * set type, which is what a clipping is.
 *
 * ⚠ ONE MARK, NOT ONE PER OUTLET (ADR-082 U26). The particle grammar bans
 * decorative primitives, and a glyph per publication would be exactly that —
 * the outlet's NAME is already the next thing in the row, so a second encoding
 * of it is noise with a distinguishability problem at 7×7. What the mark earns
 * its gutter with is the INDEX read: five text blocks become five records.
 *
 * ⚠ AND THE SIGNAL SAYS SOMETHING TRUE. `linked` lights the last rule when the
 * piece has a public URL, which two of the six do not — a fact the record
 * already holds (`VwPress.href`) and the surface never said. No new field.
 *
 * ⚠ DAWN ONLY. `ProofGlyph`'s signal layer is gold at alpha 1; on this station
 * gold means "you are here" on the reel one row below, and five gold pixels in
 * a reading column would compete with the one mark that is allowed to lead.
 */
function PressGlyph({ linked }: { linked: boolean }) {
  return (
    <svg className="vwd__press__glyph" viewBox="0 0 7 7" width="14" height="14" aria-hidden="true">
      {/* ⚠ EVERY OTHER ROW. Packed into consecutive rows the rects merge into
          one blob at 14px — `FigureGlyph`'s own recorded lesson. */}
      <rect className="vwd__press__sk" x="1" y="0" width="5" height="1" />
      <rect className="vwd__press__sk" x="1" y="2" width="3" height="1" />
      <rect className="vwd__press__sk" x="1" y="4" width="4" height="1" />
      <rect
        className={linked ? "vwd__press__sig" : "vwd__press__sk"}
        x="1"
        y="6"
        width="2"
        height="1"
      />
    </svg>
  );
}

function PressItem({ press }: { press: VwPress }) {
  const year = press.date ? press.date.slice(0, 4) : null;
  const body = (
    <>
      <span className="vwd__press__meta">
        <PressGlyph linked={Boolean(press.href)} />
        <span className="vwd__press__outlet">{press.outlet}</span>
        {year ? <span className="vwd__press__year">{year}</span> : null}
      </span>
      <span className="vwd__press__headline">{press.headline}</span>
    </>
  );
  if (!press.href) return <div className="vwd__press">{body}</div>;
  return (
    <a className="vwd__press" href={press.href} target="_blank" rel="noreferrer noopener">
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
}

export function HoloDatumPanels({
  selectedEraIndex,
  onSelectEra,
  identityRefs,
  idPrefix = "voidwalker",
  figure,
}: HoloDatumPanelsProps) {
  const era = CHARACTER_ERAS[selectedEraIndex] ?? CHARACTER_ERAS[0];
  const activeEraIndex = CHARACTER_ERAS.indexOf(era);
  const panelId = `${idPrefix}-datum-panel`;
  const chipRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [tab, setTab] = useState<DatumTab>("figure");

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
    if (tab === "transmission" && !next?.film) setTab("record");
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
          const unavailable = t === "transmission" && !era.film;
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
              {unavailable ? <span className="vwd__tab__note">no film</span> : null}
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
          <dl className="vwd__facts">
            {facts.map((f) => (
              <div className="vwd__facts__row" key={f.k}>
                <dt className="vwd__facts__k">{f.k}</dt>
                <dd className="vwd__facts__v">{f.v}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* ── LOWER LEFT · TRANSMISSION ──────────────────────────── */}
        {/* ⚠ THE TAG STATES THE ABSENCE. Without it this head cannot tell "no
            film" from `genai`'s "a film with no authored duration" — both
            printed nothing, so the reader saw an identical head above two
            different records. */}
        <p className="vwd__head" data-cell="ll">
          <span className="vwd__head__kicker">Transmission</span>
          {era.film ? (
            era.film.duration ? (
              <span className="vwd__head__tag">{era.film.duration}</span>
            ) : null
          ) : (
            <span className="vwd__head__tag">None</span>
          )}
        </p>
        <div className="vwd__body" data-cell="ll" data-vwh-region="transmission">
          {era.film ? (
            <button
              type="button"
              className="vwd__film"
              onClick={(e) => open(e.currentTarget)}
              aria-haspopup="dialog"
              aria-label={`Play: ${era.film.title}`}
            >
              <span className="vwd__film__frame">
                <img
                  className="vwd__film__poster"
                  src={era.film.poster}
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
                <span className="vwd__film__play" aria-hidden="true" />
              </span>
              <span className="vwd__film__title">{era.film.title}</span>
            </button>
          ) : (
            /* An absent film is a real reading, not an empty slot — and it is
               SAID rather than drawn. The dashed ghost frame this replaces was
               the empty-slot idiom itself. */
            <p className="vwd__absent">No film on record</p>
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
                <PressItem key={`${p.outlet}-${p.headline.slice(0, 24)}`} press={p} />
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
            `opacity: var(--vwh-morph, 0)` and vanish. */}
        <div className="vwd__figure">
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

        {/* The ground datum stood here until ADR-082 U21. The figure keeps its
            own projector disc, which is what actually seats it; the drawn plane
            under it was a third long horizontal line. */}
      </div>

      {/* ── THE ERA REEL ─────────────────────────────────────────────
          Five hairline-framed chips, the year lettered inside the top-left
          corner and the name beneath the bust. Selection takes gold on the
          frame, the name and a filled diamond — colour AND elaboration
          together here because the chip is the control, not a card in a set.

          The band is a bounded WINDOW and the track turns behind it, so the
          selected era is always at its centre; `--vwd-i` is the only thing the
          composition needs to know to place it, and `--vwd-d` gives each chip
          its distance from that centre for the depth falloff. Both are plain
          integers — the arithmetic lives in the sheet. */}
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
                <span className="vwd__chip__year">{item.year}</span>
                <span className="vwd__chip__name">{item.short}</span>
                <span className="vwd__chip__mark" aria-hidden="true" />
              </button>
            );
          })}
        </div>
      </nav>

      {watching && era.film ? (
        <MediaLightbox
          embed={{
            src: `https://www.youtube-nocookie.com/embed/${era.film.youtubeId}?autoplay=1&rel=0`,
            title: era.film.title,
          }}
          label={era.film.title}
          meta={era.year}
          onClose={close}
        />
      ) : null}
    </section>
  );
}
