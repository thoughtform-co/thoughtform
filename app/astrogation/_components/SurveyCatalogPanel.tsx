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
import type { SearchSpace } from "../_hooks/useSurvey";

// ═══════════════════════════════════════════════════════════════
// SURVEY CATALOG PANEL - Filter references by category/component
// ═══════════════════════════════════════════════════════════════

export interface SurveyCatalogPanelProps {
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
  selectedComponentKey: string | null;
  onSelectComponent: (key: string | null) => void;
  itemCounts?: Record<string, number>;
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  onSearch?: (query: string, space?: SearchSpace) => Promise<void>;
  searchSpace?: SearchSpace;
  onSearchSpaceChange?: (space: SearchSpace) => void;
}

function SurveyCatalogPanelInner({
  selectedCategoryId,
  onSelectCategory,
  selectedComponentKey,
  onSelectComponent,
  itemCounts = {},
  searchQuery: externalSearchQuery = "",
  onSearchQueryChange,
  onSearch,
  searchSpace = "briefing",
  onSearchSpaceChange,
}: SurveyCatalogPanelProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const searchQuery = externalSearchQuery || localSearchQuery;
  const filteredComponents = searchQuery ? searchComponents(searchQuery) : null;

  const handleSearchChange = (value: string) => {
    setLocalSearchQuery(value);
    onSearchQueryChange?.(value);
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim()) {
      await onSearch(searchQuery.trim(), searchSpace);
    }
  };

  const handleSearchSpaceToggle = () => {
    const newSpace: SearchSpace = searchSpace === "briefing" ? "full" : "briefing";
    onSearchSpaceChange?.(newSpace);
  };

  // Build initial expanded IDs based on selection
  const defaultExpandedIds = selectedCategoryId ? [selectedCategoryId] : [];

  // Handle selection - determine if it's a category or component
  const handleSelection = (nodeId: string) => {
    // Check if it's a category
    const isCategory = CATEGORIES.some((cat) => cat.id === nodeId);

    if (isCategory) {
      if (selectedCategoryId === nodeId && !selectedComponentKey) {
        // Deselect category
        onSelectCategory(null);
      } else {
        onSelectCategory(nodeId);
        onSelectComponent(null);
      }
    } else {
      // It's a component - find its parent category
      const parentCategory = CATEGORIES.find((cat) => {
        const components = getComponentsByCategory(cat.id);
        return components.some((c) => c.id === nodeId);
      });

      if (selectedComponentKey === nodeId) {
        // Deselect component but keep category
        onSelectComponent(null);
      } else {
        // ═══════════════════════════════════════════════════════════════
        // SENTINEL BEST PRACTICE: State Update Order
        // ═══════════════════════════════════════════════════════════════
        // When dispatching multiple actions with dependencies, dispatch parent
        // state updates BEFORE dependent state updates.
        //
        // CRITICAL: SURVEY_SET_CATEGORY resets surveyComponentKey to null.
        // If we dispatch onSelectComponent() then onSelectCategory(), the
        // component selection gets immediately cleared.
        //
        // Solution: Update category first (only if changing), then component.
        // See: sentinel/BEST-PRACTICES.md → "Order Matters: Update Dependent State"
        // ═══════════════════════════════════════════════════════════════
        if (parentCategory && parentCategory.id !== selectedCategoryId) {
          onSelectCategory(parentCategory.id);
        }
        onSelectComponent(nodeId);
      }
    }
  };

  // Get count for a category or component
  const getCount = (id: string): number => {
    return itemCounts[id] || 0;
  };

  return (
    <aside className="astrogation-panel astrogation-panel--left">
      {/* Panel Header */}
      <div className="panel-header panel-header--filled">SURVEY FILTER</div>

      {/* Scrollable content area */}
      <div className="panel-content">
        {/* Search - Semantic search for survey items */}
        <div className="astrogation-section">
          <form className="input-group" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              className="input-group__input"
              placeholder="Search references..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="input-group__addon input-group__addon--end"
                onClick={() => handleSearchChange("")}
                title="Clear search"
              >
                ×
              </button>
            )}
          </form>

          {/* Search Space Toggle */}
          {onSearchSpaceChange && (
            <div className="search-space-toggle">
              <button
                type="button"
                className={`search-space-toggle__btn ${searchSpace === "briefing" ? "search-space-toggle__btn--active" : ""}`}
                onClick={() => onSearchSpaceChange("briefing")}
                title="Search by implementation briefing (focused)"
              >
                Briefing
              </button>
              <button
                type="button"
                className={`search-space-toggle__btn ${searchSpace === "full" ? "search-space-toggle__btn--active" : ""}`}
                onClick={() => onSearchSpaceChange("full")}
                title="Search by full context (notes, annotations, analysis)"
              >
                Full
              </button>
            </div>
          )}
        </div>

        {/* Search Results */}
        {filteredComponents && (
          <div className="astrogation-section">
            <div className="astrogation-section__label">Results ({filteredComponents.length})</div>
            {filteredComponents.map((comp) => (
              <button
                key={comp.id}
                className={`catalog-item ${selectedComponentKey === comp.id ? "selected" : ""}`}
                onClick={() => handleSelection(comp.id)}
              >
                <span>{comp.name}</span>
                {getCount(comp.id) > 0 && (
                  <span className="catalog-item__count">{getCount(comp.id)}</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Component Tree */}
        {!filteredComponents && (
          <div className="astrogation-section astrogation-section--categories">
            <TreeProvider
              defaultExpandedIds={defaultExpandedIds}
              selectedId={selectedComponentKey || selectedCategoryId}
              onSelectionChange={handleSelection}
            >
              <TreeView>
                {CATEGORIES.map((cat, catIndex) => {
                  const components = getComponentsByCategory(cat.id);
                  const hasChildren = components.length > 0;
                  const isLastCategory = catIndex === CATEGORIES.length - 1;
                  const showSeparator = HIERARCHY_BREAKS.includes(cat.id);
                  const categoryCount = getCount(cat.id);

                  return (
                    <div key={cat.id}>
                      <TreeNode nodeId={cat.id} isLast={isLastCategory}>
                        <TreeNodeTrigger nodeId={cat.id} hasChildren={hasChildren}>
                          <TreeExpander nodeId={cat.id} hasChildren={hasChildren} />
                          <TreeIcon hasChildren nodeId={cat.id} />
                          <TreeLabel>
                            {cat.name}
                            {categoryCount > 0 && (
                              <span className="tree-label__count">{categoryCount}</span>
                            )}
                          </TreeLabel>
                        </TreeNodeTrigger>

                        <TreeNodeContent nodeId={cat.id} hasChildren={hasChildren}>
                          {components.map((comp, compIndex) => {
                            const isLast = compIndex === components.length - 1;
                            const compCount = getCount(comp.id);
                            return (
                              <TreeNode key={comp.id} nodeId={comp.id} level={1} isLast={isLast}>
                                <TreeNodeTrigger
                                  nodeId={comp.id}
                                  onClick={() => handleSelection(comp.id)}
                                >
                                  <TreeExpander nodeId={comp.id} />
                                  <TreeIcon />
                                  <TreeLabel>
                                    {comp.name}
                                    {compCount > 0 && (
                                      <span className="tree-label__count">{compCount}</span>
                                    )}
                                  </TreeLabel>
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
export const SurveyCatalogPanel = memo(SurveyCatalogPanelInner);
