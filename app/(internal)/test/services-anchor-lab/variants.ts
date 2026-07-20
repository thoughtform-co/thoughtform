/**
 * The five anchor routes — one OFF control + four sub-variants of the
 * SHARED HORIZON BAR direction (owner pick, 2026-07-20).
 *
 * All four seat the masthead with a rule that spans RAIL TO RAIL, so the
 * top-left H1 and top-right paragraph stop reading as two disconnected
 * floats and start sharing one doubly-anchored horizon. They differ in
 * WHERE the rule sits and HOW the text meets it — baseline / above /
 * interrupted / stood-upon.
 *
 * Provenance is the instrument reference each route is drawn from; the
 * thesis is what to look for when judging it.
 */
export interface AnchorVariant {
  id: string;
  label: string;
  thesis: string;
  provenance: string;
}

export const ANCHOR_VARIANTS: readonly AnchorVariant[] = [
  {
    id: "v0",
    label: "OFF",
    thesis:
      "Production verbatim — the masthead as it ships today, floating in the band with no on-line geometry. The A/B control: flip back here after every route.",
    provenance: "ADR-044 masthead · ADR-048 editorial band",
  },
  {
    id: "v1",
    label: "BASELINE BAR",
    thesis:
      "One hairline at the H1's second baseline: the gold line SITS on it, the paragraph HANGS from it, and mono readouts cap both ends against the rails. The rule is the horizon both blocks share.",
    provenance: "tmux/Bloomberg status line · PFD boxed readout",
  },
  {
    id: "v2",
    label: "ANNUNCIATOR",
    thesis:
      "The rule moves ABOVE the band as a labelled jurisdiction strip — tick-flanked micro-labels claim the section, and both text blocks hang beneath it untouched. Least invasive to the typography.",
    provenance: "Caution/warning annunciator panel",
  },
  {
    id: "v3",
    label: "INTERRUPTED",
    thesis:
      "The rule breaks where the text crosses it: three segments with gold shoulder-ticks, the H1 and paragraph set INTO the gaps. The frame reads as notched around the copy, cartouche-style.",
    provenance: "Chart cartouche · neatline break",
  },
  {
    id: "v4",
    label: "BAR + FEET",
    thesis:
      "A faint rule below the baselines with short gold stems dropping onto it — the copy STANDS on the frame under gravity instead of hovering above it.",
    provenance: "Bar-chart datum · PFD tick stems",
  },
] as const;
