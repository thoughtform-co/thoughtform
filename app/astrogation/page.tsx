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
  type SurveyAnnotation,
  type SurveyViewBundledProps,
  type WorkspaceTab,
  type FoundryFrameConfig,
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
    foundryFrame,
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
    foundryFrame,
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

  // File input ref for navbar upload
  const navUploadRef = useRef<HTMLInputElement>(null);

  const handleNavUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      await uploadItem(file, surveyCategoryId, surveyComponentKey);
      // Reset input so same file can be re-uploaded
      if (navUploadRef.current) navUploadRef.current.value = "";
    },
    [uploadItem, surveyCategoryId, surveyComponentKey]
  );

  // Auto-hide toast after 2 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => dispatch(actions.hideToast()), 2000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Handlers
  const handleSelectCategory = useCallback((id: string) => {
    dispatch(actions.selectCategory(id));
  }, []);

  const handleSelectComponent = useCallback((id: string) => {
    dispatch(actions.selectComponent(id));
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

  // Copy framed code (wraps component in ChamferedFrame)
  const handleCopyFramedCode = useCallback(() => {
    if (!selectedComponentId) return;
    const componentCode = generateJSXCode(selectedComponentId, componentProps);

    // Generate ChamferedFrame wrapper
    const frameCode = `<ChamferedFrame
  shape={{
    kind: "ticketNotch",
    corner: "tr",
    notchWidthPx: ${foundryFrame.notchWidthPx},
    notchHeightPx: ${foundryFrame.notchHeightPx},
  }}
  strokeColor="${foundryFrame.strokeColor}"
  strokeWidth={${foundryFrame.strokeWidth}}
  fillColor="${foundryFrame.fillColor}"
>
  ${componentCode.split("\n").join("\n  ")}
</ChamferedFrame>`;

    navigator.clipboard.writeText(frameCode);
    dispatch(actions.showToast("Framed code copied to clipboard"));
  }, [selectedComponentId, componentProps, foundryFrame]);

  // Foundry frame change handler
  const handleFoundryFrameChange = useCallback((frame: Partial<FoundryFrameConfig>) => {
    dispatch(actions.setFoundryFrame(frame));
  }, []);

  // Apply patch from assistant
  const handleApplyPatch = useCallback(
    (patch: { setProps?: Record<string, unknown>; setFrame?: Partial<FoundryFrameConfig> }) => {
      if (patch.setProps) {
        dispatch(actions.setProps({ ...componentProps, ...patch.setProps }));
      }
      if (patch.setFrame) {
        dispatch(actions.setFoundryFrame(patch.setFrame));
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
      frame?: Partial<FoundryFrameConfig>;
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
    (variant: { props: Record<string, unknown>; frame?: Partial<FoundryFrameConfig> }) => {
      dispatch(actions.setProps({ ...componentProps, ...variant.props }));
      if (variant.frame) {
        dispatch(actions.setFoundryFrame(variant.frame));
      }
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

  // Bundle Survey props for cleaner component API
  const surveyProps: SurveyViewBundledProps = {
    items: surveyItems,
    selectedItemId: surveySelectedItemId,
    loading: surveyLoading,
    searchQuery: surveySearchQuery,
    isSearching: surveyIsSearching,
    onSelectItem: handleSurveySelectItem,
    onUpload: uploadItem,
    onSearchQueryChange: handleSurveySearchQueryChange,
    onSearch: handleSurveySearch,
    onAnnotationsChange: handleSurveyAnnotationsChange,
    onResizingChange: setIsAnnotationResizing,
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
        {/* Upload button - visible on survey tab */}
        {activeTab === "survey" && (
          <>
            <input
              ref={navUploadRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleNavUpload}
              style={{ display: "none" }}
            />
            <button
              className="astrogation-nav__upload-btn"
              onClick={() => navUploadRef.current?.click()}
              title="Upload reference image"
            >
              + Upload
            </button>
          </>
        )}
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
          foundryFrame={foundryFrame}
          presets={presets}
          variants={foundryVariants}
          onLoadPreset={loadPreset}
          onDeletePreset={deletePreset}
          onRemoveVariant={handleRemoveVariant}
          onApplyVariant={handleApplyVariant}
          onSavePreset={savePreset}
          presetName={presetName}
          onPresetNameChange={handlePresetNameChange}
          canSave={canSave}
          isFocused={isFocused}
          onFocusChange={handleFocusChange}
          onSelectComponent={handleSelectComponent}
          survey={surveyProps}
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
            isAnalyzing={isAnalyzing}
            isEmbedding={isEmbedding}
            isBriefing={isBriefing}
            isSaving={isSaving}
            isResizing={isAnnotationResizing}
            pipelineStatus={pipelineStatus}
          />
        ) : activeTab === "foundry" ? (
          <DialsPanel
            selectedComponentId={selectedComponentId}
            componentProps={componentProps}
            onPropsChange={handlePropsChange}
            onCopyCode={handleCopyCode}
            onCopyFramedCode={handleCopyFramedCode}
            onSavePreset={savePreset}
            presetName={presetName}
            onPresetNameChange={handlePresetNameChange}
            canSave={canSave}
            foundryFrame={foundryFrame}
            onFoundryFrameChange={handleFoundryFrameChange}
          >
            {/* Foundry Assistant Dock - anchored to the right panel */}
            <FoundryAssistantDock
              componentId={selectedComponentId}
              componentProps={componentProps}
              foundryFrame={foundryFrame}
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
