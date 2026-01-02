"use client";

import { useState, useCallback, memo, useEffect, useRef } from "react";
import type { SurveyItem, SurveyItemSource, SurveyAnnotation } from "./types";
import { NestedSelect } from "./NestedSelect";
import { SurveyUploadModal } from "./SurveyUploadModal";
import { formatBriefingText } from "./utils/formatBriefingText";
import { FlowConnector } from "./FlowConnector";
import type { PipelineStatus } from "../_hooks/useSurvey";

// ═══════════════════════════════════════════════════════════════
// SURVEY INSPECTOR PANEL - Edit metadata & AI analysis
// ═══════════════════════════════════════════════════════════════

export interface SurveyInspectorPanelProps {
  item: SurveyItem | null;
  onUpdate: (updates: Partial<SurveyItem>) => Promise<void>;
  onDelete: () => Promise<void>;
  onAnalyze: () => Promise<void>;
  onGenerateBriefing?: () => Promise<void>;
  onEmbed: () => Promise<void>;
  onUpload?: (file: File, categoryId: string | null, componentKey: string | null) => Promise<void>;
  selectedCategoryId?: string | null;
  selectedComponentKey?: string | null;
  isAnalyzing?: boolean;
  isEmbedding?: boolean;
  isBriefing?: boolean;
  isSaving?: boolean;
  isResizing?: boolean;
  isUploading?: boolean;
  pipelineStatus?: PipelineStatus;
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
  isUploading = false,
  pipelineStatus = "idle",
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
  const [annotationNote, setAnnotationNote] = useState("");
  const [tagInput, setTagInput] = useState("");
  const tagInputRef = useRef<HTMLInputElement>(null);

  // Track previously seen annotations to detect new ones
  const prevAnnotationIdsRef = useRef<Set<string>>(new Set());
  const prevItemIdRef = useRef<string | null>(null);

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

  // Sync local state when item changes
  const effectiveItem = localItem !== null ? { ...item, ...localItem } : item;

