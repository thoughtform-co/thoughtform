"use client";

import { useCallback } from "react";
import type { FoundryTemplate, FoundryCanvasItem, ComponentSource } from "../_components/types";
import type { AstrogationAction } from "../_state/astrogationReducer";
import { actions } from "../_state/astrogationReducer";
import { supabase } from "@/lib/supabase";
import { getRegistryKeyForCatalog } from "../_components/registry-map";

// ═══════════════════════════════════════════════════════════════
// TEMPLATES HOOK
// Phase 2.4: Args-based templates with draft→approve workflow
// ═══════════════════════════════════════════════════════════════

// Helper to get auth headers for production
async function getAuthHeaders(): Promise<HeadersInit> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  try {
    if (supabase) {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }
    }
  } catch {
    // In dev mode or if auth fails, proceed without token
  }

  return headers;
}

export interface UseTemplatesOptions {
  dispatch: React.Dispatch<AstrogationAction>;
  userId?: string | null;
}

export interface UseTemplatesReturn {
  /**
   * Save canvas item as a template (draft)
   * Templates are user-specific and not shared until promoted
   */
  saveAsTemplate: (
    item: FoundryCanvasItem,
    name: string,
    categoryId?: string | null
  ) => Promise<FoundryTemplate | null>;

  /**
   * Promote a template to Vault (approved preset)
   * This creates a ui_component_preset from the template
   */
  promoteToVault: (template: FoundryTemplate) => Promise<boolean>;

  /**
   * Delete a template
   */
  deleteTemplate: (templateId: string) => Promise<boolean>;

  /**
   * Update a template's config
   */
  updateTemplate: (
    templateId: string,
    updates: Partial<Pick<FoundryTemplate, "name" | "config" | "category_id">>
  ) => Promise<boolean>;
}

/**
 * Hook to manage template operations with the args-based model.
 * Templates are drafts that can be promoted to Vault (ui_component_presets).
 */
