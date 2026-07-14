# Maintenance — recurrence engine

> **When to open this:** at the start of any non-trivial change, and at the **end** of any conversation that modified code.  
> It connects **bugs** and **new features** to the same durable surfaces: `sentinel/`, `.claude/rules/`, `.claude/skills/`, and [LANGUAGE.md](../LANGUAGE.md).

---

## Cycle A: post-incident capture checklist

Run after **any** code change, before merge/push. If **any** question is _yes_, do the _then_ line before the work is “done”.

| #   | Question                                                                                                                 | If yes, then…                                                                                        |
| --- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| 1   | Did the fix take **more than two iterations**?                                                                           | Open or extend an ADR in `sentinel/decisions/`.                                                      |
| 2   | Did we **revert** a previous fix or go in circles?                                                                       | Open an ADR; link the prior attempt and what failed.                                                 |
| 3   | Did we discover a **class of bug** (sticky + fixed overlay, scale-edge drift, stale `onEnter`, fast-scroll scrub, etc.)? | Add a **pattern** to [BEST-PRACTICES.md](BEST-PRACTICES.md) with a short title and “why it matters.” |
| 4   | Must **two or more files** change together for the fix to hold?                                                          | Add or extend a **path-scoped** rule in `.claude/rules/` and mirror in `.cursor/rules/*.mdc`.        |
| 5   | Would a **runtime check** (Playwright, manual scroll script, console assert) have caught it earlier?                     | Add steps to the relevant `SKILL.md` debugging recipe, or to this repo’s test notes.                 |
| 6   | Does the fix **change an architectural assumption** (auth, scroll, layers, public API of a feature)?                     | Update or create an **ADR**; don’t only patch code.                                                  |

“Non-trivial” is the OR of the above — not a vibe check.

---

## Cycle B: new-feature scaffolding (before you build)

Use when adding **new surface area** (section, dashboard, public API, major hook), not for one-liners.

1. **Scan** `sentinel/decisions/`, `.claude/rules/`, and `.claude/skills/` for **prior art** in the same domain. Cite it in the ADR you open next.
2. **Open** `sentinel/decisions/NNN-short-name.md` with **Status: Proposed**. Document the **shape**, **alternatives rejected**, and **links** to related ADRs (e.g. 008/010 for anything touching landing v7 + brandmark).
3. **Build.** If a **recurring workflow** appears (debug steps, checklists, compositing invariants), add a `.claude/skills/<topic>/SKILL.md`.
4. **Wire paths:** add `.claude/rules/<area>.md` and `.cursor/rules/<area>.mdc` with `paths` / `globs` and pointers back to the ADR + skill.
5. When shipped: set ADR to **Accepted**; keep rules/skills in sync with reality.

If the feature would **contradict** an existing ADR (e.g. compositing, auth), the contradiction must be **resolved in the ADR** before merge — not as a drive-by.

---

## When to NOT capture

Skip Sentinel updates for **trivial** work so the ledger stays signal-rich:

- Typos, copy-only, comments-only
- Dependency bumps with no API migration
- Generated files (e.g. committed migration outputs) where the _intent_ is already in a prior ADR
- Formatting-only rewrites with no behavior change

