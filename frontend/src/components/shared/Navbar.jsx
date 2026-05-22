"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import useAuthStore from "@/store/authStore";
import { ROLE_COLORS } from "@/lib/auth";
import api from "@/lib/api";

export default function Navbar({ onMenuToggle }) {
  const { user, logout } = useAuthStore();
  const [notifCount, setNotifCount] = useState(0);
  const [notifs, setNotifs] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const role = user?.role || "";
  const accentColor = ROLE_COLORS[role] || "#6366f1";

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

  // Load notifications on bell click
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
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
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
        ☰
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
        >
          🔔
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
              <span style={{ fontWeight: 600, fontSize: "0.9375rem" }}>Notifications</span>
              {notifCount > 0 && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={markAllRead}
                  style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div style={{ maxHeight: 360, overflowY: "auto" }}>
              {notifs.length === 0 ? (
                <div
                  style={{
                    padding: "2rem",
                    textAlign: "center",
                    color: "var(--text-muted)",
                    fontSize: "0.875rem",
                  }}
                >
                  No notifications yet
                </div>
              ) : (
                notifs.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markOneRead(n.id)}
                    style={{
                      padding: "0.75rem 1rem",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      cursor: "pointer",
                      background: n.isRead ? "transparent" : "rgba(99,102,241,0.05)",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = n.isRead ? "transparent" : "rgba(99,102,241,0.05)")
                    }
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.2rem" }}>
                      <span
                        style={{
                          fontSize: "0.85rem",
                          fontWeight: n.isRead ? 400 : 600,
                          color: n.isRead ? "var(--text-secondary)" : "var(--text-primary)",
                        }}
                      >
                        {n.title}
                      </span>
                      {!n.isRead && (
                        <span
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: "50%",
                            background: accentColor,
                            flexShrink: 0,
                            marginTop: 4,
                          }}
                        />
                      )}
                    </div>
                    <p
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--text-muted)",
                        lineHeight: 1.4,
                        marginBottom: "0.25rem",
                      }}
                    >
                      {n.message}
                    </p>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                      {timeAgo(n.createdAt)}
                    </span>
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
          <div
            className="avatar"
            style={{
              width: 30,
              height: 30,
              fontSize: "0.8rem",
              background: `linear-gradient(135deg, ${accentColor}, #8b5cf6)`,
            }}
          >
            {(user?.name || "U")[0].toUpperCase()}
          </div>
          <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
            {user?.name?.split(" ")[0] || "User"}
          </span>
          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>▾</span>
        </button>

        {profileOpen && (
          <div
            className="notif-dropdown"
            style={{ width: 200, padding: "0.5rem" }}
          >
            <Link
              href={`/${role.toLowerCase()}/profile`}
              className="nav-item"
              onClick={() => setProfileOpen(false)}
            >
              <span>👤</span> Profile
            </Link>
            <button
              className="nav-item btn-danger"
              style={{ width: "100%", textAlign: "left", border: "none" }}
              onClick={logout}
            >
              <span>🚪</span> Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
