import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import { listTrips } from "../api/client";

interface UseSidebarProps {
  onClose: () => void;
}

export function useSidebar({ onClose }: UseSidebarProps) {
  const { user, setUser, setToken, token, trips, setTrips } = useStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const loadTrips = useCallback(async () => {
    if (!token && !import.meta.env.DEV) {
      console.log("[Sidebar] Skipping trip load - no token and not in dev mode");
      setLoading(false);
      return;
    }

    console.log(
      "[Sidebar] Loading trips... (token:",
      token ? "present" : "none",
      ", dev:",
      import.meta.env.DEV,
      ")"
    );

    try {
      setLoading(true);
      const data = await listTrips(token);
      console.log("[Sidebar] Loaded", data.length, "trips");
      setTrips(data);
    } catch (err) {
      console.error("[Sidebar] Failed to load trips:", err);
    } finally {
      setLoading(false);
    }
  }, [token, setTrips]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  const handleSignOut = useCallback(() => {
    setUser(null);
    setToken(undefined);
    navigate("/signin");
    handleNavigation();
  }, [setUser, setToken, navigate]);

  const handleNavigation = useCallback(() => {
    if (window.innerWidth < 768) {
      onClose();
    }
  }, [onClose]);

  return {
    // State
    user,
    trips,
    loading,

    // Actions
    handleSignOut,
    handleNavigation,
  };
}
