"use client";

import { useEffect, useState } from "react";

import "@/components/landing/v7/landing.css";
import "./tools-header-lab.css";

/**
 * Tools Header Lab — look-dev for the #tools section header × wordmark
 * placement conflict (2026-07-11).
 *
 * The owner wants the Linear/terminal grammar (title LEFT, lede RIGHT)
 * for every section from Tools onward, but a left-aligned title competes
 * with the fixed THOUGHT+FORM wordmark in the top-left. Centering solved
 * the collision and broke the HUD language. This lab presents selectable
 * treatments of BOTH the wordmark and the header so a direction can be
 * picked before production changes.
 *
 * Reference canon (owner's Panels refs + 00_shards + linear.app): in
 * retro-futurist / HUD interfaces the brand identity is either CHROME
 * (a tiny mono tag or slim ruled band at the frame edge — Cyberpunk
 * bezels, "PRX 02", the shards topbar) or THE HEADLINE ITSELF — never
 * both at content scale in the same column.
 *
 * Static composition: no scroll machinery, no portals, lab-local `thl-*`
 * classes only (production tools-cards.css never loads here). Deep-link
 * a variant with ?v=<id> (history.replaceState — the gateway-motion
 * pattern, no useSearchParams CSR bailout).
 */

type WordmarkTreatment =
  | "lockup" // vertical dual lockup, as shipped
  | "recede" // shipped lockup, dimmed + shrunk (post-Arc station state)
  | "band" // horizontal lockup inside a ruled chrome band
  | "band-mono" // mono text lockup ◆ THOUGHTFORM inside the band
  | "monogram" // compass glyph only
  | "rail"; // vertical mono text inside the left rail

type HeaderLayout = "legacy" | "linear";

interface LabVariant {
  id: string;
  label: string;
  wm: WordmarkTreatment;
  head: HeaderLayout;
  /** Show the horizontal datum hairline separating brand zone / content. */
  datum?: boolean;
  thesis: string;
  provenance: string;
}

const VARIANTS: readonly LabVariant[] = [
  {
    id: "baseline",
    label: "V0 Baseline",
    wm: "lockup",
    head: "legacy",
    thesis: "The documented conflict — full lockup + left title share one column.",
    provenance: "current site (pre-centering)",
  },
  {
    id: "chrome-band",
    label: "V1 Chrome band",
    wm: "band",
    head: "linear",
    thesis: "Brand compacts into a slim ruled bezel band; content owns the column below.",
    provenance: "Cyberpunk 2077 bezels · linear.app topbar",
  },
  {
    id: "chrome-mono",
    label: "V2 Mono band",
    wm: "band-mono",
    head: "linear",
    thesis: "Same band, but the wordmark becomes mono chrome type with the gold diamond.",
    provenance: "00_shards topbar (Thoughtform ◆ | sub)",
  },
  {
    id: "monogram",
    label: "V3 Monogram",
    wm: "monogram",
    head: "linear",
    thesis: "Compass glyph only at the corner; the full wordmark lives in hero + footer.",
    provenance: "“PRX 02” corner tag · nav displays",
  },
  {
    id: "brand-recede",
    label: "V4 Brand recede",
    wm: "recede",
    head: "linear",
    thesis: "Lockup stays but yields — dimmed and shrunk once past the Arc (station-scoped).",
    provenance: "HUD chrome defers to live instruments",
  },
  {
    id: "shifted-datum",
    label: "V5 Shifted datum",
    wm: "lockup",
    head: "linear",
    datum: true,
    thesis: "Brand untouched; a hairline datum + lower start separate the two zones.",
    provenance: "separation through geometry alone",
  },
  {
    id: "rail-wordmark",
    label: "V6 Rail wordmark",
    wm: "rail",
    head: "linear",
    thesis: "Wordmark becomes rail chrome — vertical mono type on the left guide.",
    provenance: "terminal margins · flight-deck placards",
  },
] as const;

const LOGO_LOCKUP_VERTICAL = "/logos/Thoughtform_Wordmark_Lockup-Vertical%20(Dual).svg";
const LOGO_LOCKUP_HORIZONTAL = "/logos/Thoughtform_Wordmark_Lockup-Horizontal.svg";
const LOGO_BRANDMARK = "/logos/Thoughtform_Brandmark.svg";

const SERVICE_ROWS = [
  { index: "01", verb: "ADVISORY" },
  { index: "02", verb: "EMBEDDED" },
  { index: "03", verb: "KEYNOTE" },
  { index: "04", verb: "WORKSHOP" },
] as const;

function variantById(id: string | null): LabVariant {
  return VARIANTS.find((v) => v.id === id) ?? VARIANTS[0];
}

