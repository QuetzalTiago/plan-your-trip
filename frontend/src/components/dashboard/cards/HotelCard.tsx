interface Hotel {
  name: string;
  hotel_id?: string;
  rating: number | null;
  reviews: number;
  price_per_night: string;
  currency?: string;
  description?: string;
  amenities?: string[];
  type?: string;
}

interface Props {
  hotel: Hotel;
}

export default function HotelCard({ hotel }: Props) {
  const rating = hotel.rating ?? 0;
  const stars = "⭐".repeat(Math.round(rating));

  return (
    <div
      className="p-4 rounded-lg border shadow-sm hover:shadow-md transition-shadow"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h4 className="font-bold text-base" style={{ color: "var(--text-primary)" }}>
            🏨 {hotel.name}
          </h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm">{stars}</span>
            {hotel.reviews > 0 && (
              <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                ({hotel.reviews.toLocaleString()} reviews)
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-lg" style={{ color: "var(--accent)" }}>
            {hotel.price_per_night}
          </p>
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            per night
          </p>
        </div>
      </div>

      {hotel.description && (
        <p className="text-sm mb-2 line-clamp-2" style={{ color: "var(--text-secondary)" }}>
          {hotel.description}
        </p>
      )}

      {hotel.amenities && hotel.amenities.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {hotel.amenities.slice(0, 5).map((amenity, i) => (
            <span
              key={i}
              className="text-xs px-2 py-0.5 rounded"
              style={{
                background: "var(--bg)",
                color: "var(--text-secondary)",
              }}
            >
              {amenity}
            </span>
          ))}
          {hotel.amenities.length > 5 && (
            <span className="text-xs px-2 py-0.5" style={{ color: "var(--text-tertiary)" }}>
              +{hotel.amenities.length - 5} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}
