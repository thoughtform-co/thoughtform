"use client";

import { useEffect, useCallback, useState, useMemo, useRef } from "react";
import type { SurveyItem, SurveySegment, SurveyCollection } from "../_components/types";
import type { AstrogationAction } from "../_state/astrogationReducer";
import { actions } from "../_state/astrogationReducer";
import { useAuth } from "@/components/auth/AuthProvider";
import { logger } from "@/lib/logger";

// ═══════════════════════════════════════════════════════════════
// SURVEY HOOK - Manages Survey CRUD operations
// ═══════════════════════════════════════════════════════════════

export type PipelineStatus = "idle" | "analyzing" | "briefing" | "done" | "error";
export type SearchSpace = "briefing" | "full";

export interface UpdateItemOptions {
  /** Suppress success toast (recommended for autosave / high-frequency updates). */
  silent?: boolean;
  /** Override error toast message. */
  errorToast?: string;
  /** Override success toast message (ignored when silent=true). */
  successToast?: string;
}

export interface UseSurveyOptions {
  dispatch: React.Dispatch<AstrogationAction>;
  surveyCategoryId: string | null;
  surveyComponentKey: string | null;
  surveySelectedItemId?: string | null;
}

export interface UseSurveyReturn {
  loadItems: () => Promise<void>;
  loadItemFullData: (itemId: string) => Promise<void>;
  uploadItem: (
    file: File,
    categoryId?: string | null,
    componentKey?: string | null
  ) => Promise<void>;
  updateItem: (updates: Partial<SurveyItem>, options?: UpdateItemOptions) => Promise<void>;
  deleteItem: () => Promise<void>;
  analyzeItem: (itemId?: string) => Promise<void>;
  generateBriefing: (itemId?: string, force?: boolean) => Promise<void>;
  embedItem: (itemId?: string) => Promise<void>;
  semanticSearch: (
    query: string | null,
    mode: "query" | "similar",
    space?: SearchSpace
  ) => Promise<void>;
  generateAnnotationCrop: (
    itemId: string,
    annotationId: string,
    bounds?: { x: number; y: number; width: number; height: number }
  ) => Promise<unknown>;
  // Segmentation
  generateSegments: (itemId: string) => Promise<SurveySegment[] | null>;
  loadSegments: (itemId: string) => Promise<SurveySegment[]>;
  updateSegmentLabel: (segmentId: string, label: string) => Promise<void>;
  deleteSegment: (segmentId: string) => Promise<void>;
  labelSegments: (itemId: string) => Promise<SurveySegment[] | null>;
  isSegmenting: boolean;
  isLabelingSegments: boolean;
  segments: SurveySegment[];
  // Collections
  collections: SurveyCollection[];
  loadCollections: () => Promise<void>;
  createCollection: (
    name: string,
    description?: string,
    color?: string
  ) => Promise<SurveyCollection>;
  updateCollection: (id: string, updates: Partial<SurveyCollection>) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
  // Stats
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
      const errorMessage = errorData.error || `Request failed: ${res.status}`;

      // Provide more helpful error messages
      if (res.status === 401) {
        throw new Error("Authentication required. Please sign in to view your items.");
      }

      throw new Error(errorMessage);
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

  // Get current survey items from state - we'll use a ref to track them
  const surveyItemsRef = useRef<SurveyItem[]>([]);

  // Loading states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isEmbedding, setIsEmbedding] = useState(false);
  const [isBriefing, setIsBriefing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus>("idle");
  const [searchSpace, setSearchSpace] = useState<SearchSpace>("briefing");
  const [allItems, setAllItems] = useState<SurveyItem[]>([]);
  const [isSegmenting, setIsSegmenting] = useState(false);
  const [isLabelingSegments, setIsLabelingSegments] = useState(false);
  const [segments, setSegments] = useState<SurveySegment[]>([]);
  const [collections, setCollections] = useState<SurveyCollection[]>([]);

  // Refs for stable callback access
  const selectedItemIdRef = useRef(surveySelectedItemId);
  selectedItemIdRef.current = surveySelectedItemId;

  // AbortController ref for cancelling stale requests
  const loadAbortRef = useRef<AbortController | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);

  // ═══════════════════════════════════════════════════════════════
  // UPLOAD LOCK - Prevent loadItems during active upload
  // ═══════════════════════════════════════════════════════════════
  // When uploading, we don't want loadItems to run because the newly uploaded
  // item might not be in the database yet, causing it to disappear from the UI.
  const isUploadingRef = useRef(false);

