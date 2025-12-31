"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { AdminGate } from "@/components/admin/AdminGate";
import { useAuth } from "@/components/auth/AuthProvider";
import { isAllowedUserEmail } from "@/lib/auth/allowed-user";
import { getComponentById } from "./catalog";

// Import from extracted components
import {
  type UIComponentPreset,
  type StyleConfig,
  type WorkspaceTab,
  DEFAULT_STYLE,
  ThoughtformLogo,
  CatalogPanel,
  CenterPanel,
  DialsPanel,
  SpecPanel,
  generateJSXCode,
} from "./_components";

import "./astrogation.css";

// ═══════════════════════════════════════════════════════════════
// MAIN ASTROGATION CONTENT
// ═══════════════════════════════════════════════════════════════

function AstrogationContent() {
  // Selection state
  const [selectedCategory, setSelectedCategory] = useState<string | null>("brand");
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);

  // Workspace tab state
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("foundry");

  // Focus state for Foundry mode
  const [isFocused, setIsFocused] = useState(false);

  // Style state (for selected component)
  const [style, setStyle] = useState<StyleConfig>(DEFAULT_STYLE);

  // Component props state
  const [componentProps, setComponentProps] = useState<Record<string, unknown>>({});

  // Presets state
  const [presets, setPresets] = useState<UIComponentPreset[]>([]);
  const [presetName, setPresetName] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  // Reset props when component changes
  useEffect(() => {
    if (selectedComponentId) {
      const def = getComponentById(selectedComponentId);
      if (def) {
        const defaultProps: Record<string, unknown> = {};
        def.props.forEach((p) => {
          defaultProps[p.name] = p.default;
        });
        setComponentProps(defaultProps);
      }
    }
  }, [selectedComponentId]);

  // Show toast
  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  }, []);

  // Copy code
  const handleCopyCode = useCallback(() => {
    if (!selectedComponentId) return;
    const code = generateJSXCode(selectedComponentId, componentProps);
    navigator.clipboard.writeText(code);
    showToast("Code copied to clipboard");
  }, [selectedComponentId, componentProps, showToast]);

  // Load presets from API
  useEffect(() => {
    fetch("/api/ui-component-presets")
      .then((r) => r.json())
      .then((data) => setPresets(data.presets || []))
      .catch(console.error);
  }, []);

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
        setPresets((prev) => [...prev, data.preset]);
        setPresetName("");
        showToast("Preset saved");
      }
    } catch (e) {
      console.error(e);
      showToast("Failed to save preset");
    }
  }, [selectedComponentId, componentProps, style, presetName, showToast]);

  // Load preset
  const handleLoadPreset = useCallback(
    (preset: UIComponentPreset) => {
      setSelectedComponentId(preset.component_key);
      const { __style, ...props } = preset.config as Record<string, unknown>;
      setComponentProps(props);
      if (__style) {
        setStyle(__style as StyleConfig);
      }
      // Switch to Foundry to show the loaded preset
      setActiveTab("foundry");
      showToast(`Loaded: ${preset.name}`);
    },
    [showToast]
  );

  // Delete preset
  const handleDeletePreset = useCallback(
    async (id: string) => {
      if (!confirm("Delete this preset?")) return;
      try {
        await fetch(`/api/ui-component-presets?id=${id}`, { method: "DELETE" });
        setPresets((prev) => prev.filter((p) => p.id !== id));
        showToast("Preset deleted");
      } catch (e) {
        console.error(e);
        showToast("Failed to delete preset");
      }
    },
    [showToast]
  );

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
          onSelectCategory={setSelectedCategory}
          selectedComponentId={selectedComponentId}
          onSelectComponent={setSelectedComponentId}
        />

        <CenterPanel
          activeTab={activeTab}
          onTabChange={setActiveTab}
          selectedComponentId={selectedComponentId}
          componentProps={componentProps}
          style={style}
          presets={presets}
          onLoadPreset={handleLoadPreset}
          onDeletePreset={handleDeletePreset}
          onSavePreset={handleSavePreset}
          presetName={presetName}
          onPresetNameChange={setPresetName}
          canSave={!!selectedComponentId && !!presetName.trim()}
          isFocused={isFocused}
          onFocusChange={setIsFocused}
        />

        {activeTab === "foundry" ? (
          <DialsPanel
            selectedComponentId={selectedComponentId}
            componentProps={componentProps}
            onPropsChange={setComponentProps}
            onCopyCode={handleCopyCode}
            onSavePreset={handleSavePreset}
            presetName={presetName}
            onPresetNameChange={setPresetName}
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
