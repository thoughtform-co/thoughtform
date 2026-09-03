# `06 · Listing` — the seed and its reading

The seventh direction in `/test/hud-panel-lab` was not drawn from a reference.
It was derived from a random string, on the owner's instruction (2026-09-03):
generate a long random alphanumeric string, define the creative direction from
it — colour, layout, type, and whatever sub-patterns it carries — then build it.
This file is the derivation, so the direction is reproducible rather than
asserted. `variants.ts` carries the one-sentence version in `v6.provenance`.

## The seed

```bash
LC_ALL=C tr -dc 'A-Za-z0-9' < /dev/urandom | head -c 128
```

```
s8CXLTPe3BCUolOITNIw7jFFAQqtrcDgfUINoBbnOw9QHmIBL2EqjcK6ppn4zYV53zXHkLA9t6WIJBBHyjBwdA9R9UK6YQzgmovMImSLI1utXxOaiU8eKqJKwsqbqDur
```

Read aloud it is a disassembly listing: `mov`, `trc`, `R9`, `K6` (twice),
`SLI`, `FF`, `FAQ`. That is where the name comes from — a listing is a
printout with offsets in the margin, bytes in fixed columns and a ruled datum,
which is also the house's own doctrine (draw the RECORD, not a metaphor).

## What was measured

All indices are 0-based on the 128-character string.

| measure                | value                                                                                                                                                |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| length                 | **128** = 2⁷ = 8 × 16                                                                                                                                |
| upper · lower · digits | **61 · 51 · 16** (61 / 51 = 1.196)                                                                                                                   |
| distinct characters    | 58 of 62; absent **G Z h 0**                                                                                                                         |
| most frequent          | `I` × 7 · `B` × 6 · `q` × 5                                                                                                                          |
| digits, in order       | `8 3 7 9 2 6 4 5 3 9 6 9 9 6 1 8` — sum 95, all nine non-zero digits present, no zero                                                                |
| digit positions        | 1 · 8 · 20 · 42 · 49 · 55 · 59 · 63 · 64 · 71 · 73 · 86 · 88 · 91 · 105 · 114                                                                        |
| doubled letters        | **`FF` @ 22 · `pp` @ 56 · `BB` @ 77** — gaps 34 and 21, consecutive Fibonacci numbers, 34 / 21 = 1.619 ≈ φ                                           |
| palindromes            | `9R9` @ 86 · `qbq` @ 122 (case-insensitive also `olO` @ 12 · `MIm` @ 99)                                                                             |
| repeated bigrams       | `K6` × 2 (52, 108) · `A9` × 2 (71, 85)                                                                                                               |
| hex-valid triplets     | `e3B` @ 7 · `3BC` @ 8 · **`FFA` @ 22** · **`dA9` @ 84** — no 6-character hex run anywhere                                                            |
| in the digit run       | positions 10–13 read **`6 9 9 6`**: a strobogrammatic palindrome (the same rotated 180°); the run opens and closes on `8`, itself rotation-symmetric |

Reproduce:

```bash
node -e 'const s=process.argv[1];const f={};for(const c of s)f[c]=(f[c]||0)+1;console.log(s.length,[...s].filter(c=>/[A-Z]/.test(c)).length,[...s].filter(c=>/[a-z]/.test(c)).length,s.replace(/\D/g,""));for(let i=1;i<s.length;i++)if(s[i]===s[i-1])console.log("double",s[i-1]+s[i],"@",i-1);for(let i=0;i+3<=s.length;i++){const t=s.slice(i,i+3);if(/^[0-9a-fA-F]{3}$/.test(t))console.log("hex3",t,"@",i)}' s8CXLTPe3BCUolOITNIw7jFFAQqtrcDgfUINoBbnOw9QHmIBL2EqjcK6ppn4zYV53zXHkLA9t6WIJBBHyjBwdA9R9UK6YQzgmovMImSLI1utXxOaiU8eKqJKwsqbqDur
```

## Finding → rule → where it lands

