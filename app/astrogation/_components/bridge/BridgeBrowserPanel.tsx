"use client";

import { useEffect, useState, memo } from "react";
import { useBridgeState, loadFileTree, expandNode, selectNode } from "./useBridgeState";

// ═══════════════════════════════════════════════════════════════
// BRIDGE BROWSER PANEL - Figma file tree navigator
// ═══════════════════════════════════════════════════════════════

import type { FigmaTreeNode } from "@/lib/figma/types";

/** Icon for node type */
function nodeIcon(type: string, isComponent?: boolean): string {
  if (isComponent) return "◆";
  switch (type) {
    case "DOCUMENT":
      return "📄";
    case "CANVAS":
      return "▦";
    case "FRAME":
      return "▢";
    case "GROUP":
      return "▣";
    case "SECTION":
      return "§";
    case "COMPONENT":
    case "COMPONENT_SET":
      return "◆";
    case "INSTANCE":
      return "◇";
    case "TEXT":
      return "T";
    case "VECTOR":
    case "BOOLEAN_OPERATION":
    case "STAR":
    case "LINE":
    case "ELLIPSE":
    case "REGULAR_POLYGON":
    case "RECTANGLE":
      return "△";
    default:
      return "·";
  }
}

interface TreeItemProps {
  node: FigmaTreeNode;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onExpand: (id: string) => void;
  filter: string;
  showComponentsOnly: boolean;
}

const TreeItem = memo(function TreeItem({
  node,
  depth,
  selectedId,
  onSelect,
  onExpand,
  filter,
  showComponentsOnly,
}: TreeItemProps) {
  const [expanded, setExpanded] = useState(depth < 1);
  const isSelected = node.id === selectedId;
  const hasChildren = node.hasChildren && (node.children?.length ?? 0) > 0;
  const canExpand = node.hasChildren;

  // Filter logic
  if (filter) {
    const matchesSelf = node.name.toLowerCase().includes(filter.toLowerCase());
    const matchesChild = node.children?.some((c) =>
      c.name.toLowerCase().includes(filter.toLowerCase())
    );
    if (!matchesSelf && !matchesChild) return null;
  }

  if (showComponentsOnly && !node.isComponent && !node.children?.some((c) => c.isComponent)) {
    // Skip non-component nodes (but keep parents that contain components)
    if (!node.children?.length) return null;
  }

  const handleToggle = () => {
    if (canExpand && !hasChildren) {
      // Need to fetch children
      onExpand(node.id);
    }
    setExpanded(!expanded);
  };

  const handleSelect = () => {
    onSelect(node.id);
  };

  return (
    <div className="bridge-tree-item">
      <div
        className={`bridge-tree-row ${isSelected ? "bridge-tree-row--selected" : ""}`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleSelect}
        onDoubleClick={handleToggle}
      >
        {canExpand ? (
          <button
            className="bridge-tree-expander"
            onClick={(e) => {
              e.stopPropagation();
              handleToggle();
            }}
          >
            {expanded ? "▾" : "▸"}
          </button>
        ) : (
          <span className="bridge-tree-spacer" />
        )}
        <span
          className={`bridge-tree-icon ${node.isComponent ? "bridge-tree-icon--component" : ""}`}
        >
          {nodeIcon(node.type, node.isComponent)}
        </span>
        <span className="bridge-tree-name" title={node.name}>
          {node.name}
        </span>
        {(node.childCount ?? 0) > 0 && <span className="bridge-tree-count">{node.childCount}</span>}
      </div>
      {expanded && hasChildren && (
        <div className="bridge-tree-children">
          {node.children!.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              onExpand={onExpand}
              filter={filter}
              showComponentsOnly={showComponentsOnly}
            />
          ))}
        </div>
      )}
    </div>
  );
});

export function BridgeBrowserPanel() {
  const state = useBridgeState();
  const [filter, setFilter] = useState("");
  const [showComponentsOnly, setShowComponentsOnly] = useState(false);

  useEffect(() => {
    if (!state.tree && !state.treeLoading) {
      loadFileTree();
    }
  }, [state.tree, state.treeLoading]);

  const handleSelect = (nodeId: string) => {
    selectNode(nodeId);
  };

  const handleExpand = (nodeId: string) => {
    expandNode(nodeId);
  };

  return (
    <aside className="astrogation-panel astrogation-panel--left">
      <div className="panel-header panel-header--filled">FIGMA BRIDGE</div>

      <div className="bridge-browser-controls">
        <input
          type="text"
          className="bridge-search-input"
          placeholder="Filter layers..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <label className="bridge-filter-toggle">
          <input
            type="checkbox"
            checked={showComponentsOnly}
            onChange={(e) => setShowComponentsOnly(e.target.checked)}
          />
          <span className="bridge-filter-label">Components only</span>
        </label>
      </div>

      <div className="panel-scroll-area">
        {state.treeLoading && (
          <div className="bridge-loading">
            <span className="bridge-loading-dot" />
            Loading file structure...
          </div>
        )}

        {state.treeError && (
          <div className="bridge-error">
            <div className="bridge-error-title">Connection Error</div>
            <div className="bridge-error-message">{state.treeError}</div>
            <button className="bridge-retry-btn" onClick={() => loadFileTree()}>
              RETRY
            </button>
          </div>
        )}

        {state.tree && !state.treeLoading && (
          <>
            {state.fileName && (
              <div className="bridge-file-info">
                <span className="bridge-file-name">{state.fileName}</span>
                {state.lastModified && (
                  <span className="bridge-file-date">
                    {new Date(state.lastModified).toLocaleDateString()}
                  </span>
                )}
              </div>
            )}
            <div className="bridge-tree">
              {state.tree.children?.map((page) => (
                <TreeItem
                  key={page.id}
                  node={page}
                  depth={0}
                  selectedId={state.selectedNodeId}
                  onSelect={handleSelect}
                  onExpand={handleExpand}
                  filter={filter}
                  showComponentsOnly={showComponentsOnly}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
