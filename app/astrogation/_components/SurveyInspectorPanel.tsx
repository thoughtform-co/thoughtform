"use client";

import { useState, useCallback, memo } from "react";
import type { SurveyItem, SurveyItemSource, SurveyAnnotation } from "./types";
import { CATEGORIES, getComponentsByCategory } from "../catalog";
import { Select } from "./Select";
import { SurveyUploadModal } from "./SurveyUploadModal";

// ═══════════════════════════════════════════════════════════════
// SURVEY INSPECTOR PANEL - Edit metadata & AI chat
// ═══════════════════════════════════════════════════════════════

export interface SurveyInspectorPanelProps {
  item: SurveyItem | null;
  onUpdate: (updates: Partial<SurveyItem>) => Promise<void>;
  onDelete: () => Promise<void>;
  onAnalyze: () => Promise<void>;
  onEmbed: () => Promise<void>;
  onUpload?: (file: File, categoryId: string | null, componentKey: string | null) => Promise<void>;
  selectedCategoryId?: string | null;
  selectedComponentKey?: string | null;
  isAnalyzing?: boolean;
  isEmbedding?: boolean;
  isSaving?: boolean;
  isResizing?: boolean;
  isUploading?: boolean;
}

type InspectorTab = "fields" | "chat";

function SurveyInspectorPanelInner({
  item,
  onUpdate,
  onDelete,
  onAnalyze,
  onEmbed,
  isAnalyzing = false,
  isEmbedding = false,
  isSaving = false,
  isResizing = false,
  onUpload,
  selectedCategoryId = null,
  selectedComponentKey = null,
  isUploading = false,
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

  // Handle tags
  const handleTagsChange = useCallback(
    (tagsString: string) => {
      const tags = tagsString
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
      handleFieldChange("tags", tags);
    },
    [handleFieldChange]
  );

  // Handle annotation editing
  const handleEditAnnotation = useCallback((annotation: SurveyAnnotation) => {
    setEditingAnnotationId(annotation.id);
    setAnnotationNote(annotation.note);
  }, []);

  const handleSaveAnnotationNote = useCallback(() => {
    if (!editingAnnotationId) return;
    const annotations = (effectiveItem?.annotations || []).map((a) =>
      a.id === editingAnnotationId ? { ...a, note: annotationNote } : a
    );
    handleFieldChange("annotations", annotations);
    setEditingAnnotationId(null);
    setAnnotationNote("");
  }, [editingAnnotationId, annotationNote, effectiveItem?.annotations, handleFieldChange]);

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
              {/* Title */}
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
              </section>

              {/* Category */}
              <section className="spec-section">
                <div className="spec-section__label">
                  <span className="spec-section__label-text">Category</span>
                  <span className="spec-section__label-line" />
                </div>
                <Select
                  value={effectiveItem?.category_id || ""}
                  onChange={(value) => handleFieldChange("category_id", value || null)}
                  options={[
                    { value: "", label: "Select category..." },
                    ...CATEGORIES.map((cat) => ({ value: cat.id, label: cat.name })),
                  ]}
                />
              </section>

              {/* Component */}
              <section className="spec-section">
                <div className="spec-section__label">
                  <span className="spec-section__label-text">Component</span>
                  <span className="spec-section__label-line" />
                </div>
                <Select
                  value={effectiveItem?.component_key || ""}
                  onChange={(value) => handleFieldChange("component_key", value || null)}
                  options={[
                    { value: "", label: "Select component..." },
                    ...(effectiveItem?.category_id
                      ? getComponentsByCategory(effectiveItem.category_id).map((comp) => ({
                          value: comp.id,
                          label: comp.name,
                        }))
                      : []),
                  ]}
                  disabled={!effectiveItem?.category_id}
                />
              </section>

              {/* Tags */}
              <section className="spec-section">
                <div className="spec-section__label">
                  <span className="spec-section__label-text">Tags</span>
                  <span className="spec-section__label-line" />
                </div>
                <input
                  type="text"
                  className="spec-section__input"
                  value={(effectiveItem?.tags || []).join(", ")}
                  onChange={(e) => handleTagsChange(e.target.value)}
                  placeholder="hud, frame, terminal, ..."
                />
              </section>

              {/* Notes */}
              <section className="spec-section">
                <div className="spec-section__label">
                  <span className="spec-section__label-text">Notes</span>
                  <span className="spec-section__label-line" />
                </div>
                <textarea
                  className="spec-section__textarea"
                  value={effectiveItem?.notes || ""}
                  onChange={(e) => handleFieldChange("notes", e.target.value)}
                  placeholder="Your observations, what you like about it..."
                  rows={3}
                />
              </section>

              {/* Annotations */}
              <section className="spec-section">
                <div className="spec-section__label">
                  <span className="spec-section__label-text">
                    Annotations
                    {annotationCount > 0 && (
                      <span className="spec-section__label-count">({annotationCount})</span>
                    )}
                  </span>
                  <span className="spec-section__label-line" />
                </div>
                {annotationCount === 0 ? (
                  <div className="spec-section__hint">Draw on the image to add annotations</div>
                ) : (
                  <div className="spec-annotations-list">
                    {(effectiveItem?.annotations || []).map((annotation, index) => (
                      <div key={annotation.id} className="spec-annotation">
                        <div className="spec-annotation__header">
                          <span className="spec-annotation__index">#{index + 1}</span>
                          <button
                            className="spec-annotation__delete"
                            onClick={() => handleDeleteAnnotation(annotation.id)}
                            title="Delete annotation"
                          >
                            ×
                          </button>
                        </div>
                        {editingAnnotationId === annotation.id ? (
                          <div className="spec-annotation__edit">
                            <input
                              type="text"
                              className="spec-annotation__input"
                              value={annotationNote}
                              onChange={(e) => setAnnotationNote(e.target.value)}
                              placeholder="Add note..."
                              autoFocus
                            />
                            <div className="spec-annotation__edit-actions">
                              <button
                                className="spec-annotation__save"
                                onClick={handleSaveAnnotationNote}
                              >
                                Save
                              </button>
                              <button
                                className="spec-annotation__cancel"
                                onClick={() => {
                                  setEditingAnnotationId(null);
                                  setAnnotationNote("");
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            className="spec-annotation__note"
                            onClick={() => handleEditAnnotation(annotation)}
                          >
                            {annotation.note || "Click to add note..."}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Sources */}
              <section className="spec-section">
                <div className="spec-section__label">
                  <span className="spec-section__label-text">Sources</span>
                  <span className="spec-section__label-line" />
                </div>
                <div className="spec-sources">
                  {(effectiveItem?.sources || []).map((source, i) => (
                    <div key={i} className="spec-source">
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
                  <button className="spec-add-btn" onClick={handleAddSource}>
                    + Add Source
                  </button>
                </div>
              </section>

              {/* Analysis Preview */}
              {effectiveItem?.analysis && Object.keys(effectiveItem.analysis).length > 0 && (
                <section className="spec-section">
                  <div className="spec-section__label">
                    <span className="spec-section__label-text">AI Analysis</span>
                    <span className="spec-section__label-line" />
                  </div>
                  <div className="spec-analysis">
                    {effectiveItem.analysis.transferNotes && (
                      <p className="spec-analysis__notes">{effectiveItem.analysis.transferNotes}</p>
                    )}
                    {effectiveItem.analysis.tags && effectiveItem.analysis.tags.length > 0 && (
                      <div className="spec-analysis__tags">
                        <span className="spec-analysis__label">Suggested:</span>
                        {effectiveItem.analysis.tags.map((tag, i) => (
                          <span key={i} className="spec-analysis__tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Actions */}
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
                    onClick={onAnalyze}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? "Analyzing..." : "Analyze (Claude)"}
                  </button>
                  <button
                    className="spec-btn spec-btn--outline"
                    onClick={onEmbed}
                    disabled={isEmbedding}
                  >
                    {isEmbedding ? "Embedding..." : "Embed (Voyage)"}
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
