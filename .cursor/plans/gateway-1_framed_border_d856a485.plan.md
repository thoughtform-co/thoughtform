---
name: Gateway-1 framed border
overview: Add a new selectable gateway option inspired by Thoughtform Gateway-1 that emphasizes a more solid, architectural border using layered dotted/dashed rings.
todos:
  - id: add-shape-config
    content: Add new `GatewayShape` option (e.g. `thoughtformGateway1`) + labels + `GATEWAY_SHAPE_IS_ATTRACTOR` entry in `lib/particle-config.ts`.
    status: completed
  - id: render-framed-gateway
    content: Implement the framed/dotted border variant in `components/hud/ThreeGateway.tsx` using layered dotted marker rings inspired by Gateway‑1 dash patterns, while keeping the existing tunnel composition.
    status: completed
    dependencies:
      - add-shape-config
  - id: admin-panel-icon
    content: Update `components/admin/ParticleAdminPanel.tsx` to display a meaningful icon for the new gateway option in the Geometric grid.
    status: completed
    dependencies:
      - add-shape-config
---

# Add “Thoughtform Gateway I” option (solid framed border)

## Goal

Implement **Gateway‑1** as a new selectable option in the existing Gateway panel, focused on the thing you called out: **a more solid, architectural border that feels like you’re entering a gateway**, not just a fuzzy circle of particles.We’ll do this in a **generative-inspired** way (not 1:1), but grounded in Gateway‑1’s actual SVG topology:

- **Outer thick dotted/dashed circle**: `<circle class="st1569" ... r="273.69"/>` with `stroke-width: 5.67px` and dash pattern `0 17.01 0 85.04 0 141.73`
- **Two additional concentric rings**: `st3142` (`stroke-width: 3.87px`, dash pattern `0 30.24 0 103.94 0 113.39`) and `st675` (`stroke-width: 2.08px`, dash pattern `0 43.46 0 122.83 0 85.04`)

## Where this plugs in

- The gateway selector is driven by `GatewayShape` in [`lib/particle-config.ts`](lib/particle-config.ts) and is rendered by the hero WebGL gateway in [`components/hud/ThreeGateway.tsx`](components/hud/ThreeGateway.tsx).
- The admin UI that selects shapes lives in [`components/admin/ParticleAdminPanel.tsx`](components/admin/ParticleAdminPanel.tsx).

## Implementation approach

### 1) Add a new shape option

- Extend `GatewayShape` with a new non-attractor shape (e.g. `"thoughtformGateway1"`).
- Add user-facing label in `GATEWAY_SHAPE_LABELS`.
- Mark it `false` in `GATEWAY_SHAPE_IS_ATTRACTOR` so it appears under the **Geometric** section of the panel.

Files:

- [`lib/particle-config.ts`](lib/particle-config.ts)

### 2) Render a “framed border” variant in `ThreeGateway`

Add a small gateway-only variant that composes existing primitives but emphasizes a rigid border:

- **Base frame ring**: a thicker/denser-feeling front ring (bigger point size, reduced jitter, slight Z thickness).
- **3 concentric dotted/dash marker rings** inspired by the SVG dash patterns above.
- Implement as a “dot ring” generator: place dot centers around the circle using the dash-gap sequence (treating zero-length dashes as dot caps), then expand each dot into a small particle cluster to read as a solid segment.
- **Keep the existing tunnel** (depth rings + spiral), but slightly de-emphasize interior fill so the border reads more architectural.

Files:

- [`components/hud/ThreeGateway.tsx`](components/hud/ThreeGateway.tsx)

### 3) Add a glyph/icon in the admin panel

The panel currently hard-codes icons for the existing geometric shapes. Add a simple icon mapping for the new `thoughtformGateway1` option so the button isn’t visually blank.Files:

- [`components/admin/ParticleAdminPanel.tsx`](components/admin/ParticleAdminPanel.tsx)

## Validation / fit with the particle system

- **Performance**: keep particle counts bounded (small additional point clusters; no per-frame re-generation).
- **Brand alignment**: still rendered as crisp point sprites (square points), no bloom/glow.
- **Responsive**: preserve the existing mobile overrides in `ThreeGateway` (centered + lower intensity).

## Manual test checklist (after implementation)

- In the Particle Admin Panel → **Gateway** tab → select **Thoughtform Gateway I**.
- Confirm the border reads as a **frame** (strong outer ring + dotted marker rings), and that scroll fade-out behaves the same.
