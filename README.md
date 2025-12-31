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

Open [http://localhost:3003](http://localhost:3003)

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

## Claude Agent SDK & Skills

This project includes Claude Agent Skills for enhanced AI-assisted development.

### Skills Available

#### Context7 Documentation (`context7-docs`)

Fetches up-to-date, version-specific documentation for any library. Avoids outdated training data.

**Usage in prompts:**

- "use context7 to get Next.js docs"
- "fetch the latest Supabase authentication docs"
- "get docs for framer-motion"

**Location:** `.claude/skills/context7/`

#### Frontend Design (`frontend-design`)

Guides front-end design decisions, focusing on component aesthetics, responsive design, and maintaining the HUD aesthetic while avoiding generic AI-generated patterns.

**Usage in prompts:**

- "optimize the front-end design"
- "make this component more responsive"
- "improve the mobile layout"
- "design a new component following our patterns"

**Location:** `.claude/skills/frontend-design/`

**Key Features:**

- Builds on existing design patterns
- Maintains HUD aesthetic (corner brackets, frames, monospace typography)
- Mobile-first responsive design guidance
- Performance-aware design recommendations
- Avoids generic "AI slop" patterns

### Setting Up Claude Agent SDK

1. **Install Claude Code CLI:**

   ```bash
   npm install -g @anthropic-ai/claude-code
   ```

2. **Set API Key:**

   ```bash
   export ANTHROPIC_API_KEY=your-api-key
   ```

3. **Skills are auto-discovered** from `.claude/skills/` directory

### Project Memory

The `CLAUDE.md` file at the root contains project context that Claude uses automatically.

## Roadmap

See [ROADMAP.md](./ROADMAP.md) for the semantic editor vision.

## License

Private — Thoughtform © 2024
