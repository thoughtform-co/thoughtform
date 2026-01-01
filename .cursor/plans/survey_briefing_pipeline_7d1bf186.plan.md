---
name: Survey briefing pipeline
overview: "Improve Survey UX (annotations + tags + compact fields) and add an AI pipeline: auto visual analysis → description, user notes/annotations → briefing generation, plus dual embeddings (briefing + full context) for relevant semantic retrieval."
todos:
  - id: db-briefing-embeddings
    content: Add description/briefing fields and dual embedding columns + RPCs in Supabase migrations
    status: completed
  - id: api-analyze-description
    content: Extend /api/survey/analyze to return+persist description alongside analysis
    status: completed
    dependencies:
      - db-briefing-embeddings
  - id: api-briefing
    content: Add /api/survey/briefing endpoint with system prompt using analysis+notes+annotations to generate a frontend briefing
    status: completed
    dependencies:
      - db-briefing-embeddings
  - id: api-embed-dual
    content: Update /api/survey/embed to generate and persist both briefing and full-context embeddings
    status: completed
    dependencies:
      - db-briefing-embeddings
  - id: api-search-space
    content: Update /api/survey/search to support space=briefing|full and call the correct match RPC
    status: completed
    dependencies:
      - db-briefing-embeddings
  - id: ui-search-toggle
    content: Add Briefing/Full toggle in SurveyCatalogPanel search bar
    status: completed
    dependencies:
      - api-search-space
  - id: ui-pipeline-loading
    content: Add pipelineStatus state and progress indicators for upload->analyze->brief flow
    status: completed
    dependencies:
      - api-briefing
  - id: optimistic-annotations
    content: Make annotation updates optimistic in app/astrogation/page.tsx for immediate inspector feedback
    status: completed
  - id: ui-annotations-nodes
    content: Improve annotation node UX (auto-open new note, immediate save, delete empty-cancel) in SurveyInspectorPanel (+ optional canvas focus)
    status: completed
    dependencies:
      - optimistic-annotations
  - id: ui-tags
    content: Implement chip-based TagInput with comma/enter commit and wire to survey tags
    status: completed
  - id: ui-layout-compact
    content: Put category+component selects side-by-side and reduce control height/padding
    status: completed
  - id: ui-stale-briefing
    content: Add stale briefing indicator comparing briefing_updated_at vs notes/annotations updated_at
    status: completed
    dependencies:
      - api-briefing
  - id: ui-reanalyze
    content: Add low-emphasis Re-analyze link in description/AI section
    status: completed
    dependencies:
      - api-analyze-description
  - id: styles-survey-fields
    content: Add CSS for TagInput, compact select row, briefing/description sections, stale indicator, search toggle, and annotation node list
    status: completed
    dependencies:
      - ui-tags
      - ui-layout-compact
      - ui-annotations-nodes
      - ui-search-toggle
      - ui-stale-briefing
      - ui-pipeline-loading
---

# Survey UX + Briefing + Dual Embeddings

## Goals

- Make **annotations behave like first-class “nodes”**: draw a frame → immediately get a note field; deleting the note/node deletes the frame.
- Upgrade **tags UX**: comma/enter creates a tag chip; easy remove; no “stringly” comma-joined editing.
- Add an AI pipeline:
- **Auto visual analysis on upload** → populate a new `description` field.
- **Hybrid briefing**: auto-generate an initial frontend briefing after upload+analysis; manual “Regenerate briefing” after notes/annotations edits.
- **Two embeddings**: one for _briefing_ (clean semantic retrieval), one for _full context_ (deep similarity).

## Proposed Data Flow

```mermaid
flowchart TD
  Upload[UploadImage] --> ItemsPost[POST_/api/survey/items]
  ItemsPost --> ItemCreated[DB:survey_items_row]

  ItemCreated --> AutoAnalyze[Client:auto_call_/api/survey/analyze]
  AutoAnalyze --> AnalysisSaved[DB:update_analysis+description]

  AnalysisSaved --> AutoBrief[Client:auto_call_/api/survey/briefing]
  AutoBrief --> BriefSaved[DB:update_briefing]

  NotesAndAnn[UserEditsNotesAnnotations] --> RegenBrief[Client:RegenerateBriefing]
  RegenBrief --> BriefSaved

  BriefSaved --> Embed[POST_/api/survey/embed]
  Embed --> VecBrief[DB:briefing_embedding]
  Embed --> VecFull[DB:full_embedding]

  Search[POST_/api/survey/search(space=briefing|full)] --> MatchRPC[RPC_match_survey_items_(briefing|full)]
  MatchRPC --> Results[Items+SignedURLs]
```

