---
name: Services triple-card deck
overview: Add two new service cards that fan out from behind the existing manifesto/bridge frame during the manifesto→services transition, ending in a 3-up row (left/middle/right). Cards use Thoughtform's framed-corner aesthetic + translucent glass, each with an admin-editable particle sigil header. Sigil configs persist to Supabase. Desktop-only for now.
todos:
  - id: add-services-deck-component
    content: Create `ServicesDeck` component that renders 3 service cards and fans them out from a shared anchor using `tManifestoToServices`.
    status: completed
  - id: wire-deck-into-cockpit
    content: Render the services deck in `components/hud/NavigationCockpitV2/index.tsx` (desktop-only) and derive per-card positions from existing `bridgeFrameStyles`.
    status: completed
    dependencies:
      - add-services-deck-component
  - id: adjust-services-card-width
    content: Morph the moving frame/card width for the services phase so the final 3-up layout is aligned and fits (introduce SERVICES_CARD_WIDTH + GAP).
    status: completed
    dependencies:
      - wire-deck-into-cockpit
  - id: sigil-geometry-generator
    content: Build `SigilCanvas` component with geometry generator supporting 12+ shape types (ring, torus, spiral, star, grid, etc.) with particle rendering.
    status: completed
  - id: supabase-sigil-schema
    content: Add `service_sigils` table to Supabase schema for persisting sigil configurations per card.
    status: completed
  - id: sigil-config-context
    content: Create React context + hooks for loading/saving sigil configs from Supabase (similar to ParticleConfigContext).
    status: completed
    dependencies:
      - supabase-sigil-schema
  - id: admin-sigil-editor
    content: Build hover-triggered admin panel for editing sigil shape, particle count, color, animation params (similar to ParticleAdminPanel).
    status: completed
    dependencies:
      - sigil-geometry-generator
      - sigil-config-context
  - id: integrate-sigils-into-cards
    content: Wire SigilCanvas into ServicesDeck cards, with AdminGate-wrapped hover editor.
    status: completed
    dependencies:
      - add-services-deck-component
      - admin-sigil-editor
  - id: services-deck-styles
    content: Add CSS in `app/styles/navigation.css` for the deck + cards (glass, corners, typography with PP Mondwest for body).
    status: completed
    dependencies:
      - wire-deck-into-cockpit
---

# Services: 3-card deck with admin-editable sigils (desktop)

## What we're building

### Core deck behavior

- **End state**: after the manifesto→services scroll completes, you see **three aligned cards** next to each other (left / center / right).
- **Animation**: as `tManifestoToServices` goes 0→1:
  1. The existing frame **shrinks** from 700px → ~340px
  2. The frame slides to the **right** position
  3. **Two new cards spawn from behind** and fan out to **center** and **left**
- **Card content**: one service per card:
  - **Inspire // Keynotes** — "See AI for what it actually is; not software, but an alien intelligence."
  - **Practice // Workshop** — "Transform ChatGPT, Claude, ... from tool into a creative and strategic partner."
  - **Transform // Strategies** — "Build a culture where AI amplifies human potential."

### Card design (reference image style)

- Tensor Gold corners (TL + BR)
- Semi-transparent dark glass background with blur
- **Particle sigil** at top of card (particles can spill beyond card borders)
- Title + body text below sigil
- Body copy uses **PP Mondwest** font

### Admin sigil editor

- **Hover-triggered**: when admin hovers over a card, an edit panel appears (like ParticleAdminPanel)
- **Editable properties**:
  - Geometry/shape type
  - Particle count
  - Color (default: Tensor Gold)
  - Animation params (drift, pulse, etc.)
- **Persistence**: Supabase (like particle config)

## Sigil geometry types

### Geometric primitives

- Circle / Ring
- Torus (donut shape from reference)
- Square grid
- Triangle
- Diamond
- Hexagon

### Complex shapes

- Spiral
- Star (configurable point count: 4, 5, 6, 8)
- Cross / Plus
- Concentric rings
- Abstract symmetric blob

### Thoughtform-specific

- Brandmark-derived (compass paths)
- Gateway-inspired (dotted ring patterns)
- Manifold slice (organic flowing shape)

## Key existing hook points

The progress driver we'll use:

```314:337:components/hud/NavigationCockpitV2/index.tsx
  // MANIFESTO → SERVICES TRANSITION PROGRESS
  const tManifestoToServices = useMemo(() => {
    if (!manifestoComplete) return 0;
    // ...
    return easeInOutCubic(rawProgress);
  }, [manifestoComplete, manifestoScrollProgress]);
```

The current "slide to right" behavior we will extend with width shrink:

