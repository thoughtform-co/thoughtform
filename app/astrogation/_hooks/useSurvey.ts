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

// ═══════════════════════════════════════════════════════════════
// FETCH HELPERS - Centralized request handling
// ═══════════════════════════════════════════════════════════════

interface FetchOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
}

/**
 * Creates a typed fetch helper with auth headers
 */
function createFetcher(accessToken: string | undefined) {
  const baseHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (accessToken) {
    baseHeaders["Authorization"] = `Bearer ${accessToken}`;
  }

  return async <T>(endpoint: string, options: FetchOptions = {}): Promise<T> => {
    const { method = "GET", body, signal } = options;

    const res = await fetch(endpoint, {
      method,
      headers: baseHeaders,
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Request failed: ${res.status}`);
    }

    return res.json();
  };
}

/**
 * Creates a FormData fetch helper (for file uploads)
 */
function createFormFetcher(accessToken: string | undefined) {
  return async <T>(endpoint: string, formData: FormData, signal?: AbortSignal): Promise<T> => {
    const headers: Record<string, string> = {};
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: formData,
      signal,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Upload failed: ${res.status}`);
    }

    return res.json();
  };
}

// ═══════════════════════════════════════════════════════════════
// MAIN HOOK
// ═══════════════════════════════════════════════════════════════

