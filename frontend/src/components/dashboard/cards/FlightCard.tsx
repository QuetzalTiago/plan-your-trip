interface Flight {
  airline: string;
  departure: string;
  arrival: string;
  duration: number;
  stops: number;
  price: number;
  currency: string;
  carbon_emissions?: {
    this_flight: number;
    typical_for_this_route: number;
    difference_percent: number;
  };
}

interface Props {
  flight: Flight;
}

export default function FlightCard({ flight }: Props) {
  const hours = Math.floor(flight.duration / 60);
  const minutes = flight.duration % 60;

  const carbonDiff = flight.carbon_emissions?.difference_percent ?? 0;
  const carbonColor =
    carbonDiff > 10 ? "text-red-600" : carbonDiff < -10 ? "text-green-600" : "text-gray-600";

  return (
    <div
      className="p-4 rounded-lg border shadow-sm hover:shadow-md transition-shadow"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-bold text-base" style={{ color: "var(--text-primary)" }}>
            ✈️ {flight.airline}
          </h4>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            {flight.departure} → {flight.arrival}
          </p>
        </div>
        <div className="text-right">
          <p className="font-bold text-lg" style={{ color: "var(--accent)" }}>
            {flight.currency} {flight.price}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <span
          className="px-2 py-1 rounded"
          style={{ background: "var(--bg)", color: "var(--text-secondary)" }}
        >
          ⏱️ {hours}h {minutes}m
        </span>
        <span
          className="px-2 py-1 rounded"
          style={{ background: "var(--bg)", color: "var(--text-secondary)" }}
        >
          🔄 {flight.stops} {flight.stops === 1 ? "stop" : "stops"}
        </span>
        {flight.carbon_emissions && (
          <span className={`px-2 py-1 rounded ${carbonColor}`} style={{ background: "var(--bg)" }}>
            🌱 {carbonDiff > 0 ? "+" : ""}
            {carbonDiff}% CO₂
          </span>
        )}
      </div>
    </div>
  );
}
