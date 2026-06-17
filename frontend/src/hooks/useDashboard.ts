import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import {
  getTrip,
  getMessages,
  getTripEvents,
  streamChat,
  updateTripStatus,
  deleteTrip,
} from "../api/client";
import type { Trip, Message } from "../types";

export function useDashboard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    token,
    messages,
    setMessages,
    addMessage,
    streaming,
    setStreaming,
    appendStream,
    clearStream,
    setActiveTool,
    streamContent,
    activeTool,
    tripEvents,
    setTripEvents,
    addTripEvent,
    clearTripEvents,
    removeTrip,
  } = useStore();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const autoTriggeredRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load trip data
  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const remote = await getTrip(id!, token);
        if (!cancelled) {
          setTrip({
            id: remote.id,
            title: remote.title,
            destinationCity: remote.destination_city,
            destinationCountry: remote.destination_country,
            destinationIata: remote.destination_iata,
            originCity: remote.origin_city,
            originIata: remote.origin_iata,
            dateFrom: remote.date_from,
            dateTo: remote.date_to,
            travelersCount: remote.travelers_count,
            budgetRange: remote.budget_range as Trip["budgetRange"],
            tripStyle: remote.trip_style as Trip["tripStyle"],
            status: remote.status as Trip["status"],
            createdAt: remote.created_at,
            updatedAt: remote.updated_at,
            synced: true,
          });
        }

        const remoteMsgs = await getMessages(id!, token);
        if (!cancelled) {
          setMessages(
            remoteMsgs.map((m) => ({
              id: m.id,
              tripId: m.trip_id,
              role: m.role as Message["role"],
              content: m.content,
              toolName: m.tool_name ?? undefined,
              createdAt: m.created_at,
            })),
          );
        }

        const events = await getTripEvents(id!, token);
        if (!cancelled) {
          setTripEvents(events);
        }
      } catch (err) {
        console.error("Failed to load trip:", err);
      }
      if (!cancelled) setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id, token, setMessages, setTripEvents]);

  // Auto-trigger initial planning
  useEffect(() => {
    if (
      !loading &&
      trip &&
      trip.autoPlanningEnabled !== false &&
      messages.length === 0 &&
      !autoTriggeredRef.current &&
      !streaming
    ) {
      autoTriggeredRef.current = true;

      const initialMessage = `Plan my complete trip to ${trip.destinationCity}, ${trip.destinationCountry}. Please search for the best flights${trip.originCity ? ` from ${trip.originCity}` : ""}${trip.dateFrom && trip.dateTo ? ` for ${trip.dateFrom} to ${trip.dateTo}` : ""}, find suitable hotels${trip.budgetRange ? ` within a ${trip.budgetRange} budget` : ""}, and create a detailed day-by-day itinerary with activities. I'm traveling with ${trip.travelersCount} ${trip.travelersCount === 1 ? "person" : "people"} and prefer a ${trip.tripStyle} style trip.`;

      const userMsg: Message = {
        id: crypto.randomUUID(),
        tripId: trip.id,
        role: "user",
        content: initialMessage,
        createdAt: Date.now(),
      };
      addMessage(userMsg);

      setStreaming(true);
      clearStream();

      streamChat(
        trip.id,
        initialMessage,
        token,
        (chunk) => appendStream(chunk),
        (toolName) => setActiveTool(toolName),
        (event) => addTripEvent(event),
        async () => {
          setStreaming(false);
          try {
            const remoteMsgs = await getMessages(trip.id, token);
            setMessages(
              remoteMsgs.map((m) => ({
                id: m.id,
                tripId: m.trip_id,
                role: m.role as Message["role"],
                content: m.content,
                toolName: m.tool_name ?? undefined,
                createdAt: m.created_at,
              })),
            );
            clearStream();
          } catch (err) {
            console.error("Failed to fetch messages:", err);
            clearStream();
          }
        },
        (err) => {
          const errMsg: Message = {
            id: crypto.randomUUID(),
            tripId: trip.id,
            role: "assistant",
            content: `Error: ${err.message}`,
            createdAt: Date.now(),
          };
          addMessage(errMsg);
          setStreaming(false);
          clearStream();
        },
      );
    }
  }, [
    loading,
    trip,
    messages.length,
    streaming,
    token,
    addMessage,
    appendStream,
    clearStream,
    setActiveTool,
    setStreaming,
    setMessages,
    addTripEvent,
  ]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (!bottomRef.current) return;

    if ((!loading && messages.length > 0) || !chatCollapsed) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      }, 100);
    } else {
      bottomRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, streamContent, streaming, loading, chatCollapsed]);

  // Handle send message
  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || streaming || !trip) return;
    setInput("");

    const userMsg: Message = {
      id: crypto.randomUUID(),
      tripId: trip.id,
      role: "user",
      content: text,
      createdAt: Date.now(),
    };
    addMessage(userMsg);

    setStreaming(true);
    clearStream();

    streamChat(
      trip.id,
      text,
      token,
      (chunk) => appendStream(chunk),
      (toolName) => setActiveTool(toolName),
      (event) => addTripEvent(event),
      async () => {
        setStreaming(false);
        try {
          const remoteMsgs = await getMessages(trip.id, token);
          setMessages(
            remoteMsgs.map((m) => ({
              id: m.id,
              tripId: m.trip_id,
              role: m.role as Message["role"],
              content: m.content,
              toolName: m.tool_name ?? undefined,
              createdAt: m.created_at,
            })),
          );
          clearStream();
        } catch (err) {
          console.error("Failed to fetch messages:", err);
          clearStream();
        }
      },
      (err) => {
        const errMsg: Message = {
          id: crypto.randomUUID(),
          tripId: trip.id,
          role: "assistant",
          content: `Error: ${err.message}`,
          createdAt: Date.now(),
        };
        addMessage(errMsg);
        setStreaming(false);
        clearStream();
      },
    );
  }, [input, streaming, trip, token, addMessage, appendStream, clearStream, setActiveTool, setStreaming, setMessages, addTripEvent]);

  const handleExportData = useCallback(() => {
    const dataStr = JSON.stringify(tripEvents, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `trip-data-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [tripEvents]);

  const handleDelete = useCallback(async () => {
    if (!trip) return;
    if (!confirm(`Delete "${trip.title}"? This cannot be undone.`)) return;

    try {
      await deleteTrip(trip.id, token);
      setMessages([]);
      clearTripEvents();
      removeTrip(trip.id);
      navigate("/library");
    } catch (err) {
      console.error("Failed to delete trip:", err);
      alert("Failed to delete trip. Please try again.");
    }
  }, [trip, token, setMessages, clearTripEvents, removeTrip, navigate]);

  const handleUpdateStatus = useCallback(async (status: string) => {
    if (!trip) return;
    try {
      await updateTripStatus(trip.id, status, token);
      setTrip({ ...trip, status: status as Trip["status"] });
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  }, [trip, token]);

  return {
    // State
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

    // Actions
    setInput,
    setChatCollapsed,
    handleSend,
    handleExportData,
    handleDelete,
    handleUpdateStatus,
  };
}
