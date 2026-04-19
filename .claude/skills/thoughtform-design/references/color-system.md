# Thoughtform Color System

Canonical palette from the Brand Codex and Synod Color Briefing. All values map to CSS custom properties. Never hardcode hex/rgb in components.

---

## 1. The Logic (3-Tier Model)

Synod uses three color tiers; each answers a different question. They never overlap in function.

- **Dawn / Ink** = the environment. This is the dominant color. All text, all structure, all borders, all surfaces. If something doesn't have a specific semantic reason to be colored, it's Dawn (light mode) or Ink (dark mode) at some opacity. Roughly 90% of visible pixels are this tier. The interface feels monochromatic by design.
- **Gold** = wayfinding. It answers: _where am I, what am I looking at right now?_ Active sidebar item, selected message, links, navigation-oriented action buttons (Done, Snooze). Gold is present-tense and spatial. Think of it as the compass needle.
- **Green (Atreides)** = provenance. It answers: _did I make this?_ The left-border on sent messages, the "· you" label, draft indicators, the reply compose zone, the Send button. Green is past-tense and identity-based. It marks where you've been or where you're about to leave your mark.

**Decision rule for any new element:** Ask "is this about where or about who?" Where → Gold. Who → Green. Neither → Dawn/Ink.

Gold and green never do each other's job. A link is never green. A sent indicator is never gold. They coexist without competing.

**Mode independence:** When switching between dark and light mode, only the environment changes. Gold stays gold (with a value shift for contrast). Green stays green. Same instrument, different lighting.

---

## 2. Core Palette

| Name           | Token          | Hex       | Role                                                                |
| -------------- | -------------- | --------- | ------------------------------------------------------------------- |
| Void           | void           | `#050403` | Deepest background layer in dark mode                               |
| Latent Night   | ink            | `#110F09` | Primary text in light mode; surface base in dark mode               |
| Semantic Dawn  | dawn           | `#ECE3D6` | Background substrate in light mode; primary text in dark mode       |
| Tensor Gold    | gold           | `#CAA554` | Wayfinding (dark mode). Navigation, selection, links, active states |
| Gold (Light)   | gold           | `#9A7A2E` | Wayfinding (light mode). Darkened for contrast against Dawn         |
| Atreides Mid   | atreides-mid   | `#3D4B33` | Provenance. Borders, accents on authored content                    |
| Atreides Light | atreides-light | `#5B7A4E` | Provenance hover. Hover states, draft labels, badge borders         |
| Atreides Glow  | atreides-glow  | `#7A9E6A` | Provenance active. Active/pressed composition elements              |

---

## 3. Per-Mode Semantic Tokens

Implement as CSS custom properties. Set these on `:root` for dark mode and `[data-theme="light"]` (or equivalent) for light mode.

| Token          | Dark mode   | Light mode  | Usage                  |
| -------------- | ----------- | ----------- | ---------------------- |
| --bg           | `#050403`   | `#ECE3D6`   | Page background        |
| --surface-0    | `#0A0908`   | `#E4DAC9`   | Sidebar, list panel bg |
| --surface-1    | `#0F0E0C`   | `#DDD2C0`   | Message cards, inputs  |
| --surface-2    | `#141311`   | `#F2EAE0`   | Elevated surfaces      |
| --text         | Dawn @ 70%  | Ink @ 70%   | Body text              |
| --text-strong  | Dawn @ 80%  | Ink @ 80%   | Headings, sender names |
| --text-muted   | Dawn @ 30%  | Ink @ 30%   | Timestamps, labels     |
| --border       | Dawn @ 8%   | Ink @ 8%    | Dividers, card borders |
| --gold         | `#CAA554`   | `#9A7A2E`   | Nav accent, links      |
| --gold-hover   | `#E0BC6A`   | `#B8922F`   | Gold hover state       |
| --gold-bg      | Gold @ 5%   | Gold @ 5%   | Selected item bg       |
| --green        | `#3D4B33`   | `#3D4B33`   | Authored border (same) |
| --green-text   | `#5B7A4E`   | `#4A6238`   | Draft labels, Send btn |
| --green-border | Green @ 30% | Green @ 30% | Badge outlines         |

Green values are nearly identical across modes—forest tones have enough inherent darkness to read against both. This is intentional.

---

## 4. Dawn / Ink Opacity Scales

### Dark mode (Dawn on dark bg)

| Token   | Value | Usage                     |
| ------- | ----- | ------------------------- |
| dawn    | 100%  | Primary text, headings    |
| dawn-80 | 80%   | Strong text, sender names |
| dawn-70 | 70%   | Body text                 |
| dawn-50 | 50%   | Tertiary text             |
| dawn-40 | 40%   | Secondary labels          |
| dawn-30 | 30%   | Timestamps, metadata      |
| dawn-15 | 15%   | Hover borders             |
| dawn-08 | 08%   | Default borders, dividers |
| dawn-04 | 04%   | Ghost backgrounds         |

