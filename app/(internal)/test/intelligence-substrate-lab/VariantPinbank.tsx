import { FS, MODULE, SubstrateHatch, band, housing, type LetterSpec } from "./substrateKit";
import {
  type RoundSixMeasures,
  type RoundSixPattern,
  markCountOf,
  patternSpecs,
  patterns,
  ranked,
  totalOf,
} from "./roundSix";
import type { IslRecord, IslVariantProps } from "./variants";

/**
 * 28 · PINBANK — one housing, five banks, forty-seven pins.
 *
 * ⚠ THE ONLY DIRECTION IN SEVEN ROUNDS WHERE THE SUBSTRATE IS ONE OBJECT, and
 * that is the reading's actual claim. Every predecessor drew five things —
 * five cards, five wedges, five seams, five vessels — and then had to argue
 * that they were one layer. Here the layer IS the component: a single
 * `SUBSTRATE` housing whose pins leave its edge in five banks. The patterns
 * are not five substrates, they are five shapes OF one.
 *
 * The reference is the CP2077 relay-driver / TLM-decoder panel: a vertical
 * chip, numbered pin banks leaving one edge, a side table reading them off.
 * That panel is the closest thing in the whole reference set to what this
 * record actually is, and it went unused for six rounds while the drawings
 * reached for pies.
 *
 * ⚠ THE PINS ARE THE NUMBER — NO COUNT NUMERAL. Forty-seven pins at one pitch,
 * grouped by bank, is a quantity a reader can tally; printing `14` beside a
 * bank of fourteen pins is this surface's said-twice defect, the one that took
 * the console's head, its foot and its designator. (`facet` reached the same
 * rule from the other side.)
 *
 * ⚠ A BANK'S EXTENT IS `n × PIN_PITCH`, NOT `(n − 1) × PIN_PITCH`. Each pin
 * OWNS a pitch and sits at its centre, which is what keeps the bank's height
 * exactly proportional to its count — the span between first and last pin is
 * not, and `pinbankMass` would report a magnitude the drawing does not have.
 */

export const PINBANK_VIEWBOX = "0 0 932 762";

/* ── The housing ────────────────────────────────────────────────────────── */

const HOUSE_X = 26;
const HOUSE_Y = 60;
const HOUSE_W = 200;
const HOUSE_H = 660;
const EDGE = HOUSE_X + HOUSE_W;

/* ── The pins ───────────────────────────────────────────────────────────── */

const PIN_PITCH = 9.5;
/** The break between banks — one pin's worth again, plus a little, so the five
 *  groups read without a rule between them. */
const BANK_GAP = 22;
const PIN_TOP = 160;
const PIN_LEN = 26;
const FLAG_LEN = 42;

/* ── The ledger ─────────────────────────────────────────────────────────── */

const LED_X = 300;
const LED_R = 906;
const LED_W = LED_R - LED_X;
const ROW_Y0 = 100;
const ROW_PITCH = 124;

const B_NAME = 22;
const B_GLOSS = 46;
const B_EVAL = 70;
const B_FLAG = 90;
const MARK = 8;
const MARK_GAP = 8;
const FIT_EPS = 0.5;

export interface PinBank {
  key: string;
  /** Where this bank's first pitch starts. */
  y0: number;
  n: number;
  centre: number;
}

/** The banks, heaviest first. Pure — the drawing, the mass guard and the
 *  ledger's leaders all read this. */
export function pinBanks(rows: readonly RoundSixPattern[]): PinBank[] {
  let y = PIN_TOP;
  return ranked(rows).map((p) => {
    const y0 = y;
    const h = p.n * PIN_PITCH;
    y += h + BANK_GAP;
    return { key: p.key, y0, n: p.n, centre: y0 + h / 2 };
  });
}

