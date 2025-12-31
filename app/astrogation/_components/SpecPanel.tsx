"use client";

import { memo, useState, useCallback } from "react";
import { getComponentById, PropDef } from "../catalog";

// ═══════════════════════════════════════════════════════════════
// IMPLEMENTATION DEPENDENCIES
// Simple tag-based display of design tokens, patterns, and properties
// ═══════════════════════════════════════════════════════════════

function ImplementationDependencies({
  componentId,
  frontendNotes,
}: {
  componentId: string;
  frontendNotes?: string;
}) {
  // Extract dependencies from component metadata and frontend notes
  const getDependencies = (id: string, notes?: string) => {
    const deps: { tokens: string[]; patterns: string[]; properties: string[] } = {
      tokens: [],
      patterns: [],
      properties: [],
    };

    // Extract CSS variables from frontend notes
    if (notes) {
      const varMatches = notes.match(/--[\w-]+/g);
      if (varMatches) {
        deps.tokens = [...new Set(varMatches)];
      }

      // Extract patterns from notes
      if (notes.includes("backdrop-filter")) deps.patterns.push("backdrop-filter");
      if (notes.includes("fixed") || notes.includes("position"))
        deps.patterns.push("fixed-position");
      if (notes.includes("semantic") || notes.includes("<nav>") || notes.includes("<button>"))
        deps.patterns.push("semantic-html");
      if (notes.includes("corner") || notes.includes("bracket"))
        deps.patterns.push("corner-brackets");
      if (notes.includes("hover") || notes.includes("focus"))
        deps.patterns.push("interactive-states");
      if (notes.includes("transition")) deps.patterns.push("transitions");
      if (notes.includes("clip-path") || notes.includes("pseudo"))
        deps.patterns.push("css-techniques");
    }

    // Fallback to type-based inference
    if (deps.tokens.length === 0) {
      if (id.includes("nav") || id === "navbar") {
        deps.tokens = ["--dawn", "--gold", "--gold-30", "--dawn-08"];
        if (deps.patterns.length === 0)
          deps.patterns = ["backdrop-filter", "fixed-position", "semantic-html"];
      } else if (id.includes("button")) {
        deps.tokens = ["--gold", "--dawn", "--void", "--gold-15"];
        if (deps.patterns.length === 0) deps.patterns = ["corner-brackets", "interactive-states"];
      } else if (id.includes("frame") || id.includes("card")) {
        deps.tokens = ["--dawn-08", "--dawn-15", "--gold", "--gold-30"];
        if (deps.patterns.length === 0) deps.patterns = ["corner-brackets", "border-variants"];
      } else if (id.includes("slider") || id.includes("toggle")) {
        deps.tokens = ["--gold", "--dawn-15", "--dawn-30"];
        if (deps.patterns.length === 0) deps.patterns = ["diamond-handle", "track-styling"];
      } else if (id.includes("color")) {
        deps.tokens = ["--void", "--dawn", "--gold"];
        if (deps.patterns.length === 0) deps.patterns = ["opacity-scale", "css-variables"];
      } else if (id.includes("type") || id.includes("font")) {
        deps.tokens = ["--font-display", "--font-body", "--font-mono"];
        if (deps.patterns.length === 0) deps.patterns = ["type-scale", "line-height"];
      } else {
        deps.tokens = ["--dawn", "--gold", "--void"];
        if (deps.patterns.length === 0) deps.patterns = ["css-variables", "design-tokens"];
      }
    }

    // Extract common properties
    if (notes) {
      if (notes.includes("padding")) deps.properties.push("padding");
      if (notes.includes("border")) deps.properties.push("border");
      if (notes.includes("color") || notes.includes("--dawn") || notes.includes("--gold"))
        deps.properties.push("color");
      if (notes.includes("background")) deps.properties.push("background");
      if (notes.includes("transform") || notes.includes("rotate"))
        deps.properties.push("transform");
      if (notes.includes("transition")) deps.properties.push("transition");
    }

    return deps;
  };

  const dependencies = getDependencies(componentId, frontendNotes);

  if (
    dependencies.tokens.length === 0 &&
    dependencies.patterns.length === 0 &&
    dependencies.properties.length === 0
  ) {
    return null;
  }

  return (
    <div className="spec-implementation-deps">
      <div className="spec-implementation-deps__tags">
        {dependencies.tokens.map((token) => (
          <span
            key={token}
            className="spec-implementation-deps__tag spec-implementation-deps__tag--token"
          >
            {token.replace("--", "")}
          </span>
        ))}
        {dependencies.patterns.map((pattern) => (
          <span
            key={pattern}
            className="spec-implementation-deps__tag spec-implementation-deps__tag--pattern"
          >
            {pattern.replace(/-/g, " ")}
          </span>
        ))}
        {dependencies.properties.map((prop) => (
          <span
            key={prop}
            className="spec-implementation-deps__tag spec-implementation-deps__tag--property"
          >
            {prop}
          </span>
        ))}
      </div>
    </div>
  );
}

