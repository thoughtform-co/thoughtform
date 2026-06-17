"use client";

import Image from "next/image";

export type HeroVariantId = "V0" | "V1" | "V2" | "V3" | "V4";

interface HeroVariantsProps {
  variant: HeroVariantId;
}

/**
 * HeroVariants — switchable hero compositions for `/test/hero-mockups`.
 *
 * Compositional rules every variant follows (V0 excepted as a baseline):
 *   1. The right-side ring/key visual is an exclusion zone. No headline
 *      or body copy crosses it.
 *   2. Body copy lives in the LEFT safe column, the BOTTOM-LEFT band,
 *      or in protected dark panels parked in the TOP-RIGHT or
 *      BOTTOM-RIGHT corners.
 *   3. When a variant uses the top-left for an identity lockup the
 *      production `.hud__corner--tl` is hidden via the `data-variant`
 *      attribute — see `hero-mockups.css`.
 *   4. Production HUD chrome (rails, brandmark slot, corner brackets)
 *      is always visible and authoritative; variants overlay on top.
 */
export function HeroVariants({ variant }: HeroVariantsProps) {
  switch (variant) {
    case "V0":
      return <VariantCurrent />;
    case "V1":
      return <VariantClearOffer />;
    case "V2":
      return <VariantHudInstrument />;
    case "V3":
      return <VariantAnnotatedObject />;
    case "V4":
      return <VariantFoundrySplit />;
    default:
      return null;
  }
}

/* ─────────────────────────────────────────────────────────────────────
   Shared assets
   ───────────────────────────────────────────────────────────────────── */

/** Production wordmark — vertical dual lockup, gold over dawn. */
function Wordmark({ size = "default" }: { size?: "default" | "compact" }) {
  return (
    <Image
      src="/logos/Thoughtform_Wordmark_Lockup-Vertical (Dual).svg"
      alt="Thoughtform"
      width={320}
      height={140}
      priority
      unoptimized
      className={`hero-mock__wordmark-img hero-mock__wordmark-img--${size}`}
    />
  );
}

/** Production brandmark glyph — used as a top-left identity anchor in
 *  the variants that hide `.hud__corner--tl` to make space for it. */
function Brandmark() {
  return (
    <Image
      src="/logos/Thoughtform_Brandmark.svg"
      alt="Thoughtform"
      width={32}
      height={32}
      priority
      unoptimized
      className="hero-mock__brandmark-glyph"
    />
  );
}

/* ─────────────────────────────────────────────────────────────────────
   V0 — Current production hero (reference)
   ─────────────────────────────────────────────────────────────────────
   Reproduces the markup from `landing-v7-motion.html` lines 4258-4290
   so the existing `.hero__diagram` and `.hero__content` rules in
   `landing.css` style it identically. This is the honest baseline. */
