import type { CSSProperties } from "react";

import { ribbonPaths } from "@/components/landing/home-v2/services/casefile/map/pda/ribbon";
import { band, housing } from "@/components/landing/home-v2/services/casefile/map/pda/substrateKit";
import type { SheetConfiguration as Config } from "@/lib/sheet/types";

import {
  CHIP,
  CONFIG_CROPS,
  DIE,
  WIRE_PITCH,
  configGeom,
  type ConfigBus,
  type ConfigGeom,
  type ConfigLetter,
} from "./configLayout";

/**
 * SheetConfiguration — a client's intelligence configuration, drawn in the
 * `/arcs` dossier (ADR-118 U2). SERVER-ONLY: no hooks, no listener, no state.
 *
 * The owner's first reference board, in the house's own grammar: ONE BRIGHT
 * DIE at the centre — the types of work the setup is for, the proposal's own
 * workstreams, a module tag at each row's end — dark chamfered chips around it
 * for what it runs on and inside, multi-wire buses with 45° jogs between them,
 * and a faint board behind. ⚠ THE CONFIGURATION IS TENSOR GOLD (U3, owner:
 * "the color of the intelligence configuration thingy should be like Tensor
 * Gold. Same with the accents") — the die filled with `--gold` and its words
 * knocked out on `--gold-contrast`, its legs gold, its wires amber, the chips'
 * kind codes in `--gold-ink`: what the homepage board paints gold. U2 drew the
 * die in ink while gold on this page was state alone. The chips' frames and
 * the faint traces stay dawn: they are the board, not the configuration.
 *
 * ⚠ THE GRAMMAR IS COPIED, THE PURE HELPERS ARE IMPORTED (ADR-100's
 * precedent). `ribbonPaths` and `housing` come from the proof board's pure
 * modules; its glyph components do not — `PdaConfiguration.tsx` and
 * `pdaGlyphs.tsx` are CLIENT files, and importing one here would put a
 * registry type in a public chunk. Every colour is a `--sh-*` token on a
 * class (`instrument.css` §5b); `--pda-*` and `--arc-*` do not resolve here.
 *
 * ⚠ FOUR CROPS, ONE SHOWN — a container query on `.sh-cfg` picks the crop
 * whose aspect the box has (`configLayout`'s `CROP_SWITCH`). All four are in
 * the markup so no script decides. The dot bed is the BOX's background
 * (instrument.css §5b), never an SVG pattern: a crop letterboxed by `meet`
 * would show the pattern's edge, and nine dossiers would need nine ids.
 *
 * ⚠ THE SVGS ARE `aria-hidden` AND THE RECORD IS SAID ONCE, IN WORDS — the
 * figure is one `img` whose label names the workstreams and the links. Four
 * copies of one drawing's text in the accessibility tree would be four
 * readings of one fact, and hidden text is a box every band walk reports as
 * clipped.
 *
 * ⚠ NO `transform` ANYWHERE: the fit smoke compares `getBBox` boxes, which are
 * blind to an element's own transform.
 */
export function SheetConfiguration({
  config,
  client,
}: {
  config: Config;
  /** Whose configuration, for the words a screen reader hears. */
  client: string;
}) {
  const workstreams = config.rows.filter((r) => !r.ghost);
  const ghost = config.rows.find((r) => r.ghost);
  const runs = config.links.map((l) => l.name).join(", ");
  const said =
    `${client}'s intelligence configuration: ${workstreams.map((r) => r.name).join(", ")}` +
    `${ghost ? `, and ${ghost.name} next` : ""}. It runs on and inside ${runs}.`;
  return (
    <figure
      className="sh-cfg"
      role="img"
      aria-label={said}
      data-cfg-rows={config.rows.length}
      data-cfg-links={config.links.length}
    >
      {CONFIG_CROPS.map((crop) => (
        <Board key={crop.id} geom={configGeom(config, crop)} />
      ))}
    </figure>
  );
}

