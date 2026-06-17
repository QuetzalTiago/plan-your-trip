import { ChevronDown, ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface SectionProps {
  title: string;
  count: number;
  icon: LucideIcon;
  children: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
}

export default function Section({
  title,
  count,
  icon: Icon,
  children,
  isExpanded,
  onToggle,
}: SectionProps) {
  return (
    <div
      className="border rounded-lg overflow-hidden"
      style={{ borderColor: "var(--border)" }}
    >
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
        style={{ background: "var(--surface)" }}
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5" style={{ color: "var(--accent)" }} />
          <span
            className="text-base font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {title}
          </span>
          <span
            className="text-xs px-2 py-1 rounded-full font-medium"
            style={{
              background: "var(--accent)",
              color: "white",
            }}
          >
            {count}
          </span>
        </div>
        {isExpanded ? (
          <ChevronDown
            className="w-5 h-5"
            style={{ color: "var(--text-secondary)" }}
          />
        ) : (
          <ChevronRight
            className="w-5 h-5"
            style={{ color: "var(--text-secondary)" }}
          />
        )}
      </button>
      {isExpanded && (
        <div className="px-6 pb-6 pt-2" style={{ background: "var(--bg)" }}>
          {count === 0 ? (
            <p
              className="text-sm text-center py-8"
              style={{ color: "var(--text-secondary)" }}
            >
              No data available yet
            </p>
          ) : (
            children
          )}
        </div>
      )}
    </div>
  );
}
