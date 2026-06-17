import {
  Plane,
  Building2,
  MapPin,
  Calendar,
  Download,
  ChevronDown,
  Trash2,
  Check,
} from "lucide-react";
import type { Trip } from "../../types";
import FlightCard from "./cards/FlightCard";
import HotelCard from "./cards/HotelCard";
import AttractionCard from "./cards/AttractionCard";
import ActivityCard from "./cards/ActivityCard";
import ItineraryTimeline from "./cards/ItineraryTimeline";
import { SectionSkeleton } from "../ui/DashboardSkeleton";
import { useTripDashboard } from "../../hooks/useTripDashboard";
import Section from "../ui/Section";
import { statusConfig } from "../../data/statusConfig";

interface TripEvent {
  id: string;
  timestamp: number;
  tool: string;
  args: Record<string, unknown>;
  result: Record<string, unknown>;
  duration: number;
}

interface Props {
  events: TripEvent[];
  onExport: () => void;
  trip: Trip;
  onUpdateStatus: (status: string) => void;
  onDelete?: () => void;
}

// Extract MetricCard component to prevent unnecessary re-renders
const MetricCard = ({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Plane;
  label: string;
  value: number;
}) => (
  <div
    className="p-4 rounded-lg border"
    style={{
      background: "var(--surface)",
      borderColor: "var(--border)",
    }}
  >
    <div className="flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center"
        style={{
          background: "var(--accent)",
          color: "#fff",
        }}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {label}
        </p>
        <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          {value}
        </p>
      </div>
    </div>
  </div>
);

