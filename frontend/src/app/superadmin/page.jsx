"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import useAuthStore from "@/store/authStore";
import { getGlobalStats } from "@/lib/api/superadmin.api";
import StatCard from "@/components/shared/StatCard";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

const SA_COLOR = "#e11d48";

export default function SuperAdminDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getGlobalStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statCards = stats ? [
    { icon: "🛡️",  label: "Admins",    value: stats.totalAdmins,    color: SA_COLOR   },
    { icon: "🏢",  label: "Hostels",   value: stats.totalHostels,   color: "#f59e0b"  },
    { icon: "👤",  label: "Wardens",   value: stats.totalWardens,   color: "#8b5cf6"  },
    { icon: "👷",  label: "Workers",   value: stats.totalWorkers,   color: "#06b6d4"  },
    { icon: "🎓",  label: "Students",  value: stats.totalStudents,  color: "#6366f1"  },
    { icon: "👥",  label: "All Users", value: stats.totalUsers,     color: "#94a3b8"  },
  ] : [];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <span style={{ marginRight: "0.5rem" }}>👑</span>
            Super Admin
          </h1>
          <p className="page-subtitle">Platform-wide overview · Welcome back, {user?.name || "Super Admin"}</p>
        </div>
      </div>

      {/* Crimson banner strip */}
      <div
        style={{
          background: `linear-gradient(135deg, ${SA_COLOR}22, rgba(139,0,30,0.12))`,
          border: `1px solid ${SA_COLOR}30`,
          borderRadius: 14,
          padding: "1.25rem 1.5rem",
          marginBottom: "2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <div style={{ fontSize: "0.8rem", color: SA_COLOR, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.25rem" }}>
            Platform Control Center
          </div>
          <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
            You have full access to all hostels, admins, and system settings.
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap" }}>
          <Link href="/superadmin/admins" className="btn btn-sm" style={{ background: SA_COLOR, color: "#fff", border: "none" }}>
            ➕ Add Admin
          </Link>
          <Link href="/superadmin/hostels" className="btn btn-secondary btn-sm">
            🏢 Manage Hostels
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="stat-grid" style={{ marginBottom: "2.5rem" }}>
          {statCards.map((c) => <StatCard key={c.label} {...c} />)}
        </div>
      )}

      {/* Quick-action cards */}
      <h2 style={{ fontSize: "1.05rem", fontWeight: 600, marginBottom: "1rem", color: "var(--text-secondary)" }}>
        Quick Actions
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
        {[
          {
            href: "/superadmin/admins",
            icon: "🛡️",
            title: "Admin Accounts",
            desc: "Create, edit, enable or disable admin accounts. Each admin manages one hostel.",
            color: SA_COLOR,
          },
          {
            href: "/superadmin/hostels",
            icon: "🏢",
            title: "Global Hostels",
            desc: "Create hostels and assign them to admins. Unassigned hostels are platform-level.",
            color: "#f59e0b",
          },
          {
            href: "/superadmin/profile",
            icon: "👤",
            title: "My Profile",
            desc: "Update your display name, phone number or change your password.",
            color: "#8b5cf6",
          },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            style={{ textDecoration: "none" }}
          >
            <div
              className="card"
              style={{
                borderLeft: `3px solid ${item.color}`,
                transition: "all 0.2s",
                height: "100%",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.625rem" }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: `${item.color}18`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.25rem",
                  }}
                >
                  {item.icon}
                </div>
                <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{item.title}</div>
              </div>
              <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.5, margin: 0 }}>
                {item.desc}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
