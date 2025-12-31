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
