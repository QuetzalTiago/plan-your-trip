const BASE_URL = import.meta.env.VITE_API_URL ?? "";

// ─── Generic fetch wrapper ─────────────────────────────────────────────────

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, headers: extraHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((extraHeaders as Record<string, string>) ?? {}),
  };

  // Local dev: use X-User-Id header
  if ((!token || token === "") && import.meta.env.DEV) {
    headers["X-User-Id"] = import.meta.env.VITE_USER_ID || "00000000-0000-0000-0000-000000000001";
  } else if (token) {
    headers["Authorization"] = `Bearer ${token}`;
    console.log(
      "[API] Sending request to:",
      `${BASE_URL}${path}`,
      "with token:",
      token.substring(0, 50) + "..."
    );
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...rest, headers });

  console.log("[API] Response status:", res.status, res.statusText);

  if (!res.ok) {
    // API Gateway returns HTML error pages for auth failures, not JSON
    const contentType = res.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      throw new Error(body.message ?? `HTTP ${res.status}`);
    } else {
      // HTML error response (likely 401 from API Gateway)
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
  }

  // Handle 204 No Content responses (e.g., DELETE requests)
  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

// ─── Trip API ─────────────────────────────────────────────────────────────────

export interface CreateTripRequest {
  destination_city: string;
  destination_country: string;
  destination_iata?: string;
  origin_city?: string;
  origin_iata?: string;
  date_from?: string | null;
  date_to?: string | null;
  travelers_count?: number;
  budget_range?: string;
  trip_style?: string;
}

export interface TripResponse {
  id: string;
  title: string;
  destination_city: string;
  destination_country: string;
  destination_iata: string;
  origin_city: string;
  origin_iata: string;
  date_from: string | null;
  date_to: string | null;
  travelers_count: number;
  budget_range: string;
  trip_style: string;
  status: string;
  created_at: number;
  updated_at: number;
  auto_planning_enabled?: boolean;
}

export async function createTrip(data: CreateTripRequest, token?: string): Promise<TripResponse> {
  return apiFetch<TripResponse>("/trips", {
    method: "POST",
    body: JSON.stringify(data),
    token,
  });
}

export interface TripListItem {
  id: string;
  title: string;
  destination_city: string;
  destination_country: string;
  status: string;
  created_at: number;
}

export async function listTrips(token?: string): Promise<TripListItem[]> {
  return apiFetch<TripListItem[]>("/trips", { token });
}

export async function getTrip(id: string, token?: string): Promise<TripResponse> {
  return apiFetch<TripResponse>(`/trips/${id}`, { token });
}

export interface TripEvent {
  id: string;
  timestamp: number;
  tool: string;
  args: Record<string, unknown>;
  result: Record<string, unknown>;
  duration: number;
}

export async function getTripEvents(tripId: string, token?: string): Promise<TripEvent[]> {
  return apiFetch<TripEvent[]>(`/trips/${tripId}/events`, { token });
}

