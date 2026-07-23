# Reference 03 — Section Headers & the Editorial Band

> How section headings are placed on thoughtform.co — the recipe that took seven positioning
> passes (2026-07-16/17, ADR-044 → ADR-048) to converge. Source of truth:
> `components/landing/home-v2/services/services.css` + `landing.css` band tokens. Extracted 2026-07-18.
>
> The Services masthead is the **canonical recipe**; the Continuum masthead is its grid variant.
> Any new section's header follows these rules.

---

## 1. The title face (identical across every section)

```css
font-family: "PP Neue Montreal", system-ui, sans-serif;
font-weight: 400; /* emphasis line/word: 500 + color gold */
font-size: clamp(26px, 3vw, 44px); /* 26 ≤866w · 38.4 @1280 · 43.2 @1440 · 44 ≥1467w */
letter-spacing: 0.04em;
line-height: 1.1;
text-transform: uppercase;
color: #ebe3d6; /* --dawn */
text-shadow: 0 0 22px rgba(202, 165, 84, 0.18); /* soft gold wash — the only "scrim" */
```

- Titles are 1–2 short lines; the emphasis line/phrase is **gold `#caa554`, weight 500, upright**
  (current services headline: `AI YOUR TEAM` / **`CAN RUN.`** with the second line gold).
- **No eyebrow above the title.** Station-index eyebrows ("Services · 04") were retired everywhere —
  the headline reads first. Don't reintroduce them.

## 2. The editorial band — HORIZONTAL law (ADR-048)

All section text shares **one capped horizontal frame** so left edges stay in lockstep page-wide:

```
--band-max:    1200px
--band-margin: max( --hud-content-inset, (100vw − 1200px) / 2 )
```

Below ~1503px viewport width the band margin equals the HUD content inset (text aligns with the
hero headline edge); above it, the band pins to a **centered 1200px container**. Resolved
viewport-edge → text-edge values:

| Viewport  | band margin (each side) |
| --------- | ----------------------- |
| 1024×768  | 107.5px                 |
| 1280×800  | 129px                   |
| 1440×900  | 145px                   |
| 1680×1050 | 240px                   |
| 1920×1080 | 360px                   |
| 2560×1440 | 680px                   |

Never re-widen or re-derive this per section — one band, all sections.

## 3. The band — VERTICAL law

```
--station-title-top: clamp(48px, 6.8vh, 84px)     /* the corridor big-title line */
--band-air:          clamp(28px, 4.7svh, 52px)    /* editorial breathing room */
--band-top:          station-title-top + band-air /* ≈ 11.5% of viewport height */
```

Resolved title-cap Y: 92px @800h · 103.5px @900h · 124px @1080h (≈11.5svh; caps at ~136px on very
tall viewports). **Why 11.5svh and not the editorial-classic 13–17%:** the full-height centered
instrument (card ring) puts its front card top at ≈22svh — at 13svh+ the title block grazes it
(measured collision at 1280×800). 11.5svh is the tuned maximum.

## 4. The two-column masthead layout (desktop ≥961px)

The masthead is an absolute overlay band inside the section (`inset: 0`, z-index 6,
`pointer-events: none` so it never blocks the instrument below):

- **LEFT column — the title.** `left: band-margin`, `top: band-top`,
  `max-width: min(40vw, 624px)` (= 52% of the 1200px band; the cap prevents column crossover on ultrawide).
- **RIGHT column — the intro paragraph.** `right: band-margin`, **`top: band-top` (same line —
  title cap and intro first line align)**. Bare text, no frame, no plate, no background:
  PP Neue Montreal 400, `clamp(15px, 1.15vw, 18px)`, line-height 1.5, color `#ebe3d6` (full dawn),
  `max-width: min(42ch, 34vw)`, text-align left.

At 1920×1080 this resolves to: title at (360, 124) max 624px wide @44px; intro right edge at
x=1560, same top, max ~653px.

**Readability with no scrim:** legibility comes from spatial separation (headers live in the upper
band; instruments center lower) + the faint gold text-shadow. If your section has a busy backdrop,
calm the backdrop — don't add a plate behind the text.

## 5. Continuum variant (the grid version of the same recipe)

For sections that want title + lede as a flowing head instead of an absolute overlay:

- One grid: `grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr)`, `column-gap: clamp(40px, 5vw, 96px)`,
  `align-items: start`, `margin-inline` = the band inset.
- Title identical to §1 (+ `text-wrap: balance`).
- Lede (right cell): smaller + dimmer than the services intro — `clamp(14px, 1.05vw, 17px)`,
  line-height 1.55, color `rgba(235,227,214,0.7)`, `max-width: 38ch`, letter-spacing −0.005em,
  bottom-aligned in its cell (`align-self: end`). Gold upright `em` segments.
- Vertical: in-flow at the top of the section's flex column, `padding-block: clamp(40px, 7svh, 88px)`.

Choose: **overlay masthead** (services style) when the section is a full-viewport instrument stage;
**grid head** (continuum style) when content flows beneath.

## 6. Mobile & reduced-motion (≤960px or PRM)

Everything goes static and in-flow — no absolute positioning, no scroll envelope:

```css
.masthead {
  position: static;
  opacity: 1;
  transform: none;
  margin-bottom: clamp(28px, 6vh, 48px);
}
.lead,
.intro {
  position: static;
  max-width: none;
}
.intro {
  margin-top: 18px;
  max-width: 38ch;
}
```

Title stacks above intro; the same `clamp()` font sizes carry the scaling. Decode/typewriter
effects don't run (gate: `min-width: 961px` + no reduced-motion) — text just paints.

## 7. Reveal motion

- Envelope (CSS, scroll-driven): masthead opacity = `arrival × (1 − exit)`, plus an **18px rise**
  (`translateY((1 − arrival) × 18px)`). Applied to the masthead band, never the section wrapper.
- Flourish (JS, desktop only): title lines decode via character scramble with a CRT block cursor
  (`█`); intro types on at ~220 chars/s after a 0.12s delay; 0.18s stagger between title lines.
  Triggers at 20% arrival, re-arms below 5%. A reload mid-section paints full text silently.
- Continuum instead scrubs a 0→1 copy clock with an 0.08 stagger between title and lede — same
  18px rise, no scramble. Either flavor is native; the 18px-rise + ease `cubic-bezier(0.16,1,0.3,1)`
  is the shared signature.

## 8. Lessons from the seven passes (don't re-make these mistakes)

1. **Don't anchor headers to HUD chrome.** Pass 1 hung the masthead off the corner-bracket zone;
   it read as UI, not editorial. Titles align to the shared big-title line + band air (§3).
2. **Don't use uncapped vw insets.** The original `8vw` inset drifted 218→451px across 1024→2560
   with no stable proportion — the 1200px-capped centered band replaced it.
3. **Cap the title column** (`min(40vw, 624px)`), or title and intro collide on ultrawide.
4. **The band needs air above editorial headers** — the corridor's ~7.5vh title line felt cramped; +`--band-air` ≈ 11.5svh landed it. But check what's below: stay clear of the instrument (§3).
5. **No eyebrows, no frames.** The "Services · 04" eyebrow and the dashed void-glass plate around
   the intro were both removed — bare title + bare paragraph on a calm backdrop reads best.
6. **Title cap and intro first line share one Y.** Cross-column alignment is the grid signature;
   compensate any per-column padding so baselines/caps meet.
7. **Headline copy: concrete beats abstract** on the surface where a visitor must instantly get
   what you do (`ONE LOOP. THREE DEPTHS.` → `AI YOUR TEAM CAN RUN.`).
