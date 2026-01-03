"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════
// FOUNDRY ASSISTANT DOCK
// Floating AI assistant button + translucent drawer for Foundry
// Supports per-component chat history and generative capabilities
// ═══════════════════════════════════════════════════════════════

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  patch?: {
    setProps?: Record<string, unknown>;
  } | null;
  // Variant suggestions from the assistant
  variants?: ComponentVariant[] | null;
}

// A component variant that can be rendered in the canvas
export interface ComponentVariant {
  id: string;
  name: string;
  description: string;
  props: Record<string, unknown>;
}

export interface FoundryAssistantDockProps {
  componentId: string | null;
  componentProps: Record<string, unknown>;
  onApplyPatch: (patch: { setProps?: Record<string, unknown> }) => void;
  onCreateVariant?: (variant: ComponentVariant) => void;
  getAuthToken?: () => Promise<string | null>;
}

// Store chat history per component (persists across re-renders)
const chatHistoryStore = new Map<string, ChatMessage[]>();

export function FoundryAssistantDock({
  componentId,
  componentProps,
  onApplyPatch,
  onCreateVariant,
  getAuthToken,
}: FoundryAssistantDockProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
          searchSurvey: wantsVariants, // Search Survey for inspiration when creating variants
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
    (patch: { setProps?: Record<string, unknown> }) => {
      onApplyPatch(patch);
    },
    [onApplyPatch]
  );

  // Clean up message content for display (remove JSON blocks)
  const cleanMessageContent = (content: string) => {
    return content.replace(/```json\s*[\s\S]*?\s*```/g, "").trim();
  };

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

        {/* Input */}
        <div className="foundry-assistant-input">
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
