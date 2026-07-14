"use client";

import { useState, useMemo } from "react";
import { renderRegistryComponent, getRegistryComponent } from "./registry-map";

// ═══════════════════════════════════════════════════════════════════════════
// DESIGN CARD - mcp-ui Compatible Design Proposal Card
// Phase 3: Interactive "design cards" with previews and Apply actions
//
// These cards are rendered in the Assistant chat to show proposed changes
// to components. They include:
// - Live preview of the component with proposed changes
// - Before/after comparison mode
// - "Apply" button to commit changes to the canvas
// - Expandable details showing the args diff
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Design operation types - args-first operations
 */
export type DesignOperation =
  | { type: "updateArgs"; itemId: string; patch: Record<string, unknown> }
  | { type: "updateStyleVars"; itemId: string; patch: Record<string, string> }
  | { type: "swapComponent"; itemId: string; newRegistryKey: string }
  | { type: "createItem"; registryKey: string; args: Record<string, unknown>; name?: string }
  | { type: "duplicateItem"; itemId: string; offsetX?: number; offsetY?: number }
  | { type: "deleteItem"; itemId: string }
  | { type: "saveAsTemplate"; itemId: string; templateName: string }
  | { type: "promoteToVault"; templateId: string };

/**
 * A design card proposal - mcp-ui compatible structure
 */
export interface DesignCardProposal {
  /** Unique ID for this proposal */
  id: string;
  /** Human-readable title */
  title: string;
  /** Description of what this change does */
  description: string;
  /** The operation to perform when applied */
  operation: DesignOperation;
  /** Preview configuration */
  preview?: {
    /** Registry key for preview rendering */
    registryKey: string;
    /** Current args (before change) */
    currentArgs?: Record<string, unknown>;
    /** Proposed args (after change) */
    proposedArgs: Record<string, unknown>;
    /** Style vars to apply */
    styleVars?: Record<string, string>;
  };
  /** Tags for categorization */
  tags?: string[];
  /** Confidence score (0-1) from AI */
  confidence?: number;
}

export interface DesignCardProps {
  /** The proposal to display */
  proposal: DesignCardProposal;
  /** Called when user clicks Apply */
  onApply: (operation: DesignOperation) => void;
  /** Called when user dismisses the card */
  onDismiss?: () => void;
  /** Whether the card is in a compact inline mode */
  compact?: boolean;
  /** Whether to show the diff details */
  showDiff?: boolean;
}

/**
 * DesignCard - Renders a design proposal with live preview and Apply action
 */
