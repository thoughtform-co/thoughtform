"use client";

import { useEffect, useCallback } from "react";
import type { UIComponentPreset, StyleConfig } from "../_components/types";
import type { AstrogationAction } from "../_state/astrogationReducer";
import { actions } from "../_state/astrogationReducer";

// ═══════════════════════════════════════════════════════════════
// PRESETS HOOK
// ═══════════════════════════════════════════════════════════════

export interface UsePresetsOptions {
  dispatch: React.Dispatch<AstrogationAction>;
  selectedComponentId: string | null;
  componentProps: Record<string, unknown>;
  style: StyleConfig;
  presetName: string;
}

export interface UsePresetsReturn {
  loadPresetsFromServer: () => Promise<void>;
  savePreset: () => Promise<void>;
  loadPreset: (preset: UIComponentPreset) => void;
  deletePreset: (id: string) => Promise<void>;
  canSave: boolean;
}

/**
 * Hook to manage presets CRUD operations and toast notifications.
 * Isolates all fetch/network side effects from the main component.
 */
export function usePresets({
  dispatch,
  selectedComponentId,
  componentProps,
  style,
  presetName,
}: UsePresetsOptions): UsePresetsReturn {
  // Load presets from server on mount
  const loadPresetsFromServer = useCallback(async () => {
    try {
      const res = await fetch("/api/ui-component-presets");
      const data = await res.json();
      dispatch(actions.loadPresets(data.presets || []));
    } catch (e) {
      console.error("Failed to load presets:", e);
    }
  }, [dispatch]);

  // Auto-load presets on mount
  useEffect(() => {
    loadPresetsFromServer();
  }, [loadPresetsFromServer]);

  // Save preset to server
  const savePreset = useCallback(async () => {
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
      console.error("Failed to save preset:", e);
      dispatch(actions.showToast("Failed to save preset"));
    }
  }, [selectedComponentId, componentProps, style, presetName, dispatch]);

  // Load preset into state
  const loadPreset = useCallback(
    (preset: UIComponentPreset) => {
      dispatch(actions.loadPreset(preset));
      dispatch(actions.showToast(`Loaded: ${preset.name}`));
    },
    [dispatch]
  );

  // Delete preset from server
  const deletePreset = useCallback(
    async (id: string) => {
      if (!confirm("Delete this preset?")) return;
      try {
        await fetch(`/api/ui-component-presets?id=${id}`, { method: "DELETE" });
        dispatch(actions.presetDeleted(id));
        dispatch(actions.showToast("Preset deleted"));
      } catch (e) {
        console.error("Failed to delete preset:", e);
        dispatch(actions.showToast("Failed to delete preset"));
      }
    },
    [dispatch]
  );

  const canSave = !!selectedComponentId && !!presetName.trim();

  return {
    loadPresetsFromServer,
    savePreset,
    loadPreset,
    deletePreset,
    canSave,
  };
}
