import { useState, useMemo } from "react";
import locationsData from "../data/locations.json";

const DESTINATIONS = locationsData.destinations;
const ORIGINS = locationsData.origins;

export interface TripFormData {
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
}

export interface UseTripFormProps {
  onSubmit: (data: TripFormData) => void;
  loading?: boolean;
}

export interface TripFormErrors {
  dateFrom?: string;
  dateTo?: string;
}

export function useTripForm({ onSubmit, loading }: UseTripFormProps) {
  // Form state
  const [selectedDestination, setSelectedDestination] = useState("");
  const [selectedOrigin, setSelectedOrigin] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [travelersCount, setTravelersCount] = useState(2);
  const [budgetRange, setBudgetRange] = useState("mid");
  const [tripStyle, setTripStyle] = useState("mixed");
  const [errors, setErrors] = useState<TripFormErrors>({});

  // Get today's date in YYYY-MM-DD format for min date
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  // Validation logic
  const validateForm = (): TripFormErrors => {
    const newErrors: TripFormErrors = {};

    if (!dateFrom) {
      newErrors.dateFrom = "Start date is required";
    } else if (dateFrom < today) {
      newErrors.dateFrom = "Start date cannot be in the past";
    }

    if (!dateTo) {
      newErrors.dateTo = "End date is required";
    } else if (dateTo < today) {
      newErrors.dateTo = "End date cannot be in the past";
    } else if (dateFrom && dateTo < dateFrom) {
      newErrors.dateTo = "End date must be after start date";
    }

    return newErrors;
  };

  // Form submission handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const newErrors = validateForm();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    if (!selectedDestination) return;

    const destination = DESTINATIONS.find((d) => `${d.city}, ${d.country}` === selectedDestination);
    const origin = selectedOrigin ? ORIGINS.find((o) => o.city === selectedOrigin) : null;

    if (!destination) return;

    onSubmit({
      destinationCity: destination.city,
      destinationCountry: destination.country,
      destinationIata: destination.iata,
      originCity: origin?.city || "",
      originIata: origin?.iata || "",
      dateFrom: dateFrom || null,
      dateTo: dateTo || null,
      travelersCount,
      budgetRange,
      tripStyle,
    });
  };

  // Handler for dateFrom changes
  const handleDateFromChange = (value: string) => {
    setDateFrom(value);
    if (errors.dateFrom) {
      setErrors({ ...errors, dateFrom: undefined });
    }
  };

  // Handler for dateTo changes
  const handleDateToChange = (value: string) => {
    setDateTo(value);
    if (errors.dateTo) {
      setErrors({ ...errors, dateTo: undefined });
    }
  };

  // Handler for travelers count increment
  const incrementTravelers = () => {
    setTravelersCount(Math.min(20, travelersCount + 1));
  };

  // Handler for travelers count decrement
  const decrementTravelers = () => {
    setTravelersCount(Math.max(1, travelersCount - 1));
  };

  // Check if form is submittable
  const canSubmit = !loading && selectedDestination;

  return {
    // State
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

    // Setters
    setSelectedDestination,
    setSelectedOrigin,
    setBudgetRange,
    setTripStyle,

    // Handlers
    handleSubmit,
    handleDateFromChange,
    handleDateToChange,
    incrementTravelers,
    decrementTravelers,

    // Data
    destinations: DESTINATIONS,
    origins: ORIGINS,

    // Loading state
    loading,
  };
}
