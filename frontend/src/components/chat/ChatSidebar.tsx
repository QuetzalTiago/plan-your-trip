import type { Message } from "../../types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useChatSidebar } from "../../hooks/useChatSidebar";

interface ChatSidebarProps {
  tripId: string;
  messages: Message[];
  onNewMessage: (msg: Message) => void;
}

export default function ChatSidebar({
  tripId,
  messages,
  onNewMessage,
}: ChatSidebarProps) {
  const {
    input,
    streaming,
    streamContent,
    activeTool,
    messagesContainerRef,
    setInput,
    handleSend,
    handleKeyDown,
  } = useChatSidebar({ tripId, onNewMessage });

  return (
    <div
      className="flex flex-col h-full border-l"
      style={{ borderColor: "var(--border)" }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 border-b font-semibold text-sm"
        style={{ borderColor: "var(--border)" }}
      >
        Travel Agent Chat
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className="max-w-[85%] px-3 py-2 rounded-lg text-sm"
              style={{
                background:
                  msg.role === "user" ? "var(--accent)" : "var(--surface)",
                color: msg.role === "user" ? "#fff" : "var(--text-primary)",
              }}
            >
              {msg.role === "user" ? (
                msg.content
              ) : (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Streaming content */}
        {streaming && (
          <div className="flex justify-start">
            <div
              className="max-w-[85%] px-3 py-2 rounded-lg text-sm"
              style={{
                background: "var(--surface)",
                color: "var(--text-primary)",
              }}
            >
              {activeTool && (
                <div
                  className="flex items-center gap-2 mb-2 text-xs"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <span className="animate-spin">⚙️</span>
                  Using {activeTool}…
                </div>
              )}
              {streamContent ? (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {streamContent}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="animate-pulse">●</span>
                  <span className="animate-pulse delay-100">●</span>
                  <span className="animate-pulse delay-200">●</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div
        className="px-4 py-3 border-t"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about flights, hotels, weather…"
            disabled={streaming}
            rows={1}
            className="flex-1 px-3 py-2 rounded border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
            style={{
              background: "var(--surface)",
              color: "var(--text-primary)",
              borderColor: "var(--border)",
            }}
          />
          <button
            onClick={handleSend}
            disabled={streaming || !input.trim()}
            className="px-4 py-2 rounded text-sm font-semibold text-white"
            style={{
              background:
                streaming || !input.trim()
                  ? "var(--text-tertiary)"
                  : "var(--accent)",
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
