"use client";

import { useEffect, useMemo, useState } from "react";

import {
  HoloDatumPanels,
  eraPositionLabel,
} from "@/components/landing/home-v2/voidwalker/hologram/HoloDatumPanels";
import { HoloFigure } from "@/components/landing/home-v2/voidwalker/hologram/HoloFigure";
import { VoidwalkerHologram } from "@/components/landing/home-v2/voidwalker/hologram/VoidwalkerHologram";
import {
  CHARACTER_ERAS,
  resolveCharacterEraHologram,
  type CharacterEraId,
} from "@/lib/voidwalker/characterEras";
import { getHoloAlphaSupport, onHoloAlphaSupport } from "@/lib/voidwalker/holoAlphaSupport";
import { voidwalkerEraScrubRef } from "@/lib/voidwalker/voidwalkerHologramClock";

import { Bracket, CornerLabels, FootRow, Housing, Reticles } from "../chrome/HplChrome";
import type { HplChrome, HplDirectionId } from "../variants";

/**
 * The ERAS surface — the Voidwalker character stage.
 *
 * ⚠ `HoloDatumPanels` IS MOUNTED WHOLE, IN EVERY DIRECTION. Nothing inside it
 * is exported — the reel's roving focus and its `--vwd-i`/`--vwd-d`
 * arithmetic, the bust head anchors, the four seats, the destructive decode's
 * ghost/live line pairs, the film lightbox — so "reuse the chip band" means
 * reusing the component. A lab-local composition would fork ~250 lines of
 * behaviour, which is the drift the datum lab's own header forbids. The lab
 * owns exactly two seams: the `figure` prop, and CSS scoped by
 * `[data-hpl-dir]`.
 *
 * ⚠ THE FIGURE MOUNTS ONLY AFTER THE ALPHA PROBE SETTLES. `HoloFigure` LOCKS
 * `getHoloAlphaSupport() === true` at mount and treats the undecided `null` as
 * the fail-safe floor branch — correct on the landing, where the station is
 * four sections down and the probe has long settled, and wrong here, where the
 * figure is the first thing on the page. On the floor branch a headless
 * capture gets the H.264 `.mp4` it cannot decode, falls back to the opaque
 * `.jpg` poster and paints a black pane: a frame that looks exactly like a
 * broken composition.
 *
 * ⚠ `data-vwh-ready` IS NEVER SET ON `.vwd`. It arms the §G motion block, and
 * the first thing that block does is `.vwh__slot { opacity: var(--vwh-morph,
 * 0) }` — the figure would vanish. Absent, every actor rests resolved, which
 * is the state a composition is judged in.
 *
 * ⚠ THE DATUM RAISE IS RE-DECLARED IN THE LAB SHEET, not here. Production
 * gates it on `#voidwalker[data-vw-mode="hologram"]`, which no lab can satisfy;
 * without the re-declaration the block hangs ~82px higher than the landing
 * with a figure column ~15px wider — a window that lies about what it looks
 * onto.
 */

