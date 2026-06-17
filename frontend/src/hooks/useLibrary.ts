import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import { listTrips, deleteTrip } from "../api/client";

type StatusFilter = "all" | "planning" | "booked" | "completed";

export function useLibrary() {
  const { token, setMessages, clearTripEvents, trips, setTrips, removeTrip } = useStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadTrips = useCallback(async () => {
    setLoading(true);
    try {
      console.log("[Library] Fetching trips...");
      const remote = await listTrips(token);
      console.log("[Library] Received trips:", remote);
      setTrips(remote);
    } catch (err) {
      console.error("Failed to load trips:", err);
      setTrips([]);
    } finally {
      setLoading(false);
    }
  }, [token, setTrips]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  const handleDelete = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this trip? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await deleteTrip(id, token);
      removeTrip(id);
      setMessages([]);
      clearTripEvents();
    } catch (err) {
      console.error("Failed to delete trip:", err);
      alert("Failed to delete trip. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }, [token, removeTrip, setMessages, clearTripEvents]);

  // Filter trips using useMemo for performance
  const filtered = useMemo(() => {
    return trips.filter((t) => {
      const matchesStatus = filter === "all" || t.status === filter;
      const matchesSearch =
        search === "" ||
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.destination_city.toLowerCase().includes(search.toLowerCase()) ||
        t.destination_country.toLowerCase().includes(search.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [trips, filter, search]);

  const getFilterCount = useCallback((status: StatusFilter) => {
    if (status === "all") return trips.length;
    return trips.filter((t) => t.status === status).length;
  }, [trips]);

  return {
    // State
    loading,
    filter,
    search,
    deletingId,
    trips,
    filtered,
    
    // Actions
    setFilter,
    setSearch,
    handleDelete,
    getFilterCount,
    navigate,
  };
}
