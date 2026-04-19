# Figma Codex Map

Single authoritative node reference for the Thoughtform Brand Codex design file.

**File key:** `XO8yGN90SfxiG1hmYPGYXn`

**Freedom tier: LOW** — node IDs are ground truth. When the Figma file is refactored, update this doc first, then the dependent references.

---

## Current canonical frame: `1802:5717` (Understanding AI / TEXT+IMG 1a)

The current canonical specimen is `1802:5717` (Text+Img 1 / LogoOn variant, "Understanding AI as a System of Meaning"). All tick grid values, rail geometry, and chrome anchor positions in `hud-frame-implementation.md` are derived from this frame.

### Post-refactor structure (late 2026)

The file was refactored since the original Grid (New) canvas. Key changes:

- **Removed** `1802:5917` (Group 268, top-right chapter cross-mark ornament)
- **Removed** `1802:5910` (Group 269, bottom-right pagination cross-mark ornament)
- **New** `1853:488` "Sidebar Icon" — right rail + chapter + pagination as a single refactored group containing:
  - `1853:489` Right rail "Lines Container" (compound guide + top/bottom edge ticks)
  - `1853:502` "Chapter Container": `1853:504` CHAPTER 01 text + `1853:505` 30px horizontal rule
  - `1853:506` "Sidebar Container": `1853:508` 30px horizontal rule + `1853:510`/`1853:511` "01" pagination vectors
