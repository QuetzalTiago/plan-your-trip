import { type ReactNode } from "react";
import { motion } from "framer-motion";

export interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  children: ReactNode;
}

export default function Tabs({
  tabs,
  activeTab,
  onTabChange,
  children,
}: TabsProps) {
  return (
    <div className="flex flex-col h-full">
      <div
        className="flex gap-1 border-b px-6"
        style={{ borderColor: "var(--border)" }}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="relative px-4 py-3 text-sm font-medium transition-colors"
              style={{
                color: isActive ? "var(--accent)" : "var(--text-secondary)",
              }}
            >
              <span className="flex items-center gap-2">
                {tab.icon}
                {tab.label}
                {tab.count !== undefined && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      background: isActive
                        ? "var(--accent-light)"
                        : "var(--border)",
                      color: isActive
                        ? "var(--accent)"
                        : "var(--text-tertiary)",
                    }}
                  >
                    {tab.count}
                  </span>
                )}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ background: "var(--accent)" }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
