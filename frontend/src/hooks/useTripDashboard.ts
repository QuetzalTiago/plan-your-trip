import { useState, useRef, useEffect, useMemo } from "react";

interface TripEvent {
  id: string;
  timestamp: number;
  tool: string;
  args: Record<string, unknown>;
  result: Record<string, unknown>;
  duration: number;
}

interface UseTripDashboardProps {
  events: TripEvent[];
}

export function useTripDashboard({ events }: UseTripDashboardProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["flights", "hotels", "attractions", "activities", "itinerary"]),
  );
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target as Node)
      ) {
        setIsStatusDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleSection = (section: string) => {
    const newSet = new Set(expandedSections);
    if (newSet.has(section)) {
      newSet.delete(section);
    } else {
      newSet.add(section);
    }
    setExpandedSections(newSet);
  };

  // Group events by tool type using useMemo for performance
  const eventGroups = useMemo(() => {
    const flightEvents = events.filter(
      (e) => e.tool === "search_flights" || e.tool === "search_cheapest_dates",
    );
    const hotelEvents = events.filter(
      (e) => e.tool === "search_hotels" || e.tool === "get_hotel_ratings",
    );
    const attractionEvents = events.filter((e) => e.tool === "get_attractions");
    const activityEvents = events.filter(
      (e) => e.tool === "get_tours_activities",
    );
    const itineraryEvents = events.filter(
      (e) => e.tool === "build_day_itinerary",
    );

    return {
      flightEvents,
      hotelEvents,
      attractionEvents,
      activityEvents,
      itineraryEvents,
    };
  }, [events]);

  // Count total items using useMemo
  const counts = useMemo(() => {
    const totalFlights = eventGroups.flightEvents.reduce((sum, e) => {
      const result = e.result as { flights?: unknown[] };
      return sum + (result.flights?.length ?? 0);
    }, 0);

    const totalHotels = eventGroups.hotelEvents.reduce((sum, e) => {
      const result = e.result as { hotels?: unknown[] };
      return sum + (result.hotels?.length ?? 0);
    }, 0);

    const totalAttractions = eventGroups.attractionEvents.reduce((sum, e) => {
      const result = e.result as { attractions?: unknown[] };
      return sum + (result.attractions?.length ?? 0);
    }, 0);

    const totalActivities = eventGroups.activityEvents.reduce((sum, e) => {
      const result = e.result as { activities?: unknown[] };
      return sum + (result.activities?.length ?? 0);
    }, 0);

    return {
      totalFlights,
      totalHotels,
      totalAttractions,
      totalActivities,
    };
  }, [eventGroups]);

  return {
    // State
    expandedSections,
    isStatusDropdownOpen,
    statusDropdownRef,

    // Derived data
    eventGroups,
    counts,

    // Actions
    toggleSection,
    setIsStatusDropdownOpen,
  };
}
