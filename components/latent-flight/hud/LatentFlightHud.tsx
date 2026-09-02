"use client";

import { memo } from "react";

import { SECTION_GLYPHS } from "@/components/landing/v7/rail-instruments/sectionGlyphs";
import { STRINGS } from "@/lib/latent-flight/boot/bootTimeline";
import { WAYPOINTS, WAYPOINT_COUNT } from "@/lib/latent-flight/content/waypoints";

/**
 * LatentFlightHud — the glass HUD and the game's seats in the frame, as DOM.
 *
 * Rendered ONCE and never re-rendered: every value a frame changes is
 * written by `HudSystem` through the `data-lf*` handles below, so React's
 * job ends at the skeleton. The layering (hud.css): the world canvas under,
 * this layer at z 40, the site's rails and corners at z 50 above.
 *
 * ONE accessible list. The TL route (`<nav>` of buttons, the site's journey
 * row in the site's glyphs) is the keyboard and screen-reader surface for
 * the seven destinations; the glass diamonds in the world are pointer
 * targets only (`aria-hidden`, out of the tab order), or every waypoint
 * would be two tab stops.
 */

/** The heading tape: ±60° of ticks every 5°, majors every 30°, so the ±40°
 *  window has a margin to scroll into. 7 px per degree. */
const TAPE_PX_PER_DEG = 7;
const TAPE_TICKS = Array.from({ length: 25 }, (_, i) => (i - 12) * 5);

function tapeLabel(deg: number): string {
  return String(((deg % 360) + 360) % 360).padStart(3, "0");
}

