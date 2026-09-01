import { MobileHudLabShell } from "./MobileHudLabShell";

/* Stylesheet order is LOAD-BEARING, and it is the same order production
   loads in:

     landing.css   owns the `@font-face` block, the `:root` token chain
                   (`--hud-margin`, `--hud-corner-zone`, `--safe-*`), the
                   ≤960 `--mobile-chrome-*` bands both candidates seat
                   inside, every `.hud*` rule the v0 mock borrows, and —
                   as the LAST rule in the file — the ≤960 padding floor
                   the runway's `.station` blocks reserve their bands with.
     rail-instruments.css  owns `.rin-settings`, the BR half of the mock.
     theme.css     LAST of the production sheets (ADR-058's own import
                   order). It is what re-pins `--dawn-rgb` to ink and
                   `--void-rgb` to parchment, i.e. the entire reason a
                   candidate drawn in tokens flips and one drawn in
                   literals does not. `?theme=light` is written on `<html>`
                   by the pre-paint bootstrap in `app/layout.tsx` on EVERY
                   route; a lab that never imports this sheet simply has no
                   light mode, which is how `/test/hud-instruments-lab`
                   spent three rounds dark-only.
     mobile-hud.css  the promotable sheet, from its PRODUCTION home. The
                   lab imports it rather than owning a copy, so promoting a
                   winner is a mount and not a file move.
     mobile-hud-lab.css  LAST, so the lab's own scoped overrides win the
                   cascade without touching a shipped surface.

   `home-v2.css` is deliberately NOT imported: the only thing it owns that
   this lab could want is the corridor host, and the corridor is WebGL —
   the runway stands in for it (see `Runway.tsx`). */
import "@/components/landing/v7/landing.css";
import "@/components/landing/v7/rail-instruments/rail-instruments.css";
import "@/components/landing/v7/theme.css";
import "@/components/landing/v7/mobile-hud/mobile-hud.css";
import "./mobile-hud-lab.css";

/**
 * `/test/mobile-hud-lab` — the two candidates for the phone leitmotif.
 *
 * `app/(internal)` is proxy-blocked in production (the `substrate-lab`
 * note: the dependency runs lab → production and may not reverse), so this
 * route is a dev/preview surface only. It mounts NOTHING from the landing
 * page: no `LandingPage`, no corridor, no `useLandingScroll`. See the
 * shell's header for the three clocks it owns instead, and `Runway.tsx`
 * for why the stations are synthetic.
 */
export default function MobileHudLabRoute() {
  return <MobileHudLabShell />;
}
