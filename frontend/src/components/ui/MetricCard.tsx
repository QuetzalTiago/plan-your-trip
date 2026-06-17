import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface MetricCardProps {
  icon: ReactNode;
  label: string;
  value: number | string;
  color?: string;
}

export default function MetricCard({
  icon,
  label,
  value,
  color = "var(--accent)",
}: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="p-6 rounded-xl border"
      style={{
        borderColor: "var(--border)",
        background: "var(--surface)",
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center"
          style={{ background: "var(--accent-light)", color }}
        >
          {icon}
        </div>
        <div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-2xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            {value}
          </motion.div>
          <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {label}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
