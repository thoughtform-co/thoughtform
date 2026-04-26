---
paths:
  - "legacy/**"
description: Archived code — read-only
---

# Rule: Legacy tree

`legacy/**` is **archived** and excluded from the TypeScript build.

**Read first**

- [ADR-004: Legacy code archival](../sentinel/decisions/004-legacy-code-archival.md)

**Do not** “just fix” imports or move files back without an explicit un-archive decision (new ADR). Prefer **read-only** reference or copy patterns into current `components/` / `lib/`.

**Process:** [sentinel/MAINTENANCE.md](../sentinel/MAINTENANCE.md)
