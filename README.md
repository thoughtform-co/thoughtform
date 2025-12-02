# Thoughtform.co

Website for Thoughtform — pioneering intuitive human-AI collaboration.

## Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion, Three.js
- **Database:** Supabase (Postgres)
- **State:** Zustand
- **Deployment:** Vercel

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

Create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Project Structure

```
app/                  # Next.js pages
components/
  ├── sections/       # Page sections (Hero, Services, About, etc.)
  ├── editor/         # Visual editor components
  ├── canvas/         # Animation backgrounds (2D/3D)
  └── ui/             # Shared UI components
lib/                  # Utilities, types, queries
store/                # Zustand state management
public/logos/         # Brand assets
supabase/             # Database schema
```

## Editor Mode

Press the "Edit" button (requires auth) to enter edit mode:
- Select sections to modify backgrounds
- Add elements (text, images, video)
- Toggle visibility of template content

## Roadmap

See [ROADMAP.md](./ROADMAP.md) for the semantic editor vision.

## License

Private — Thoughtform © 2024