### Light mode (Ink on light bg)

Mirror the same steps: ink, ink-80, ink-70, ink-50, ink-40, ink-30, ink-15, ink-08, ink-04. Use Latent Night `#110F09` as base with the same opacity percentages.

**Rule:** Use the nearest step. Do not invent dawn-20 or dawn-60.

---

## 5. Gold Opacity Scale

| Token   | Value | Usage                              |
| ------- | ----- | ---------------------------------- |
| gold    | 100%  | Active nav, links, primary CTA     |
| gold-40 | 40%   | Avatar border, subtle gold stroke  |
| gold-15 | 15%   | Course line—active                 |
| gold-10 | 10%   | Avatar background tint             |
| gold-05 | 05%   | Selected item background (gold-bg) |

Gold base and hover values swap per mode (see Per-Mode Semantic Tokens).

---

## 6. Atreides (Green) Scale

| Token          | Value                                | Usage                                                                     |
| -------------- | ------------------------------------ | ------------------------------------------------------------------------- |
| atreides-mid   | `#3D4B33`                            | Primary green. Borders, authored left-edge                                |
| atreides-light | `#5B7A4E` (dark) / `#4A6238` (light) | Hover, draft labels, Send btn text                                        |
| atreides-glow  | `#7A9E6A` (dark) / `#5B7A4E` (light) | Active/pressed composition                                                |
| atreides-30    | 30%                                  | Badge outlines, green border tint                                         |
| atreides-15    | 15%                                  | Send button hover fill (transient only; green has no persistent bg tints) |

**Rule:** Green has no background tints as a surface. Green appears only as borders (2–3px left-border), text labels, and button borders. Never as a surface fill or background wash.

---

## 7. Surface (Depth Layers)

Progression = proximity to user. Never skip a layer.

### Dark mode

| Token     | Value     | Usage                     |
| --------- | --------- | ------------------------- |
| surface-0 | `#0A0908` | Sidebars, primary panels  |
| surface-1 | `#0F0E0C` | Message cards, inputs     |
| surface-2 | `#141311` | Modals, elevated surfaces |

### Light mode

| Token     | Value     | Usage                 |
| --------- | --------- | --------------------- |
| surface-0 | `#E4DAC9` | Sidebars, list panels |
| surface-1 | `#DDD2C0` | Message cards, inputs |
| surface-2 | `#F2EAE0` | Elevated surfaces     |

---

## 8. Application Map

Element-by-element color assignments for Synod (mail UI). Use as implementation reference.

### Sidebar

| Element            | Color    | Notes                                                           |
| ------------------ | -------- | --------------------------------------------------------------- |
| Active nav item    | Gold     | Gold text, gold left-border (2px), gold-bg background           |
| Inactive nav items | Dawn/Ink | Muted text, no border. Hover: slightly brighter text            |
| Drafts badge       | Green    | Green border, green text, transparent bg. Shows count           |
| Account avatar     | Gold     | Gold border, gold initial on gold-bg                            |
| Compose button     | Dawn/Ink | Standard button. Not green—compose is an action, not provenance |

### Message List

| Element           | Color    | Notes                                                                                |
| ----------------- | -------- | ------------------------------------------------------------------------------------ |
| Selected message  | Gold     | Gold left-border (2px), gold-bg tint                                                 |
| Authored messages | Green    | Green left-border (2px), no background tint. Small green diamond next to sender name |
| Draft in inbox    | Green    | Green left-border, "Draft" label in green mono text. No bg tint                      |
| Unread indicator  | Dawn/Ink | Bold sender name, slightly brighter text. No color                                   |
| Timestamps        | Dawn/Ink | Mono, muted opacity                                                                  |

### Reading Pane

| Element               | Color    | Notes                                                                     |
| --------------------- | -------- | ------------------------------------------------------------------------- |
| Subject line          | Dawn/Ink | Full opacity text                                                         |
| Links in body         | Gold     | Gold text, gold-hover on hover                                            |
| Your sent messages    | Green    | 3px green left-border. Same surface bg as other messages                  |
| "· you" label         | Green    | Small mono label next to your sender name in thread                       |
| Reply/Forward buttons | Dawn/Ink | Standard button. Hover: standard brightening                              |
| Done / Snooze buttons | Gold     | Standard button. Hover: gold border + gold text                           |
| Reply compose area    | Green    | 3px green left-border. Standard surface bg. Hover: green border brightens |
| Send button           | Green    | Green border, green text. Hover: green-bg fill + brighter text            |
| Discard button        | Dawn/Ink | Standard muted button                                                     |
| Signature links       | Gold     | Same as body links                                                        |

