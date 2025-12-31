"use client";

import { useReducer, useEffect, useCallback } from "react";
import Link from "next/link";
import { AdminGate } from "@/components/admin/AdminGate";
import { useAuth } from "@/components/auth/AuthProvider";
import { isAllowedUserEmail } from "@/lib/auth/allowed-user";

// Import from extracted components
import {
  type UIComponentPreset,
  ThoughtformLogo,
  CatalogPanel,
  CenterPanel,
  DialsPanel,
  SpecPanel,
  generateJSXCode,
} from "./_components";

// Import state management
import { astrogationReducer, initialState, actions } from "./_state/astrogationReducer";

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
  } = state;

  // Load presets from API on mount
  useEffect(() => {
    fetch("/api/ui-component-presets")
      .then((r) => r.json())
      .then((data) => dispatch(actions.loadPresets(data.presets || [])))
      .catch(console.error);
  }, []);

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

  const handleTabChange = useCallback((tab: "vault" | "foundry") => {
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

  // Save preset
  const handleSavePreset = useCallback(async () => {
    if (!selectedComponentId || !presetName.trim()) return;

    try {
      const res = await fetch("/api/ui-component-presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: presetName,
          component_key: selectedComponentId,
          config: { ...componentProps, __style: style },
        }),
      });
      const data = await res.json();
      if (data.preset) {
        dispatch(actions.presetSaved(data.preset));
        dispatch(actions.showToast("Preset saved"));
      }
    } catch (e) {
      console.error(e);
      dispatch(actions.showToast("Failed to save preset"));
    }
  }, [selectedComponentId, componentProps, style, presetName]);

  // Load preset
  const handleLoadPreset = useCallback((preset: UIComponentPreset) => {
    dispatch(actions.loadPreset(preset));
    dispatch(actions.showToast(`Loaded: ${preset.name}`));
  }, []);

  // Delete preset
  const handleDeletePreset = useCallback(async (id: string) => {
    if (!confirm("Delete this preset?")) return;
    try {
      await fetch(`/api/ui-component-presets?id=${id}`, { method: "DELETE" });
      dispatch(actions.presetDeleted(id));
      dispatch(actions.showToast("Preset deleted"));
    } catch (e) {
      console.error(e);
      dispatch(actions.showToast("Failed to delete preset"));
    }
  }, []);

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
        <CatalogPanel
          selectedCategory={selectedCategory}
          onSelectCategory={handleSelectCategory}
          selectedComponentId={selectedComponentId}
          onSelectComponent={handleSelectComponent}
        />

        <CenterPanel
          activeTab={activeTab}
          onTabChange={handleTabChange}
          selectedComponentId={selectedComponentId}
          componentProps={componentProps}
          style={style}
          presets={presets}
          onLoadPreset={handleLoadPreset}
          onDeletePreset={handleDeletePreset}
          onSavePreset={handleSavePreset}
          presetName={presetName}
          onPresetNameChange={handlePresetNameChange}
          canSave={!!selectedComponentId && !!presetName.trim()}
          isFocused={isFocused}
          onFocusChange={handleFocusChange}
        />

        {activeTab === "foundry" ? (
          <DialsPanel
            selectedComponentId={selectedComponentId}
            componentProps={componentProps}
            onPropsChange={handlePropsChange}
            onCopyCode={handleCopyCode}
            onSavePreset={handleSavePreset}
            presetName={presetName}
            onPresetNameChange={handlePresetNameChange}
            canSave={!!selectedComponentId && !!presetName.trim()}
          />
        ) : (
          <SpecPanel selectedComponentId={selectedComponentId} />
        )}
      </div>

      {/* Footer */}
      <footer className="astrogation-footer">
        <div className="astrogation-footer__left"></div>
        <div className="astrogation-footer__right">Astrogation v1.0</div>
      </footer>

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
