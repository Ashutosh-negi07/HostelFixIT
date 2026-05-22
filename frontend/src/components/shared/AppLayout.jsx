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

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-area">
        <Navbar onMenuToggle={() => setSidebarOpen((v) => !v)} />
        <main className="page-content animate-fade-in">
          {children}
        </main>
      </div>

      {/* Mobile sidebar overlay style inject */}
      <style>{`
        @media (max-width: 768px) {
          #hamburger-btn { display: flex !important; }
          .sidebar-overlay { display: block !important; }
        }
      `}</style>
    </div>
  );
}