## Implementation Plan

### 1) Database schema + RPCs

- Add new columns to `survey_items`:
- `description text` (AI-generated, user-editable)
- `briefing text` (AI-generated, user-editable)
- `briefing_updated_at timestamptz` (optional but useful for “stale” UI hints)
- Add **dual embeddings**:
- Keep existing `embedding`/`embedding_model`/`embedding_text` as the **full-context** vector (backwards compatible)
- Add:
  - `briefing_embedding vector(1024)`
  - `briefing_embedding_model text`
  - `briefing_embedding_text text`
- Add/extend RPCs:
- `update_survey_embedding_briefing(...)` (parallel to existing `update_survey_embedding`)
- `match_survey_items_briefing(...)` (same signature as `match_survey_items`, but uses `briefing_embedding`)
- (Optional) `match_survey_items_full(...)` if we later want to stop using the legacy `match_survey_items` name
- Files:
- [`supabase/migrations/*_survey_briefing_and_embeddings.sql`](supabase/migrations/)

### 2) API routes

- **Visual analysis**: extend analysis output to include `description` and persist it.
- Update [`app/api/survey/analyze/route.ts`](app/api/survey/analyze/route.ts):
  - Extend JSON schema to include `description` (1–3 short paragraphs describing what’s visible + what’s salient).
  - Update DB with both `analysis` and `description`.
- **Briefing generation** (new):
- Add [`app/api/survey/briefing/route.ts`](app/api/survey/briefing/route.ts):
  - Inputs: `itemId`
  - **Include image** for higher-quality output (fetch signed URL → base64 → Claude vision).
  - Also send: `description`, `analysis`, `notes`, and `annotations[].note`.
  - Output: `briefing` (structured markdown or JSON with a `briefing` string; stored in DB).
  - System prompt will enforce an implementation-oriented "frontend brief" format (components, tokens, layout, behaviors, constraints).
  - **Overwrite protection**: if `briefing` already exists and differs from the stored value, prompt user to confirm before regenerating (client-side confirm dialog).
- **Embeddings**: update to compute and persist _both_ vectors.
- Update [`app/api/survey/embed/route.ts`](app/api/survey/embed/route.ts):
  - Build:
  - `briefingEmbeddingText` (briefing + category/component + tags)
  - `fullEmbeddingText` (briefing + description + notes + annotations + analysis + tags + sources)
  - Call Voyage twice (or batch if supported) and store:
  - Full → existing `update_survey_embedding`
  - Briefing → new `update_survey_embedding_briefing`
- **Search**: add `space` parameter.
- Update [`app/api/survey/search/route.ts`](app/api/survey/search/route.ts):
  - Default `space="briefing"`.
  - Use `match_survey_items_briefing` when space=briefing; use existing `match_survey_items` when space=full.
- **Search toggle UI**: add a small "Briefing / Full" toggle in the search input (e.g., segmented control or dropdown) in `SurveyCatalogPanel`.
- **Security note (important)**: these routes use the service-role Supabase client (bypasses RLS). We should explicitly enforce `user_id` scoping by retrieving the server user and adding `eq("user_id", user.id)` in fetch/update queries where applicable.

### 3) Client hook wiring (auto-analysis + auto-brief)

- Update [`app/astrogation/_hooks/useSurvey.ts`](app/astrogation/_hooks/useSurvey.ts):
- After successful upload:
  - auto-call `analyzeItem(itemId)`
  - then auto-call `generateBriefing(itemId)`
- Update `analyzeItem`, `embedItem`, and new `generateBriefing` to accept an explicit `itemId` (not only "current selection") so the pipeline is robust.
- **Loading/progress states**:
  - Add `pipelineStatus: 'idle' | 'analyzing' | 'briefing' | 'done' | 'error'` to reducer state.
  - Show a small progress indicator in the Inspector header or thumbnail when a new upload is being processed (e.g., "Analyzing..." → "Generating briefing...").
  - On error, show toast and allow manual retry via Re-analyze / Regenerate buttons.

