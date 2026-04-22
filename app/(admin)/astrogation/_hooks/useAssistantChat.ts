"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { DesignCardProposal, DesignOperation } from "../_components/DesignCard";
import { createProposalFromPatch, createProposalFromVariant } from "../_components/DesignCard";

// ═══════════════════════════════════════════════════════════════════════════
// ASSISTANT CHAT HOOK
// Phase 3: Chat persistence + design card integration
// ═══════════════════════════════════════════════════════════════════════════

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  /** Design card proposals embedded in this message */
  proposals?: DesignCardProposal[];
  /** Timestamp */
  createdAt: string;
  /** Model used (for assistant messages) */
  model?: string;
}

export interface Conversation {
  id: string;
  title?: string;
  contextType?: "foundry_item" | "component" | "general";
  contextId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UseAssistantChatProps {
  /** Auth token getter */
  getAuthToken?: () => Promise<string | null>;
  /** Context type for the conversation */
  contextType?: "foundry_item" | "component" | "general";
  /** Context ID (e.g., item ID, component ID) */
  contextId?: string;
  /** Registry key of the component being edited (for proposals) */
  registryKey?: string;
  /** Current args of the component being edited */
  currentArgs?: Record<string, unknown>;
  /** Callback when an operation should be applied */
  onApplyOperation?: (operation: DesignOperation) => void;
}

export interface AssistantChatState {
  /** Current conversation */
  conversation: Conversation | null;
  /** Messages in the current conversation */
  messages: ChatMessage[];
  /** Loading state */
  isLoading: boolean;
  /** Error message */
  error: string | null;
  /** Input value */
  inputValue: string;
  /** List of past conversations */
  conversations: Conversation[];
}

export interface AssistantChatActions {
  /** Send a message */
  sendMessage: (content: string) => Promise<void>;
  /** Load a specific conversation */
  loadConversation: (conversationId: string) => Promise<void>;
  /** Start a new conversation */
  newConversation: () => void;
  /** Load conversation list */
  loadConversations: () => Promise<void>;
  /** Set input value */
  setInputValue: (value: string) => void;
  /** Apply a design operation */
  applyOperation: (operation: DesignOperation) => void;
  /** Clear error */
  clearError: () => void;
}

export function useAssistantChat({
  getAuthToken,
  contextType = "general",
  contextId,
  registryKey,
  currentArgs,
  onApplyOperation,
}: UseAssistantChatProps): AssistantChatState & AssistantChatActions {
  // State
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);

  // Refs for stable callbacks
  const registryKeyRef = useRef(registryKey);
  const currentArgsRef = useRef(currentArgs);

  // Update refs when props change
  useEffect(() => {
    registryKeyRef.current = registryKey;
    currentArgsRef.current = currentArgs;
  }, [registryKey, currentArgs]);

