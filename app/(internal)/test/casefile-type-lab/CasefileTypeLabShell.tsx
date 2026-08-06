"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

import { ServicesCasefile } from "@/components/landing/home-v2/services/casefile/ServicesCasefile";

/**
 * The three arrangements, in the order the question was asked so each step
 * is separable — `prose` isolates the width cost, `pairing` adds the
 * heading change on top of it.
 */
type Scope = "house" | "prose" | "pairing";

const SCOPES: readonly { id: Scope; label: string; note: string }[] = [
  { id: "house", label: "House", note: "PP Neue Montreal, headings and prose — what ships today" },
  { id: "prose", label: "Haas prose", note: "paragraphs in Haas, headings still PP Neue" },
  { id: "pairing", label: "Mono + Haas", note: "headings PT Mono, prose Haas — no PP Neue left" },
];

/**
 * ⚠ THE CASEFILE'S ARRIVAL IS PARKED, NOT DISABLED. `.fl-case` is
 * `visibility: hidden` until `.services-stage[data-proof-live]`, and every
 * panel travels on `--ci-off` against `--svc-proof-in` / `--svc-proof-out`.
 * The lab stands in for the corridor's scroll rig by declaring the END STATE:
 * live, settled, fully arrived, nothing departing.
 *
 * MODULE CONSTANT on purpose — a fresh literal each render re-applies the
 * style attribute, and the casefile's own style observer watches exactly
 * these properties.
 */
const STAGE_STYLE = {
  "--svc-proof-in": "1",
  "--svc-proof-out": "0",
  "--svc-proof-browse": "0",
  "--svc-content-in": "1",
} as CSSProperties;

export function CasefileTypeLabShell({ hudHtml }: { hudHtml: string }) {
  const [scope, setScope] = useState<Scope>("pairing");
  const hudRef = useRef<HTMLDivElement>(null);

  /**
   * The `<html>` bus. The HUD chrome takes no props and resolves its state
   * from document level, so the lab has to say where we are parked.
   * `data-corridor-engaged` is deliberately NOT set — it would route the
   * readout down the corridor branch and light the wrong station.
   */
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("data-active-station", "services");
    return () => html.removeAttribute("data-active-station");
  }, []);

  /**
   * ⚠ `--hero-lift: 1` OR THE RAILS CLIP AWAY. ADR-031 U16 reveals the frame
   * by CLIPPING each element to the hero's bottom edge, and the inset only
   * saturates to 0 once the hero has fully left (`lift → 1`). On a page with
   * no hero the property is absent, the clip resolves to the full viewport,
   * and the rail — with it every `--fl-t*` the casefile measures — is
   * invisible. Learned the hard way on the anchor lab.
   */
  useEffect(() => {
    const html = document.documentElement;
    html.style.setProperty("--hero-lift", "1");
    html.style.setProperty("--hero-cover", "1");
    return () => {
      html.style.removeProperty("--hero-lift");
      html.style.removeProperty("--hero-cover");
    };
  }, []);

  return (
    <div className="ctl-root" data-lab-face={scope}>
      {/* The real parse-injected HUD. It is here for the RAIL: the casefile's
          `--fl-t*` ladder is measured off `.hud__rail`'s live box, so without
          it every box in the left column resolves against nothing. */}
      <div className="ctl-hud" ref={hudRef} dangerouslySetInnerHTML={{ __html: hudHtml }} />

      {/* `.stations`' own content box — the casefile is inset by
          `--hud-content-inset` in production and would sit a full inset too
          far outboard without it. */}
      <div className="ctl-stationbox">
        <div
          className="services-stage ctl-stage"
          data-proof-live
          data-proof-settled
          style={STAGE_STYLE}
        >
          <ServicesCasefile />
        </div>
      </div>

      <div className="ctl-console" role="group" aria-label="Type lab controls">
        <span className="ctl-console__title">Sans role</span>
        {SCOPES.map((s) => (
          <button
            key={s.id}
            type="button"
            className="ctl-console__btn"
            data-on={scope === s.id || undefined}
            aria-pressed={scope === s.id}
            title={s.note}
            onClick={() => setScope(s.id)}
          >
            {s.label}
          </button>
        ))}
        <span className="ctl-console__note">{SCOPES.find((s) => s.id === scope)?.note}</span>
      </div>
    </div>
  );
}
