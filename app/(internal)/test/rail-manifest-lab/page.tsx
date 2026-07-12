"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import "@/components/landing/v7/landing.css";
import "./rail-manifest-lab.css";

import { advanceScrambles, queueScramble, type ScrambleJob } from "@/lib/home-v2/captionScramble";

/**
 * Rail Manifest Lab — look-dev for ADR-031 (2026-07-12).
 *
 * The left HUD rail evolves from decorative ticks + a single station
 * label into a STATION MANIFEST: one slot per journey entry, sockets
 * for upcoming stations, seated modules for passed ones, and a single
 * powered (active) slot that materializes its number + name. The
 * services→tools crossing seats a layered-stack module glyph — the
 * four ring cards "plugged into the backplane".
 *
 * Owner constraints: anti-clutter above all (markers only; numbers on
 * the ACTIVE entry only — the non-monotonic production numbering
 * 01/02/03/08/08A/05… is never visible as a sequence), quantized
 * terminal snap (never smooth tweening), clickable entries.
 *
 * Reference canon (owner's refs): Cyberpunk 2077 hardware-module
 * monitors, ATC radar rails, phosphor CRT terminals, Departure Mono
 * HUD — modules seated in a rack, one powered slot.
 *
 * Static composition: no scroll machinery, no portals, lab-local
 * `rml-*` classes only. The journey is simulated with PREV/NEXT (or by
 * clicking a slot — the production interaction). Deep-link a variant
 * with ?v=<id> (history.replaceState — the gateway-motion pattern, no
 * useSearchParams CSR bailout).
 */

interface LabEntry {
  id: string;
  /** Authored station number — shown ONLY while active (markers-only canon). */
  label: string;
  name: string;
  /** Services seats the layered-stack module (the collapsed card ring). */
  glyph?: "stack";
  /** Hero canon: the first viewport shows no rail title. */
  hideActiveName?: boolean;
}

/** Production journey order (ADR-021 corridor reorder) — NOT authored order. */
const ENTRIES: readonly LabEntry[] = [
  { id: "hero", label: "01", name: "Hero", hideActiveName: true },
  { id: "thesis", label: "02", name: "Thesis" },
  { id: "arc", label: "03", name: "Arc" },
  { id: "services", label: "08", name: "Services", glyph: "stack" },
  { id: "tools", label: "08A", name: "Tools" },
  { id: "continuum", label: "05", name: "Continuum" },
  { id: "practice", label: "06", name: "Practice" },
  { id: "build", label: "07", name: "Build" },
  { id: "about", label: "09", name: "About" },
  { id: "contact", label: "10", name: "Contact" },
] as const;

/** Slots sit on the canonical Brand Codex 8.33% tick grid (hudTicks.ts). */
const slotTop = (i: number) => 8.33 * (i + 1);

const SERVICES_IDX = ENTRIES.findIndex((e) => e.id === "services");

interface LabVariant {
  id: string;
  label: string;
  thesis: string;
  provenance: string;
}

const VARIANTS: readonly LabVariant[] = [
  {
    id: "sockets",
    label: "V1 Minimal sockets",
    thesis:
      "The ladder becomes ten sockets — hollow until passed, filled once seated; only the powered slot speaks.",
    provenance: "ATC radar rails · ToolsRailRegister diamond grammar",
  },
  {
    id: "brackets",
    label: "V2 Bracketed slots",
    thesis:
      "Register brackets [ · ] read as bays in a backplane; a seated module is a chip in its bay.",
    provenance: "Departure Mono HUD · CRT register readouts",
  },
  {
    id: "ticks",
    label: "V3 Tick-integrated",
    thesis:
      "The Brand Codex ladder survives; passed stations grow modules IN PLACE of their ticks.",
    provenance: "Brand Codex 13-pos contract · minimal delta",
  },
] as const;

/** V3 keeps the ladder's unoccupied positions as plain decorative ticks. */
const V3_EXTRA_TICKS = [0, 91.67, 100] as const;