export default function TripDashboard({ events, onExport, trip, onUpdateStatus, onDelete }: Props) {
  const {
    expandedSections,
    isStatusDropdownOpen,
    statusDropdownRef,
    eventGroups,
    counts,
    toggleSection,
    setIsStatusDropdownOpen,
  } = useTripDashboard({ events });

  const { flightEvents, hotelEvents, attractionEvents, activityEvents, itineraryEvents } =
    eventGroups;
  const { totalFlights, totalHotels, totalAttractions, totalActivities } = counts;

  return (
    <div className="h-full flex flex-col" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <div
        className="px-6 py-3 border-b flex items-center flex-shrink-0"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
          minHeight: "70px",
        }}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
              {trip.title}
            </h1>
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {trip.dateFrom && trip.dateTo
                ? `${trip.dateFrom} - ${trip.dateTo}`
                : "Dates flexible"}{" "}
              · {trip.travelersCount} {trip.travelersCount === 1 ? "traveler" : "travelers"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {/* Custom Status Dropdown */}
            <div className="relative" ref={statusDropdownRef}>
              <button
                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border hover:border-gray-300 transition-all duration-200"
                style={{
                  background: "var(--surface)",
                  borderColor: "var(--border)",
                }}
              >
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{
                    background: statusConfig[trip.status].bg,
                    color: statusConfig[trip.status].color,
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: statusConfig[trip.status].color }}
                  />
                  {statusConfig[trip.status].label}
                </span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${isStatusDropdownOpen ? "rotate-180" : ""}`}
                  style={{ color: "var(--text-secondary)" }}
                />
              </button>

              {/* Dropdown Menu */}
              {isStatusDropdownOpen && (
                <div
                  className="absolute top-full right-0 mt-2 w-48 rounded-lg border shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                  style={{
                    background: "var(--surface)",
                    borderColor: "var(--border)",
                  }}
                >
                  {(Object.keys(statusConfig) as Array<keyof typeof statusConfig>).map(
                    (statusKey) => {
                      const status = statusConfig[statusKey];
                      const isSelected = trip.status === statusKey;
                      return (
                        <button
                          key={statusKey}
                          onClick={() => {
                            onUpdateStatus(statusKey);
                            setIsStatusDropdownOpen(false);
                          }}
                          className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-gray-50 transition-colors"
                          style={{
                            background: isSelected ? status.bg : "transparent",
                          }}
                        >
                          <span
                            className="inline-flex items-center gap-2 text-sm font-medium"
                            style={{
                              color: status.color,
                            }}
                          >
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ background: status.color }}
                            />
                            {status.label}
                          </span>
                          {isSelected && (
                            <Check className="w-4 h-4" style={{ color: "var(--accent)" }} />
                          )}
                        </button>
                      );
                    }
                  )}
                </div>
              )}
            </div>
            <button
              onClick={onExport}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border hover:bg-slate-50 transition-colors text-sm font-medium"
              style={{
                borderColor: "var(--border)",
                color: "var(--text-secondary)",
              }}
              title="Export trip data"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            {onDelete && (
              <button
                onClick={onDelete}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border hover:bg-red-50 hover:border-red-300 transition-colors text-sm font-medium"
                style={{
                  borderColor: "var(--border)",
                  color: "var(--text-secondary)",
                }}
                title="Delete trip"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Metrics Summary */}
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard icon={Plane} label="Flights" value={totalFlights} />
            <MetricCard icon={Building2} label="Hotels" value={totalHotels} />
            <MetricCard icon={MapPin} label="Attractions" value={totalAttractions} />
            <MetricCard icon={Calendar} label="Activities" value={totalActivities} />
          </div>
        </div>

        {/* Show skeleton when no data */}
        {events.length === 0 ? (
          <div className="px-6 pb-6 space-y-4">
            <SectionSkeleton icon={Plane} />
            <SectionSkeleton icon={Building2} />
            <SectionSkeleton icon={MapPin} />
            <SectionSkeleton icon={Calendar} />
          </div>
        ) : (
          <>
            {/* Content Sections */}
            <div className="px-6 pb-6 space-y-4">
              <Section
                title="Flights"
                count={totalFlights}
                icon={Plane}
                isExpanded={expandedSections.has("flights")}
                onToggle={() => toggleSection("flights")}
              >
                <div className="grid gap-3 mt-3">
                  {flightEvents.flatMap((event) => {
                    const result = event.result as { flights?: unknown[] };
                    const flights = result.flights ?? [];
                    return flights.map((flight, idx) => (
                      <FlightCard key={`${event.id}-${idx}`} flight={flight as never} />
                    ));
                  })}
                </div>
              </Section>

              <Section
                title="Hotels"
                count={totalHotels}
                icon={Building2}
                isExpanded={expandedSections.has("hotels")}
                onToggle={() => toggleSection("hotels")}
              >
                <div className="grid gap-3 mt-3">
                  {hotelEvents.flatMap((event) => {
                    const result = event.result as { hotels?: unknown[] };
                    const hotels = result.hotels ?? [];
                    return hotels.map((hotel, idx) => (
                      <HotelCard key={`${event.id}-${idx}`} hotel={hotel as never} />
                    ));
                  })}
                </div>
              </Section>

              <Section
                title="Attractions"
                count={totalAttractions}
                icon={MapPin}
                isExpanded={expandedSections.has("attractions")}
                onToggle={() => toggleSection("attractions")}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                  {attractionEvents.flatMap((event) => {
                    const result = event.result as { attractions?: unknown[] };
                    const attractions = result.attractions ?? [];
                    return attractions.map((attraction, idx) => (
                      <AttractionCard key={`${event.id}-${idx}`} attraction={attraction as never} />
                    ));
                  })}
                </div>
              </Section>

              <Section
                title="Activities & Tours"
                count={totalActivities}
                icon={Calendar}
                isExpanded={expandedSections.has("activities")}
                onToggle={() => toggleSection("activities")}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                  {activityEvents.flatMap((event) => {
                    const result = event.result as { activities?: unknown[] };
                    const activities = result.activities ?? [];
                    return activities.map((activity, idx) => (
                      <ActivityCard key={`${event.id}-${idx}`} activity={activity as never} />
                    ));
                  })}
                </div>
              </Section>

              {itineraryEvents.length > 0 && (
                <Section
                  title="Daily Itinerary"
                  count={itineraryEvents.length}
                  icon={Calendar}
                  isExpanded={expandedSections.has("itinerary")}
                  onToggle={() => toggleSection("itinerary")}
                >
                  <div className="space-y-3 mt-3">
                    {itineraryEvents.map((event) => (
                      <ItineraryTimeline key={event.id} itinerary={event.result as never} />
                    ))}
                  </div>
                </Section>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
