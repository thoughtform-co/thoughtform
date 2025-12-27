---
name: Responsive mobile pass
overview: Improve mobile responsiveness across HUD nav, hero, interface tabs, manifesto, and services while preserving current desktop behavior and transitions.
todos:
  - id: nav-mobile-section-list
    content: Replace mobile hamburger with clickable vertical section list + add top-right sigil in `components/hud/NavigationBar.tsx` while keeping desktop nav unchanged.
    status: completed
  - id: hide-admin-tools-mobile
    content: Hide `components/admin/AdminTools.tsx` cluster on mobile breakpoints (≤768px).
    status: completed
  - id: hero-mobile-sizing
    content: Adjust mobile hero wordmark/frame sizing + true centering using `components/hud/NavigationCockpitV2/styles.ts` and targeted mobile layout tweaks in `NavigationCockpitV2/index.tsx`.
    status: completed
    dependencies:
      - nav-mobile-section-list
  - id: interface-tabs-up
    content: Move `MobileModuleTabs` upward by adjusting `.mobile-module-tabs` positioning in `components/hud/NavigationCockpitV2/styles.ts`.
    status: completed
    dependencies:
      - hero-mobile-sizing
  - id: manifesto-mobile-tabs
    content: Implement mobile manifesto vertical tabs (Manifesto/Sources/Voices) and wire into `NavigationCockpitV2/index.tsx`.
    status: completed
    dependencies:
      - hero-mobile-sizing
  - id: manifesto-desktop-width
    content: Widen desktop manifesto panel by adjusting the manifesto width growth constants in `components/hud/NavigationCockpitV2/index.tsx` without affecting services shrink-to-card behavior.
    status: completed
  - id: services-mobile-stack
    content: Add tap-to-cycle stacked services deck on mobile and integrate into the manifesto→services transition in `NavigationCockpitV2/index.tsx`.
    status: completed
    dependencies:
      - manifesto-mobile-tabs
---

# Mobile-first responsiveness pass (desktop-safe)

## Goals

- Remove the mobile hamburger and replace it with an always-visible **section list menu** (active = tensor gold, others = grey) while keeping desktop nav unchanged.
- Move the **Thoughtform sigil** to the mobile top-right (where hamburger is), retaining the existing **semantic-dawn → tensor-gold + glow** trigger from sigil particle arrival.
- Improve mobile layout/typography for **Hero**, **Interface tabs**, **Manifesto (single-panel tabs)**, and **Services (stacked cards)** without regressing desktop.

## Locked decisions (from you)

- **About is not part of the HUD sequence**: keep the 5-step numbering as `01 Home → 02 Interface → 03 Manifesto → 04 Services → 05 Contact`.
- **Services on mobile uses tap-to-cycle stacked cards** (no swipe gesture).

## Implementation outline

### HUD / Navbar (mobile)

- Update `[components/hud/NavigationBar.tsx](components/hud/NavigationBar.tsx)`:
  - **Remove** the mobile hamburger + slide-out panel.
  - Replace `mobile-section-text` with a **vertical list** showing the current section plus subsequent sections.
    - Active section: number + label in **tensor gold**.
    - Inactive sections: number + label in **grey** (matching current HUD greys).
    - Items should be clickable and call `onNavigate(sectionId)`.
  - Add the **Thoughtform sigil button** in the top-right (replacing hamburger position).
    - Use the existing `isLogoGold` / `triggerLogoGlow()` / `resetLogoColor()` mechanism so the sigil still transitions when particles arrive.

### Hide “Particles / Shape Lab” admin icons on mobile

- Update `[components/admin/AdminTools.tsx](components/admin/AdminTools.tsx)`:
  - Hide the entire `.admin-tools` cluster at `max-width: 768px` (CSS media query), since you want those icons hidden on mobile.

### Hero (mobile)

- Update `[components/hud/NavigationCockpitV2/styles.ts](components/hud/NavigationCockpitV2/styles.ts)`:
  - Increase mobile hero wordmark size by adjusting `.hero-wordmark-container` `max-width`/`width` so it reads stronger on phone.
  - Make the hero bridge frame feel more “designed” on mobile:
    - Increase `.bridge-frame` mobile `max-width`.
    - Increase `.bridge-frame .hero-tagline-v2` font sizing slightly.
- Update `[components/hud/NavigationCockpitV2/index.tsx](components/hud/NavigationCockpitV2/index.tsx)`:
  - In the **mobile** bridge-frame branch, adjust inner layout so **hero-frame text is truly centered** (not just `text-align`), while keeping manifesto mode left-aligned.

### Interface (mobile)

- Update `[components/hud/NavigationCockpitV2/styles.ts](components/hud/NavigationCockpitV2/styles.ts)`:
  - Move `MobileModuleTabs` upward by increasing `.mobile-module-tabs` `bottom`.

### Manifesto

- **Desktop width**: Update `[components/hud/NavigationCockpitV2/index.tsx](components/hud/NavigationCockpitV2/index.tsx)`:
  - Increase the manifesto terminal’s max width by tuning the frame constants (`widthGrowth` so the manifesto state grows wider), keeping the services shrink-to-card behavior intact.
- **Mobile single-panel tabs**:
  - Add a new component: `[components/hud/NavigationCockpitV2/ManifestoMobileTabs.tsx](components/hud/NavigationCockpitV2/ManifestoMobileTabs.tsx)`.
    - Vertical tab rail: **MANIFESTO / SOURCES / VOICES**.
    - Content panel renders:
      - Manifesto: reuse `ManifestoTerminal`.
      - Sources: reuse the source data/styling in a **non-fixed** layout.
      - Voices: reuse the existing voice card data in a **mobile-friendly** list/stack (tap to open modal still works).
  - Integrate into `[components/hud/NavigationCockpitV2/index.tsx](components/hud/NavigationCockpitV2/index.tsx)` so that on mobile, the manifesto panel shows the tabs instead of relying on fixed left/right rails.

### Services (mobile stacked deck + transition)

- Add a new component: `[components/hud/NavigationCockpitV2/ServicesStackMobile.tsx](components/hud/NavigationCockpitV2/ServicesStackMobile.tsx)`.
  - Reuse `ServiceCard` + `SERVICES_DATA`.
  - Render **3 stacked cards** with offsets/scales; on tap, advance the deck (cycle the front card).
  - Use `framer-motion` for smooth reorder/transform animation, but keep interactions simple (tap only).
- Update `[components/hud/NavigationCockpitV2/index.tsx](components/hud/NavigationCockpitV2/index.tsx)`:
  - When `isMobile` and the manifesto→services transition begins, render `ServicesStackMobile` as an overlay within the bridge-frame so the **manifesto terminal visibly morphs into the first service card** (via existing `tServicesCards` cross-fade).
  - Keep desktop behavior unchanged (`ServicesDeck` stays desktop-only).

## Verification checklist (manual)

- Mobile (≤768px):
  - Top-left section list shows active + subsequent sections, with correct gold/grey coloring.
  - Top-right sigil appears and transitions to gold when particles arrive.
  - Hero wordmark and hero frame text feel larger and centered.
  - Interface tabs sit higher and don’t collide with HUD bottom copy.
  - Manifesto panel shows vertical tabs and is comfortably readable.
  - Services appear as tap-to-cycle stacked cards and the manifesto-to-services transition still feels continuous.
- Desktop (≥1025px): no layout regressions to nav, manifesto rails, or the 3-card services deck.
