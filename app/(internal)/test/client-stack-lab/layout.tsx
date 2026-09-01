import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * /test/client-stack-lab — the casefile AS A CLIENT STACK, at two clients.
 *
 * The problem (ADR-087, Phase C): commit f8dde2c2 gave the browse channel a
 * client axis — a segment table with per-client bands and seam bands, two
 * crossfade clocks, and a CSS composition on the four panels whose content is
 * one client's record. All of it is live, all of it is guarded, and NONE of it
 * has ever executed: `CASES` holds one client, so the table is a single band
 * `[0, 1]`, the seam clocks are never written and the composition resolves to
 * the identity. Byte-identity at N = 1 was the acceptance proof for the
 * mechanism, and it is precisely the proof that the CHOREOGRAPHY has not been
 * seen.
 *
 * This lab is the first time the channels write. It mounts the SHIPPED
 * `ServicesCasefile` with `cases={[LOOP_EARPLUGS_CASE, CLIENT_STACK_FIXTURE]}`
 * — a synthetic second client with THREE tracks against Loop's four, so the
 * unequal-row-count path in `browseSegments` is exercised rather than assumed
 * — and drives the five custom properties the pinned dwell writes, so the spy,
 * the hysteresis, the identity swap and the panel composition are all the real
 * code paths. The lab owns one number: the browse fraction.
 *
 * What is under judgement, and only this:
 *   · `?seam=0.3|0.5|0.8` — how much scroll a client change costs. 0.5 ships.
 *   · `?bias=0|1` — ±18px of travel on the client clocks alone, so the
 *     crossing reads as one instrument changing its record rather than a
 *     dissolve between two pictures. Lab-owned CSS; nothing in casefile.css
 *     moves.
 *   · `?replay=0|1` — whether the incoming client's copy decodes as its card
 *     arrives. The mechanism is production code (inert at one client); the
 *     prop exists so both readings can be seen.
 *   · `?t=` — the browse fraction itself, deep-linkable to any crossing.
 *
 * ⚠ THE FIXTURE IS NOT IN `lib/cases/`. It lives beside this route and nothing
 * outside this directory imports it — see `fixtureCase.ts` for why that is a
 * confidentiality rule and not a filing preference.
 *
 * Stills: `node scripts/capture-client-stack.mjs` → `docs/design/client-stack/`.
 *
 * Blocked from production by `proxy.ts` and `noindex`; auth handled by the
 * parent `(internal)/test` layout.
 */
export const metadata: Metadata = {
  title: "Client Stack Lab — The Casefile's Client Seam (Internal)",
  description:
    "Look-dev for the proof casefile's client-to-client crossing, driven at two clients through the shipped browse channels.",
  robots: { index: false, follow: false },
};

export default function ClientStackLabLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
