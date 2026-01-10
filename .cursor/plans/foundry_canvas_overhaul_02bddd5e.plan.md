---
name: Foundry canvas overhaul
overview: Phase 1 ships a Figma-like multi-mockup Foundry canvas with autosave and templates-only left panel. Later phases add Vault insertion, then a universal right-click Assistant (Opus 4.5) with fast chat history, and finally a best-practice Design Agent (Agent SDK + RAG over Survey + repo) that can safely edit Foundry items without flooding context.
todos:
  - id: schema-foundry-docs
    content: Create Supabase migration(s) for foundry_documents + foundry_templates with per-user RLS.
    status: completed
  - id: state-foundry-canvas
    content: Extend astrogationReducer with foundry canvas document + actions (add/select/move/resize/delete/viewport).
    status: completed
  - id: ui-foundry-canvas
    content: Implement FoundryCanvas (multi-item DOM canvas with pan/zoom + drag/resize + keyboard shortcuts).
    status: completed
  - id: persist-foundry-canvas
    content: Load/autosave foundry_documents in app/astrogation/page.tsx (Supabase + localStorage fallback).
    status: completed
  - id: ui-foundry-templates-panel
    content: Replace Foundry left panel with FoundryTemplatesPanel + create/save draft templates flow.
    status: completed
---

## Phase 1 (selected): Foundry canvas overhaul (multi-mockup + autosave)

### Goals

- Replace Foundry’s single centered preview with a **multi-mockup canvas** where you can **add / select / drag / resize / duplicate / delete** multiple component instances.
- **Autosave & restore** the Foundry canvas state **per authenticated user** via Supabase (same pattern as `forge_documents` in [`app/astrogation/page.tsx`](app/astrogation/page.tsx)).
- Make the **Foundry left panel templates-only** (draft templates you created/generated), while **Vault remains the approved preset library**.

### Non-goals (for Phase 1)

- Full Figma parity (constraints, autolayout, nested frames, multiplayer).
- The universal Assistant redesign + Agent SDK runtime (we’ll stage this in later phases, but Phase 1 lays the canvas interaction model the Assistant will need).

---

### A) Data model (canvas doc + templates)

- **FoundryCanvasDocument** (persisted per-user):
- `version`
- `viewport`: `{ panX, panY, zoom }`
- `items`: array of `FoundryCanvasItem`
- **FoundryCanvasItem** (a mockup on the canvas):
- `id`
- `name` (user-editable; used in layers list later)
- `componentId` (maps to `app/astrogation/catalog.ts`)
- `props` (per-instance)
- `styleVars` (optional; reuse `StyleConfig.styleVars` pattern)
- `frame`: `{ x, y, w, h, z }` (world coords)
- `locked?: boolean`

- **Foundry templates (drafts)**: a separate persisted list (draft “templates” before Vault approval). Drafts can be created from any selected canvas item.

---

### B) Supabase persistence

Add two new tables (mirrors the proven `forge_documents` pattern in [`supabase/migrations/20260104_forge_documents.sql`](supabase/migrations/20260104_forge_documents.sql)):

- **`foundry_documents`** (per-user, autosave):
- `id uuid PK`, `user_id uuid FK auth.users`, `document jsonb`, `created_at`, `updated_at`
- RLS: `auth.uid() = user_id` for select/insert/update/delete

- **`foundry_templates`** (per-user drafts):
- `id uuid PK`, `user_id uuid FK`, `name text`, `component_key text`, `config jsonb`, `created_at`, `updated_at`
- RLS: `auth.uid() = user_id`

Implementation detail:

- In dev, `BYPASS_AUTH` is currently enabled in [`app/astrogation/page.tsx`](app/astrogation/page.tsx). To keep local dev usable, we’ll **fallback to localStorage** when `user?.id` is missing, then switch to Supabase when auth is re-enabled.

---

### C) UI architecture changes

#### 1) Foundry center: replace `FoundryView` preview with a canvas