export function DesignCard({
  proposal,
  onApply,
  onDismiss,
  compact = false,
  showDiff = false,
}: DesignCardProps) {
  const [isExpanded, setIsExpanded] = useState(showDiff);
  const [viewMode, setViewMode] = useState<"proposed" | "current" | "diff">("proposed");
  const [isApplying, setIsApplying] = useState(false);

  // Render preview
  const previewContent = useMemo(() => {
    if (!proposal.preview) return null;

    const { registryKey, currentArgs, proposedArgs, styleVars } = proposal.preview;
    const def = getRegistryComponent(registryKey);
    if (!def) return null;

    const argsToRender = viewMode === "current" && currentArgs ? currentArgs : proposedArgs;

    // Render with style vars wrapper
    const rendered = renderRegistryComponent(registryKey, argsToRender);
    if (!rendered) return null;

    if (styleVars && Object.keys(styleVars).length > 0) {
      return <div style={styleVars as React.CSSProperties}>{rendered}</div>;
    }

    return rendered;
  }, [proposal.preview, viewMode]);

  // Calculate diff for display
  const diffEntries = useMemo(() => {
    if (!proposal.preview?.currentArgs || !proposal.preview?.proposedArgs) return [];

    const current = proposal.preview.currentArgs;
    const proposed = proposal.preview.proposedArgs;
    const allKeys = new Set([...Object.keys(current), ...Object.keys(proposed)]);

    return Array.from(allKeys)
      .map((key) => {
        const currentVal = current[key];
        const proposedVal = proposed[key];
        const changed = JSON.stringify(currentVal) !== JSON.stringify(proposedVal);
        return { key, currentVal, proposedVal, changed };
      })
      .filter((entry) => entry.changed);
  }, [proposal.preview]);

  // Handle apply
  const handleApply = async () => {
    setIsApplying(true);
    try {
      onApply(proposal.operation);
    } finally {
      setIsApplying(false);
    }
  };

  // Get operation type label
  const operationLabel = useMemo(() => {
    switch (proposal.operation.type) {
      case "updateArgs":
        return "Update Props";
      case "updateStyleVars":
        return "Update Style";
      case "swapComponent":
        return "Swap Component";
      case "createItem":
        return "Create New";
      case "duplicateItem":
        return "Duplicate";
      case "deleteItem":
        return "Delete";
      case "saveAsTemplate":
        return "Save Template";
      case "promoteToVault":
        return "Promote to Vault";
      default:
        return "Apply";
    }
  }, [proposal.operation.type]);

  if (compact) {
    return (
      <div className="design-card design-card--compact">
        <div className="design-card__header">
          <span className="design-card__title">{proposal.title}</span>
          <button
            className="design-card__apply design-card__apply--compact"
            onClick={handleApply}
            disabled={isApplying}
          >
            {isApplying ? "..." : "◇ Apply"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="design-card">
      {/* Header */}
      <div className="design-card__header">
        <div className="design-card__header-content">
          <span className="design-card__title">{proposal.title}</span>
          {proposal.confidence !== undefined && (
            <span className="design-card__confidence">
              {Math.round(proposal.confidence * 100)}%
            </span>
          )}
        </div>
        {onDismiss && (
          <button className="design-card__dismiss" onClick={onDismiss} title="Dismiss">
            ×
          </button>
        )}
      </div>

      {/* Description */}
      <p className="design-card__description">{proposal.description}</p>

      {/* Preview */}
      {previewContent && (
        <div className="design-card__preview-container">
          {/* View mode toggle (only show if we have current args) */}
          {proposal.preview?.currentArgs && (
            <div className="design-card__view-toggle">
              <button
                className={`design-card__view-btn ${viewMode === "proposed" ? "design-card__view-btn--active" : ""}`}
                onClick={() => setViewMode("proposed")}
              >
                Proposed
              </button>
              <button
                className={`design-card__view-btn ${viewMode === "current" ? "design-card__view-btn--active" : ""}`}
                onClick={() => setViewMode("current")}
              >
                Current
              </button>
            </div>
          )}
          <div className="design-card__preview">{previewContent}</div>
        </div>
      )}

      {/* Tags */}
      {proposal.tags && proposal.tags.length > 0 && (
        <div className="design-card__tags">
          {proposal.tags.map((tag) => (
            <span key={tag} className="design-card__tag">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Expandable Diff */}
      {diffEntries.length > 0 && (
        <div className="design-card__diff-section">
          <button className="design-card__diff-toggle" onClick={() => setIsExpanded(!isExpanded)}>
            <span className="design-card__diff-toggle-icon">{isExpanded ? "▾" : "▸"}</span>
            {diffEntries.length} change{diffEntries.length !== 1 ? "s" : ""}
          </button>
          {isExpanded && (
            <div className="design-card__diff">
              {diffEntries.map(({ key, proposedVal }) => (
                <div key={key} className="design-card__diff-row">
                  <span className="design-card__diff-key">{key}</span>
                  <span className="design-card__diff-arrow">→</span>
                  <span className="design-card__diff-value design-card__diff-value--new">
                    {typeof proposedVal === "object"
                      ? JSON.stringify(proposedVal)
                      : String(proposedVal)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="design-card__actions">
        <button className="design-card__apply" onClick={handleApply} disabled={isApplying}>
          {isApplying ? "Applying..." : `◇ ${operationLabel}`}
        </button>
      </div>
    </div>
  );
}

/**
 * DesignCardList - Renders multiple design cards
 */
export interface DesignCardListProps {
  proposals: DesignCardProposal[];
  onApply: (operation: DesignOperation) => void;
  onDismiss?: (proposalId: string) => void;
  compact?: boolean;
}

export function DesignCardList({
  proposals,
  onApply,
  onDismiss,
  compact = false,
}: DesignCardListProps) {
  if (proposals.length === 0) return null;

  return (
    <div className="design-card-list">
      {proposals.map((proposal) => (
        <DesignCard
          key={proposal.id}
          proposal={proposal}
          onApply={onApply}
          onDismiss={onDismiss ? () => onDismiss(proposal.id) : undefined}
          compact={compact}
        />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER: Create proposals from assistant responses
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Convert a patch response from the chat API into a DesignCardProposal
 */
export function createProposalFromPatch(
  itemId: string,
  registryKey: string,
  currentArgs: Record<string, unknown>,
  patch: {
    setProps?: Record<string, unknown>;
    setStyleVars?: Record<string, string>;
  },
  options?: {
    title?: string;
    description?: string;
  }
): DesignCardProposal {
  const hasProps = patch.setProps && Object.keys(patch.setProps).length > 0;
  const hasStyleVars = patch.setStyleVars && Object.keys(patch.setStyleVars).length > 0;

  // Determine operation type
  let operation: DesignOperation;
  if (hasProps && !hasStyleVars) {
    operation = { type: "updateArgs", itemId, patch: patch.setProps! };
  } else if (hasStyleVars && !hasProps) {
    operation = { type: "updateStyleVars", itemId, patch: patch.setStyleVars! };
  } else {
    // Combined update - use updateArgs with merged patch
    operation = { type: "updateArgs", itemId, patch: { ...patch.setProps, ...patch.setStyleVars } };
  }

  // Merge proposed args
  const proposedArgs = { ...currentArgs, ...patch.setProps };

  return {
    id: `proposal-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    title: options?.title || "Suggested Change",
    description: options?.description || "Apply the proposed modifications to this component.",
    operation,
    preview: {
      registryKey,
      currentArgs,
      proposedArgs,
      styleVars: patch.setStyleVars,
    },
  };
}

/**
 * Convert a variant suggestion into a DesignCardProposal for creating a new item
 */
export function createProposalFromVariant(
  registryKey: string,
  variant: {
    name: string;
    description: string;
    props: Record<string, unknown>;
    styleVars?: Record<string, string>;
  }
): DesignCardProposal {
  return {
    id: `variant-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    title: variant.name,
    description: variant.description,
    operation: {
      type: "createItem",
      registryKey,
      args: variant.props,
      name: variant.name,
    },
    preview: {
      registryKey,
      proposedArgs: variant.props,
      styleVars: variant.styleVars,
    },
    tags: ["variant"],
  };
}
