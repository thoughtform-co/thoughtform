"use client";

import type { ReactNode } from "react";

import { VariantStrip } from "./VariantStrip";
import type { Variant } from "./variants";

/**
 * LabShell — the page bed every variant shares.
 *
 * It mounts the REAL HUD frame (parsed from the v7 prototype server-side, exactly
 * as the other look-dev labs do — the casefile's whole geometry hangs off that
 * rail's 13-tick ladder, so an instrument can only be judged inside it), the
 * variant strip, and the desktop-band gate.
 *
 * TWO STAGE MODES, and the difference is the point:
 *   `casefile`  the variant is an instrument for the proof panel, so it is
 *               judged inside `.fl-case` — real tabs, real brief, real proof
 *               register, real directory, real foot telemetry.
 *   `full`      the variant is an owner-authored standalone page or a contact
 *               sheet. Wrapping either in casefile chrome would be a lie about
 *               what it is, so it gets the whole stage.
 */
export function LabShell({
  hudHtml,
  bodyClass,
  variant,
  mode,
  children,
}: {
  hudHtml: string;
  bodyClass: string;
  variant: Variant;
  mode: "casefile" | "full";
  children: ReactNode;
}) {
  return (
    <main
      className={`iml-lab home-v2-root ${bodyClass}`}
      data-theme="dark"
      data-variant={variant.id}
    >
      <div
        className="iml-lab__hud home-v2-hud-root"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: hudHtml }}
      />

      <VariantStrip active={variant} />

      {mode === "casefile" ? (
        <div className="iml-lab__stage">{children}</div>
      ) : (
        <div className="iml-lab__full">{children}</div>
      )}

      <p className="iml-lab__gate">Widen to ≥1101×700 — the panel is judged on the desktop band.</p>
    </main>
  );
}
