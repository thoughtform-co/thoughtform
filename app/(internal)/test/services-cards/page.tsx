"use client";

/**
 * /test/services-cards — design lab for the #services callout cards
 * (2026-07-02).
 *
 * Four card variants against the same staged scene (faint brandmark + dashed
 * leader line), all IBM Plex Mono, all using the REBUILT 5-layer copy from
 * `serviceCardsLabData.ts`. References: Starfield travel-data panel (A),
 * Atlas lab sheet (B), brasshands.com (C), "Pixelated + Orbit" table card (D).
 * Pick a winner here; promotion into `serviceData.ts` + the production
 * `ServiceScanInterface` is the follow-up.
 */

import { useState } from "react";

import { BrandmarkGlyph } from "@/components/landing/v7/BrandmarkGlyph";
import { LAB_SERVICES, type LabService, type LabServiceId } from "./serviceCardsLabData";

import "./services-cards.css";

/* ── Variant A — Ledger (Starfield travel data) ── */
function CardA({ s }: { s: LabService }) {
  return (
    <article className="svc-card-a">
      <div className="svc-card-a__bar">
        <span className="svc-card-a__id">
          {s.index} / {s.name}
        </span>
        <span className="svc-card-a__status">{s.status}</span>
      </div>
      <h3 className="svc-card-a__statement">{s.statement}</h3>
      <p className="svc-card-a__support">{s.support}</p>
      <dl>
        {s.rows.map((row) => (
          <div className="svc-card-a__row" key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
      <a className="svc-card-a__cta" href="#contact">
        {s.ctaLabel} →
      </a>
    </article>
  );
}
function ChipA({ s }: { s: LabService }) {
  return (
    <div className="svc-chip-a">
      <span className="svc-chip-a__id">
        {s.index} / {s.name}
      </span>
      <span className="svc-chip-a__status">{s.status}</span>
    </div>
  );
}

/* ── Variant B — Lab sheet (Atlas) ── */
function CardB({ s }: { s: LabService }) {
  return (
    <article className="svc-card-b">
      <div className="svc-card-b__band svc-card-b__band--top">
        <span>
          SERVICE <strong>{s.index}</strong>
        </span>
        <span>FIELD ACTIVE</span>
      </div>
      <div className="svc-card-b__inner">
        <h3 className="svc-card-b__statement">{s.statement}</h3>
        <p className="svc-card-b__support">{s.support}</p>
        <dl className="svc-card-b__rows">
          {s.rows.map((row) => (
            <div className="svc-card-b__row" key={row.label}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
        <a className="svc-card-b__cta" href="#contact">
          {s.ctaLabel} →
        </a>
      </div>
      <div className="svc-card-b__band svc-card-b__band--bottom">
        <span>THOUGHTFORM</span>
        <strong>{s.name}</strong>
      </div>
    </article>
  );
}
function ChipB({ s }: { s: LabService }) {
  return (
    <div className="svc-chip-b">
      <div className="svc-chip-b__band">SERVICE {s.index}</div>
      <div className="svc-chip-b__name">{s.name}</div>
    </div>
  );
}

/* ── Variant C — Slab (brasshands) ── */
function CardC({ s }: { s: LabService }) {
  return (
    <article className="svc-card-c">
      <p className="svc-card-c__id">
        {s.index} / {s.name}
      </p>
      <h3 className="svc-card-c__statement">{s.statement}</h3>
      <dl className="svc-card-c__rows">
        {s.rows.map((row) => (
          <div className="svc-card-c__row" key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
      <a className="svc-card-c__cta" href="#contact">
        {s.ctaLabel} →
      </a>
    </article>
  );
}
function ChipC({ s }: { s: LabService }) {
  return (
    <div className="svc-chip-c">
      <span className="svc-chip-c__reticle" />
      <span className="svc-chip-c__id">
        {s.index} / {s.name}
      </span>
    </div>
  );
}

/* ── Variant D — Chip + table (Pixelated + Orbit) ── */
function CardD({ s }: { s: LabService }) {
  return (
    <article className="svc-card-d">
      <div className="svc-card-d__chipbar">
        <span>
          {s.index} — {s.name}
        </span>
        <span>{s.rows[0].value}</span>
      </div>
      <h3 className="svc-card-d__statement">{s.statement}</h3>
      <p className="svc-card-d__support">{s.support}</p>
      <dl className="svc-card-d__table">
        {s.rows.map((row) => (
          <div className="svc-card-d__trow" key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
      <a className="svc-card-d__cta" href="#contact">
        {s.ctaLabel} →
      </a>
    </article>
  );
}
function ChipD({ s }: { s: LabService }) {
  return (
    <div className="svc-chip-d">
      {s.index} — {s.name}
    </div>
  );
}

/* ── Stage cell: faint mark + dashed leader + chip + card ── */
const VARIANTS = [
  { key: "a", label: "Ledger", ref: "Starfield travel data", Card: CardA, Chip: ChipA },
  { key: "b", label: "Lab sheet", ref: "Atlas", Card: CardB, Chip: ChipB },
  { key: "c", label: "Slab", ref: "brasshands", Card: CardC, Chip: ChipC },
  { key: "d", label: "Chip + table", ref: "Pixelated + Orbit", Card: CardD, Chip: ChipD },
] as const;

function StageCell({
  variant,
  service,
}: {
  variant: (typeof VARIANTS)[number];
  service: LabService;
}) {
  const { Card, Chip } = variant;
  return (
    <section className="svc-lab__cell">
      <div className="svc-lab__cell-tag">
        <strong>
          {variant.key.toUpperCase()} — {variant.label}
        </strong>{" "}
        · {variant.ref}
      </div>
      <div className="svc-lab__mark" aria-hidden="true">
        <BrandmarkGlyph outline={false} fill="currentColor" />
      </div>
      {/* Dashed leader from a "feature" on the mark to the card's left edge.
          (<line> accepts %-coords; <polyline points> does not.) */}
      <svg className="svc-lab__wire" aria-hidden="true">
        <line x1="34%" y1="44%" x2="52%" y2="38%" />
        <line x1="52%" y1="38%" x2="58%" y2="38%" />
        <circle cx="34%" cy="44%" r="5.5" />
        <circle className="svc-lab__wire-dot" cx="34%" cy="44%" r="1.4" />
        <circle cx="58%" cy="38%" r="2.6" />
      </svg>
      <div className="svc-lab__chip-slot">
        <Chip s={service} />
      </div>
      <div className="svc-lab__card-slot">
        <Card s={service} />
      </div>
    </section>
  );
}

export default function ServicesCardsLabPage() {
  const [serviceId, setServiceId] = useState<LabServiceId>("workshop");
  const service = LAB_SERVICES.find((s) => s.id === serviceId) ?? LAB_SERVICES[0];

  return (
    <main className="svc-lab">
      <header className="svc-lab__head">
        <h1 className="svc-lab__title">
          Services cards lab <span>· 4 variants · rebuilt copy · mono only</span>
        </h1>
        <nav className="svc-lab__switch" aria-label="Service switcher">
          {LAB_SERVICES.map((s) => (
            <button
              key={s.id}
              type="button"
              data-active={s.id === serviceId}
              onClick={() => setServiceId(s.id)}
            >
              {s.index} {s.name}
            </button>
          ))}
        </nav>
      </header>

      <div className="svc-lab__grid">
        {VARIANTS.map((variant) => (
          <StageCell key={variant.key} variant={variant} service={service} />
        ))}
      </div>
    </main>
  );
}