### 4) UI/UX improvements (Survey Inspector)

- Update [`app/astrogation/_components/SurveyInspectorPanel.tsx`](app/astrogation/_components/SurveyInspectorPanel.tsx):
- **Description field**: new section above Notes.
- **Category + Component side-by-side**:
  - Use a 2-column grid row; apply a smaller select style (via `Select`’s `className`).
- **Tags input**:
  - Replace the comma-joined text field with a small `TagInput` chip UI (comma/enter commits; backspace removes last; remove button per chip).
- **Annotations as nodes**:
  - Detect newly created annotations (prop change) and auto-open the note input for the new annotation.
  - Persist annotation note changes immediately via `onUpdate({ id, annotations })` (no need to hit the global Save button).
  - If user cancels a brand-new annotation with an empty note, auto-delete it (removes the frame too).
- **Briefing section**:
  - Display `briefing` field (read-only textarea or collapsible markdown preview).
  - **Stale indicator**: track `briefing_updated_at` vs `updated_at` of notes/annotations; if notes/annotations are newer, show a subtle "Briefing may be outdated" hint with a "Regenerate" button.
  - Add "Regenerate briefing" button.
  - If there are unsaved field edits (title/notes/tags/etc), button first saves them, then calls `/api/survey/briefing`.
  - If briefing already exists and user clicks Regenerate, show a confirmation dialog before overwriting.
  - Keep "Embed" action, but it now embeds **both** spaces.
- **Re-analyze button**: add a low-emphasis "Re-analyze" link in the AI/Description section (since analysis is now auto-triggered on upload, but user may want to re-run later).
- Remove the primary "Analyze (Claude)" button from the action row.

### 5) UI/UX improvements (Survey Canvas)

- Update [`app/astrogation/_components/SurveyView.tsx`](app/astrogation/_components/SurveyView.tsx):
- Keep the current drag-to-create boxes.
- Ensure inspector updates immediately by making annotation updates optimistic (next step).
- (Optional) Clicking a frame could focus/open that annotation node in the inspector.

### 6) Optimistic annotation updates

- Update [`app/astrogation/page.tsx`](app/astrogation/page.tsx):
- In `handleSurveyAnnotationsChange`, dispatch an optimistic `SURVEY_UPDATE_ITEM` with updated annotations before awaiting the server `updateItem` call.
- This fixes the “I drew a frame but didn’t get a node field” lag.

### 7) Styling

- Update [`app/astrogation/astrogation.css`](app/astrogation/astrogation.css):
- Tag chips + input
- Category/component grid
- Briefing/description fields
- Annotation node list affordances

## Notes on Relevance + Avoiding Noise

- **`description` + `analysis`** are the raw AI extraction.
- **`briefing`** is the _distilled, implementation-ready_ artifact.
- **Embeddings**:
- Use **briefing embedding** for default semantic search (keeps retrieval tight, avoids dumping raw context).
- Keep **full-context embedding** for deeper similarity / “show me things like this including notes/annotations”.
- Retrieval UX can later pull briefing first, then selectively expand into notes/annotations if the user asks.

## Implementation Todos

- `db-briefing-embeddings`: Add `description`, `briefing`, `briefing_updated_at`, and dual-embedding columns + RPCs in Supabase migrations.
- `api-analyze-description`: Extend analyze route to persist `description` alongside `analysis`.
- `api-briefing`: Add briefing route + Claude prompt (with image) + DB persistence + overwrite protection.
- `api-embed-dual`: Update embed route to generate/store both embeddings.
- `api-search-space`: Add `space` parameter and route to correct RPC.
- `ui-search-toggle`: Add Briefing/Full toggle in search bar.
- `ui-pipeline-loading`: Add pipelineStatus state and progress indicators during upload→analyze→brief.
- `ui-tags`: Implement chip-based TagInput and wire to `tags`.
- `ui-annotations-nodes`: Auto-open new annotation note; persist note edits immediately; delete empty-cancel annotations.
- `ui-layout-compact`: Category+component side-by-side; smaller selects.
- `ui-stale-briefing`: Show "briefing may be outdated" hint when notes/annotations change after briefing generation.
- `ui-reanalyze`: Add low-emphasis Re-analyze link.
- `optimistic-annotations`: Dispatch optimistic annotation updates in `page.tsx`.
