import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import { createTrip } from "../api/client";
import TripForm from "../components/forms/TripForm";
import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";

export default function Home() {
  const { token, addTrip } = useStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(data: {
    destinationCity: string;
    destinationCountry: string;
    destinationIata: string;
    originCity: string;
    originIata: string;
    dateFrom: string | null;
    dateTo: string | null;
    travelersCount: number;
    budgetRange: string;
    tripStyle: string;
  }) {
    setLoading(true);
    setError(null);
    try {
      // Create trip on backend (uses token in prod, X-User-Id in dev)
      const res = await createTrip(
        {
          destination_city: data.destinationCity,
          destination_country: data.destinationCountry,
          destination_iata: data.destinationIata,
          origin_city: data.originCity,
          origin_iata: data.originIata,
          date_from: data.dateFrom,
          date_to: data.dateTo,
          travelers_count: data.travelersCount,
          budget_range: data.budgetRange,
          trip_style: data.tripStyle,
        },
        token || ""
      );

      // Add the new trip to the sidebar list
      addTrip({
        id: res.id,
        title: res.title,
        destination_city: res.destination_city,
        destination_country: res.destination_country,
        status: res.status,
        created_at: res.created_at,
      });

      navigate(`/trips/${res.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create trip");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-full px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-6xl"
      >
        {/* Heading */}
        <div className="text-center mb-10">
          <h1
            className="text-4xl font-bold mb-3"
            style={{
              background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Plan Your Journey
          </h1>
          <p className="text-lg max-w-xl mx-auto" style={{ color: "var(--text-secondary)" }}>
            Tell us where you want to go and we'll create a personalized itinerary with flights,
            hotels, and activities.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl border flex items-start gap-3"
            style={{
              background: "#fee2e2",
              borderColor: "#fecaca",
              color: "#b91c1c",
            }}
          >
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <div className="text-sm">{error}</div>
          </motion.div>
        )}

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="p-8 rounded-2xl shadow-xl border"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
          }}
        >
          <TripForm onSubmit={handleCreate} loading={loading} />
        </motion.div>
      </motion.div>
    </div>
  );
}
