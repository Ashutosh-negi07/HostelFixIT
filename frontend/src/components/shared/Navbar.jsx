"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import useAuthStore from "@/store/authStore";
import api from "@/lib/api";

/* ── SVG icons ── */
const BellIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

const MenuIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="6"  x2="21" y2="6"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

const ChevronIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const ProfileIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const LogoutIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

export default function Navbar({ onMenuToggle }) {
  const { user, logout } = useAuthStore();
  const [notifCount, setNotifCount] = useState(0);
  const [notifs, setNotifs]         = useState([]);
  const [notifOpen, setNotifOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifRef   = useRef(null);
  const profileRef = useRef(null);
  const role = user?.role || "";

  // Poll unread count every 30s
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await api.get("/api/notifications/unread-count");
        setNotifCount(res.data.count || 0);
      } catch {}
    };
    fetchCount();
    const t = setInterval(fetchCount, 30000);
    return () => clearInterval(t);
  }, []);

  const openNotifications = async () => {
    setNotifOpen((v) => !v);
    setProfileOpen(false);
    try {
      const res = await api.get("/api/notifications?size=10");
      setNotifs(res.data.content || []);
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await api.put("/api/notifications/read-all");
      setNotifCount(0);
      setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {}
  };

  const markOneRead = async (id) => {
    try {
      await api.put(`/api/notifications/${id}/read`);
      setNotifCount((c) => Math.max(0, c - 1));
      setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    } catch {}
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current   && !notifRef.current.contains(e.target))   setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function timeAgo(d) {
    if (!d) return "";
    const diff = Date.now() - new Date(d).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return "just now";
    if (m < 60) return `${m}m ago`;
    return `${Math.floor(m / 60)}h ago`;
  }

  return (
    <header className="topbar">
      {/* Hamburger (mobile) */}
      <button
        className="btn btn-ghost btn-icon"
        onClick={onMenuToggle}
        aria-label="Toggle menu"
        style={{ display: "none" }}
        id="hamburger-btn"
      >
        <MenuIcon />
      </button>

      {/* Page title spacer */}
      <div style={{ flex: 1 }} />

      {/* Notification bell */}
      <div ref={notifRef} className="notif-bell" style={{ position: "relative" }}>
        <button
          id="notif-bell-btn"
          className="btn btn-ghost btn-icon"
          onClick={openNotifications}
          aria-label={`Notifications${notifCount > 0 ? ` (${notifCount} unread)` : ""}`}
          style={{ position: "relative", color: "var(--text-secondary)" }}
        >
          <BellIcon />
          {notifCount > 0 && (
            <span className="notif-badge">{notifCount > 99 ? "99+" : notifCount}</span>
          )}
        </button>

        {notifOpen && (
          <div className="notif-dropdown">
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.875rem 1rem 0.625rem",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <span style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--text-primary)" }}>Notifications</span>
              {notifCount > 0 && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={markAllRead}
                  style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", color: "var(--accent-primary)" }}
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div style={{ maxHeight: 360, overflowY: "auto" }}>
              {notifs.length === 0 ? (
                <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                  No notifications yet
                </div>
              ) : (
                notifs.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markOneRead(n.id)}
                    style={{
                      padding: "0.75rem 1rem",
                      borderBottom: "1px solid var(--border)",
                      cursor: "pointer",
                      background: n.isRead ? "transparent" : "rgba(14,165,233,0.04)",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(14,165,233,0.07)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = n.isRead ? "transparent" : "rgba(14,165,233,0.04)")}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.2rem" }}>
                      <span style={{ fontSize: "0.85rem", fontWeight: n.isRead ? 400 : 600, color: n.isRead ? "var(--text-secondary)" : "var(--text-primary)" }}>
                        {n.title}
                      </span>
                      {!n.isRead && (
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent-primary)", flexShrink: 0, marginTop: 4 }} />
                      )}
                    </div>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.4, marginBottom: "0.25rem" }}>
                      {n.message}
                    </p>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{timeAgo(n.createdAt)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Profile dropdown */}
      <div ref={profileRef} style={{ position: "relative" }}>
        <button
          id="profile-menu-btn"
          className="btn btn-ghost"
          onClick={() => { setProfileOpen((v) => !v); setNotifOpen(false); }}
          style={{ gap: "0.5rem", padding: "0.375rem 0.5rem" }}
        >
          <div className="avatar" style={{ width: 30, height: 30, fontSize: "0.8rem" }}>
            {(user?.name || "U")[0].toUpperCase()}
          </div>
          <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)", fontWeight: 500 }}>
            {user?.name?.split(" ")[0] || "User"}
          </span>
          <span style={{ color: "var(--text-muted)" }}><ChevronIcon /></span>
        </button>

        {profileOpen && (
          <div className="notif-dropdown" style={{ width: 200, padding: "0.5rem" }}>
            <Link
              href={`/${role.toLowerCase()}/profile`}
              className="nav-item"
              onClick={() => setProfileOpen(false)}
              style={{ gap: "0.625rem" }}
            >
              <span style={{ color: "var(--text-muted)" }}><ProfileIcon /></span> Profile
            </Link>
            <button
              className="nav-item btn-danger"
              style={{ width: "100%", textAlign: "left", border: "none", gap: "0.625rem" }}
              onClick={logout}
            >
              <span><LogoutIcon /></span> Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