| finding                                              | rule                                                                                                                                                                                                                               | where it lands                                                                                                                                                                                                           |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 128 = 8 × 16, a hex dump's shape                     | **The form is a listing.** Fixed-column key \| value rows on a 16-column grid: key 6/16, value 10/16 — production's own casefile split is 37.5 % = 6/16. Every spacing the direction adds is a power of two (2 · 4 · 8 · 16 · 32). | Eras: `.vwd__facts__row { grid-template-columns: 6fr 10fr }` with a column rule at 37.5 %. Proof: the split is production's. Spacing: the ring's 2px gap, the 4px rules, 8px cell air, the 16px pad, the 32px clearance. |
| `FF` · `pp` · `BB` at 22 · 56 · 77, gaps 34 / 21 ≈ φ | **The double rule** (the DOS box-drawing ═ / ║) is the one emphatic line: two 1px lines of the rail's own dawn .55 with a 2px gap, 4px in all. Exactly three per surface. Single seams 1px .28; interior rows 1px .12.             | Proof: the ring (`.hpl-housing[data-kind="listing"]`) and the column seam (`.fl-split[data-double]`). Eras: under the title's ink, and under the SCOPE and FACTS heads. Lower heads single.                              |
| `6996` in the digit run; `8 … 8` bookends            | **Marks come as a 180°-rotated pair on TR + BL** — the corner law's lawful diagonal. Never four corners, never mirrored. The head datum and the terminus are the same line.                                                        | Proof: production's BL reticle + the TR reticle. Eras: `Reticles` on the figure bay (`.hpl-ret[data-c="tr"]`, `[data-c="bl"]`). The ring's top and bottom are one object.                                                |
| absent `G Z h 0`                                     | **Four refusals**: no **G**round (line-only, `?mat=glass` inert), no **Z**-stack (nothing paints over content), no **h**idden clipping added, no **0** (nothing drawn empty; the cursor is never absent).                          | `defaultMaterial("v6") === "line"`; the ring clears the rail's readouts instead of running under them; no overlay, no veil; the cursor stays lit under reduced motion.                                                   |
| 61 upper · 51 lower · 16 digits, 1.196 ≈ 1.2         | The house scale (`--fl-ratio` 1.2) and faces stay. Chrome outnumbers prose 6 : 5 but is budgeted: **≤ 16 lettered chrome elements per surface**, all real readings.                                                                | Proof letters state · Brief · Proof · N claims · logCode (5). Eras adds **zero** new lettered elements.                                                                                                                  |
| `FFA` on the first double; `dA9` at 84               | **Phosphor `#FFA`** rgb(255 255 170) is the lit rung, dark only (light takes `--gold-ink-lit`). **Oxide `#dA9`** rgb(221 170 153) is offered behind `?ink=oxide` for provenance meta. `3BC` teal and `e3B` magenta declined.       | `--hpl-phosphor` on the spine, the lit station diamond, the tab cursor, the active chip mark. `--hpl-oxide` on the foot's logCode and the era press meta / head tags.                                                    |
| `I` × 7, and no zero                                 | **The cursor**: a phosphor block, the one moving thing, 700 ms lit / 700 ms dark (from `6996` → 0.6996 s), `steps(1)`, steady under reduced motion, last on the arrival ladder (`--ci-off: 0.44` = 56 / 128).                      | `.fl-tabs__name::after` on the active tab; `.vwd__chip[data-on] .vwd__chip__mark`.                                                                                                                                       |
| square corners                                       | Box-drawing has no chamfer, and ADR-065's depth ladder puts chrome at 0. **The panel is SOFTWARE drawn on the frame's screen**, not the machined device the screen is set into — the opposite reading from ADR-089.                | The ring is two plain `border` boxes; no `clip-path` anywhere in the direction.                                                                                                                                          |

## What the seed does NOT decide

- The line weights are the frame's own ladder (`--hud-rail-line` .55,
  `--hud-rail-line-soft` .28, .12) — the seed chose the FORM of the emphatic
  line, not its material.
- The type is production's, untouched: faces, the modular scale, every floor.
- 16 is a budget on lettered chrome, not a layout instruction; the 16-column
  grid is only asserted where a row has two columns to divide.
- Nothing about content. Every string the direction letters was already on the
  record; the direction moves and rules them.

## The rulings it asks for

Appended to the README's list as 13–18: software or hardware (square
box-drawing vs the promoted chamfer); may the lit rung leave the gold family in
dark; the era title on SCOPE's edge (ruling 9's seat); the blink against
ADR-021's no-wall-clock-motion; oxide as a third hue; and the ring's 32px
telemetry clearance against the promoted housing's band-exact edge.