- Update [`app/astrogation/_components/FoundryView.tsx`](app/astrogation/_components/FoundryView.tsx):
- Replace current single-preview/variants dock rendering with a new `FoundryCanvas` surface.
- Keep existing “Forge mode” intact (vector editor stays a separate mode).

- Add new component: `app/astrogation/_components/FoundryCanvas.tsx`
- Renders a large relative container with a transform layer for `pan/zoom`.
- Renders `FoundryCanvasItem` components as absolutely positioned nodes.
- Interaction:
- **Click** selects item (drives right-panel inspector)
- **Pointer drag** moves item (snappy; rAF/throttled state updates)
- **Resize handles** resize item (custom handles; consistent with your existing Survey annotation resizing UX in `astrogation.css`)
- **Keyboard**: delete, duplicate, undo/redo using existing utilities

#### 2) Right panel: treat inspector as “selected canvas item editor”

- Update [`app/astrogation/_components/DialsPanel.tsx`](app/astrogation/_components/DialsPanel.tsx):
- No longer assumes there is only one global “selected component”; it edits the **currently selected canvas item**.
- Add actions:
- **Save as Template (Draft)** → writes to `foundry_templates`
- **Save to Vault (Approved)** → keep current `/api/ui-component-presets` flow

#### 3) Left panel: Foundry becomes templates-only

- Update [`app/astrogation/page.tsx`](app/astrogation/page.tsx) left-panel switching:
- `activeTab === "foundry"` → new `FoundryTemplatesPanel`
- `activeTab === "survey"` → existing `SurveyCatalogPanel`
- `activeTab === "vault"` → keep current `CatalogPanel` for now (Phase 2 can make Vault’s left panel asset-focused).

- Add new component: `app/astrogation/_components/FoundryTemplatesPanel.tsx`
- Lists draft templates from `foundry_templates`, grouped by existing catalog categories (so Vault/Foundry/Survey share category vocabulary).
- Empty state: “Create your first template” opens a small picker (reuse existing `Tree` UI from `CatalogPanel.tsx`) to instantiate a default component onto the canvas.

---

### D) State management changes

- Extend [`app/astrogation/_state/astrogationReducer.ts`](app/astrogation/_state/astrogationReducer.ts) with:
- `foundryDocument` (canvas doc)
- `foundrySelectedItemId`
- New actions for:
- add item (from template or default component)
- select item (without resetting to catalog defaults)
- move/resize item
- update selected item props/styleVars
- delete/duplicate item
- viewport pan/zoom

Note: we’ll **avoid** reusing `SELECT_COMPONENT` for selecting an existing canvas item, because it currently resets props to defaults.

---

### E) Autosave implementation (client-side like Forge)

- In [`app/astrogation/page.tsx`](app/astrogation/page.tsx):
- Load latest `foundry_documents` for `user.id` on mount.
- Debounced save (≈300–500ms) on any document mutation.
- LocalStorage fallback if `user.id` missing.

---

### F) Performance/UX requirements (snappy)

- Canvas item components should be `memo`’d; drag/resize should update state via rAF to avoid flooding renders.
- Keep DOM shallow; prefer transforms for pan/zoom.
- Persist in the background; don’t block UI on saves.

---

## Later phases (not Phase 1)

### Phase 2: Vault insertion + panel restructuring (workflow: draft → approve → reuse)

**Why this phase exists**: Phase 1 creates the playground. Phase 2 makes it _productive_: you can pull “approved” assets from Vault into the playground, and you can promote successful playground results into Vault without losing category structure.

#### A) Vault “Insert” into Foundry canvas (approved assets → editable instances)

- **New affordance in Foundry UI**:
- Add a **Vault** button in Foundry (right-panel header toolbar and/or a canvas header).
- This opens a focus overlay (reuse ADR-006 focus overlay pattern in `sentinel/decisions/006-focus-overlay-system.md`) listing Vault items.
- **Vault picker UX**:
- Fast list load (server returns lightweight rows + last-updated ordering).
- Filter by category/component (reuse the same category vocabulary you already use across Survey).
- Insert behaviors:
- **Click** → inserts as new canvas item (with preset config applied).
- **Drag** (optional) → drag from picker into canvas to place at drop location.
- **What gets inserted**:
- For now, insert `ui_component_presets` (approved) as canvas items with:
- `componentId = preset.component_key`
- `props/styleVars` from `preset.config` (already storing `__style` today).
- If we introduce “Vault assets” beyond presets later (images, vectors), they become additional insert types.

