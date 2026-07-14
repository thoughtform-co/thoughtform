"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { SurveyItem } from "./types";
import { useReferenceMatch, type MatchResult } from "../_hooks/useReferenceMatch";

// ═══════════════════════════════════════════════════════════════
// FOUNDRY ASSISTANT DOCK
// Floating AI assistant button + translucent drawer for Foundry
// Supports per-component chat history and generative capabilities
// Now with Survey reference integration for style transfer
// ═══════════════════════════════════════════════════════════════

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  patch?: {
    setProps?: Record<string, unknown>;
    setStyleVars?: Record<string, string>;
  } | null;
  // Variant suggestions from the assistant
  variants?: ComponentVariant[] | null;
  // Procedural variants from StyleSpace
  proceduralVariants?: ComponentVariant[] | null;
  // Reference match results
  matchResult?: MatchResult | null;
}

// A component variant that can be rendered in the canvas
export interface ComponentVariant {
  id: string;
  name: string;
  description: string;
  props: Record<string, unknown>;
  styleVars?: Record<string, string>;
}

export interface FoundryAssistantDockProps {
  componentId: string | null;
  componentProps: Record<string, unknown>;
  onApplyPatch: (patch: {
    setProps?: Record<string, unknown>;
    setStyleVars?: Record<string, string>;
  }) => void;
  onCreateVariant?: (variant: ComponentVariant) => void;
  getAuthToken?: () => Promise<string | null>;
  // Survey integration for reference-based styling
  surveyItems?: SurveyItem[];
  onLoadSurveyItems?: () => Promise<void>;
}

// Store chat history per component (persists across re-renders)
const chatHistoryStore = new Map<string, ChatMessage[]>();

