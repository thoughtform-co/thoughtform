/**
 * section-menu-lab — shared data.
 *
 * The lab's section list is DERIVED from the production rail manifest
 * (`lib/rail-manifest/entries.ts`) so the names never drift: the three
 * Arc beats (navigate / encode / build) fold into a synthetic "THE ARC"
 * station carrying them as subsections; `thesis` stays top-level even
 * though it is `kind: "corridor"` too (the fold keys on id, not kind).
 *
 * Display numbering is POSITIONAL (01..08) — the same convention the
 * live registers use ("THE ARC · 03", "SOURCE BUS · 04") — not the
 * authored, non-monotonic `label` field (vestigial since ADR-031 U9).
 *
 * The Navigate-frame copy is re-exported from the corridor map so the
 * reproduced viewport shows the exact production strings.
 */

import { MANIFEST_ENTRIES, type ManifestEntryId } from "@/lib/rail-manifest/entries";
import { stationById } from "@/lib/home-v2/corridorMap";

export interface LabSubStation {
  id: ManifestEntryId;
  /** Positional sub-number, zero-padded ("01".."03"). */
  num: string;
  /** Display name, uppercased. */
  name: string;
}

export interface LabStation {
  id: string;
  /** Positional station number, zero-padded ("01".."08"). */
  num: string;
  /** Display name, uppercased. */
  name: string;
  /** Present only on THE ARC. */
  subs?: LabSubStation[];
  /** Hero canon — the active row shows no name. */
  hideActiveName?: boolean;
}

/** The three corridor beats that fold into THE ARC, in journey order. */
export const ARC_SUB_IDS: readonly ManifestEntryId[] = ["navigate", "encode", "build"] as const;

const pad = (n: number) => String(n).padStart(2, "0");

function buildStations(): LabStation[] {
  const out: LabStation[] = [];
  let pos = 0;
  for (const entry of MANIFEST_ENTRIES) {
    if (ARC_SUB_IDS.includes(entry.id)) {
      // Emit the synthetic ARC station once, seated where its first
      // beat (navigate) sits in the journey; skip the other two beats.
      if (entry.id === "navigate") {
        pos += 1;
        out.push({
          id: "arc",
          num: pad(pos),
          name: "THE ARC",
          subs: ARC_SUB_IDS.map((sid, i) => {
            const beat = MANIFEST_ENTRIES.find((m) => m.id === sid);
            return { id: sid, num: pad(i + 1), name: (beat?.name ?? sid).toUpperCase() };
          }),
        });
      }
      continue;
    }
    pos += 1;
    out.push({
      id: entry.id,
      num: pad(pos),
      name: entry.name.toUpperCase(),
      hideActiveName: entry.hideActiveName,
    });
  }
  return out;
}

/** hero · thesis · THE ARC(nav/enc/bld) · services · about · continuum · practice · contact. */
export const STATIONS: readonly LabStation[] = buildStations();

/** Ids that live inside THE ARC — a click on one opens the drawer. */
export const SUB_ID_SET: ReadonlySet<string> = new Set<string>(ARC_SUB_IDS);

// ── Navigate-frame copy (verbatim from the corridor map) ─────────────
const navContent = stationById("navigate")?.content;

export const NAVIGATE_FRAME = {
  titleHtml: navContent?.titleHtml ?? "<em>NAVIGATE</em> THE INTELLIGENCE.",
  supportHtml:
    navContent?.supportHtml ??
    "AI is not software to command. It is an <em>intelligence to navigate</em>.<br>Your team learns to brief it, steer it, and judge what comes back inside live work.",
  kicker: navContent?.telemetry?.sector ?? "01 · NAVIGATE",
  callsign: navContent?.telemetry?.callsign ?? "NAV-01",
  status: navContent?.telemetry?.status ?? "TRACKING",
  // Decorative survey fix — lab-local constants mirroring the values
  // CorridorStationHeaders set-dresses the Navigate coord tag with.
  coordRef: "REF 112.4",
  coordT: "T+0018",
} as const;

// ── Background field approximation ───────────────────────────────────
// A deterministic scatter of star/latent-field dots for the reproduced
// backdrop. Seeded so the server and client render byte-identical dots
// (no `Math.random()` — that would desync SSR hydration).

export interface SceneDot {
  id: number;
  x: number;
  y: number;
  o: number;
  s: number;
}

function makeDots(count: number): SceneDot[] {
  // mulberry32 — tiny deterministic PRNG.
  let seed = 0x134af1e2;
  const rand = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const round = (n: number) => Math.round(n * 1000) / 1000;
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: round(rand() * 100),
    y: round(rand() * 100),
    o: round(0.05 + rand() * 0.22),
    s: rand() > 0.86 ? 2 : 1,
  }));
}

export const SCENE_DOTS: readonly SceneDot[] = makeDots(46);

// ── Shared menu-variant contract ─────────────────────────────────────
export interface SectionMenuProps {
  stations: readonly LabStation[];
  /** The active top-level station id (a sub id resolves to "arc"). */
  activeTopId: string;
  /** The lit subsection id when the Arc drawer is open, else null. */
  activeSubId: string | null;
  /** Whether the Arc drawer shows its subsections. */
  expanded: boolean;
  /** Select a top-level id or a sub id. */
  onSelect: (id: string) => void;
}

export interface MenuVariant {
  id: string;
  label: string;
  thesis: string;
  provenance: string;
}

/** The five design routes — chip labels + caption copy. */
export const MENU_VARIANTS: readonly MenuVariant[] = [
  {
    id: "glyph",
    label: "R1 · Glyph index",
    thesis:
      "The journey as a Departure-Mono glyph table; a corner-bracket cursor snaps to the active station and the Arc unfolds an indented sub-column.",
    provenance: "Departure Mono specimen · rolodex bracket heritage",
  },
  {
    id: "gauge",
    label: "R2 · Gauge manifest",
    thesis:
      "Sections as OpenVMS system meters — each carries a bracketed track whose fill IS its scroll position; the Arc expands into three sub-gauges.",
    provenance: "OpenVMS SYSTEM STATISTICS · VMS bar brackets",
  },
  {
    id: "tape",
    label: "R3 · Altitude tape",
    thesis:
      "A vertical avionics tape on the midline; a gold caret glides to the active tick, and the Arc→Services span gains three indented sub-ticks.",
    provenance: "PFD altimeter tapes · Departure Mono ACCEL scale",
  },
  {
    id: "terminal",
    label: "R4 · Terminal tree",
    thesis:
      "A phosphor filesystem — ASCII tree connectors, an inverse-video active block, and sub-rows that type in with a blinking cursor.",
    provenance: "Phosphor CRT terminals · VMS session chrome",
  },
  {
    id: "spine",
    label: "R5 · Astrogation spine",
    thesis:
      "A plotted star-route — solid line behind, dashed ahead, diamond waypoints; the active node wears a reticle and the Arc branches a spur.",
    provenance: "CelestialConnector grammar · astrogation charts",
  },
] as const;
