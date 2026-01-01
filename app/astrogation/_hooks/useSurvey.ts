"use client";

import { useEffect, useCallback, useState, useMemo, useRef } from "react";
import type { SurveyItem } from "../_components/types";
import type { AstrogationAction } from "../_state/astrogationReducer";
import { actions } from "../_state/astrogationReducer";
import { useAuth } from "@/components/auth/AuthProvider";

// ═══════════════════════════════════════════════════════════════
// SURVEY HOOK - Manages Survey CRUD operations
// ═══════════════════════════════════════════════════════════════

export type PipelineStatus = "idle" | "analyzing" | "briefing" | "done" | "error";
export type SearchSpace = "briefing" | "full";

export interface UseSurveyOptions {
  dispatch: React.Dispatch<AstrogationAction>;
  surveyCategoryId: string | null;
  surveyComponentKey: string | null;
  surveySelectedItemId?: string | null;
}

export interface UseSurveyReturn {
  loadItems: () => Promise<void>;
  uploadItem: (
    file: File,
    categoryId?: string | null,
    componentKey?: string | null
  ) => Promise<void>;
  updateItem: (updates: Partial<SurveyItem>) => Promise<void>;
  deleteItem: () => Promise<void>;
  analyzeItem: (itemId?: string) => Promise<void>;
  generateBriefing: (itemId?: string, force?: boolean) => Promise<void>;
  embedItem: (itemId?: string) => Promise<void>;
  semanticSearch: (
    query: string | null,
    mode: "query" | "similar",
    space?: SearchSpace
  ) => Promise<void>;
  itemCounts: Record<string, number>;
  isAnalyzing: boolean;
  isEmbedding: boolean;
  isBriefing: boolean;
  isSaving: boolean;
  pipelineStatus: PipelineStatus;
  searchSpace: SearchSpace;
  setSearchSpace: (space: SearchSpace) => void;
}

