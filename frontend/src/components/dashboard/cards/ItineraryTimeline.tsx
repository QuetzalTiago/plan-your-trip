interface ItineraryActivity {
  time: string;
  name: string;
  type: string;
  location: string;
  notes?: string;
  cost_estimate?: number | null;
  latitude?: number;
  longitude?: number;
}

interface DayPlan {
  day: number;
  activities: ItineraryActivity[];
}

interface Itinerary {
  destination: string;
  total_days: number;
  trip_style: string;
  day_plans: DayPlan[];
  notes?: string;
}

interface Props {
  itinerary: Itinerary;
}

export default function ItineraryTimeline({ itinerary }: Props) {
  return (
    <div
      className="p-4 rounded-lg border shadow-sm"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div className="mb-4">
        <h4
          className="font-bold text-base"
          style={{ color: "var(--text-primary)" }}
        >
          📅 {itinerary.total_days}-Day Itinerary: {itinerary.destination}
        </h4>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Style: {itinerary.trip_style}
        </p>
      </div>

      <div className="space-y-4">
        {itinerary.day_plans.map((day) => (
          <div
            key={day.day}
            className="relative pl-6 border-l-2"
            style={{ borderColor: "var(--accent)" }}
          >
            <div
              className="absolute -left-2 top-0 w-4 h-4 rounded-full"
              style={{ background: "var(--accent)" }}
            />
            <div className="mb-3">
              <h5
                className="font-semibold text-sm"
                style={{ color: "var(--text-primary)" }}
              >
                Day {day.day}
              </h5>
            </div>

            <div className="space-y-2">
              {day.activities.map((activity, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded"
                  style={{ background: "var(--bg)" }}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className="text-xs font-mono shrink-0"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {activity.time}
                    </span>
                    <div className="flex-1">
                      <p
                        className="text-sm font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {activity.type === "attraction" ? "🎯" : "🎭"}{" "}
                        {activity.name}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        📍 {activity.location}
                      </p>
                      {activity.notes && (
                        <p
                          className="text-xs mt-1 italic"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          {activity.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {itinerary.notes && (
        <div className="mt-4 p-3 rounded" style={{ background: "var(--bg)" }}>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            💡 {itinerary.notes}
          </p>
        </div>
      )}
    </div>
  );
}