export function FoundryAssistantDock({
  componentId,
  componentProps,
  onApplyPatch,
  onCreateVariant,
  getAuthToken,
  surveyItems = [],
  onLoadSurveyItems,
}: FoundryAssistantDockProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showReferencePanel, setShowReferencePanel] = useState(false);
  const [selectedReferenceId, setSelectedReferenceId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reference matching hook
  const { matchReference, isMatching } = useReferenceMatch();

  // Per-component chat history
  const historyKey = componentId || "__no_component__";
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return chatHistoryStore.get(historyKey) || [];
  });

  // Update store when messages change
  useEffect(() => {
    chatHistoryStore.set(historyKey, messages);
  }, [historyKey, messages]);

  // Switch history when component changes
  useEffect(() => {
    const stored = chatHistoryStore.get(historyKey) || [];
    setMessages(stored);
  }, [historyKey]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus textarea when drawer opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Auto-resize textarea
  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }, []);

  // Send message
  const sendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: inputValue.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      // Build headers
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      // Add auth token if available
      let authToken: string | null = null;
      if (getAuthToken) {
        authToken = await getAuthToken();
        if (authToken) {
          headers["Authorization"] = `Bearer ${authToken}`;
        }
      }

      // Build chat history for context
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Detect if user is asking for variants/inspiration
      const wantsVariants =
        /variant|variation|alternative|version|option|create|generate|suggest|inspire/i.test(
          userMessage.content
        );

      const response = await fetch("/api/foundry/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: userMessage.content,
          componentId,
          props: componentProps,
          history,
          includeVariants: wantsVariants,
          searchSurvey: true, // Always search Survey for ambient design inspiration
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`);
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.response,
        patch: data.patch,
        variants: data.variants || null,
        proceduralVariants: data.proceduralVariants || null,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Failed to send message:", error);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, componentId, componentProps, messages, getAuthToken]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  // Handle apply patch
  const handleApplyPatch = useCallback(
    (patch: { setProps?: Record<string, unknown>; setStyleVars?: Record<string, string> }) => {
      onApplyPatch(patch);
    },
    [onApplyPatch]
  );

  // Handle apply from Survey reference
  const handleApplyFromReference = useCallback(
    async (item: SurveyItem) => {
      if (!componentId) return;

      setIsLoading(true);
      try {
        const result = await matchReference(item, componentId);

        if (result && Object.keys(result.componentProps).length > 0) {
          // Apply the extracted props
          onApplyPatch({ setProps: result.componentProps });

          // Add a message showing what was applied
          const applyMessage: ChatMessage = {
            id: `reference-${Date.now()}`,
            role: "assistant",
            content: `Applied style from "${item.title || "reference"}"\n\nExtracted: ${result.query}\n\nPatterns detected: ${result.suggestedPatterns.join(", ") || "none"}`,
            patch: { setProps: result.componentProps },
            matchResult: result,
          };
          setMessages((prev) => [...prev, applyMessage]);
        } else {
          // Show what was detected even if no direct props could be applied
          const infoMessage: ChatMessage = {
            id: `reference-info-${Date.now()}`,
            role: "assistant",
            content: `Analyzed "${item.title || "reference"}":\n\n${result?.query || "No patterns detected"}\n\nSuggested patterns: ${result?.suggestedPatterns.join(", ") || "none"}\nSuggested tokens: ${result?.suggestedTokens.join(", ") || "none"}\n\nTry asking me to apply specific patterns like "make it more industrial" or "add corner brackets".`,
            matchResult: result,
          };
          setMessages((prev) => [...prev, infoMessage]);
        }

        setShowReferencePanel(false);
        setSelectedReferenceId(null);
      } catch (error) {
        console.error("Failed to apply reference:", error);
        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          role: "assistant",
          content:
            "Sorry, I couldn't extract style information from that reference. Please try another.",
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [componentId, matchReference, onApplyPatch]
  );

  // Load survey items when reference panel opens
  useEffect(() => {
    if (showReferencePanel && onLoadSurveyItems && surveyItems.length === 0) {
      onLoadSurveyItems();
    }
  }, [showReferencePanel, onLoadSurveyItems, surveyItems.length]);

  // Clean up message content for display (remove JSON blocks)
  const cleanMessageContent = (content: string) => {
    return content.replace(/```json\s*[\s\S]*?\s*```/g, "").trim();
  };

  // Get selected reference
  const selectedReference = surveyItems.find((item) => item.id === selectedReferenceId);

  return (
    <div className="foundry-assistant-dock">
      {/* Toggle Button */}
      <button
        className={`foundry-assistant-btn ${isOpen ? "foundry-assistant-btn--active" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Open AI Assistant"
      >
        <svg
          className="foundry-assistant-btn__icon"
          viewBox="0 0 690.68 690.68"
          fill="currentColor"
        >
          {isOpen ? (
            // Close icon - X (simplified for this viewBox)
            <path
              d="M517.76 172.92L172.92 517.76L138.07 482.91L482.91 138.07L517.76 172.92ZM172.92 172.92L138.07 207.77L482.91 552.61L517.76 517.76L172.92 172.92Z"
              fill="currentColor"
            />
          ) : (
            // Thoughtform brand mark
            <polygon
              points="690.68 655.83 445.72 410.87 472.51 384.09 450.03 361.61 467.29 344.36 451.48 328.55 476.91 303.11 449.66 275.86 690.68 34.84 655.83 0 414.81 241.02 387.52 213.72 362.08 239.15 346.22 223.29 328.97 240.55 306.54 218.12 279.76 244.91 34.85 0 0 34.84 244.91 279.75 218.13 306.54 240.55 328.96 225.16 344.36 241.02 360.22 213.72 387.51 241.02 414.81 0 655.83 34.85 690.68 275.87 449.66 303.12 476.91 330.41 449.61 346.22 465.42 361.62 450.03 384.09 472.5 410.88 445.72 655.83 690.68 690.68 655.83"
              fill="currentColor"
            />
          )}
        </svg>
      </button>

      {/* Chat Drawer */}
      <div className={`foundry-assistant-drawer ${isOpen ? "foundry-assistant-drawer--open" : ""}`}>
        {/* Header */}
        <div className="foundry-assistant-drawer__header">
          <span className="foundry-assistant-drawer__title">◇ Foundry Assistant</span>
          <button
            className="foundry-assistant-drawer__close"
            onClick={() => setIsOpen(false)}
            title="Close"
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="foundry-assistant-messages">
          {messages.length === 0 && (
            <div className="foundry-assistant-message foundry-assistant-message--assistant">
              <span className="foundry-assistant-message__role">Assistant</span>
              <div className="foundry-assistant-message__content">
                Hi! I can help you style and modify your component. Tell me what you&apos;d like to
                change, and I&apos;ll suggest specific adjustments.
                {!componentId && (
                  <p style={{ marginTop: "8px", color: "var(--dawn-50)" }}>
                    <em>Select a component from the template tray to get started.</em>
                  </p>
                )}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`foundry-assistant-message foundry-assistant-message--${message.role}`}
            >
              <span className="foundry-assistant-message__role">
                {message.role === "user" ? "You" : "Assistant"}
              </span>
              <div className="foundry-assistant-message__content">
                {cleanMessageContent(message.content)}
              </div>
              {message.patch && (
                <button
                  className="foundry-assistant-message__apply"
                  onClick={() => handleApplyPatch(message.patch!)}
                >
                  ◇ Apply Changes
                </button>
              )}
              {/* Variant suggestions */}
              {message.variants && message.variants.length > 0 && (
                <div className="foundry-assistant-variants">
                  <span className="foundry-assistant-variants__label">Suggested Variants</span>
                  <div className="foundry-assistant-variants__grid">
                    {message.variants.map((variant) => (
                      <div key={variant.id} className="foundry-assistant-variant">
                        <span className="foundry-assistant-variant__name">{variant.name}</span>
                        <p className="foundry-assistant-variant__desc">{variant.description}</p>
                        <div className="foundry-assistant-variant__actions">
                          <button
                            className="foundry-assistant-variant__apply"
                            onClick={() =>
                              handleApplyPatch({
                                setProps: variant.props,
                                setStyleVars: variant.styleVars,
                              })
                            }
                            title="Apply to current component"
                          >
                            ◇ Apply
                          </button>
                          {onCreateVariant && (
                            <button
                              className="foundry-assistant-variant__create"
                              onClick={() => onCreateVariant(variant)}
                              title="Create as new variant in canvas"
                            >
                              + Create Variant
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Procedural StyleSpace variants */}
              {message.proceduralVariants && message.proceduralVariants.length > 0 && (
                <div className="foundry-assistant-variants foundry-assistant-variants--procedural">
                  <span className="foundry-assistant-variants__label">◇ StyleSpace Variants</span>
                  <div className="foundry-assistant-variants__grid">
                    {message.proceduralVariants.map((variant) => (
                      <div
                        key={variant.id}
                        className="foundry-assistant-variant foundry-assistant-variant--procedural"
                      >
                        <span className="foundry-assistant-variant__name">{variant.name}</span>
                        <p className="foundry-assistant-variant__desc">{variant.description}</p>
                        <div className="foundry-assistant-variant__actions">
                          <button
                            className="foundry-assistant-variant__apply"
                            onClick={() =>
                              handleApplyPatch({
                                setStyleVars: variant.styleVars,
                              })
                            }
                            title="Apply style vars to current component"
                          >
                            ◇ Apply
                          </button>
                          {onCreateVariant && (
                            <button
                              className="foundry-assistant-variant__create"
                              onClick={() => onCreateVariant(variant)}
                              title="Create as new variant in canvas"
                            >
                              + Create Variant
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="foundry-assistant-loading">
              <div className="foundry-assistant-loading__dot" />
              <div className="foundry-assistant-loading__dot" />
              <div className="foundry-assistant-loading__dot" />
              <span>Thinking...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Reference Panel (collapsible) */}
        {showReferencePanel && (
          <div className="foundry-assistant-references">
            <div className="foundry-assistant-references__header">
              <span className="foundry-assistant-references__title">
                Apply from Survey Reference
              </span>
              <button
                className="foundry-assistant-references__close"
                onClick={() => {
                  setShowReferencePanel(false);
                  setSelectedReferenceId(null);
                }}
              >
                ×
              </button>
            </div>
            <div className="foundry-assistant-references__grid">
              {surveyItems.length === 0 ? (
                <div className="foundry-assistant-references__empty">
                  No references available. Upload references in the Survey tab first.
                </div>
              ) : (
                surveyItems.slice(0, 12).map((item) => (
                  <button
                    key={item.id}
                    className={`foundry-assistant-reference ${
                      selectedReferenceId === item.id ? "foundry-assistant-reference--selected" : ""
                    }`}
                    onClick={() => setSelectedReferenceId(item.id)}
                  >
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.title || "Reference"}
                        className="foundry-assistant-reference__image"
                      />
                    ) : (
                      <div className="foundry-assistant-reference__placeholder">◇</div>
                    )}
                    <span className="foundry-assistant-reference__title">
                      {item.title || "Untitled"}
                    </span>
                  </button>
                ))
              )}
            </div>
            {selectedReference && (
              <div className="foundry-assistant-references__preview">
                <div className="foundry-assistant-references__preview-info">
                  <strong>{selectedReference.title || "Untitled"}</strong>
                  {selectedReference.analysis?.summary && (
                    <p>{selectedReference.analysis.summary}</p>
                  )}
                  {selectedReference.tags.length > 0 && (
                    <div className="foundry-assistant-references__tags">
                      {selectedReference.tags.slice(0, 5).map((tag) => (
                        <span key={tag} className="foundry-assistant-references__tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  className="foundry-assistant-references__apply-btn"
                  onClick={() => handleApplyFromReference(selectedReference)}
                  disabled={isMatching || !componentId}
                >
                  {isMatching ? "Analyzing..." : "◇ Apply Style"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Input */}
        <div className="foundry-assistant-input">
          {/* Reference toggle button */}
          <button
            className={`foundry-assistant-input__reference-btn ${
              showReferencePanel ? "foundry-assistant-input__reference-btn--active" : ""
            }`}
            onClick={() => setShowReferencePanel(!showReferencePanel)}
            title="Apply from Survey reference"
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
              <path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <textarea
            ref={textareaRef}
            className="foundry-assistant-input__textarea"
            placeholder="Ask me to style or modify your component..."
            value={inputValue}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <button
            className="foundry-assistant-input__send"
            onClick={sendMessage}
            disabled={!inputValue.trim() || isLoading}
            title="Send (Enter)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path
                d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
