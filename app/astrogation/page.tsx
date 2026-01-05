"use client";

import { useReducer, useEffect, useCallback, useState, useRef } from "react";
import Link from "next/link";
import { AdminGate } from "@/components/admin/AdminGate";
import { useAuth } from "@/components/auth/AuthProvider";
import { isAllowedUserEmail } from "@/lib/auth/allowed-user";

// Import from extracted components
import {
  ThoughtformLogo,
  CatalogPanel,
  CenterPanel,
  DialsPanel,
  SpecPanel,
  SurveyCatalogPanel,
  SurveyInspectorPanel,
  generateJSXCode,
  VectorEditor,
  type SurveyAnnotation,
  type SurveyViewBundledProps,
  type WorkspaceTab,
  type VectorDocument,
} from "./_components";
import { FoundryAssistantDock } from "./_components/FoundryAssistantDock";

// Import state management
import { astrogationReducer, initialState, actions } from "./_state/astrogationReducer";

// Import hooks
import { usePresets } from "./_hooks/usePresets";
import { useSurvey } from "./_hooks/useSurvey";

// Import StatusBar
import { StatusBar } from "@/components/hud/StatusBar";

// Import auth utilities
import { supabase } from "@/lib/supabase";

import "./astrogation.css";

// ═══════════════════════════════════════════════════════════════
// MAIN ASTROGATION CONTENT
// ═══════════════════════════════════════════════════════════════

