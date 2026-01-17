"use client";

import { useState, useEffect, useCallback, memo } from "react";
import {
  CATEGORIES,
  HIERARCHY_BREAKS,
  getComponentsByCategory,
  getComponentById,
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
import type { FoundryTemplate, FoundryCanvasItem, ComponentSource } from "./types";
import { supabase } from "@/lib/supabase";
import {
  getRegistryKeyForCatalog,
  isRegistryComponent,
  getRegistryComponent,
} from "./registry-map";

// ═══════════════════════════════════════════════════════════════
// FOUNDRY TEMPLATES PANEL - Left panel for Foundry tab
// Shows templates (drafts) and allows adding components to canvas
// ═══════════════════════════════════════════════════════════════

export interface FoundryTemplatesPanelProps {
  /** User ID for fetching templates (null = localStorage fallback) */
  userId?: string | null;
  /**
   * Callback when a template or component is selected to add to canvas
   * Now supports ComponentSource model with source, registryKey, args
   */
  onAddToCanvas: (item: Omit<FoundryCanvasItem, "id" | "frame">) => void;
}

function FoundryTemplatesPanelInner({ userId, onAddToCanvas }: FoundryTemplatesPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [templates, setTemplates] = useState<FoundryTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<"catalog" | "templates">("catalog");

  const filteredComponents = searchQuery ? searchComponents(searchQuery) : null;

  // Load templates on mount
  useEffect(() => {
    async function loadTemplates() {
      setIsLoading(true);

      // localStorage fallback if no user
      if (!userId) {
        try {
          const stored = localStorage.getItem("foundry_templates");
          if (stored) {
            setTemplates(JSON.parse(stored));
          }
        } catch (e) {
          console.warn("Failed to load templates from localStorage:", e);
        }
        setIsLoading(false);
        return;
      }

      if (!supabase) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("foundry_templates")
          .select("*")
          .eq("user_id", userId)
          .order("updated_at", { ascending: false });

        if (error) {
          console.error("Failed to load templates:", error);
          return;
        }

        setTemplates(data || []);
      } catch (e) {
        console.error("Failed to load templates from Supabase:", e);
      } finally {
        setIsLoading(false);
      }
    }

    loadTemplates();
  }, [userId]);

  // Group templates by category
  const templatesByCategory = templates.reduce(
    (acc, template) => {
      const categoryId = template.category_id || "uncategorized";
      if (!acc[categoryId]) {
        acc[categoryId] = [];
      }
      acc[categoryId].push(template);
      return acc;
    },
    {} as Record<string, FoundryTemplate[]>
  );

  // Handle adding a component from catalog to canvas
  const handleAddComponent = useCallback(
    (componentId: string) => {
      const def = getComponentById(componentId);
      if (!def) return;

      // Check if this component has a registry mapping
      const registryKey = getRegistryKeyForCatalog(componentId);
      const hasRegistry = registryKey && isRegistryComponent(registryKey);

      // Build default props from component definition (legacy)
      const defaultProps: Record<string, unknown> = {};
      def.props.forEach((p) => {
        defaultProps[p.name] = p.default;
      });

      // If registry component exists, use args-based approach
      if (hasRegistry) {
        const registryDef = getRegistryComponent(registryKey);
        onAddToCanvas({
          name: def.name,
          source: "registry" as ComponentSource,
          registryKey,
          componentId: def.id,
          args: registryDef?.defaultArgs || defaultProps,
          props: defaultProps, // Keep for backwards compat
        });
      } else {
        // Legacy preview mode
        onAddToCanvas({
          name: def.name,
          source: "legacyPreview" as ComponentSource,
          componentId: def.id,
          props: defaultProps,
        });
      }
    },
    [onAddToCanvas]
  );

  // Handle adding a template to canvas
  const handleAddTemplate = useCallback(
    (template: FoundryTemplate) => {
      // Extract args and styleVars from config
      const { args, styleVars, __style, ...legacyProps } = template.config;

      // Determine source - prefer registry if available
      const effectiveSource =
        template.source || (template.registry_key ? "registry" : "legacyPreview");
      const effectiveRegistryKey =
        template.registry_key || getRegistryKeyForCatalog(template.component_key);

      // Merge args (new) with legacy props
      const effectiveArgs = args || legacyProps;

      // Extract styleVars from __style (legacy) or direct styleVars
      const effectiveStyleVars =
        styleVars ||
        (__style
          ? ((__style as { styleVars?: Record<string, string> }).styleVars ?? undefined)
          : undefined);

      onAddToCanvas({
        name: template.name,
        source: effectiveSource as ComponentSource,
        registryKey: effectiveRegistryKey,
        componentId: template.component_key,
        args: effectiveArgs as Record<string, unknown>,
        props: legacyProps as Record<string, unknown>, // Keep for backwards compat
        styleVars: effectiveStyleVars,
      });
    },
    [onAddToCanvas]
  );

  // Build initial expanded IDs
  const defaultExpandedIds = ["brand"];

  return (
    <aside className="astrogation-panel astrogation-panel--left">
      {/* Panel Header */}
      <div className="panel-header panel-header--filled">FOUNDRY</div>

      {/* Scrollable content area */}
      <div className="panel-content">
        {/* Search */}
        <div className="astrogation-section">
          <div className="input-group">
            <input
              type="text"
              className="input-group__input"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Section Toggle */}
        <div className="astrogation-section">
          <div className="foundry-templates__tabs">
            <button
              className={`foundry-templates__tab ${activeSection === "catalog" ? "foundry-templates__tab--active" : ""}`}
              onClick={() => setActiveSection("catalog")}
            >
              Add Component
            </button>
            <button
              className={`foundry-templates__tab ${activeSection === "templates" ? "foundry-templates__tab--active" : ""}`}
              onClick={() => setActiveSection("templates")}
            >
              Templates ({templates.length})
            </button>
          </div>
        </div>

        {/* Search Results */}
        {filteredComponents && (
          <div className="astrogation-section">
            <div className="astrogation-section__label">Results ({filteredComponents.length})</div>
            {filteredComponents.map((comp) => (
              <button
                key={comp.id}
                className="catalog-item"
                onClick={() => handleAddComponent(comp.id)}
                title={`Add ${comp.name} to canvas`}
              >
                <span className="catalog-item__add-icon">+</span>
                {comp.name}
              </button>
            ))}
          </div>
        )}

        {/* Catalog Section - Add components from brand system */}
        {!filteredComponents && activeSection === "catalog" && (
          <div className="astrogation-section astrogation-section--categories">
            <TreeProvider
              defaultExpandedIds={defaultExpandedIds}
              selectedId={null}
              onSelectionChange={() => {}}
            >
              <TreeView>
                {(() => {
                  return CATEGORIES.map((cat, catIndex) => {
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
                                    onClick={() => handleAddComponent(comp.id)}
                                  >
                                    <TreeExpander nodeId={comp.id} />
                                    <TreeIcon />
                                    <TreeLabel>
                                      <span className="catalog-item__add-icon">+</span>
                                      {comp.name}
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
                  });
                })()}
              </TreeView>
            </TreeProvider>
          </div>
        )}

        {/* Templates Section */}
        {!filteredComponents && activeSection === "templates" && (
          <div className="astrogation-section">
            {isLoading ? (
              <div className="foundry-templates__loading">Loading templates...</div>
            ) : templates.length === 0 ? (
              <div className="foundry-templates__empty">
                <span className="foundry-templates__empty-icon">◇</span>
                <p>No templates yet</p>
                <span className="foundry-templates__empty-hint">
                  Save components as templates from the right panel
                </span>
              </div>
            ) : (
              <>
                {/* Group templates by category */}
                {CATEGORIES.map((cat) => {
                  const categoryTemplates = templatesByCategory[cat.id];
                  if (!categoryTemplates || categoryTemplates.length === 0) return null;

                  return (
                    <div key={cat.id} className="foundry-templates__category">
                      <div className="astrogation-section__label">{cat.name}</div>
                      {categoryTemplates.map((template) => (
                        <button
                          key={template.id}
                          className="catalog-item"
                          onClick={() => handleAddTemplate(template)}
                          title={`Add ${template.name} to canvas`}
                        >
                          <span className="catalog-item__add-icon">+</span>
                          {template.name}
                        </button>
                      ))}
                    </div>
                  );
                })}

                {/* Uncategorized templates */}
                {templatesByCategory["uncategorized"] && (
                  <div className="foundry-templates__category">
                    <div className="astrogation-section__label">Other</div>
                    {templatesByCategory["uncategorized"].map((template) => (
                      <button
                        key={template.id}
                        className="catalog-item"
                        onClick={() => handleAddTemplate(template)}
                        title={`Add ${template.name} to canvas`}
                      >
                        <span className="catalog-item__add-icon">+</span>
                        {template.name}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

// Memoized export - prevents re-renders when parent changes but props don't
export const FoundryTemplatesPanel = memo(FoundryTemplatesPanelInner);
