"use client";

import { useState, useCallback, memo, useEffect, useRef } from "react";
import type { SurveyItem, SurveyItemSource, SurveyAnnotation } from "./types";
import { CATEGORIES, getComponentsByCategory } from "../catalog";
import { Select } from "./Select";
import { SurveyUploadModal } from "./SurveyUploadModal";
import type { PipelineStatus } from "../_hooks/useSurvey";

// ═══════════════════════════════════════════════════════════════
// SURVEY INSPECTOR PANEL - Edit metadata & AI chat
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

  // Auto-open new annotation notes
  useEffect(() => {
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
  }, [item?.annotations]);

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
      <aside className="astrogation-panel astrogation-panel--right">
        <div className="panel-header-wrapper">
          <div className="panel-header panel-header--survey">
            <span className="panel-header__title">INSPECTOR</span>
          </div>
          {onUpload && (
            <button
              className="panel-header__upload-btn"
              onClick={() => setIsUploadModalOpen(true)}
              title="Upload reference"
            >
              + Upload
            </button>
          )}
        </div>
        <div className="panel-content panel-content--empty">
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
    <aside className="astrogation-panel astrogation-panel--right">
      <div className="panel-header-wrapper">
        <div className="panel-header panel-header--survey">
          <span className="panel-header__title">INSPECTOR</span>
        </div>
        {onUpload && (
          <button
            className="panel-header__upload-btn"
            onClick={() => setIsUploadModalOpen(true)}
            title="Upload reference"
          >
            + Upload
          </button>
        )}
      </div>

      {/* Inspector Tabs */}
      <div className="inspector-tabs">
        <button
          className={`inspector-tab ${activeTab === "fields" ? "inspector-tab--active" : ""}`}
          onClick={() => setActiveTab("fields")}
        >
          FIELDS
        </button>
        <button
          className={`inspector-tab ${activeTab === "chat" ? "inspector-tab--active" : ""}`}
          onClick={() => setActiveTab("chat")}
        >
          CHAT
        </button>
      </div>

      <div className="panel-content">
        {activeTab === "fields" ? (
          <div className="panel-content__scrollable">
            <div className="spec-panel-v2">
              {/* ═══ SECTION 1: Title + Sources ═══ */}
              <section className="spec-section">
                <div className="spec-section__label">
                  <span className="spec-section__label-text">Title</span>
                  <span className="spec-section__label-line" />
                </div>
                <input
                  type="text"
                  className="spec-section__input"
                  value={effectiveItem?.title || ""}
                  onChange={(e) => handleFieldChange("title", e.target.value)}
                  placeholder="Reference title..."
                />
                {/* Sources - compact under title */}
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
                  <button className="spec-add-btn spec-add-btn--small" onClick={handleAddSource}>
                    + Source
                  </button>
                </div>
              </section>

              {/* ═══ SECTION 2: Category + Component ═══ */}
              <section className="spec-section spec-section--row">
                <div className="spec-section__half">
                  <div className="spec-section__label">
                    <span className="spec-section__label-text">Category</span>
                  </div>
                  <Select
                    value={effectiveItem?.category_id || ""}
                    onChange={(value) => handleFieldChange("category_id", value || null)}
                    options={[
                      { value: "", label: "Category..." },
                      ...CATEGORIES.map((cat) => ({ value: cat.id, label: cat.name })),
                    ]}
                    className="spec-select--compact"
                  />
                </div>
                <div className="spec-section__half">
                  <div className="spec-section__label">
                    <span className="spec-section__label-text">Component</span>
                  </div>
                  <Select
                    value={effectiveItem?.component_key || ""}
                    onChange={(value) => handleFieldChange("component_key", value || null)}
                    options={[
                      { value: "", label: "Component..." },
                      ...(effectiveItem?.category_id
                        ? getComponentsByCategory(effectiveItem.category_id).map((comp) => ({
                            value: comp.id,
                            label: comp.name,
                          }))
                        : []),
                    ]}
                    disabled={!effectiveItem?.category_id}
                    className="spec-select--compact"
                  />
                </div>
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

              {/* ═══ SECTION 4: Briefing (combined section) ═══ */}
              <section className="spec-section spec-section--briefing-flow">
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

                <div className="spec-briefing-flow">
                  {/* Flow Step 1: Analysis (AI) */}
                  <div className="spec-flow-item">
                    <div className="spec-flow-item__header">
                      <span className="spec-flow-item__label">
                        Analysis
                        <span className="spec-section__label-badge">AI</span>
                      </span>
                      {effectiveItem?.analysis && (
                        <button
                          className="spec-flow-item__action"
                          onClick={onAnalyze}
                          disabled={isAnalyzing}
                        >
                          {isAnalyzing ? "..." : "Re-analyze"}
                        </button>
                      )}
                    </div>
                    {effectiveItem?.analysis?.transferNotes ? (
                      <p className="spec-flow-item__content">
                        {effectiveItem.analysis.transferNotes}
                      </p>
                    ) : (
                      <div className="spec-flow-item__empty">
                        {!effectiveItem?.analysis ? (
                          <button
                            className="spec-flow-item__trigger"
                            onClick={onAnalyze}
                            disabled={isAnalyzing}
                          >
                            {isAnalyzing ? "Analyzing..." : "◇ Run Analysis"}
                          </button>
                        ) : (
                          <span className="spec-flow-item__hint">No transfer notes</span>
                        )}
                      </div>
                    )}
                    <div className="spec-flow-connector" />
                  </div>

                  {/* Flow Step 2: Notes (User) */}
                  <div className="spec-flow-item">
                    <div className="spec-flow-item__header">
                      <span className="spec-flow-item__label">Notes</span>
                    </div>
                    <textarea
                      className="spec-flow-item__textarea"
                      value={effectiveItem?.notes || ""}
                      onChange={(e) => handleFieldChange("notes", e.target.value)}
                      placeholder="Your observations..."
                      rows={2}
                    />
                    <div className="spec-flow-connector" />
                  </div>

                  {/* Flow Step 3: Annotations */}
                  <div className="spec-flow-item">
                    <div className="spec-flow-item__header">
                      <span className="spec-flow-item__label">
                        Annotations
                        {annotationCount > 0 && (
                          <span className="spec-section__label-count">({annotationCount})</span>
                        )}
                      </span>
                    </div>
                    {annotationCount === 0 ? (
                      <div className="spec-flow-item__empty">
                        <span className="spec-flow-item__hint">Draw on the image to add</span>
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
                    <div className="spec-flow-connector" />
                  </div>

                  {/* Flow Step 4: Generate Briefing Button */}
                  <div className="spec-flow-item spec-flow-item--action">
                    {onGenerateBriefing && (
                      <button
                        className="spec-btn spec-btn--briefing"
                        onClick={onGenerateBriefing}
                        disabled={isBriefing || !effectiveItem?.analysis}
                        title={!effectiveItem?.analysis ? "Run analysis first" : undefined}
                      >
                        {isBriefing
                          ? "Generating..."
                          : effectiveItem?.briefing
                            ? "Regenerate Briefing"
                            : "Generate Briefing"}
                      </button>
                    )}
                    {effectiveItem?.briefing &&
                      effectiveItem.briefing_updated_at &&
                      effectiveItem.updated_at &&
                      new Date(effectiveItem.updated_at) >
                        new Date(effectiveItem.briefing_updated_at) && (
                        <span className="spec-section__stale-indicator">◇ May be outdated</span>
                      )}
                  </div>

                  {/* Flow Step 5: Generated Briefing Output */}
                  {(effectiveItem?.briefing || pipelineStatus === "briefing") && (
                    <div className="spec-flow-item spec-flow-item--output">
                      <div className="spec-flow-item__header">
                        <span className="spec-flow-item__label">
                          Generated Briefing
                          <span className="spec-section__label-badge">AI</span>
                        </span>
                      </div>
                      {pipelineStatus === "briefing" && !effectiveItem?.briefing ? (
                        <div className="spec-section__ai-loading">
                          <span className="spec-section__ai-loading-icon">◇</span>
                          Generating...
                        </div>
                      ) : (
                        <div className="spec-section__briefing-text">{effectiveItem?.briefing}</div>
                      )}
                    </div>
                  )}
                </div>
              </section>

              {/* ═══ ACTIONS ═══ */}
              <div className="spec-actions">
                {!isResizing && (
                  <div className="spec-actions__row">
                    <button
                      className="spec-btn spec-btn--primary"
                      onClick={handleSave}
                      disabled={!hasChanges || isSaving}
                    >
                      {isSaving ? "Saving..." : "Save"}
                    </button>
                    <button
                      className="spec-btn spec-btn--ghost"
                      onClick={handleReset}
                      disabled={!hasChanges}
                    >
                      Reset
                    </button>
                  </div>
                )}
                <div className="spec-actions__row">
                  <button
                    className="spec-btn spec-btn--outline"
                    onClick={onEmbed}
                    disabled={isEmbedding || !effectiveItem?.briefing}
                    title={!effectiveItem?.briefing ? "Generate briefing first" : undefined}
                  >
                    {isEmbedding ? "Embedding..." : "Embed"}
                  </button>
                </div>
                <div className="spec-actions__row spec-actions__row--danger">
                  <button className="spec-btn spec-btn--danger" onClick={handleDelete}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="inspector-chat">
            {/* Chat Messages */}
            <div className="inspector-chat__messages">
              {chatMessages.length === 0 ? (
                <div className="inspector-chat__empty">
                  <span className="inspector-chat__empty-icon">◇</span>
                  <p>Ask questions about this reference</p>
                  <span className="inspector-chat__empty-hint">
                    Get design suggestions, compare with your system, etc.
                  </span>
                </div>
              ) : (
                chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`inspector-chat__message inspector-chat__message--${msg.role}`}
                  >
                    <div className="inspector-chat__message-content">{msg.content}</div>
                  </div>
                ))
              )}
              {isChatLoading && (
                <div className="inspector-chat__message inspector-chat__message--assistant">
                  <div className="inspector-chat__message-content inspector-chat__message-content--loading">
                    <span>◇</span> Thinking...
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="inspector-chat__input-area">
              <textarea
                className="inspector-chat__input"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleChatSubmit();
                  }
                }}
                placeholder="Ask about this reference..."
                rows={2}
              />
              <button
                className="inspector-chat__send"
                onClick={handleChatSubmit}
                disabled={!chatInput.trim() || isChatLoading}
              >
                Send
              </button>
            </div>
          </div>
        )}
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
