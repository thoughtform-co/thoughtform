# Claude Code / local hooks

This repo’s **pre-edit path hints** live in a single script used by **Cursor** (`preToolUse` → `node scripts/sentinel-pre-edit-hint.mjs`). See [`.cursor/hooks.json`](../.cursor/hooks.json).

**Manual run** before editing a risky file:

```bash
# Pipe a JSON blob that contains the target path, or for a quick self-check:
node -e "console.log(JSON.stringify({ tool: { name: 'Write', input: { file_path: 'components/landing/v7/LandingPage.tsx' } } }))" | node scripts/sentinel-pre-edit-hint.mjs
```

**Claude Code:** if your environment supports pre-edit hooks, point them at the same `scripts/sentinel-pre-edit-hint.mjs` so path-scoped rules are echoed before writes.

**Process reference:** [sentinel/MAINTENANCE.md](../sentinel/MAINTENANCE.md)
