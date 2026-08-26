import type { Metadata } from "next";

import { CharacterStageLab } from "./CharacterStageLab";

import "@/components/landing/v7/landing.css";
import "@/components/landing/home-v2/voidwalker/character/voidwalker-character.css";
import "@/components/landing/v7/theme.css";
import "./avatar-lab.css";

export const metadata: Metadata = {
  title: "Voidwalker avatar lab · Thoughtform",
  robots: { index: false, follow: false },
};

/**
 * `/test/voidwalker-avatar-lab`
 *
 * The ADR-082 character-stage lab. Renders the six eras' character
 * cards side by side, with:
 *
 *   - the era's still (from `characterEras.ts`)
 *   - the era's GLB (once one lands), rotated on a turntable, with the
 *     `hologram` materialisation cue when it swaps
 *   - a preflight panel that names what is present vs. what is missing
 *     for each era (still ✓/✗ · model ✓/✗ · file size · texture ok)
 *
 * ⚠ THE ROUTE GROUP IS `(internal)`, blocked in production by
 * `proxy.ts`. Nothing here ships. The lab is a WINDOW ONTO production
 * (it renders the same `characterEras.ts` registry) — a divergence
 * between the two is the alarm, not the norm.
 *
 * Once a GLB lands under `public/models/voidwalker/<era>.glb` and the
 * registry's `modelPath` is flipped, this route becomes the go-to
 * inspection surface for that model — poke the turntable, poke the
 * lighting, poke the swap animation, before it hits the marketing
 * route.
 */
export default function VoidwalkerAvatarLabRoute() {
  return <CharacterStageLab />;
}
