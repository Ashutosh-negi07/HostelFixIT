"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { getDashboardStats } from "@/lib/api/dashboard.api";
import StatCard from "@/components/shared/StatCard";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

// Recharts components — loaded client-side only
const ResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer), { ssr: false });
const BarChart    = dynamic(() => import("recharts").then((m) => m.BarChart),    { ssr: false });
const Bar         = dynamic(() => import("recharts").then((m) => m.Bar),         { ssr: false });
const PieChart    = dynamic(() => import("recharts").then((m) => m.PieChart),    { ssr: false });
const Pie         = dynamic(() => import("recharts").then((m) => m.Pie),         { ssr: false });
const Cell        = dynamic(() => import("recharts").then((m) => m.Cell),        { ssr: false });
const XAxis       = dynamic(() => import("recharts").then((m) => m.XAxis),       { ssr: false });
const YAxis       = dynamic(() => import("recharts").then((m) => m.YAxis),       { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then((m) => m.CartesianGrid), { ssr: false });
const Tooltip     = dynamic(() => import("recharts").then((m) => m.Tooltip),     { ssr: false });
const Legend      = dynamic(() => import("recharts").then((m) => m.Legend),      { ssr: false });

const STATUS_COLORS = {
  PENDING:     "#f59e0b",
  ASSIGNED:    "#3b82f6",
  IN_PROGRESS: "#8b5cf6",
  RESOLVED:    "#22c55e",
  REJECTED:    "#ef4444",
};

const CHART_TOOLTIP_STYLE = {
  background: "#1f2d45",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 8,
  color: "#f1f5f9",
  fontSize: "0.8125rem",
};

export default function AdminDashboard() {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statCards = stats ? [
    { icon: "📋", label: "Total Complaints", value: stats.totalComplaints,      color: "#6366f1" },
    { icon: "🕐", label: "Pending",          value: stats.pendingComplaints,    color: "#f59e0b" },
    { icon: "👷", label: "Assigned",         value: stats.assignedComplaints,   color: "#3b82f6" },
    { icon: "⚙️", label: "In Progress",      value: stats.inProgressComplaints, color: "#8b5cf6" },
    { icon: "✅", label: "Resolved",         value: stats.resolvedComplaints,   color: "#22c55e" },
    { icon: "❌", label: "Rejected",         value: stats.rejectedComplaints,   color: "#ef4444" },
    { icon: "👥", label: "Total Users",      value: stats.totalUsers,           color: "#06b6d4" },
    { icon: "🏢", label: "Hostels",          value: stats.totalHostels,         color: "#f59e0b" },
    { icon: "⭐", label: "Avg Rating",       value: stats.averageRating ? `${stats.averageRating.toFixed(1)}/5` : "—", color: "#fbbf24" },
  ] : [];

  // Data for charts
  const pieData = stats ? [
    { name: "Pending",     value: stats.pendingComplaints    || 0 },
    { name: "Assigned",    value: stats.assignedComplaints   || 0 },
    { name: "In Progress", value: stats.inProgressComplaints || 0 },
    { name: "Resolved",    value: stats.resolvedComplaints   || 0 },
    { name: "Rejected",    value: stats.rejectedComplaints   || 0 },
  ].filter((d) => d.value > 0) : [];

  const categoryData = stats?.complaintsByCategory
    ? Object.entries(stats.complaintsByCategory).map(([k, v]) => ({ name: k, complaints: v })).sort((a, b) => b.complaints - a.complaints).slice(0, 8)
    : [];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Dashboard 🏢</h1>
          <p className="page-subtitle">System-wide overview of HostelFixIT.</p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}><LoadingSpinner size="lg" /></div>
      ) : (
        <>
          <div className="stat-grid" style={{ marginBottom: "2.5rem" }}>
            {statCards.map((c) => <StatCard key={c.label} {...c} />)}
          </div>

          {/* Charts row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "2rem" }}>
            {/* Pie: complaint status breakdown */}
            {pieData.length > 0 && (
              <div className="card-elevated">
                <h3 style={{ fontSize: "0.9375rem", marginBottom: "1.25rem" }}>📊 Complaints by Status</h3>
                <div style={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={100} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={Object.values(STATUS_COLORS)[i % 5]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                      <Legend formatter={(v) => <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Bar: complaints by category */}
            {categoryData.length > 0 && (
              <div className="card-elevated">
                <h3 style={{ fontSize: "0.9375rem", marginBottom: "1.25rem" }}>🏷️ Top Categories</h3>
                <div style={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} layout="vertical" margin={{ left: 10, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                      <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                      <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                      <Bar dataKey="complaints" fill="#6366f1" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* Hostel stats */}
          {stats?.complaintsByHostel && Object.keys(stats.complaintsByHostel).length > 0 && (
            <div className="card-elevated">
              <h3 style={{ fontSize: "0.9375rem", marginBottom: "1.25rem" }}>🏢 Complaints per Hostel</h3>
              <div style={{ height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={Object.entries(stats.complaintsByHostel).map(([name, count]) => ({ name, count }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
