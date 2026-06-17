import {
  MapPin,
  Calendar,
  Users,
  Mountain,
  Palmtree,
  Landmark,
  Sparkles,
  Plane,
  Loader2,
  Plus,
  Minus,
} from "lucide-react";
import { useTripForm, type TripFormData } from "../../hooks/useTripForm";

interface TripFormProps {
  onSubmit: (data: TripFormData) => void;
  loading?: boolean;
}

export default function TripForm({ onSubmit, loading }: TripFormProps) {
  const {
    selectedDestination,
    selectedOrigin,
    dateFrom,
    dateTo,
    travelersCount,
    budgetRange,
    tripStyle,
    errors,
    today,
    canSubmit,
    setSelectedDestination,
    setSelectedOrigin,
    setBudgetRange,
    setTripStyle,
    handleSubmit,
    handleDateFromChange,
    handleDateToChange,
    incrementTravelers,
    decrementTravelers,
    destinations,
    origins,
  } = useTripForm({ onSubmit, loading });

  const tripStyleOptions = [
    { value: "adventure", label: "Adventure", icon: Mountain },
    { value: "relaxation", label: "Relaxation", icon: Palmtree },
    { value: "cultural", label: "Cultural", icon: Landmark },
    { value: "mixed", label: "Mixed", icon: Sparkles },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Row 1: Destination and Origin */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Destination */}
        <div>
          <label
            className="block text-sm font-semibold mb-3"
            style={{ color: "var(--text-primary)" }}
          >
            Where do you want to go? *
          </label>
          <div className="relative">
            <MapPin
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "var(--text-tertiary)" }}
            />
            <select
              value={selectedDestination}
              onChange={(e) => setSelectedDestination(e.target.value)}
              required
              className="w-full pl-12 pr-4 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent appearance-none"
              style={{
                background: "var(--surface)",
                color: "var(--text-primary)",
                borderColor: "var(--border)",
              }}
            >
              <option value="">Select a destination...</option>
              {destinations.map((dest) => (
                <option
                  key={`${dest.city}-${dest.iata}`}
                  value={`${dest.city}, ${dest.country}`}
                >
                  {dest.city}, {dest.country}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Origin (Optional) */}
        <div>
          <label
            className="block text-sm font-semibold mb-3"
            style={{ color: "var(--text-primary)" }}
          >
            Where are you flying from?{" "}
            <span style={{ color: "var(--text-tertiary)" }}>(optional)</span>
          </label>
          <div className="relative">
            <Plane
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "var(--text-tertiary)" }}
            />
            <select
              value={selectedOrigin}
              onChange={(e) => setSelectedOrigin(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent appearance-none"
              style={{
                background: "var(--surface)",
                color: "var(--text-primary)",
                borderColor: "var(--border)",
              }}
            >
              <option value="">Select your origin...</option>
              {origins.map((origin) => (
                <option key={origin.iata} value={origin.city}>
                  {origin.city}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Row 2: Travel Dates (full width) */}
      <div>
        <label
          className="block text-sm font-semibold mb-3"
          style={{ color: "var(--text-primary)" }}
        >
          Travel Dates *
        </label>
        <div className="relative">
          <Calendar
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10"
            style={{ color: "var(--text-tertiary)" }}
          />
          <div
            className={`flex items-center gap-3 w-full pl-12 pr-4 py-3 rounded-xl border transition-all ${
              errors.dateFrom || errors.dateTo
                ? "ring-2 ring-red-500 border-red-500"
                : ""
            }`}
            style={{
              background: "var(--surface)",
              borderColor:
                errors.dateFrom || errors.dateTo ? "#ef4444" : "var(--border)",
            }}
          >
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => handleDateFromChange(e.target.value)}
              min={today}
              required
              placeholder="Start date"
              className="flex-1 bg-transparent outline-none text-sm"
              style={{
                color: dateFrom
                  ? "var(--text-primary)"
                  : "var(--text-tertiary)",
              }}
            />
            <span style={{ color: "var(--text-tertiary)" }}>→</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => handleDateToChange(e.target.value)}
              min={dateFrom || today}
              required
              placeholder="End date"
              className="flex-1 bg-transparent outline-none text-sm"
              style={{
                color: dateTo ? "var(--text-primary)" : "var(--text-tertiary)",
              }}
            />
          </div>
        </div>
        {(errors.dateFrom || errors.dateTo) && (
          <p className="mt-2 text-sm" style={{ color: "#ef4444" }}>
            {errors.dateFrom || errors.dateTo}
          </p>
        )}
      </div>

      {/* Row 3: Travelers and Budget */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Number of Travelers */}
        <div>
          <label
            className="block text-sm font-semibold mb-3"
            style={{ color: "var(--text-primary)" }}
          >
            Number of Travelers
          </label>
          <div
            className="flex items-center justify-between p-4 rounded-xl border"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
            }}
          >
            <div className="flex items-center gap-3">
              <Users size={20} style={{ color: "var(--text-secondary)" }} />
              <span
                className="text-sm font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                {travelersCount} {travelersCount === 1 ? "person" : "people"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={decrementTravelers}
                disabled={travelersCount <= 1}
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-all disabled:opacity-30"
                style={{
                  background: "var(--accent-light)",
                  color: "var(--accent)",
                }}
              >
                <Minus size={16} />
              </button>
              <button
                type="button"
                onClick={incrementTravelers}
                disabled={travelersCount >= 20}
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-all disabled:opacity-30"
                style={{
                  background: "var(--accent-light)",
                  color: "var(--accent)",
                }}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Budget Range (Segmented Control) */}
        <div>
          <label
            className="block text-sm font-semibold mb-3"
            style={{ color: "var(--text-primary)" }}
          >
            Budget Range
          </label>
          <div
            className="flex gap-2 p-1.5 rounded-xl"
            style={{ background: "var(--bg)" }}
          >
            {[
              { value: "low", label: "Budget" },
              { value: "mid", label: "Mid-range" },
              { value: "high", label: "Luxury" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setBudgetRange(option.value)}
                className="flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all"
                style={{
                  background:
                    budgetRange === option.value
                      ? "var(--surface)"
                      : "transparent",
                  color:
                    budgetRange === option.value
                      ? "var(--accent)"
                      : "var(--text-secondary)",
                  boxShadow:
                    budgetRange === option.value
                      ? "0 1px 3px rgba(0,0,0,0.1)"
                      : "none",
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Row 4: Trip Style (full width) */}
      <div>
        <label
          className="block text-sm font-semibold mb-3"
          style={{ color: "var(--text-primary)" }}
        >
          Trip Style
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {tripStyleOptions.map((option) => {
            const isSelected = tripStyle === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setTripStyle(option.value)}
                className="p-4 rounded-xl border-2 transition-all hover:scale-105"
                style={{
                  borderColor: isSelected ? "var(--accent)" : "var(--border)",
                  background: isSelected
                    ? "var(--accent-light)"
                    : "var(--surface)",
                }}
              >
                <div
                  className="text-sm font-medium"
                  style={{
                    color: isSelected ? "var(--accent)" : "var(--text-primary)",
                  }}
                >
                  {option.label}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full py-3.5 rounded-xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg flex items-center justify-center gap-2"
        style={{
          background:
            "linear-gradient(135deg, var(--accent), var(--accent-hover))",
        }}
      >
        {loading ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            Creating your trip...
          </>
        ) : (
          "Start Planning"
        )}
      </button>
    </form>
  );
}
