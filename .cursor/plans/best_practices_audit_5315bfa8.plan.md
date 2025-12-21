---
name: Best Practices Audit
overview: Audit of current Next.js/TypeScript project structure with recommendations for scalability, maintainability, and developer experience improvements.
todos:
  - id: add-sentinel
    content: Add .sentinel.md with development best practices and troubleshooting patterns
    status: completed
  - id: add-prettier
    content: Add Prettier, eslint-config-prettier, husky, and lint-staged for consistent formatting
    status: completed
  - id: add-env-example
    content: Create .env.example documenting all required environment variables
    status: completed
  - id: split-types
    content: Split lib/types.ts into domain-specific files (editor, content, database, ui)
    status: completed
  - id: extract-constants
    content: Move DEFAULT_* and SECTION_TEMPLATES to constants/ directory
    status: completed
  - id: split-cockpit
    content: Split NavigationCockpitV2.tsx into smaller focused components
    status: completed
---

# Next.js/TypeScript Best Practices Recommendations

## Current State Assessment

Your project is **well-structured for its current scope**. You're following many good practices:

- Next.js 14 App Router architecture
- TypeScript with strict mode
- Path aliases (`@/*`)
- Zustand for state management
- Barrel exports for cleaner imports
- Separation of concerns (`components/`, `lib/`, `store/`)

However, there are several areas that could be improved for long-term scalability.---

## Recommended Improvements

### 0. Add Development Best Practices Documentation (`.sentinel.md`)

Copy your existing sentinel file from Atlas to establish a living document of troubleshooting patterns and best practices. This covers:

- **SSR/Hydration patterns** - `mounted` guards, multiple loading states
- **useEffect best practices** - dependency arrays, avoiding API call storms
- **Async operations** - null narrowing across await boundaries
- **Component patterns** - conditional rendering, event handler timing
- **CSS considerations** - 3D transforms vs blur, z-index layering
- **Media handling** - fallback chains, Next.js image domain whitelisting
- **Build-time configuration** - what can vs cannot be fixed at runtime

Location: `docs/SENTINEL.md` or `.sentinel.md` at root

This is invaluable documentation that prevents entire classes of bugs before they happen.

---

### 1. Split Large Type Files

Your [`lib/types.ts`](lib/types.ts) is 632 lines. Split by domain:

```javascript
types/
├── index.ts          # Re-exports everything
├── editor.ts         # EditorState, Element, Section types
├── content.ts        # HeroContent, ButtonConfig, etc.
├── database.ts       # Page, Section, Element DB models
└── ui.ts             # Shared UI types (Bounds, SpacingConfig)
```

### 2. Extract Constants from Types

Move `DEFAULT_*` constants and `SECTION_TEMPLATES` to a dedicated location:

```javascript
constants/
├── index.ts
├── defaults.ts       # DEFAULT_ELEMENT_CONTENT, DEFAULT_ELEMENT_DIMENSIONS
├── templates.ts      # SECTION_TEMPLATES
└── grid.ts           # GRID_SIZES
```

### 3. Split Large Components

[`NavigationCockpitV2.tsx`](components/hud/NavigationCockpitV2.tsx) is 1293 lines. Consider extracting:

```javascript
components/hud/
├── NavigationCockpitV2/
│   ├── index.tsx              # Main component
│   ├── ModuleCards.tsx        # Module card section
│   ├── ConnectorLines.tsx     # SVG line animation logic
│   ├── SigilSection.tsx       # Sigil rendering
│   └── styles.ts              # JSX styles (extracted from inline)
```

### 4. Add Developer Tooling

**Add to package.json:**

```json
{
  "devDependencies": {
    "prettier": "^3.2.0",
    "eslint-config-prettier": "^9.1.0",
    "husky": "^9.0.0",
    "lint-staged": "^15.2.0"
  },
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,css,md}": ["prettier --write"]
  }
}
```

**Add `.prettierrc`:**

```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

### 5. Add Environment Documentation

Create `.env.example`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Vercel KV (optional)
KV_REST_API_URL=
KV_REST_API_TOKEN=
```

### 6. Improve Lib Organization

```javascript
lib/
├── api/                    # API utilities
│   └── supabase.ts
├── contexts/               # React contexts (already good)
├── hooks/                  # Custom hooks (already good)
├── utils/                  # Split utils by purpose
│   ├── index.ts
│   ├── cn.ts              # classnames utility
│   └── formatting.ts      # Date, number formatting
├── config/                 # Runtime configuration
│   └── particle-config.ts
└── services/               # Business logic
    └── queries.ts
```

### 7. Consider Feature-Based Structure (Future)

For larger apps, consider grouping by feature:

```javascript
features/
├── editor/
│   ├── components/
│   ├── hooks/
│   ├── store.ts
│   └── types.ts
├── particle-system/
│   ├── components/
│   ├── hooks/
│   └── config.ts
└── auth/
    ├── components/
    └── hooks/
```

---

## Priority Recommendations

| Priority | Change | Effort | Impact |

|----------|--------|--------|--------|

| High | Add `.sentinel.md` | Low | Bug prevention, troubleshooting |

| High | Add Prettier + lint-staged | Low | Consistent code style |

| High | Add `.env.example` | Low | Documentation |

| Medium | Split `types.ts` | Medium | Maintainability |

| Medium | Extract constants | Low | Cleaner separation |

| Low | Split large components | High | Better organization |

| Low | Feature-based structure | High | Future scalability |

---

## What NOT to Change

Your current setup is fine for:

- **App Router structure** - Using it correctly
- **Component barrel exports** - Good pattern for imports
- **Zustand store** - Single store is fine for this scope
- **Tailwind config** - Standard setup

---

## Summary

Your codebase is **healthy for a lean site**. The main wins would be:

1. Adding `.sentinel.md` (bug prevention, shared troubleshooting knowledge)
2. Adding Prettier + pre-commit hooks (immediate code quality)
3. Environment documentation (onboarding)

The sentinel file is particularly valuable as it captures lessons learned from real bugs and prevents entire classes of issues before they happen.
