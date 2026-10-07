import { Frame, Section } from "@/components/lattice";
import { SPECIMEN } from "@/lib/lattice/specimen-copy";
import type { LatKnobs } from "@/lib/lattice/variants";

import { cutOf, headOf, lineOf } from "./knobProps";

/**
 * The sections board: SIX sections, one per arrangement (ADR-149 §3), each
 * headed by its ordinal tab, a kicker, a title and a sub, carrying real copy
 * from the one specimen record, and closing on a status row. A flowing
 * document under the fixed frame — the shell mounts it in `.lat-doc`.
 */
export function SectionsBoard({ knobs }: { knobs: LatKnobs }) {
  const cut = cutOf(knobs);
  const line = lineOf(knobs);
  const head = headOf(knobs);
  const { headField, split, cells, instrument, ledger } = SPECIMEN;

  return (
    <div className="lat-sections" data-lat-sections="">
      {/* 01 · head-field: the head over a twelve-column field */}
      <Section
        id="lat-sec-head-field"
        head={head}
        ordinal="01"
        kicker={headField.kicker}
        title={headField.title}
        sub="The head over a twelve-column field"
        arrangement="head-field"
        foot={
          <>
            <span>head-field</span>
            <span>{SPECIMEN.frames.foot}</span>
          </>
        }
      >
        <Frame
          id="lat-frame-sec-head-field"
          cut={cut}
          line={line}
          ch="plate-fluid"
          head={<span>{headField.kicker}</span>}
        >
          <p className="lat-copy">{headField.copy}</p>
        </Frame>
      </Section>

      {/* 02 · split 5-7: a paragraph each side */}
      <Section
        id="lat-sec-split"
        head={head}
        ordinal="02"
        kicker={split.kicker}
        title={split.title}
        sub="Two text columns with air between them"
        arrangement="split"
        ratio="5-7"
        foot={
          <>
            <span>split · 5-7</span>
            <span>{split.columns.length} columns</span>
          </>
        }
      >
        {split.columns.map((c) => (
          <div className="lat-col" key={c.name}>
            <h3 className="lat-col__name">{c.name}</h3>
            <p className="lat-col__title">{c.title}</p>
            <p className="lat-copy">{c.copy}</p>
          </div>
        ))}
      </Section>

      {/* 03 · bay: a frame with its head on the left, three stacked right */}
      <Section
        id="lat-sec-bay"
        head={head}
        ordinal="03"
        kicker={split.frame.name}
        title={split.frame.title}
        sub="Eight and four, the right column stacked"
        arrangement="bay"
        foot={
          <>
            <span>bay · 8 + 4</span>
            <span>{split.frame.cta}</span>
          </>
        }
      >
        <Frame
          id="lat-frame-sec-bay"
          cut={cut}
          line={line}
          ch="plate-fluid"
          head={<span>{split.frame.name}</span>}
          foot={<span>{split.frame.cta}</span>}
        >
          <p className="lat-copy">{split.frame.copy}</p>
        </Frame>
        <div className="lat-stack">
          {split.frame.rows.map((r) => (
            <Frame
              key={r.key}
              id={`lat-frame-sec-bay-${r.key.toLowerCase()}`}
              cut="none"
              line={line}
              ch="chrome"
              ground="thin"
              className="lat-stack__cell"
              head={<span>{r.key}</span>}
            >
              <p className="lat-copy lat-copy--sm">{r.value}</p>
            </Frame>
          ))}
        </div>
      </Section>

      {/* 04 · cells 3: six regions sharing edges */}
      <Section
        id="lat-sec-cells"
        head={head}
        ordinal="04"
        kicker="Software for Few"
        title="Four tools in the gap"
        sub="Regions sharing edges, ruled"
        arrangement="cells"
        n={3}
        foot={
          <>
            <span>cells · 3</span>
            <span>{cells.length} cells</span>
          </>
        }
      >
        {cells.map((c) => (
          <div className="lat-cell" key={c.title}>
            <h3 className="lat-cell__title">{c.title}</h3>
            <p className="lat-cell__line">{c.line}</p>
          </div>
        ))}
      </Section>

      {/* 05 · instrument: one frame, rails-tall, an empty ruled field */}
      <Section
        id="lat-sec-instrument"
        band="instrument"
        head={head}
        ordinal="05"
        kicker={instrument.kicker}
        title={instrument.title}
        sub={instrument.sub}
        arrangement="instrument"
        foot={
          <>
            <span>instrument · rails-tall</span>
            <span>{instrument.seats}</span>
          </>
        }
      >
        <Frame
          id="lat-frame-sec-instrument"
          cut={cut}
          line={line}
          ch="plate"
          className="lat-instrument"
          head={<span>{instrument.kicker}</span>}
          foot={<span>{instrument.cta}</span>}
        >
          <div className="lat-field" aria-label="The field, ruled">
            {instrument.stops.map((s, i) => (
              <span className="lat-field__stop" key={s} data-stop={i}>
                {s}
              </span>
            ))}
          </div>
        </Frame>
      </Section>

      {/* 06 · ledger: ruled rows — mono key · sans value · mono tag */}
      <Section
        id="lat-sec-ledger"
        head={head}
        ordinal="06"
        kicker="Services"
        title="What each format runs, and leaves"
        sub="Ruled rows on the columns"
        arrangement="ledger"
        foot={
          <>
            <span>ledger</span>
            <span>{ledger.length} rows</span>
          </>
        }
      >
        {ledger.map((r, i) => (
          <div className="lat-row" key={`${r.tag}-${r.key}-${i}`}>
            <span className="lat-row__key">{r.key}</span>
            <span className="lat-row__value">{r.value}</span>
            <span className="lat-row__tag">{r.tag}</span>
          </div>
        ))}
      </Section>
    </div>
  );
}