function Bracket({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  return <i className={`lf-br lf-br--${pos}`} aria-hidden="true" />;
}

function TagPair({ k, v, kHandle, vHandle }: { k: string; v: string; kHandle: string; vHandle: string }) {
  return (
    <span className="lf-tag__pair">
      <b className="lf-tag__k" data-lf={kHandle}>
        {k}
      </b>
      <b className="lf-tag__v" data-lf={vHandle}>
        {v}
      </b>
    </span>
  );
}

function Meter({ handle, label }: { handle: string; label: string }) {
  return (
    <div className={`lf-meter lf-meter--${handle}`} data-lf={handle} aria-hidden="true">
      <b className="lf-meter__k">{label}</b>
      <span className="lf-meter__segs">
        {Array.from({ length: 8 }, (_, i) => (
          <i key={i} />
        ))}
      </span>
    </div>
  );
}

function LatentFlightHudImpl() {
  return (
    <div className="lf-hud" role="region" aria-label="Flight instruments" data-lf="hud">
      {/* TL — the route, in the journey row's seat */}
      <nav className="lf-route" aria-label="Waypoints" data-lf="route">
        <ol className="lf-route__list">
          {WAYPOINTS.map((w, i) => (
            <li key={w.id} className="lf-route__seat">
              <button
                type="button"
                className="lf-route__mark"
                data-lf-route={w.id}
                data-state={i === 0 ? "here" : "ahead"}
                aria-current={i === 0 ? "location" : undefined}
                aria-label={`Lock ${w.name}, waypoint ${i + 1} of ${WAYPOINT_COUNT}`}
              >
                {SECTION_GLYPHS[w.glyph] ?? null}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      {/* TR — the state word, in the corner readout's grammar */}
      <div className="lf-state" data-lf="state" aria-hidden="true">
        <span className="lf-state__word" data-lf="state-word" />
        <span className="lf-state__sep">{"//"}</span>
        <span className="lf-state__name" data-lf="state-name" />
      </div>

      {/* top centre — the heading tape */}
      <div className="lf-tape" data-lf="tape" aria-hidden="true">
        <div className="lf-tape__strip" data-lf="tape-strip">
          {TAPE_TICKS.map((deg) => {
            const major = deg % 30 === 0;
            const style = { left: `calc(50% + ${deg * TAPE_PX_PER_DEG}px)` };
            return (
              <span key={deg} className="lf-tape__seat" style={style} data-deg={deg}>
                <i className={major ? "lf-tape__tick lf-tape__tick--major" : "lf-tape__tick"} />
                {major ? <b className="lf-tape__label">{tapeLabel(deg)}</b> : null}
              </span>
            );
          })}
        </div>
        <i className="lf-tape__line" />
        <i className="lf-tape__index" />
        <b className="lf-tape__box" data-lf="heading">
          000
        </b>
        <i className="lf-tape__target" data-lf="tape-target" hidden />
      </div>

      {/* the glass — projected course lines */}
      <svg className="lf-glass" data-lf="glass" aria-hidden="true" focusable="false">
        {WAYPOINTS.slice(1).map((w, i) => (
          <path key={w.id} className="lf-leg" data-lf-leg={i} d="" />
        ))}
      </svg>

      {/* the glass — projected marks */}
      <div className="lf-marks" data-lf="marks">
        {WAYPOINTS.map((w, i) => (
          <button
            key={w.id}
            type="button"
            className="lf-wp"
            data-lf-wp={w.id}
            data-state={i === 0 ? "here" : "ahead"}
            data-q="0"
            tabIndex={-1}
            aria-hidden="true"
            hidden
          >
            <i className="lf-wp__diamond" />
            <span className="lf-wp__label">{w.name}</span>
            <i className="lf-wp__chevron" />
          </button>
        ))}

        <div className="lf-beacon" data-lf="beacon" aria-hidden="true" hidden>
          <Bracket pos="tl" />
          <Bracket pos="tr" />
          <Bracket pos="bl" />
          <Bracket pos="br" />
          <div className="lf-tag">
            <TagPair k={STRINGS.beacon.key1} v="" kHandle="beacon-k1" vHandle="beacon-v1" />
            <TagPair k={STRINGS.beacon.key2} v="" kHandle="beacon-k2" vHandle="beacon-v2" />
          </div>
        </div>

        <div className="lf-target" data-lf="target" aria-hidden="true" hidden>
          <div className="lf-target__box" data-lf="target-box">
            <Bracket pos="tl" />
            <Bracket pos="tr" />
            <Bracket pos="bl" />
            <Bracket pos="br" />
          </div>
          <div className="lf-tag">
            <TagPair k={STRINGS.keys.target} v="" kHandle="target-k1" vHandle="target-v1" />
            <TagPair k={STRINGS.keys.range} v="" kHandle="target-k2" vHandle="target-v2" />
          </div>
        </div>
      </div>

      {/* centre — the reticle, the boresight, the two flank meters */}
      <div className="lf-reticle" data-lf="reticle" aria-hidden="true">
        <div className="lf-reticle__look" data-lf="look">
          <svg viewBox="0 0 128 128" className="lf-reticle__svg" focusable="false">
            <polygon className="lf-reticle__diamond" points="64,16 112,64 64,112 16,64" />
            <path className="lf-reticle__ticks" d="M64 16V9M112 64h7M64 112v7M16 64H9" />
            <path
              className="lf-reticle__brackets"
              d="M16 28V16h12M100 16h12v12M112 100v12h-12M28 112H16v-12"
            />
            <path
              className="lf-reticle__thirds"
              data-lf="thirds"
              d="M80 32l2.1-2.1M96 48l2.1-2.1M96 80l2.1 2.1M80 96l2.1 2.1M48 96l-2.1 2.1M32 80l-2.1 2.1M32 48l-2.1-2.1M48 32l-2.1-2.1"
            />
          </svg>
        </div>
        <i className="lf-reticle__boresight" />
        <Meter handle="thr" label={STRINGS.keys.thr} />
        <Meter handle="sig" label={STRINGS.keys.sig} />
      </div>

      {/* bottom centre — the log and the key row */}
      <div className="lf-comms" data-lf="comms" aria-hidden="true" />
      <div className="lf-keys" data-lf="keys">
        <button type="button" className="lf-key" data-lf-action="engage" aria-disabled="true">
          <kbd>Space</kbd>
          <span>Engage</span>
        </button>
        <button type="button" className="lf-key" data-lf-action="next">
          <kbd>Tab</kbd>
          <span>Next target</span>
        </button>
        <span className="lf-key lf-key--hint">
          <kbd>1–7</kbd>
          <span>Lock</span>
        </span>
        <span className="lf-key lf-key--hint">
          <kbd>Esc</kbd>
          <span>Release</span>
        </span>
      </div>

      <output className="lf-sr" aria-live="polite" data-lf="live" />
    </div>
  );
}

export const LatentFlightHud = memo(LatentFlightHudImpl);
