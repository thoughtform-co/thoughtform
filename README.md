# Thoughtform

> Thoughtform is the discipline of navigating the intelligence between thought and form. As the Navigator, I use this repository to make that philosophy tangible as a public navigation surface.

For years I wanted to build a full Three.js interactive website for Thoughtform, but never had the budget or the technical ability to do it solo. That changed at the end of 2025 when a new generation of LLMs arrived that were not only smarter, but genuinely better at frontend and design work. I could finally build the thing I had been seeing in my head.

This is the public navigation interface for the Thoughtform philosophy and brand. Not a brochure site. An interactive experience that demonstrates what "navigating intelligence" actually feels like, starting with the scroll-driven particle wormhole that pulls you into the latent space.

Live at [thoughtform.vercel.app](https://thoughtform.vercel.app)

## What this enables

The site embodies the Thoughtform thesis in interaction, not just in copy. Scroll to descend. The window stays. The world changes. The Three.js particle system responds to scroll position, pulling the visitor through a wormhole built from the same vector/brand elements that define the Thoughtform identity.

The Navigation HUD (corner brackets, telemetry rails, compass anchor, bearing labels) established here became the universal UI grammar across every Thoughtform repo. What started as a design experiment for one site turned into the navigational language for an entire constellation of tools.

## Navigation surfaces

**Particle wormhole.** Three.js scroll-driven animation using the Thoughtform Vector as a dimensional, animated brand element. The particle system originated in Atlas and was evolved here into the hero experience.

**Section architecture.** Hero, Manifesto, Services, About, Contact, each structured as waypoints in a descent through the site. Telemetry readouts track scroll position. Section numbering uses bearing labels (01, 02, 03...).

**Editor mode.** Authenticated users can enter edit mode to modify section backgrounds, add elements (text, images, video), and toggle template content. Built for rapid iteration on the site's visual identity.

**Astrogation module.** The Survey tool for segmenting, analyzing, and embedding visual references. This was the first interface built around Silicon Jungle's Semantic Interfaces philosophy: treating visual inspiration as navigable, not just collectable.

## The constellation

This is the third repo in the Thoughtform brand world. It inherited the particle system from Atlas and the Dawn-on-Void palette from Astrolabe. It contributed the Navigation HUD pattern now present across all repos, crystallized the brand architecture into formal Cursor skills (thoughtform-brand-architect, thoughtform-design), and established the Storybook integration for component documentation.

The Astrogation module built here taught me how to articulate what exactly inspires me about dozens of retrofuturistic UI references I had been curating. That process, while it did not yield a scalable design system on its own, directly informed the more refined architecture that emerged in Sigil.

**Sibling repos:** [Astrolabe](https://github.com/thoughtform-co/Astrolabe) (knowledge navigation), [Atlas](https://github.com/thoughtform-co/atlas) (visual navigation), [Sigil](https://github.com/thoughtform-co/sigil) (creation and learning)

## Architecture

Next.js 14 (App Router), Tailwind CSS, Framer Motion, Three.js, Supabase (Postgres), Zustand for state, deployed on Vercel. Workspace structure with `packages/*`.

```
app/                  # Next.js pages
components/
  sections/           # Page sections (Hero, Services, About, etc.)
  editor/             # Visual editor components
  canvas/             # Animation backgrounds (2D/3D)
  ui/                 # Shared UI primitives
lib/                  # Utilities, types, queries
store/                # Zustand state management
packages/ui/          # Shared UI package
public/logos/         # Brand assets
supabase/             # Database schema
```

## Reliability

Security and scalability follow the Sentinel pattern used across Thoughtform repos: evergreen principles learned from real bugs, applied as a feedback loop rather than a one-time audit. Auth gating on editor mode, environment variable discipline, pre-commit hooks via Husky, and visual regression tests via Playwright.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3003](http://localhost:3003)

Configure your local project settings with your database and auth credentials. See the repo's configuration example for required fields.

Additional commands:

| Command               | Purpose                      |
| --------------------- | ---------------------------- |
| `npm run build`       | Production build             |
| `npm run lint`        | ESLint                       |
| `npm test`            | Vitest                       |
| `npm run storybook`   | Component documentation      |
| `npm run test:visual` | Playwright visual regression |

## Current frontier

Exploring the semantic editor vision (see [ROADMAP.md](./ROADMAP.md)) and investigating how the Astrogation module's reference analysis workflow could evolve into a more scalable component derivation system. The Navigation HUD grammar is stable; the question is how to make it generative rather than manually composed.