**Likely files**:

- UI: [`app/astrogation/_components/FoundryView.tsx`](app/astrogation/_components/FoundryView.tsx), new `FoundryVaultInsertOverlay.tsx`
- Data: reuse existing preset API: [`app/api/ui-component-presets/route.ts`](app/api/ui-component-presets/route.ts)
- Styling: [`app/astrogation/astrogation.css`](app/astrogation/astrogation.css) + ADR-006 utility classes if we promote them

#### B) Make Vault tab “approved library” (not a component catalog)

Right now Vault view shows saved presets and the left panel is still the brand catalog. Phase 2 makes Vault feel like a _library_:

- **New left panel for Vault**:
- Replace `CatalogPanel` with a `VaultLibraryPanel` when `activeTab === "vault"`.
- It lists **approved presets** grouped by:
- Category → Component → Preset
- Add search by name/tags.
- **Vault view remains preview-centric**:
- Keep the existing Vault preview behavior, but add an “Insert into Foundry” action from Vault too.

#### C) Foundry left panel remains templates-only (drafts)

Phase 1 introduces `foundry_templates`. Phase 2 makes it feel intentional:

- **Templates are “draft building blocks”**:
- Create template from:
- selected canvas item
- assistant-generated suggestion (Phase 3+)
- Insert template creates a new editable canvas item (not “approved”).
- **Promotion flow**:
- “Promote to Vault” is a deliberate action from the right panel:
- saves to `ui_component_presets`
- optionally deletes/archives the draft template to keep signal high

#### D) Upgrade the Foundry inspector (right panel) beyond current dials (still not “Figma”)

Move the “editing capabilities” you mentioned into a structured sectioned inspector:

- **Selection**: show current selected item name + component type + dimensions (w/h) + z-index.
- **Layout**: x/y/w/h controls + lock toggle + bring forward/back.
- **Component props**: keep current dials, but now scoped to selected item.
- **Style layer**: expose `styleVars` (already used by `ComponentPreview` wrapper) as a controlled set of tokens (not arbitrary CSS).
- **Actions**: duplicate / delete / save draft template / promote to vault.

---

### Phase 3: Universal Assistant redesign (UI + persistence + “apply to canvas”)

**Why this phase exists**: you want the assistant to be “persistent and universal,” not only in Foundry inspector; and you want it to be fast, logged, and able to switch tasks.

#### A) UI entrypoint: right-click → Assistant (Astrogation-wide)

- Remove the existing Foundry-only button (today it’s `FoundryAssistantDock` with `<button class=\"foundry-assistant-btn\">`).
- Add a custom context menu on the Astrogation root:
- On `contextmenu` anywhere in `app/astrogation/page.tsx`, open a Thoughtform-styled menu panel.
- Menu actions (initial):
- **Assistant**
- (optional) **Insert from Vault** (Phase 2 action, nice synergy)
- (optional) **Create Template from Selection**

#### B) Assistant overlay: semi-transparent, snappy, task-aware

- **Overlay design**:
- Semi-transparent “HUD glass” panel with subtle blur and gold/dawn lines.
- Uses the same focus overlay language (ADR-006), but with a chat layout.
- Responsive: desktop = right-side overlay; mobile = bottom sheet.
- **Core UX requirements**:
- Streaming responses (first token quickly).
- Conversation list loads fast (pagination + cached summaries).
- “New chat” is instant and doesn’t wait for server roundtrip.
- Switching chats is instant (optimistic render + background fetch).

#### C) Conversations persistence (Supabase, per-user, fast list)

Add two tables (per-user RLS like `forge_documents`):

