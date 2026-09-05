import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * /test/interface-kit — the design grid, and the proof panel recomposed on it.
 *
 * THE BRIEF (owner, 2026-09-05). He named Tensorlake and Prime Intellect:
 * "retrofuturistic terminal interface, but also modern", and could not put a
 * finger on the delta — "the placement of the texts, the font sizes, the
 * frames". He named the surface too: the proof casefile, "one of the
 * centrepieces of our brand", where the directory, the font sizes and the tabs
 * are what he is struggling with. And he named the boundary: the rails stay.
 *
 * SO THE DELTA WAS MEASURED RATHER THAN DESCRIBED. Both references were read
 * off their live DOMs — root custom properties, every rendered type
 * combination, every border/background/shadow combination — and the same probe
 * was run on the shipped casefile. The findings are countable, and they are in
 * `docs/design/interface-kit/ANALYSIS.md`:
 *
 *   ·  one of them sets its display type in PP NEUE MONTREAL — this house's own
 *      face — at 500 and sentence case, so the kinship is partly literal and
 *      the difference is discipline
 *   ·  four letter-spacing tokens in a whole design system, against FIFTEEN on
 *      this one panel
 *   ·  one line weight in one neutral hue for all structure, against three dawn
 *      alphas plus gold hairlines
 *   ·  six to eight accent marks per screen, against roughly forty gold objects
 *
 * WHAT THIS ROUTE IS. Two views on one root. `?view=sheet` is the DESIGN GRID —
 * the line ladder, the type ladder, the label grammar, the marks, the frames,
 * the stations, the buttons, the rows, the readouts, the panel anatomy — every
 * specimen reading the kit's own tokens. `?view=panel` is THE PROOF PANEL
 * RECOMPOSED from the production leaves inside the real HUD frame, so a rule
 * proposed on the sheet can be read on the surface it is for.
 *
 * The knobs are not styles: each one is a count, moved to the house's own
 * stated law, and the FIRST value of every knob is production untouched.
 *
 * ⚠ NOTHING ON THE LANDING CHANGES IN THIS PASS, and there is no flag. A winner
 * is promoted with its own ADR (091) and the losers are deleted with their
 * guards (ADR-070 U35).
 *
 * Internal-only: `proxy.ts` blocks `/test/*` in production.
 */
export const metadata: Metadata = {
  title: "Interface kit · Thoughtform",
  robots: { index: false, follow: false },
};

export default function InterfaceKitLayout({ children }: { children: ReactNode }) {
  return children;
}
