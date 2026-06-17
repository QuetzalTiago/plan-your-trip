import type { Trip } from "../../types";
import { statusConfig } from "../../data/statusConfig";

interface StatusBadgeProps {
  status: Trip["status"];
  showLabel?: boolean;
}

export default function StatusBadge({
  status,
  showLabel = true,
}: StatusBadgeProps) {
  const config = statusConfig[status];

  if (showLabel) {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
        style={{
          background: config.bg,
          color: config.color,
        }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: config.color }}
        />
        {config.label}
      </span>
    );
  }

  // Dot only
  return (
    <span
      className="w-2 h-2 rounded-full"
      style={{ background: config.color }}
      title={config.label}
    />
  );
}
