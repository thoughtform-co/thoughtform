---
name: ShapeLab Workstation Redesign
overview: Consolidate the ShapeLab into a unified, high-fidelity workstation with integrated HUD navigation and refined VFX controls.
todos:
  - id: structural-refactor
    content: Refactor page.tsx into ControlColumn and MainViewer components
    status: pending
  - id: unified-canvas
    content: Merge canvas logic into a single high-fidelity WorkstationCanvas
    status: pending
  - id: control-optimization
    content: Relocate VFX controls to the sidebar and anchor the Save action
    status: pending
  - id: styling-refinement
    content: Apply HUDFrame and brand-aligned styling (Verde palette)
    status: pending
---

# Plan: ShapeLab Workstation Redesign

This plan refactors the ShapeLab into a single-viewer workstation that follows professional front-end standards while deepening HUD brand integration.

## 1. Structural Refactor

- Update `app/shape-lab/page.tsx` to use a layout grid: 360px Sidebar | Flexible Stage.
- Wrap the interface in `HUDFrame` and ensure `NavigationBar` is visible.
- Create a `ControlColumn` that manages state for Category, Shape, Geometry, and VFX.

## 2. Unified Workstation Canvas

- Create a `WorkstationCanvas` component that merges the logic of the three existing previews.
- Add toggleable logic for:
  - **Rotation**: Controlled via a floating button on the viewer.
  - **Grid Snapping**: Toggles the "Sigil" brand aesthetic (computational).
  - **VFX Rendering**: Toggles the "Active Theory" inspired lighting/bloom.
- Replace cyan color shifts with brand-aligned **Verde** gradients.

## 3. Control Panel Optimization

- Implement a dedicated **VFX Section** in the left panel containing sliders for Glow, Softness, Bloom, and Point Lighting.
- Anchor the **Save Preset** button to the bottom of the sidebar using `sticky` or `fixed` positioning within the column.
- Use the `IBM Plex Mono` font consistently for all data-driven controls to maintain the "Cockpit" feel.

## 4. UI/UX Polishing

- Implement CSS Grid for the sidebar to prevent button overflow.
- Ensure all interactive elements follow accessibility best practices (visible focus states, logical tab order).