export function VariantPinbank({ record }: IslVariantProps) {
  const rows = ranked(patterns(record));
  const banks = pinBanks(rows);
  const byKey = new Map(banks.map((b) => [b.key, b]));
  const total = totalOf(rows);
  const d = housing(HOUSE_X, HOUSE_Y, HOUSE_W, HOUSE_H, MODULE.cut);

  return (
    <>
      <SubstrateHatch />

      {/* THE COMPONENT — one body, opaque, hatched: the shared layer. */}
      <path d={d} fill="var(--pda-void)" />
      <path d={d} fill="url(#pda-sub-hatch)" fillOpacity={0.5} />
      <path d={d} fill="rgba(var(--dawn-rgb), 0.04)" />
      <path d={d} fill="none" stroke="var(--pda-hair2)" />
      <path
        d={band(HOUSE_X, HOUSE_Y, HOUSE_W, MODULE.head, MODULE.cut)}
        fill="rgba(var(--dawn-rgb), 0.06)"
      />
      <line
        x1={HOUSE_X}
        y1={HOUSE_Y + 1}
        x2={HOUSE_X + HOUSE_W - MODULE.cut}
        y2={HOUSE_Y + 1}
        stroke="var(--pda-hair2)"
        strokeWidth="2"
      />
      <line
        x1={HOUSE_X}
        y1={HOUSE_Y + MODULE.head}
        x2={HOUSE_X + HOUSE_W}
        y2={HOUSE_Y + MODULE.head}
        stroke="var(--pda-hair)"
      />
      <text
        x={HOUSE_X + MODULE.pad}
        y={HOUSE_Y + 23}
        fontSize={FS.key}
        fontWeight={700}
        letterSpacing=".18em"
        fill="var(--pda-txt)"
      >
        SUBSTRATE
      </text>
      <text
        x={HOUSE_X + HOUSE_W / 2}
        y={HOUSE_Y + 96}
        textAnchor="middle"
        fontSize={FS.hero}
        fontWeight={700}
        letterSpacing=".08em"
        fill="var(--pda-txt)"
      >
        {String(total)}
      </text>
      <text
        x={HOUSE_X + HOUSE_W / 2}
        y={HOUSE_Y + 118}
        textAnchor="middle"
        fontSize={FS.chrome}
        letterSpacing=".22em"
        fill="var(--pda-ink)"
      >
        ENCODED
      </text>

      {rows.map((p, i) => {
        const bank = byKey.get(p.key);
        if (!bank) return null;
        const rowY = ROW_Y0 + i * ROW_PITCH;

        return (
          <g key={p.key}>
            {/* THE BANK — one pin per encoded Skill, each owning a pitch. */}
            {p.ordered.map((skill, k) => {
              const py = bank.y0 + (k + 0.5) * PIN_PITCH;
              const first = k === 0;
              return (
                <line
                  key={skill.id}
                  x1={EDGE}
                  y1={py}
                  x2={EDGE + (first ? FLAG_LEN : PIN_LEN)}
                  y2={py}
                  stroke={first ? "var(--pda-grn)" : "var(--pda-amb)"}
                  strokeOpacity={first ? 0.95 : 0.55}
                />
              );
            })}
            {/* The bank's own bracket, so five groups read as five. */}
            <line
              x1={EDGE + FLAG_LEN + 10}
              y1={bank.y0 + 2}
              x2={EDGE + FLAG_LEN + 10}
              y2={bank.y0 + bank.n * PIN_PITCH - 2}
              stroke="var(--pda-hair2)"
            />

            {/* THE CALL-OUT — banks and rows are both ranked, so the leaders
                run parallel and cannot cross. */}
            <line
              x1={EDGE + FLAG_LEN + 10}
              y1={bank.centre}
              x2={LED_X - 10}
              y2={rowY + B_NAME - 6}
              stroke="var(--pda-hair)"
            />

            {/* THE LEDGER ROW — no numeral; the pins are the count. */}
            <text
              x={LED_X}
              y={rowY + B_NAME}
              fontSize={FS.name}
              fontWeight={700}
              letterSpacing=".08em"
              fill="var(--pda-txt)"
            >
              {p.name}
            </text>
            <text
              x={LED_X}
              y={rowY + B_GLOSS}
              fontSize={FS.gloss}
              letterSpacing=".08em"
              fill="var(--pda-txt2)"
            >
              {p.gloss}
            </text>
            <text
              x={LED_X}
              y={rowY + B_EVAL}
              fontSize={FS.chrome}
              letterSpacing=".14em"
              fill="var(--pda-ink)"
            >
              {p.evalMethod}
            </text>
            {p.flagship ? (
              <g>
                <rect
                  x={LED_X}
                  y={rowY + B_FLAG - MARK}
                  width={MARK}
                  height={MARK}
                  fill="var(--pda-grn)"
                />
                <text
                  x={LED_X + MARK + MARK_GAP}
                  y={rowY + B_FLAG}
                  fontSize={FS.chrome}
                  letterSpacing=".08em"
                  fill="var(--pda-txt)"
                >
                  {p.flagship.shortTitle}
                </text>
              </g>
            ) : null}
          </g>
        );
      })}
    </>
  );
}

/* ── LETTERING SPEC, MARK COUNT and MASS ────────────────────────────────── */

const M: RoundSixMeasures = {
  name: LED_W + FIT_EPS,
  count: LED_W,
  gloss: LED_W + FIT_EPS,
  evalMethod: LED_W + FIT_EPS,
  flagship: LED_W - MARK - MARK_GAP + FIT_EPS,
  glossLines: 1,
};

export const pinbankLettering = (record: IslRecord): LetterSpec[] => {
  /* ⚠ NO COUNT — the pins are the number. */
  const specs = patternSpecs(record, M).filter((s) => !s.slot.endsWith(".count"));
  const inner = HOUSE_W - MODULE.pad * 2;
  specs.push(
    { slot: "house.name", text: "SUBSTRATE", fs: FS.key, track: 0.18, measure: inner },
    {
      slot: "house.total",
      text: String(totalOf(patterns(record))),
      fs: FS.hero,
      track: 0.08,
      measure: inner,
    },
    { slot: "house.unit", text: "ENCODED", fs: FS.chrome, track: 0.22, measure: inner }
  );
  return specs;
};

export const pinbankMarkCount = (_record: IslRecord, key: string): number => markCountOf(key);

/** BANK EXTENT is the count — `n × PIN_PITCH`, each pin owning a pitch. */
export const pinbankMass = (record: IslRecord, key: string): number =>
  (pinBanks(patterns(record)).find((b) => b.key === key)?.n ?? 0) * PIN_PITCH;
