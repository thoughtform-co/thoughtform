"use client";

import { useEffect, useRef } from "react";

import type { ArcMotion, ArcSectionOf } from "@/lib/arcs/types";

import { ArcBeat } from "./ArcBeat";
import { ArcSectionHead } from "./ArcSectionHead";
import { rung } from "./arcMotion";
import { arcTitleText } from "./chrome";

interface ArcConfigurationProps {
  section: ArcSectionOf<"configuration">;
  index: number;
  motion?: ArcMotion;
}

/**
 * ArcConfiguration — what the client's team ends up owning, as ONE
 * instrument with a picker (ADR-098, porting ADR-094 U7).
 *
 * Three bands on one hairline plate: the LAYER they own on the left, four
 * rows that dim unless the picked team reads them; the SEAM across the
 * middle, adoption writing the layer and automation running on it, each a
 * 1px `<i>` run with a border-drawn head (the wireframe law — never an svg
 * stroke); the WORK on the right, the teams as pickable tiles over the
 * picked team's configuration in the five questions the registry asks.
 *
 * ⚠ THE RESTING STATE IS AUTHORED. The first team renders selected and its
 * rows lit, so the drawing reads whole in the static render, with no JS,
 * and under reduced motion. The effect below adds the PICK and nothing
 * else — which is also why the readout's copy is real DOM text rather than
 * React state: a server render that showed an empty panel would be a
 * drawing that needs JavaScript to say anything.
 *
 * ⚠ ONE DELEGATED LISTENER, on this component's own root. The pitch page
 * needed that because its body is `dangerouslySetInnerHTML`; here it is
 * cheaper than n listeners and the idiom is the same, so the two surfaces
 * behave identically under a keyboard.
 *
 * ⚠ ITS ATTRIBUTES ARE `data-cfg-*`, NEVER `data-arc-*`.
 * `arc-terminal-markup.test.tsx` asserts a reveal page emits no
 * `data-arc-*` at all — that is what makes "the v1 pages were not touched"
 * a property of the code. A drawing's own channel does not get to blur it.
 *
 * Terminal rungs: the head is the still masthead (0.06) and the only
 * decode target; the plate is an aperture at 0.14 and so leaves LAST on
 * the fold — the instrument outlives its content, the dossier's law.
 */
const KEYS = ["owner", "runs", "bar", "reach", "where"] as const;

