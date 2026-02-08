"use client";

import { useState } from "react";
import { useBridgeState, exportNodeSvg, loadTokenDiff, loadComponents } from "./useBridgeState";

// ═══════════════════════════════════════════════════════════════
// BRIDGE PREVIEW PANEL - Center panel for Bridge tab
// Shows node preview, SVG content, token diff, and component list
// ═══════════════════════════════════════════════════════════════

type PreviewTab = "preview" | "tokens" | "components";

export function BridgePreviewPanel() {
  const state = useBridgeState();
  const [activeView, setActiveView] = useState<PreviewTab>("preview");

  const handleExportSvg = async () => {
    if (!state.selectedNodeId) return;
    const svg = await exportNodeSvg(state.selectedNodeId);
    if (svg) {
      await navigator.clipboard.writeText(svg);
    }
  };

  const handleLoadTokens = () => {
    if (!state.tokenDiff) {
      loadTokenDiff();
    }
    setActiveView("tokens");
  };

  const handleLoadComponents = () => {
    if (!state.components.length) {
      loadComponents();
    }
    setActiveView("components");
  };

  return (
    <div className="bridge-preview-panel">
      {/* Sub-tabs */}
      <div className="bridge-subtabs">
        <button
          className={`bridge-subtab ${activeView === "preview" ? "bridge-subtab--active" : ""}`}
          onClick={() => setActiveView("preview")}
        >
          PREVIEW
        </button>
        <button
          className={`bridge-subtab ${activeView === "tokens" ? "bridge-subtab--active" : ""}`}
          onClick={handleLoadTokens}
        >
          TOKEN DIFF
        </button>
        <button
          className={`bridge-subtab ${activeView === "components" ? "bridge-subtab--active" : ""}`}
          onClick={handleLoadComponents}
        >
          COMPONENTS
        </button>
      </div>

      {/* Preview View */}
      {activeView === "preview" && (
        <div className="bridge-preview-content">
          {!state.selectedNodeId && (
            <div className="bridge-empty-state">
              <div className="bridge-empty-icon">⬘</div>
              <div className="bridge-empty-title">Select a Layer</div>
              <div className="bridge-empty-desc">
                Browse the file tree and select a frame or layer to preview it here.
              </div>
            </div>
          )}

          {state.selectedNodeLoading && (
            <div className="bridge-loading">
              <span className="bridge-loading-dot" />
              Loading preview...
            </div>
          )}

          {state.previewUrl && !state.selectedNodeLoading && (
            <div className="bridge-preview-image-container">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={state.previewUrl}
                alt={state.selectedNode?.name || "Preview"}
                className="bridge-preview-image"
              />
              <div className="bridge-preview-actions">
                <button className="bridge-action-btn" onClick={handleExportSvg}>
                  {state.exportLoading ? "EXPORTING..." : "COPY SVG"}
                </button>
              </div>
            </div>
          )}

          {state.svgContent && (
            <div className="bridge-svg-preview">
              <div className="bridge-svg-header">
                <span>SVG Content</span>
                <button
                  className="bridge-action-btn bridge-action-btn--sm"
                  onClick={() => navigator.clipboard.writeText(state.svgContent!)}
                >
                  COPY
                </button>
              </div>
              <pre className="bridge-svg-code">
                <code>{state.svgContent.slice(0, 2000)}</code>
                {state.svgContent.length > 2000 && (
                  <span className="bridge-svg-truncated">
                    ... ({state.svgContent.length.toLocaleString()} chars total)
                  </span>
                )}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Token Diff View */}
      {activeView === "tokens" && (
        <div className="bridge-tokens-content">
          {state.tokenDiffLoading && (
            <div className="bridge-loading">
              <span className="bridge-loading-dot" />
              Comparing tokens...
            </div>
          )}

          {state.tokenDiff && !state.tokenDiffLoading && (
            <>
              {/* Summary */}
              <div className="bridge-token-summary">
                <div className="bridge-token-stat bridge-token-stat--matched">
                  <span className="bridge-token-stat-value">{state.tokenDiff.summary.matched}</span>
                  <span className="bridge-token-stat-label">Matched</span>
                </div>
                <div className="bridge-token-stat bridge-token-stat--drifted">
                  <span className="bridge-token-stat-value">{state.tokenDiff.summary.drifted}</span>
                  <span className="bridge-token-stat-label">Drifted</span>
                </div>
                <div className="bridge-token-stat bridge-token-stat--figma">
                  <span className="bridge-token-stat-value">
                    {state.tokenDiff.summary.figmaOnly}
                  </span>
                  <span className="bridge-token-stat-label">Figma Only</span>
                </div>
                <div className="bridge-token-stat bridge-token-stat--code">
                  <span className="bridge-token-stat-value">
                    {state.tokenDiff.summary.codeOnly}
                  </span>
                  <span className="bridge-token-stat-label">Code Only</span>
                </div>
              </div>

              {/* Drifted tokens (most important) */}
              {state.tokenDiff.drifted.length > 0 && (
                <div className="bridge-token-section">
                  <div className="bridge-token-section-title">Drifted Tokens</div>
                  {state.tokenDiff.drifted.map((entry) => (
                    <div key={entry.name} className="bridge-token-row bridge-token-row--drifted">
                      <span className="bridge-token-name">{entry.codeName || entry.figmaName}</span>
                      <div className="bridge-token-values">
                        <span className="bridge-token-figma-val">
                          {entry.category === "color" && entry.figmaValue && (
                            <span
                              className="bridge-token-swatch"
                              style={{ backgroundColor: entry.figmaValue }}
                            />
                          )}
                          {entry.figmaValue}
                        </span>
                        <span className="bridge-token-arrow">→</span>
                        <span className="bridge-token-code-val">
                          {entry.category === "color" && entry.codeValue && (
                            <span
                              className="bridge-token-swatch"
                              style={{ backgroundColor: entry.codeValue }}
                            />
                          )}
                          {entry.codeValue}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Matched tokens */}
              {state.tokenDiff.matched.length > 0 && (
                <div className="bridge-token-section">
                  <div className="bridge-token-section-title">
                    Matched ({state.tokenDiff.matched.length})
                  </div>
                  {state.tokenDiff.matched.map((entry) => (
                    <div key={entry.name} className="bridge-token-row bridge-token-row--matched">
                      <span className="bridge-token-name">{entry.codeName}</span>
                      <span className="bridge-token-value">
                        {entry.category === "color" && entry.codeValue && (
                          <span
                            className="bridge-token-swatch"
                            style={{ backgroundColor: entry.codeValue }}
                          />
                        )}
                        {entry.codeValue}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Code-only tokens */}
              {state.tokenDiff.codeOnly.length > 0 && (
                <div className="bridge-token-section">
                  <div className="bridge-token-section-title">
                    Code Only ({state.tokenDiff.codeOnly.length})
                  </div>
                  {state.tokenDiff.codeOnly.slice(0, 20).map((entry) => (
                    <div key={entry.name} className="bridge-token-row bridge-token-row--code-only">
                      <span className="bridge-token-name">{entry.codeName}</span>
                      <span className="bridge-token-value">
                        {entry.category === "color" && entry.codeValue && (
                          <span
                            className="bridge-token-swatch"
                            style={{ backgroundColor: entry.codeValue }}
                          />
                        )}
                        {entry.codeValue}
                      </span>
                    </div>
                  ))}
                  {state.tokenDiff.codeOnly.length > 20 && (
                    <div className="bridge-token-more">
                      +{state.tokenDiff.codeOnly.length - 20} more
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Components View */}
      {activeView === "components" && (
        <div className="bridge-components-content">
          {state.componentsLoading && (
            <div className="bridge-loading">
              <span className="bridge-loading-dot" />
              Loading components...
            </div>
          )}

          {!state.componentsLoading && state.components.length === 0 && (
            <div className="bridge-empty-state">
              <div className="bridge-empty-title">No Components</div>
              <div className="bridge-empty-desc">
                No components found in this Figma file, or the file key is not configured.
              </div>
            </div>
          )}

          {state.components.length > 0 && (
            <div className="bridge-component-list">
              {state.components.map((comp) => (
                <div
                  key={comp.nodeId}
                  className="bridge-component-item"
                  onClick={() => {
                    // Select the component node in the tree
                    const nodeId = comp.nodeId;
                    import("./useBridgeState").then(({ selectNode }) => selectNode(nodeId));
                    setActiveView("preview");
                  }}
                >
                  <span className="bridge-component-icon">◆</span>
                  <div className="bridge-component-info">
                    <span className="bridge-component-name">{comp.name}</span>
                    {comp.description && (
                      <span className="bridge-component-desc">{comp.description}</span>
                    )}
                    {comp.containingFrame && (
                      <span className="bridge-component-page">
                        {comp.containingFrame.pageName} / {comp.containingFrame.name}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