  // Handle field changes locally
  const handleFieldChange = useCallback((field: keyof SurveyItem, value: unknown) => {
    setLocalItem((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  // Save changes
  const handleSave = useCallback(async () => {
    if (!localItem || !item) return;
    await onUpdate({ ...localItem, id: item.id });
    setLocalItem(null);
  }, [localItem, item, onUpdate]);

  // Reset local changes
  const handleReset = useCallback(() => {
    setLocalItem(null);
  }, []);

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (!confirm("Delete this reference? This cannot be undone.")) return;
    await onDelete();
  }, [onDelete]);

  // Handle source changes
  const handleSourceChange = useCallback(
    (index: number, field: keyof SurveyItemSource, value: string) => {
      const sources = [...(effectiveItem?.sources || [])];
      sources[index] = { ...sources[index], [field]: value };
      handleFieldChange("sources", sources);
    },
    [effectiveItem?.sources, handleFieldChange]
  );

  const handleAddSource = useCallback(() => {
    const sources = [...(effectiveItem?.sources || []), { label: "", url: "", note: "" }];
    handleFieldChange("sources", sources);
  }, [effectiveItem?.sources, handleFieldChange]);

  const handleRemoveSource = useCallback(
    (index: number) => {
      const sources = (effectiveItem?.sources || []).filter((_, i) => i !== index);
      handleFieldChange("sources", sources);
    },
    [effectiveItem?.sources, handleFieldChange]
  );

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
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        handleAddTag(tagInput);
      } else if (e.key === "Backspace" && !tagInput && (effectiveItem?.tags?.length || 0) > 0) {
        // Remove last tag on backspace when input is empty
        const tags = effectiveItem?.tags || [];
        handleRemoveTag(tags[tags.length - 1]);
      }
    },
    [tagInput, effectiveItem?.tags, handleAddTag, handleRemoveTag]
  );

  const handleTagInputBlur = useCallback(() => {
    if (tagInput.trim()) {
      handleAddTag(tagInput);
    }
  }, [tagInput, handleAddTag]);

  // Handle annotation editing
  const handleEditAnnotation = useCallback((annotation: SurveyAnnotation) => {
    setEditingAnnotationId(annotation.id);
    setAnnotationNote(annotation.note);
  }, []);

  const handleSaveAnnotationNote = useCallback(async () => {
    if (!editingAnnotationId || !item) return;

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
    } else {
      // Update the note
      const annotations = (effectiveItem?.annotations || []).map((a) =>
        a.id === editingAnnotationId ? { ...a, note: annotationNote } : a
      );
      handleFieldChange("annotations", annotations);
      // Immediately persist annotation changes
      await onUpdate({ id: item.id, annotations });
    }

    setEditingAnnotationId(null);
    setAnnotationNote("");
  }, [
    editingAnnotationId,
    annotationNote,
    effectiveItem?.annotations,
    handleFieldChange,
    item,
    onUpdate,
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
          <div className="inspector-frame inspector-frame--empty">
            {/* SVG border that traces the chamfered polygon (chamfer TOP-RIGHT, empty state) */}
            <div className="inspector-frame__border">
              <svg viewBox="0 0 340 734" preserveAspectRatio="none">
                <polygon points="0,32 188,32 220,0 340,0 340,734 0,734" />
              </svg>
            </div>
            <div className="inspector-frame__content">
              <div className="inspector-frame__scrollable">
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
              </div>
            </div>
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
      </aside>
    );
  }

  return (
    <aside className="astrogation-panel astrogation-panel--right astrogation-panel--survey">
      <div className="panel-header-wrapper">
        <div className="panel-header panel-header--survey">
          <span className="panel-header__title">INSPECTOR</span>
        </div>
      </div>

      <div className="panel-content">
        {/* Survey Panel Frame with notched corner */}
        <div className="inspector-frame">
          {/* SVG border that traces the chamfered polygon (chamfer TOP-RIGHT) */}
          <div className="inspector-frame__border">
            <svg viewBox="0 0 340 734" preserveAspectRatio="none">
              <polygon points="0,32 188,32 220,0 340,0 340,734 0,734" />
            </svg>
          </div>
          {/* Title label INSIDE the card's step-down area (left side) */}
          <div className="inspector-frame__title-row">
            <input
              type="text"
              className="inspector-frame__title-input"
              value={effectiveItem?.title || ""}
              disabled={isResizing}
              onClick={(e) => e.currentTarget.focus()}
              onChange={(e) => handleFieldChange("title", e.target.value)}
              placeholder="UNTITLED"
            />
          </div>

          {/* Toolbar buttons INSIDE the card, top-right corner */}
          <div className="inspector-frame__toolbar">
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
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <button
              className="inspector-toolbar__btn inspector-toolbar__btn--delete"
              onClick={handleDelete}
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
          </div>

          {/* Main content with notched corner */}
          <div className="inspector-frame__content">
            {/* Scrollable content */}
            <div className="inspector-frame__scrollable">
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
                        {(effectiveItem?.sources || []).map((source, i) => (
                          <div key={i} className="spec-source spec-source--inline">
                            <input
                              type="text"
                              className="spec-source__input"
                              value={source.label}
                              onChange={(e) => handleSourceChange(i, "label", e.target.value)}
                              placeholder="Label..."
                            />
                            <input
                              type="url"
                              className="spec-source__input"
                              value={source.url || ""}
                              onChange={(e) => handleSourceChange(i, "url", e.target.value)}
                              placeholder="URL..."
                            />
                            <button
                              className="spec-source__remove"
                              onClick={() => handleRemoveSource(i)}
                              title="Remove source"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        <button
                          className="spec-add-btn spec-add-btn--small"
                          onClick={handleAddSource}
                        >
                          + Source
                        </button>
                      </div>
                    )}
                  </div>
                </section>

                {/* ═══ SECTION 2: Component Classification (Nested) ═══ */}
                <section className="spec-section">
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

                {/* ═══ SECTION 3: Tags ═══ */}
                <section className="spec-section">
                  <div className="spec-section__label">
                    <span className="spec-section__label-text">Tags</span>
                    <span className="spec-section__label-line" />
                  </div>
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
                </section>

                {/* ═══ SECTION 4: Briefing Flow ═══ */}
                <section className="spec-section">
                  <div className="spec-section__label">
                    <span className="spec-section__label-text">Briefing</span>
                    <span className="spec-section__label-line" />
                  </div>

                  {/* Pipeline Status - shown when processing */}
                  {pipelineStatus !== "idle" && pipelineStatus !== "done" && (
                    <div className="spec-pipeline-status spec-pipeline-status--inline">
                      <div
                        className={`spec-pipeline-status__indicator spec-pipeline-status__indicator--${pipelineStatus}`}
                      >
                        {pipelineStatus === "analyzing" && (
                          <>
                            <span className="spec-pipeline-status__icon">◇</span>
                            Analyzing image...
                          </>
                        )}
                        {pipelineStatus === "briefing" && (
                          <>
                            <span className="spec-pipeline-status__icon">◇</span>
                            Generating briefing...
                          </>
                        )}
                        {pipelineStatus === "error" && (
                          <>
                            <span className="spec-pipeline-status__icon spec-pipeline-status__icon--error">
                              ⚠
                            </span>
                            Pipeline error
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  <FlowConnector>
                    {/* Analysis (AI) */}
                    <FlowConnector.Node
                      label="Analysis"
                      badge="AI"
                      action={
                        effectiveItem?.analysis && (
                          <button onClick={onAnalyze} disabled={isAnalyzing}>
                            {isAnalyzing ? "..." : "Re-analyze"}
                          </button>
                        )
                      }
                    >
                      {effectiveItem?.analysis?.transferNotes ? (
                        <p className="flow-connector__text">
                          {effectiveItem.analysis.transferNotes}
                        </p>
                      ) : (
                        <div className="flow-connector__empty">
                          {!effectiveItem?.analysis ? (
                            <button
                              className="flow-connector__trigger"
                              onClick={onAnalyze}
                              disabled={isAnalyzing}
                            >
                              {isAnalyzing ? "Analyzing..." : "◇ Run Analysis"}
                            </button>
                          ) : (
                            <span>No transfer notes</span>
                          )}
                        </div>
                      )}
                    </FlowConnector.Node>

                    {/* Notes (User) */}
                    <FlowConnector.Node label="Notes">
                      <textarea
                        className="flow-connector__textarea"
                        value={effectiveItem?.notes || ""}
                        onChange={(e) => handleFieldChange("notes", e.target.value)}
                        placeholder="Your observations..."
                        rows={2}
                      />
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
                              className="spec-annotation spec-annotation--compact"
                            >
                              <span className="spec-annotation__index">#{index + 1}</span>
                              {editingAnnotationId === annotation.id ? (
                                <div className="spec-annotation__edit spec-annotation__edit--inline">
                                  <input
                                    type="text"
                                    className="spec-annotation__input"
                                    value={annotationNote}
                                    onChange={(e) => setAnnotationNote(e.target.value)}
                                    placeholder="Add note..."
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") handleSaveAnnotationNote();
                                      if (e.key === "Escape") {
                                        setEditingAnnotationId(null);
                                        setAnnotationNote("");
                                      }
                                    }}
                                    onBlur={handleSaveAnnotationNote}
                                  />
                                </div>
                              ) : (
                                <span
                                  className="spec-annotation__note spec-annotation__note--inline"
                                  onClick={() => handleEditAnnotation(annotation)}
                                >
                                  {annotation.note || "Click to add note..."}
                                </span>
                              )}
                              <button
                                className="spec-annotation__delete"
                                onClick={() => handleDeleteAnnotation(annotation.id)}
                                title="Delete"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </FlowConnector.Node>

                    {/* Briefing Output - Always visible */}
                    <FlowConnector.Node
                      label="Briefing"
                      badge="AI"
                      className="flow-connector__node--briefing flow-connector__node--no-line-above"
                      action={
                        onGenerateBriefing ? (
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              className="flow-connector__action-btn flow-connector__action-btn--generate"
                              onClick={onGenerateBriefing}
                              disabled={isBriefing || !effectiveItem?.analysis}
                              title={!effectiveItem?.analysis ? "Run analysis first" : undefined}
                            >
                              {isBriefing ? "..." : "Generate"}
                            </button>
                            {effectiveItem?.briefing && (
                              <button
                                onClick={onGenerateBriefing}
                                disabled={isBriefing || !effectiveItem?.analysis}
                                title={!effectiveItem?.analysis ? "Run analysis first" : undefined}
                              >
                                {isBriefing ? "..." : "Regenerate"}
                              </button>
                            )}
                          </div>
                        ) : null
                      }
                    >
                      {pipelineStatus === "briefing" && !effectiveItem?.briefing ? (
                        <div className="flow-connector__loading">
                          <span className="flow-connector__loading-icon">◇</span>
                          Generating...
                        </div>
                      ) : effectiveItem?.briefing ? (
                        <div className="flow-connector__briefing">
                          {formatBriefingText(effectiveItem?.briefing)}
                        </div>
                      ) : (
                        <div className="flow-connector__empty">
                          <span>Generate briefing to view content</span>
                        </div>
                      )}
                    </FlowConnector.Node>

                    {/* Embed Button - Final step after Briefing */}
                    {effectiveItem?.briefing && (
                      <div className="flow-connector__embed-section">
                        <button
                          className="flow-connector__embed-btn"
                          onClick={() => void onEmbed()}
                          disabled={isEmbedding}
                        >
                          {isEmbedding ? (
                            <>
                              <span className="flow-connector__spinner" />
                              Embedding...
                            </>
                          ) : (
                            "EMBED"
                          )}
                        </button>
                      </div>
                    )}
                  </FlowConnector>
                </section>

                {/* Embed moved into Briefing header (kept above the briefing content) */}
              </div>
            </div>
          </div>
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
    </aside>
  );
}

export const SurveyInspectorPanel = memo(SurveyInspectorPanelInner);