export async function updateTripStatus(
  id: string,
  status: string,
  token?: string
): Promise<TripResponse> {
  return apiFetch<TripResponse>(`/trips/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
    token,
  });
}

export async function deleteTrip(id: string, token?: string): Promise<void> {
  await apiFetch<void>(`/trips/${id}`, { method: "DELETE", token });
}

// ─── Chat (SSE streaming) ─────────────────────────────────────────────────────

export function streamChat(
  tripId: string,
  message: string,
  token: string | undefined,
  onChunk: (chunk: string) => void,
  onToolCall: (toolName: string) => void,
  onDebugEvent: (event: {
    timestamp: number;
    tool: string;
    args: Record<string, unknown>;
    result: Record<string, unknown>;
    duration: number;
  }) => void,
  onDone: () => void,
  onError: (err: Error) => void
): () => void {
  const url = `${BASE_URL}/trips/${tripId}/chat`;
  const aborter = new AbortController();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Local dev: use X-User-Id header
  if ((!token || token === "") && import.meta.env.DEV) {
    headers["X-User-Id"] = import.meta.env.VITE_USER_ID || "00000000-0000-0000-0000-000000000001";
  } else if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ message }),
    signal: aborter.signal,
  })
    .then(async (res) => {
      if (!res.ok || !res.body) {
        const body = (await res.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new Error(body.message ?? `HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const event of events) {
          const dataLines = event
            .split("\n")
            .filter((l) => l.startsWith("data: ") || l === "data:")
            .map((l) => l.slice(6));
          if (dataLines.length === 0) continue;
          const data = dataLines.join("\n");

          if (data === "[DONE]") {
            onDone();
            return;
          }
          if (data.startsWith("[ERROR]")) {
            onError(new Error(data.slice(8)));
            return;
          }

          // Parse structured events from backend
          try {
            const event = JSON.parse(data);

            switch (event.type) {
              case "text":
                // Regular text content
                const toolMatch = event.content.match(/🔧 _Using tool: (.+?)\.\.\._/);
                if (toolMatch) {
                  onToolCall(toolMatch[1]);
                }
                onChunk(event.content);
                break;

              case "debug":
                // Debug event for visualization panel
                onDebugEvent({
                  timestamp: event.timestamp,
                  tool: event.tool,
                  args: event.args,
                  result: event.result,
                  duration: event.duration,
                });
                break;

              case "widget":
                // Widget data (map, chart, etc.) - render as-is
                onChunk(JSON.stringify(event.data));
                break;

              case "tool_call":
                // Internal tool call data - don't render in chat
                // Just log or ignore
                console.log("[Tool Call]", event.data.name, event.data.args);
                break;

              default:
                // Unknown event type - render as text for safety
                console.warn("[Unknown event type]", event.type);
                onChunk(JSON.stringify(event));
            }
          } catch {
            // Not JSON or malformed - treat as legacy plain text
            const toolMatch = data.match(/🔧 _Using tool: (.+?)\.\.\._/);
            if (toolMatch) {
              onToolCall(toolMatch[1]);
            }
            onChunk(data);
          }
        }
      }
      onDone();
    })
    .catch((err: unknown) => {
      if (err instanceof Error && err.name !== "AbortError") {
        onError(err);
      }
    });

  return () => aborter.abort();
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export interface MessageResponse {
  id: string;
  trip_id: string;
  role: string;
  content: string;
  tool_name: string | null;
  created_at: number;
}

export async function getMessages(
  tripId: string,
  token?: string,
  after: number = 0
): Promise<MessageResponse[]> {
  const params = after ? `?after=${after}` : "";
  return apiFetch<MessageResponse[]>(`/trips/${tripId}/messages${params}`, {
    token,
  });
}

// ─── Itinerary ────────────────────────────────────────────────────────────────

export interface ItineraryResponse {
  version: number;
  days: Array<{
    date: string;
    activities: Array<{
      time: string;
      name: string;
      type: string;
      location: string;
      notes: string;
      cost_estimate: number | null;
      latitude: number | null;
      longitude: number | null;
    }>;
  }>;
  flights: Array<{
    airline: string;
    departure: string;
    arrival: string;
    duration: string;
    stops: number;
    price: number;
    currency: string;
  }>;
  hotels: Array<{
    name: string;
    rating: number | null;
    price_per_night: number | null;
    currency: string;
    latitude: number | null;
    longitude: number | null;
  }>;
  estimated_total_cost: number | null;
  currency: string;
  created_at: number;
}

export async function getItinerary(
  tripId: string,
  token?: string
): Promise<ItineraryResponse | null> {
  return apiFetch<ItineraryResponse | null>(`/trips/${tripId}/itinerary`, {
    token,
  });
}

// ─── Export ───────────────────────────────────────────────────────────────────

export async function exportTrip(tripId: string, token: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/export/${tripId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.text();
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface SignInResponse {
  message: string;
}

export async function requestMagicLink(email: string): Promise<SignInResponse> {
  return apiFetch<SignInResponse>("/auth/magic-link", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export interface TokenResponse {
  idToken: string;
  user: { id: string; email: string; plan: string };
}

export async function verifyMagicLink(token: string): Promise<TokenResponse> {
  return apiFetch<TokenResponse>(`/auth/verify?token=${encodeURIComponent(token)}`);
}
