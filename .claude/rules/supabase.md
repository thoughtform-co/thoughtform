---
paths:
  - "supabase/**"
  - "lib/celestial/**"
description: Migrations, RLS, and celestial data access
---

# Rule: Supabase & celestial

Migrations are **append-only** with timestamp names; RLS must stay aligned with client access patterns.

**Read first**

- [CLAUDE.md](../CLAUDE.md) — migration naming, route groups
- `supabase/schema.sql`, `supabase/auth-rls.sql` — source of truth for policies
- Skill: `stack-security-preflight` (if available in your environment) for RLS/auth posture

**Process:** [sentinel/MAINTENANCE.md](../sentinel/MAINTENANCE.md) — schema or policy changes almost always warrant an ADR note or pattern in [BEST-PRACTICES](../sentinel/BEST-PRACTICES.md).
