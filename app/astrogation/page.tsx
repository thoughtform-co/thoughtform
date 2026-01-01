"use client";

import { useReducer, useEffect, useCallback, useState } from "react";
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
  type SurveyItem,
  type SurveyAnnotation,
  type WorkspaceTab,
} from "./_components";

// Import state management
import { astrogationReducer, initialState, actions } from "./_state/astrogationReducer";

// Import hooks
import { usePresets } from "./_hooks/usePresets";
import { useSurvey } from "./_hooks/useSurvey";

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
    uploadItem,
    updateItem,
    deleteItem,
    analyzeItem,
    embedItem,
    semanticSearch,
    itemCounts,
    isAnalyzing,
    isEmbedding,
    isSaving,
  } = useSurvey({
    dispatch,
    surveyCategoryId,
    surveyComponentKey,
    surveySelectedItemId,
  });

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
        await semanticSearch(query.trim(), "query");
      } else {
        // Empty query = reload recent items
        await loadItems();
      }
    },
    [semanticSearch, loadItems]
  );

  // Handle annotation changes from canvas
  const handleSurveyAnnotationsChange = useCallback(
    async (annotations: SurveyAnnotation[]) => {
      if (!surveySelectedItemId) return;
      // Update locally and persist
      await updateItem({ id: surveySelectedItemId, annotations });
    },
    [surveySelectedItemId, updateItem]
  );

  // Track annotation resizing state
  const [isAnnotationResizing, setIsAnnotationResizing] = useState(false);

  // Get selected survey item
  const selectedSurveyItem = surveyItems.find((item) => item.id === surveySelectedItemId) || null;

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
          onLoadPreset={loadPreset}
          onDeletePreset={deletePreset}
          onSavePreset={savePreset}
          presetName={presetName}
          onPresetNameChange={handlePresetNameChange}
          canSave={canSave}
          isFocused={isFocused}
          onFocusChange={handleFocusChange}
          // Survey props
          surveyItems={surveyItems}
          surveySelectedItemId={surveySelectedItemId}
          surveyLoading={surveyLoading}
          surveySearchQuery={surveySearchQuery}
          surveyIsSearching={surveyIsSearching}
          onSurveySelectItem={handleSurveySelectItem}
          onSurveyUpload={uploadItem}
          onSurveySearchQueryChange={handleSurveySearchQueryChange}
          onSurveySearch={handleSurveySearch}
          onSurveyAnnotationsChange={handleSurveyAnnotationsChange}
          onSurveyResizingChange={setIsAnnotationResizing}
        />

        {/* Right Panel - switches based on active tab */}
        {activeTab === "survey" ? (
          <SurveyInspectorPanel
            item={selectedSurveyItem}
            onUpdate={updateItem}
            onDelete={deleteItem}
            onAnalyze={analyzeItem}
            onEmbed={embedItem}
            onUpload={uploadItem}
            selectedCategoryId={surveyCategoryId}
            selectedComponentKey={surveyComponentKey}
            isAnalyzing={isAnalyzing}
            isEmbedding={isEmbedding}
            isSaving={isSaving}
            isResizing={isAnnotationResizing}
          />
        ) : activeTab === "foundry" ? (
          <DialsPanel
            selectedComponentId={selectedComponentId}
            componentProps={componentProps}
            onPropsChange={handlePropsChange}
            onCopyCode={handleCopyCode}
            onSavePreset={savePreset}
            presetName={presetName}
            onPresetNameChange={handlePresetNameChange}
            canSave={canSave}
          />
        ) : (
          <SpecPanel selectedComponentId={selectedComponentId} />
        )}
      </div>

      {toast && <div className="toast">{toast}</div>}
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
