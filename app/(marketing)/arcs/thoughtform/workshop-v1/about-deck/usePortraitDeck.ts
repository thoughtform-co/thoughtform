"use client";

import { useEffect } from "react";

import { portraitBakeFor } from "@/lib/services-ring/portraitBake";
import { useThemeStore } from "@/lib/stores/themeStore";
import { readThemeMode, type ThemeMode } from "@/lib/theme/themeModeRef";

/**
 * usePortraitDeck — the About portrait becomes the homepage deck's card
 * (ADR-137 U4). Owner, 2026-09-30: "my photo has a stacked effect because it
 * comes from the cards in the Services section … I like the 3D card effect.
 * Can we apply it here".
 *
 * THE CARD IS THE BAKE, NOT A LOOK-ALIKE. `portraitBakeFor` is the memo the
 * WebGL deck and the phone band already share (ADR-115): the ring's portrait
 * crop under the gold LUT, the two scrims, the chamfer and the shell stroke.
 * This writer runs it and shows the blob on the portrait's own `<img>`, so
 * the card on this route is the card on `/`. The deck around it is CSS
 * (route rule 1c).
 *
 * ⚠ THE CUT IS THE DESKTOP DECK'S: `raster-photo` (the live face) bakes no
 * top-left chamfer, so neither does this.
 * ⚠ THE SWAP DECODES FIRST. The new blob is decoded on a probe before the
 * `<img>` takes it, so a bake landing, or a theme flip re-baking, never shows
 * a blank card. Until the first bake lands the source crop shows under the
 * CSS chain the LUT was built to reproduce; `data-tw-portrait="baked"` takes
 * that chain off.
 * ⚠ THREE-FREE: `portraitBake` is the module the landing's First Load JS may
 * reach (`landing-import-doctrine`), which is why it was lifted out of the
 * ring.
 */
const PORTRAIT = ".tw-root #about .voidwalker__orbit__portrait";
const BAKED_ATTR = "data-tw-portrait";
/** The desktop deck's face variant draws no top-left cut. */
const CUT_TOP_LEFT = false;
/** The bake's own 840 × 1360: the card shows at ≤ 270 CSS px wide. */
const BAKE_SCALE = 1;

export function usePortraitDeck(): void {
  useEffect(() => {
    const portrait = document.querySelector<HTMLElement>(PORTRAIT);
    const img = portrait?.querySelector("img");
    if (!portrait || !img) return;

    let disposed = false;
    let bakedFor: ThemeMode | null = null;
    let shownUrl: string | null = null;

    const bake = (mode: ThemeMode) => {
      if (bakedFor === mode) return;
      bakedFor = mode;
      portraitBakeFor(mode, BAKE_SCALE, CUT_TOP_LEFT).then((canvas) => {
        if (disposed || bakedFor !== mode) return;
        canvas.toBlob((blob) => {
          if (!blob || disposed || bakedFor !== mode) return;
          const url = URL.createObjectURL(blob);
          const probe = new Image();
          probe.src = url;
          probe
            .decode()
            .catch(() => undefined)
            .then(() => {
              if (disposed || bakedFor !== mode) {
                URL.revokeObjectURL(url);
                return;
              }
              img.src = url;
              portrait.setAttribute(BAKED_ATTR, "baked");
              if (shownUrl) URL.revokeObjectURL(shownUrl);
              shownUrl = url;
            });
        }, "image/png");
      });
    };

    bake(readThemeMode());
    const unsubscribe = useThemeStore.subscribe((state, prev) => {
      if (state.mode !== prev.mode) bake(state.mode);
    });

    return () => {
      disposed = true;
      unsubscribe();
      if (shownUrl) URL.revokeObjectURL(shownUrl);
    };
  }, []);
}