  // ═══════════════════════════════════════════════════════════════
  // RACE CONDITION PROTECTION - Preserve optimistic updates during reloads
  // ═══════════════════════════════════════════════════════════════
  // Track recently added/deleted items to preserve optimistic state during
  // loadItems race conditions. Session token refresh can trigger loadItems
  // to run with stale data, overwriting optimistic updates.
  const recentlyAddedItemsRef = useRef<Map<string, SurveyItem>>(new Map());
  const recentlyDeletedIdsRef = useRef<Set<string>>(new Set());

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
    // Check if user is authenticated - API requires auth token
    if (!session?.access_token) {
      console.warn("No session token available - user may need to sign in");
      dispatch(actions.showToast("Please sign in to view your items"));
      dispatch(actions.surveySetLoading(false));
      return;
    }

    // ═══════════════════════════════════════════════════════════════
    // UPLOAD LOCK: Skip loading during active upload
    // ═══════════════════════════════════════════════════════════════
    // If an upload is in progress, skip this load request to prevent
    // race conditions where the newly uploaded item disappears from UI.
    if (isUploadingRef.current) {
      logger.log("[useSurvey] Skipping loadItems - upload in progress");
      return;
    }

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

      // ═══════════════════════════════════════════════════════════════
      // MERGE PROTECTION - Preserve optimistic updates during reload
      // ═══════════════════════════════════════════════════════════════
      let mergedItems = data.items || [];

      // 1. Filter out recently deleted items (server might still have them)
      if (recentlyDeletedIdsRef.current.size > 0) {
        const beforeCount = mergedItems.length;
        mergedItems = mergedItems.filter((item) => {
          if (recentlyDeletedIdsRef.current.has(item.id)) {
            return false; // Exclude - was recently deleted
          }
          return true;
        });
        const filteredCount = beforeCount - mergedItems.length;
        if (filteredCount > 0) {
          logger.log(
            `[useSurvey] Filtering out ${filteredCount} recently deleted items during reload`
          );
        }
      }

      // 2. Merge in recently added items that aren't in server response
      if (recentlyAddedItemsRef.current.size > 0) {
        const loadedIds = new Set(mergedItems.map((item) => item.id));
        const itemsToPreserve: SurveyItem[] = [];

        for (const [id, item] of recentlyAddedItemsRef.current) {
          if (!loadedIds.has(id)) {
            // Item was just added but not in server response - preserve it
            itemsToPreserve.push(item);
          } else {
            // Item is now in server response - remove from tracking
            recentlyAddedItemsRef.current.delete(id);
          }
        }

        if (itemsToPreserve.length > 0) {
          logger.log(
            `[useSurvey] Preserving ${itemsToPreserve.length} recently added items during reload`
          );
          mergedItems = [...itemsToPreserve, ...mergedItems];
        }
      }

      // 3. Preserve locally-loaded full fields (briefing/description/etc.) and client flags
      // loadItems intentionally omits large fields; we merge them back in for any items that
      // were already loaded in full to avoid "missing fields" + re-fetch loops.
      if (surveyItemsRef.current.length > 0) {
        const existingById = new Map(surveyItemsRef.current.map((it) => [it.id, it]));
        mergedItems = mergedItems.map((it) => {
          const existing = existingById.get(it.id);
          if (!existing) return it;
          if (existing.has_full_data) {
            return { ...existing, ...it, has_full_data: true };
          }
          return it;
        });
      }

      dispatch(actions.surveyLoadItems(mergedItems));
      surveyItemsRef.current = mergedItems;

