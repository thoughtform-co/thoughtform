"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { FoundryFrameConfig } from "./types";

// ═══════════════════════════════════════════════════════════════
// FOUNDRY ASSISTANT DOCK
// Floating AI assistant button + translucent drawer for Foundry
// ═══════════════════════════════════════════════════════════════

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  patch?: {
    setProps?: Record<string, unknown>;
    setFrame?: Partial<FoundryFrameConfig>;
  } | null;
}

export interface FoundryAssistantDockProps {
  componentId: string | null;
  componentProps: Record<string, unknown>;
  foundryFrame: FoundryFrameConfig;
  onApplyPatch: (patch: {
    setProps?: Record<string, unknown>;
    setFrame?: Partial<FoundryFrameConfig>;
  }) => void;
  getAuthToken?: () => Promise<string | null>;
}

export function FoundryAssistantDock({
  componentId,
  componentProps,
  foundryFrame,
  onApplyPatch,
  getAuthToken,
}: FoundryAssistantDockProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
      if (getAuthToken) {
        const token = await getAuthToken();
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
      }

      // Build chat history for context
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch("/api/foundry/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: userMessage.content,
          componentId,
          props: componentProps,
          frame: foundryFrame,
          history,
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
  }, [inputValue, isLoading, componentId, componentProps, foundryFrame, messages, getAuthToken]);

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
    (patch: { setProps?: Record<string, unknown>; setFrame?: Partial<FoundryFrameConfig> }) => {
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
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          {isOpen ? (
            // Close icon - X
            <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
          ) : (
            // Chat bubble icon
            <>
              <path
                d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="11" r="1" fill="currentColor" stroke="none" />
              <circle cx="8" cy="11" r="1" fill="currentColor" stroke="none" />
              <circle cx="16" cy="11" r="1" fill="currentColor" stroke="none" />
            </>
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