---

## 9. Visual Hierarchy

Approximate weight distribution:

- **~90%** Dawn/Ink. The world. Text, borders, backgrounds, structure.
- **~7%** Gold. Present wherever the user is actively navigating. Accent lighting—visible but not dominant.
- **~3%** Green. A trace, a watermark. Noticeable when scanning for your own content but never competes with environment or wayfinding. Think: a faint signet ring, not a uniform.

If you squint and green is the first thing you notice, there's too much. You should see warm parchment (or warm dark), gold highlights on active elements, and only then—on closer inspection—the green tracing authored content.

---

## 10. Hard Rules

1. **Gold never marks authorship.** A sent message border is never gold. A draft label is never gold. Gold means "where," not "who."
2. **Green never marks navigation.** An active sidebar item is never green. A selected message is never green. Green means "who," not "where."
3. **Green has no background tints.** Green appears only as borders (2–3px left-border), text labels, and button borders. Never as a surface fill or background wash. Trace, not zone.
4. **Mode changes only swap the environment.** When toggling dark/light, only Dawn↔Ink swap roles. Gold adapts its value for contrast but keeps its role. Green stays virtually identical across modes.
5. **No color = Dawn/Ink.** When in doubt about any element, default to the environment tier. Adding color is a semantic commitment—it should mean something.
6. **Zero border-radius everywhere.** All elements use sharp corners. Thoughtform brand constraint—precision geometry, no softening.

---

## 11. Typography (Color Adjacent)

- **Sans** (PP Neue Montreal): Body text, sender names, subjects, previews, descriptive UI labels. Weights: 300, 400, 500, 700.
- **Mono** (PT Mono): Titles, headings, data, timestamps, badges, system labels, "· you" label, button text, navigation items, HUD readouts. Weights: 400, 700.
- Mono = machine voice. Sans = human voice. Titles, system-generated labels, and any data readout use Mono; long-form / paragraph copy uses Sans.

---

## 12. Motion & Timing

- Instant feedback: hover states, color changes, opacity shifts.
- Fast transitions: border-color on focus, panel reveals. Maximum for any UI transition ~150ms.
- Easing: ease-out for everything. No spring, no bounce. Animate: color, opacity, border-color, transform. Never animate layout properties.

---

## 13. Alert & System

| Token | Hex       | Usage                                                     |
| ----- | --------- | --------------------------------------------------------- |
| alert | `#FF6B35` | Errors, destructive actions, warnings                     |
| verde | `#39FF14` | System/terminal green (sparingly; prefer Atreides for UI) |

---

## 14. Atmospheric (Brand-Level, Not Synod)

For other Thoughtform products (Atlas, Astrolabe, marketing). Not used in Synod's 3-tier system.

| Token   | Hex       | Role                              |
| ------- | --------- | --------------------------------- |
| spice   | `#D4A574` | Warm accent, light-mode highlight |
| haze    | `#8B8682` | Muted borders, disabled states    |
| nebulae | `#5B7A9E` | Cool accent, secondary emphasis   |

---

## 15. Semantic Aliases

| Alias       | Maps To               | Use In                        |
| ----------- | --------------------- | ----------------------------- |
| background  | --bg                  | Page/chrome background        |
| text        | --text                | Body text                     |
| textStrong  | --text-strong         | Headings, emphasis            |
| textMuted   | --text-muted          | Timestamps, labels            |
| accent      | --gold                | Primary accent, nav active    |
| border      | --border              | Default borders               |
| borderHover | dawn-15 / ink-15      | Hover borders                 |
| provenance  | --green, --green-text | Authored content, draft, Send |

---

## 16. Accessibility (WCAG AA)

- **Dark mode:** Text on surface-0/surface-1 must meet 4.5:1 contrast against dawn (and dawn-70 for large text). Gold on void: use gold at 100% for interactive elements; avoid gold-30 as sole text color.
- **Light mode:** Use Ink (Latent Night) for text on Dawn backgrounds. Gold light value (#9A7A2E) is darkened for contrast against Dawn. Green (Atreides) reads on both; use green-text for sufficient contrast where needed.
- **Focus:** Visible focus ring using gold or dawn, 2px, offset. Never rely on color alone for state.

---

## 17. What Never Appears

- Pure `#000000` or `#FFFFFF` (use void/dawn/ink)
- Gold on authored content or green on navigation elements
- Green as a surface fill or background wash (borders and text only)
- More than 2–3 accent colors per screen (Gold + Green; optionally one atmospheric elsewhere)
- Gradient fills for UI structure (atmospheric gradients only in hero/background, brand-approved)
- New opacity steps outside the published scales
- Border-radius > 0
