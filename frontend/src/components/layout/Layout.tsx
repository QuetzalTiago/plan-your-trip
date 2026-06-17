import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { Menu } from "lucide-react";

export default function Layout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 768
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Hide sidebar on sign-in page
  const showSidebar = location.pathname !== "/signin";

  return (
    <div className="flex h-full">
      {/* Mobile backdrop with frosted glass effect */}
      {showSidebar && sidebarOpen && !sidebarCollapsed && (
        <div
          className="fixed inset-0 z-10 bg-black/30 backdrop-blur-sm md:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {showSidebar && (
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      )}

      <main className="flex-1 overflow-auto min-w-0">
        {/* Mobile hamburger — only shown when sidebar is closed */}
        {showSidebar && !sidebarOpen && !sidebarCollapsed && (
          <button
            className="md:hidden fixed z-30 w-11 h-11 flex items-center justify-center rounded-xl border shadow-lg transition-all hover:scale-105"
            style={{
              top: "max(1rem, env(safe-area-inset-top))",
              left: "max(1rem, env(safe-area-inset-left))",
              borderColor: "var(--border)",
              background: "var(--surface)",
              color: "var(--text-secondary)",
            }}
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
        )}
        <Outlet />
      </main>
    </div>
  );
}
