import Skeleton from "./Skeleton";
import { Plane, Building2, MapPin, Calendar } from "lucide-react";

export function MetricCardSkeleton() {
  return (
    <div
      className="p-4 rounded-lg border"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
      }}
    >
      <div className="flex items-center gap-3">
        <Skeleton variant="rectangular" className="w-10 h-10 rounded-lg" />
        <div className="flex-1">
          <Skeleton className="h-3 w-16 mb-2" />
          <Skeleton className="h-7 w-12" />
        </div>
      </div>
    </div>
  );
}

export function SectionSkeleton({ icon: Icon }: { icon: typeof Plane }) {
  return (
    <div className="border rounded-lg overflow-hidden" style={{ borderColor: "var(--border)" }}>
      <div
        className="px-6 py-4 flex items-center justify-between"
        style={{ background: "var(--surface)" }}
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5" style={{ color: "var(--accent)" }} />
          <Skeleton className="h-5 w-24" />
          <Skeleton variant="rectangular" className="w-8 h-5 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="h-full overflow-y-auto" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <div
        className="px-6 py-4 border-b"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
        }}
      >
        <Skeleton className="h-6 w-32 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Metrics */}
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
        </div>
      </div>

      {/* Sections */}
      <div className="px-6 pb-6 space-y-4">
        <SectionSkeleton icon={Plane} />
        <SectionSkeleton icon={Building2} />
        <SectionSkeleton icon={MapPin} />
        <SectionSkeleton icon={Calendar} />
      </div>
    </div>
  );
}
