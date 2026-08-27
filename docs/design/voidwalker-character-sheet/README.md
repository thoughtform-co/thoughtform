# Voidwalker character sheet — the seven-direction study

Look-dev for the ADR-082 U8/U9/U10 recomposition of the `#voidwalker`
hologram sheet. The owner's read on the shipped surface was that "the text
placement is inconsistent", the era tabs "feel out of place", and the panels
themselves wanted work.

**The diagnosis was one CSS mechanism, not five judgement calls.** The two
dossier stacks sat on different grid rows and reserved different seat heights
(`248` vs `280`), both bottom-anchored — so SCOPE/FACTS and ON RECORD/
TRANSMISSION were _arithmetically incapable_ of lining up. No amount of
tuning could have fixed it.

## The seven directions

Each `.dc.html` is one full-scale artboard at 1600×1256 — the owner's own
window shape — built with the real PT Mono / PP Neue Montreal, the real gold
ramp, the real `genai` era record and the real hologram still, so the
compositions are measurable rather than impressionistic.

| file            | switcher                  | panel treatment      |
| --------------- | ------------------------- | -------------------- |
| `Current`       | top strip (as shipped)    | four floating heads  |
| `Main`          | floor ladder              | three shared datums  |
| `Shoulders`     | prev/next corners         | one spine per column |
| `IndexColumn`   | left list                 | one ruled register   |
| `DatedSpine`    | dated 2014–2026 axis      | graduation ladder    |
| `Console`       | fused in the panel head   | one machined housing |
| `CartridgeDeck` | six plates on the floor   | ADR-065 brackets     |
| `RightLadder`   | vertical, in the HUD rail | flat recess wash     |

`Main` was picked and then retuned twice by the owner — first to the
horizontal time axis (U8), then to the left-rail scrubber that shipped (U9),
with scroll-driven era stepping (U10). **`Main.dc.html` is the U8 cut**, kept
as the record of that step; the shipped composition is the live surface and
the `final-*` / `live-*` captures below.

## Regenerating

```bash
node build.mjs        # writes every .dc.html from one source of truth
node shoot.mjs        # renders each as plain HTML and measures/screenshots it
node verify-axis.mjs  # measures the LIVE stage against the HUD rails
```

`build.mjs` inlines the fonts from the `.b64` files here, which are
Latin-subset dumps of `public/fonts/`. The canvas itself was published as a
Claude Design artifact; these files re-seed it.

⚠ The seven exploration screenshots are deliberately not kept — the published
canvas is that record, and they were 6 MB of duplication. `shoot.mjs`
regenerates them.
