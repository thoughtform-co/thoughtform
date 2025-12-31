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
