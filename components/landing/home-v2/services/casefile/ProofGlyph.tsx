import { PROOF_GLYPHS } from "./proofGlyphData";

/**
 * ProofGlyph — one `CaseBlock.glyph` key, printed.
 *
 * The proof register became an INDEX on 2026-08-07 (owner, ADR-068): four
 * rows of `mark · claim · sentence` instead of four boxes. The mark is what
 * makes it an index rather than a list, so it is drawn here — pixels on the
 * `proofGlyphData` 7×7 lattice, three units to a pixel, in a 21-unit box.
 *
 * SERVER-SAFE ON PURPOSE. No `"use client"`, no hooks, no state: the casefile
 * ships sixteen of these and each one is a pure function of a string. A
 * renderer that needed the client boundary would put the whole register on
 * the hydration path for a drawing that never changes.
 *
 * THREE LAYERS, THREE ALPHAS, and the drawing's own grammar decides which
 * pixel is which (`proofGlyphData` documents it):
 *   · skeleton  `--dawn` at .85  — the form, the reading voice
 *   · signal    `--gold` at 1    — gold as MARK, which is the lawful role for
 *                                 it (ADR-063 U2: hue is the brand, lightness
 *                                 is the role — `--gold` is the MARK step and
 *                                 must never be re-darkened for text)
 *   · drift     `--dawn` at .28  — the machine trace, a whisper UNDER the
 *                                 skeleton's voice rather than a second form
 *
 * Both tokens flip themselves under ADR-058, so there is no `[data-theme]`
 * branch here and there must not be one: `--dawn` is ink on parchment in
 * light exactly as it is light on void in dark.
 *
 * ⚠ NO TEXT NODES, EVER. The smoke walks `.fl-case *` for elements carrying
 * their own text and asserts a house family on each; an SVG `<text>` here
 * would report whatever the SVG subtree resolves to and fail a font guard
 * that has nothing to do with this drawing.
 *
 * ⚠ SIZE COMES FROM CSS (`.fl-proof-glyph`), never from `width`/`height`
 * attributes — the compact rung prints it at 14px and the tall rung at 21px,
 * and both are integer multiples of the 7-cell lattice (2px and 3px cells).
 * A fractional cell is what turns a pixel drawing into a blur.
 */
export function ProofGlyph({ name }: { name: string }) {
  const glyph = PROOF_GLYPHS[name];
  if (!glyph) return null;

  return (
    <svg viewBox="0 0 21 21" className="fl-proof-glyph" aria-hidden="true" focusable="false">
      {glyph.sk.map(([col, row]) => (
        <rect
          key={`sk-${col}-${row}`}
          x={col * 3}
          y={row * 3}
          width={3}
          height={3}
          fill="var(--dawn)"
          opacity={0.85}
        />
      ))}
      {glyph.dr.map(([col, row]) => (
        <rect
          key={`dr-${col}-${row}`}
          x={col * 3}
          y={row * 3}
          width={3}
          height={3}
          fill="var(--dawn)"
          opacity={0.28}
        />
      ))}
      {glyph.sig.map(([col, row]) => (
        <rect
          key={`sig-${col}-${row}`}
          x={col * 3}
          y={row * 3}
          width={3}
          height={3}
          fill="var(--gold)"
          opacity={1}
        />
      ))}
    </svg>
  );
}