  // Build headers with auth
  const getHeaders = useCallback(async (): Promise<HeadersInit> => {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (getAuthToken) {
      const token = await getAuthToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    return headers;
  }, [getAuthToken]);

  // Load conversations list
  const loadConversations = useCallback(async () => {
    try {
      const headers = await getHeaders();
      const params = new URLSearchParams();
      if (contextType) params.set("context_type", contextType);
      if (contextId) params.set("context_id", contextId);

      const response = await fetch(`/api/assistant/conversations?${params}`, {
        headers,
      });

      if (!response.ok) {
        // If unauthorized, use local storage fallback
        if (response.status === 401) {
          const stored = localStorage.getItem("assistant_conversations");
          if (stored) {
            setConversations(JSON.parse(stored));
          }
          return;
        }
        throw new Error("Failed to load conversations");
      }

      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (err) {
      console.error("Failed to load conversations:", err);
      // Fallback to localStorage
      const stored = localStorage.getItem("assistant_conversations");
      if (stored) {
        setConversations(JSON.parse(stored));
      }
    }
  }, [getHeaders, contextType, contextId]);

  // Load a specific conversation
  const loadConversation = useCallback(
    async (conversationId: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const headers = await getHeaders();
        const response = await fetch(`/api/assistant/conversations/${conversationId}`, {
          headers,
        });

        if (!response.ok) {
          if (response.status === 401) {
            // Local storage fallback
            const stored = localStorage.getItem(`assistant_conversation_${conversationId}`);
            if (stored) {
              const data = JSON.parse(stored);
              setConversation(data.conversation);
              setMessages(data.messages || []);
              return;
            }
          }
          throw new Error("Failed to load conversation");
        }

        const data = await response.json();
        setConversation(data.conversation);
        setMessages(
          (data.messages || []).map((m: Record<string, unknown>) => ({
            id: m.id as string,
            role: m.role as "user" | "assistant" | "system",
            content: m.content as string,
            proposals: m.structured_data
              ? (m.structured_data as { proposals?: DesignCardProposal[] }).proposals
              : undefined,
            createdAt: m.created_at as string,
            model: m.model as string | undefined,
          }))
        );
      } catch (err) {
        setError("Failed to load conversation");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    },
    [getHeaders]
  );

  // Start a new conversation
  const newConversation = useCallback(() => {
    setConversation(null);
    setMessages([]);
    setError(null);
  }, []);

  // Send a message
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      setIsLoading(true);
      setError(null);

      // Create user message immediately
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: content.trim(),
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInputValue("");

      try {
        const headers = await getHeaders();

        // Build history for context
        const history = messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        // Call the chat API
        const response = await fetch("/api/foundry/chat", {
          method: "POST",
          headers,
          body: JSON.stringify({
            message: content.trim(),
            componentId: contextId,
            props: currentArgsRef.current,
            history,
            includeVariants: /variant|variation|alternative|version|option/i.test(content),
            searchSurvey: true,
          }),
        });

        if (!response.ok) {
          throw new Error(`Chat failed: ${response.status}`);
        }

        const data = await response.json();

        // Convert response to proposals
        const proposals: DesignCardProposal[] = [];

        // Convert patch to proposal
        if (data.patch && registryKeyRef.current) {
          proposals.push(
            createProposalFromPatch(
              contextId || "new",
              registryKeyRef.current,
              currentArgsRef.current || {},
              data.patch,
              { title: "Suggested Change", description: "Apply the proposed modifications." }
            )
          );
        }

        // Convert variants to proposals
        if (data.variants && registryKeyRef.current) {
          for (const variant of data.variants) {
            proposals.push(createProposalFromVariant(registryKeyRef.current, variant));
          }
        }

        // Create assistant message
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.response,
          proposals: proposals.length > 0 ? proposals : undefined,
          createdAt: new Date().toISOString(),
          model: data.model,
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // Persist messages if we have a conversation
        if (conversation) {
          // Save to API (fire and forget)
          fetch(`/api/assistant/conversations/${conversation.id}/messages`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              role: "user",
              content: content.trim(),
            }),
          }).catch(console.error);

          fetch(`/api/assistant/conversations/${conversation.id}/messages`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              role: "assistant",
              content: data.response,
              structured_data: proposals.length > 0 ? { proposals } : null,
              model: data.model,
            }),
          }).catch(console.error);
        } else {
          // Create new conversation if authenticated
          try {
            const convResponse = await fetch("/api/assistant/conversations", {
              method: "POST",
              headers,
              body: JSON.stringify({
                context_type: contextType,
                context_id: contextId,
                title: content.trim().slice(0, 50),
              }),
            });

            if (convResponse.ok) {
              const convData = await convResponse.json();
              setConversation(convData.conversation);

              // Save messages to new conversation
              await fetch(`/api/assistant/conversations/${convData.conversation.id}/messages`, {
                method: "POST",
                headers,
                body: JSON.stringify({ role: "user", content: content.trim() }),
              });

              await fetch(`/api/assistant/conversations/${convData.conversation.id}/messages`, {
                method: "POST",
                headers,
                body: JSON.stringify({
                  role: "assistant",
                  content: data.response,
                  structured_data: proposals.length > 0 ? { proposals } : null,
                  model: data.model,
                }),
              });
            }
          } catch {
            // Fallback to localStorage
            const localConv: Conversation = {
              id: `local-${Date.now()}`,
              title: content.trim().slice(0, 50),
              contextType,
              contextId,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            setConversation(localConv);

            // Save to localStorage
            const stored = localStorage.getItem("assistant_conversations");
            const convs: Conversation[] = stored ? JSON.parse(stored) : [];
            convs.unshift(localConv);
            localStorage.setItem("assistant_conversations", JSON.stringify(convs));
            localStorage.setItem(
              `assistant_conversation_${localConv.id}`,
              JSON.stringify({
                conversation: localConv,
                messages: [...messages, userMessage, assistantMessage],
              })
            );
          }
        }
      } catch (err) {
        setError("Failed to send message");
        console.error(err);

        // Add error message
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: "assistant",
            content: "Sorry, I encountered an error. Please try again.",
            createdAt: new Date().toISOString(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, getHeaders, messages, conversation, contextType, contextId]
  );

  // Apply operation
  const applyOperation = useCallback(
    (operation: DesignOperation) => {
      onApplyOperation?.(operation);
    },
    [onApplyOperation]
  );

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    conversation,
    messages,
    isLoading,
    error,
    inputValue,
    conversations,
    // Actions
    sendMessage,
    loadConversation,
    newConversation,
    loadConversations,
    setInputValue,
    applyOperation,
    clearError,
  };
}
