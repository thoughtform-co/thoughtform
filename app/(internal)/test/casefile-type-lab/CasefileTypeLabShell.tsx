"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";

import { ServicesCasefile } from "@/components/landing/home-v2/services/casefile/ServicesCasefile";

/**
 * The FACE axis — five complete pairings, chrome face and prose face.
 *
 * ⚠ THE LABELS ARE CODENAMES ON PURPOSE. The console is one line pinned to
 * the bottom of the viewport, and it was ALREADY wrapping to two rows at
 * three options — measured 925px wide at 1849px, with `Mono + Haas` alone
 * costing 94px. Five descriptive labels do not fit at 1280. So the button
 * carries four characters and the note line, which already existed, carries
 * the two real family names.
 */
type Face = "house" | "haas" | "space" | "plex" | "b612";

const FACES: readonly { id: Face; code: string; mono: string; sans: string; note: string }[] = [
  {
    id: "house",
    code: "HOUSE",
    mono: "PT Mono",
    sans: "PP Neue Montreal",
    note: "what ships today — the control",
  },
  {
    id: "haas",
    code: "HAAS",
    mono: "PT Mono",
    sans: "Alte Haas Grotesk",
    note: "letterpress Helvetica · floored at 14px · no → in its cmap",
  },
  {
    id: "space",
    code: "SPACE",
    mono: "Space Mono",
    sans: "Space Grotesk",
    note: "Colophon, drawn from Microgramma/Eurostile · display-brief, prove it at 10px",
  },
  {
    id: "plex",
    code: "PLEX",
    mono: "IBM Plex Mono",
    sans: "Geist",
    note: "already in the bundle · 0.600em, same as PT Mono · matches the map plate",
  },
  {
    id: "b612",
    code: "B612",
    mono: "B612 Mono",
    sans: "B612",
    note: "Airbus cockpit legibility research · 0.65em, the widest cell here",
  },
];

/**
 * The SCALE axis, independent of the face. Family and ladder answer different
 * halves of "the fonts are inconsistent" — the surface can carry five faces on
 * one ladder or one face on seven ladders, and only judging them apart tells
 * you which complaint is which.
 */
type Ladder = "as-is" | "harmonised";

const LADDERS: readonly { id: Ladder; label: string; note: string }[] = [
  { id: "as-is", label: "As-is", note: "7 mono sizes · 6 tracking values · 700 doing five jobs" },
  {
    id: "harmonised",
    label: "Ladder",
    note: "4 rungs at ×1.26 · weight only on display · label .16em / text .06em",
  },
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
  const [face, setFace] = useState<Face>("house");
  const [ladder, setLadder] = useState<Ladder>("harmonised");
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

  /**
   * Number keys switch faces, `0` toggles the scale. Comparing type means
   * flicking between two states repeatedly and watching ONE line — aiming a
   * pointer at a 17px target between each look is how you lose the comparison.
   *
   * ⚠ Bound on `window`, not on the casefile: the surface's own plate handlers
   * (`.claude/rules/proof.md` — "keys bind on the PLATE, not `document`") own
   * arrows and Escape, and this must not shadow them. Digits are unclaimed.
   * Guarded on modifiers and on typing targets so it stays inert in a field.
   */
  const onKey = useCallback((e: KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const t = e.target as HTMLElement | null;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    if (e.key === "0") {
      setLadder((l) => (l === "as-is" ? "harmonised" : "as-is"));
      return;
    }
    const i = Number(e.key);
    if (Number.isInteger(i) && i >= 1 && i <= FACES.length) setFace(FACES[i - 1].id);
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onKey]);

  const activeFace = FACES.find((f) => f.id === face);

  return (
    <div className="ctl-root" data-lab-face={face} data-lab-ladder={ladder}>
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
        <span className="ctl-console__title">Face</span>
        {FACES.map((f, i) => (
          <button
            key={f.id}
            type="button"
            className="ctl-console__btn"
            data-on={face === f.id || undefined}
            aria-pressed={face === f.id}
            title={`${i + 1} · ${f.mono} + ${f.sans} — ${f.note}`}
            onClick={() => setFace(f.id)}
          >
            {f.code}
          </button>
        ))}
        <span className="ctl-console__rule" aria-hidden="true" />
        <span className="ctl-console__title">Scale</span>
        {LADDERS.map((l) => (
          <button
            key={l.id}
            type="button"
            className="ctl-console__btn"
            data-on={ladder === l.id || undefined}
            aria-pressed={ladder === l.id}
            title={`0 · ${l.note}`}
            onClick={() => setLadder(l.id)}
          >
            {l.label}
          </button>
        ))}
        <span className="ctl-console__note">
          {activeFace ? `${activeFace.mono} + ${activeFace.sans} — ${activeFace.note}` : ""}
        </span>
      </div>
    </div>
  );
}
