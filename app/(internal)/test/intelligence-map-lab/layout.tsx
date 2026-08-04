import type { Metadata } from "next";

/**
 * /test/intelligence-map-lab — look-dev for the Intelligence Map (the proof
 * casefile's registry plate), and the ARCHIVE of every round it took to get here.
 *
 * WHY A LAB AND NOT A BRANCH ON THE LIVE PANEL. The owner's gate: build the
 * artifact first, in the site's exact chrome, and ship nothing to the live panel
 * until it is approved. So nothing under `components/landing/**`, `lib/cases/**`
 * or the CSS the landing loads is touched by this route — it IMPORTS those,
 * read-only, and adds one lab-scoped layer.
 *
 * ── THE VARIANT SYSTEM · `?v=` ─────────────────────────────────────────────
 * Five rounds, two of them rejected outright. Deleting the rejects deleted the
 * ARGUMENT, so every round stays reachable and prints what it was and how it was
 * judged (`variants.ts` holds the provenance lines; the always-on top-centre
 * strip switches between them).
 *
 *   ?v=5        CURRENT · the three-level console, in the casefile chrome
 *   ?v=4        KEEPER  · round 4 rev B, the cartesian instrument, frozen
 *   ?v=console3 the owner's console v3 — the base for v5, byte-exact in an iframe
 *   ?v=proto2   the owner's spatial prototype v2 — the base for rounds 3/4
 *   ?v=proto1   the owner's first spatial prototype
 *   ?v=r3       stills · the polar port · rejected (aspect squish, circles)
 *   ?v=r2       stills · three instrument variants · bypassed by his own build
 *   ?v=r1       stills · cards in bands · "a glorified PowerPoint"
 *
 * ── v5 · THE THREE-LEVEL CONSOLE ──────────────────────────────────────────
 * ONE information architecture at three zoom levels. The clicked chip IS the
 * master plate — one DOM node, animated — so the zoom reads as a zoom instead of
 * as three different screens, which was his diagnosis of console v3.
 *
 *   ?level=0   01 WORKSTREAMS   THE MAP OF WORK        all eight, as chips
 *   ?level=1   02 CONFIGURATION WHAT RUNS IT           one chip, expanded
 *   ?level=2   03 OPERATION     WHAT RUNS THROUGH IT   the same, energized
 *   ?view=team|substrate|allocation   L1 ONLY — views are not levels
 *   ?work=W01..W08 · ?theme=light|dark · ?autoplay=0 · ?dev=0
 *
 * ── v4 · the frozen keeper ────────────────────────────────────────────────
 *   ?v=4&depth=0|1|2 · ?work= · ?substrate= · ?lens=team|allocation
 *
 * Blocked from production by `proxy.ts` and `noindex`; auth is the parent
 * `(internal)/test` layout's. The archive HTML never leaves this route: it is
 * read server-side and handed to an iframe as `srcDoc`, because every response
 * in this app carries `X-Frame-Options: DENY`.
 */
export const metadata: Metadata = {
  title: "Intelligence Map Lab — Rounds 1–5 (Internal)",
  robots: { index: false, follow: false },
};

export default function IntelligenceMapLabLayout({ children }: { children: React.ReactNode }) {
  return children;
}