export function useTemplates({ dispatch, userId }: UseTemplatesOptions): UseTemplatesReturn {
  /**
   * Save canvas item as a template (draft)
   */
  const saveAsTemplate = useCallback(
    async (
      item: FoundryCanvasItem,
      name: string,
      categoryId?: string | null
    ): Promise<FoundryTemplate | null> => {
      if (!name.trim()) {
        dispatch(actions.showToast("Template name is required"));
        return null;
      }

      // Build args-based config from item
      const effectiveArgs = item.args || item.props;
      const registryKey = item.registryKey || getRegistryKeyForCatalog(item.componentId);

      const config: FoundryTemplate["config"] = {
        args: effectiveArgs,
        styleVars: item.styleVars,
      };

      // Determine source
      const source: ComponentSource = item.source || (registryKey ? "registry" : "legacyPreview");

      // Build template data
      const templateData = {
        name: name.trim(),
        source,
        registry_key: registryKey,
        component_key: item.componentId,
        category_id: categoryId || undefined,
        config,
      };

      // LocalStorage fallback if no user
      if (!userId) {
        try {
          const stored = localStorage.getItem("foundry_templates");
          const templates: FoundryTemplate[] = stored ? JSON.parse(stored) : [];

          const newTemplate: FoundryTemplate = {
            id: crypto.randomUUID(),
            ...templateData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          templates.unshift(newTemplate);
          localStorage.setItem("foundry_templates", JSON.stringify(templates));
          dispatch(actions.showToast(`Template "${name}" saved`));
          return newTemplate;
        } catch (e) {
          console.error("Failed to save template to localStorage:", e);
          dispatch(actions.showToast("Failed to save template"));
          return null;
        }
      }

      // Supabase persistence
      if (!supabase) {
        dispatch(actions.showToast("Database not configured"));
        return null;
      }

      try {
        const { data, error } = await supabase
          .from("foundry_templates")
          .insert({
            user_id: userId,
            ...templateData,
          })
          .select()
          .single();

        if (error) {
          console.error("Failed to save template:", error);
          dispatch(actions.showToast("Failed to save template"));
          return null;
        }

        dispatch(actions.showToast(`Template "${name}" saved`));
        return data as FoundryTemplate;
      } catch (e) {
        console.error("Failed to save template to Supabase:", e);
        dispatch(actions.showToast("Failed to save template"));
        return null;
      }
    },
    [userId, dispatch]
  );

  /**
   * Promote a template to Vault (approved preset)
   */
  const promoteToVault = useCallback(
    async (template: FoundryTemplate): Promise<boolean> => {
      // Extract args from template config
      const { args, styleVars, ...legacyProps } = template.config;
      const effectiveArgs = args || legacyProps;

      // Build preset config (matches existing ui_component_presets format)
      const presetConfig = {
        ...effectiveArgs,
        __style: styleVars ? { styleVars } : undefined,
      };

      try {
        const headers = await getAuthHeaders();
        const res = await fetch("/api/ui-component-presets", {
          method: "POST",
          headers,
          body: JSON.stringify({
            name: template.name,
            component_key: template.component_key,
            config: presetConfig,
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.preset) {
          console.error("Failed to promote template:", data.error);
          dispatch(actions.showToast("Failed to promote to Vault"));
          return false;
        }

        // Add the new preset to state
        dispatch(actions.presetSaved(data.preset));
        dispatch(actions.showToast(`"${template.name}" promoted to Vault`));
        return true;
      } catch (e) {
        console.error("Failed to promote template:", e);
        dispatch(actions.showToast("Failed to promote to Vault"));
        return false;
      }
    },
    [dispatch]
  );

  /**
   * Delete a template
   */
  const deleteTemplate = useCallback(
    async (templateId: string): Promise<boolean> => {
      // LocalStorage fallback if no user
      if (!userId) {
        try {
          const stored = localStorage.getItem("foundry_templates");
          const templates: FoundryTemplate[] = stored ? JSON.parse(stored) : [];
          const filtered = templates.filter((t) => t.id !== templateId);
          localStorage.setItem("foundry_templates", JSON.stringify(filtered));
          dispatch(actions.showToast("Template deleted"));
          return true;
        } catch (e) {
          console.error("Failed to delete template from localStorage:", e);
          dispatch(actions.showToast("Failed to delete template"));
          return false;
        }
      }

      if (!supabase) {
        dispatch(actions.showToast("Database not configured"));
        return false;
      }

      try {
        const { error } = await supabase
          .from("foundry_templates")
          .delete()
          .eq("id", templateId)
          .eq("user_id", userId);

        if (error) {
          console.error("Failed to delete template:", error);
          dispatch(actions.showToast("Failed to delete template"));
          return false;
        }

        dispatch(actions.showToast("Template deleted"));
        return true;
      } catch (e) {
        console.error("Failed to delete template from Supabase:", e);
        dispatch(actions.showToast("Failed to delete template"));
        return false;
      }
    },
    [userId, dispatch]
  );

  /**
   * Update a template's config
   */
  const updateTemplate = useCallback(
    async (
      templateId: string,
      updates: Partial<Pick<FoundryTemplate, "name" | "config" | "category_id">>
    ): Promise<boolean> => {
      // LocalStorage fallback if no user
      if (!userId) {
        try {
          const stored = localStorage.getItem("foundry_templates");
          const templates: FoundryTemplate[] = stored ? JSON.parse(stored) : [];
          const idx = templates.findIndex((t) => t.id === templateId);

          if (idx === -1) {
            dispatch(actions.showToast("Template not found"));
            return false;
          }

          templates[idx] = {
            ...templates[idx],
            ...updates,
            updated_at: new Date().toISOString(),
          };
          localStorage.setItem("foundry_templates", JSON.stringify(templates));
          dispatch(actions.showToast("Template updated"));
          return true;
        } catch (e) {
          console.error("Failed to update template in localStorage:", e);
          dispatch(actions.showToast("Failed to update template"));
          return false;
        }
      }

      if (!supabase) {
        dispatch(actions.showToast("Database not configured"));
        return false;
      }

      try {
        const { error } = await supabase
          .from("foundry_templates")
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq("id", templateId)
          .eq("user_id", userId);

        if (error) {
          console.error("Failed to update template:", error);
          dispatch(actions.showToast("Failed to update template"));
          return false;
        }

        dispatch(actions.showToast("Template updated"));
        return true;
      } catch (e) {
        console.error("Failed to update template in Supabase:", e);
        dispatch(actions.showToast("Failed to update template"));
        return false;
      }
    },
    [userId, dispatch]
  );

  return {
    saveAsTemplate,
    promoteToVault,
    deleteTemplate,
    updateTemplate,
  };
}
