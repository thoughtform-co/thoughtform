# Rule: the type ramps by role (ADR-092)

Four tracking rungs and a weight ceiling, declared once on `:root`, read by every
production sheet, enforced by a ratchet in vitest and by the mechanical gate.
The site sits on them; the HUD frame is the datum they are measured against and is
never swept.

**Paths:** `app/styles/variables.css` (the tokens) · every production `.css` under
`components/**` and `app/**` · `tests/lib/type-material-tokens.test.ts` (the ratchet)
· `scripts/design-eval/mechanical.mjs` (the gate) · `lib/services-ring/ringType.ts`
(baked text) · `.claude/skills/thoughtform-design/eval/rubric.md`

**Read first**

- [ADR-092](../../sentinel/decisions/092-type-material-tokens.md) — the tokens,
  the `.08em` argument, the six stages, what is decided that the lab did not settle.
- [ADR-091](../../sentinel/decisions/091-interface-kit.md) — the measurement this
  answers, and the lab whose bridge is the casefile's diff.
- [`docs/design/interface-kit/ANALYSIS.md`](../../docs/design/interface-kit/ANALYSIS.md)
  — the counts.

## The tokens

| token                                               | value                 | role                                              |
| --------------------------------------------------- | --------------------- | ------------------------------------------------- |
| `--track-copy`                                      | `0`                   | sans prose                                        |
| `--track-display`                                   | `-0.02em`             | sans display, sentence case                       |
| `--track-label`                                     | `0.08em`              | **the base rung**: every mono chrome label        |
| `--track-eyebrow`                                   | `0.15em`              | eyebrows, bracketed designations, kickers, counts |
| `--weight-light` / `--weight-text` / `--weight-lit` | `300` / `400` / `500` | ledes / rest / **the ceiling**                    |

## Contracts

- **A `letter-spacing` in a production sheet is one of the four role tokens or
  `0`.** Never a literal, never a legacy magnitude name (`--track-wide` …) — those
  are aliases that die at stage 4, and the ratchet self-arms against them the
  moment `variables.css` stops declaring them.
- **Nothing above `--weight-lit`.** ⚠ **PT Mono has no 500**: a `500` on mono
  renders 400 by CSS font matching, so a mono 700 is DELETED, not set to 500 —
  emphasis on mono is ink alpha and size. Sans (PP Neue Montreal, 400/500/700
  loaded) takes `--weight-lit` for display and lit states.
- ⚠ **The `font:` shorthand carries a weight.** `font: 700 10px/1 …` is a weight
  declaration a `font-weight:` regex never sees; the ratchet scans both.
- **Case ranks only if the sans does not shout.** `text-transform: uppercase` on a
  PP Neue Montreal element is a finding; PT Mono chrome stays uppercase. ⚠ The
  strings must be AUTHORED sentence case for `text-transform: none` to reveal
  anything — check `lib/**` and `*Data.ts` first (the services masthead's title
  is authored "AI CAPABILITY / YOUR TEAM OWNS.").
- ⚠ **THE FRAME IS THE DATUM AND IS NEVER SWEPT.** `hud.css`, `navigation*.css`,
  `rail-instruments.css`, and the `.hud*` / `.rail-manifest*` / `.rin-*` /
  `.home-v2-mobile-signal` blocks inside `landing.css` and `home-v2.css` are pinned
  EXACT in the ratchet. The content's base rung is `.08em` BECAUSE the frame's is;
  a sweep that tokenises a frame block by accident is caught only by that exact
  pin and by the two HUD PNGs in `landing-page.spec.ts`.
- **The ratchet only goes down.** When a stage lands, lower its sheets' pins to
  what it left (ideally 0). Raising a pin is a design change and gets an ADR line.
  A pin more than ten above its count fails as slack.
- **Text baked into a canvas obeys through `ringType.ts`.** `ServicesCardRing`,
  `caseCardBake` and `LatentFieldTunnel` write `ctx.font` and `letterSpacing` into
  WebGL textures no CSS grep can see; they read the rungs from one module that a
  test asserts equal to `variables.css`. ⚠ The Bold `@font-face` may leave the
  preload only after all three bake at 400, or the textures synthesise a faux-bold
  and `waitForCardFonts()` eats its timeout on every load.
- **The map SVG is its own pass** (ADR-092 §4): presentation attributes and
  arithmetic placement. Three of its tracking rungs (`.02`, `.04`, `.05`) stay the
  map's own, documented in `.claude/rules/interface-kit.md`.
- ⚠ **Design docs move with the tokens.** DESIGN.md's frontmatter, `typography-
system.md` and `tokens.md` state the same four rungs and the same ceiling; the
  design MCP reports drift when DESIGN.md declares a heading weight above the live
  `--weight-lit`.
- ⚠ **Light re-derives, never inherits** (ADR-058). A structure line that goes
  gold → dawn needs its alpha re-derived in `theme.css` (`--fl-hz-rule` .12 → .22,
  `--fl-hz-ink` .52 → .62), and every kept gold OUTLINE takes `--gold-line` in
  light while gold FILLS stay `--gold`.

## Verifying

```bash
npx vitest run tests/lib/type-material-tokens.test.ts
# ⚠ THE GATE DOES NOT SCROLL. On the landing the casefile is `visibility: hidden`
# until the services dwell publishes `data-proof-live`, so a desktop, non-PRM run
# against `.fl-case` measures NOTHING — and until 2026-09-06 it printed PASS on
# every stage while doing so. It reports MECHANICAL VOID and exits 2 now.
# The casefile is STATIC FLOW under --prm and at any width <= 960, which is
# where these readings come from:
node scripts/design-eval/mechanical.mjs --url / --theme dark  --scope ".fl-case" --exclude ".fl-pda" --vp 1280x720 --prm
node scripts/design-eval/mechanical.mjs --url / --theme light --scope ".fl-case" --exclude ".fl-pda" --vp 1280x720 --prm
node scripts/design-eval/mechanical.mjs --url / --theme dark  --scope ".fl-case" --exclude ".fl-pda" --vp 390x844
# For the SCROLLED state (and for anything about the housing s edges) use the
# capture, which drives real scrolls and can be measured as pixels:
node scripts/capture-casefile-rows.mjs --vp 1920x1247 --theme dark --rows 2 --stage
npx playwright test tests/visual/landing-page.spec.ts -g "HUD" --project=desktop   # must pass UNCHANGED before any --update-snapshots
```

The gate prints a tracking readout — rung count and the top rung's share — under
its findings. ADR-091's references ran 50–98 % on one rung; the panel measured
20 %. That number going up is the system working.
