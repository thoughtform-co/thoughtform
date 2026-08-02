"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useLandingScroll } from "@/components/landing/v7/hooks/useLandingScroll";
import { scrollToManifestEntry } from "@/lib/rail-manifest/clickToNavigate";
import { MANIFEST_ENTRIES } from "@/lib/rail-manifest/entries";

import { HudFrame, type InstrumentHosts } from "./HudFrame";
import { Runway } from "./Runway";
import { RUNWAY_BLOCKS } from "./journey";
import { journeyRef, subscribeJourney } from "./journeyRef";
import { CornerRange, CornerSector, RailFoot } from "./instruments/CornerPlates";
import { LeftRailIndex } from "./instruments/LeftRailIndex";
import { RailStationRoster } from "./instruments/RailStationRoster";
import { JourneyCluster } from "./instruments/SectionClusters";
import { RightRailInstruments } from "./instruments/RightRailInstruments";
import { useSyntheticJourney } from "./useSyntheticJourney";
import { ALL_LAYERS, HUD_INSTRUMENT_VARIANTS, LAYER_LABELS, type LayerId } from "./variants";

interface ShellProps {
  hudHtml: string;
  bodyClass: string;
}

const prm = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

export function HudInstrumentsLabShell({ hudHtml, bodyClass }: ShellProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [variantIdx, setVariantIdx] = useState(0);
  const [overrides, setOverrides] = useState<Partial<Record<LayerId, boolean>>>({});
  const [hosts, setHosts] = useState<InstrumentHosts | null>(null);
  const [consoleOpen, setConsoleOpen] = useState(true);
  const [ink, setInk] = useState(0);

  // The production scroll writer, unmodified: it owns `--hero-lift`,
  // `data-active-station`, `--depth` and `data-corridor-entry`. Mounting the
  // real one is what makes the ADR-031 U16 hero-curtain reveal judgeable
  // here — a pinned `--hero-lift: 1` would show the frame already open.
  useLandingScroll(rootRef);
  // Mounted AFTER the production writer so its listener registers second and
  // the ring bridge is written before `useActiveSection` reads it.
  useSyntheticJourney(rootRef);

  const variant = HUD_INSTRUMENT_VARIANTS[variantIdx];
  const isOn = useCallback(
    (id: LayerId) => overrides[id] ?? variant.layers.includes(id),
    [overrides, variant]
  );

  // ── Deep link ────────────────────────────────────────────────────────
  // Read in a MOUNT EFFECT and written back through `history.replaceState`.
  // NEVER `useSearchParams`, which forces a CSR bailout of the whole route.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const v = q.get("v");
    if (v) {
      const byId = HUD_INSTRUMENT_VARIANTS.findIndex((a) => a.id === v);
      if (byId >= 0) setVariantIdx(byId);
      else {
        const n = Number(v);
        if (Number.isFinite(n) && n >= 0 && n < HUD_INSTRUMENT_VARIANTS.length) setVariantIdx(n);
      }
    }
    if (q.get("console") === "0") setConsoleOpen(false);

    const s = Number(q.get("s"));
    if (Number.isFinite(s) && s > 0 && s < RUNWAY_BLOCKS.length) {
      // One frame for layout, then a real jump through the production
      // navigator — the console never teleports by hand.
      requestAnimationFrame(() => {
        const entry = MANIFEST_ENTRIES[RUNWAY_BLOCKS[s].entryIdx];
        if (entry) scrollToManifestEntry(entry, true);
      });
    }
  }, []);

  // Ink counter — the "is this busy?" claim, made checkable. Counted off the
  // live DOM rather than derived from the layer set, so it cannot drift from
  // what is actually on screen. RENDERED marks only: below 960px the rails
  // are `display: none` and the instruments stop painting while staying
  // mounted, so counting nodes would report ink that nobody can see.
  useEffect(() => {
    const recount = () => {
      const n = [...document.querySelectorAll("[data-hil-mark]")].filter(
        (el) => el.getClientRects().length > 0
      ).length;
      setInk((prev) => (prev === n ? prev : n));
    };
    recount();
    return subscribeJourney(recount);
  }, [variantIdx, overrides]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const commitVariant = useCallback((next: number) => {
    setVariantIdx(next);
    setOverrides({});
    const url = new URL(window.location.href);
    url.searchParams.set("v", HUD_INSTRUMENT_VARIANTS[next].id);
    window.history.replaceState(null, "", url.toString());
  }, []);

  const toggleLayer = useCallback(
    (id: LayerId) =>
      setOverrides((prev) => ({ ...prev, [id]: !(prev[id] ?? variant.layers.includes(id)) })),
    [variant]
  );

  const stepTo = useCallback((blockIdx: number) => {
    const entry = MANIFEST_ENTRIES[RUNWAY_BLOCKS[blockIdx].entryIdx];
    if (entry) scrollToManifestEntry(entry, prm());
  }, []);

  const stepBy = useCallback(
    (delta: number) => {
      const cur = journeyRef.current.blockIdx;
      stepTo(Math.max(0, Math.min(RUNWAY_BLOCKS.length - 1, cur + delta)));
    },
    [stepTo]
  );

  return (
    <div
      ref={rootRef}
      className={`hil ${bodyClass}`}
      data-theme="dark"
      data-hil-variant={variant.id}
      data-hil-explain={isOn("nExplain") || undefined}
      // The cluster REPLACES its corner's bracket rather than sitting beside
      // it, so the bracket is suppressed exactly when its cluster is on —
      // keyed per corner, because the layers toggle independently.
      data-hil-corner-tl={isOn("nJourney") || undefined}
    >
      <HudFrame hudHtml={hudHtml} onHosts={setHosts} />
      <Runway />

      {hosts &&
        createPortal(
          <>
            {isOn("lRoster") && <RailStationRoster expand={isOn("lExpand")} bays={isOn("lBays")} />}
            <LeftRailIndex index={isOn("lIndex")} glyph={false} bracket={isOn("lBracket")} />
            {isOn("lFoot") && <RailFoot />}
          </>,
          hosts.left
        )}
      {hosts &&
        createPortal(
          <>
            <RightRailInstruments
              pointer={isOn("rPointer")}
              telemetry={isOn("rTelemetry")}
              name={isOn("rName")}
              scale={isOn("rScale")}
            />
          </>,
          hosts.right
        )}
      {/* Both corner hosts carry two independent layers: the round-2 register
          (`cTl` / `cBr`) and the round-3 cluster. They are NOT designed to
          coexist — each occupies its bracket's open arm — so `r4` ships
          without the registers. Turning both on is a legitimate way to see
          the collision, which is why it is not prevented here. */}
      {hosts && isOn("cTl") && createPortal(<CornerSector />, hosts.cornerTl)}
      {hosts && isOn("cBr") && createPortal(<CornerRange />, hosts.cornerBr)}
      {hosts && isOn("nJourney") && createPortal(<JourneyCluster />, hosts.cornerTl)}

      <div className="hil-console" data-open={consoleOpen || undefined}>
        <div className="hil-console__head">
          <button
            type="button"
            className="hil-caret"
            aria-expanded={consoleOpen}
            onClick={() => setConsoleOpen((o) => !o)}
          >
            {consoleOpen ? "▾" : "▴"} HUD instruments
          </button>
          <span className="hil-readout">
            <b>{ink}</b> marks · ladder is 26
          </span>
        </div>

        {consoleOpen && (
          <>
            <div className="hil-chips" role="tablist" aria-label="Design route">
              {HUD_INSTRUMENT_VARIANTS.map((v, i) => (
                <button
                  key={v.id}
                  type="button"
                  role="tab"
                  aria-selected={i === variantIdx}
                  className="hil-chip"
                  data-on={i === variantIdx || undefined}
                  onClick={() => commitVariant(i)}
                >
                  {v.label}
                </button>
              ))}
            </div>

            <p className="hil-thesis">{variant.thesis}</p>

            <div className="hil-toggles">
              {ALL_LAYERS.map((id) => (
                <button
                  key={id}
                  type="button"
                  className="hil-toggle"
                  aria-pressed={isOn(id)}
                  data-on={isOn(id) || undefined}
                  onClick={() => toggleLayer(id)}
                >
                  <i className="hil-toggle__led" />
                  {LAYER_LABELS[id]}
                </button>
              ))}
            </div>

            <div className="hil-chips">
              <button type="button" className="hil-chip hil-chip--sm" onClick={() => stepBy(-1)}>
                ◂ Prev
              </button>
              {RUNWAY_BLOCKS.map((b, i) => (
                <button
                  key={b.id}
                  type="button"
                  className="hil-chip hil-chip--sm"
                  onClick={() => stepTo(i)}
                >
                  {b.name}
                </button>
              ))}
              <button type="button" className="hil-chip hil-chip--sm" onClick={() => stepBy(1)}>
                Next ▸
              </button>
            </div>

            <p className="hil-prov">
              <i className="hil-prov__diamond" />
              {variant.provenance}
            </p>
          </>
        )}
      </div>

      <p className="hil-gate-warn">
        Out of tier — below 960px the rails are hidden and the instruments go with them. The nav
        corner is the answer here.
      </p>
    </div>
  );
}