// Props interface visualization
function PropsDiagram({ props }: { props: PropDef[] }) {
  if (props.length === 0) {
    return (
      <div className="spec-props-empty">
        <span className="spec-props-empty__icon">◇</span>
        <span>No configurable props</span>
      </div>
    );
  }

  return (
    <div className="spec-props-diagram">
      {props.slice(0, 4).map((prop, i) => (
        <div key={prop.name} className="spec-prop-node">
          <span className="spec-prop-node__connector" />
          <span className="spec-prop-node__name">{prop.name}</span>
          <span className="spec-prop-node__type">{prop.type}</span>
        </div>
      ))}
      {props.length > 4 && (
        <div className="spec-prop-node spec-prop-node--more">
          <span className="spec-prop-node__connector" />
          <span className="spec-prop-node__name">+{props.length - 4} more</span>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// INSPIRATION TAGS COMPONENT
// ═══════════════════════════════════════════════════════════════

function InspirationTags({ inspiration }: { inspiration: string }) {
  // Parse inspiration string into tags
  // Typically formatted as comma-separated phrases
  const tags = inspiration
    .split(/,(?![^(]*\))/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0 && t.length < 50);

  return (
    <div className="inspiration-tags">
      {tags.map((tag, i) => (
        <span key={i} className="inspiration-tag">
          <span className="inspiration-tag__diamond">◇</span>
          {tag}
        </span>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SPEC PANEL - Static Data / Documentation
// ═══════════════════════════════════════════════════════════════

export interface SpecPanelProps {
  selectedComponentId: string | null;
}

function SpecPanelInner({ selectedComponentId }: SpecPanelProps) {
  const [copied, setCopied] = useState(false);
  const def = selectedComponentId ? getComponentById(selectedComponentId) : null;

  const handleCopyId = useCallback(() => {
    if (def?.id) {
      navigator.clipboard.writeText(def.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }, [def?.id]);

  if (!def) {
    return (
      <aside className="astrogation-panel astrogation-panel--right">
        <div className="panel-header panel-header--filled">SPECIFICATIONS</div>
        <div className="panel-content panel-content--empty">
          <div className="spec-empty-state">
            <div className="spec-empty-state__visual">
              <svg viewBox="0 0 80 80" className="spec-empty-state__icon">
                <polygon
                  points="40,8 72,40 40,72 8,40"
                  fill="none"
                  stroke="var(--dawn-15)"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <polygon
                  points="40,20 60,40 40,60 20,40"
                  fill="none"
                  stroke="var(--dawn-08)"
                  strokeWidth="1"
                />
                <circle cx="40" cy="40" r="4" fill="var(--dawn-08)" />
              </svg>
            </div>
            <p className="spec-empty-state__text">Select a component</p>
            <span className="spec-empty-state__hint">to view specifications</span>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="astrogation-panel astrogation-panel--right">
      <div className="panel-header panel-header--filled">SPECIFICATIONS</div>
      <div className="panel-content">
        <div className="panel-content__scrollable">
          <div className="spec-panel-v2">
            {/* ─── HEADER ─── */}
            <header className="spec-header">
              <h2 className="spec-header__title">{def.name}</h2>
              <p className="spec-header__desc">{def.description}</p>
            </header>

            {/* ─── DESIGN INTENT (Philosophy + Inspiration Combined) ─── */}
            <section className="spec-section spec-intent">
              <div className="spec-section__label">
                <span className="spec-section__label-text">Design Intent</span>
                <span className="spec-section__label-line" />
              </div>

              <blockquote className="spec-intent__philosophy">
                {def.designRationale || "Technical specification pending detailed design analysis."}
              </blockquote>

              {def.inspiration && (
                <div className="spec-intent__sources">
                  <span className="spec-intent__sources-label">Inspiration Sources</span>
                  <InspirationTags inspiration={def.inspiration} />
                </div>
              )}
            </section>

            {/* ─── FRONTEND (Notes + Primitives) ─── */}
            <section className="spec-section spec-frontend">
              <div className="spec-section__label">
                <span className="spec-section__label-text">Frontend</span>
                <span className="spec-section__label-line" />
              </div>

              {/* Frontend Notes */}
              {def.frontendNotes && (
                <div className="spec-blueprint__notes">
                  <div className="spec-blueprint__notes-content">{def.frontendNotes}</div>
                </div>
              )}

              {/* Implementation Dependencies (System Primitives) */}
              <ImplementationDependencies componentId={def.id} frontendNotes={def.frontendNotes} />
            </section>

            {/* ─── COMPONENT (Interface + ID) ─── */}
            <section className="spec-section spec-component">
              <div className="spec-section__label">
                <span className="spec-section__label-text">Component</span>
                <span className="spec-section__label-line" />
              </div>

              {/* Props Visualization */}
              {def.props.length > 0 && (
                <div className="spec-blueprint__props">
                  <PropsDiagram props={def.props} />
                </div>
              )}

              {/* Component ID with copy */}
              <button
                className={`spec-blueprint__id ${copied ? "spec-blueprint__id--copied" : ""}`}
                onClick={handleCopyId}
                title="Copy component ID"
              >
                <span className="spec-blueprint__id-label">Ref ID</span>
                <span className="spec-blueprint__id-value">{def.id}</span>
                <span className="spec-blueprint__id-action">{copied ? "✓" : "copy"}</span>
              </button>
            </section>
          </div>
        </div>
      </div>
    </aside>
  );
}

// Memoized export - prevents re-renders when parent changes but props don't
export const SpecPanel = memo(SpecPanelInner);