function AstrogationContent() {
  // Centralized state using reducer
  const [state, dispatch] = useReducer(astrogationReducer, initialState);

  const {
    selectedCategory,
    selectedComponentId,
    activeTab,
    isFocused,
    componentProps,
    style,
    foundryVariants,
    presets,
    presetName,
    toast,
    // Survey state
    surveyCategoryId,
    surveyComponentKey,
    surveySelectedItemId,
    surveyItems,
    surveyLoading,
    surveySearchQuery,
    surveyIsSearching,
  } = state;

  // Presets management (CRUD + toast)
  const { savePreset, loadPreset, deletePreset, canSave } = usePresets({
    dispatch,
    selectedComponentId,
    componentProps,
    style,
    presetName,
  });

  // Survey management
  const {
    loadItems,
    loadItemFullData,
    uploadItem,
    updateItem,
    deleteItem,
    analyzeItem,
    generateBriefing,
    embedItem,
    semanticSearch,
    generateSegments,
    loadSegments,
    updateSegmentLabel,
    deleteSegment,
    labelSegments,
    isSegmenting,
    isLabelingSegments,
    segments,
    itemCounts,
    isAnalyzing,
    isEmbedding,
    isBriefing,
    isSaving,
    pipelineStatus,
    searchSpace,
    setSearchSpace,
  } = useSurvey({
    dispatch,
    surveyCategoryId,
    surveyComponentKey,
    surveySelectedItemId,
  });

  // Segment visibility toggle
  const [showSegments, setShowSegments] = useState(false);

  // Get user for Supabase persistence
  const { user } = useAuth();

  // Forge state - forge is a special "mode" that shows the vector editor in the center panel
  const [isForgeMode, setIsForgeMode] = useState(false);
  const [forgeDoc, setForgeDoc] = useState<VectorDocument | null>(null);
  const [forgeSvg, setForgeSvg] = useState<string | null>(null);
  const [forgeDocId, setForgeDocId] = useState<string | null>(null);
  const forgeSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load forge data from Supabase on mount
  useEffect(() => {
    async function loadForgeData() {
      if (!user?.id) return;
      if (!supabase) return;

      try {
        const { data, error } = await supabase
          .from("forge_documents")
          .select("id, document, svg")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== "PGRST116") {
          // PGRST116 = no rows returned, which is fine for new users
          console.error("Failed to load forge data:", error);
          return;
        }

        if (data) {
          setForgeDocId(data.id);
          setForgeDoc(data.document as VectorDocument);
          setForgeSvg(data.svg);
        }
      } catch (e) {
        console.error("Failed to load forge data from Supabase:", e);
      }
    }

    loadForgeData();
  }, [user?.id]);

  const handleOpenForge = useCallback(() => {
    // Clear any selected component and focus state - forge is its own mode
    dispatch(actions.selectComponent(null));
    dispatch(actions.setFocus(false));
    setIsForgeMode(true);
  }, [dispatch]);

  const handleCloseForge = useCallback(() => {
    setIsForgeMode(false);
  }, []);

  const handleForgeDocChange = useCallback(
    (doc: VectorDocument, svg: string) => {
      setForgeDoc(doc);
      setForgeSvg(svg);

      // Debounce Supabase save (500ms)
      if (forgeSaveTimerRef.current) {
        clearTimeout(forgeSaveTimerRef.current);
      }

      forgeSaveTimerRef.current = setTimeout(async () => {
        if (!user?.id) return;
        if (!supabase) return;

        try {
          if (forgeDocId) {
            // Update existing document
            await supabase
              .from("forge_documents")
              .update({ document: doc, svg, updated_at: new Date().toISOString() })
              .eq("id", forgeDocId);
          } else {
            // Create new document
            const { data, error } = await supabase
              .from("forge_documents")
              .insert({ user_id: user.id, document: doc, svg })
              .select("id")
              .single();

            if (error) {
              console.error("Failed to create forge document:", error);
              return;
            }

            if (data) {
              setForgeDocId(data.id);
            }
          }
        } catch (e) {
          console.error("Failed to save forge data to Supabase:", e);
        }
      }, 500);
    },
    [user?.id, forgeDocId]
  );

  // Auto-hide toast after 2 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => dispatch(actions.hideToast()), 2000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Handlers
  const handleSelectCategory = useCallback(
    (id: string) => {
      dispatch(actions.selectCategory(id));
      if (isForgeMode) {
        setIsForgeMode(false);
      }
    },
    [isForgeMode, dispatch]
  );

  const handleSelectComponent = useCallback(
    (id: string) => {
      dispatch(actions.selectComponent(id));
      if (isForgeMode) {
        setIsForgeMode(false);
      }
    },
    [isForgeMode, dispatch]
  );

  // Handle component class change from the Foundry inspector
  const handleComponentClassChange = useCallback((categoryId: string, componentKey: string) => {
    dispatch(actions.selectCategory(categoryId));
    dispatch(actions.selectComponent(componentKey));
  }, []);

  const handleTabChange = useCallback((tab: WorkspaceTab) => {
    dispatch(actions.setTab(tab));
  }, []);

  const handleFocusChange = useCallback((focused: boolean) => {
    dispatch(actions.setFocus(focused));
  }, []);

  const handlePropsChange = useCallback((props: Record<string, unknown>) => {
    dispatch(actions.setProps(props));
  }, []);

  const handlePresetNameChange = useCallback((name: string) => {
    dispatch(actions.setPresetName(name));
  }, []);

  // Copy code
  const handleCopyCode = useCallback(() => {
    if (!selectedComponentId) return;
    const code = generateJSXCode(selectedComponentId, componentProps);
    navigator.clipboard.writeText(code);
    dispatch(actions.showToast("Code copied to clipboard"));
  }, [selectedComponentId, componentProps]);

  // Apply patch from assistant
  const handleApplyPatch = useCallback(
    (patch: { setProps?: Record<string, unknown> }) => {
      if (patch.setProps) {
        dispatch(actions.setProps({ ...componentProps, ...patch.setProps }));
      }
      dispatch(actions.showToast("Changes applied"));
    },
    [componentProps]
  );

  // Create variant from assistant suggestion
  const handleCreateVariant = useCallback(
    (variant: {
      id: string;
      name: string;
      description: string;
      props: Record<string, unknown>;
    }) => {
      if (!selectedComponentId) {
        dispatch(actions.showToast("Select a component first"));
        return;
      }
      dispatch(
        actions.addFoundryVariant({
          ...variant,
          componentId: selectedComponentId,
          createdAt: new Date().toISOString(),
        })
      );
      dispatch(actions.showToast(`Variant "${variant.name}" added`));
    },
    [selectedComponentId]
  );

  // Remove a variant from the comparison grid
  const handleRemoveVariant = useCallback((id: string) => {
    dispatch(actions.removeFoundryVariant(id));
  }, []);

  // Apply a variant to the main preview
  const handleApplyVariant = useCallback(
    (variant: { props: Record<string, unknown> }) => {
      dispatch(actions.setProps({ ...componentProps, ...variant.props }));
      dispatch(actions.showToast("Variant applied"));
    },
    [componentProps]
  );

  // Get auth token for assistant requests
  const getAuthToken = useCallback(async () => {
    try {
      if (!supabase) return null;
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch {
      return null;
    }
  }, []);

  // Survey handlers
  const handleSurveyCategoryChange = useCallback((id: string | null) => {
    dispatch(actions.surveySetCategory(id));
  }, []);

  const handleSurveyComponentChange = useCallback((key: string | null) => {
    dispatch(actions.surveySetComponent(key));
  }, []);

  const handleSurveySelectItem = useCallback((id: string | null) => {
    dispatch(actions.surveySelectItem(id));
  }, []);

  // Survey search handlers
  const handleSurveySearchQueryChange = useCallback((query: string) => {
    dispatch(actions.surveySetSearchQuery(query));
  }, []);

  const handleSurveySearch = useCallback(
    async (query: string) => {
      if (query.trim()) {
        await semanticSearch(query.trim(), "query", searchSpace);
      } else {
        // Empty query = reload recent items
        await loadItems();
      }
    },
    [semanticSearch, loadItems, searchSpace]
  );

  // Handle annotation changes from canvas with optimistic updates
  const handleSurveyAnnotationsChange = useCallback(
    async (annotations: SurveyAnnotation[]) => {
      if (!surveySelectedItemId) return;

      // Optimistic update: immediately update local state
      const optimisticItem = surveyItems.find((item) => item.id === surveySelectedItemId);
      if (optimisticItem) {
        dispatch(actions.surveyUpdateItem({ ...optimisticItem, annotations }));
      }

      // Persist to server (no need to await for UI)
      updateItem({ id: surveySelectedItemId, annotations }).catch(() => {
        // On error, the server response will restore the correct state
        dispatch(actions.showToast("Failed to save annotations"));
      });
    },
    [surveySelectedItemId, surveyItems, updateItem, dispatch]
  );

  // Track annotation resizing state
  const [isAnnotationResizing, setIsAnnotationResizing] = useState(false);

  // Track selected annotation (for syncing canvas <-> inspector)
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);

  // Clear annotation selection when item changes
  useEffect(() => {
    setSelectedAnnotationId(null);
  }, [surveySelectedItemId]);

  // Get selected survey item and load full data if needed
  const selectedSurveyItem = surveyItems.find((item) => item.id === surveySelectedItemId) || null;

  // Load full item data when detail view opens (includes large text fields)
  useEffect(() => {
    if (
      surveySelectedItemId &&
      selectedSurveyItem &&
      !selectedSurveyItem.briefing &&
      !selectedSurveyItem.description
    ) {
      // Item doesn't have full data yet, fetch it
      loadItemFullData(surveySelectedItemId).catch(() => {
        // Silently fail - grid data is already available
      });
    }
  }, [surveySelectedItemId, selectedSurveyItem, loadItemFullData]);

  // Load segments when a survey item is selected
  useEffect(() => {
    if (surveySelectedItemId) {
      loadSegments(surveySelectedItemId).catch(() => {
        // Silently fail if segments can't be loaded
      });
    }
  }, [surveySelectedItemId, loadSegments]);

  // Handle generating segments for current item
  const handleGenerateSegments = useCallback(() => {
    if (surveySelectedItemId) {
      // Auto-show the overlay so results are immediately visible in the popup.
      setShowSegments(true);
      generateSegments(surveySelectedItemId);
    }
  }, [surveySelectedItemId, generateSegments]);

  // Handle toggling segment visibility
  const handleToggleSegments = useCallback(() => {
    setShowSegments((prev) => !prev);
  }, []);

  const handleLabelSegments = useCallback(() => {
    if (surveySelectedItemId) {
      labelSegments(surveySelectedItemId);
    }
  }, [surveySelectedItemId, labelSegments]);

  // Bundle Survey props for cleaner component API
  const surveyProps = {
    items: surveyItems,
    selectedItemId: surveySelectedItemId,
    selectedAnnotationId,
    loading: surveyLoading,
    searchQuery: surveySearchQuery,
    isSearching: surveyIsSearching,
    onSelectItem: handleSurveySelectItem,
    onUpload: uploadItem,
    onSearchQueryChange: handleSurveySearchQueryChange,
    onSearch: handleSurveySearch,
    onAnnotationsChange: handleSurveyAnnotationsChange,
    onAnnotationSelect: setSelectedAnnotationId,
    onResizingChange: setIsAnnotationResizing,
    // Segmentation
    segments,
    showSegments,
    isSegmenting,
    onGenerateSegments: handleGenerateSegments,
    onToggleSegments: handleToggleSegments,
    onUpdateSegmentLabel: updateSegmentLabel,
    onDeleteSegment: deleteSegment,
  };

  return (
    <div className={`astrogation ${isFocused ? "has-focus" : ""}`}>
      {/* HUD Frame Elements */}
      <div className="hud-corner hud-corner-tl" />
      <div className="hud-corner hud-corner-tr" />
      <div className="hud-corner hud-corner-bl" />
      <div className="hud-corner hud-corner-br" />

      {/* Left Rail */}
      <aside className="hud-rail hud-rail-left">
        <div className="rail-scale">
          <div className="scale-ticks">
            {Array.from({ length: 21 }).map((_, i) => (
              <div key={i} className={`tick ${i % 5 === 0 ? "tick-major" : "tick-minor"}`} />
            ))}
          </div>
        </div>
      </aside>

      {/* Right Rail */}
      <aside className="hud-rail hud-rail-right">
        <div className="rail-scale">
          <div className="scale-ticks">
            {Array.from({ length: 21 }).map((_, i) => (
              <div key={i} className={`tick ${i % 5 === 0 ? "tick-major" : "tick-minor"}`} />
            ))}
          </div>
        </div>
      </aside>

      {/* Navigation Bar */}
      <nav className="astrogation-nav">
        <Link href="/" className="astrogation-nav__logo">
          <ThoughtformLogo size={22} color="#caa554" />
        </Link>
        <div className="astrogation-nav__title">
          <span className="title-icon">⬡</span>
          <span>Astrogation</span>
        </div>
        {/* Action buttons - right side of navbar */}
        <div className="astrogation-nav__actions">
          <input
            type="file"
            id="nav-upload-input"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                uploadItem(file, surveyCategoryId, surveyComponentKey);
                e.target.value = "";
              }
            }}
            style={{ display: "none" }}
          />
          <button
            className="nav-action-btn"
            onClick={() => document.getElementById("nav-upload-input")?.click()}
            title="Upload reference image"
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            className="nav-action-btn"
            onClick={handleOpenForge}
            title="Open Forge (Vector Editor)"
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                d="M12 2L21.5 7.5V16.5L12 22L2.5 16.5V7.5L12 2Z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M12 8V16M8 10V14M16 10V14" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Content Area */}
      <div className="astrogation-content">
        {/* Left Panel - switches based on active tab */}
        {activeTab === "survey" ? (
          <SurveyCatalogPanel
            selectedCategoryId={surveyCategoryId}
            onSelectCategory={handleSurveyCategoryChange}
            selectedComponentKey={surveyComponentKey}
            onSelectComponent={handleSurveyComponentChange}
            itemCounts={itemCounts}
            searchQuery={surveySearchQuery}
            onSearchQueryChange={handleSurveySearchQueryChange}
            onSearch={handleSurveySearch}
            searchSpace={searchSpace}
            onSearchSpaceChange={setSearchSpace}
          />
        ) : (
          <CatalogPanel
            selectedCategory={selectedCategory}
            onSelectCategory={handleSelectCategory}
            selectedComponentId={selectedComponentId}
            onSelectComponent={handleSelectComponent}
          />
        )}

        <CenterPanel
          activeTab={activeTab}
          onTabChange={handleTabChange}
          selectedComponentId={selectedComponentId}
          componentProps={componentProps}
          style={style}
          presets={presets}
          variants={foundryVariants}
          onLoadPreset={loadPreset}
          onDeletePreset={deletePreset}
          onRemoveVariant={handleRemoveVariant}
          onApplyVariant={handleApplyVariant}
          isFocused={isFocused}
          onFocusChange={handleFocusChange}
          onPropsChange={handlePropsChange}
          survey={surveyProps}
          isForgeMode={isForgeMode}
          forgeDoc={forgeDoc}
          forgeSvg={forgeSvg}
          onForgeDocChange={handleForgeDocChange}
          onForgeClose={handleCloseForge}
        />

        {/* Right Panel - switches based on active tab */}
        {activeTab === "survey" ? (
          <SurveyInspectorPanel
            item={selectedSurveyItem}
            onUpdate={updateItem}
            onDelete={deleteItem}
            onAnalyze={() => analyzeItem()}
            onGenerateBriefing={() => generateBriefing()}
            onEmbed={() => embedItem()}
            onUpload={uploadItem}
            selectedCategoryId={surveyCategoryId}
            selectedComponentKey={surveyComponentKey}
            selectedAnnotationId={selectedAnnotationId}
            onAnnotationSelect={setSelectedAnnotationId}
            isAnalyzing={isAnalyzing}
            isEmbedding={isEmbedding}
            isBriefing={isBriefing}
            isSaving={isSaving}
            isResizing={isAnnotationResizing}
            pipelineStatus={pipelineStatus}
            onGenerateSegments={handleGenerateSegments}
            onToggleSegments={handleToggleSegments}
            onLabelSegments={handleLabelSegments}
            isSegmenting={isSegmenting}
            isLabelingSegments={isLabelingSegments}
            showSegments={showSegments}
            segmentCount={segments.length}
          />
        ) : activeTab === "foundry" ? (
          <DialsPanel
            selectedComponentId={selectedComponentId}
            componentProps={componentProps}
            onPropsChange={handlePropsChange}
            onComponentChange={handleComponentClassChange}
            onSavePreset={savePreset}
            presetName={presetName}
            onPresetNameChange={handlePresetNameChange}
            canSave={canSave}
          >
            {/* Foundry Assistant Dock - anchored to the right panel */}
            <FoundryAssistantDock
              componentId={selectedComponentId}
              componentProps={componentProps}
              onApplyPatch={handleApplyPatch}
              onCreateVariant={handleCreateVariant}
              getAuthToken={getAuthToken}
            />
          </DialsPanel>
        ) : (
          <SpecPanel selectedComponentId={selectedComponentId} />
        )}
      </div>

      <StatusBar toast={toast} onToastHide={() => dispatch(actions.hideToast())} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// EXPORT WITH AUTH
// ═══════════════════════════════════════════════════════════════

export default function Astrogation() {
  // TODO: Re-enable authentication after testing
  const BYPASS_AUTH = true; // TEMPORARY - remove after testing

  const { user, isLoading } = useAuth();

  if (isLoading && !BYPASS_AUTH) {
    return (
      <div className="astrogation astrogation--loading">
        <span className="astrogation__loading">Loading...</span>
      </div>
    );
  }

  if (!BYPASS_AUTH && (!user?.email || !isAllowedUserEmail(user.email))) {
    return (
      <div className="astrogation astrogation--unauthorized">
        <h1>Astrogation</h1>
        <p>This tool requires authentication.</p>
        <Link href="/" className="astrogation__btn">
          Return Home
        </Link>
      </div>
    );
  }

  // In dev mode or with bypass, AdminGate will automatically allow access
  return (
    <AdminGate>
      <AstrogationContent />
    </AdminGate>
  );
}