- **`assistant_conversations`**
- `id`, `user_id`, `title`, `workspace` (e.g. `astrogation`), `active_task` (e.g. `design`, `foundry-edit`), `created_at`, `updated_at`
- denormalized `last_message_preview` + `last_message_at` for fast sidebar list
- optional `summary` (rolling memory) + `pinned_context` (jsonb of IDs: survey refs, component ids)
- **`assistant_messages`**
- `id`, `conversation_id`, `role`, `content`, `created_at`
- optional `tool_result`/`tool_call` JSON for agent operations later

UI + API:

- `GET /api/assistant/conversations` (list, lightweight)
- `POST /api/assistant/conversations` (new)
- `GET /api/assistant/conversations/:id` (messages, paginated)
- `POST /api/assistant/messages` (send; streaming)

#### D) Model selection + speed strategy (Opus 4.5 default, best-practice fallback)

User-visible chat defaults to **Claude Opus 4.5** (per your requirement, see Anthropic docs: [`Agent SDK overview`](https://platform.claude.com/docs/en/agent-sdk/overview), [`API overview`](https://platform.claude.com/docs/en/api/overview), [`Choosing a model`](https://platform.claude.com/docs/en/about-claude/models/choosing-a-model)).

For snappiness and cost control, we’ll still design the system to allow:

- “fast mode” (Haiku/Sonnet) for lightweight tasks (naming, summarizing, simple prop tweaks)
- Opus for deep design reasoning and multi-step canvas edits

This is implemented as a server-side policy: model chosen by task type + complexity + whether tools are needed.

#### E) “Apply to canvas” contract (assistant can safely edit selected items)

This is where Phase 3 connects to Phase 1:

- The assistant response can include a structured “proposal” payload (no arbitrary code):
- `operations: Array<...>` such as:
- `updateItemProps({ itemId, patch })`
- `updateItemStyleVars({ itemId, patch })`
- `duplicateItem({ itemId })`
- `deleteItem({ itemId })`
- `createTemplateFromItem({ itemId, name })`
- `promoteItemToVault({ itemId, name })`
- UI renders these as “Apply” buttons/cards (never auto-applies).
- The assistant always receives a minimal “selection snapshot”:
- selected item(s) ids, component ids, current props/styleVars, and brief names.
- never the entire canvas doc unless requested.

**Reuse existing patterns**:

- The existing Foundry assistant route already implements:
- Survey embedding retrieval
- StyleSpace mixing into CSS variables
- prop-schema validation
- patch extraction
  See: [`app/api/foundry/chat/route.ts`](app/api/foundry/chat/route.ts)

Phase 3 consolidates this into a universal assistant API and removes the Foundry-only dock UI.

---

### Phase 4: Design Agent (Agent SDK + best-practice context management, no context flooding)

**Why this phase exists**: you want Cursor-like repo understanding, but with strict context budgets and Survey-aware retrieval. This is an _agent_ problem, not “a bigger system prompt.”

#### A) Agent roles (two-layer prompt strategy)

- **Base persona (stable)**: “Experienced UI/UX + Brand designer for Thoughtform”:
- teaches evergreen principles (grid, hierarchy, spacing rhythm)
- deeply aligned with Thoughtform’s retrofuturistic/navigation motifs
- explicitly avoids generic “AI slop” patterns
- uses your existing patterns and tokens (gold/dawn/void, brackets, chamfers, labels)
- incorporates the intent of `.claude/skills/frontend-design/*` as grounding (not literally the tool)
- **Task adapters (dynamic)**:
- `FoundryEditorAgent`: produce safe canvas operations
- `ComponentDesignerAgent`: propose new components using existing registry/catalog conventions
- `SurveySynthesizerAgent`: summarize relevant Survey references + motifs without dumping raw data

#### B) Retrieval architecture (RAG) with strict budgets

We’ll treat your context sources as separate searchable indexes and only pull what’s needed:

- **Survey RAG (already exists)**:
- Use existing RPC search (`match_survey_items_briefing`, `match_survey_items_full`) via the server routes (see [`app/api/survey/search/route.ts`](app/api/survey/search/route.ts)).
- Prefer “briefing space” for clean retrieval; use “full space” only when needed.
- For segmentation, add segment-level retrieval (new RPC + table usage) so we can fetch a small set of relevant segments, not whole items.
- Use StyleSignatures (already present) to give the agent compact, actionable style parameters instead of verbose prose.

- **Design system grounding**:
- Use the component catalog’s `designRationale/inspiration/frontendNotes` as the primary design memory:
- [`app/astrogation/catalog.ts`](app/astrogation/catalog.ts)
- Include sentinel ADRs when relevant (e.g. focus overlay rules):
- `sentinel/decisions/*`

- **Repo knowledge without flooding**:
- Build a “repo index” that the agent can query:
- `repo_chunks` table with embeddings for key design/UI files (components, tokens, styles, docs)
- store chunk hashes so indexing is incremental
- Retrieval returns top-k chunks, then the agent summarizes them into a small “working memory” that gets injected (not raw chunks).

#### C) Agent SDK integration (how we’ll actually use it)

The Agent SDK (Claude Code as a library) is ideal for multi-step tasks with tool use. We’ll use it where it makes sense:

- **In-app agent (production-safe)**:
- Use Claude API tool calling with a _strict_ tool set that maps to your domain:
- `searchSurvey`, `getSurveyItem`, `getSurveySegments`
- `getComponentSchema` (from catalog)
- `proposeFoundryOperations` (validated)
- This avoids giving the model raw filesystem access in production.

- **Repo-aware dev agent (Cursor-like, for you as a builder)**:
- Run an Agent SDK service in a controlled environment with repo access.
- Tools allowed: read/search files, generate components, propose PR-ready patches.
- Output: suggested diffs + component files + updated registry entries.

This split is “best practice”: production assistant stays safe and fast; dev agent can be powerful and repo-aware without leaking secrets or blowing context.

#### D) Context budgeting + memory management (the “don’t flood the window” part)

- **Rolling summary** per conversation:
- every N turns, summarize into ~300–600 tokens and store in `assistant_conversations.summary`
- keep only last ~10 raw messages + summary when sending to model
- **Pinned context**:
- store IDs of pinned Survey items/segments, selected components, and active design goals
- retrieval uses these pins before doing broad search
- **Hard budgets** enforced server-side:
- max retrieved Survey refs per turn (e.g. 5)
- max segments per ref (e.g. 8)
- max repo chunks (e.g. 6)
- token counter gate before the final model call

#### E) “Assistant can modify off-the-shelf components” (storybook/shadcn/mcp-ui strategy)

This is where we stop “building from scratch” and let the assistant _compose and adapt_:

- **Shadcn-first component sourcing**:
- Keep Thoughtform styling tokens, but leverage shadcn building blocks under the hood.
- Add a “Source” section in the right panel for a selected item:
- shows whether it came from `registry/thoughtform`, shadcn primitive, or a custom component
- lets you swap baseline variants (e.g. button/input/layout blocks)

- **Storybook as the canonical component workshop (dev-time)**:
- Set up Storybook for `packages/ui` + `components/ui` so every component has stories and args.
- Foundry templates can reference “story args” as a structured prop schema.
- The agent can propose arg changes (safe, typed) rather than open-ended edits.
- Reference: [`storybookjs/storybook`](https://github.com/storybookjs/storybook)

- **mcp-ui as a future “interactive agent response” layer (optional)**:
- Allow the agent to return a UI resource representing a proposed component variant (with Apply buttons).
- This can make assistant responses feel like “design cards,” not just text.
- Reference: [`mcp-ui`](https://github.com/MCP-UI-Org/mcp-ui)

- **shadcn MCP server (developer workflow helper, optional)**:
- Use shadcn MCP in Cursor/Claude to quickly install blocks/components into the repo during iteration.
- Reference: [`shadcn MCP docs`](https://ui.shadcn.com/docs/mcp)

---

## Test plan (Phase 1)

- Add 5–10 items, drag/resize rapidly; confirm smoothness.
- Reload page: canvas restores.
- Switch tabs: state remains.
- Save as Template → appears in Foundry left panel; click to add instance.
- Save to Vault → appears in Vault view; double-click loads into Foundry.
