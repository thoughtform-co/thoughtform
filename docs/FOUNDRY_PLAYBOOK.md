# Foundry Playbook (Astrogation)

This document explains how Foundry is intended to work in this repo: **real TS/Next.js components → editable instances → on-brand assets**.

## The “component spine” (what’s canonical)

- **Canonical runtime components** live in `registry/thoughtform/*`
  - Example: `registry/thoughtform/ui/button.tsx`, `registry/thoughtform/cards/card-frame.tsx`
- **Foundry canvas items** reference those components via:
  - `source: "registry" | "legacyPreview"`
  - `registryKey` (e.g. `button`, `card-frame`, `navigation-bar`)
  - `args` (Storybook-style props object; persisted)
  - `styleVars` (optional; persisted CSS vars for theming)

## How Foundry editing works (today)

- **Select an item on the canvas** → the right panel shows its inspector.
- **Edit args in the inspector** → updates the selected item live on the canvas.
- **Interact directly with components** (e.g. toggle / slider / select):
  - These interactions update the selected canvas item’s `args` (and autosave).

Key files:

- Canvas rendering + interaction: `app/astrogation/_components/FoundryCanvas.tsx`
- Inspector: `app/astrogation/_components/DialsPanel.tsx`
- State/actions: `app/astrogation/_state/astrogationReducer.ts`
- Page wiring + autosave: `app/astrogation/page.tsx`

## Assistant + “mcp-ui”

You will **not** see “mcp-ui” as an MCP server in Cursor.

- **mcp-ui** is treated as an _interaction payload concept_ (proposal cards + explicit Apply).
- In this repo we render that natively via **Design Cards**:
  - `app/astrogation/_components/DesignCard.tsx`
  - The assistant chat hook can embed proposals:
    - `app/astrogation/_hooks/useAssistantChat.ts`

## MCP servers (why you don’t see “shadcn” / “ui-mcp”)

In Cursor’s MCP list you’ll only see **servers that are installed + enabled** locally.

- **shadcn MCP** is optional (dev-time convenience). It is not currently configured in this repo.
  - Docs: `https://ui.shadcn.com/docs/mcp`
  - Expected config (create this locally):

```json
{
  "mcpServers": {
    "shadcn": {
      "command": "npx",
      "args": ["shadcn@latest", "mcp"]
    }
  }
}
```

Place it at `.cursor/mcp.json`, then enable it in Cursor → **Tools & MCP**.

- **“UI-MCP”**: not currently installed/configured as an MCP server in this workspace.
  - What we _do_ have is the `thoughtform` MCP server (custom), plus `context7` + `playwright`.

## The “Playbook”

The practical playbook for Foundry is:

- `.cursor/plans/foundry_canvas_overhaul_02bddd5e.plan.md`
- `.cursor/plans/foundry_next_phases_consolidation_83fb73cb.plan.md`

These define the intended workflow and guardrails: registry is canonical, args are the editable surface, Vault is the approved library, and assistant proposals are explicit + reversible.
