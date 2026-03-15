import { useState, useCallback } from "react";
import { Outlet } from "react-router";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

export function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  return (
    <div className="flex h-screen flex-col">
      <Header
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onToggleSidebar={() => setSidebarCollapsed((p) => !p)}
        sidebarCollapsed={sidebarCollapsed}
      />
      <div className="flex flex-1 overflow-hidden">
        {!sidebarCollapsed && (
          <Sidebar className="w-60 shrink-0 hidden md:flex" />
        )}
        {/* Mobile sidebar overlay */}
        {!sidebarCollapsed && (
          <div className="md:hidden fixed inset-0 top-14 z-40 flex">
            <Sidebar className="w-60 shrink-0" />
            <div className="flex-1 bg-black/50" onClick={() => setSidebarCollapsed(true)} />
          </div>
        )}
        <Outlet context={{ searchQuery }} />
      </div>
    </div>
  );
}
