import type { Metadata } from "next";

import { DatumLabShell } from "./DatumLabShell";

/* Stylesheet order is load-bearing (the voidwalker-holo-lab precedent):
   production sheets first — `landing.css` owns the @font-face block and the
   :root token chain every `--gold*`/`--hud-*` below resolves against, and it
   is the ONLY source of the PT Mono / PP Neue Montreal faces (the tokens in
   variables.css resolve without it, but fall through to system faces) — then
   `theme.css` LAST of the production sheets so its `html[data-theme="light"]`
   cascade wins over all of them, and only then the lab's own sheet.

   `voidwalker-hologram.css` is imported for the FIGURE ALONE: `.vwh__slot`,
   `.vwh__media-wrap` and `.vwh__base` carry the isolation + masked-floor
   block that took three attempts to get right (ADR-082 U6), and re-authoring
   it here would fork it. Everything `.vdl*` is this lab's own layout. */
import "@/components/landing/v7/landing.css";
import "@/components/landing/home-v2/home-v2.css";
import "@/components/landing/home-v2/voidwalker/voidwalker.css";
import "@/components/landing/home-v2/voidwalker/hologram/voidwalker-hologram.css";
import "@/components/landing/v7/theme.css";
import "./voidwalker-datum-lab.css";

export const metadata: Metadata = {
  title: "Voidwalker datum lab · Thoughtform",
  robots: { index: false, follow: false },
};

export default function VoidwalkerDatumLabRoute() {
  return <DatumLabShell />;
}