      // Also filter allItems for counts
      let filteredAllItems = data.allItems || mergedItems || [];
      if (recentlyDeletedIdsRef.current.size > 0) {
        filteredAllItems = filteredAllItems.filter(
          (item) => !recentlyDeletedIdsRef.current.has(item.id)
        );
      }
      setAllItems(filteredAllItems);
    } catch (error) {
      // Ignore abort errors (expected when request is cancelled)
      if (error instanceof Error && error.name === "AbortError") return;

      console.error("Failed to load survey items:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to load references";
      dispatch(actions.showToast(errorMessage));
      dispatch(actions.surveySetLoading(false));
    }
  }, [dispatch, surveyCategoryId, surveyComponentKey, fetcher, session?.access_token]);

  // ═══════════════════════════════════════════════════════════════
  // LOAD FULL ITEM DATA - For detail view (includes large text fields)
  // ═══════════════════════════════════════════════════════════════
  // Fetches full item data including briefing, description, and embedding_text
  // when detail view opens. This is a performance optimization - initial load
  // excludes these large fields to improve grid view load time.

  const loadItemFullData = useCallback(
    async (itemId: string) => {
      if (!session?.access_token) return;

      try {
        // Fetch full item data including large text fields
        const data = await fetcher<{ item: SurveyItem }>(`/api/survey/items/${itemId}`);

        if (data.item) {
          const fullItem: SurveyItem = { ...data.item, has_full_data: true };
          // Update the item in the items array with full data
          const updatedItems = surveyItemsRef.current.map((item) =>
            item.id === itemId ? fullItem : item
          );
          surveyItemsRef.current = updatedItems;
          dispatch(actions.surveyLoadItems(updatedItems));
        }
      } catch (error) {
        console.error("Failed to load full item data:", error);
        // Silently fail - grid data is already available
      }
    },
    [dispatch, fetcher, session?.access_token]
  );

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

        const existing = surveyItemsRef.current.find((it) => it.id === data.item.id) || null;
        const mergedItem: SurveyItem = { ...existing, ...data.item, has_full_data: true };
        // Update tracking if this item is being protected from race conditions
        if (recentlyAddedItemsRef.current.has(data.item.id)) {
          recentlyAddedItemsRef.current.set(data.item.id, mergedItem);
        }

        // Keep the local ref in sync
        const hasInRef = surveyItemsRef.current.some((it) => it.id === mergedItem.id);
        surveyItemsRef.current = hasInRef
          ? surveyItemsRef.current.map((it) => (it.id === mergedItem.id ? mergedItem : it))
          : [mergedItem, ...surveyItemsRef.current];

        dispatch(actions.surveyUpdateItem(mergedItem));
        dispatch(actions.showToast("Analysis complete"));
        setAllItems((prev) => prev.map((item) => (item.id === mergedItem.id ? mergedItem : item)));
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
      // ═══════════════════════════════════════════════════════════════
      // UPLOAD LOCK: Prevent loadItems during upload flow
      // ═══════════════════════════════════════════════════════════════
      isUploadingRef.current = true;

      try {
        const formData = new FormData();
        formData.append("file", file);

        const finalCategoryId = categoryId !== undefined ? categoryId : surveyCategoryId;
        const finalComponentKey = componentKey !== undefined ? componentKey : surveyComponentKey;

        if (finalCategoryId) formData.append("category_id", finalCategoryId);
        if (finalComponentKey) formData.append("component_key", finalComponentKey);

        const data = await formFetcher<{ item: SurveyItem }>("/api/survey/items", formData);
        const newItemId = data.item.id;

        // ═══════════════════════════════════════════════════════════════
        // RACE CONDITION PROTECTION
        // ═══════════════════════════════════════════════════════════════
        // Track this item to preserve it if loadItems races with this upload.
        // Session token refresh can trigger loadItems to reload with stale data.
        recentlyAddedItemsRef.current.set(newItemId, data.item);

        // Clean up tracking after 30 seconds (item should be in DB by then)
        setTimeout(() => {
          recentlyAddedItemsRef.current.delete(newItemId);
        }, 30000);

        // Keep the local ref in sync so follow-up calls (like loadItemFullData) can't overwrite
        // state with a stale list that excludes the newly uploaded item.
        surveyItemsRef.current = [
          data.item,
          ...surveyItemsRef.current.filter((it) => it.id !== newItemId),
        ];

        dispatch(actions.surveyAddItem(data.item));
        dispatch(actions.surveySelectItem(data.item.id)); // Auto-select the new item
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
      } finally {
        // ═══════════════════════════════════════════════════════════════
        // UPLOAD LOCK: Release lock after upload flow completes
        // ═══════════════════════════════════════════════════════════════
        isUploadingRef.current = false;
      }
    },
    [dispatch, surveyCategoryId, surveyComponentKey, formFetcher, analyzeItem]
  );

  // ═══════════════════════════════════════════════════════════════
  // UPDATE ITEM
  // ═══════════════════════════════════════════════════════════════

  const updateItem = useCallback(
    async (updates: Partial<SurveyItem>, options: UpdateItemOptions = {}) => {
      setIsSaving(true);
      try {
        const data = await fetcher<{ item: SurveyItem }>("/api/survey/items", {
          method: "PATCH",
          body: updates,
        });

        const existing = surveyItemsRef.current.find((it) => it.id === data.item.id) || null;
        const mergedItem: SurveyItem = { ...existing, ...data.item, has_full_data: true };
        // Keep the local ref in sync so subsequent loadItemFullData calls can't overwrite
        // recent edits (like title) with stale data.
        const hasInRef = surveyItemsRef.current.some((it) => it.id === mergedItem.id);
        surveyItemsRef.current = hasInRef
          ? surveyItemsRef.current.map((it) => (it.id === mergedItem.id ? mergedItem : it))
          : [mergedItem, ...surveyItemsRef.current];
        // If this item is being protected as "recently added", keep that copy fresh too.
        if (recentlyAddedItemsRef.current.has(data.item.id)) {
          recentlyAddedItemsRef.current.set(data.item.id, mergedItem);
        }
        dispatch(actions.surveyUpdateItem(mergedItem));
        if (!options.silent) {
          dispatch(actions.showToast(options.successToast ?? "Saved"));
        }
        setAllItems((prev) => prev.map((item) => (item.id === mergedItem.id ? mergedItem : item)));
      } catch (error) {
        console.error("Failed to update item:", error);
        dispatch(
          actions.showToast(
            options.errorToast ?? (options.silent ? "Auto-save failed" : "Failed to save")
          )
        );
        throw error;
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

    // ═══════════════════════════════════════════════════════════════
    // RACE CONDITION PROTECTION
    // ═══════════════════════════════════════════════════════════════
    // Track this deletion to prevent the item from reappearing if loadItems
    // races with this delete (e.g., due to session token refresh).
    recentlyDeletedIdsRef.current.add(itemId);

    // Also remove from recently added if it was there
    recentlyAddedItemsRef.current.delete(itemId);

    // Clean up tracking after 30 seconds
    setTimeout(() => {
      recentlyDeletedIdsRef.current.delete(itemId);
    }, 30000);

    // ═══════════════════════════════════════════════════════════════
    // OPTIMISTIC DELETION - Update UI immediately, then persist
    // ═══════════════════════════════════════════════════════════════
    dispatch(actions.surveyDeleteItem(itemId));
    dispatch(actions.showToast("Reference deleted"));
    setAllItems((prev) => prev.filter((item) => item.id !== itemId));

    // Persist to server (errors are logged but don't revert UI)
    try {
      await fetcher<{ success: boolean }>(`/api/survey/items?id=${itemId}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Failed to delete item from server:", error);
      // Note: We don't revert the UI - the item is already gone from view.
      // If the delete truly failed, a page refresh will restore it.
    }
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

  // ═══════════════════════════════════════════════════════════════
  // GENERATE ANNOTATION CROP
  // ═══════════════════════════════════════════════════════════════

  const generateAnnotationCrop = useCallback(
    async (
      itemId: string,
      annotationId: string,
      bounds?: { x: number; y: number; width: number; height: number }
    ) => {
      try {
        const data = await fetcher<{ annotation: unknown }>("/api/survey/annotations/crop", {
          method: "POST",
          body: { itemId, annotationId, bounds },
        });

        // Refresh item data to get updated annotation with crop URL
        await loadItemFullData(itemId);

        return data.annotation;
      } catch (error) {
        console.error("Failed to generate annotation crop:", error);
        // Don't throw - crop generation is non-critical
      }
    },
    [fetcher, loadItemFullData]
  );

  // ═══════════════════════════════════════════════════════════════
  // SEGMENTATION - SAM-based UI element extraction
  // ═══════════════════════════════════════════════════════════════

  const loadSegments = useCallback(
    async (itemId: string): Promise<SurveySegment[]> => {
      try {
        const data = await fetcher<{ segments: SurveySegment[] }>(
          `/api/survey/segments?itemId=${itemId}`
        );
        setSegments(data.segments || []);
        return data.segments || [];
      } catch (error) {
        console.error("Failed to load segments:", error);
        setSegments([]);
        return [];
      }
    },
    [fetcher]
  );

  const generateSegments = useCallback(
    async (itemId: string): Promise<SurveySegment[] | null> => {
      setIsSegmenting(true);
      dispatch(actions.showToast("Generating segments..."));

      try {
        const data = await fetcher<{ segments: SurveySegment[] }>("/api/survey/segments/generate", {
          method: "POST",
          body: { itemId },
        });

        setSegments(data.segments || []);
        dispatch(actions.showToast(`Found ${data.segments?.length || 0} segments`));
        return data.segments || [];
      } catch (error) {
        console.error("Failed to generate segments:", error);
        dispatch(actions.showToast("Failed to generate segments"));
        return null;
      } finally {
        setIsSegmenting(false);
      }
    },
    [dispatch, fetcher]
  );

  const updateSegmentLabel = useCallback(
    async (segmentId: string, label: string): Promise<void> => {
      try {
        await fetcher<{ segment: SurveySegment }>(`/api/survey/segments`, {
          method: "PATCH",
          body: { segmentId, updates: { label } },
        });

        // Update local state
        setSegments((prev) => prev.map((s) => (s.id === segmentId ? { ...s, label } : s)));
        dispatch(actions.showToast("Segment label saved"));
      } catch (error) {
        console.error("Failed to update segment label:", error);
        dispatch(actions.showToast("Failed to save segment label"));
      }
    },
    [dispatch, fetcher]
  );

  const labelSegments = useCallback(
    async (itemId: string): Promise<SurveySegment[] | null> => {
      setIsLabelingSegments(true);
      dispatch(actions.showToast("Labeling segments..."));

      try {
        const data = await fetcher<{ segments: SurveySegment[]; labeled?: number }>(
          "/api/survey/segments/label",
          {
            method: "POST",
            body: { itemId },
          }
        );

        setSegments(data.segments || []);
        const labeledCount =
          typeof data.labeled === "number" ? data.labeled : (data.segments?.length ?? 0);
        dispatch(
          actions.showToast(`Labeled ${labeledCount} segment${labeledCount === 1 ? "" : "s"}`)
        );
        return data.segments || [];
      } catch (error) {
        console.error("Failed to label segments:", error);
        dispatch(actions.showToast("Failed to label segments"));
        return null;
      } finally {
        setIsLabelingSegments(false);
      }
    },
    [dispatch, fetcher]
  );

  const deleteSegment = useCallback(
    async (segmentId: string): Promise<void> => {
      try {
        await fetcher(`/api/survey/segments?segmentId=${segmentId}`, {
          method: "DELETE",
        });

        // Update local state
        setSegments((prev) => prev.filter((s) => s.id !== segmentId));
        dispatch(actions.showToast("Segment deleted"));
      } catch (error) {
        console.error("Failed to delete segment:", error);
        dispatch(actions.showToast("Failed to delete segment"));
        throw error;
      }
    },
    [dispatch, fetcher]
  );

  // ═══════════════════════════════════════════════════════════════
  // COLLECTIONS - Group related survey items
  // ═══════════════════════════════════════════════════════════════

  const loadCollections = useCallback(async () => {
    if (!session?.access_token) return;

    try {
      const data = await fetcher<{ collections: SurveyCollection[] }>("/api/survey/collections");
      setCollections(data.collections || []);
    } catch (error) {
      console.error("Failed to load collections:", error);
    }
  }, [session?.access_token, fetcher]);

  const createCollection = useCallback(
    async (name: string, description?: string, color?: string): Promise<SurveyCollection> => {
      const data = await fetcher<{ collection: SurveyCollection }>("/api/survey/collections", {
        method: "POST",
        body: { name, description, color },
      });

      const newCollection = data.collection;
      setCollections((prev) => [...prev, newCollection]);
      dispatch(actions.showToast(`Created collection: ${name}`));
      return newCollection;
    },
    [fetcher, dispatch]
  );

  const updateCollection = useCallback(
    async (id: string, updates: Partial<SurveyCollection>): Promise<void> => {
      await fetcher(`/api/survey/collections?id=${id}`, {
        method: "PATCH",
        body: updates,
      });

      setCollections((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    },
    [fetcher]
  );

  const deleteCollection = useCallback(
    async (id: string): Promise<void> => {
      await fetcher(`/api/survey/collections?id=${id}`, {
        method: "DELETE",
      });

      setCollections((prev) => prev.filter((c) => c.id !== id));
      dispatch(actions.showToast("Collection deleted"));
    },
    [fetcher, dispatch]
  );

  // Load collections when session is available
  useEffect(() => {
    if (session?.access_token) {
      loadCollections();
    }
  }, [session?.access_token, loadCollections]);

  // Cleanup abort controllers on unmount
  useEffect(() => {
    return () => {
      loadAbortRef.current?.abort();
      searchAbortRef.current?.abort();
    };
  }, []);

  return {
    loadItems,
    loadItemFullData,
    uploadItem,
    updateItem,
    deleteItem,
    analyzeItem,
    generateBriefing,
    embedItem,
    semanticSearch,
    generateAnnotationCrop,
    // Segmentation
    generateSegments,
    loadSegments,
    updateSegmentLabel,
    deleteSegment,
    labelSegments,
    isSegmenting,
    isLabelingSegments,
    segments,
    // Collections
    collections,
    loadCollections,
    createCollection,
    updateCollection,
    deleteCollection,
    // Stats
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
