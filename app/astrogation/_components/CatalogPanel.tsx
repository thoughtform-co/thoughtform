"use client";

import { useState, memo } from "react";
import {
  CATEGORIES,
  HIERARCHY_BREAKS,
  getComponentsByCategory,
  searchComponents,
} from "../catalog";
import {
  TreeProvider,
  TreeView,
  TreeNode,
  TreeNodeTrigger,
  TreeExpander,
  TreeIcon,
  TreeLabel,
  TreeNodeContent,
} from "@/components/ui/Tree";

// ═══════════════════════════════════════════════════════════════
// LEFT PANEL - CATALOG
// ═══════════════════════════════════════════════════════════════

export interface CatalogPanelProps {
  selectedCategory: string | null;
  onSelectCategory: (id: string) => void;
  selectedComponentId: string | null;
  onSelectComponent: (id: string) => void;
}

function CatalogPanelInner({
  selectedCategory,
  onSelectCategory,
  selectedComponentId,
  onSelectComponent,
}: CatalogPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const filteredComponents = searchQuery ? searchComponents(searchQuery) : null;

  // Build initial expanded IDs
  const defaultExpandedIds = ["brand"];

  return (
    <aside className="astrogation-panel astrogation-panel--left">
      {/* Panel Header */}
      <div className="panel-header panel-header--filled">BRAND SYSTEM</div>

      {/* Scrollable content area */}
      <div className="panel-content">
        {/* Search */}
        <div className="astrogation-section">
          <div className="input-group">
            <input
              type="text"
              className="input-group__input"
              placeholder="Search components..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Search Results */}
        {filteredComponents && (
          <div className="astrogation-section">
            <div className="astrogation-section__label">Results ({filteredComponents.length})</div>
            {filteredComponents.map((comp) => (
              <button
                key={comp.id}
                className={`catalog-item ${selectedComponentId === comp.id ? "selected" : ""}`}
                onClick={() => onSelectComponent(comp.id)}
              >
                {comp.name}
              </button>
            ))}
          </div>
        )}

        {/* Component Tree */}
        {!filteredComponents && (
          <div className="astrogation-section astrogation-section--categories">
            <TreeProvider
              defaultExpandedIds={defaultExpandedIds}
              selectedId={selectedComponentId}
              onSelectionChange={onSelectComponent}
            >
              <TreeView>
                {CATEGORIES.map((cat, catIndex) => {
                  const components = getComponentsByCategory(cat.id);
                  const hasChildren = components.length > 0;
                  const isLastCategory = catIndex === CATEGORIES.length - 1;
                  const showSeparator = HIERARCHY_BREAKS.includes(cat.id);

                  return (
                    <div key={cat.id}>
                      <TreeNode nodeId={cat.id} isLast={isLastCategory}>
                        <TreeNodeTrigger nodeId={cat.id} hasChildren={hasChildren}>
                          <TreeExpander nodeId={cat.id} hasChildren={hasChildren} />
                          <TreeIcon hasChildren nodeId={cat.id} />
                          <TreeLabel>{cat.name}</TreeLabel>
                        </TreeNodeTrigger>

                        <TreeNodeContent nodeId={cat.id} hasChildren={hasChildren}>
                          {components.map((comp, compIndex) => {
                            const isLast = compIndex === components.length - 1;
                            return (
                              <TreeNode key={comp.id} nodeId={comp.id} level={1} isLast={isLast}>
                                <TreeNodeTrigger
                                  nodeId={comp.id}
                                  onClick={() => onSelectComponent(comp.id)}
                                >
                                  <TreeExpander nodeId={comp.id} />
                                  <TreeIcon />
                                  <TreeLabel>{comp.name}</TreeLabel>
                                </TreeNodeTrigger>
                              </TreeNode>
                            );
                          })}
                        </TreeNodeContent>
                      </TreeNode>
                      {/* Hierarchy separator */}
                      {showSeparator && <div className="hierarchy-separator" />}
                    </div>
                  );
                })}
              </TreeView>
            </TreeProvider>
          </div>
        )}
      </div>
    </aside>
  );
}

// Memoized export - prevents re-renders when parent changes but props don't
export const CatalogPanel = memo(CatalogPanelInner);
