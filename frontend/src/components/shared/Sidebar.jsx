"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import useAuthStore from "@/store/authStore";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/auth";

/* ── SVG icon set ─────────────────────────────────────── */
const Icon = {
  Dashboard: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  Complaints: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  Plus: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
  ),
  Profile: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Students: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
      <path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
  ),
  Workers: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
  Tasks: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4"/>
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
  ),
  Hostel: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  Users: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Categories: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
      <line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
  ),
  Shield: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  Logout: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  Logo: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
};

const NAV_CONFIG = {
  STUDENT: [
    { label: "Dashboard",     href: "/student",                icon: Icon.Dashboard },
    { label: "My Complaints", href: "/student/complaints",     icon: Icon.Complaints },
    { label: "New Complaint", href: "/student/complaints/new", icon: Icon.Plus },
    { label: "Profile",       href: "/student/profile",        icon: Icon.Profile },
  ],
  WARDEN: [
    { label: "Dashboard",  href: "/warden",            icon: Icon.Dashboard },
    { label: "Complaints", href: "/warden/complaints", icon: Icon.Complaints },
    { label: "Students",   href: "/warden/students",   icon: Icon.Students },
    { label: "Workers",    href: "/warden/workers",    icon: Icon.Workers },
    { label: "Profile",    href: "/warden/profile",    icon: Icon.Profile },
  ],
  WORKER: [
    { label: "Dashboard", href: "/worker",             icon: Icon.Dashboard },
    { label: "My Tasks",  href: "/worker/complaints",  icon: Icon.Tasks },
    { label: "Profile",   href: "/worker/profile",     icon: Icon.Profile },
  ],
  ADMIN: [
    { label: "Dashboard",  href: "/admin",             icon: Icon.Dashboard },
    { label: "Hostels",    href: "/admin/hostels",     icon: Icon.Hostel },
    { label: "Users",      href: "/admin/users",       icon: Icon.Users },
    { label: "Complaints", href: "/admin/complaints",  icon: Icon.Complaints },
    { label: "Categories", href: "/admin/categories",  icon: Icon.Categories },
    { label: "Profile",    href: "/admin/profile",     icon: Icon.Profile },
  ],
  SUPER_ADMIN: [
    { label: "Dashboard", href: "/superadmin",          icon: Icon.Dashboard },
    { label: "Admins",    href: "/superadmin/admins",   icon: Icon.Shield },
    { label: "Hostels",   href: "/superadmin/hostels",  icon: Icon.Hostel },
    { label: "Profile",   href: "/superadmin/profile",  icon: Icon.Profile },
  ],
};

export default function Sidebar({ open, onClose }) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const role  = user?.role  || "STUDENT";
  const items = NAV_CONFIG[role] || [];

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          onClick={onClose}
          style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.35)", zIndex: 39, display: "none" }}
          className="sidebar-overlay"
        />
      )}

      <aside className={`sidebar${open ? " open" : ""}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Icon.Logo />
          </div>
          <span className="sidebar-logo-text">HostelFixIT</span>
        </div>

        {/* Role chip */}
        <div
          style={{
            padding: "0.5rem 1rem",
            margin: "0.75rem 0.625rem 0",
            borderRadius: 8,
            background: "rgba(14,165,233,0.08)",
            border: "1px solid rgba(14,165,233,0.18)",
            fontSize: "0.72rem",
            fontWeight: 700,
            color: "#0284c7",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          {ROLE_LABELS[role]} Panel
        </div>

        {/* Nav items */}
        <nav className="sidebar-nav" aria-label="Main navigation">
          {items.map((item, idx) => {
            const isDashboard = idx === 0;
            const active = isDashboard
              ? pathname === item.href
              : pathname.startsWith(item.href);
            const ItemIcon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item${active ? " active" : ""}`}
                onClick={onClose}
              >
                <span className="nav-item-icon"><ItemIcon /></span>
                {item.label}
                {active && (
                  <span style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: "var(--accent-primary)", flexShrink: 0 }} />
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
              borderRadius: 10,
              background: "rgba(14,165,233,0.05)",
              marginBottom: "0.375rem",
              border: "1px solid rgba(14,165,233,0.1)",
            }}
          >
            <div
              className="avatar"
              style={{ width: 30, height: 30, fontSize: "0.75rem" }}
            >
              {(user?.name || "U")[0].toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
            <span className="nav-item-icon"><Icon.Logout /></span>
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