function VariantCurrent() {
  return (
    <>
      <div className="hero__diagram" aria-hidden="true">
        <svg className="hero__analysis-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path
            className="hero__analysis-line hero__analysis-line--01"
            d="M58 43 L67 31 L74 31"
            pathLength="1"
          />
          <path
            className="hero__analysis-line hero__analysis-line--02"
            d="M58 43 L67 43 L74 43"
            pathLength="1"
          />
          <path
            className="hero__analysis-line hero__analysis-line--03"
            d="M58 43 L67 56 L74 56"
            pathLength="1"
          />
        </svg>
        <span className="hero__analysis-origin" />
        <div className="hero__analysis-card hero__analysis-card--01">
          <span className="hero__analysis-card__node" />
          <h3>NAVIGATE</h3>
          <p>Read the signal before choosing the route.</p>
        </div>
        <div className="hero__analysis-card hero__analysis-card--02">
          <span className="hero__analysis-card__node" />
          <h3>ENCODE</h3>
          <p>Turn the work&apos;s judgment into reusable substrate.</p>
        </div>
        <div className="hero__analysis-card hero__analysis-card--03">
          <span className="hero__analysis-card__node" />
          <h3>BUILD</h3>
          <p>Shape capability the team can keep operating.</p>
        </div>
      </div>

      <div className="hero-mock__content hero-mock__content--v0">
        <div className="hero-mock__wordmark hero-mock__wordmark--center-stack">
          <Wordmark />
        </div>
        <p className="hero-mock__tagline hero-mock__tagline--v0">
          AI capability, built <em>inside the work.</em>
        </p>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   V1 — Clear Offer (Dapper principle)
   ─────────────────────────────────────────────────────────────────────
   Identity lockup parked in the top-left HUD slot. Headline and subhead
   stack inside the LEFT safe column. A protected proof card on a strong
   backplate sits in the BOTTOM-RIGHT — never crossing the key visual.
   The eyebrow above the wordmark categorises the offer in one line. */
function VariantClearOffer() {
  return (
    <>
      <div className="hero-mock__topleft">
        <Brandmark />
        <span className="hero-mock__topleft-mark">THOUGHTFORM</span>
      </div>

      <div className="hero-mock__content hero-mock__content--v1">
        <span className="hero-mock__eyebrow">
          <span className="hero-mock__eyebrow-dot" />
          Embedded AI enablement
        </span>
        <h1 className="hero-mock__headline">
          An intelligence layer, built <em>inside your work.</em>
        </h1>
        <p className="hero-mock__subhead">
          An embedded operator sits in one real workflow, encodes how your team thinks into
          substrate the AI can inherit, and leaves the capability running.
        </p>
      </div>

      <aside className="hero-mock__panel hero-mock__panel--proof" aria-label="Proof case">
        <div className="hero-mock__panel-label">PROOF · LOOP</div>
        <p className="hero-mock__panel-body">
          Three years embedded in a consumer brand. Briefing, generation, localisation and curation
          now run on the substrate.
        </p>
        <div className="hero-mock__panel-meta">
          <span>04 TEAMS</span>
          <span>1 SUBSTRATE</span>
        </div>
      </aside>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   V2 — HUD Instrument (Optikka / Brand Codex principle)
   ─────────────────────────────────────────────────────────────────────
   Treat the whole frame as a single instrument. Top-left identity,
   top-right minimal nav + status, left-column hero statement, and a
   protected `THREE MOTIONS` readout in the bottom-right. The
   differentiator one-liner sits in the bottom-left band. Nothing
   crosses the ring. */
function VariantHudInstrument() {
  return (
    <>
      <div className="hero-mock__topleft">
        <Brandmark />
        <span className="hero-mock__topleft-mark">THOUGHTFORM</span>
      </div>

      <nav className="hero-mock__topright" aria-label="Primary">
        <a className="hero-mock__menu-item" href="#practice">
          Practice
        </a>
        <a className="hero-mock__menu-item" href="#proof">
          Proof
        </a>
        <a className="hero-mock__menu-item" href="#contact">
          Contact
        </a>
        <span className="hero-mock__menu-status">
          <span className="hero-mock__menu-status-dot" />
          EMBEDDED · 2026
        </span>
      </nav>

      <div className="hero-mock__content hero-mock__content--v2">
        <span className="hero-mock__eyebrow">
          <span className="hero-mock__eyebrow-dot" />
          Embedded AI enablement
        </span>
        <h1 className="hero-mock__headline">
          An intelligence layer, built <em>inside your work.</em>
        </h1>
        <p className="hero-mock__subhead">
          Six weeks alongside an embedded operator. Three motions. Substrate that compounds.
        </p>
      </div>

      <p className="hero-mock__diff-line">
        We sell readiness, <em>not retainers.</em>
      </p>

      <aside className="hero-mock__panel hero-mock__panel--motions" aria-label="Three motions">
        <div className="hero-mock__panel-label">THREE MOTIONS</div>
        <ol className="hero-mock__motions-list">
          <li>
            <span className="hero-mock__motions-num">01</span>
            <span className="hero-mock__motions-name">NAVIGATE</span>
            <span className="hero-mock__motions-body">
              Work the intelligence inside real workflows.
            </span>
          </li>
          <li>
            <span className="hero-mock__motions-num">02</span>
            <span className="hero-mock__motions-name">ENCODE</span>
            <span className="hero-mock__motions-body">
              Capture the team&apos;s judgment as owned substrate.
            </span>
          </li>
          <li>
            <span className="hero-mock__motions-num">03</span>
            <span className="hero-mock__motions-name">BUILD</span>
            <span className="hero-mock__motions-body">
              Ship a thin capability the team keeps running.
            </span>
          </li>
        </ol>
      </aside>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   V3 — Annotated Object (Sutéra principle)
   ─────────────────────────────────────────────────────────────────────
   The ring stays the unspoiled subject. Three tiny annotation diamonds
   sit on the BOTTOM silhouette of the ring (where the bright object
   meets the darker video band) and drop short vertical leader lines
   into a horizontal row of compact mono labels in the BOTTOM safe
   band — never crossing the headline column or the bright side of the
   ring. The Sutéra-style etymology card lives in the TOP-RIGHT corner
   so it never fights the bottom annotations. */
function VariantAnnotatedObject() {
  return (
    <>
      <div className="hero-mock__topleft">
        <Brandmark />
        <span className="hero-mock__topleft-mark">THOUGHTFORM</span>
      </div>

      <aside
        className="hero-mock__panel hero-mock__panel--definition hero-mock__panel--tr"
        aria-label="Definition"
      >
        <div className="hero-mock__panel-label">THOUGHTFORM /θɔːtfɔːrm/</div>
        <p className="hero-mock__definition-body">
          <span>n.</span> An intelligence layer that compounds inside a team&apos;s work.
        </p>
        <p className="hero-mock__definition-body">
          <span>v.</span> To navigate, encode, and build with AI as intelligence.
        </p>
      </aside>

      <div className="hero-mock__content hero-mock__content--v3">
        <span className="hero-mock__eyebrow">
          <span className="hero-mock__eyebrow-dot" />
          Embedded AI enablement
        </span>
        <h1 className="hero-mock__headline">
          An intelligence layer, built <em>inside your work.</em>
        </h1>
        <p className="hero-mock__subhead">
          We embed in your team, encode how you work into substrate the AI can inherit, and leave
          the capability running.
        </p>
      </div>

      {/* Annotation layer — pins on the ring's BOTTOM edge, each
          dropping a short vertical leader line into a horizontal row
          of compact mono labels parked in the bottom safe band. The
          labels sit outside the headline column AND outside the
          ring's bright disc. */}
      <div className="hero-mock__annotations" aria-hidden="true">
        <svg
          className="hero-mock__annotation-lines"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <path className="hero-mock__annotation-line" d="M55 78 L55 86 L52 86" pathLength="1" />
          <path className="hero-mock__annotation-line" d="M68 80 L68 88 L65 88" pathLength="1" />
          <path className="hero-mock__annotation-line" d="M81 78 L81 90 L78 90" pathLength="1" />
        </svg>
        <span className="hero-mock__annotation-pin hero-mock__annotation-pin--01" />
        <span className="hero-mock__annotation-pin hero-mock__annotation-pin--02" />
        <span className="hero-mock__annotation-pin hero-mock__annotation-pin--03" />
      </div>

      <ol className="hero-mock__annotation-row" aria-label="Three motions">
        <li>
          <span className="hero-mock__annotation-num">01</span>
          <span className="hero-mock__annotation-name">NAVIGATE</span>
        </li>
        <li>
          <span className="hero-mock__annotation-num">02</span>
          <span className="hero-mock__annotation-name">ENCODE</span>
        </li>
        <li>
          <span className="hero-mock__annotation-num">03</span>
          <span className="hero-mock__annotation-name">BUILD</span>
        </li>
      </ol>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   V4 — Foundry Split (WorldQuant / Retronova principle)
   ─────────────────────────────────────────────────────────────────────
   The hero statement is split vertically across the LEFT safe column:
   "AN INTELLIGENCE LAYER" anchors the upper third, "BUILT INSIDE YOUR
   WORK." anchors the lower third. The ring breathes between them. The
   right side carries only protected micro-elements: a top-right menu
   strip and a bottom-right CTA chip on a dark backplate. Mono labels
   in the left rail mark the chapter ("01 / HERO") so the read keeps
   the WorldQuant foundry tone. */
function VariantFoundrySplit() {
  return (
    <>
      <div className="hero-mock__topleft">
        <Brandmark />
        <span className="hero-mock__topleft-mark">THOUGHTFORM</span>
      </div>

      <nav className="hero-mock__topright" aria-label="Primary">
        <a className="hero-mock__menu-item" href="#practice">
          Practice
        </a>
        <a className="hero-mock__menu-item" href="#proof">
          Proof
        </a>
        <a className="hero-mock__menu-item" href="#contact">
          Contact
        </a>
      </nav>

      <span className="hero-mock__chapter">
        <span className="hero-mock__chapter-num">01</span>
        <span className="hero-mock__chapter-label">HERO</span>
      </span>

      <h1 className="hero-mock__split-line hero-mock__split-line--top">
        AN INTELLIGENCE
        <br />
        LAYER
      </h1>

      <p className="hero-mock__split-mid">
        <span className="hero-mock__split-mid-bracket">[</span>
        Embedded AI enablement
        <span className="hero-mock__split-mid-bracket">]</span>
      </p>

      <h1 className="hero-mock__split-line hero-mock__split-line--bottom">
        BUILT INSIDE
        <br />
        YOUR WORK.
      </h1>

      <a className="hero-mock__cta" href="#contact">
        <span className="hero-mock__cta-label">INITIATE CONTACT</span>
        <span className="hero-mock__cta-arrow" aria-hidden="true">
          ↗
        </span>
      </a>
    </>
  );
}
