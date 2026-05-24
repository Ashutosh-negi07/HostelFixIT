"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import useAuthStore from "@/store/authStore";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/auth";

const NAV_CONFIG = {
  STUDENT: [
    { label: "Dashboard",    href: "/student",                 icon: "🏠" },
    { label: "My Complaints",href: "/student/complaints",       icon: "📋" },
    { label: "New Complaint",href: "/student/complaints/new",   icon: "➕" },
    { label: "Profile",      href: "/student/profile",          icon: "👤" },
  ],
  WARDEN: [
    { label: "Dashboard",  href: "/warden",               icon: "🏠" },
    { label: "Complaints", href: "/warden/complaints",     icon: "📋" },
    { label: "Students",   href: "/warden/students",       icon: "🎓" },
    { label: "Workers",    href: "/warden/workers",        icon: "👷" },
    { label: "Profile",    href: "/warden/profile",        icon: "👤" },
  ],
  WORKER: [
    { label: "Dashboard",   href: "/worker",              icon: "🏠" },
    { label: "My Tasks",    href: "/worker/complaints",   icon: "🔧" },
    { label: "Profile",     href: "/worker/profile",      icon: "👤" },
  ],
  ADMIN: [
    { label: "Dashboard",   href: "/admin",               icon: "🏠" },
    { label: "Hostels",     href: "/admin/hostels",       icon: "🏢" },
    { label: "Users",       href: "/admin/users",         icon: "👥" },
    { label: "Complaints",  href: "/admin/complaints",    icon: "📋" },
    { label: "Categories",  href: "/admin/categories",    icon: "🏷️" },
  ],
  SUPER_ADMIN: [
    { label: "Dashboard",   href: "/superadmin",          icon: "👑" },
    { label: "Admins",      href: "/superadmin/admins",   icon: "🛡️" },
    { label: "Hostels",     href: "/superadmin/hostels",  icon: "🏢" },
    { label: "Profile",     href: "/superadmin/profile",  icon: "👤" },
  ],
};

export default function Sidebar({ open, onClose }) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const role  = user?.role  || "STUDENT";
  const items = NAV_CONFIG[role] || [];
  const accentColor = ROLE_COLORS[role] || "#6366f1";

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 39,
            display: "none",
          }}
          className="sidebar-overlay"
        />
      )}

      <aside className={`sidebar${open ? " open" : ""}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon" style={{ background: `linear-gradient(135deg, ${accentColor}, #8b5cf6)` }}>
            🔧
          </div>
          <span className="sidebar-logo-text">HostelFixIT</span>
        </div>

        {/* Role chip */}
        <div
          style={{
            padding: "0.5rem 1rem",
            margin: "0.5rem 0.5rem 0",
            borderRadius: 8,
            background: `${accentColor}18`,
            border: `1px solid ${accentColor}30`,
            fontSize: "0.75rem",
            fontWeight: 600,
            color: accentColor,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          {ROLE_LABELS[role]} Panel
        </div>

        {/* Nav items */}
        <nav className="sidebar-nav" aria-label="Main navigation">
          {items.map((item) => {
            const active =
              item.href === `/${role.toLowerCase()}`
                ? pathname === item.href
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item${active ? " active" : ""}`}
                onClick={onClose}
              >
                <span className="nav-item-icon">{item.icon}</span>
                {item.label}
                {active && (
                  <span style={{ marginLeft: "auto", fontSize: "0.5rem", color: "var(--accent-primary)" }}>
                    ●
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer: user + logout */}
        <div className="sidebar-footer">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.625rem",
              padding: "0.625rem 0.875rem",
              borderRadius: 8,
              background: "rgba(255,255,255,0.03)",
              marginBottom: "0.375rem",
            }}
          >
            <div
              className="avatar"
              style={{ width: 30, height: 30, fontSize: "0.75rem", background: `linear-gradient(135deg, ${accentColor}, #8b5cf6)` }}
            >
              {(user?.name || "U")[0].toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user?.name || "User"}
              </div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user?.email || ""}
              </div>
            </div>
          </div>
          <button
            className="nav-item btn-danger"
            style={{ width: "100%", justifyContent: "flex-start" }}
            onClick={logout}
          >
            <span className="nav-item-icon">🚪</span>
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
