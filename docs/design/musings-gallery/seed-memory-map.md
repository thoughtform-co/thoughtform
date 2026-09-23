# v5 · Memory map — the seed and what it decided

The owner's procedure (2026-09-03, recorded after `/test/hud-panel-lab`'s `v6`):
generate a long random string, derive the direction's FORM from its
sub-patterns, and judge the rest. The house still decides the material and the
law. Every rule below traces to a finding; the offers the string made and the
judgment declined are listed at the end.

## The string

Generated with `crypto.randomBytes(128)` over `[A-Za-z0-9]`, 2026-09-23:

```
hh3sB2hwtGz1h3SpAGxNobHEGXysoFZh9J1etGavLhmFkyRqLcG2qONAoZtrtNJ24ttzgqNMSttbEpWjT2G2NgRDGrudVuOZUXjuZ6ofTHCxE88YAOdzE41tDLebIw7h
```

## What the analysis found

| finding                                  | value                                                |
| ---------------------------------------- | ---------------------------------------------------- |
| length                                   | **128 = 8 × 16**                                     |
| the only doubled pairs                   | `hh` at 0, `tt` at 65 and 73, `88` at 109            |
| gaps between the doubles                 | 65 · 8 · 36                                          |
| repeated bigrams (gap)                   | `h3` (11) · `tG` (28) · `G2` (**32**) · `tt` (**8**) |
| digits                                   | 17, a prime; per quarter 4 · 4 · 3 · **6**           |
| the digits' sum                          | **65**, equal to the first doubled gap               |
| absent glyphs                            | `K P Q i l n 0 5` (eight of them)                    |
| case                                     | 53 upper · 58 lower (0.914)                          |
| palindromes, hex runs, repeated trigrams | none                                                 |

## What each finding decided

1. **128 = 8 × 16 is the field.** The archive is 128 cells in eight rows of
   sixteen, and every note takes cells in proportion to the WORDS it holds
   (largest remainder, a floor of six so the shortest note is still a run).
   Area is the count — the rule the owner kept on reading 03 of the proof map
   (ADR-070 U23), one surface over.
2. **`G2` recurs exactly 32 characters apart — one quarter of the string.**
   The scale above the field ticks every column and draws a long tick every
   FOUR columns: quarters of the archive.
3. **`tt` recurs 8 apart.** The one small unit: every LED is 8px, and a
   label's plate is inset and padded 8px.
4. **The string opens on `hh` and closes on `88`.** The only doubled line on
   the device is its field's top and bottom edge — two hairlines, 5px apart,
   nowhere else.
5. **`h3` recurs 11 apart; `tG` 28 apart.** The chrome letters at 11px; the
   selected note's title at 28px.
6. **The digits crowd into the last quarter (6 of 17).** The readout — where
   the device states numbers — sits at the END: under the field, with its
   framed rows.
7. **No `0` in the string.** Numerals are never padded (`7 SEP`, never
   `07 SEP`) — which the house already does; the seed agrees with the law.

## Declined

- **The case ratio (0.914)** is not near any house ratio and decided nothing.
- **Seventeen is prime** — a coincidence with no form in it.
- **The digit sum equalling the first doubled gap (65)** is the prettiest find
  and was declined: a rule built on it would be a number the drawing honours
  and no reader can see.
- **The eight absent glyphs** could have been the eight rows' "empty
  remainder"; that is numerology, not structure.
- **Colour.** The string holds no hex run, so it offered none; the palette is
  the house's.

## What the house decided (not the seed)

- **Gold is a mark, never an area** (ADR-089 U2's reading of the reference
  panels). The first cut lit the selected note's cells as a wash, which painted
  a third of the field gold; every cell is now a slot with an LED in it, and
  the selection lights the LEDs.
- **A section inside a note is a hollow LED on alternate sections** and a
  short tick at its first cell; **a note begins on a full-height edge**, and
  alternate notes take a faintly different slot.
- **The label is the link**, lettered on the run's longest row segment on a
  plate of its own; below a 360px field it letters the title alone.
- **Light theme** takes the LEDs on `--gold-line` — raw gold is a fill's
  colour and vanishes as an 8px mark on parchment (ADR-063 U2).
