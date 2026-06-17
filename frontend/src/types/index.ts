export type BudgetRange = "low" | "mid" | "high";
export type TripStyle = "adventure" | "relaxation" | "cultural" | "mixed";
export type TripStatus = "planning" | "booked" | "completed";
export type MessageRole = "user" | "assistant" | "tool_call" | "tool_result";

export interface Trip {
  id: string;
  title: string;
  destinationCity: string;
  destinationCountry: string;
  destinationIata: string;
  originCity: string;
  originIata: string;
  dateFrom: string | null;
  dateTo: string | null;
  travelersCount: number;
  budgetRange: BudgetRange;
  tripStyle: TripStyle;
  status: TripStatus;
  createdAt: number;
  updatedAt: number;
  synced: boolean;
  autoPlanningEnabled?: boolean; // Whether backend allows auto-planning
}

export interface Message {
  id: string;
  tripId: string;
  role: MessageRole;
  content: string;
  toolName?: string;
  createdAt: number;
}

export interface Activity {
  time: string;
  name: string;
  type: string;
  location: string;
  notes: string;
  costEstimate: number | null;
  latitude: number | null;
  longitude: number | null;
}

export interface DayPlan {
  date: string;
  activities: Activity[];
}

export interface FlightOffer {
  airline: string;
  departure: string;
  arrival: string;
  duration: string;
  stops: number;
  price: number;
  currency: string;
  outbound: string;
  inbound: string;
}

export interface HotelOffer {
  name: string;
  rating: number | null;
  pricePerNight: number | null;
  currency: string;
  address: string;
  amenities: string[];
  latitude: number | null;
  longitude: number | null;
}

export interface Itinerary {
  version: number;
  days: DayPlan[];
  flights: FlightOffer[];
  hotels: HotelOffer[];
  estimatedTotalCost: number | null;
  currency: string;
  createdAt: number;
}

export interface User {
  id: string;
  email: string;
  plan: "free" | "explorer" | "lifetime";
}

export interface DebugEvent {
  id: string;
  timestamp: number;
  tool: string;
  args: Record<string, unknown>;
  result: Record<string, unknown>;
  duration: number;
}
