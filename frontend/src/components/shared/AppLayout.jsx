"use client";
import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import useAuthStore from "@/store/authStore";

export default function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { init } = useAuthStore();

  // Hydrate user from localStorage on mount
  useEffect(() => { init(); }, [init]);

  // Lock body scroll on mobile when sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.classList.add("sidebar-open");
    } else {
      document.body.classList.remove("sidebar-open");
    }
    return () => document.body.classList.remove("sidebar-open");
  }, [sidebarOpen]);

  // Close sidebar when route changes on mobile
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={closeSidebar} />

      <div className="main-area">
        <Navbar onMenuToggle={() => setSidebarOpen((v) => !v)} />
        <main className="page-content animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
