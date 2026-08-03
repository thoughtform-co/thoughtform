# ADR-037: Supabase RLS trust boundary â€” "authenticated" is not "admin"

**Status:** Proposed (needs two owner actions â€” see Decision)
**Date:** 2026-07-14
**Context:** Phase 2 security pass of the cleanup plan (file-level review; live
policies not queried â€” no Supabase CLI wiring in this environment).

## Context

The app's admin model is **single allowlisted admin**: client components check
`isAllowedUserEmail` (`NEXT_PUBLIC_ALLOWED_EMAIL`), the `(admin)` layout
redirects unauthenticated visitors, and API routes enforce the same allowlist
server-side via `lib/auth-server.ts` `isAuthorized()` (Bearer token â†’ Supabase
user â†’ email allowlist).

The **database policies do not encode that model**. Most write policies grant
`to authenticated ... (true)` â€” i.e. _any_ Supabase account, not the one
admin. The DB is reachable directly with the public anon key, bypassing every
app-layer check. Whether this is exploitable hinges on one dashboard setting:
**are public signups (email/magic-link) enabled on the Supabase project?**
The login shell (`CelestialAuthShell`) exposes a magic-link flow, so if
signups are open, any visitor can mint an `authenticated` session and write
directly to the tables below.

## Findings

### Correct per-user model (the pattern to copy)

- `foundry_documents`, `foundry_templates` (20260110): every op checks
  `auth.uid() = user_id`. The flagged client-side write in
  `useTemplates.ts` (`saveAsTemplate` inserts `user_id` from the client) is
  **safe**: RLS rejects a mismatched `user_id`. `promoteToVault` correctly
  goes through `/api/ui-component-presets` with a Bearer token (server-side
  allowlist). **No code change needed.**

### Intentional public READ (landing content â€” keep)

`shape_presets`, `manifesto_voices`, `service_sigils`, `celestial_designs`,
`celestial_slots`, `particle_config`, and the legacy `pages` / `sections` /
`elements` / `design_log`: public `SELECT (true)` is deliberate â€” the landing
page renders from these anonymously. **Keep all public-read policies.**

### Gap class A â€” any-authenticated WRITE on admin-owned content

| Table                                                 | Where                                                                   | Write policy                                              |
| ----------------------------------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------- |
| `pages`, `sections`, `elements`, `design_log`         | `auth-rls.sql`                                                          | any authenticated, `(true)`                               |
| `particle_config` (shared `default` row)              | `auth-rls.sql`                                                          | any authenticated may write the row the live site renders |
| `shape_presets`, `manifesto_voices`, `service_sigils` | `20251231_enable_rls_on_public_tables.sql`                              | any authenticated, `(true)`                               |
| `celestial_designs`, `celestial_slots`                | `20260421_celestial_connectors.sql`                                     | any authenticated, `(true)`                               |
| `ui_component_presets`                                | `20251229_ui_component_presets.sql` (comment says "admin only for now") | any authenticated, `(true)`                               |
| `survey_items`                                        | `20260101_survey_items.sql`                                             | any authenticated read+write, `(true)`                    |

Under open signups these are **defacement-grade gaps** (e.g. the
`particle_config.default` row and `celestial_slots` drive live landing
visuals). Under closed signups they are acceptable but fragile â€” one
dashboard toggle away from open.

Same pattern likely applies to the unflagged survey satellites
(`survey_annotations`, `survey_segments`, `survey_collections`,
`survey_style_signatures`, `assistant_chat`, `forge_documents` uses
per-user) â€” sweep them when applying the fix.

Note: `pages`/`sections`/`elements`/`design_log` are **legacy page-editor
tables**; the only code touching them is `lib/queries.ts`, which nothing
imports (editor archived per ADR-004). Candidate for dropping outright in a
later phase instead of tightening.

### Gap class B â€” anonymous INSERT

`brandmark_presets` (20260622): `anon INSERT ... WITH CHECK (true)` +
`anon SELECT`. Deliberate share-slug feature for the brandmark labs
(`/test/brandmark-physics-core`, `/test/brandmark-reflective`), with sensible
constraints (slug format, label â‰¤ 120 chars, settings â‰¤ 8 KB, no anon
UPDATE/DELETE). The lab routes are blocked in production by `proxy.ts`,
**but the DB endpoint itself is publicly writable with the anon key** â€”
an unauthenticated junk-insert vector (storage/spam, not takeover).
Acceptable for a lab feature if signup-independent junk is tolerable;
tightening options in the draft migration (commented out).

## Decision (proposed)

1. **Owner action 1 (dashboard, cannot be verified from the repo):** confirm
   Supabase Auth signups are DISABLED (or invite-only). This is the single
   setting the whole "authenticated = admin" assumption rests on.
2. **Owner action 2 (apply when ready):** the draft migration
   `supabase/migrations/DRAFT-20260714_tighten_admin_write_policies.sql`
   replaces every class-A `(true)` write check with an `is_admin()` JWT-email
   check (public reads untouched). It is committed with a `DRAFT-` prefix and
   a guard header so it cannot be applied accidentally; fill in the admin
   email and rename (strip `DRAFT-`) to apply. Optional class-B tightening is
   included commented-out.
3. `useTemplates.ts` stays as-is (RLS-safe); prefer the
   `foundry_documents`/`foundry_templates` per-user pattern for new tables.

## Consequences

- No live behavior changes from this ADR alone â€” it documents and stages.
- After applying: admin tools keep working (the admin's JWT carries the
  allowlisted email); any other authenticated account loses write access at
  the DB layer, closing the gap regardless of the signups toggle.