function Board({ geom }: { geom: ConfigGeom }) {
  const { crop, die, rows, chips, buses, pins, ghosts, letters } = geom;
  return (
    <svg
      className="sh-cfg__crop"
      data-crop={crop.id}
      viewBox={`0 0 ${crop.w} ${crop.h}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
    >
      <g className="sh-cfg__ghosts" fill="none" strokeWidth="1">
        {ghosts.map((b) => (
          <Bus key={b.id} bus={b} />
        ))}
      </g>
      <g className="sh-cfg__buses" fill="none" strokeWidth="1">
        {buses.map((b) => (
          <Bus key={b.id} bus={b} />
        ))}
      </g>

      {chips.map((c) => {
        const { x, y, w, h } = c.rect;
        const d = housing(x, y, w, h, CHIP.cut);
        return (
          <g key={c.id} className="sh-cfg__chip" data-cfg-chip={c.id}>
            <path className="sh-cfg__chip-plate" d={d} />
            <path className="sh-cfg__chip-band" d={band(x, y, w, CHIP.head, CHIP.cut)} />
            <line
              className="sh-cfg__chip-seam"
              x1={x}
              y1={y + CHIP.head}
              x2={x + w}
              y2={y + CHIP.head}
            />
            <path className="sh-cfg__chip-edge" d={d} fill="none" />
            {/* ⚠ The rule STOPS at the cut — it runs to the corner the
                diagonal starts from, or it overshoots into the notch. */}
            <line
              className="sh-cfg__chip-rule"
              x1={x}
              y1={y + 1}
              x2={x + w - CHIP.cut}
              y2={y + 1}
              strokeWidth="2"
            />
          </g>
        );
      })}

      {pins.map((p, i) => (
        <rect key={i} className="sh-cfg__pin" x={p.x} y={p.y} width={p.w} height={p.h} />
      ))}

      <g className="sh-cfg__die" data-cfg-die="">
        <path className="sh-cfg__die-plate" d={housing(die.x, die.y, die.w, die.h, DIE.cut)} />
        <line
          className="sh-cfg__die-seam"
          x1={die.x + DIE.pad}
          y1={geom.headFloor}
          x2={die.x + die.w - DIE.pad}
          y2={geom.headFloor}
        />
        {rows.slice(1).map((r) => (
          <line
            key={r.id}
            className={r.ghost ? "sh-cfg__die-seam sh-cfg__die-seam--ghost" : "sh-cfg__die-rule"}
            x1={die.x + DIE.pad}
            y1={r.rect.y}
            x2={die.x + die.w - DIE.pad}
            y2={r.rect.y}
          />
        ))}
      </g>

      {letters.map((l) => (
        <Letter key={l.slot} l={l} />
      ))}
    </svg>
  );
}

/** A multi-conductor bus: parallel wires at one pitch through every bend. */
function Bus({ bus }: { bus: ConfigBus }) {
  return (
    <g data-cfg-bus={bus.id} style={{ "--l": bus.len } as CSSProperties}>
      {ribbonPaths(bus.pts, bus.wires, WIRE_PITCH).map((d, i) => (
        <path key={i} d={d} />
      ))}
    </g>
  );
}

/** One lettered string. Size and tracking are ATTRIBUTES (the ADR-100
 *  idiom); face, ink and weight are classes the sheet resolves to tokens. */
function Letter({ l }: { l: ConfigLetter }) {
  const cls = [
    "sh-cfg__t",
    `sh-cfg__t--${l.face}`,
    `sh-cfg__t--${l.ink}`,
    l.lit ? "sh-cfg__t--lit" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <text
      className={cls}
      data-cfg-slot={l.slot}
      x={l.x}
      y={l.y}
      fontSize={l.fs}
      letterSpacing={l.face === "mono" ? `${l.track}em` : undefined}
      textAnchor={l.anchor === "end" ? "end" : undefined}
    >
      {l.text}
    </text>
  );
}