```435:494:components/hud/NavigationCockpitV2/index.tsx
    // MANIFESTO → SERVICES: Terminal slides from center to right
    const servicesDx = ...
    return {
      width: `${frameWidth}px`,  // Will add shrink interpolation here
      transform: `translateX(calc(${baseTransformPct}% + ${servicesDx}))`,
    };
```

## Implementation approach

### 1) Services deck component

Create `ServicesDeck.tsx` that:

- Renders 3 `ServiceCard` children
- Takes `progress` (tManifestoToServices) and `anchorStyles`
- Positions cards with staggered translateX based on progress
- Adds depth cues (z-index, slight scale) while stacked

Files:

- Add: [`components/hud/NavigationCockpitV2/ServicesDeck.tsx`](components/hud/NavigationCockpitV2/ServicesDeck.tsx)
- Add: [`components/hud/NavigationCockpitV2/ServiceCard.tsx`](components/hud/NavigationCockpitV2/ServiceCard.tsx)

### 2) Frame width shrink + 3-up alignment

- Introduce constants:
  - `SERVICES_CARD_WIDTH = 340` (px)
  - `SERVICES_CARD_GAP = 40` (px)
- Modify `bridgeFrameStyles` to interpolate width: `700px → 340px` as `tManifestoToServices` goes 0→1
- Calculate deck total width: `3 * 340 + 2 * 40 = 1100px`

File:

- Update: [`components/hud/NavigationCockpitV2/index.tsx`](components/hud/NavigationCockpitV2/index.tsx)

### 3) Sigil canvas with geometry generator

Create `SigilCanvas.tsx`:

- Canvas-based particle renderer (same aesthetic as ThoughtformSigil)
- Geometry generator function that returns point arrays for each shape type
- Grid-snapped squares, subtle drift/pulse animation
- Configurable: shape, particleCount, color, seed, animationParams

Files:

- Add: [`components/hud/NavigationCockpitV2/SigilCanvas.tsx`](components/hud/NavigationCockpitV2/SigilCanvas.tsx)
- Add: [`lib/sigil-geometries.ts`](lib/sigil-geometries.ts) (geometry generation functions)

### 4) Supabase schema for sigil configs

Add table `service_sigils`:

```sql
CREATE TABLE service_sigils (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_index INTEGER NOT NULL UNIQUE, -- 0, 1, 2
  shape TEXT NOT NULL DEFAULT 'torus',
  particle_count INTEGER NOT NULL DEFAULT 200,
  color TEXT NOT NULL DEFAULT '202, 165, 84',
  animation_params JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

Files:

- Update: [`supabase/schema.sql`](supabase/schema.sql)
- Run migration

### 5) Sigil config context

Create context similar to `ParticleConfigContext`:

- Load sigil configs on mount
- Provide update functions
- Optimistic updates with Supabase sync

Files:

- Add: [`lib/contexts/SigilConfigContext.tsx`](lib/contexts/SigilConfigContext.tsx)

### 6) Admin sigil editor panel

Hover-triggered editor (AdminGate-wrapped):

- Shape selector (dropdown or visual grid)
- Particle count slider
- Color picker
- Animation toggles
- Save button (persists to Supabase)

Files:

- Add: [`components/hud/NavigationCockpitV2/SigilEditorPanel.tsx`](components/hud/NavigationCockpitV2/SigilEditorPanel.tsx)

### 7) CSS styling

Add classes:

- `.services-deck` (container positioning)
- `.service-card` (glass, border, corners)
- `.service-sigil` (canvas wrapper, overflow visible for spill)
- `.service-title`, `.service-body` (PP Mondwest typography)
- `.sigil-editor-panel` (hover panel styling)

File:

- Update: [`app/styles/navigation.css`](app/styles/navigation.css)

## Transition integrity (what stays untouched)

- Hero → Definition transition (different progress variable)
- Definition → Manifesto transition (different progress variable)
- Manifesto reveal itself (unchanged)
- Mobile behavior (bypassed with `!isMobile` guard)

## Acceptance checks

- [ ] Scroll past manifesto → right frame shrinks and slides right
- [ ] Two cards emerge from behind, fan out to left and center
- [ ] Final 3-up layout is evenly spaced and aligned
- [ ] Each card shows particle sigil + correct title + body text (PP Mondwest)
- [ ] Admin: hover over card → editor panel appears
- [ ] Admin: change shape → sigil updates live
- [ ] Admin: save → config persists to Supabase, survives refresh

## Future (out of scope)

- Mobile: stacked cards + swipe behavior
- Additional geometry types
- Per-card custom colors
