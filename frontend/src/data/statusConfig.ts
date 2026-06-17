export const statusConfig = {
  planning: {
    label: "Planning",
    color: "#3b82f6",
    bg: "#dbeafe",
    icon: "📋",
  },
  booked: {
    label: "Booked",
    color: "#059669",
    bg: "#d1fae5",
    icon: "✅",
  },
  in_progress: {
    label: "In Progress",
    color: "#d97706",
    bg: "#fef3c7",
    icon: "✈️",
  },
  completed: {
    label: "Completed",
    color: "#059669",
    bg: "#d1fae5",
    icon: "🎉",
  },
  cancelled: {
    label: "Cancelled",
    color: "#dc2626",
    bg: "#fee2e2",
    icon: "❌",
  },
} as const;

export type TripStatus = keyof typeof statusConfig;
