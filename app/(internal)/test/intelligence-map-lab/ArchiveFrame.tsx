"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

/**
 * ArchiveFrame — one of the owner's standalone HTML prototypes, embedded whole.
 *
 * WHY `srcDoc` AND NOT `src`. Every response in this app carries
 * `X-Frame-Options: DENY` (`lib/security/headers.mjs`), and DENY blocks a
 * SAME-ORIGIN frame exactly as hard as a cross-origin one — a route handler
 * serving the file would render an empty box. A `srcdoc` document has no HTTP
 * response of its own, so no frame header can apply to it. The page's CSP is
 * delivered `Report-Only`, so his inline `<style>` and `<script>` run untouched
 * and the prototype behaves exactly as it does off disk: its own chrome, its own
 * theme chip, its own wheel handling, its own autoplay.
 *
 * WHY IT IS LAID OUT AT 1440 AND THEN SCALED. All three of his pages collapse to
 * a single column under `@media (max-width: 1220px)`, and the lab's stage is
 * ~1020px at 1280 — so an unscaled frame showed his project panel and hid the
 * console entirely, which is the one thing anyone comes to this variant to see.
 * The frame is therefore given his own desktop measure and scaled to fit, which
 * trades type size for the WHOLE COMPOSITION. That is the right trade here and
 * the wrong one for v4/v5: those are judged at real px inside the casefile, and
 * this is an archive of a page that no longer has to fit anything.
 *
 * ⚠ THE FILES ARE BYTE-EXACT AND THAT IS DELIBERATE. Two of them (prototype v1
 * and v2) still contain the vendor/model strings the port replaced with generic
 * capability lanes. Rewriting an archived artifact would make the archive a lie
 * about what was designed, so they are preserved as authored. They are reachable
 * only from this dev-only, `noindex`, proxy-blocked route and nothing under
 * `lib/cases/**` or any public surface reads them — but the archive is the ONE
 * place in the repo where those strings exist, and that is a scoped, deliberate
 * exception rather than an oversight.
 */

const LAYOUT_W = 1440;
const LAYOUT_H = 960;

export function ArchiveFrame({ title, html }: { title: string; html: string }) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  /* Scale AND offset, both from JS. `transform` does not change layout, so a
     centred grid item would be laid out at its unscaled 1440 and centred on
     THAT — measured, and it put the frame 200px off. Anchoring top-left and
     computing the offset from the scaled size is the only version that lands. */
  const [fit, setFit] = useState({ scale: 1, x: 0, y: 0 });

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const read = () => {
      const r = el.getBoundingClientRect();
      const scale = Math.min(1, (r.width - 4) / LAYOUT_W, (r.height - 20) / LAYOUT_H);
      setFit({
        scale,
        x: Math.max(0, (r.width - LAYOUT_W * scale) / 2),
        y: Math.max(0, (r.height - 16 - LAYOUT_H * scale) / 2),
      });
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="iml-arch" ref={hostRef}>
      <div
        className="iml-arch__scaler"
        style={
          {
            "--iml-arch-scale": fit.scale,
            left: Math.round(fit.x),
            top: Math.round(fit.y),
          } as CSSProperties
        }
      >
        <iframe
          className="iml-arch__frame"
          title={title}
          srcDoc={html}
          width={LAYOUT_W}
          height={LAYOUT_H}
        />
      </div>
      <p className="iml-arch__note">
        OWNER-AUTHORED PAGE, BYTE-EXACT · LAID OUT AT {LAYOUT_W}PX AND SCALED TO{" "}
        {Math.round(fit.scale * 100)}% · SCROLL AND CLICK INSIDE IT
      </p>
    </div>
  );
}
