import type { CSSProperties } from "react";
import { SiteFooter } from "@/components/landing/v7/site-footer/SiteFooter";
import { Frame, Section } from "@/components/lattice";
import { SPECIMEN } from "@/lib/lattice/specimen-copy";
import type { LatKnobs } from "@/lib/lattice/variants";

import { cutOf, headOf, lineOf } from "./knobProps";

/**
 * The page board: a whole synthetic subpage — the board the jury scores. A
 * masthead on the datum, cells, a split with a frame, an instrument, a
 * ledger, and the site footer as the close (ADR-127: every sheet ends as the
 * landing does; `SheetClose`'s mount, copied — the close declares the two
 * station padding tokens the footer's plate negates, in `lattice-lab.css`).
 *
 * Every interactive element is ≥ 44px tall and takes the lab's focus ring
 * (the usability gate); the footer's own links already are.
 */
export function PageBoard({ knobs }: { knobs: LatKnobs }) {
  const cut = cutOf(knobs);
  const line = lineOf(knobs);
  const head = headOf(knobs);
  const { masthead, cells, split, instrument, ledger } = SPECIMEN;

  return (
    <div className="lat-page" data-lat-page="">
      {/* the masthead: title left, lede right, on the head datum */}
      <Section
        id="lat-page-masthead"
        /* ROUND 1 (2026-10-06, the manual read): a flowing sheet seats its
           masthead as FLOW — ADR-099 U2's datum is for a page of viewport-tall
           frames, and on a document it left the first screen's lower two
           thirds void under three lines. The cells rise into the first screen. */
        seat="flow"
        head={head}
        ordinal="01"
        kicker={masthead.kicker}
        arrangement="split"
        ratio="5-7"
      >
        <div className="lat-page__mast">
          <h1 className="lat-page__title">
            {masthead.titleLines[0]}
            <br />
            <span className="lat-page__title-em">{masthead.titleLines[1]}</span>
          </h1>
        </div>
        <div className="lat-page__lede-col">
          <p className="lat-page__lede">{masthead.lede}</p>
          <a className="lat-cta" href="#lat-page-close">
            {split.frame.cta}
          </a>
        </div>
      </Section>

      {/* the cells */}
      <Section
        id="lat-page-cells"
        head={head}
        ordinal="02"
        foot={
          <>
            <span>SOFTWARE FOR FEW</span>
            <span>02 / 05</span>
          </>
        }
        kicker="Software for Few"
        title="Four tools in the gap"
        sub="What the mapping produced, as claims a reader can check"
        arrangement="cells"
        n={3}
      >
        {cells.map((c) => (
          <div className="lat-cell" key={c.title}>
            <h3 className="lat-cell__title">{c.title}</h3>
            <p className="lat-cell__line">{c.line}</p>
          </div>
        ))}
      </Section>

      {/* the split, 7-5, a frame on the right */}
      <Section
        id="lat-page-split"
        head={head}
        ordinal="03"
        foot={
          <>
            <span>THE WAY IN</span>
            <span>03 / 05</span>
          </>
        }
        kicker={split.kicker}
        title={split.title}
        arrangement="split"
        ratio="7-5"
      >
        <div className="lat-page__formats">
          {split.columns.map((c) => (
            <div className="lat-col" key={c.name}>
              <h3 className="lat-col__name">{c.name}</h3>
              <p className="lat-col__title">{c.title}</p>
              <p className="lat-copy">{c.copy}</p>
              <a className="lat-cta lat-cta--quiet" href="#lat-page-close">
                {c.cta}
              </a>
            </div>
          ))}
        </div>
        <Frame
          id="lat-frame-page-embedded"
          cut={cut}
          line={line}
          ch="plate-fluid"
          headWash
          head={<span>{split.frame.name}</span>}
          foot={
            <>
              <span>{split.frame.rows[1].key}</span>
              <span>{split.frame.rows[1].value}</span>
            </>
          }
        >
          <p className="lat-col__title">{split.frame.title}</p>
          <p className="lat-copy">{split.frame.copy}</p>
        </Frame>
      </Section>

      {/* the instrument */}
      <Section
        id="lat-page-instrument"
        band="instrument"
        head={head}
        ordinal="04"
        foot={
          <>
            <span>HOME SESSIONS</span>
            <span>04 / 05</span>
          </>
        }
        kicker={instrument.kicker}
        title={instrument.title}
        sub={instrument.lede}
        arrangement="instrument"
      >
        <Frame
          id="lat-frame-page-instrument"
          cut={cut}
          line={line}
          ch="plate"
          className="lat-instrument"
          head={
            <>
              <span>{instrument.sub}</span>
              <span>{instrument.seats}</span>
            </>
          }
          foot={
            <>
              <span>{instrument.kicker}</span>
              <a className="lat-cta lat-cta--quiet" href={instrument.href}>
                {instrument.cta}
              </a>
            </>
          }
        >
          <div className="lat-field" aria-label="The mornings, plotted">
            {/* ROUND 1: an empty ruled field read as a bug, not a device. The
                four mornings are PLOTTED — one mark per stop on an axis, the
                next one lit (the sheet's own timeline grammar), a cursor for
                now. Gold is spent on the one lit mark; the rest are outlines. */}
            <i className="lat-field__axis" aria-hidden="true" />
            <i className="lat-field__now" aria-hidden="true" />
            {instrument.stops.map((s, i) => (
              <i
                className="lat-field__mark"
                key={`mark-${s}`}
                data-lit={i === 0 || undefined}
                style={{ "--i": i } as CSSProperties}
                aria-hidden="true"
              />
            ))}
            {instrument.stops.map((s, i) => (
              <span className="lat-field__stop" key={s} data-stop={i}>
                {s}
              </span>
            ))}
          </div>
        </Frame>
      </Section>

      {/* the ledger */}
      <Section
        id="lat-page-ledger"
        head={head}
        ordinal="05"
        foot={
          <>
            <span>SERVICES</span>
            <span>05 / 05</span>
          </>
        }
        kicker="Services"
        title="What each format runs, and leaves"
        arrangement="ledger"
      >
        {ledger.map((r, i) => (
          <div className="lat-row" key={`${r.tag}-${r.key}-${i}`}>
            <span className="lat-row__key">{r.key}</span>
            <span className="lat-row__value">{r.value}</span>
            <span className="lat-row__tag">{r.tag}</span>
          </div>
        ))}
      </Section>

      {/* the close: the site's own footer, seated as the last section */}
      <section id="lat-page-close" className="lat-page__close" aria-label="Contact">
        <SiteFooter />
      </section>
    </div>
  );
}
