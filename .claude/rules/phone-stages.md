---
paths:
  - "components/xb-proposal/phone/**"
  - "components/xb-proposal/embed/**"
  - "components/xb-proposal/network/**"
  - "components/xb-proposal/stack/**"
  - "components/arcs/case-dossier/**"
  - "app/(marketing)/cases/**"
  - "app/(marketing)/arcs/thoughtform/ux-meetup/**"
  - "tests/lib/xb-phone-stages.test.tsx"
---

# Rule: The phone stages (/cases and the talk's swarm chapter)

The opening sections' story played on a phone by their own drawings, pinned and scrubbed.
Decision and rationale: [ADR-160](../../sentinel/decisions/160-the-cases-page-and-the-swarm-chapter-on-a-phone.md);
the talk's own half is [ADR-156](../../sentinel/decisions/156-the-ux-meetup-talk.md) U16. The phone
layout law these sit inside is [`mobile-sections.md`](mobile-sections.md) §1 and §10–13 (the chrome reserve, svh runways, the
pinned band, snap seats).

## Contracts

- **Opt-in, never a default.** `phone="stage"` on `StackFlow`, `EmbedStack` and `NetworkOrg`;
  only `/cases` and the talk's `SwarmChapter` pass it (counted in `xb-phone-stages`). The
  keynote template, `ArcFlowPorts` (X-Bionic) and the labs render byte-identical markup. A new
  page opts in by passing the prop; never by changing a default.
- **One gate, one literal.** `PHONE_STAGE_MEDIA` in `components/xb-proposal/phone/stageClock.ts`
  is the hook's query AND each sheet's `@media` line, character for character (the test reads
  the sheets). Below it (short phones, reduced motion) ADR-156 U15's static layouts stand, by
  the media query alone. ⚠ Edit the constant and the three sheets together, or the CSS and the JS disagree on
  which box is on screen.
- **The clock is the phone corridor's grammar** (ADR-125): a dwell under one snap radius, a pass
  over two, at 640 / 664 / 844 / 932. Lengthen a pass, never a dwell; a leg table change re-runs
  the radius test. Every dwell has a seat (`scroll-snap-align: start` span in the travel spacer).
- **Progress is the desktop's own function.** Steps: `read(p, open)` at p 0 / 0.5 / 1. Network:
  `moment(T.ribs + t·(1 − T.ribs))`. Never a second set of numbers for the phone.
- **Measure the runway, never assume it.** `readBand` takes the band's flow top as the spacer's
  top less the band's height (ADR-115 U1) and reads `layoutViewportHeight()` (ADR-113; the three
  readers are pinned adopters). A new reader joins `layout-viewport-height.test.ts`.
- ⚠ **`dvh` only on the pinned band, only inside the gate.** Every runway and travel spacer is
  svh; the test fails a `\d+dvh` before the gate in each sheet.
- **The band is opaque.** It paints `--xb-ground` (steps, network) or sits on a ground bed
  (vision), and reserves `--mobile-chrome-top/bottom`. A transparent band shows the next
  section's drawing through it, which is the bleed the owner asked to stop.
- **Writes are imperative.** Per-frame values go to custom properties and data attributes on
  refs; React state changes only on a step or seat change (`setStep`), never per frame.
- **Words stay DOM and stay readable.** The steps' callouts are DOM tags read from `CALLOUTS` by
  reference (the SVG's would print under 12px); typed words keep an `sr-only` twin.

## The dossier at ≤960

- `.csd-frame` is `rgba(var(--void-deep-rgb), 0.9)` over its sticky field and the field's dots
  are 0.22, `[data-pattern]` named too. The `proposal-swarm-v2` dossier guards (no font under
  12px, no `border-radius`, no `contain:`, no side borders in the four blocks, no
  `.csd-frame::after`) bind every change here.

## Verifying

- `npx vitest run tests/lib/xb-phone-stages.test.tsx tests/lib/ux-meetup.test.ts
tests/lib/proposal-swarm-v2.test.ts tests/lib/layout-viewport-height.test.ts`.
- Stills at every seat and mid-pass at 390×844, 390×640 and 430×932 in both themes, plus 375×600
  and reduced motion for the fallback. Seed light through `localStorage` `tf-theme`, never
  `colorScheme` alone. Hide the fixed HUD scrim for element shots.
- Desktop identity: dump every box under `main` at 1440×900 against a `main` worktree and diff
  at 0.5px. ⚠ The talk's About orbit is time-driven and differs in a self-diff too.
- iOS (the toolbar under the `dvh` band, snap near the seats) is a real-device check; Chromium
  cannot reproduce it.