export function useSurvey({
  dispatch,
  surveyCategoryId,
  surveyComponentKey,
  surveySelectedItemId,
}: UseSurveyOptions): UseSurveyReturn {
  const { session } = useAuth();

  // Loading states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isEmbedding, setIsEmbedding] = useState(false);
  const [isBriefing, setIsBriefing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus>("idle");
  const [searchSpace, setSearchSpace] = useState<SearchSpace>("briefing");
  const [allItems, setAllItems] = useState<SurveyItem[]>([]);

  // Refs for stable callback access
  const selectedItemIdRef = useRef(surveySelectedItemId);
  selectedItemIdRef.current = surveySelectedItemId;

  // AbortController ref for cancelling stale requests
  const loadAbortRef = useRef<AbortController | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);

  // Create stable fetchers
  const fetcher = useMemo(() => createFetcher(session?.access_token), [session?.access_token]);
  const formFetcher = useMemo(
    () => createFormFetcher(session?.access_token),
    [session?.access_token]
  );

  // ═══════════════════════════════════════════════════════════════
  // LOAD ITEMS - With stale request cancellation
  // ═══════════════════════════════════════════════════════════════

  const loadItems = useCallback(async () => {
    // Cancel any in-flight load request
    loadAbortRef.current?.abort();
    loadAbortRef.current = new AbortController();

    dispatch(actions.surveySetLoading(true));

    try {
      const params = new URLSearchParams();
      if (surveyCategoryId) params.set("category_id", surveyCategoryId);
      if (surveyComponentKey) params.set("component_key", surveyComponentKey);

      const data = await fetcher<{ items: SurveyItem[]; allItems?: SurveyItem[] }>(
        `/api/survey/items?${params}`,
        { signal: loadAbortRef.current.signal }
      );

      dispatch(actions.surveyLoadItems(data.items || []));
      setAllItems(data.allItems || data.items || []);
    } catch (error) {
      // Ignore abort errors (expected when request is cancelled)
      if (error instanceof Error && error.name === "AbortError") return;

      console.error("Failed to load survey items:", error);
      dispatch(actions.showToast("Failed to load references"));
      dispatch(actions.surveySetLoading(false));
    }
  }, [dispatch, surveyCategoryId, surveyComponentKey, fetcher]);

  // Load items on mount and when filters change
  useEffect(() => {
    loadItems();

    // Cleanup: abort on unmount or filter change
    return () => {
      loadAbortRef.current?.abort();
    };
  }, [loadItems]);

  // ═══════════════════════════════════════════════════════════════
  // ITEM COUNTS - Computed from all items
  // ═══════════════════════════════════════════════════════════════

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

  // ═══════════════════════════════════════════════════════════════
  // ANALYZE ITEM
  // ═══════════════════════════════════════════════════════════════

  const analyzeItem = useCallback(
    async (explicitItemId?: string) => {
      const itemId = explicitItemId || selectedItemIdRef.current;
      if (!itemId) return;

      setIsAnalyzing(true);
      try {
        const data = await fetcher<{ item: SurveyItem }>("/api/survey/analyze", {
          method: "POST",
          body: { itemId },
        });

        dispatch(actions.surveyUpdateItem(data.item));
        dispatch(actions.showToast("Analysis complete"));
        setAllItems((prev) => prev.map((item) => (item.id === data.item.id ? data.item : item)));
      } catch (error) {
        console.error("Failed to analyze:", error);
        dispatch(actions.showToast("Failed to analyze"));
        throw error;
      } finally {
        setIsAnalyzing(false);
      }
    },
    [dispatch, fetcher]
  );

  // ═══════════════════════════════════════════════════════════════
  // GENERATE BRIEFING
  // ═══════════════════════════════════════════════════════════════

  const generateBriefing = useCallback(
    async (explicitItemId?: string, force = false) => {
      const itemId = explicitItemId || selectedItemIdRef.current;
      if (!itemId) return;

      setIsBriefing(true);
      try {
        const res = await fetch("/api/survey/briefing", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(session?.access_token && { Authorization: `Bearer ${session.access_token}` }),
          },
          body: JSON.stringify({ itemId, force }),
        });

        const data = await res.json();

        // Handle confirmation required response
        if (res.status === 409 && data.requiresConfirmation) {
          const confirmed = confirm("A briefing already exists. Overwrite it?");
          if (confirmed) {
            setIsBriefing(false);
            return generateBriefing(itemId, true);
          }
          return;
        }

        if (!res.ok) throw new Error(data.error || "Failed to generate briefing");

        dispatch(actions.surveyUpdateItem(data.item));
        dispatch(actions.showToast("Briefing generated"));
        setAllItems((prev) => prev.map((item) => (item.id === data.item.id ? data.item : item)));
      } catch (error) {
        console.error("Failed to generate briefing:", error);
        dispatch(actions.showToast("Failed to generate briefing"));
        throw error;
      } finally {
        setIsBriefing(false);
      }
    },
    [dispatch, session?.access_token]
  );

  // ═══════════════════════════════════════════════════════════════
  // UPLOAD ITEM - With auto-analysis (briefing is manual)
  // ═══════════════════════════════════════════════════════════════

  const uploadItem = useCallback(
    async (file: File, categoryId?: string | null, componentKey?: string | null) => {
      const formData = new FormData();
      formData.append("file", file);

      const finalCategoryId = categoryId !== undefined ? categoryId : surveyCategoryId;
      const finalComponentKey = componentKey !== undefined ? componentKey : surveyComponentKey;

      if (finalCategoryId) formData.append("category_id", finalCategoryId);
      if (finalComponentKey) formData.append("component_key", finalComponentKey);

      const data = await formFetcher<{ item: SurveyItem }>("/api/survey/items", formData);
      const newItemId = data.item.id;

      dispatch(actions.surveyAddItem(data.item));
      dispatch(actions.showToast("Reference uploaded"));
      setAllItems((prev) => [data.item, ...prev]);

      // Auto-run analysis only (briefing is triggered manually)
      setPipelineStatus("analyzing");
      try {
        await analyzeItem(newItemId);
        setPipelineStatus("done");
        dispatch(actions.showToast("Analysis complete"));
      } catch (error) {
        console.error("Analysis error:", error);
        setPipelineStatus("error");
        // Don't throw - upload succeeded, just analysis failed
      }
    },
    [dispatch, surveyCategoryId, surveyComponentKey, formFetcher, analyzeItem]
  );

  // ═══════════════════════════════════════════════════════════════
  // UPDATE ITEM
  // ═══════════════════════════════════════════════════════════════

  const updateItem = useCallback(
    async (updates: Partial<SurveyItem>) => {
      setIsSaving(true);
      try {
        const data = await fetcher<{ item: SurveyItem }>("/api/survey/items", {
          method: "PATCH",
          body: updates,
        });

        dispatch(actions.surveyUpdateItem(data.item));
        dispatch(actions.showToast("Saved"));
        setAllItems((prev) => prev.map((item) => (item.id === data.item.id ? data.item : item)));
      } catch (error) {
        console.error("Failed to update item:", error);
        dispatch(actions.showToast("Failed to save"));
      } finally {
        setIsSaving(false);
      }
    },
    [dispatch, fetcher]
  );

  // ═══════════════════════════════════════════════════════════════
  // DELETE ITEM
  // ═══════════════════════════════════════════════════════════════

  const deleteItem = useCallback(async () => {
    const itemId = selectedItemIdRef.current;
    if (!itemId) return;

    await fetcher<{ success: boolean }>(`/api/survey/items?id=${itemId}`, {
      method: "DELETE",
    });

    dispatch(actions.surveyDeleteItem(itemId));
    dispatch(actions.showToast("Reference deleted"));
    setAllItems((prev) => prev.filter((item) => item.id !== itemId));
  }, [dispatch, fetcher]);

  // ═══════════════════════════════════════════════════════════════
  // EMBED ITEM
  // ═══════════════════════════════════════════════════════════════

  const embedItem = useCallback(
    async (explicitItemId?: string) => {
      const itemId = explicitItemId || selectedItemIdRef.current;
      if (!itemId) return;

      setIsEmbedding(true);
      try {
        const data = await fetcher<{ item: SurveyItem }>("/api/survey/embed", {
          method: "POST",
          body: { itemId },
        });

        dispatch(actions.surveyUpdateItem(data.item));
        dispatch(actions.showToast("Embeddings complete"));
        setAllItems((prev) => prev.map((item) => (item.id === data.item.id ? data.item : item)));
      } catch (error) {
        console.error("Failed to embed:", error);
        dispatch(actions.showToast("Failed to embed"));
        throw error;
      } finally {
        setIsEmbedding(false);
      }
    },
    [dispatch, fetcher]
  );

  // ═══════════════════════════════════════════════════════════════
  // SEMANTIC SEARCH - With stale request cancellation
  // ═══════════════════════════════════════════════════════════════

  const semanticSearch = useCallback(
    async (query: string | null, mode: "query" | "similar", space?: SearchSpace) => {
      // Cancel any in-flight search request
      searchAbortRef.current?.abort();
      searchAbortRef.current = new AbortController();

      dispatch(actions.surveySetSearching(true));
      dispatch(actions.surveySetLoading(true));

      const effectiveSpace = space || searchSpace;

      try {
        let searchQuery = query;

        // For "similar" mode, build query from selected item
        if (mode === "similar") {
          const itemId = selectedItemIdRef.current;
          if (!itemId) {
            dispatch(actions.showToast("No item selected for similar search"));
            return;
          }

          const selectedItem = allItems.find((item) => item.id === itemId);
          if (!selectedItem) {
            dispatch(actions.showToast("Selected item not found"));
            return;
          }

          // Build query from item content
          const parts: string[] = [];
          if (selectedItem.briefing) {
            parts.push(selectedItem.briefing);
          } else {
            if (selectedItem.title) parts.push(selectedItem.title);
            if (selectedItem.notes) parts.push(selectedItem.notes);
            if (selectedItem.tags?.length) parts.push(selectedItem.tags.join(", "));
            if (selectedItem.analysis?.transferNotes) {
              parts.push(selectedItem.analysis.transferNotes);
            }
          }

          searchQuery = parts.join(". ");
          if (!searchQuery.trim()) {
            dispatch(actions.showToast("Item has no content to search with"));
            return;
          }
        }

        if (!searchQuery?.trim()) {
          dispatch(actions.showToast("Search query is required"));
          return;
        }

        const data = await fetcher<{ items: (SurveyItem & { similarity?: number })[] }>(
          "/api/survey/search",
          {
            method: "POST",
            body: {
              query: searchQuery,
              categoryId: surveyCategoryId || undefined,
              componentKey: surveyComponentKey || undefined,
              limit: 20,
              threshold: 0.3,
              space: effectiveSpace,
            },
            signal: searchAbortRef.current.signal,
          }
        );

        const items = (data.items || []).map((item) => ({
          ...item,
          similarity: item.similarity,
        }));

        dispatch(actions.surveyLoadItems(items));
        dispatch(actions.showToast(`Found ${items.length} similar items (${effectiveSpace})`));
      } catch (error) {
        // Ignore abort errors
        if (error instanceof Error && error.name === "AbortError") return;

        console.error("Semantic search failed:", error);
        dispatch(actions.showToast(error instanceof Error ? error.message : "Search failed"));
        await loadItems();
      } finally {
        dispatch(actions.surveySetSearching(false));
        dispatch(actions.surveySetLoading(false));
      }
    },
    [dispatch, surveyCategoryId, surveyComponentKey, fetcher, allItems, loadItems, searchSpace]
  );

  // Cleanup abort controllers on unmount
  useEffect(() => {
    return () => {
      loadAbortRef.current?.abort();
      searchAbortRef.current?.abort();
    };
  }, []);

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
