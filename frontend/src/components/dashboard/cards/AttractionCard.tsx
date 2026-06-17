interface Attraction {
  name: string;
  category?: string;
  rating: number | null;
  reviews: number;
  address: string;
  hours?: string;
  latitude?: number;
  longitude?: number;
}

interface Props {
  attraction: Attraction;
}

export default function AttractionCard({ attraction }: Props) {
  const rating = attraction.rating ?? 0;
  const stars = rating > 0 ? "⭐".repeat(Math.round(rating)) : "";

  return (
    <div
      className="p-3 rounded-lg border shadow-sm hover:shadow-md transition-shadow"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h4 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
            🎯 {attraction.name}
          </h4>
          {attraction.category && (
            <span
              className="inline-block text-xs px-2 py-0.5 rounded mt-1"
              style={{
                background: "var(--bg)",
                color: "var(--text-secondary)",
              }}
            >
              {attraction.category}
            </span>
          )}
        </div>
      </div>

      {rating > 0 && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs">{stars}</span>
          {attraction.reviews > 0 && (
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              ({attraction.reviews} reviews)
            </span>
          )}
        </div>
      )}

      <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>
        📍 {attraction.address}
      </p>

      {attraction.hours && (
        <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          🕐 {attraction.hours}
        </p>
      )}
    </div>
  );
}
