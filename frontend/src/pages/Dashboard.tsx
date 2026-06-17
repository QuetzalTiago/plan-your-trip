import { MessageCircle, ChevronRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import TripDashboard from "../components/dashboard/TripDashboard";
import { hydrateContent, shouldHideContent } from "../utils/hydrate";
import { replaceCoordinatesWithLinks } from "../utils/coordinates";
import { useDashboard } from "../hooks/useDashboard";

export default function Dashboard() {
  const {
    trip,
    loading,
    input,
    chatCollapsed,
    bottomRef,
    messages,
    streaming,
    streamContent,
    activeTool,
    tripEvents,
    setInput,
    setChatCollapsed,
    handleSend,
    handleExportData,
    handleDelete,
    handleUpdateStatus,
  } = useDashboard();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-sm" style={{ color: "var(--text-secondary)" }}>
          Loading trip…
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p style={{ color: "var(--text-secondary)" }}>Trip not found.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Left: Insights Dashboard (60%) */}
      <div
        className="flex-shrink-0 border-r overflow-hidden"
        style={{
          width: chatCollapsed ? "100%" : "60%",
          borderColor: "var(--border)",
          transition: "width 0.3s ease",
        }}
      >
        <TripDashboard
          events={tripEvents}
          onExport={handleExportData}
          trip={trip}
          onUpdateStatus={handleUpdateStatus}
          onDelete={handleDelete}
        />
      </div>

      {/* Right: Chat Panel (40%) */}
      {!chatCollapsed && (
        <div className="flex flex-col flex-1">
          {/* Chat Header */}
          <div
            className="px-4 py-3 border-b flex items-center justify-between flex-shrink-0"
            style={{
              borderColor: "var(--border)",
              background: "var(--surface)",
              minHeight: "70px",
            }}
          >
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" style={{ color: "var(--accent)" }} />
              <h3 className="font-semibold text-base" style={{ color: "var(--text-primary)" }}>
                AI Assistant
              </h3>
            </div>
            <button
              onClick={() => setChatCollapsed(true)}
              className="p-1.5 rounded hover:bg-slate-100 transition-colors"
              aria-label="Collapse chat"
            >
              <ChevronRight className="w-5 h-5" style={{ color: "var(--text-secondary)" }} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="space-y-4">
              {messages
                .filter((msg) => msg.role !== "tool_call" && msg.role !== "tool_result")
                .map((msg) => ({
                  ...msg,
                  hydrated: hydrateContent(msg.content),
                }))
                .filter((msg) => !shouldHideContent(msg.hydrated))
                .map((msg) => (
                  <div key={msg.id}>
                    {msg.role === "user" ? (
                      <div className="flex justify-end">
                        <div
                          className="max-w-[85%] px-4 py-2.5 rounded-lg text-sm"
                          style={{
                            background: "var(--accent)",
                            color: "#fff",
                          }}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-start">
                        <div
                          className="max-w-[85%] px-4 py-2.5 rounded-lg text-sm prose prose-sm max-w-none"
                          style={{
                            background: "var(--surface)",
                            border: "1px solid var(--border)",
                          }}
                        >
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {replaceCoordinatesWithLinks(
                              msg.hydrated.type === "text" ? msg.hydrated.content : msg.content
                            )}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

              {/* Streaming content */}
              {streaming && streamContent && (
                <div className="flex justify-start">
                  <div
                    className="max-w-[85%] px-4 py-2.5 rounded-lg text-sm prose prose-sm max-w-none"
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {activeTool && (
                      <div
                        className="mb-2 text-xs italic"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Using tool: {activeTool}...
                      </div>
                    )}
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {replaceCoordinatesWithLinks(streamContent)}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>

          {/* Input */}
          <div className="p-4 border-t flex-shrink-0" style={{ borderColor: "var(--border)" }}>
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="Ask about your trip..."
                disabled={streaming}
                className="flex-1 px-3 py-2 rounded-lg border outline-none disabled:opacity-50 text-sm"
                style={{
                  background: "var(--surface)",
                  color: "var(--text-primary)",
                  borderColor: "var(--border)",
                }}
              />
              <button
                onClick={handleSend}
                disabled={streaming || !input.trim()}
                className="px-4 py-2 rounded-lg font-medium disabled:opacity-50 text-sm"
                style={{
                  background: "var(--accent)",
                  color: "#fff",
                }}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expand Chat Button (when collapsed) */}
      {chatCollapsed && (
        <button
          onClick={() => setChatCollapsed(false)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
          style={{
            background: "var(--accent)",
            color: "#fff",
          }}
          aria-label="Open chat"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
