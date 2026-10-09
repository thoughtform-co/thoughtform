import { sliceV7Sections } from "@/lib/v7-parse";

import { InstrumentLabShell } from "./InstrumentLabShell";

/* ⚠ STYLESHEET ORDER IS LOAD-BEARING — the lattice lab's order verbatim
   (`app/(internal)/test/lattice/page.tsx`), plus the two sheets this lab
   adds: `arcs.css` (the `--arc-*` ramp the instrument reads, and the theme
   re-derivation of it) and `instrument.css` after `lattice.css` (the housing
   it builds on). `theme.css` stays last of the production set (ADR-058). */
import "@/components/landing/v7/landing.css";
import "@/components/landing/home-v2/home-v2.css";
import "@/components/landing/home-v2/services/services.css";
import "@/components/landing/home-v2/services/casefile/casefile.css";
import "@/components/landing/home-v2/services/casefile/console/console.css";
import "@/components/landing/home-v2/services/casefile/map/pda/pda.css";
import "@/components/landing/home-v2/voidwalker/voidwalker.css";
import "@/components/landing/v7/site-footer/site-footer.css";
import "@/components/arcs/arcs.css";
import "@/components/landing/v7/theme.css";
import "@/components/landing/v7/rail-instruments/rail-instruments.css";
import "@/components/lattice/lattice.css";
import "@/components/instrument/instrument.css";
import "../lattice/lattice-lab.css";
import "./instrument-lab.css";

/** Server: `sliceV7Sections` reads the v7 prototype off disk. `[]` is the
 *  HUD chrome only, so the instrument sits in the real frame. */
export default function InstrumentLabRoute() {
  const slice = sliceV7Sections([]);
  return <InstrumentLabShell hudHtml={slice.hudHtml} bodyClass={slice.bodyClass} />;
}
