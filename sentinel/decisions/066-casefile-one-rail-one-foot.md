# ADR-066: One rail, one foot, and a row that carries its own rule

- **Status:** Accepted
- **Date:** 2026-08-06
- **Owner call:** yes
- **Surface:** `components/landing/home-v2/services/casefile/**`, `lib/cases/**`
- **Builds on:** [ADR-064](064-casefile-console-frame.md) (the shared console —
  amended here, see its Update 2), [ADR-063](063-map-reading-rail-and-wheel.md)
  (the rail this promotes), [ADR-056](056-services-proof-casefile.md) (the
  casefile; U9's tab and layout rulings are superseded in part),
  [ADR-065](065-corner-law.md) (the corner law, same pass)
- **Rules:** [`.claude/rules/proof.md`](../../.claude/rules/proof.md)

## Context

ADR-064 put the casefile's four evidence plates inside one `ConsoleFrame` and
explicitly did **not** unify their rails, giving one reason: the tools rail's
two-line `01 · MÍMIR` over `BRIEFING AGENT` was an ADR-056 U9 owner ruling.

The owner, 2026-08-06, after living with it:

> the above line has numbers. I don't want that. Software for few also has a
> number, and then the name Mímir, Vesper. I don't want that. I only want
> briefing agent, AI image and video suite, etc., and all the tabs should be
> styled the same.

> in the software flow the text is on the left, but maybe we can also bring it
> to the bottom, like we have in the intelligence map… if we move it to the
> bottom then the preview of the tool can be full view… between the thumbnail
> and the text at the bottom we can have some facts about the specific tool.

> I don't want software for a few to look the same as above the line — yes, for
> both we have a video preview, but for me they are different things.

> the AI fluency in studio: it's not just the ads. It's also about the framework
> for how we use AI, illustrative versus representative.

Four asks with one shape: the panel had four designs because four passes built
it, and fixing the housing made that legible.

## Decision 1 — one rail, and the label is the function alone

`ConsoleRail` is ADR-063's reading rail — diamonds, mono caps, a hairline spine,
one lit segment that travels — generalised to N stations and given to every
plate. The spine's thirds become `--rail-i` / `--rail-n`, set inline.

**Every ordinal on the surface is gone**, together: the tools rail's
`01 · MÍMIR` chrome line, the films rail's `01 / 02`, and the map's own
`01 02 03`. The spine already carries order positionally, which is the only
reason the numeral was affordable to lose — and losing it on three rails while
keeping it on the fourth would have been the inconsistency in a new place.

This keeps the half of ADR-056 U9 that mattered — _"a visitor cannot be
expected to know the codenames"_ — and drops the half that answered it by
printing the codename one line higher. The codename survives as **provenance**
on the tools foot, which is what a case record is for.

It is a `role="tablist"` with roving tabindex, which the map's `<nav>` was not.
_"Not a web tab strip"_ (pda.css) is a statement about the LOOK, and that look
is preserved exactly.

### ⚠ At four stations the diamond goes, and the arithmetic is the reason

Measured at 1280×720, the binding viewport. A quarter of the 594.5px console is
146.6px; padding takes 11.0, the diamond 9.0 of flow and its gap 3.7, leaving
**122px**. `AI IMAGE & VIDEO SUITE` and `STUDIO PM ORCHESTRATOR` are 22
characters, needing **136px** at the 10px control floor.

The shortfall is 14px. The diamond and its gap are 12.7. **The mark costs
almost exactly what the fourth label lacks.**

Every other lever was measured and none is enough: padding to 3px buys 5px, the
gap buys 1.7, dropping tracking buys 4.4, a 6px diamond buys 3. Below 10px is
the DECORATIVE floor, not the control one — and shortening a client's tool name
to fit our rail is not a layout fix.

So at `data-n="4"` the mark is the **spine**, which is the marker ADR-063 names
as the rail's own; the per-station diamond is a second one. The lit wash and
the full-strength label still carry state. This is one rung of one rail and it
is recorded here so nobody restores it by eye.

## Decision 2 — context lives in the foot, on every plate that has any

The tools plate spent half its width on a left identity column. That column is
deleted; its `subline` and `shift` are the console **foot**, where the map's
reading sentence already was.

ADR-056's _"the right panel has no generic foot"_ is not weakened — it is
finished. The foot it banned was chrome saying the same thing on every row. A
sentence that changes with what is displayed is the opposite, and a plate with
nothing to say still omits it and costs no height (the films row does).

The tools plate is now one column: **capture → facts → foot.**

- **The capture is full width**, bleeding to the console's inner edges, taking
  what the facts and foot leave over a floor. ⚠ ADR-056 U9's 16:10 bound is
  gone and its own reasoning is why: it existed because a HALF-WIDTH column
  made the window tall and narrow over a wide screenshot. Full width inverts
  that — wide and short is the shape `cover` + a top anchor wants.
- **The facts are `ProjectCase.capabilities`**, four titled claims on the
  `.fl-caps` 2×2. The content and the CSS both already existed; only the
  renderer had been deleted. A capture shows a tool running and says nothing
  about what it does.
- **Two lines are deleted as duplicates.** `surfaces`
  (`WEB APP · MCP SERVER · CLAUDE · …`) is said by capability 3 in a sentence
  that also explains it; `tagline` restates the foot. ADR-064 U1's argument,
  applied again.

### The typography complaint had a literal cause

The owner: _"the font feels a bit different from the rest… make it the same
type of font and colour as in our Arc, those bottom panels."_

⚠ **`--font-sans` is declared nowhere in this app.** `.fl-con__foot p` asked
for `var(--font-sans, sans-serif)`, so the one paragraph the panel sets in a
body face rendered in the **browser's default sans** on every viewport — and
the `font` shorthand overrode `.fl-case`'s own inherited family. It was
invisible to review because a fallback sans looks like a font choice. (Same bug
in `pda.css`'s mobile stream index; both fixed.)

With the family right, the remaining delta to the Arc caption card was spacing,
leading, alpha and size: matched at `0.008em` / 1.45 / `dawn .88`, at
`clamp(12.5px, 2.1cqw, 15px)` — deliberately below the Arc's, per _"the Arc
there, the fonts can be a bit bigger."_ No text-shadow: the Arc's lifts it off
live WebGL, and a console is opaque.

## Decision 3 — the line is AUTHORED vs CAPTURED

Recorded in full as [ADR-064 Update 2](064-casefile-console-frame.md). In
short: ADR-064 D1's own argument — _"the duotone was a NORMALIZING move…
applied to authored photography it does the opposite"_ — does not put a UI
screenshot on the same side of the line as a commercial.

`.fl-shot__img` carries the services chain plus the halftone dot veil, in both
themes. The stills and films do not, and ADR-056 U5 stands unamended for them.
⚠ The smoke asserts **both** halves; a narrowed ban alone would test less than
the blanket one it replaces.

## Decision 4 — a row can carry several sheets

`02_AI-FLUENCY-STUDIO/` showed the ads and nothing else. Half the engagement
was deciding **what AI may and may not make** — and on a public case, that half
is the part a reader has to trust.

New `CaseSheet` / `CaseSheetBody` in `lib/cases/types.ts`, and a `sheets` kind
whose `never` guard makes a new body a compile error. Three sheets: **the
output, the rule, the limit.**

| sheet          | body      | foot                              |
| -------------- | --------- | --------------------------------- |
| `THE ADS`      | `stills`  | live campaign assets, not mockups |
| `THE LINE`     | `compare` | the imagery principle             |
| `THE RED LINE` | `facts`   | the synthetic-creator position    |

**It adds almost nothing**, which is the design: the rail is `ConsoleRail`, the
foot is the console's, the ads reuse `.fl-stills` and the risks reuse
`.fl-caps`. Only the two-column comparison is new markup.

⚠ **A SHEET IS NOT A SECOND DIRECTORY.** Rows are the engagement's bodies of
work; sheets are facets of one. A sheet that would read as a separate project
wants a row — and a row reshapes the browse band, which is far more expensive.
Pinned: more than one sheet, exactly two compare columns, exactly four facts.

⚠ **The comparison's two columns are typographically identical on purpose.**
The argument is that these are two legitimate categories with one boundary, not
a preferred option beside a fallback. A gold wash on the AI column — the first
cut — turned a policy into a recommendation.

### Confidentiality: what was cut from the deck, and why

Source is the client's _AI in Studio_ deck (April 2026), slides 9 and 10. Cut
before publishing: a partner brand named in four of six examples, three
competitor products named, an external placement vendor, and a risk framed
around revenue share. The examples became categories, the tools became
"synthetic-creator tools", and the financial risk is stated as the deck states
it. **The argument survives every cut; it never depended on the names.**

## Verification

- 574 unit tests; `cases-registry.test.ts` extended with the sheet budgets.
- The 12-case desktop smoke, all passing, with three new assertions folded into
  the four-row walk: **one rail per row** (shared class, one spine, a tablist,
  exactly one lit station, **zero ordinals anywhere**), **the treatment present
  and bounded**, and **the foot where context exists**.
- A measurement walk of **4 rows × 3 viewports × 2 themes** (the sheets row
  walked per sheet, so 36 states), asserting zero overflow on `.fl-brief`,
  `.fl-proof-register`, `.fl-dir`, `.fl-panel__viz`, `.fl-plate`,
  `.fl-con__field`, `.fl-caps`, `.fl-cmp` and `.fl-con__foot`, plus per-station
  label clipping. Zero clips, zero rail truncation, rail type 10–11.5px.

### Three defects this pass shipped and then caught, all invisible to the tests

Every one was found by LOOKING at the render. Every box reported zero overflow
throughout, because a `-webkit-line-clamp` truncating live copy IS its
"fitting" behaviour, and so is a clipped flex item.

- **The tools facts held ONE line at ≤760h** — ~30 characters of an
  85-character sentence with a visible ellipsis, in a plate with ~68px of
  unspent height that the capture's `flex: 1 1 auto` was silently taking.
- **The comparison's descriptions held TWO lines at ≤760h** with ~150px of
  empty column beneath them.
- ⚠ **The walkthrough bar was sliced in half at 1280×720.** `.fl-shot` is
  `overflow: hidden`, and for a flex item that makes the automatic minimum
  size resolve to **ZERO instead of its content** — so when the facts grew a
  line, the shot shrank below its own children and clipped the bar, losing the
  only affordance that says the capture opens. Removing an explicit
  `min-height: 0` does NOT fix it; the overflow value is what decides.

⚠ **A CLAMP IS A BELT AGAINST FUTURE COPY, NEVER A LAYOUT LEVER.** If today's
copy hits the clamp, the clamp is wrong.

The budget is now arithmetic rather than taste. At 1280×720: console 448 −
rail 32 − foot 98 = **318** for the body, which wants 175 for the capture (a
117px floor plus a 38px bar) and 162 for three lines of facts. The ≤760h rung
takes the difference off the capture's FLOOR, because **the order of sacrifice
on this plate is fixed: a screenshot loses a strip of pixels before a sentence
loses its meaning.**

The bar's survival is now smoke-asserted directly — its bottom against the
shot's — since no overflow reading could ever have caught it.

## Left open

Two PRE-EXISTING left-column defects this pass's walk surfaced and confirmed
against a stashed baseline. Both are editorial calls on client copy and are out
of this pass's scope:

- **`.fl-brief` clips the Studio row by 19px at 1920×1080.** The box is 199px
  at 1280×720, 221px at 1440×800 and only **202px** at 1920×1080 — it hangs off
  the `--fl-t6` tick seam, which is not monotonic in viewport height. The
  smoke's reference viewports are 1280/1440/**2017**, so 1920 falls in a gap
  and is the worst case.
- **`.fl-proof-register__label` clips 5–9px on every row** at 1280×720 and
  1440×800, slicing a line of glyphs mid-height. The offending label is 36
  characters against a 40-char pin — the guard permits a length the box cannot
  show, the same trap `BRIEF_MAX` documents.

The durable half of either fix is the same: **add 1920×1080 to the smoke's
reference viewports.**
