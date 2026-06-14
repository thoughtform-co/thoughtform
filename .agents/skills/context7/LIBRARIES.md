# Common Library IDs for Context7

This file contains commonly used library IDs for quick reference.

## This Project's Stack

| Library           | Context7 ID                | Description                    |
| ----------------- | -------------------------- | ------------------------------ |
| Next.js           | `vercel/next.js`           | React framework for production |
| React             | `facebook/react`           | UI library                     |
| Supabase JS       | `supabase/supabase-js`     | Supabase client for JS         |
| Tailwind CSS      | `tailwindlabs/tailwindcss` | Utility-first CSS framework    |
| Three.js          | `mrdoob/three.js`          | 3D graphics library            |
| React Three Fiber | `pmndrs/react-three-fiber` | React renderer for Three.js    |
| Drei              | `pmndrs/drei`              | React Three Fiber helpers      |
| Framer Motion     | `framer/motion`            | Animation library              |
| Zustand           | `pmndrs/zustand`           | State management               |
| GSAP              | `greensock/gsap`           | Animation platform             |

## Frontend Frameworks

| Library | Context7 ID       |
| ------- | ----------------- |
| Next.js | `vercel/next.js`  |
| React   | `facebook/react`  |
| Vue.js  | `vuejs/vue`       |
| Svelte  | `sveltejs/svelte` |
| Angular | `angular/angular` |
| Astro   | `withastro/astro` |
| Remix   | `remix-run/remix` |

## Styling

| Library           | Context7 ID                           |
| ----------------- | ------------------------------------- |
| Tailwind CSS      | `tailwindlabs/tailwindcss`            |
| Styled Components | `styled-components/styled-components` |
| Emotion           | `emotion-js/emotion`                  |
| Sass              | `sass/sass`                           |

## State Management

| Library        | Context7 ID      |
| -------------- | ---------------- |
| Zustand        | `pmndrs/zustand` |
| Redux          | `reduxjs/redux`  |
| Jotai          | `pmndrs/jotai`   |
| TanStack Query | `tanstack/query` |

## Backend / Database

| Library     | Context7 ID                |
| ----------- | -------------------------- |
| Supabase JS | `supabase/supabase-js`     |
| Prisma      | `prisma/prisma`            |
| Drizzle     | `drizzle-team/drizzle-orm` |

## Animation

| Library       | Context7 ID           |
| ------------- | --------------------- |
| Framer Motion | `framer/motion`       |
| GSAP          | `greensock/gsap`      |
| React Spring  | `pmndrs/react-spring` |

## 3D Graphics

| Library           | Context7 ID                |
| ----------------- | -------------------------- |
| Three.js          | `mrdoob/three.js`          |
| React Three Fiber | `pmndrs/react-three-fiber` |
| Drei              | `pmndrs/drei`              |

## Testing

| Library    | Context7 ID            |
| ---------- | ---------------------- |
| Jest       | `jestjs/jest`          |
| Vitest     | `vitest-dev/vitest`    |
| Playwright | `microsoft/playwright` |
| Cypress    | `cypress-io/cypress`   |

## Utilities

| Library  | Context7 ID         |
| -------- | ------------------- |
| Lodash   | `lodash/lodash`     |
| Date-fns | `date-fns/date-fns` |
| Zod      | `colinhacks/zod`    |

---

To fetch docs for any library:

```bash
# By full ID
curl -s "https://context7.com/api/v1/vercel/next.js/llms.txt?tokens=5000"

# Or use the helper script
./fetch-docs.sh next.js 5000
```