export default function ToolsHeaderLabPage() {
  const [variantId, setVariantId] = useState<string>(VARIANTS[0].id);

  // Adopt the deep-linked variant AFTER mount (SSR renders the default;
  // reading location in the initializer would mismatch hydration). The
  // URL is only ever WRITTEN from the click handler — a write-back
  // effect would clobber the deep link between Strict Mode's double
  // effect passes.
  useEffect(() => {
    const linked = new URLSearchParams(window.location.search).get("v");
    if (linked) setVariantId(variantById(linked).id);
  }, []);

  const selectVariant = (id: string) => {
    setVariantId(id);
    const url = new URL(window.location.href);
    url.searchParams.set("v", id);
    window.history.replaceState(null, "", url.toString());
  };

  const variant = variantById(variantId);
  const inBand = variant.wm === "band" || variant.wm === "band-mono";

  return (
    <main className="thl" data-wm={variant.wm} data-head={variant.head}>
      <section className="thl-stage" aria-label={`Tools header mock — ${variant.label}`}>
        {/* ── HUD frame ─────────────────────────────────────────── */}
        <span className="thl-corner thl-corner--tl" aria-hidden="true" />
        <span className="thl-corner thl-corner--tr" aria-hidden="true" />
        <span className="thl-corner thl-corner--bl" aria-hidden="true" />
        <span className="thl-corner thl-corner--br" aria-hidden="true" />

        <div className="thl-rail thl-rail--l" aria-hidden="true">
          <i className="thl-rail__track" />
          <i className="thl-rail__tick" style={{ top: "22%" }} />
          <i className="thl-rail__tick thl-rail__tick--major" style={{ top: "35%" }} />
          <i className="thl-rail__tick" style={{ top: "72%" }} />
          <span className="thl-rail__station">
            <b>08A</b> Tools
          </span>
          {variant.wm === "rail" && <span className="thl-rail__brand">Thought+form</span>}
        </div>

        <div className="thl-rail thl-rail--r" aria-hidden="true">
          <i className="thl-rail__track" />
          <span className="thl-register__heading">Tool units · 04</span>
          {SERVICE_ROWS.map((row, i) => (
            <span
              className="thl-register__row"
              data-active={i === 0 || undefined}
              style={{ top: `${33.333 + i * 8.333}%` }}
              key={row.verb}
            >
              <span className="thl-register__name">{row.verb}</span>
              <span className="thl-register__index">{row.index}</span>
              <i className="thl-register__marker" />
            </span>
          ))}
        </div>

        {/* ── Brand chrome (per-variant) ─────────────────────────── */}
        {inBand ? (
          <header className="thl-band">
            {variant.wm === "band" ? (
              <img className="thl-band__lockup" src={LOGO_LOCKUP_HORIZONTAL} alt="Thoughtform" />
            ) : (
              <span className="thl-band__mono">
                <i className="thl-diamond" aria-hidden="true" />
                Thoughtform
                <span className="thl-band__sub">Navigate intelligence</span>
              </span>
            )}
            <span className="thl-burger thl-burger--band" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
          </header>
        ) : (
          <>
            {variant.wm === "monogram" ? (
              <a className="thl-brand thl-brand--monogram" href="#" aria-label="Thoughtform">
                <img src={LOGO_BRANDMARK} alt="" />
              </a>
            ) : variant.wm !== "rail" ? (
              <a className="thl-brand" href="#" aria-label="Thoughtform">
                <img src={LOGO_LOCKUP_VERTICAL} alt="Thoughtform" />
              </a>
            ) : null}
            <span className="thl-burger" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
          </>
        )}

        {variant.datum && <i className="thl-datum" aria-hidden="true" />}

        {/* ── Section header (per-variant layout) ────────────────── */}
        <header className="thl-head">
          <h2 className="thl-title">
            Bottlenecks removed,
            <br />
            <em>
              one tool at a time.
              <i className="thl-caret" aria-hidden="true" />
            </em>
          </h2>
          <p className="thl-lede">
            Four instruments in production — built inside the practice, run by the teams they serve.
          </p>
        </header>

        {/* ── First-card stub (header ↔ deck rhythm) ─────────────── */}
        <div className="thl-card" aria-hidden="true">
          <div className="thl-card__tape">
            <span className="thl-card__plate">TF·MÍMIR</span>
            <span className="thl-card__title">
              Briefing <em>Agent</em>
            </span>
            <span className="thl-card__unit">UNIT 01/04</span>
          </div>
          <div className="thl-card__body" />
        </div>

        {/* ── Lab chrome ─────────────────────────────────────────── */}
        <p className="thl-caption">
          <b>{variant.label}</b> — {variant.thesis}
          <span className="thl-caption__prov">{variant.provenance}</span>
        </p>
      </section>

      <nav className="thl-chips" aria-label="Variants">
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
