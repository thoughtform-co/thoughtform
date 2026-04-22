# Astrogation Baseline Behavior Checklist

Use this checklist to validate after each refactor phase.

## 1. Category & Component Selection

- [ ] Clicking a category in left panel expands/collapses it
- [ ] Clicking a component item selects it and updates center preview
- [ ] Search filtering works (type in search box, results filter)
- [ ] Selected component is visually highlighted in catalog

## 2. Center Panel Tabs

- [ ] VAULT tab shows component preview + saved variants
- [ ] FOUNDRY tab shows component preview with zoom capability
- [ ] Switching tabs preserves selected component
- [ ] Scroll wheel zooms preview in FOUNDRY mode

## 3. Focus Mode (Vectors & Word Marks)

- [ ] Clicking a vector/wordmark item opens focused overlay
- [ ] Focused overlay shows enlarged asset with label
- [ ] Background grid items remain visible but blurred/dimmed
- [ ] Pop-up has frosted glass effect (backdrop blur)
- [ ] Clicking backdrop or focused item dismisses overlay
- [ ] Global UI (panels, nav, footer) blurs when focus is active
- [ ] Focus state resets when switching components

## 4. Single-Element Components

- [ ] Clicking single-element preview in FOUNDRY toggles focus mode
- [ ] Component scales up when focused
- [ ] TargetReticle frame visible around component
- [ ] Clicking outside preview area dismisses focus

## 5. Dials Panel (Right)

- [ ] Props controls render based on component definition
- [ ] Changing props updates preview in real-time
- [ ] Color swatches work (click to select, click again to deselect)
- [ ] Corner selector works for components with cornerToken prop
- [ ] "Copy JSX Code" button copies to clipboard

## 6. Presets (CRUD)

- [ ] "Save to Vault" saves current props as preset
- [ ] Saved presets appear in VAULT view
- [ ] Loading a preset restores props and switches to FOUNDRY
- [ ] Deleting a preset removes it from list
- [ ] Toast notifications appear for save/load/delete actions

## 7. Spec Panel (VAULT mode)

- [ ] Shows component name, description, ID
- [ ] Lists all props with types, defaults, and constraints
- [ ] Updates when different component is selected

## 8. Visual Consistency

- [ ] HUD corners visible at screen edges
- [ ] Rail scales visible on left and right
- [ ] Navigation bar shows logo and "Astrogation" title
- [ ] Footer shows version text
- [ ] No layout shifts or overflow issues

---

## 9. Survey Tab - Catalog & Filtering

- [ ] Clicking a category in Survey Filter panel expands/collapses it
- [ ] Clicking a component item filters references to that component
- [ ] Category selection resets component selection
- [ ] Item counts display next to categories/components with references
- [ ] Deselecting category/component shows all references

## 10. Survey Tab - Upload & Pipeline

- [ ] "Upload" button opens modal with drag/drop zone
- [ ] Drag & drop file onto zone triggers upload
- [ ] Paste image from clipboard triggers upload (works in modal AND directly in Survey tab)
- [ ] Click on zone opens file picker
- [ ] After upload: analysis runs automatically
- [ ] Pipeline status shows "Analyzing..." during auto-analysis
- [ ] Briefing is generated MANUALLY by clicking "GENERATE BRIEFING" button
- [ ] Generate Briefing button shows spinner animation while generating
- [ ] Pipeline errors don't break the session (item still saved)
- [ ] Category/component can be assigned during upload

## 11. Survey Tab - Canvas & Annotations

- [ ] Selected reference displays in large preview canvas
- [ ] Empty state shows "Select a reference" or "No references yet"
- [ ] Drawing (mouse drag) creates annotation box on image
- [ ] Annotation boxes have 8 resize handles (corners + edges)
- [ ] Resizing is smooth (local state, debounced save)
- [ ] Double-click annotation shows expanded note
- [ ] Annotation hint "Drag to annotate" visible when item selected

## 12. Survey Tab - Thumbnail Strip

- [ ] Thumbnails display below canvas
- [ ] Selected thumbnail has visual highlight
- [ ] Click thumbnail selects that reference
- [ ] Loading state shows spinner
- [ ] Empty state shows "No references yet"

## 13. Survey Tab - Inspector Panel

- [ ] Title field editable
- [ ] Sources can be added/removed
- [ ] Tags show as chips with remove button
- [ ] Suggested tags (from AI) clickable to add
- [ ] Component Classification dropdown works (NestedSelect)
- [ ] Notes textarea editable
- [ ] "Run Analysis" triggers AI analysis
- [ ] "Generate Briefing" triggers AI briefing (requires analysis)
- [ ] "Embed" creates vector embeddings (requires briefing)
- [ ] Save/Reset/Delete toolbar buttons work
- [ ] Annotation list shows all annotations with note editing
- [ ] New annotation auto-opens for note editing

## 14. Survey Tab - Semantic Search

- [ ] Search input in catalog panel accepts text
- [ ] Empty search query restores recent items list
- [ ] Non-empty query triggers semantic search
- [ ] "Briefing" vs "Full" toggle switches search space
- [ ] Search results display with similarity scores
- [ ] Toast shows "Found X similar items"
