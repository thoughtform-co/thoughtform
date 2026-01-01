# Thoughtform.co - Project Context

This is the Thoughtform.co website, a Next.js application with a sophisticated particle system and HUD-based navigation.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI**: React 18, Tailwind CSS
- **State**: Zustand
- **Animation**: Framer Motion, GSAP
- **3D**: Three.js, React Three Fiber, Drei
- **Database**: Supabase
- **Editor**: TipTap (rich text)

## Project Structure

```
app/                    # Next.js App Router pages
components/
  ├── hud/             # HUD navigation system (NavigationCockpitV2, etc.)
  ├── canvas/          # Canvas-based backgrounds
  ├── sections/        # Page sections (Hero, Services, etc.)
  ├── editor/          # Visual editor components
  └── ui/              # Reusable UI components
lib/                   # Utilities, hooks, types
constants/             # Configuration defaults
supabase/              # Database schema and migrations
```

## Key Components

### Navigation System

- `NavigationCockpitV2/` - Main scroll-driven HUD with frame morphing
- `NavigationBar.tsx` - Top navigation with mobile section indicator
- Section indicator shows current section (01 Home → 02 Interface → 03 Manifesto → 04 Services)

### Particle System

- `ParticleCanvasV2.tsx` - Main particle canvas
- Config stored in Supabase `particle_config` table
- Admin panel at `/admin` for live editing

## Database

- Uses Supabase with Row Level Security (RLS)
- Tables: `pages`, `sections`, `elements`, `design_log`, `particle_config`
- Schema in `supabase/schema.sql`, RLS policies in `supabase/auth-rls.sql`

## Development Commands

```bash
npm run dev      # Start development server (localhost:3003)
npm run build    # Production build
npm run lint     # Run ESLint
npm run format   # Format with Prettier
```

## Skills Available

### Context7 Documentation

Use "context7" or "get docs for [library]" to fetch up-to-date documentation.
Example: "use context7 to get the latest Next.js App Router docs"

### Frontend Design

Use when optimizing front-end, designing components, or improving responsive design. Guides design decisions while maintaining the HUD aesthetic and avoiding generic patterns.
Example: "optimize the front-end design", "make this component responsive", "design a new component"

## Conventions

- Use TypeScript strictly
- Follow existing code patterns
- Mobile-first responsive design
- CSS variables for theming (--gold, --dawn, etc.)
- Scroll-driven animations with progress values 0-1

## Design System Patterns

### Focus Overlay System (ADR-006)

When building any modal, detail view, or focus overlay, use these patterns:

**Required CSS Variables** (defined in `.astrogation`):

```css
--focus-overlay-bg: rgba(10, 9, 8, 0.2);
--focus-overlay-blur: 12px;
--focus-overlay-border: rgba(235, 227, 214, 0.3);
--focus-backdrop-bg: rgba(10, 9, 8, 0.3);
```

**Required Animation** - Apply to the CONTENT element, not the backdrop:

- `assetFocusIn` - for absolutely positioned content (`top: 50%; left: 50%`)
- `modalFocusIn` - for flexbox-centered content (`display: flex; align-items: center`)

```css
animation: assetFocusIn 0.3s ease-out; /* or modalFocusIn */
```

**Required Box Shadow**:

```css
box-shadow:
  0 0 0 1px rgba(235, 227, 214, 0.05),
  0 0 60px rgba(202, 165, 84, 0.1),
  0 30px 80px rgba(0, 0, 0, 0.6);
```

**Required Structure**:

1. Fixed container with backdrop (uses `--focus-backdrop-bg`)
2. Centered overlay with animation (`assetFocusIn`)
3. Content frame with dashed border (`--focus-overlay-border`)
4. Label badge on top (if content has a title)

**Size Variants**:
| Variant | Max Width | Max Height | Use Case |
|---------|-----------|------------|----------|
| small | 400px/50vw | 300px/50vh | Icons, small assets |
| medium | 600px/60vw | 400px/50vh | Standard components |
| large | 900px/75vw | 700px/75vh | Images, detailed views |

### Panel Layout

Both side panels use identical dimensions:

- Width: `340px`
- Margin-top: `40px`
- Height: `calc(100vh - var(--hud-padding, 32px) * 2 - 120px)`

### Grid Item Hover States

All clickable grid items should use:

- `transform: translateY(-2px)` on hover
- `border-color: var(--gold-30)` on hover
- `box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4)` on hover

See `sentinel/decisions/006-focus-overlay-system.md` for full documentation.