- **Right rail now has 11 mid ticks** (one more than left — includes a minor at y=181.59 via `1853:496`, co-located with the left rail's compass line)

### Left rail node map (`1802:5921` "Left Border Container")

| Node ID     | Name                          | Local y | Role                                                                            |
| ----------- | ----------------------------- | ------- | ------------------------------------------------------------------------------- |
| `1802:5921` | Left Border Container (GROUP) | 111.04  | Rail wrapper                                                                    |
| `1802:5932` | **Vector 4 (Stroke)**         | 111.04  | **COMPOUND PATH** — guide line + top edge tick (y=0) + bottom edge tick (y=849) |
| `1802:5922` | Line 38 (Stroke)              | 676.91  | MAJOR tick (21px, bearing "5")                                                  |
| `1802:5923` | Line 39 (Stroke)              | 393.87  | MAJOR tick (21px, bearing "2")                                                  |
| `1802:5924` | Line 40 (Stroke)              | 606.16  | minor                                                                           |
| `1802:5925` | Line 41 (Stroke)              | 323.16  | minor                                                                           |
| `1802:5926` | Line 43 (Stroke)              | 889.18  | minor                                                                           |
| `1802:5927` | Line 44 (Stroke)              | 252.41  | minor                                                                           |
| `1802:5928` | Line 45 (Stroke)              | 818.43  | minor                                                                           |
| `1802:5929` | Line 47 (Stroke)              | 535.32  | minor                                                                           |
| `1802:5930` | Line 48 (Stroke)              | 464.57  | minor                                                                           |
| `1802:5931` | Line 49 (Stroke)              | 747.66  | minor                                                                           |

**Left rail has 12 ticks total** (10 mid ticks as separate `VECTOR` nodes + 2 edge ticks baked into `Vector 4 (Stroke)`).

### Right rail node map (`1853:488` "Sidebar Icon" → `1853:489` "Lines Container")

| Node ID                      | Local y | Role                                                                      |
| ---------------------------- | ------- | ------------------------------------------------------------------------- |
| `1853:501` Vector 4 (Stroke) | 111.01  | **COMPOUND PATH** — guide + top/bottom edge ticks (mirror of `1802:5932`) |
| `1853:496` Line 44           | 181.59  | minor — **the extra tick** that makes the right rail 13 positions total   |
| `1853:495` Line 44           | 252.34  | minor                                                                     |
| `1853:493` Line 41           | 323.09  | minor                                                                     |
| `1853:491` Line 39           | 393.84  | MAJOR (21px)                                                              |
| `1853:499` Line 48           | 464.50  | minor                                                                     |
| `1853:498` Line 47           | 535.25  | minor                                                                     |
| `1853:492` Line 40           | 606.09  | minor                                                                     |
| `1853:490` Line 38           | 676.84  | MAJOR (21px)                                                              |
| `1853:500` Line 49           | 747.59  | minor                                                                     |
| `1853:497` Line 45           | 818.36  | minor                                                                     |
| `1853:494` Line 43           | 889.11  | minor                                                                     |

**Right rail has 13 ticks total** (11 mid ticks as separate nodes + 2 edge ticks baked into `1853:501`).

### The `Vector 4 (Stroke)` compound-path trap

Both rails ship their top and bottom edge ticks inside the `Vector 4 (Stroke)` compound `<path>` (`1802:5932` and `1853:501`). A naive walk of the rail group that filters for `type === "RECTANGLE"` or skips `VECTOR` will miss the top/bottom ticks entirely. This repeatedly caused tick miscounts until the runtime `HUD_TICK_MARKS` array was updated to inline both edge ticks at indices 0 and 12. See `hud-frame-implementation.md` §4 and `figma-to-code-playbook.md` phase 2 for the full trap description.

---

## Legacy canonical source frames (Grid (New) canvas `1610:584`)

These were the older reference specimens (pre-late-2026 refactor). Still present in the file for reference but superseded by `1802:5717`.

| Frame                         | Node ID     | Role                                   |
| ----------------------------- | ----------- | -------------------------------------- |
| Clean shell geometry          | `1766:1428` | Shared primitives only, no content     |
| Composition with text + media | `1767:2327` | Text block + image with corner unions  |
| Additional variation          | `1767:2529` | Bottom-left treatment verification     |
| Partial right rail            | `1767:2841` | Progress/scroll-reveal rail behavior   |
| Key mixed composition         | `1767:3360` | Full text + media composition specimen |

---

## Shared primitive nodes (from `1766:1428`)

Every canonical frame contains these at identical positions:

| Element            | Node ID     | Position           | Size       |
| ------------------ | ----------- | ------------------ | ---------- |
| Left rail group    | `1766:1616` | x=35.8, y=114.8    | 21 x 850   |
| Right rail group   | `1766:1639` | x=1886.2, y=115.0  | 21 x 850   |
| Inner content grid | `1766:1434` | x=163.5, y=61.1    | 1593 x 958 |
| Brandmark          | `1766:1630` | x=36.7, y=996.5    | 40 x 40.4  |
| Diamond marker     | `1766:1638` | x=56.3, y=179.5    | 8.5 x 8.5  |
| Compass line       | `1766:1629` | x=49.8, y=185.5    | 50.2 x 1   |
| Bottom-left tick   | `1766:1628` | x=86.7, y=1017.4   | 1 x 30     |
| Top-left icon      | `1766:1652` | x=56.3, y=63.0     | 30 x 30    |
| Chapter group      | `1766:1653` | x=1713.8, y=53.0   | 151.9 x 21 |
| Pagination group   | `1766:1657` | x=1815.8, y=1011.4 | 59.9 x 13  |

---

## Brand System page (`1767:3744`)

Rebuilt specimens and design-system primitives:

| Element                  | Node ID   | Role                                        |
| ------------------------ | --------- | ------------------------------------------- |
| HudCornerBracket         | `1771:14` | Primitive component (4 variants)            |
| HudTickMark              | `1772:6`  | Minor/major variants                        |
| HudRailGuide             | `1772:11` | Left/right variants                         |
| HudDiamondMarker         | `1772:12` | Gold waypoint diamond                       |
| HudChapterLabel          | `1773:2`  | Top-right chapter (TEXT property)           |
| HudPaginationLabel       | `1773:5`  | Bottom-right pagination                     |
| HudRailTicksLeft         | `1774:2`  | Left rail with labeled tick cadence         |
| HudRailTicksRight        | `1774:20` | Right rail (unlabeled)                      |
| HudAnchorOptional        | `1775:2`  | Bottom-left compass treatment               |
| HudContentInsetSpec      | `1775:6`  | Documentation frame                         |
| HudHeaderRule            | `1807:23` | 30px horizontal rule for header chrome      |
| HudLogoSlot              | `1807:24` | Bounded logo placeholder (120x48, contain)  |
| HUD Specimen — App Shell | `1777:2`  | 1920x1080 shell                             |
| HUD Specimen — Deck      | `1777:42` | 1920x1080 with header chrome (logo+chapter) |
| HUD Specimen — Minimal   | `1804:16` | 1920x1080 same chrome, no rails/ticks       |
| Adapter Notes            | `1777:86` | Shared vs product-specific + full/minimal   |
| Content Rhythm Presets   | `1783:2`  | Density ladder specimens                    |
| TextImgVariantMap        | `1809:24` | Text+Image family documentation             |

### Text+Image Family (Brand System page)

Shell pairing rule: `LogoOff` = GridShell (inner grid visible), `LogoOn` = ClientShell (grid suppressed, logo present).

| Specimen             | Node ID    | Variation                                     | Shell  |
| -------------------- | ---------- | --------------------------------------------- | ------ |
| Text+Img 1 / LogoOff | `1810:2`   | Inset media, 4 corner unions                  | Grid   |
| Text+Img 1 / LogoOn  | `1810:259` | Inset media, 4 corner unions                  | Client |
| Text+Img 2 / LogoOff | `1811:2`   | Inset media, 2 corner unions (TR+BL diagonal) | Grid   |
| Text+Img 2 / LogoOn  | `1811:257` | Inset media, 2 corner unions (TR+BL diagonal) | Client |
| Text+Img 3 / LogoOff | `1812:2`   | Inset media, 2 corner unions (TL+BR diagonal) | Grid   |
| Text+Img 3 / LogoOn  | `1812:260` | Inset media, 2 corner unions (TL+BR diagonal) | Client |
| Text+Img 4 / LogoOff | `1813:2`   | Full-bleed right-half split                   | Grid   |
| Text+Img 4 / LogoOn  | `1813:255` | Full-bleed right-half split                   | Client |

**Correction log (2026-04):** Variant 3 was previously documented as "4 corner unions (alt)" — `use_figma` tree-walker confirmed it is actually the 2-corner TL+BR diagonal, the complementary pair to variant 2's TR+BL. Together, variants 2 and 3 cover the full 4-union set between them. Variant 1 is the only frame that renders all four unions.

### Text+Image source pairs (Grid (New) canvas)

| Variation | LogoOff source | LogoOn source |
| --------- | -------------- | ------------- |
| 1         | `1767:2327`    | `1802:5717`   |
| 2         | `1767:2841`    | `1802:6500`   |
| 3         | `1767:3360`    | `1802:6767`   |
| 4         | `1802:7379`    | `1767:3622`   |

### Union-corner positions (LOW freedom, identical across all variants)

All six variants of variations 1–3 share the same image bounds and union wrapper positions. The only variance is which subset of the four corners renders and which shell mode applies.

| Element                           | Position            | Size         |
| --------------------------------- | ------------------- | ------------ |
| Image rect                        | `(965.97, 214.04)`  | 738 × 652    |
| Union TL wrapper                  | `(893.73, 141.71)`  | 128 × 128    |
| Union TR wrapper                  | `(1649.46, 141.71)` | 128 × 128    |
| Union BL wrapper                  | `(893.66, 811.27)`  | 128 × 128    |
| Union BR wrapper                  | `(1649.46, 811.27)` | 128 × 128    |
| Definition Container (text block) | `(156.51, 171)`     | 647 × 453.54 |

These wrapper positions pair with `HudUnionCorner` variant props (`"tl" | "tr" | "bl" | "br"`). The Figma nodes themselves carry `rotation` on individual Union VECTOR nodes; the React wrapper positions above have already resolved that rotation into axis-aligned boxes — do not re-offset.

### Top-left grid icon (LogoOff variants)

All LogoOff variants render a 30×30 L-bracket at the top-left where client-shell variants would place the client logo slot.

| Node                       | Position         | Size    | Path data            |
| -------------------------- | ---------------- | ------- | -------------------- |
| `1767:2551` "Rectangle 55" | `(56.33, 63.01)` | 30 × 30 | `M30.5 0.5H0.5V30.5` |

The path traces the top edge and left edge of a 30×30 square at 1px stroke — literally a top-left corner L. In code it renders pixel-for-pixel as a `<div>` with `border-top: 1px solid var(--gold)` + `border-left: 1px solid var(--gold)`.

**Not a crosshair.** The responsive `components/hud/HudTopLeftIcon.tsx` primitive currently renders a guessed crosshair+diamond+rule glyph. That is wrong by canon. Specimen pages bypass it with an inline `TopLeftGridIcon` sub-component in `SpecimenFrame.tsx`. A follow-up should replace the responsive primitive's guess with the real L-bracket path.

### Astrolabe specimen routes (LOW freedom)

Each Text+Image variant has a pixel-accurate code recreation under `app/brand-system/`. All six routes compose the same `SpecimenFrame` scaffold and the shared `TextImgContent` family helper — only the shell mode and union subset differ.

| Variant | Figma node  | Astrolabe route                              | Shell               | Unions         |
| ------- | ----------- | -------------------------------------------- | ------------------- | -------------- |
| 1a      | `1802:5717` | `app/brand-system/understanding-ai/page.tsx` | client (Lotus logo) | 4 corners      |
| 1b      | `1767:2327` | `app/brand-system/text-img-1b/page.tsx`      | grid (L-bracket)    | 4 corners      |
| 2a      | `1767:2841` | `app/brand-system/text-img-2a/page.tsx`      | grid                | TR+BL diagonal |
| 2b      | `1802:6500` | `app/brand-system/text-img-2b/page.tsx`      | client (Lotus logo) | TR+BL diagonal |
| 3a      | `1767:3360` | `app/brand-system/text-img-3a/page.tsx`      | grid                | TL+BR diagonal |
| 3b      | `1802:6767` | `app/brand-system/text-img-3b/page.tsx`      | client (Lotus logo) | TL+BR diagonal |

Shared scaffolding lives in `app/brand-system/_shared/`:

| File                 | Responsibility                                                                                                                                                 |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SpecimenFrame.tsx`  | 1920×1080 canvas, JS scale transform, `SLIDE_HUD_VARS` scoped override, rails, compass, brandmark, chapter, pagination, top-left treatment (logo OR L-bracket) |
| `TextImgContent.tsx` | Shared image block, `UNION_POSITIONS` constant, `TextImgUnderstandingImage({unions})`, `TextImgUnderstandingText()`                                            |

Each variant page file ends up ~30 lines — only `shell` config, `clientLogo` reference, and `unions` array differ. See `primitives-api.md` §5 for the API contracts.

---

## Brandmark components (same file)

| Variant              | Node ID   | Component key                              |
| -------------------- | --------- | ------------------------------------------ |
| Gold (Tensor Gold)   | `255:73`  | `90f4fef7da485c4b919d99e6ff8f4d55e3f7f0f2` |
| Dawn (Semantic Dawn) | `255:72`  | `b9ed698ead84be16f6ba17f368d0a80af456fbc2` |
| Dark (Abyss)         | `870:412` | `c879ff89234941a970b84164db48ab883472c4c9` |
| Nebulae              | `255:74`  | `661ed158512276660b7a50130641425936370af4` |

---

## Variable collection

| Name            | ID                            | Purpose                                 |
| --------------- | ----------------------------- | --------------------------------------- |
| Thoughtform/HUD | `VariableCollectionId:1770:2` | Color and spacing tokens for HUD system |

---

## MCP workflows

**Read from Figma:** `get_design_context`, `get_screenshot`, `get_metadata`, `get_variable_defs` — all require `fileKey` + `nodeId`.

**Write to Figma:** `use_figma` — requires `fileKey`, `code`, `description`. Always load the `figma-use` skill first.

**Search:** `search_design_system` — searches components, variables, and styles across the file.

**Rule:** Read from Grid (New) as source of truth. Write to Brand System page only. Never modify Grid (New).
