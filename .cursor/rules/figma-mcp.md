# Figma MCP Integration Rules

These rules define how to translate Figma designs into Thoughtform code using the Figma Desktop MCP server.

## Required Workflow (do not skip)

1. Run `get_design_context` first to fetch the structured representation for the exact node(s).
2. If the response is too large or truncated, run `get_metadata` to get the high-level node map and then re-fetch only the required node(s) with `get_design_context`.
3. Run `get_screenshot` for a visual reference of the node variant being implemented.
4. Only after you have both `get_design_context` and `get_screenshot`, download any assets needed and start implementation.
5. Translate the output (React + Tailwind) into Thoughtform conventions (see below). Reuse the project's color tokens, components, and typography wherever possible.
6. Validate against Figma for 1:1 look and behavior before marking complete.

## Asset Handling

- The Figma MCP Server provides an assets endpoint which can serve image and SVG assets.
- **IMPORTANT**: If the Figma MCP Server returns a localhost source for an image or an SVG, use that image or SVG source directly.
- **IMPORTANT**: DO NOT import/add new icon packages. All assets should come from the Figma payload or from existing assets in `public/logos/`.
- **IMPORTANT**: Do NOT use or create placeholders if a localhost source is provided.

## Thoughtform Design System Mapping

When translating Figma output, replace generic Tailwind values with Thoughtform tokens:

### Colors (from `app/styles/variables.css`)

| Figma / Tailwind  | Thoughtform Token                                                              |
| ----------------- | ------------------------------------------------------------------------------ |
| Dark backgrounds  | `var(--void)` (#0a0908) or `var(--void-deep)` (#050504)                        |
| Light text        | `var(--dawn)` (#ebe3d6) with opacity variants: `--dawn-90` through `--dawn-04` |
| Accent / brass    | `var(--gold)` (#caa554) with opacity variants: `--gold-70` through `--gold-08` |
| Error / attention | `var(--alert)` (#ff6b35)                                                       |

### Typography (from `app/styles/variables.css`)

| Usage               | Font Family                                | Size Token                               |
| ------------------- | ------------------------------------------ | ---------------------------------------- |
| Headlines / display | `var(--font-display)` (PP Mondwest, serif) | `var(--type-display)`, `var(--type-2xl)` |
| Body text           | `var(--font-body)` (IBM Plex Mono)         | `var(--type-base)`, `var(--type-md)`     |
| Data / labels / HUD | `var(--font-data)` (IBM Plex Mono)         | `var(--type-xs)`, `var(--type-sm)`       |
| Code                | `var(--font-mono)` (IBM Plex Mono)         | `var(--type-sm)`                         |

HUD labels use: `font-family: var(--font-data); font-size: var(--type-xs); letter-spacing: 0.08em; text-transform: uppercase;`

### Spacing (8px grid system)

| Size | Token              | Value |
| ---- | ------------------ | ----- |
| xs   | `var(--space-xs)`  | 4px   |
| sm   | `var(--space-sm)`  | 8px   |
| md   | `var(--space-md)`  | 16px  |
| lg   | `var(--space-lg)`  | 24px  |
| xl   | `var(--space-xl)`  | 32px  |
| 2xl  | `var(--space-2xl)` | 48px  |
| 3xl  | `var(--space-3xl)` | 64px  |
| 4xl  | `var(--space-4xl)` | 96px  |

### Layout Tokens

- HUD padding: `var(--hud-padding)` (clamp 32-64px)
- Rail width: `var(--rail-width)` (60px desktop, 0 on compact)
- Content max width: `var(--content-max-width)` (1200px)
- Frame padding: `var(--frame-pad-x)`, `var(--frame-pad-y)`

## Component Reuse

Always check for existing components in `packages/ui/src/` before creating new ones:

### Atoms (`packages/ui/src/atoms/`)

- `CornerBracket` -- Corner bracket decorations (with arm length + thickness presets)
- `Rail` -- Vertical side rails
- `Surface` -- Elevated background panels
- `Diamond` -- Diamond decorative element
- `AccentBar` -- Horizontal accent lines
- `Label` -- HUD-style labels (uppercase, tracked)
- `TargetReticle` -- Targeting/focus reticle element

### Molecules (`packages/ui/src/molecules/`)

- `Frame` -- Standard content frame with corner brackets
- `ChamferedFrame` -- Chamfered (angled corner) frame variant
- `Badge` -- Status/category badges
- `InputGroup` -- Labeled input wrapper
- `SectionHeader` -- Section header with decorative elements

### Organisms (`packages/ui/src/organisms/`)

- `Button` -- Styled buttons with Thoughtform aesthetic
- `Card` -- Content cards with frame styling
- `HUDFrame` -- Full HUD viewport frame with corners
- `NavigationBar` -- Top navigation bar
- `Panel` -- Side panels (340px wide, with scroll area)

## Implementation Rules

- Treat the Figma MCP output (React + Tailwind) as a **representation of design and behavior**, not as final code style.
- Replace Tailwind utility classes with Thoughtform CSS variables and existing component props.
- Use CSS variables (`var(--token)`) rather than hardcoded hex/rgb values.
- Respect existing Next.js App Router patterns, Zustand state management, and Framer Motion animations.
- Strive for 1:1 visual parity with the Figma design. When conflicts arise, prefer design-system tokens and adjust spacing/sizes minimally.
- Corner brackets are a signature Thoughtform element -- use `CornerBracket` component with appropriate preset (`--corner-preset-subtle`, `--corner-preset-card`, `--corner-preset-frame`, `--corner-preset-panel`, `--corner-preset-hud`).
- All text should use `text-transform: uppercase` and wide letter-spacing for labels/HUD elements.
- Mobile-first responsive design using breakpoints: 900px (compact), 768px (tablet), 480px (phone).