export function useSurvey({
  dispatch,
  surveyCategoryId,
  surveyComponentKey,
  surveySelectedItemId,
}: UseSurveyOptions): UseSurveyReturn {
  const { session } = useAuth();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isEmbedding, setIsEmbedding] = useState(false);
  const [isBriefing, setIsBriefing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus>("idle");
  const [searchSpace, setSearchSpace] = useState<SearchSpace>("briefing");
  const [allItems, setAllItems] = useState<SurveyItem[]>([]);

  // Keep a ref to the selected item ID for use in callbacks
  const selectedItemIdRef = useRef(surveySelectedItemId);
  selectedItemIdRef.current = surveySelectedItemId;

  // Helper to get auth headers
  const getHeaders = useCallback(() => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }
    return headers;
  }, [session?.access_token]);

  // Load items from server
  const loadItems = useCallback(async () => {
    dispatch(actions.surveySetLoading(true));
    try {
      const params = new URLSearchParams();
      if (surveyCategoryId) params.set("category_id", surveyCategoryId);
      if (surveyComponentKey) params.set("component_key", surveyComponentKey);

      const res = await fetch(`/api/survey/items?${params}`, {
        headers: getHeaders(),
      });

      if (!res.ok) throw new Error("Failed to load items");

      const data = await res.json();
      dispatch(actions.surveyLoadItems(data.items || []));
      setAllItems(data.allItems || data.items || []);
    } catch (error) {
      console.error("Failed to load survey items:", error);
      dispatch(actions.showToast("Failed to load references"));
      dispatch(actions.surveySetLoading(false));
    }
  }, [dispatch, surveyCategoryId, surveyComponentKey, getHeaders]);

  // Load items on mount and when filters change
  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Calculate item counts per category/component
  const itemCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of allItems) {
      if (item.category_id) {
        counts[item.category_id] = (counts[item.category_id] || 0) + 1;
      }
      if (item.component_key) {
        counts[item.component_key] = (counts[item.component_key] || 0) + 1;
      }
    }
    return counts;
  }, [allItems]);

  // Analyze item with Claude
  // NOTE: Must be defined before uploadItem due to dependency
  const analyzeItem = useCallback(
    async (explicitItemId?: string) => {
      const itemId = explicitItemId || selectedItemIdRef.current;
      if (!itemId) return;

      setIsAnalyzing(true);
      try {
        const res = await fetch("/api/survey/analyze", {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({ itemId }),
        });

        if (!res.ok) throw new Error("Failed to analyze");

        const data = await res.json();
        dispatch(actions.surveyUpdateItem(data.item));
        dispatch(actions.showToast("Analysis complete"));

        // Update allItems
        setAllItems((prev) => prev.map((item) => (item.id === data.item.id ? data.item : item)));
      } catch (error) {
        console.error("Failed to analyze:", error);
        dispatch(actions.showToast("Failed to analyze"));
        throw error; // Re-throw for pipeline handling
      } finally {
        setIsAnalyzing(false);
      }
    },
    [dispatch, getHeaders]
  );

  // Generate briefing with Claude
  // NOTE: Must be defined before uploadItem due to dependency
  const generateBriefing = useCallback(
    async (explicitItemId?: string, force = false) => {
      const itemId = explicitItemId || selectedItemIdRef.current;
      if (!itemId) return;

      setIsBriefing(true);
      try {
        const res = await fetch("/api/survey/briefing", {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({ itemId, force }),
        });

        const data = await res.json();

        // Handle confirmation required response
        if (res.status === 409 && data.requiresConfirmation) {
          const confirmed = confirm("A briefing already exists. Overwrite it?");
          if (confirmed) {
            // Retry with force=true
            setIsBriefing(false);
            return generateBriefing(itemId, true);
          }
          return;
        }

        if (!res.ok) throw new Error(data.error || "Failed to generate briefing");

        dispatch(actions.surveyUpdateItem(data.item));
        dispatch(actions.showToast("Briefing generated"));

        // Update allItems
        setAllItems((prev) => prev.map((item) => (item.id === data.item.id ? data.item : item)));
      } catch (error) {
        console.error("Failed to generate briefing:", error);
        dispatch(actions.showToast("Failed to generate briefing"));
        throw error; // Re-throw for pipeline handling
      } finally {
        setIsBriefing(false);
      }
    },
    [dispatch, getHeaders]
  );

  // Upload a new item with auto-pipeline (analyze → briefing)
  const uploadItem = useCallback(
    async (file: File, categoryId?: string | null, componentKey?: string | null) => {
      const formData = new FormData();
      formData.append("file", file);
      // Use provided category/component, or fall back to current selection
      const finalCategoryId = categoryId !== undefined ? categoryId : surveyCategoryId;
      const finalComponentKey = componentKey !== undefined ? componentKey : surveyComponentKey;
      if (finalCategoryId) formData.append("category_id", finalCategoryId);
      if (finalComponentKey) formData.append("component_key", finalComponentKey);

      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const res = await fetch("/api/survey/items", {
        method: "POST",
        headers,
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to upload");
      }

      const data = await res.json();
      const newItemId = data.item.id;

      dispatch(actions.surveyAddItem(data.item));
      dispatch(actions.showToast("Reference uploaded"));

      // Update all items for counts
      setAllItems((prev) => [data.item, ...prev]);

      // Auto-run pipeline: analyze → briefing
      setPipelineStatus("analyzing");
      try {
        await analyzeItem(newItemId);
        setPipelineStatus("briefing");
        await generateBriefing(newItemId);
        setPipelineStatus("done");
        dispatch(actions.showToast("Analysis and briefing complete"));
      } catch (error) {
        console.error("Pipeline error:", error);
        setPipelineStatus("error");
        // Don't throw - the upload succeeded, just the pipeline failed
      }
    },
    [
      dispatch,
      session?.access_token,
      surveyCategoryId,
      surveyComponentKey,
      analyzeItem,
      generateBriefing,
    ]
  );

  // Update an item
  const updateItem = useCallback(
    async (updates: Partial<SurveyItem>) => {
      setIsSaving(true);
      try {
        const res = await fetch("/api/survey/items", {
          method: "PATCH",
          headers: getHeaders(),
          body: JSON.stringify(updates),
        });

        if (!res.ok) throw new Error("Failed to update");

        const data = await res.json();
        dispatch(actions.surveyUpdateItem(data.item));
        dispatch(actions.showToast("Saved"));

        // Update all items for counts
        setAllItems((prev) => prev.map((item) => (item.id === data.item.id ? data.item : item)));
      } catch (error) {
        console.error("Failed to update item:", error);
        dispatch(actions.showToast("Failed to save"));
      } finally {
        setIsSaving(false);
      }
    },
    [dispatch, getHeaders]
  );

  // Delete the selected item
  const deleteItem = useCallback(async () => {
    const itemId = selectedItemIdRef.current;
    if (!itemId) return;

    const res = await fetch(`/api/survey/items?id=${itemId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });

    if (!res.ok) throw new Error("Failed to delete");

    dispatch(actions.surveyDeleteItem(itemId));
    dispatch(actions.showToast("Reference deleted"));
    setAllItems((prev) => prev.filter((item) => item.id !== itemId));
  }, [dispatch, getHeaders]);

  // Embed item with Voyage (dual embeddings)
  const embedItem = useCallback(
    async (explicitItemId?: string) => {
      const itemId = explicitItemId || selectedItemIdRef.current;
      if (!itemId) return;

      setIsEmbedding(true);
      try {
        const res = await fetch("/api/survey/embed", {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({ itemId }),
        });

        if (!res.ok) throw new Error("Failed to embed");

        const data = await res.json();
        dispatch(actions.surveyUpdateItem(data.item));
        dispatch(actions.showToast("Embeddings complete"));

        // Update allItems
        setAllItems((prev) => prev.map((item) => (item.id === data.item.id ? data.item : item)));
      } catch (error) {
        console.error("Failed to embed:", error);
        dispatch(actions.showToast("Failed to embed"));
        throw error; // Re-throw for pipeline handling
      } finally {
        setIsEmbedding(false);
      }
    },
    [dispatch, getHeaders]
  );

  // Semantic search using Voyage embeddings
  const semanticSearch = useCallback(
    async (query: string | null, mode: "query" | "similar", space?: SearchSpace) => {
      dispatch(actions.surveySetSearching(true));
      dispatch(actions.surveySetLoading(true));

      // Use provided space or fall back to state
      const effectiveSpace = space || searchSpace;

      try {
        // For "similar" mode, use the selected item's embedding_text or build a query from its fields
        let searchQuery = query;
        if (mode === "similar") {
          const itemId = selectedItemIdRef.current;
          if (!itemId) {
            dispatch(actions.showToast("No item selected for similar search"));
            return;
          }

          // Find the selected item to build a query from its content
          const selectedItem = allItems.find((item) => item.id === itemId);
          if (!selectedItem) {
            dispatch(actions.showToast("Selected item not found"));
            return;
          }

          // Build query from item's content (use briefing if available for cleaner search)
          const parts: string[] = [];
          if (selectedItem.briefing) {
            parts.push(selectedItem.briefing);
          } else {
            if (selectedItem.title) parts.push(selectedItem.title);
            if (selectedItem.notes) parts.push(selectedItem.notes);
            if (selectedItem.tags && selectedItem.tags.length > 0) {
              parts.push(selectedItem.tags.join(", "));
            }
            if (selectedItem.analysis && typeof selectedItem.analysis === "object") {
              const analysis = selectedItem.analysis as Record<string, unknown>;
              if (analysis.transferNotes) {
                parts.push(String(analysis.transferNotes));
              }
            }
          }

          searchQuery = parts.join(". ");
          if (!searchQuery.trim()) {
            dispatch(actions.showToast("Item has no content to search with"));
            return;
          }
        }

        if (!searchQuery || !searchQuery.trim()) {
          dispatch(actions.showToast("Search query is required"));
          return;
        }

        const res = await fetch("/api/survey/search", {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({
            query: searchQuery,
            categoryId: surveyCategoryId || undefined,
            componentKey: surveyComponentKey || undefined,
            limit: 20,
            threshold: 0.3,
            space: effectiveSpace,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || "Search failed");
        }

        const data = await res.json();
        const items = (data.items || []).map((item: SurveyItem & { similarity?: number }) => ({
          ...item,
          // Preserve similarity score if present
          similarity: item.similarity,
        }));

        dispatch(actions.surveyLoadItems(items));
        dispatch(actions.showToast(`Found ${items.length} similar items (${effectiveSpace})`));
      } catch (error) {
        console.error("Semantic search failed:", error);
        dispatch(actions.showToast(error instanceof Error ? error.message : "Search failed"));
        // On error, reload regular items
        await loadItems();
      } finally {
        dispatch(actions.surveySetSearching(false));
        dispatch(actions.surveySetLoading(false));
      }
    },
    [dispatch, surveyCategoryId, surveyComponentKey, getHeaders, allItems, loadItems, searchSpace]
  );

  return {
    loadItems,
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
  };
}
