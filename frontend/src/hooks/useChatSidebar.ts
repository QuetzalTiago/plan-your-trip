import { useState, useRef, useEffect, useCallback } from "react";
import { useStore } from "../store/useStore";
import { streamChat, getMessages } from "../api/client";
import type { Message } from "../types";

interface UseChatSidebarProps {
  tripId: string;
  onNewMessage: (msg: Message) => void;
}

export function useChatSidebar({ tripId, onNewMessage }: UseChatSidebarProps) {
  const {
    token,
    streaming,
    streamContent,
    activeTool,
    setStreaming,
    appendStream,
    clearStream,
    setActiveTool,
    setMessages,
  } = useStore();

  const [input, setInput] = useState("");
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<(() => void) | null>(null);
  const shouldScrollToBottom = useRef(true);

  // Scroll to bottom on load and during active conversation
  useEffect(() => {
    if (shouldScrollToBottom.current && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [streaming, streamContent]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");

    shouldScrollToBottom.current = true;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      tripId,
      role: "user",
      content: text,
      createdAt: Date.now(),
    };
    onNewMessage(userMsg);

    setStreaming(true);
    clearStream();

    abortRef.current = streamChat(
      tripId,
      text,
      token,
      (chunk) => appendStream(chunk),
      (toolName) => setActiveTool(toolName),
      (_event) => {}, // No-op for event handler - events are handled elsewhere
      async () => {
        setStreaming(false);
        clearStream();
        shouldScrollToBottom.current = false;

        if (token || import.meta.env.DEV) {
          try {
            const remoteMsgs = await getMessages(tripId, token);
            setMessages(
              remoteMsgs.map((m) => ({
                id: m.id,
                tripId: m.trip_id,
                role: m.role as Message["role"],
                content: m.content,
                toolName: m.tool_name ?? undefined,
                createdAt: m.created_at,
              }))
            );
          } catch (err) {
            console.error("Failed to fetch messages:", err);
          }
        }
      },
      (err: Error) => {
        const errMsg: Message = {
          id: crypto.randomUUID(),
          tripId,
          role: "assistant",
          content: `Error: ${err.message}`,
          createdAt: Date.now(),
        };
        onNewMessage(errMsg);
        setStreaming(false);
        clearStream();
        shouldScrollToBottom.current = false;
      }
    );
  }, [
    input,
    streaming,
    tripId,
    token,
    onNewMessage,
    appendStream,
    clearStream,
    setActiveTool,
    setStreaming,
    setMessages,
  ]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return {
    // State
    input,
    streaming,
    streamContent,
    activeTool,
    messagesContainerRef,

    // Actions
    setInput,
    handleSend,
    handleKeyDown,
  };
}