type ConfirmTreatment = "blink" | "line";

const SEAT_GARNISH_MS = 950;

/** The services module glyph — four layered planes (the collapsed card ring). */
function StackGlyph() {
  return (
    <svg className="rml-glyph" viewBox="0 0 14 14" aria-hidden="true">
      <rect x="0.5" y="5.5" width="8" height="8" />
      <rect x="2.17" y="3.83" width="8" height="8" />
      <rect x="3.83" y="2.17" width="8" height="8" />
      <rect x="5.5" y="0.5" width="8" height="8" className="rml-glyph__front" />
    </svg>
  );
}

function variantById(id: string | null): LabVariant {
  return VARIANTS.find((v) => v.id === id) ?? VARIANTS[0];
}

const prm = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

export default function RailManifestLabPage() {
  const [variantId, setVariantId] = useState<string>(VARIANTS[0].id);
  // Default journey position: Tools active — the services module arrives
  // seated, so the hero moment's END STATE is the first thing on screen.
  const [activeIdx, setActiveIdx] = useState<number>(SERVICES_IDX + 1);
  const [confirm, setConfirm] = useState<ConfirmTreatment>("blink");
  const [justSeated, setJustSeated] = useState<ReadonlySet<number>>(new Set());
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const labelRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const nameRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const hoverIdxRef = useRef<number | null>(null);
  const timersRef = useRef<number[]>([]);

  // Scramble loop — the captionScramble terminal-text canon, wired the
  // same way RailStationLabel does it (rAF alive only while jobs run).
  const jobsRef = useRef<ScrambleJob[]>([]);
  const rafRef = useRef(0);
  const kick = useCallback(() => {
    const tick = () => {
      advanceScrambles(jobsRef.current, performance.now() / 1000);
      rafRef.current = jobsRef.current.length ? requestAnimationFrame(tick) : 0;
    };
    if (!rafRef.current && jobsRef.current.length) rafRef.current = requestAnimationFrame(tick);
  }, []);

  // Adopt the deep-linked variant AFTER mount (SSR renders the default;
  // reading location in the initializer would mismatch hydration).
  useEffect(() => {
    const linked = new URLSearchParams(window.location.search).get("v");
    if (linked) setVariantId(variantById(linked).id);
  }, []);

  useEffect(() => {
    const timers = timersRef.current;
    const jobs = jobsRef.current;
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        // Reset so kick() can restart the loop after a Strict Mode
        // remount — a stale handle here silently kills all scrambles.
        rafRef.current = 0;
      }
      jobs.length = 0;
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  // The active entry materializes its number + name (scramble-decoded);
  // every other entry's text clears (unless hover-ghosted). Imperative
  // textContent writes, so React never fights the scrambler.
  useEffect(() => {
    ENTRIES.forEach((e, i) => {
      const label = labelRefs.current[i];
      const name = nameRefs.current[i];
      if (!label || !name) return;
      if (i === activeIdx) {
        const nm = e.hideActiveName ? "" : e.name;
        if (prm()) {
          label.textContent = e.label;
          name.textContent = nm;
        } else {
          const now = performance.now() / 1000;
          queueScramble(jobsRef.current, label, e.label, now + 0.05);
          queueScramble(jobsRef.current, name, nm, now + 0.12);
          kick();
        }
      } else if (i !== hoverIdxRef.current) {
        label.textContent = "";
        name.textContent = "";
      }
    });
  }, [activeIdx, kick]);

  /** Quantized seat garnish (steps(3) snap + flash + confirm) on entry i. */
  const garnish = (i: number, delayMs = 0) => {
    const t = window.setTimeout(() => {
      setJustSeated((prev) => new Set(prev).add(i));
      const off = window.setTimeout(() => {
        setJustSeated((prev) => {
          const next = new Set(prev);
          next.delete(i);
          return next;
        });
      }, SEAT_GARNISH_MS);
      timersRef.current.push(off);
    }, delayMs);
    timersRef.current.push(t);
  };

  /** Jump the journey — clicking a slot is the production interaction. */
  const travelTo = (next: number) => {
    const clamped = Math.max(0, Math.min(ENTRIES.length - 1, next));
    if (clamped === activeIdx) return;
    if (clamped > activeIdx) {
      // Every entry crossed on the way down seats, cascade-staggered —
      // the fast-scroll-past behavior.
      for (let i = activeIdx; i < clamped; i++) garnish(i, (i - activeIdx) * 90);
    }
    setActiveIdx(clamped);
  };

  const replaySeat = () => {
    if (activeIdx > SERVICES_IDX) garnish(SERVICES_IDX);
  };

  const selectVariant = (id: string) => {
    setVariantId(id);
    const url = new URL(window.location.href);
    url.searchParams.set("v", id);
    window.history.replaceState(null, "", url.toString());
  };

  // Hover ghost: the name scramble runs in an effect (the sanctioned
  // home for performance.now — RailStationLabel precedent); handlers
  // only move state. Cleanup clears the ghost unless the slot became
  // active meanwhile (the active-text effect refills it after).
  useEffect(() => {
    if (hoverIdx == null || hoverIdx === activeIdx) return;
    const name = nameRefs.current[hoverIdx];
    if (!name) return;
    if (prm()) {
      name.textContent = ENTRIES[hoverIdx].name;
    } else {
      queueScramble(jobsRef.current, name, ENTRIES[hoverIdx].name, performance.now() / 1000 + 0.03);
      kick();
    }
    return () => {
      if (name.isConnected) name.textContent = "";
    };
  }, [hoverIdx, activeIdx, kick]);

  const ghostIn = (i: number) => {
    if (i === activeIdx) return;
    hoverIdxRef.current = i;
    setHoverIdx(i);
  };

  const ghostOut = (i: number) => {
    if (hoverIdxRef.current === i) {
      hoverIdxRef.current = null;
      setHoverIdx(null);
    }
  };

  const variant = variantById(variantId);

  const stateOf = (i: number) =>
    i < activeIdx ? "seated" : i === activeIdx ? "active" : "upcoming";

  return (
    <main className="rml" data-variant={variant.id} data-confirm={confirm}>
      <section className="rml-stage" aria-label={`Rail manifest mock — ${variant.label}`}>
        {/* ── HUD frame ─────────────────────────────────────────── */}
        <span className="rml-corner rml-corner--tl" aria-hidden="true" />
        <span className="rml-corner rml-corner--tr" aria-hidden="true" />
        <span className="rml-corner rml-corner--bl" aria-hidden="true" />
        <span className="rml-corner rml-corner--br" aria-hidden="true" />

        {/* ── Left rail: THE MANIFEST ───────────────────────────── */}
        <div className="rml-rail rml-rail--l">
          <i className="rml-rail__track" aria-hidden="true" />
          {variant.id === "ticks" &&
            V3_EXTRA_TICKS.map((top) => (
              <i
                className="rml-extra-tick"
                style={{ top: `${top}%` }}
                key={top}
                aria-hidden="true"
              />
            ))}
          <nav className="rml-manifest" aria-label="Page manifest (mock)">
            {ENTRIES.map((e, i) => {
              const state = stateOf(i);
              return (
                <button
                  key={e.id}
                  type="button"
                  className="rml-entry"
                  data-entry-id={e.id}
                  data-state={state}
                  data-just-seated={justSeated.has(i) || undefined}
                  data-ghost={hoverIdx === i || undefined}
                  style={{ top: `${slotTop(i)}%` }}
                  aria-label={`${e.name} — section ${i + 1} of ${ENTRIES.length}`}
                  aria-current={state === "active" || undefined}
                  onClick={() => travelTo(i)}
                  onPointerEnter={() => ghostIn(i)}
                  onPointerLeave={() => ghostOut(i)}
                >
                  <i className="rml-entry__marker" aria-hidden="true">
                    {e.glyph === "stack" && state !== "upcoming" && <StackGlyph />}
                  </i>
                  <span
                    className="rml-entry__label"
                    ref={(el) => {
                      labelRefs.current[i] = el;
                    }}
                  />
                  <span
                    className="rml-entry__name"
                    ref={(el) => {
                      nameRefs.current[i] = el;
                    }}
                  />
                  <span className="rml-entry__confirm" aria-hidden="true">
                    +seated
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* ── Right rail: production register hint (balance check) ─ */}
        <div className="rml-rail rml-rail--r" aria-hidden="true">
          <i className="rml-rail__track" />
          <span className="rml-register__heading">Tool units · 04</span>
          {(["Mímir", "Vesper", "Babylon", "Heimdall"] as const).map((name, i) => (
            <span
              className="rml-register__row"
              data-active={i === 0 || undefined}
              style={{ top: `${33.333 + i * 8.333}%` }}
              key={name}
            >
              <span className="rml-register__name">{name}</span>
              <span className="rml-register__index">{`0${i + 1}`}</span>
              <i className="rml-register__marker" />
            </span>
          ))}
        </div>

        {/* ── Spec sheet: entry states at 2× ─────────────────────── */}
        <aside className="rml-spec" aria-label="Entry states, magnified">
          <h2 className="rml-spec__title">State anatomy · 2×</h2>
          {(
            [
              { state: "upcoming", note: "socket — station ahead", glyph: false },
              { state: "seated", note: "module — station passed", glyph: false },
              { state: "seated", note: "services module — card ring docked", glyph: true },
              { state: "active", note: "powered slot — number + name decode", glyph: false },
            ] as const
          ).map((row, i) => (
            <div className="rml-spec__row" key={i}>
              <span className="rml-entry rml-entry--spec" data-state={row.state}>
                <i className="rml-entry__marker" aria-hidden="true">
                  {row.glyph && <StackGlyph />}
                </i>
                {row.state === "active" && (
                  <>
                    <span className="rml-entry__label">08</span>
                    <span className="rml-entry__name">Services</span>
                  </>
                )}
              </span>
              <span className="rml-spec__note">{row.note}</span>
            </div>
          ))}
        </aside>

        {/* ── Journey + garnish controls ─────────────────────────── */}
        <div className="rml-controls">
          <span className="rml-controls__group">
            <button type="button" onClick={() => travelTo(activeIdx - 1)}>
              ◂ prev
            </button>
            <button type="button" onClick={() => travelTo(activeIdx + 1)}>
              next ▸
            </button>
          </span>
          <button type="button" onClick={replaySeat} disabled={activeIdx <= SERVICES_IDX}>
            ⟲ replay seat
          </button>
          <span className="rml-controls__group" role="group" aria-label="Confirm treatment">
            <button
              type="button"
              data-active={confirm === "blink" || undefined}
              onClick={() => setConfirm("blink")}
            >
              blink
            </button>
            <button
              type="button"
              data-active={confirm === "line" || undefined}
              onClick={() => setConfirm("line")}
            >
              +seated
            </button>
          </span>
        </div>

        {/* ── Lab chrome ─────────────────────────────────────────── */}
        <p className="rml-caption">
          <b>{variant.label}</b> — {variant.thesis}
          <span className="rml-caption__prov">{variant.provenance}</span>
          <span className="rml-caption__hint">
            click a slot to travel · hover a socket for its ghost name
          </span>
        </p>
      </section>

      <nav className="rml-chips" aria-label="Variants">
        {VARIANTS.map((v) => (
          <button
            key={v.id}
            type="button"
            data-active={v.id === variant.id || undefined}
            onClick={() => selectVariant(v.id)}
          >
            {v.label}
          </button>
        ))}
      </nav>
    </main>
  );
}
