import { NavLink } from "react-router-dom";
import type { Trip } from "../../types";
import { Plus, ChevronLeft, ChevronRight, X } from "lucide-react";
import StatusBadge from "../ui/StatusBadge";
import { useSidebar } from "../../hooks/useSidebar";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({ isOpen, onClose, isCollapsed, onToggleCollapse }: SidebarProps) {
  const { user, trips, loading, handleSignOut, handleNavigation } = useSidebar({ onClose });

  if (isCollapsed) {
    return (
      <button
        onClick={onToggleCollapse}
        className="fixed left-0 top-4 z-20 p-2 rounded-r-lg transition-all hover:shadow-md"
        style={{
          background: "var(--surface)",
          borderRight: "1px solid var(--border)",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
          color: "var(--text-tertiary)",
        }}
        aria-label="Expand sidebar"
      >
        <ChevronRight size={20} />
      </button>
    );
  }

  return (
    <aside
      className={[
        "shrink-0 flex flex-col h-full px-6 py-6 shadow-lg",
        "fixed inset-y-0 left-0 z-20 w-72 transition-transform duration-300",
        isOpen ? "translate-x-0" : "-translate-x-full",
        "md:static md:inset-auto md:z-auto md:w-64 md:translate-x-0 md:transition-none md:shadow-none",
        !isOpen ? "md:hidden" : "",
      ].join(" ")}
      style={{ background: "var(--bg-sidebar)" }}
    >
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-2 group" onClick={handleNavigation}>
          <span
            className="text-lg font-semibold transition-colors group-hover:text-accent"
            style={{ color: "var(--text-primary)" }}
          >
            Plan Your Journey
          </span>
        </NavLink>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleCollapse}
            className="hidden md:flex w-8 h-8 items-center justify-center rounded-lg hover:bg-surface-hover transition-colors"
            style={{ color: "var(--text-tertiary)" }}
            aria-label="Collapse sidebar"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-hover transition-colors"
            style={{ color: "var(--text-tertiary)" }}
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* New Trip Button */}
      <NavLink
        to="/new"
        onClick={handleNavigation}
        className="w-full mb-6 px-4 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all hover:scale-105 hover:shadow-md"
        style={{
          background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
          color: "white",
        }}
      >
        <Plus size={18} />
        New Trip
      </NavLink>

      {/* Trips List */}
      <nav className="flex-1 overflow-hidden flex flex-col">
        <h3
          className="text-xs font-semibold uppercase tracking-wider mb-3 px-2"
          style={{ color: "var(--text-tertiary)" }}
        >
          Your Trips
        </h3>
        <div className="flex-1 overflow-y-auto space-y-1">
          {loading ? (
            <div className="px-3 py-3 text-sm" style={{ color: "var(--text-secondary)" }}>
              Loading trips...
            </div>
          ) : trips.length === 0 ? (
            <div className="px-3 py-4 text-sm" style={{ color: "var(--text-secondary)" }}>
              No trips yet. Create your first trip!
            </div>
          ) : (
            trips.map((trip) => (
              <NavLink
                key={trip.id}
                to={`/trips/${trip.id}`}
                className={({ isActive }) =>
                  [
                    "block px-3 py-3 rounded-lg text-sm transition-all relative",
                    isActive ? "bg-accent-light shadow-sm" : "hover:bg-surface-hover",
                  ].join(" ")
                }
                onClick={handleNavigation}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div
                        className="absolute left-0 top-2 bottom-2 w-1 rounded-r"
                        style={{ background: "var(--accent)" }}
                      />
                    )}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div
                          className="font-medium truncate"
                          style={{
                            color: isActive ? "var(--accent)" : "var(--text-primary)",
                          }}
                        >
                          {trip.destination_city}
                        </div>
                        <div
                          className="text-xs truncate mt-0.5"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {trip.destination_country}
                        </div>
                      </div>
                      <StatusBadge status={trip.status as Trip["status"]} showLabel={false} />
                    </div>
                  </>
                )}
              </NavLink>
            ))
          )}
        </div>
      </nav>

      {/* User Section */}
      {user && (
        <div className="border-t pt-4 mt-4" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white text-sm"
              style={{
                background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
              }}
            >
              {user.email[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div
                className="text-sm font-medium truncate"
                style={{ color: "var(--text-primary)" }}
              >
                {user.email}
              </div>
              <div
                className="text-xs px-2 py-0.5 rounded-full inline-block mt-1"
                style={{
                  background: "var(--accent-light)",
                  color: "var(--accent)",
                }}
              >
                {user.plan}
              </div>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="text-sm text-left transition-colors hover:text-accent w-full"
            style={{ color: "var(--text-secondary)" }}
          >
            Sign out
          </button>
        </div>
      )}
    </aside>
  );
}
