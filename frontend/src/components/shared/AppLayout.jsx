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

  // Close sidebar when route changes on mobile
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={closeSidebar} />

      {/* Tap-outside overlay — only visible on mobile when sidebar is open */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <div className="main-area">
        <Navbar onMenuToggle={() => setSidebarOpen((v) => !v)} />
        <main className="page-content animate-fade-in">
          {children}
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          #hamburger-btn { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
