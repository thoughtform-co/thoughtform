"use client";

import { useState, useCallback, memo, useEffect, useRef, useMemo } from "react";
import type { SurveyItem, SurveyItemSource, SurveyAnnotation, SurveyCollection } from "./types";
import { NestedSelect } from "./NestedSelect";
import { SurveyUploadModal } from "./SurveyUploadModal";
import { ConfirmDialog } from "./ConfirmDialog";
import { formatBriefingText } from "./utils/formatBriefingText";
import { FlowConnector } from "./FlowConnector";
import type { PipelineStatus, UpdateItemOptions } from "../_hooks/useSurvey";
import { ChamferedFrame } from "@thoughtform/ui";

// ═══════════════════════════════════════════════════════════════
// SURVEY INSPECTOR PANEL - Edit metadata & AI analysis
// ═══════════════════════════════════════════════════════════════

const AUTOSAVE_DEBOUNCE_MS = 650;

export interface SurveyInspectorPanelProps {
  item: SurveyItem | null;
  onUpdate: (updates: Partial<SurveyItem>, options?: UpdateItemOptions) => Promise<void>;
  onDelete: () => Promise<void>;
  onAnalyze: () => Promise<void>;
  onGenerateBriefing?: () => Promise<void>;
  onEmbed: () => Promise<void>;
  onUpload?: (file: File, categoryId: string | null, componentKey: string | null) => Promise<void>;
  selectedCategoryId?: string | null;
  selectedComponentKey?: string | null;
  selectedAnnotationId?: string | null;
  onAnnotationSelect?: (annotationId: string | null) => void;
  isAnalyzing?: boolean;
  isEmbedding?: boolean;
  isBriefing?: boolean;
  isSaving?: boolean;
  isResizing?: boolean;
  isUploading?: boolean;
  pipelineStatus?: PipelineStatus;
  // Segmentation
  onSegmentAndLabel?: () => void; // Combined action: segment then auto-label
  onReSegment?: () => void; // Manual re-segment only
  onToggleSegments?: () => void;
  onReLabelSegments?: () => void; // Manual re-label only
  isSegmenting?: boolean;
  isLabelingSegments?: boolean;
  showSegments?: boolean;
  segmentCount?: number;
  // For tag autocomplete
  allItems?: SurveyItem[];
  // Collections
  collections?: SurveyCollection[];
  onCreateCollection?: (name: string) => Promise<SurveyCollection>;
}

type InspectorTab = "fields" | "chat";