If unsure, use **one** of the questions in [Cycle A](#cycle-a-post-incident-capture-checklist) as the bar: a single _yes_ means capture.

---

## Ledger

Chronological record of repo-wide maintenance passes (distinct from the Cycle
A/B capture rules above). Newest first.

### 2026-07-14 — Phase 3 (performance: landing First Load JS)

- **The WebGL stack is out of the landing's initial bundle**: First Load JS
  **449.8 → 106.8 kB gzip (−76%)**, parsed 1553.7 → 330.7 kB. Four seams,
  each its own commit:
  - `98e48cf` — HomeCorridor lazy inside `useCorridorMount`'s nested root
    (React.lazy + Suspense; the sync `.home-corridor-host` wrapper keeps the
    `hasContent` recovery guard satisfied).
  - `da410e8` — BrandmarkParticleCanvas via `next/dynamic` ssr:false (the
    vector actor + dock glyphs are the mark; the canvas is atmosphere).
  - `b3c5681` — journey scalars extracted to the three-free
    `journeyScalars.ts` (intelligenceLayerGeom re-exports; bodies
    byte-identical).
  - `3443801` — `RING_CARD_CTA_BOX` + bake dims to the three-free
    `hologram/ringCtaBox.ts` (one layout constant was dragging
    three/fiber/drei in via ServicesRingHitAreas).
  - `e653950` — services-ring smoke measures the runway AFTER the corridor
    inflates (the lazy chunk widened a pre-existing post-hydration
    inflation window; below-the-fold, no CLS change).
- **Lab mobile (same-day)**: FCP 2.0→1.5 s, Speed Index 5.0→3.0 s,
  LCP 8.2→7.1 s, TTI 12.1→10.8 s (before = prod www / old bundle; after =
  localhost prod build). Remaining initial: supabase-js 34 kB gz,
  gsap 19.2 kB gz, landing DOM.
- **Newly exposed follow-ups (not this phase):** mobile LCP is the hero
  PARAGRAPH at 93% render-delay — the `[data-m]` reveal only fires `.is-in`
  after hydration, so LCP ≈ hydration; a CSS-only first-viewport reveal
  would collapse LCP toward FCP (ADR-scale, touches reveal choreography).
  `Gateway_v1b.webp` is 835 kB (hero visual) — recompress. TBT burst from
  the async three chunk parse — consider idle/first-scroll deferral on the
  mobile tier.
- Gate: typecheck, ESLint 0 errors / 327 warnings, 242 unit tests, prod
  build, corridor 36/36 + ring 16/16 + arc-cases 8/8 smokes, landing
  eyeballed at 6 depths incl. an early-load frame (hero composed at 700 ms,
  no brandmark flash).

### 2026-07-14 — Phase 2 (security + correctness)

- **Interlude (post-Phase-1, Vince-directed):** no-unused-vars zeroed out via
  rule options + underscore aliases (`b077fbf`, 346 → 327 warnings), the two
  remaining showcase dupes dropped (`ebbe433`), and the corridor smoke suite
  made **fully green (36/36)** — the three stale Services tests retired in
  favor of `services-ring-smoke` coverage and the `:102` engagement contract
  reformulated as ON/OFF legs after empirically mapping the band across
  viewports (`c06fef1`, `1d2f967`); the file is serialized against WebGL
  context starvation.
- **BYPASS_AUTH closed** (`885c5fa`): astrogation's hardcoded `true` is now
  `NODE_ENV === "development"` (compile-time-inlined). Verified both ways
  with a Playwright drive: the `.next-verify` production build served on
  :3013 redirects sessionless `/astrogation` to the `/admin` Credential
  Terminal with zero tool nodes mounted; dev keeps the bypass branch.
- **RLS review** (`a7c2718`): ADR-037 documents the trust boundary —
  public reads on landing content are intentional; every
  "any-authenticated-can-write" policy is a gap-if-signups-open;
  `brandmark_presets` anon INSERT is a constrained lab feature; the
  `useTemplates` client write is RLS-safe (`auth.uid() = user_id`).
  Staged (NOT applied): `DRAFT-20260714_tighten_admin_write_policies.sql`
  with an `is_admin()` JWT-email check. Two owner actions pending.
- **Effect cleanup** (`b991a2c`, `3f2a3f4`): CelestialConnector's reveal
  observer now disconnects via React 19 ref cleanup (real leak); the four
  `onCreated` webglcontext listener pairs documented as element-lifetime
  (intentional); useBrandmarkJourney/useRevealMotion verified false
  positives.
- **SSR guards** (`e66c0a7`): ServicesCardRing veil/glow texture bakes
  guard `document`; NavigationCockpitV2 confirmed internal-only (Phase-5
  deletion candidate).
- **Impure state updaters** (`e4f3bd0`): ParticleConfigContext's ten
  update callbacks now schedule the debounced autosave AFTER commit
  instead of inside `setConfig` updaters. The seven flagged production
  components (ServicesStage, HudNav, TerminalReveal, Tree,
  ServicesPlateCluster, IntelligenceArtifactScene, AuthProvider) were
  read individually: none contains a `setState(fn)`-nested side effect —
  the rule's callback-shape heuristic misfires on sibling setStates in
  ordinary event/subscription handlers. Left as-is by design.
- **no-eval P0**: `new Function(code)` in `legacy/canvas/ThreeBackground`
  — archived, unimported, build-excluded; Phase-5 deletion candidate.
- Gate: typecheck, ESLint 0 errors (327 warnings), 242 unit tests,
  production build, corridor smokes 36/36, landing eyeballed at 10 scroll
  depths, bundle unchanged at 449.8 kB gzip.

### 2026-07-14 — Phase 1 (zero-risk hygiene: delete-only + trivial)

- **Orphans deleted** (all verified zero-reference; owner decision: delete
  outright, git history is the archive): the v7 landing twins
  (`LandingV7`/`V7Landing`/`prototypeRuntime`), the traveling-orbits cluster,
  DepthGatewayScene leftovers (`AstrogationField`, `brandmarkCloud`,
  `CorridorSeamPixelField`, `ServicesCardStack`), lib leftovers
  (`useOrbitDrift`, `ParticleSceneContext`, `useScrollMetrics`),
  `LatentTopographyContours` (+ stale docstring fixed), `HandoffOrbitEmbed`,
  `orbitStyles`, `LoginModal` (auth-checked: no dynamic/string imports),
  `constants/` + the legacy-only constants re-export in `lib/types.ts`, and
  `intelligence-layer/_legacy/` (ADR-014, superseded by ADR-016).
- **Dead deps removed:** 3× `@dnd-kit/*`, 5× `@tiptap/*` (only consumer was
  build-excluded `legacy/`); `@types/sharp` moved to devDependencies.
- **Logging:** the 9 API/hook `console.log` sites now route through
  `lib/logger`; stale "terrace" comment fixed (ADR-036); dead
  `buildDepthTicksHtml` alias deleted.
- **Hygiene:** duplicated showcase assets dropped (sha256-identical to
  `public/project-cards/`); 316 untracked root dev screenshots (~116 MB)
  purged from disk (already ignored by the root `/*.png` pattern).
- **Lint:** `@typescript-eslint/no-unused-vars` burned down 128 → 19 across
  59 files; total warnings 470 → 346. The 19 that remain are deliberate
  (rest-sibling prop stripping, uniform fn-family params, exported no-op API)
  and need rule options the config doesn't enable — see the burn-down commit.
- **Gate:** typecheck, ESLint (0 errors), 242 unit tests, production build
  green; corridor smokes byte-identical to the Phase 0 known-red baseline
  (no new reds); landing First Load JS unchanged at 449.8 kB gzip (≤ baseline).
- Commits: `a2ae117`, `f8b8f79`, `206c560`, `c47fb6b` (orphan clusters),
  `d5a23c6` (needs-verification), `7ce66e4` (deps), `aca6f2c` (logging),
  `7ae7474` (hygiene), `c6d79a8` (lint), plus this ledger entry.

### 2026-07-14 — Phase 0 (cleanup plan kickoff)

- **Worktrees pruned:** 6 in-repo + 1 external git worktree removed (~2.6 GB
  freed); 3 merged branches deleted.
- **Guardrail added:** env-gated `NEXT_DIST_DIR` in `next.config.mjs` so
  verification/analyze builds can target `.next-verify` without clobbering a
  running dev server's `.next`. `.next-verify` / `.next-build` added to
  `.gitignore`; matching generated-type globs added to `tsconfig.json` so an
  alternate-distDir build does not auto-rewrite tsconfig. Default behavior is
  byte-identical when the env var is unset; nothing product-visible changed.
- **Baselines captured** in [`baselines/2026-07-14-phase0/`](baselines/2026-07-14-phase0/):
  bundle (landing First Load JS 449.8 kB gzip; three.js core 166.5 kB gzip),
  ESLint (0 errors / 470 warnings), react-doctor 0.7.7 (true post-prune score
  **30/100**, up from the worktree-polluted 13), Playwright smokes (87 pass /
  13 fail / 32 skip), Lighthouse (desktop 99 / mobile 73; mobile LCP 8.2 s).
- **Known-red baseline widened after warm-server verification:** the corridor
  suite reproduces the identical 13 failures against a freshly started,
  pre-warmed dev server, so the reds are not a cold-server artifact. The
  known-red set is the Services-hologram cluster (`:176`/`:203`/`:233` — stale
  tests asserting markup retired by the ADR-029/030/033 Services reworks) plus
  a deterministic iphone-14-only red at `:102`. See
  [`baselines/2026-07-14-phase0/playwright-smokes.md`](baselines/2026-07-14-phase0/playwright-smokes.md).
- Commits: `cca26d7` (guardrail), `489a842` (baselines), and this ledger entry.

---

## Quick links

- Patterns: [BEST-PRACTICES.md](BEST-PRACTICES.md)
- Decisions: [decisions/README.md](decisions/README.md)
- Vocabulary: [LANGUAGE.md](../LANGUAGE.md)
- Root project memory: [CLAUDE.md](../CLAUDE.md)
