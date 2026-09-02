"use client";

import { memo } from "react";

/**
 * The REAL HUD frame — the parse-injected markup and nothing else.
 *
 * The rails, the corner brackets and the wordmark are the site's own
 * `hudHtml`, byte for byte: `sliceV7Sections([])` in the route reads the
 * prototype off disk and this div injects it. No `RailManifestController`,
 * no `HudNav`, no `RailInstruments` — each of those drags landing state (the
 * scroll writer, the station attributes, auth) into a page that has none.
 * The game writes its own values into the same seats (hud.css).
 *
 * ⚠ RENDER-STABLE BY CONTRACT. Memoised on a prop that never changes and
 * mounted at a fixed, unkeyed position in the shell. A remount re-applies the
 * innerHTML and would orphan anything the engine has appended into the rails.
 */
function HudFrameImpl({ hudHtml }: { hudHtml: string }) {
  return (
    <div
      className="lf-hud-root"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: hudHtml }}
    />
  );
}

export const HudFrame = memo(HudFrameImpl);