export function ArcConfiguration({ section, index, motion = "reveal" }: ArcConfigurationProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const first = section.teams[0];

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const tiles = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-cfg-pick]"));
    const rows = Array.from(root.querySelectorAll<HTMLElement>("[data-cfg-layer]"));
    const out = new Map<string, HTMLElement>();
    root.querySelectorAll<HTMLElement>("[data-cfg-out]").forEach((el) => {
      const key = el.getAttribute("data-cfg-out");
      if (key) out.set(key, el);
    });
    if (tiles.length === 0) return;

    const pick = (tile: HTMLButtonElement) => {
      for (const t of tiles) {
        const on = t === tile;
        t.classList.toggle("is-on", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
      }
      const lit = new Set(
        (tile.getAttribute("data-cfg-layers") ?? "").split(/\s+/).filter(Boolean)
      );
      for (const row of rows) {
        row.classList.toggle("is-on", lit.has(row.getAttribute("data-cfg-layer") ?? ""));
      }
      const nameEl = out.get("name");
      if (nameEl) nameEl.textContent = tile.querySelector(".arc-cfg__tname")?.textContent ?? "";
      for (const key of KEYS) {
        const el = out.get(key);
        if (el) el.textContent = tile.getAttribute(`data-cfg-${key}`) ?? "";
      }
    };

    const onClick = (event: MouseEvent) => {
      const tile = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>(
        "[data-cfg-pick]"
      );
      if (tile && root.contains(tile)) pick(tile);
    };
    // Arrow keys walk the tablist because the tiles are `role="tab"`;
    // Enter and Space are the button's own and need nothing here.
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      const tile = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>(
        "[data-cfg-pick]"
      );
      if (!tile) return;
      const i = tiles.indexOf(tile);
      const next = tiles[(i + (event.key === "ArrowRight" ? 1 : tiles.length - 1)) % tiles.length];
      if (!next) return;
      event.preventDefault();
      next.focus();
      pick(next);
    };

    root.addEventListener("click", onClick);
    root.addEventListener("keydown", onKey);
    return () => {
      root.removeEventListener("click", onClick);
      root.removeEventListener("keydown", onKey);
    };
  }, [section.teams]);

  if (!first) return null;

  return (
    <ArcBeat
      id={section.id}
      kind="configuration"
      className="arc-section arc-sec arc-sec--cfg"
      ariaLabel={section.ariaLabel ?? arcTitleText(section.head.title)}
      motion={motion}
    >
      <div className="arc-band">
        <ArcSectionHead
          head={section.head}
          kind="configuration"
          index={index}
          sectionId={section.id}
          motion={motion}
        />
        <div
          ref={rootRef}
          className="arc-cfg arc-reveal"
          role="group"
          aria-label={`The configuration: the layer the team owns, the teams that run on it, and what each one is set up to do.`}
          {...rung(motion, 0.14)}
        >
          <div className="arc-cfg__band arc-cfg__band--layer">
            <div className="arc-cfg__lhead">
              <strong>The layer</strong>
              <span>{section.owner}</span>
            </div>
            <ul className="arc-cfg__layers" role="list">
              {section.layer.map((row) => (
                <li
                  key={row.id}
                  className={`arc-cfg__layer${first.layers.includes(row.id) ? " is-on" : ""}`}
                  data-cfg-layer={row.id}
                >
                  <span className="arc-cfg__tag">{row.tag}</span>
                  <span className="arc-cfg__name">{row.name}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="arc-cfg__band arc-cfg__band--seam">
            <div className="arc-cfg__arrow arc-cfg__arrow--adopt">
              <span className="arc-cfg__word">Adoption</span>
              <i aria-hidden="true" />
              <span className="arc-cfg__note">{section.seam.adoption}</span>
            </div>
            <div className="arc-cfg__arrow arc-cfg__arrow--auto">
              <span className="arc-cfg__word">Automation</span>
              <i aria-hidden="true" />
              <span className="arc-cfg__note">{section.seam.automation}</span>
            </div>
          </div>

          <div className="arc-cfg__band arc-cfg__band--work">
            <div className="arc-cfg__tiles" role="tablist" aria-label="The teams on the layer">
              {section.teams.map((team, ti) => (
                <button
                  key={team.id}
                  type="button"
                  className={`arc-cfg__tile${ti === 0 ? " is-on" : ""}`}
                  role="tab"
                  aria-selected={ti === 0}
                  data-cfg-pick=""
                  data-cfg-layers={team.layers.join(" ")}
                  data-cfg-owner={team.owner}
                  data-cfg-runs={team.runs}
                  data-cfg-bar={team.bar}
                  data-cfg-reach={team.reach}
                  data-cfg-where={team.where}
                >
                  <span className="arc-cfg__tname">{team.name}</span>
                  <span className="arc-cfg__twork">{team.work}</span>
                </button>
              ))}
              {section.next ? (
                /* The ghost: named, unpickable, and the only bracket on the
                   drawing — the workflow after these, which is not scoped
                   yet and should not pretend to be. */
                <span className="arc-cfg__tile arc-cfg__tile--ghost" aria-hidden="true">
                  <span className="arc-cfg__tname">{section.next.name}</span>
                  <span className="arc-cfg__twork">{section.next.work}</span>
                </span>
              ) : null}
            </div>
            <div className="arc-cfg__cfg" role="tabpanel" aria-live="polite">
              <div className="arc-cfg__chead">
                <span data-cfg-out="name">{first.name}</span> · the intelligence configuration
              </div>
              <dl className="arc-cfg__kv">
                <div>
                  <dt>Who owns it</dt>
                  <dd data-cfg-out="owner">{first.owner}</dd>
                </div>
                <div>
                  <dt>What runs it</dt>
                  <dd data-cfg-out="runs">{first.runs}</dd>
                </div>
                <div>
                  <dt>The bar</dt>
                  <dd data-cfg-out="bar">{first.bar}</dd>
                </div>
                <div>
                  <dt>What it can reach</dt>
                  <dd data-cfg-out="reach">{first.reach}</dd>
                </div>
                <div>
                  <dt>Where it runs</dt>
                  <dd data-cfg-out="where">{first.where}</dd>
                </div>
              </dl>
            </div>
          </div>

          {section.kickers && section.kickers.length > 0 ? (
            <ul className="arc-cfg__kickers">
              {section.kickers.map((kicker) => (
                <li key={kicker} className="arc-cfg__kicker">
                  {kicker}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </ArcBeat>
  );
}
