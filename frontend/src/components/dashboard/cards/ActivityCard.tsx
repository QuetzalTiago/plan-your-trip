interface Activity {
  name: string;
  description?: string;
  rating: number | null;
  reviews: number;
  address: string;
  hours?: string;
  latitude?: number;
  longitude?: number;
}

interface Props {
  activity: Activity;
}

export default function ActivityCard({ activity }: Props) {
  const rating = activity.rating ?? 0;
  const stars = rating > 0 ? "⭐".repeat(Math.round(rating)) : "";

  return (
    <div
      className="p-3 rounded-lg border shadow-sm hover:shadow-md transition-shadow"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div className="mb-2">
        <h4
          className="font-semibold text-sm"
          style={{ color: "var(--text-primary)" }}
        >
          🎭 {activity.name}
        </h4>
      </div>

      {rating > 0 && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs">{stars}</span>
          {activity.reviews > 0 && (
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              ({activity.reviews.toLocaleString()} reviews)
            </span>
          )}
        </div>
      )}

      {activity.description && (
        <p
          className="text-xs mb-2 line-clamp-2"
          style={{ color: "var(--text-secondary)" }}
        >
          {activity.description}
        </p>
      )}

      <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>
        📍 {activity.address}
      </p>

      {activity.hours && (
        <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          🕐 {activity.hours}
        </p>
      )}
    </div>
  );
}
