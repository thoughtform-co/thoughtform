"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

// ═══════════════════════════════════════════════════════════════
// TREE CONTEXT
// ═══════════════════════════════════════════════════════════════

interface TreeContextValue {
  expandedIds: Set<string>;
  selectedId: string | null;
  toggleExpanded: (id: string) => void;
  setSelected: (id: string) => void;
  showLines: boolean;
}

const TreeContext = createContext<TreeContextValue | null>(null);

function useTree() {
  const context = useContext(TreeContext);
  if (!context) {
    throw new Error("Tree components must be used within a TreeProvider");
  }
  return context;
}

// ═══════════════════════════════════════════════════════════════
// TREE PROVIDER
// ═══════════════════════════════════════════════════════════════

interface TreeProviderProps {
  children: ReactNode;
  defaultExpandedIds?: string[];
  selectedId?: string | null;
  onSelectionChange?: (id: string) => void;
  showLines?: boolean;
}

export function TreeProvider({
  children,
  defaultExpandedIds = [],
  selectedId: controlledSelectedId,
  onSelectionChange,
  showLines = true,
}: TreeProviderProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(defaultExpandedIds));
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);

  const selectedId = controlledSelectedId ?? internalSelectedId;

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const setSelected = useCallback(
    (id: string) => {
      if (onSelectionChange) {
        onSelectionChange(id);
      } else {
        setInternalSelectedId(id);
      }
    },
    [onSelectionChange]
  );

  return (
    <TreeContext.Provider
      value={{ expandedIds, selectedId, toggleExpanded, setSelected, showLines }}
    >
      {children}
    </TreeContext.Provider>
  );
}

// ═══════════════════════════════════════════════════════════════
// TREE VIEW (Root container)
// ═══════════════════════════════════════════════════════════════

interface TreeViewProps {
  children: ReactNode;
  className?: string;
}

export function TreeView({ children, className = "" }: TreeViewProps) {
  return <div className={`tree-view ${className}`}>{children}</div>;
}

// ═══════════════════════════════════════════════════════════════
// TREE NODE
// ═══════════════════════════════════════════════════════════════

interface TreeNodeProps {
  nodeId: string;
  children: ReactNode;
  level?: number;
  isLast?: boolean;
}

export function TreeNode({ children, level = 0, isLast = false }: TreeNodeProps) {
  return (
    <div className={`tree-node ${isLast ? "tree-node--last" : ""}`} data-level={level}>
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TREE NODE TRIGGER (Clickable row)
// ═══════════════════════════════════════════════════════════════

interface TreeNodeTriggerProps {
  children: ReactNode;
  nodeId: string;
  hasChildren?: boolean;
  onClick?: () => void;
}

export function TreeNodeTrigger({
  children,
  nodeId,
  hasChildren = false,
  onClick,
}: TreeNodeTriggerProps) {
  const { toggleExpanded, setSelected, selectedId } = useTree();

  const handleClick = () => {
    if (hasChildren) {
      toggleExpanded(nodeId);
    }
    if (onClick) {
      onClick();
    } else {
      setSelected(nodeId);
    }
  };

  return (
    <button
      className={`tree-node-trigger ${selectedId === nodeId ? "tree-node-trigger--selected" : ""}`}
      onClick={handleClick}
      type="button"
    >
      {children}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════
// TREE EXPANDER (Chevron icon)
// ═══════════════════════════════════════════════════════════════

interface TreeExpanderProps {
  nodeId: string;
  hasChildren?: boolean;
}

export function TreeExpander({ nodeId, hasChildren = false }: TreeExpanderProps) {
  const { expandedIds } = useTree();
  const isExpanded = expandedIds.has(nodeId);

  if (!hasChildren) {
    return <span className="tree-expander tree-expander--empty" />;
  }

  return <span className={`tree-expander ${isExpanded ? "tree-expander--expanded" : ""}`}>▸</span>;
}

// ═══════════════════════════════════════════════════════════════
// TREE ICON
// ═══════════════════════════════════════════════════════════════

interface TreeIconProps {
  icon?: ReactNode;
  hasChildren?: boolean;
  nodeId?: string;
}

export function TreeIcon({ icon, hasChildren = false, nodeId }: TreeIconProps) {
  const { expandedIds } = useTree();
  const isExpanded = nodeId ? expandedIds.has(nodeId) : false;

  if (icon) {
    return <span className="tree-icon">{icon}</span>;
  }

  // Default folder/file icons using simple symbols
  if (hasChildren) {
    return <span className="tree-icon tree-icon--folder">{isExpanded ? "◇" : "◆"}</span>;
  }

  return <span className="tree-icon tree-icon--file">○</span>;
}

// ═══════════════════════════════════════════════════════════════
// TREE LABEL
// ═══════════════════════════════════════════════════════════════

interface TreeLabelProps {
  children: ReactNode;
}

export function TreeLabel({ children }: TreeLabelProps) {
  return <span className="tree-label">{children}</span>;
}

// ═══════════════════════════════════════════════════════════════
// TREE NODE CONTENT (Expandable children container)
// ═══════════════════════════════════════════════════════════════

interface TreeNodeContentProps {
  children: ReactNode;
  nodeId: string;
  hasChildren?: boolean;
}

export function TreeNodeContent({ children, nodeId, hasChildren = false }: TreeNodeContentProps) {
  const { expandedIds, showLines } = useTree();
  const isExpanded = expandedIds.has(nodeId);

  if (!hasChildren || !isExpanded) {
    return null;
  }

  return (
    <div className={`tree-node-content ${showLines ? "tree-node-content--lines" : ""}`}>
      {children}
    </div>
  );
}