function SurveyInspectorPanelInner({
  item,
  onUpdate,
  onDelete,
  onAnalyze,
  onGenerateBriefing,
  onEmbed,
  isAnalyzing = false,
  isEmbedding = false,
  isBriefing = false,
  isSaving = false,
  isResizing = false,
  onUpload,
  selectedCategoryId = null,
  selectedComponentKey = null,
  selectedAnnotationId = null,
  onAnnotationSelect,
  isUploading = false,
  pipelineStatus = "idle",
  onSegmentAndLabel,
  onReSegment,
  onToggleSegments,
  onReLabelSegments,
  isSegmenting = false,
  isLabelingSegments = false,
  showSegments = false,
  segmentCount = 0,
  allItems = [],
  collections = [],
  onCreateCollection,
}: SurveyInspectorPanelProps) {
  const [activeTab, setActiveTab] = useState<InspectorTab>("fields");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [localItem, setLocalItem] = useState<Partial<SurveyItem> | null>(null);
  const [isSourcesExpanded, setIsSourcesExpanded] = useState(false);
  const [chatMessages, setChatMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [editingAnnotationId, setEditingAnnotationId] = useState<string | null>(null);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [annotationNote, setAnnotationNote] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [newSourceUrl, setNewSourceUrl] = useState("");
  const [collectionInput, setCollectionInput] = useState("");
  const [showCollectionDropdown, setShowCollectionDropdown] = useState(false);
  const [editingSourceIndex, setEditingSourceIndex] = useState<number | null>(null);
  const [editingSourceUrl, setEditingSourceUrl] = useState("");
  const tagInputRef = useRef<HTMLInputElement>(null);
  const sourceInputRef = useRef<HTMLInputElement>(null);
  const collectionDropdownRef = useRef<HTMLDivElement>(null);
  const autosaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track previously seen annotations to detect new ones
  const prevAnnotationIdsRef = useRef<Set<string>>(new Set());
  const prevItemIdRef = useRef<string | null>(null);

  // Derived view of the item that includes local (unsaved) edits
  const effectiveItem = localItem !== null ? { ...item, ...localItem } : item;

  // Auto-open new annotation notes
  useEffect(() => {
    // Reset annotation tracking when item changes
    if (item?.id !== prevItemIdRef.current) {
      prevAnnotationIdsRef.current = new Set();
      prevItemIdRef.current = item?.id || null;
    }

    if (!item?.annotations) return;

    const currentIds = new Set(item.annotations.map((a) => a.id));
    const prevIds = prevAnnotationIdsRef.current;

    // Find newly added annotations
    const newAnnotations = item.annotations.filter((a) => !prevIds.has(a.id));

    if (newAnnotations.length > 0) {
      // Auto-open the newest annotation for editing
      const newest = newAnnotations[newAnnotations.length - 1];
      setEditingAnnotationId(newest.id);
      setAnnotationNote(newest.note || "");
    }

    prevAnnotationIdsRef.current = currentIds;
  }, [item?.id, item?.annotations]);

  // Reset local state when switching to a different item
  useEffect(() => {
    setLocalItem(null);
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
      autosaveTimeoutRef.current = null;
    }
  }, [item?.id]);

  // Sync annotation editing when canvas selection changes
  useEffect(() => {
    if (selectedAnnotationId) {
      const annotation = item?.annotations?.find((a) => a.id === selectedAnnotationId);
      if (annotation) {
        setEditingAnnotationId(selectedAnnotationId);
        setAnnotationNote(annotation.note || "");
      }
    }
  }, [selectedAnnotationId, item?.annotations]);

  // Handle field changes locally
  const handleFieldChange = useCallback((field: keyof SurveyItem, value: unknown) => {
    setLocalItem((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  // Autosave: debounced save for ANY inspector edits (Save button stays as fallback)
  useEffect(() => {
    if (!localItem || !item || isSaving) return;

    // Clear existing timeout
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }

    const snapshot = localItem;
    const snapshotKeys = Object.keys(snapshot) as Array<keyof SurveyItem>;
    if (snapshotKeys.length === 0) return;

    // Set new timeout for autosave (short delay after last change)
    autosaveTimeoutRef.current = setTimeout(async () => {
      try {
        await onUpdate({ id: item.id, ...snapshot }, { silent: true });
        // Only clear the fields that were saved AND haven't changed since the save was scheduled
        setLocalItem((prev) => {
          if (!prev) return null;
          const next: Partial<SurveyItem> = { ...prev };
          for (const key of snapshotKeys) {
            if (
              key in next &&
              (next as Record<string, unknown>)[key as string] ===
                (snapshot as Record<string, unknown>)[key as string]
            ) {
              delete (next as Record<string, unknown>)[key as string];
            }
          }
          return Object.keys(next).length > 0 ? next : null;
        });
      } catch (error) {
        console.error("Autosave failed:", error);
        // Keep localItem so user can retry with manual save
      }
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [localItem, item, onUpdate, isSaving]);

  // Save changes
  const handleSave = useCallback(async () => {
    if (!localItem || !item) return;
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
      autosaveTimeoutRef.current = null;
    }
    try {
      await onUpdate({ ...localItem, id: item.id });
      setLocalItem(null);
    } catch (error) {
      // Keep localItem so user can retry
      console.error("Manual save failed:", error);
    }
  }, [localItem, item, onUpdate]);

  // Reset local changes
  const handleReset = useCallback(() => {
    setLocalItem(null);
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
      autosaveTimeoutRef.current = null;
    }
  }, []);

  // Handle delete - show styled confirmation dialog
  const handleDeleteClick = useCallback(() => {
    setIsDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    setIsDeleteDialogOpen(false);
    await onDelete();
  }, [onDelete]);

  const handleDeleteCancel = useCallback(() => {
    setIsDeleteDialogOpen(false);
  }, []);

  // Extract domain name from URL (e.g., "https://www.behance.net/gallery/..." → "BEHANCE")
  const extractDomainLabel = useCallback((url: string): string => {
    try {
      const hostname = new URL(url).hostname;
      // Remove common prefixes like www., m., etc.
      const cleanHost = hostname.replace(/^(www\.|m\.|mobile\.)/i, "");
      // Get the main domain part (e.g., "behance" from "behance.net")
      const parts = cleanHost.split(".");
      // Return the main part in uppercase
      return parts[0].toUpperCase();
    } catch {
      // If URL parsing fails, just return a cleaned version
      return url
        .replace(/^https?:\/\/(www\.)?/i, "")
        .split("/")[0]
        .toUpperCase();
    }
  }, []);

  // Handle adding a new source via URL input
  const handleAddSourceFromUrl = useCallback(
    (url: string) => {
      const trimmedUrl = url.trim();
      if (!trimmedUrl) return;

      // Auto-add protocol if missing
      let normalizedUrl = trimmedUrl;
      if (!/^https?:\/\//i.test(trimmedUrl)) {
        normalizedUrl = `https://${trimmedUrl}`;
      }

      const label = extractDomainLabel(normalizedUrl);
      const sources = [...(effectiveItem?.sources || []), { label, url: normalizedUrl, note: "" }];
      handleFieldChange("sources", sources);
      setNewSourceUrl("");
    },
    [effectiveItem?.sources, handleFieldChange, extractDomainLabel]
  );

  // Handle source URL input keydown
  const handleSourceInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAddSourceFromUrl(newSourceUrl);
      }
    },
    [handleAddSourceFromUrl, newSourceUrl]
  );

  // Handle editing an existing source
  const handleStartEditSource = useCallback((index: number, currentUrl: string) => {
    setEditingSourceIndex(index);
    setEditingSourceUrl(currentUrl);
  }, []);

  // Handle saving edited source
  const handleSaveEditSource = useCallback(() => {
    if (editingSourceIndex === null) return;

    const trimmedUrl = editingSourceUrl.trim();
    if (!trimmedUrl) {
      // If empty, remove the source
      const sources = (effectiveItem?.sources || []).filter((_, i) => i !== editingSourceIndex);
      handleFieldChange("sources", sources);
    } else {
      // Auto-add protocol if missing
      let normalizedUrl = trimmedUrl;
      if (!/^https?:\/\//i.test(trimmedUrl)) {
        normalizedUrl = `https://${trimmedUrl}`;
      }

      const label = extractDomainLabel(normalizedUrl);
      const sources = [...(effectiveItem?.sources || [])];
      sources[editingSourceIndex] = { ...sources[editingSourceIndex], label, url: normalizedUrl };
      handleFieldChange("sources", sources);
    }

    setEditingSourceIndex(null);
    setEditingSourceUrl("");
  }, [
    editingSourceIndex,
    editingSourceUrl,
    effectiveItem?.sources,
    handleFieldChange,
    extractDomainLabel,
  ]);

  // Handle edit source keydown
  const handleEditSourceKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSaveEditSource();
      } else if (e.key === "Escape") {
        setEditingSourceIndex(null);
        setEditingSourceUrl("");
      }
    },
    [handleSaveEditSource]
  );

  const handleRemoveSource = useCallback(
    (index: number) => {
      const sources = (effectiveItem?.sources || []).filter((_, i) => i !== index);
      handleFieldChange("sources", sources);
    },
    [effectiveItem?.sources, handleFieldChange]
  );

  // Extract all unique tags from all items for autocomplete
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    allItems.forEach((item) => {
      if (item.tags && Array.isArray(item.tags)) {
        item.tags.forEach((tag) => tagSet.add(tag.toLowerCase()));
      }
    });
    return Array.from(tagSet).sort();
  }, [allItems]);

  // Inline tag suggestion (ghost completion) based on existing tags
  const inlineTagSuggestion = useMemo(() => {
    const query = tagInput.toLowerCase();
    if (!query || query.trim() === "") return null;
    const currentTags = effectiveItem?.tags || [];
    return (
      allTags.find((tag) => tag.startsWith(query) && !currentTags.includes(tag) && tag !== query) ||
      null
    );
  }, [tagInput, allTags, effectiveItem?.tags]);

  const inlineTagRemainder = useMemo(() => {
    if (!inlineTagSuggestion) return "";
    const query = tagInput.toLowerCase();
    if (!query) return "";
    if (!inlineTagSuggestion.startsWith(query)) return "";
    return inlineTagSuggestion.slice(query.length);
  }, [inlineTagSuggestion, tagInput]);

  // Handle tags - chip-based input
  const handleAddTag = useCallback(
    (tag: string) => {
      const trimmedTag = tag.trim().toLowerCase();
      if (!trimmedTag) return;

      const currentTags = effectiveItem?.tags || [];
      if (currentTags.includes(trimmedTag)) return; // Prevent duplicates

      handleFieldChange("tags", [...currentTags, trimmedTag]);
      setTagInput("");
    },
    [effectiveItem?.tags, handleFieldChange]
  );

  const handleRemoveTag = useCallback(
    (tagToRemove: string) => {
      const tags = (effectiveItem?.tags || []).filter((t) => t !== tagToRemove);
      handleFieldChange("tags", tags);
    },
    [effectiveItem?.tags, handleFieldChange]
  );

  const handleTagInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Accept ghost completion with Tab / ArrowRight (when caret is at end)
      if (
        inlineTagSuggestion &&
        (e.key === "Tab" ||
          (e.key === "ArrowRight" &&
            (e.currentTarget.selectionStart ?? 0) === tagInput.length &&
            (e.currentTarget.selectionEnd ?? 0) === tagInput.length))
      ) {
        e.preventDefault();
        setTagInput(inlineTagSuggestion);
        requestAnimationFrame(() => {
          const el = tagInputRef.current;
          if (el) el.setSelectionRange(inlineTagSuggestion.length, inlineTagSuggestion.length);
        });
        return;
      }

      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        const toAdd =
          inlineTagSuggestion && inlineTagSuggestion.startsWith(tagInput.toLowerCase())
            ? inlineTagSuggestion
            : tagInput;
        handleAddTag(toAdd);
      } else if (e.key === "Backspace" && !tagInput && (effectiveItem?.tags?.length || 0) > 0) {
        // Remove last tag on backspace when input is empty
        const tags = effectiveItem?.tags || [];
        handleRemoveTag(tags[tags.length - 1]);
      }
    },
    [tagInput, effectiveItem?.tags, handleAddTag, handleRemoveTag, inlineTagSuggestion]
  );

  const handleTagInputBlur = useCallback(() => {
    // Delay to allow click events on nearby controls to fire first
    setTimeout(() => {
      if (tagInput.trim()) {
        const toAdd =
          inlineTagSuggestion && inlineTagSuggestion.startsWith(tagInput.toLowerCase())
            ? inlineTagSuggestion
            : tagInput;
        handleAddTag(toAdd);
      }
    }, 200);
  }, [tagInput, inlineTagSuggestion, handleAddTag]);

  // Handle collection selection
  const handleSelectCollection = useCallback(
    async (collectionId: string | null) => {
      if (!item) return;

      // Update local state immediately for UI responsiveness
      setLocalItem((prev) => ({
        ...(prev || {}),
        collection_id: collectionId,
      }));
      setShowCollectionDropdown(false);
      setCollectionInput("");

      // Save immediately (collection selection is a deliberate action)
      try {
        await onUpdate({ id: item.id, collection_id: collectionId });
        // Clear collection_id from localItem since it's been saved
        setLocalItem((prev) => {
          if (!prev) return null;
          const next = { ...prev };
          if (next.collection_id === collectionId) {
            delete next.collection_id;
          }
          return Object.keys(next).length > 0 ? next : null;
        });
      } catch (error) {
        console.error("Failed to save collection:", error);
      }
    },
    [item, onUpdate]
  );

  const handleCreateCollection = useCallback(async () => {
    if (!collectionInput.trim() || !onCreateCollection) return;

    try {
      const newCollection = await onCreateCollection(collectionInput.trim());
      // Use handleSelectCollection to save immediately
      await handleSelectCollection(newCollection.id);
    } catch (error) {
      console.error("Failed to create collection:", error);
    }
  }, [collectionInput, onCreateCollection, handleSelectCollection]);

  // Filter collections based on input
  const filteredCollections = useMemo(() => {
    if (!collectionInput.trim()) return collections;
    const search = collectionInput.toLowerCase();
    return collections.filter((c) => c.name.toLowerCase().includes(search));
  }, [collections, collectionInput]);

  // Get current collection
  const currentCollection = useMemo(() => {
    if (!effectiveItem?.collection_id) return null;
    return collections.find((c) => c.id === effectiveItem.collection_id) || null;
  }, [effectiveItem?.collection_id, collections]);

  // Close collection dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        collectionDropdownRef.current &&
        !collectionDropdownRef.current.contains(e.target as Node)
      ) {
        setShowCollectionDropdown(false);
      }
    };

    if (showCollectionDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showCollectionDropdown]);

  // Handle annotation editing
  const handleEditAnnotation = useCallback((annotation: SurveyAnnotation) => {
    setEditingAnnotationId(annotation.id);
    setAnnotationNote(annotation.note);
  }, []);

  const handleSaveAnnotationNote = useCallback(async () => {
    if (!editingAnnotationId || !item) return;

    try {
      // If note is empty for a NEW annotation, delete it
      const existingAnnotation = (item.annotations || []).find((a) => a.id === editingAnnotationId);
      if (!annotationNote.trim() && existingAnnotation && !existingAnnotation.note) {
        // Delete the annotation
        const annotations = (effectiveItem?.annotations || []).filter(
          (a) => a.id !== editingAnnotationId
        );
        handleFieldChange("annotations", annotations);
        // Immediately persist
        await onUpdate({ id: item.id, annotations });
        // Clear saved change from localItem (prevents redundant autosave)
        setLocalItem((prev) => {
          if (!prev) return null;
          const next = { ...prev };
          if (next.annotations === annotations) {
            delete next.annotations;
          }
          return Object.keys(next).length > 0 ? next : null;
        });
      } else {
        // Update the note
        const annotations = (effectiveItem?.annotations || []).map((a) =>
          a.id === editingAnnotationId ? { ...a, note: annotationNote } : a
        );
        handleFieldChange("annotations", annotations);
        // Immediately persist annotation changes
        await onUpdate({ id: item.id, annotations });
        // Clear saved change from localItem (prevents redundant autosave)
        setLocalItem((prev) => {
          if (!prev) return null;
          const next = { ...prev };
          if (next.annotations === annotations) {
            delete next.annotations;
          }
          return Object.keys(next).length > 0 ? next : null;
        });
      }

      setEditingAnnotationId(null);
      setAnnotationNote("");
      onAnnotationSelect?.(null); // Clear canvas selection
    } catch (error) {
      console.error("Failed to save annotation:", error);
      // Keep edit state so user can retry
    }
  }, [
    editingAnnotationId,
    annotationNote,
    effectiveItem?.annotations,
    handleFieldChange,
    item,
    onUpdate,
    onAnnotationSelect,
  ]);

  const handleDeleteAnnotation = useCallback(
    (annotationId: string) => {
      const annotations = (effectiveItem?.annotations || []).filter((a) => a.id !== annotationId);
      handleFieldChange("annotations", annotations);
    },
    [effectiveItem?.annotations, handleFieldChange]
  );

  // Handle chat submit
  const handleChatSubmit = useCallback(async () => {
    if (!chatInput.trim() || !item) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsChatLoading(true);

    try {
      const res = await fetch("/api/survey/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: item.id,
          message: userMessage,
          history: chatMessages,
        }),
      });

      if (!res.ok) throw new Error("Chat request failed");

      const data = await res.json();
      setChatMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
    } catch (error) {
      console.error("Chat error:", error);
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I encountered an error. Please try again." },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  }, [chatInput, item, chatMessages]);

  const hasChanges = localItem !== null;
  const annotationCount = effectiveItem?.annotations?.length || 0;

  if (!item) {
    return (
      <aside className="astrogation-panel astrogation-panel--right astrogation-panel--survey">
        <div className="panel-header-wrapper">
          <div className="panel-header panel-header--survey">
            <span className="panel-header__title">INSPECTOR</span>
          </div>
        </div>
        <div className="panel-content panel-content--empty">
          <ChamferedFrame
            shape="inspectorTicket"
            className="inspector-frame inspector-frame--empty"
          >
            <div className="spec-empty-state">
              <div className="spec-empty-state__visual">
                <svg viewBox="0 0 80 80" className="spec-empty-state__icon">
                  <polygon
                    points="40,8 72,40 40,72 8,40"
                    fill="none"
                    stroke="var(--dawn-15)"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                  <polygon
                    points="40,20 60,40 40,60 20,40"
                    fill="none"
                    stroke="var(--dawn-08)"
                    strokeWidth="1"
                  />
                  <circle cx="40" cy="40" r="4" fill="var(--dawn-08)" />
                </svg>
              </div>
              <p className="spec-empty-state__text">Select a reference</p>
              <span className="spec-empty-state__hint">to view and edit details</span>
            </div>
          </ChamferedFrame>
        </div>

        {/* Upload Modal */}
        {onUpload && (
          <SurveyUploadModal
            isOpen={isUploadModalOpen}
            onClose={() => setIsUploadModalOpen(false)}
            onUpload={async (file, categoryId, componentKey) => {
              await onUpload(file, categoryId, componentKey);
              setIsUploadModalOpen(false);
            }}
            selectedCategoryId={selectedCategoryId}
            selectedComponentKey={selectedComponentKey}
            isUploading={isUploading}
          />
        )}
      </aside>
    );
  }

  return (
    <aside
      className={`astrogation-panel astrogation-panel--right astrogation-panel--survey ${isEmbedding ? "astrogation-panel--embedding" : ""}`}
    >
      <div className="panel-header-wrapper">
        <div className="panel-header panel-header--survey">
          <span className="panel-header__title">INSPECTOR</span>
        </div>
      </div>

      <div className="panel-content">
        {/* Survey Panel Frame with notched corner */}
        <ChamferedFrame
          shape="inspectorTicket"
          className="inspector-frame"
          titleSlot={
            <input
              type="text"
              className="inspector-frame__title-input"
              value={effectiveItem?.title || ""}
              disabled={isResizing}
              onClick={(e) => e.currentTarget.focus()}
              onChange={(e) => handleFieldChange("title", e.target.value)}
              placeholder="UNTITLED"
            />
          }
          toolbarSlot={
            <>
              <button
                className="inspector-toolbar__btn inspector-toolbar__btn--save"
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
                title="Save changes"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M10 2H8V0H2V2H0V12H10V2Z"
                    stroke="currentColor"
                    strokeWidth="1"
                    fill="none"
                  />
                  <path
                    d="M3 6H9M3 9H9"
                    stroke="currentColor"
                    strokeWidth="1"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              <button
                className="inspector-toolbar__btn inspector-toolbar__btn--delete"
                onClick={handleDeleteClick}
                title="Delete reference"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2 3H10M4.5 3V2C4.5 1.4 5 1 5.5 1H6.5C7 1 7.5 1.4 7.5 2V3M4.5 5.5V9.5M7.5 5.5V9.5M3 3L3.5 10C3.5 10.5 4 11 4.5 11H7.5C8 11 8.5 10.5 8.5 10L9 3"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              <button
                className="inspector-toolbar__btn inspector-toolbar__btn--reset"
                onClick={handleReset}
                disabled={!hasChanges}
                title="Reset changes"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2 5C2 3.5 3 2 4.5 2C5.5 2 6 2.5 6.5 3M10 7C10 8.5 9 10 7.5 10C6.5 10 6 9.5 5.5 9"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeLinecap="round"
                  />
                  <path
                    d="M2 2L4 4L2 6M10 10L8 8L10 6"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </>
          }
        >
          <div className="spec-panel-v2">
            {/* ═══ SECTION 1: Sources ═══ */}
            <section className="spec-section">
              <div className="spec-sources-toggle">
                <button
                  className="spec-sources-toggle__btn"
                  onClick={() => setIsSourcesExpanded(!isSourcesExpanded)}
                  type="button"
                >
                  <span
                    className={`spec-sources-toggle__triangle ${isSourcesExpanded ? "spec-sources-toggle__triangle--expanded" : ""}`}
                  >
                    ▶
                  </span>
                  <span className="spec-sources-toggle__label">Sources</span>
                  {(effectiveItem?.sources || []).length > 0 && (
                    <span className="spec-sources-toggle__count">
                      ({(effectiveItem?.sources || []).length})
                    </span>
                  )}
                </button>
                {isSourcesExpanded && (
                  <div className="spec-sources spec-sources--compact">
                    {/* Existing sources as link chips */}
                    <div className="spec-source-chips">
                      {(effectiveItem?.sources || []).map((source, i) => (
                        <div key={i} className="spec-source-chip">
                          {editingSourceIndex === i ? (
                            <input
                              type="url"
                              className="spec-source-chip__edit-input"
                              value={editingSourceUrl}
                              onChange={(e) => setEditingSourceUrl(e.target.value)}
                              onKeyDown={handleEditSourceKeyDown}
                              onBlur={handleSaveEditSource}
                              autoFocus
                              placeholder="Enter URL..."
                            />
                          ) : (
                            <>
                              <a
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="spec-source-chip__link"
                                title={source.url}
                              >
                                {source.label || extractDomainLabel(source.url || "")}
                              </a>
                              <div className="spec-source-chip__actions">
                                <button
                                  className="spec-source-chip__btn spec-source-chip__btn--edit"
                                  onClick={() => handleStartEditSource(i, source.url || "")}
                                  title="Edit source"
                                >
                                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                                    <path
                                      d="M8.5 1.5L10.5 3.5M1 11L1.5 8.5L9 1L11 3L3.5 10.5L1 11Z"
                                      stroke="currentColor"
                                      strokeWidth="1"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                </button>
                                <button
                                  className="spec-source-chip__btn spec-source-chip__btn--delete"
                                  onClick={() => handleRemoveSource(i)}
                                  title="Remove source"
                                >
                                  ×
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                    {/* Add new source input */}
                    <input
                      ref={sourceInputRef}
                      type="url"
                      className="spec-source-add-input"
                      value={newSourceUrl}
                      onChange={(e) => setNewSourceUrl(e.target.value)}
                      onKeyDown={handleSourceInputKeyDown}
                      placeholder="Paste URL and press Enter..."
                    />
                  </div>
                )}
              </div>
            </section>

            {/* ═══ SECTION 2: Component Classification (Nested) ═══ */}
            <section className="spec-section spec-section--overflow-visible">
              <div className="spec-section__label">
                <span className="spec-section__label-text">Component Class</span>
                <span className="spec-section__label-line" />
              </div>
              <NestedSelect
                categoryId={effectiveItem?.category_id || null}
                componentKey={effectiveItem?.component_key || null}
                onChange={(catId, compKey) => {
                  handleFieldChange("category_id", catId);
                  handleFieldChange("component_key", compKey);
                }}
                placeholder="Assign to brand system..."
                className="spec-select--compact"
              />
            </section>

            {/* ═══ SECTION 3: Classification (Tags + Collection) ═══ */}
            <section className="spec-section" style={{ position: "relative" }}>
              <div className="spec-section__label">
                <span className="spec-section__label-text">Classification</span>
                <span className="spec-section__label-line" />
              </div>

              {/* Tags subsection */}
              <div className="spec-subsection">
                <div className="spec-subsection__label">Tags</div>
                <div className="spec-tags-input" onClick={() => tagInputRef.current?.focus()}>
                  {(effectiveItem?.tags || []).map((tag) => (
                    <span key={tag} className="spec-tag-chip">
                      {tag}
                      <button
                        type="button"
                        className="spec-tag-chip__remove"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveTag(tag);
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <div className="spec-tags-input__input-wrap">
                    {inlineTagRemainder && tagInput && (
                      <div className="spec-tags-input__ghost" aria-hidden="true">
                        <span className="spec-tags-input__ghost-typed">{tagInput}</span>
                        <span className="spec-tags-input__ghost-suggestion">
                          {inlineTagRemainder}
                        </span>
                      </div>
                    )}
                    <input
                      ref={tagInputRef}
                      type="text"
                      className="spec-tags-input__field"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagInputKeyDown}
                      onBlur={handleTagInputBlur}
                      placeholder={(effectiveItem?.tags?.length || 0) === 0 ? "Add tags..." : ""}
                    />
                  </div>
                </div>
                {/* Suggested tags from AI - clickable to add */}
                {effectiveItem?.analysis?.tags && effectiveItem.analysis.tags.length > 0 && (
                  <div className="spec-suggested-tags">
                    <span className="spec-suggested-tags__label">Suggested:</span>
                    {effectiveItem.analysis.tags
                      .filter((tag) => !(effectiveItem?.tags || []).includes(tag.toLowerCase()))
                      .map((tag, i) => (
                        <button
                          key={i}
                          type="button"
                          className="spec-suggested-tags__tag"
                          onClick={() => handleAddTag(tag)}
                          title="Click to add"
                        >
                          + {tag}
                        </button>
                      ))}
                  </div>
                )}
              </div>

              {/* Collection subsection */}
              <div className="spec-subsection">
                <div className="spec-subsection__label">Collection</div>
                <div
                  ref={collectionDropdownRef}
                  className="spec-collection-select"
                  style={{ position: "relative" }}
                >
                  {currentCollection ? (
                    <div className="spec-collection-selected">
                      <span className="spec-collection-selected__name">
                        {currentCollection.name}
                      </span>
                      <button
                        type="button"
                        className="spec-collection-selected__clear"
                        onClick={() => handleSelectCollection(null)}
                        title="Remove from collection"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="spec-collection-trigger"
                      onClick={() => setShowCollectionDropdown(!showCollectionDropdown)}
                    >
                      <span className="spec-collection-trigger__text">
                        {collections.length > 0 ? "Select collection..." : "Create collection..."}
                      </span>
                      <span className="spec-collection-trigger__icon">▼</span>
                    </button>
                  )}

                  {showCollectionDropdown && (
                    <div className="spec-collection-dropdown">
                      <div className="spec-collection-dropdown__input">
                        <input
                          type="text"
                          value={collectionInput}
                          onChange={(e) => setCollectionInput(e.target.value)}
                          placeholder="Search or create..."
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && collectionInput.trim()) {
                              // If there's no matching collection, create one
                              const exactMatch = collections.find(
                                (c) => c.name.toLowerCase() === collectionInput.toLowerCase()
                              );
                              if (exactMatch) {
                                handleSelectCollection(exactMatch.id);
                              } else {
                                handleCreateCollection();
                              }
                            }
                          }}
                          autoFocus
                        />
                      </div>
                      <div className="spec-collection-dropdown__list">
                        {filteredCollections.map((collection) => (
                          <button
                            key={collection.id}
                            type="button"
                            className="spec-collection-dropdown__item"
                            onClick={() => handleSelectCollection(collection.id)}
                          >
                            {collection.name}
                          </button>
                        ))}
                        {collectionInput.trim() &&
                          !collections.some(
                            (c) => c.name.toLowerCase() === collectionInput.toLowerCase()
                          ) && (
                            <button
                              type="button"
                              className="spec-collection-dropdown__item spec-collection-dropdown__item--create"
                              onClick={handleCreateCollection}
                            >
                              + Create &ldquo;{collectionInput.trim()}&rdquo;
                            </button>
                          )}
                        {filteredCollections.length === 0 && !collectionInput.trim() && (
                          <div className="spec-collection-dropdown__empty">
                            Type to create a collection
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* ═══ SECTION 4: Briefing Flow ═══ */}
            <section className="spec-section">
              <div className="spec-section__label">
                <span className="spec-section__label-text">Briefing</span>
                <span className="spec-section__label-line" />
              </div>

              <FlowConnector>
                {/* Analysis (AI) */}
                <FlowConnector.Node
                  label="Analysis"
                  badge="AI"
                  action={
                    <button onClick={onAnalyze} disabled={isAnalyzing}>
                      {effectiveItem?.analysis ? "Re-analyze" : "Analyze"}
                    </button>
                  }
                >
                  {isAnalyzing || pipelineStatus === "analyzing" ? (
                    <div className="flow-connector__loading flow-connector__loading--gold">
                      <span className="flow-connector__loading-icon">◇</span>
                      Analyzing image...
                    </div>
                  ) : effectiveItem?.analysis?.transferNotes ? (
                    <p className="flow-connector__text">{effectiveItem.analysis.transferNotes}</p>
                  ) : effectiveItem?.analysis ? (
                    <div className="flow-connector__empty">
                      <span>No transfer notes</span>
                    </div>
                  ) : (
                    <div className="flow-connector__empty">
                      <span>Click Analyze to begin</span>
                    </div>
                  )}
                </FlowConnector.Node>

                {/* Segmentation (AI) - segment + label combined */}
                <FlowConnector.Node
                  label="Segmentation"
                  badge="AI"
                  action={
                    segmentCount > 0 ? (
                      <div className="flow-connector__action-group">
                        <button
                          onClick={onReSegment}
                          disabled={isSegmenting || isLabelingSegments}
                          title="Re-run segmentation"
                        >
                          Re-segment
                        </button>
                        <button
                          onClick={onReLabelSegments}
                          disabled={isSegmenting || isLabelingSegments}
                          title="Re-label segments"
                        >
                          Re-label
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={onSegmentAndLabel}
                        disabled={isSegmenting || isLabelingSegments || !effectiveItem?.analysis}
                        title={!effectiveItem?.analysis ? "Run analysis first" : undefined}
                      >
                        Segment
                      </button>
                    )
                  }
                >
                  {isSegmenting || isLabelingSegments ? (
                    <div className="flow-connector__loading">
                      <span className="flow-connector__loading-icon">◇</span>
                      {isSegmenting ? "Segmenting..." : "Labeling..."}
                    </div>
                  ) : segmentCount > 0 ? (
                    <p className="flow-connector__text">
                      {segmentCount} UI element{segmentCount !== 1 ? "s" : ""} detected
                    </p>
                  ) : (
                    <div className="flow-connector__empty">
                      <span>Click Segment to detect UI elements</span>
                    </div>
                  )}
                </FlowConnector.Node>

                {/* Notes (User) */}
                <FlowConnector.Node label="Notes">
                  {isEditingNotes ? (
                    <textarea
                      className="flow-connector__textarea"
                      value={effectiveItem?.notes || ""}
                      onChange={(e) => handleFieldChange("notes", e.target.value)}
                      onBlur={() => setIsEditingNotes(false)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          setIsEditingNotes(false);
                        }
                        if (e.key === "Escape") {
                          setIsEditingNotes(false);
                        }
                      }}
                      placeholder="Your observations..."
                      rows={2}
                      autoFocus
                    />
                  ) : (
                    <p
                      className={`flow-connector__text flow-connector__text--selectable ${!effectiveItem?.notes ? "flow-connector__text--placeholder" : ""}`}
                      onClick={() => setIsEditingNotes(true)}
                    >
                      {effectiveItem?.notes || "Add note..."}
                    </p>
                  )}
                </FlowConnector.Node>

                {/* Annotations */}
                <FlowConnector.Node
                  label={`Annotations${annotationCount > 0 ? ` (${annotationCount})` : ""}`}
                  className="flow-connector__node--no-line"
                >
                  {annotationCount === 0 ? (
                    <div className="flow-connector__empty">
                      <span>Draw on the image to add</span>
                    </div>
                  ) : (
                    <div className="spec-annotations-list spec-annotations-list--compact">
                      {(effectiveItem?.annotations || []).map((annotation, index) => (
                        <div
                          key={annotation.id}
                          data-annotation-id={annotation.id}
                          className="spec-annotation spec-annotation--compact"
                          onClick={() => onAnnotationSelect?.(annotation.id)}
                        >
                          {/* Header row: index + actions */}
                          <div className="spec-annotation__header">
                            <span className="spec-annotation__index">#{index + 1}</span>
                            {/* Action icons - visible on hover */}
                            <div className="spec-annotation__actions">
                              <button
                                className="spec-annotation__action-icon spec-annotation__action-icon--save"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSaveAnnotationNote();
                                }}
                                title="Save"
                              >
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                  <path
                                    d="M10 2.5L4.5 8L2 5.5"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </button>
                              <button
                                className="spec-annotation__action-icon spec-annotation__action-icon--delete"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteAnnotation(annotation.id);
                                }}
                                title="Delete annotation"
                              >
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                  <path
                                    d="M2 3H10M4 3V2C4 1.5 4.5 1 5 1H7C7.5 1 8 1.5 8 2V3M4.5 5V9M7.5 5V9M3 3L3.5 10C3.5 10.5 4 11 4.5 11H7.5C8 11 8.5 10.5 8.5 10L9 3"
                                    stroke="currentColor"
                                    strokeWidth="1"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </button>
                              {/* Crop thumbnail (shows when crop exists) */}
                              {annotation.crop_path && (
                                <button
                                  className="spec-annotation__action-icon spec-annotation__action-icon--crop"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (annotation.crop_url) {
                                      window.open(annotation.crop_url, "_blank");
                                    }
                                  }}
                                  title="View annotation crop"
                                >
                                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                    <rect
                                      x="1"
                                      y="1"
                                      width="10"
                                      height="10"
                                      rx="1"
                                      stroke="currentColor"
                                      strokeWidth="1"
                                    />
                                    <path
                                      d="M3 5L5 7L9 3"
                                      stroke="currentColor"
                                      strokeWidth="1"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                          {/* Note content - reuse flow-connector__text styling for view mode */}
                          {editingAnnotationId === annotation.id ? (
                            <textarea
                              className="flow-connector__textarea"
                              value={annotationNote}
                              onChange={(e) => setAnnotationNote(e.target.value)}
                              placeholder="Add note..."
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSaveAnnotationNote();
                                }
                                if (e.key === "Escape") {
                                  setEditingAnnotationId(null);
                                  setAnnotationNote("");
                                }
                              }}
                              rows={2}
                            />
                          ) : (
                            <p
                              className={`flow-connector__text flow-connector__text--selectable spec-annotation__note-view ${selectedAnnotationId === annotation.id ? "flow-connector__text--selected" : ""} ${!annotation.note ? "flow-connector__text--placeholder" : ""}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditAnnotation(annotation);
                              }}
                            >
                              {annotation.note || "Click to add note..."}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </FlowConnector.Node>

                {/* Briefing Output - Always visible */}
                <FlowConnector.Node
                  label="Briefing"
                  badge="AI"
                  className="flow-connector__node--briefing"
                  action={
                    onGenerateBriefing ? (
                      <button
                        onClick={onGenerateBriefing}
                        disabled={isBriefing || !effectiveItem?.analysis}
                        title={!effectiveItem?.analysis ? "Run analysis first" : undefined}
                      >
                        {effectiveItem?.briefing ? "Re-generate" : "Generate"}
                      </button>
                    ) : null
                  }
                >
                  {isBriefing || pipelineStatus === "briefing" ? (
                    <div className="flow-connector__loading flow-connector__loading--gold">
                      <span className="flow-connector__loading-icon">◇</span>
                      Generating briefing...
                    </div>
                  ) : effectiveItem?.briefing ? (
                    <div className="flow-connector__briefing">
                      {formatBriefingText(effectiveItem?.briefing)}
                    </div>
                  ) : (
                    <div className="flow-connector__empty">
                      <span>Click Generate to create briefing</span>
                    </div>
                  )}
                </FlowConnector.Node>
              </FlowConnector>
            </section>
          </div>
        </ChamferedFrame>

        {/* Sticky Embed Footer - Industrial "JUMP" style button */}
        <div className="inspector-footer">
          <button
            className={`inspector-footer__embed-btn ${effectiveItem?.briefing ? "inspector-footer__embed-btn--ready" : ""}`}
            onClick={() => void onEmbed()}
            disabled={!effectiveItem?.briefing || isEmbedding}
          >
            <span className="inspector-footer__embed-label">
              {isEmbedding ? "EMBEDDING..." : "EMBED"}
            </span>
            <span className="inspector-footer__embed-shortcut">E</span>
          </button>
        </div>
      </div>

      {/* Upload Modal */}
      {onUpload && (
        <SurveyUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onUpload={async (file, categoryId, componentKey) => {
            await onUpload(file, categoryId, componentKey);
            setIsUploadModalOpen(false);
          }}
          selectedCategoryId={selectedCategoryId}
          selectedComponentKey={selectedComponentKey}
          isUploading={isUploading}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title="Delete Reference"
        message="Delete this reference? This cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </aside>
  );
}

export const SurveyInspectorPanel = memo(SurveyInspectorPanelInner);
