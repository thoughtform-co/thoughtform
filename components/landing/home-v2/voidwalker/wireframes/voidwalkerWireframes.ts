import type { ComponentType } from "react";

import type { VwWireId } from "@/lib/voidwalker/voidwalkerData";
import { AzerothWireframe } from "./AzerothWireframe";
import { CoinsWireframe } from "./CoinsWireframe";
import { ExpanseWireframe } from "./ExpanseWireframe";
import { HuntWireframe } from "./HuntWireframe";
import { LatentWireframe } from "./LatentWireframe";
import { OphefWireframe } from "./OphefWireframe";

/**
 * VOIDWALKER_WIREFRAMES — the six AUTHORED drawings on the through-line's
 * plates (ADR-074). Each abstracts the ARTEFACT a beat left behind (a
 * street hunt, a tweet that became a party, a Discord campaign, a Reddit
 * post, a raid HUD turned classroom, a hybrid film) in the casefile's
 * wireframe vocabulary (ADR-068): PT Mono micro-labels, bare `<i>`/`<b>`
 * placeholder bars, `data-on` for a lit row, inline SVG for glyphs only,
 * ONE gold object per drawing (`[data-gold]`), green for the flow.
 *
 * The grammar is FORKED from `.fl-wire*` into `.vw-wire*`
 * (voidwalker-wire.css) with the identical `--w-*` token recipe: the
 * casefile's classes assume the `.fl-shot__frame` button housing, its
 * grammar pair is enumerated per tool, `--fl-mono` is scoped to
 * `.fl-case`, and the services smoke walks `.fl-wire` — so a shared class
 * would couple two surfaces' guards. `tests/lib/voidwalker-wire-tokens`
 * pins the two token blocks equal instead.
 *
 * A drawing declares what it letters in `lib/voidwalker/voidwalkerWireLabels`;
 * `tests/lib/voidwalker-wire-markup` walks the rendered text against it.
 * NO digits, NO currency, NO `<img>` inside a drawing — the year rides the
 * spine and the figures ride the prose. The registry is TOTAL over
 * `VwWireId`, so a beat naming a drawing that does not exist is a compile
 * error, not an empty plate.
 */
export const VOIDWALKER_WIREFRAMES: Readonly<Record<VwWireId, ComponentType>> = {
  hunt: HuntWireframe,
  ophef: OphefWireframe,
  expanse: ExpanseWireframe,
  coins: CoinsWireframe,
  azeroth: AzerothWireframe,
  latent: LatentWireframe,
};