export function ErasSurface({
  chrome,
  dir,
  era,
  onEra,
}: {
  chrome: HplChrome;
  dir: HplDirectionId;
  era: CharacterEraId;
  onEra: (id: CharacterEraId) => void;
}) {
  const isControl = dir === "v0";
  const eraIdx = Math.max(
    0,
    CHARACTER_ERAS.findIndex((e) => e.id === era)
  );
  const record = CHARACTER_ERAS[eraIdx] ?? CHARACTER_ERAS[0];

  const [reduced, setReduced] = useState(false);
  const [alphaSettled, setAlphaSettled] = useState(() => getHoloAlphaSupport() !== null);
  /** Bumped only by a deliberate pick, exactly as production does. */
  const [epoch, setEpoch] = useState(0);

  /* eslint-disable react-hooks/set-state-in-effect -- two external systems
     (a media query and the decode probe), each subscribed once. */
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (getHoloAlphaSupport() !== null) {
      setAlphaSettled(true);
      return;
    }
    return onHoloAlphaSupport(() => setAlphaSettled(true));
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  /* ── `?era=` on the CONTROL ───────────────────────────────────────────
     `VoidwalkerHologram` owns its own era state; production's scroll writer
     hands it an index through this slot, and so does the lab. A scrubbed
     arrival is deliberately NOT an epoch bump — it must not restart the
     figure's 900ms materialize. */
  useEffect(() => {
    if (!isControl) return;
    /* ⚠ A TASK, NOT A FRAME. rAF stalls to a standstill in a hidden document —
       the in-app browser pane, a background tab — and a deep link that only
       applies when someone is looking is a deep link a capture cannot trust.
       Nothing here depends on layout: it just has to run after the child's
       own mount effect has registered the slot. */
    const t = window.setTimeout(() => voidwalkerEraScrubRef.current?.(eraIdx), 0);
    return () => window.clearTimeout(t);
  }, [isControl, eraIdx]);

  const hologram = resolveCharacterEraHologram(record);

  /* The SAME node production builds — `HoloFigure` carries the `portrait`
     handoff target, so it is built once and handed down rather than being a
     sibling of the composition. */
  const figure = useMemo(() => {
    const column = (
      <div className="vwh__column" data-vwh-region="figure">
        <HoloFigure
          hologram={hologram}
          epoch={epoch}
          form="emissive"
          blend="plus-lighter"
          alpha={0.92}
          scanPitch={3}
          glow={1}
          reduced={reduced}
          /* Production's value: the mount is at rest and only a deliberate
             era pick runs the finite materialize. `timed` would replay a
             900ms reveal on every capture frame. */
          initialMaterialization="scroll"
        />
        {/* The projector base is a DOM mock in every non-landing home — on
            the real page the site's own brandmark descends into it. */}
        <div className="vwh__base" data-vwh-region="platform" aria-hidden="true">
          <span className="vwh__base__disc" />
          <span className="vwh__base__ring" />
          <span className="vwh__base__glow" />
        </div>
      </div>
    );

    if (!chrome.bracket && !chrome.corners && !chrome.reticles) return column;

    /* THE BAY. The one place the lab adds DOM inside the composition, through
       the prop the composition already exposes. ⚠ It must be
       `position: relative; height: 100%` or `.vwh__column { height: 100% }`
       resolves against nothing and the figure hangs below its slot. */
    return (
      <div className="hpl-bay" data-hpl-chrome="bay">
        {chrome.bracket ? <Bracket /> : null}
        {/* v6's registration pair — TR + BL, the casefile's own reticle. */}
        {chrome.reticles ? <Reticles /> : null}
        {chrome.corners ? (
          <CornerLabels
            tl="Figure"
            tr={eraPositionLabel(eraIdx)}
            bl={record.short}
            br={record.year}
          />
        ) : null}
        {column}
      </div>
    );
  }, [hologram, epoch, reduced, chrome.bracket, chrome.corners, chrome.reticles, eraIdx, record]);

  if (isControl) {
    /* ⚠ MOUNTED BARE, AND THAT IS A RESOLVED COMPOSITION RATHER THAN A DEAD
       ONE. `useVoidwalkerHologramScroll` returns before writing anything when
       the root has no `#voidwalker` ancestor, so nothing arms `data-vwh-ready`
       and every actor rests at its final. */
    return (
      <div className="hpl-eras hpl-eras--control">
        {alphaSettled ? <VoidwalkerHologram /> : null}
      </div>
    );
  }

  const pick = (i: number) => {
    const next = CHARACTER_ERAS[i];
    if (!next) return;
    setEpoch((e) => e + 1);
    onEra(next.id);
  };

  return (
    <div className="hpl-eras" data-hpl-dir={dir}>
      <div className="vwd hpl-eras__sheet" data-vwh-era={record.id} data-hpl-dir={dir}>
        {/* ⚠ DRAWN, NOT A CONTAINER, and OPEN-BOTTOMED. `.vwd` is a flex
            column with `min-height: 0` at every link; a wrapper inserted into
            that chain is how a composition silently stops shrinking. And the
            rail's last tick falls INSIDE the chip frames at every laptop
            shape, so the walls stop at the reel's top edge and the chips are
            the terminus. */}
        {/* ⚠ A LISTING DRAWS NO ENCLOSURE HERE. v6's ring belongs to the proof
            surface; on this station — transparent by law, and swept for any
            band-wide border or ground by the committed >700px test — the
            grammar crosses as LINES alone: the head doubles, the reticle pair
            on the bay and the cursor on the reel. `housing: true` is what
            gives its proof header an edge to fuse to; here it draws nothing. */}
        {chrome.housing && chrome.housingKind !== "listing" ? <Housing open /> : null}

        {/* ⚠ NO `HeaderBar` HERE, DELIBERATELY. The era stage already HAS its
            header: the mast is a kicker, a title and a year, and every header
            direction re-lays THAT into a row in CSS (`display: contents` on
            the kicker, three grid columns on the mast). Rendering a second
            bar would print the era's identity twice on one screen — the
            said-twice defect this surface has removed a console head, a foot
            and a designator for — and would move the `era-title` handoff
            target's box, which the About name flies into. */}

        {alphaSettled ? (
          <HoloDatumPanels
            selectedEraIndex={eraIdx}
            onSelectEra={pick}
            idPrefix="hpl"
            figure={figure}
          />
        ) : null}

        {/* ⚠ THE FOOT IS A ROW OF TYPE, NEVER A RULE AT THE RAIL'S LAST TICK.
            The `?foot=rule` knob draws a band-INSET hairline for the owner to
            rule on; it is off by default and the landing is untouched. */}
        {/* ⚠ A HOUSING'S TERMINUS IS ITS OWN OPEN BOTTOM, so a direction that
            draws one prints no foot row here. The housing stops at the reel's
            top edge and the chips ARE the terminus — that is what the open
            bottom declares — and a foot row below the reel then belongs to
            neither, sitting outside the enclosure it is supposed to close.
            Seen on the first still with the glass in. */}
        {chrome.foot !== "none" && !chrome.housing ? (
          /* ⚠ THE FOOT CARRIES THE ONE FIELD THIS SHEET HAS NEVER LETTERED.
             The first cut printed the era position and the motto — both
             already on screen, in the mast and in SCOPE — which is the
             said-twice defect this surface has removed a console head, a foot
             and a designator for. `era.loadout` is in the record, capped at
             80 characters, and `.claude/rules/voidwalker.md` records that it
             "stays in the record but letters nowhere on the sheet". A foot
             that says something new is a foot; one that repeats the mast is
             chrome for its own sake. */
          <FootRow
            kind={chrome.foot === "bar" ? "bar" : "row"}
            left="Loadout"
            right={record.loadout}
          />
        ) : null}
      </div>
    </div>
  );
}
