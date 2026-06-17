import { create } from "zustand";
import type { User, Message } from "../types";

interface TripListItem {
  id: string;
  title: string;
  destination_city: string;
  destination_country: string;
  status: string;
  created_at: number;
}

interface AppState {
  user: User | null;
  token: string | undefined;
  /** Whether an AI agent stream is currently active */
  streaming: boolean;
  /** Accumulated streamed content for the active chat response */
  streamContent: string;
  /** Which tool the agent is currently using (shown in UI) */
  activeTool: string | null;
  /** Chat messages for the current trip */
  messages: Message[];
  /** Active dashboard tab: "chat" or "insights" */
  dashboardTab: "chat" | "insights";
  /** Trip events from tool executions */
  tripEvents: Array<{
    id: string;
    timestamp: number;
    tool: string;
    args: Record<string, unknown>;
    result: Record<string, unknown>;
    duration: number;
  }>;
  /** Cached trips list */
  trips: TripListItem[];

  setUser: (user: User | null) => void;
  setToken: (token: string | undefined) => void;
  setStreaming: (streaming: boolean) => void;
  appendStream: (chunk: string) => void;
  clearStream: () => void;
  setActiveTool: (tool: string | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setDashboardTab: (tab: "chat" | "insights") => void;
  setTripEvents: (events: AppState["tripEvents"]) => void;
  addTripEvent: (event: {
    timestamp: number;
    tool: string;
    args: Record<string, unknown>;
    result: Record<string, unknown>;
    duration: number;
  }) => void;
  clearTripEvents: () => void;
  setTrips: (trips: TripListItem[]) => void;
  addTrip: (trip: TripListItem) => void;
  removeTrip: (tripId: string) => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  token: (() => {
    try {
      return sessionStorage.getItem("pyj_token") || undefined;
    } catch {
      return undefined;
    }
  })(),
  streaming: false,
  streamContent: "",
  activeTool: null,
  messages: [],
  dashboardTab: "chat",
  tripEvents: [],
  trips: [],

  setUser: (user) => set({ user }),

  setToken: (token) => {
    set({ token });
    try {
      if (token) {
        sessionStorage.setItem("pyj_token", token);
      } else {
        sessionStorage.removeItem("pyj_token");
      }
    } catch {
      /* sessionStorage unavailable */
    }
  },

  setStreaming: (streaming) => set({ streaming }),
  appendStream: (chunk) => set((s) => ({ streamContent: s.streamContent + chunk })),
  clearStream: () => set({ streamContent: "", activeTool: null }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((s) => ({ messages: [...s.messages, message] })),
  setDashboardTab: (tab) => set({ dashboardTab: tab }),
  setTripEvents: (events) => set({ tripEvents: events }),
  addTripEvent: (event) =>
    set((s) => ({
      tripEvents: [...s.tripEvents, { ...event, id: crypto.randomUUID() }],
    })),
  clearTripEvents: () => set({ tripEvents: [] }),
  setTrips: (trips) => set({ trips }),
  addTrip: (trip) => set((s) => ({ trips: [trip, ...s.trips] })),
  removeTrip: (tripId) => set((s) => ({ trips: s.trips.filter((t) => t.id !== tripId) })),
}));
