# Linear Issues Tracking

This folder contains issue documentation for the Thoughtform.co website repository. It follows a consistent format used across all Thoughtform repositories (Atlas, Ledger, Astrolabe, etc.).

## Purpose

This system serves as a **persistent issue memory** that:

1. **Survives context windows** - AI assistants can pick up where previous sessions left off
2. **Documents failed attempts** - Prevents re-trying approaches that didn't work
3. **Captures product learning** - Builds institutional knowledge about solutions
4. **Tracks open issues** - Provides visibility into unresolved problems

## Quick Reference

### Issue Prefixes by Repo

| Repo           | Prefix | Example |
| -------------- | ------ | ------- |
| Atlas          | `ATL`  | ATL-001 |
| Ledger         | `LGR`  | LGR-001 |
| Astrolabe      | `AST`  | AST-001 |
| Thoughtform.co | `TFM`  | TFM-001 |
| Brand World    | `BRW`  | BRW-001 |
| Groundtruth    | `GRT`  | GRT-001 |

### Issue Statuses

| Status        | Meaning                               |
| ------------- | ------------------------------------- |
| `OPEN`        | New issue, not yet being worked on    |
| `IN_PROGRESS` | Actively being investigated/fixed     |
| `BLOCKED`     | Cannot proceed without external input |
| `RESOLVED`    | Fixed and verified                    |

### Priority Levels

| Priority   | Criteria                                        |
| ---------- | ----------------------------------------------- |
| `Critical` | System broken, no workaround, affects all users |
| `High`     | Major functionality broken, workaround exists   |
| `Medium`   | Feature degraded but usable                     |
| `Low`      | Minor issue, cosmetic, or nice-to-have          |

## Folder Structure

```
.linear-issues/
├── README.md                           # This file
├── ISSUE_TEMPLATE.md                   # Template for new issues
├── OPEN_ISSUES.md                      # Index of all open issues
├── TFM-001-short-description.md        # Individual issue files
├── TFM-002-components/                 # Folder for issue context
│   ├── relevant-file.tsx              # Copied component for reference
│   └── screenshot.png                 # Visual evidence
└── MILESTONE-feature-name.md          # Collection of related issues
```

## Workflow

### Creating a New Issue

1. Copy `ISSUE_TEMPLATE.md` to a new file: `TFM-XXX-short-description.md`
2. Fill in the Problem section with clear description and user impact
3. Add to `OPEN_ISSUES.md` index
4. If investigation is needed, create a `TFM-XXX-components/` folder

### During Investigation

1. Update `Attempted Solutions` with each approach tried
2. Document why each approach didn't work
3. Update `Status History` table with progress
4. Copy relevant files to the components folder for isolated debugging

### Resolving an Issue

1. Fill in the `Solution` section with full details
2. Update status to `RESOLVED` with date
3. Write `Product Learning` section
4. Remove from `OPEN_ISSUES.md`
5. Delete the components folder if no longer needed

### Creating a Milestone

For large features spanning multiple issues:

1. Create `MILESTONE-feature-name.md`
2. Link all related issues
3. Summarize achievements and learnings
4. Update when all linked issues are resolved

## Best Practices

### Writing Good Issue Titles

```
✓ TFM-010: Hero Section Gateway Not Rendering on Safari iOS
✓ TFM-007: Mobile Navigation Menu Doesn't Close on Link Click
✗ Fix the bug
✗ Scroll issue
```

### Documenting Failed Attempts

Be specific about what was tried and why it failed:

```markdown
### Attempt 1: CSS z-index adjustment

- **What was tried:** Increased z-index from 10 to 9999
- **Why it didn't work:** Issue is not stacking order - the element
  isn't rendering at all due to parent overflow:hidden
- **Files changed:** `components/hud/ThreeGateway.tsx`
- **Commits:** `a1b2c3d`
```

### Capturing Product Learning

Focus on transferable insights:

```markdown
## Product Learning

Mobile scroll behavior differs significantly from desktop. Using
`position: fixed` elements with scroll-based animations requires
careful management of transform properties to prevent layout thrashing.
**The lesson:** Test scroll interactions early on real mobile devices,
not just browser emulation.
```

## Integration with AI Assistants

When asking an AI assistant to work on an issue:

1. Reference the issue file: "See TFM-010 in .linear-issues/"
2. AI can read attempted solutions to avoid repeating them
3. AI should update the issue file with new attempts
4. On resolution, AI should fill in Solution and Product Learning

## Cross-Repo Consistency

All Thoughtform repositories should:

1. Use this same folder structure
2. Use the same template format
3. Use their assigned prefix
4. Reference issues by full ID (e.g., TFM-010, not just 010)

This enables cross-referencing issues between repositories when features span multiple codebases.
