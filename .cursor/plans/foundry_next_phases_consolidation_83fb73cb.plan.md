---
name: Foundry next phases consolidation
overview: "Consolidate Phases 2–4 around a single component spine: shadcn registry as canonical implementation, Storybook stories/args as canonical schema, Foundry as composition canvas, Vault as approved library, and Assistant+mcp-ui as the interactive change layer (no duplicate schemas or competing component sources)."
todos:
  - id: phase2-render-registry
    content: Refactor Foundry items to render registry components (introduce ComponentSource + args-based items).
    status: pending
  - id: phase2-storybook-schema
    content: Set up Storybook and StoryIndex; generate Foundry inspector from argTypes/args.
    status: pending
  - id: phase2-vault-insert
    content: Implement Vault insert overlay + Vault-as-library left panel; translate presets into args-based items.
    status: pending
  - id: phase2-templates-args
    content: Make templates args-based; implement draft→approve workflow cleanly.
    status: pending
  - id: phase3-universal-assistant
    content: Right-click entry + chat persistence + args-first apply-to-canvas operations.
    status: pending
  - id: phase3-mcp-ui-cards
    content: Implement mcp-ui-compatible “design cards” with previews and Apply actions.
    status: pending
  - id: phase4-agent-sdk-rag
    content: "Design Agent architecture: tool calling, strict RAG budgets, dev-agent integration path."
    status: pending
---

# Foundry phases 2–4 consolidation plan

## Guiding decisions (locked)

- **Canonical implementation**: shadcn-first, `registry/thoughtform/*` is the source of runtime components.
- **Canonical schema**: Storybook stories (`args`/`argTypes`) define the editable surface.
- **Catalog role**: keep [`app/astrogation/catalog.ts`](app/astrogation/catalog.ts) as taxonomy + design memory + pointers (e.g. `registryName`/`storyId`), and gradually remove duplicate “prop schema as truth.”

## Why consolidate

Today the system risks drift in two places:

- **Two implementations** of “Thoughtform UI” (`packages/ui` vs `registry/thoughtform`) with overlapping components (e.g. Buttons). We will converge on **registry**.
- **Two schemas** for what is editable (catalog prop defs vs the “real” component). We will converge on **Storybook args/argTypes**.

This consolidation directly supports the “off-the-shelf components” strategy: build and tune components in Storybook using shadcn/Tailwind primitives, then assemble in Foundry; the Assistant operates on args patches and can render interactive proposal cards.

## Phase 2 (consolidated): Component Workbench + Vault insertion

### 2.1 Make Foundry render real components from the registry

- Replace the remaining reliance on the switch-based preview renderer for Foundry items (currently [`app/astrogation/_components/previews/ComponentPreview.tsx`](app/astrogation/_components/previews/ComponentPreview.tsx)) with a **registry component map**.
- Introduce a `ComponentSource` model:
- `source: "registry" | "legacyPreview"` (start with `registry` for most UI; keep `legacyPreview` only for brand elements and any hard-to-port preview-only items).
- `key`: registry component name (e.g. `button`, `card-frame`, `navigation-bar`).
- `args`: Storybook args object.
- FoundryCanvas items evolve from `{ componentId, props }` to `{ source, key, args, styleVars, frame }`.

**Files likely touched**:

- [`app/astrogation/_components/FoundryCanvas.tsx`](app/astrogation/_components/FoundryCanvas.tsx)
- [`app/astrogation/_components/previews/ComponentPreview.tsx`](app/astrogation/_components/previews/ComponentPreview.tsx)
- `registry/thoughtform/*` (ensure exports are stable)

### 2.2 Storybook becomes the canonical “editable schema”

- Add Storybook configuration (new `.storybook/` folder) and define stories for:
- Thoughtform registry components (`registry/thoughtform/*`).
- A small curated set of shadcn “building blocks” we want to use heavily.
- Create a lightweight **StoryIndex** module inside the repo that can be used by Foundry at runtime:
- Exports `listComponents()`, `getArgTypes(storyId)`, `getDefaultArgs(storyId)`.
- This avoids coupling Foundry runtime to Storybook runtime.

**Key principle**: Foundry inspector UI is generated from `argTypes` (single truth), and the Assistant only proposes patches against this schema.

### 2.3 Vault insertion overlay (approved → insert into Foundry)

- Implement the Vault picker overlay described in Phase 2A of the existing plan:
- Uses existing preset API [`app/api/ui-component-presets/route.ts`](app/api/ui-component-presets/route.ts)
- Inserts a new canvas item by translating preset config into `args/styleVars`.
- Restructure Vault left panel into an “approved library” view (Phase 2B).

### 2.4 Templates (drafts) are args-based and promote cleanly

- Update `foundry_templates.config` semantics to store:
- `storyId` (or `registryName`) + `args` + `styleVars`
- (optional) thumbnail
- Update the Foundry right panel actions:
- **Save as Template (Draft)** writes a draft template.
- **Promote to Vault** writes a `ui_component_preset` (approved).

## Phase 3 (consolidated): Universal Assistant + mcp-ui “design cards”

### 3.1 Universal entry + chat persistence

- Remove Foundry-only entry UI (`FoundryAssistantDock`) and replace with right-click → Assistant entry on the Astrogation root.
- Add `assistant_conversations` + `assistant_messages` tables and fast list APIs.

### 3.2 Assistant “apply to canvas” contract becomes args-first

- Operations should target:
- `updateItemArgs({ itemId, patch })`
- `updateItemStyleVars({ itemId, patch })`
- `swapComponent({ itemId, storyId })`
- `duplicate/delete/createTemplate/promoteToVault`
- Server validates operations by checking:
- `patch` keys exist in Storybook `argTypes` (or are explicitly allowed)
- values pass basic type/enum checks

### 3.3 mcp-ui is treated as the interaction layer (minimal, non-bloat)

- Implement “design cards” in the Assistant UI that preview changes and have explicit Apply buttons.
- Structure the payload to be compatible with mcp-ui concepts (UI resources + actions), even if initial implementation is an in-app renderer.

## Phase 4 (consolidated): Design Agent (Agent SDK + strict RAG budgets)

### 4.1 Keep production safe, keep dev powerful

- In-app Assistant: strict toolset + schema validation (no filesystem access).
- Dev agent (Agent SDK): repo-aware patch generation and registry updates.

### 4.2 Retrieval focus

- Survey RAG stays as the inspiration engine.
- Design system grounding: catalog rationale + ADRs.
- Repo indexing: only if needed, and always summarized before injection.

## De-duplication / deprecation rules (to prevent drift)

- No new prop schemas should be added to `catalog.ts` once Storybook argTypes exist.
- When a registry component gains/changes a prop, update the Storybook story (schema) in the same PR.
- `packages/ui` should not introduce overlapping “app-level” components if registry is canonical; it should trend toward tokens/primitives.

## Test plan (for consolidated Phase 2/3)

- Add a registry-backed component to Foundry and verify the inspector is generated from argTypes.
- Save as template → reinsert → args match.
- Promote to Vault → insert approved preset → args/styleVars match.
- Assistant proposes an args patch card → apply → item updates and autosaves.
