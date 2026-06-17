import { Link } from "react-router-dom";
import { Search, Plus, Trash2, Globe } from "lucide-react";
import { motion } from "framer-motion";
import StatusBadge from "../components/ui/StatusBadge";
import { SkeletonList } from "../components/ui/Skeleton";
import { useLibrary } from "../hooks/useLibrary";

export default function Library() {
  const {
    loading,
    filter,
    search,
    deletingId,
    trips,
    filtered,
    setFilter,
    setSearch,
    handleDelete,
    getFilterCount,
    navigate,
  } = useLibrary();

  return (
    <div className="max-w-6xl mx-auto px-6 pt-16 pb-12 md:py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
            My Trips
          </h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {trips.length} {trips.length === 1 ? "trip" : "trips"} total
          </p>
        </div>
        <button
          onClick={() => navigate("/new")}
          className="px-5 py-2.5 rounded-xl font-medium text-white transition-all hover:shadow-lg hover:scale-105 flex items-center gap-2"
          style={{
            background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
          }}
        >
          <Plus size={18} />
          New Trip
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2"
          style={{ color: "var(--text-tertiary)" }}
        />
        <input
          type="search"
          placeholder="Search by destination or country..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          style={{
            background: "var(--surface)",
            color: "var(--text-primary)",
            borderColor: "var(--border)",
          }}
        />
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2 mb-8 p-1.5 rounded-xl w-fit" style={{ background: "var(--bg)" }}>
        {(["all", "planning", "booked", "completed"] as const).map((s) => {
          const count = getFilterCount(s);
          const isActive = filter === s;
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 capitalize"
              style={{
                background: isActive ? "var(--surface)" : "transparent",
                color: isActive ? "var(--accent)" : "var(--text-secondary)",
                boxShadow: isActive ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              }}
            >
              {s}
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  background: isActive ? "var(--accent-light)" : "var(--border)",
                  color: isActive ? "var(--accent)" : "var(--text-tertiary)",
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <SkeletonList count={4} />
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          {trips.length === 0 ? (
            <div className="max-w-lg mx-auto">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ background: "var(--accent-light)" }}
              >
                <Globe size={40} style={{ color: "var(--accent)" }} />
              </div>
              <h2 className="text-2xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>
                Start Your Adventure
              </h2>
              <p className="text-base mb-8" style={{ color: "var(--text-secondary)" }}>
                Create your first trip and let AI plan your perfect itinerary with flights, hotels,
                and attractions.
              </p>
              <Link
                to="/new"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all hover:scale-105 hover:shadow-lg"
                style={{
                  background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
                }}
              >
                <Plus size={20} />
                Plan Your First Trip
              </Link>
            </div>
          ) : (
            <p className="text-lg" style={{ color: "var(--text-secondary)" }}>
              No trips match your filter.
            </p>
          )}
        </motion.div>
      ) : (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.1 },
            },
          }}
          className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        >
          {filtered.map((trip) => (
            <motion.div
              key={trip.id}
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 },
              }}
              className="group p-6 rounded-xl border cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1"
              style={{
                borderColor: "var(--border)",
                background: "var(--surface)",
              }}
              onClick={() => navigate(`/trips/${trip.id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h2
                    className="font-bold text-lg truncate group-hover:text-accent transition-colors"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {trip.destination_city}
                  </h2>
                  <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                    {trip.destination_country}
                  </p>
                </div>
                <button
                  onClick={(e) => handleDelete(trip.id, e)}
                  disabled={deletingId === trip.id}
                  className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                  style={{ color: "var(--text-tertiary)" }}
                  title="Delete trip"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <StatusBadge status={trip.status as any} />
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
