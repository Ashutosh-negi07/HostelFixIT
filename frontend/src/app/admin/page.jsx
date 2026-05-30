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

// SVG icons for stat cards
const FileIcon  = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>;
const ClockIcon = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const UserIcon  = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const ToolIcon  = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>;
const CheckIcon = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const XIcon     = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>;
const UsersIcon = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const HomeIcon  = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const StarIcon  = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;

const STATUS_COLORS = {
  PENDING:     "#f59e0b",
  ASSIGNED:    "#3b82f6",
  IN_PROGRESS: "#8b5cf6",
  RESOLVED:    "#22c55e",
  REJECTED:    "#ef4444",
};

/* Palette for categories bar chart */
const CAT_PALETTE = [
  "#0ea5e9", "#f59e0b", "#22c55e", "#8b5cf6",
  "#ef4444", "#06b6d4", "#f97316", "#ec4899",
];

const CHART_TOOLTIP_STYLE = {
  background: "#ffffff",
  border: "1px solid rgba(14,165,233,0.15)",
  borderRadius: 10,
  color: "#0f172a",
  fontSize: "0.8125rem",
  boxShadow: "0 4px 12px rgba(14,165,233,0.1)",
};


export default function AdminDashboard() {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch((e) => console.error("Dashboard stats failed:", e?.message || e))
      .finally(() => setLoading(false));
  }, []);

  const statCards = stats ? [
    { icon: <FileIcon />,  label: "Total Complaints", value: stats.totalComplaints,      color: "#0ea5e9" },
    { icon: <ClockIcon />, label: "Pending",          value: stats.pendingComplaints,    color: "#f59e0b" },
    { icon: <ToolIcon />,  label: "Assigned",         value: stats.assignedComplaints,   color: "#3b82f6" },
    { icon: <ToolIcon />,  label: "In Progress",      value: stats.inProgressComplaints, color: "#8b5cf6" },
    { icon: <CheckIcon />, label: "Resolved",         value: stats.resolvedComplaints,   color: "#16a34a" },
    { icon: <XIcon />,     label: "Rejected",         value: stats.rejectedComplaints,   color: "#dc2626" },
    { icon: <UsersIcon />, label: "Total Users",      value: stats.totalUsers,           color: "#06b6d4" },
    { icon: <HomeIcon />,  label: "Hostels",          value: stats.totalHostels,         color: "#f59e0b" },
    { icon: <StarIcon />,  label: "Avg Rating",       value: stats.averageRating ? `${stats.averageRating.toFixed(1)}/5` : "—", color: "#f59e0b" },
  ] : [];

  // Data for charts — embed fill so Cell works with dynamic imports
  const pieData = stats ? [
    { name: "Pending",     value: stats.pendingComplaints    || 0, fill: STATUS_COLORS.PENDING     },
    { name: "Assigned",    value: stats.assignedComplaints   || 0, fill: STATUS_COLORS.ASSIGNED    },
    { name: "In Progress", value: stats.inProgressComplaints || 0, fill: STATUS_COLORS.IN_PROGRESS },
    { name: "Resolved",    value: stats.resolvedComplaints   || 0, fill: STATUS_COLORS.RESOLVED    },
    { name: "Rejected",    value: stats.rejectedComplaints   || 0, fill: STATUS_COLORS.REJECTED    },
  ].filter((d) => d.value > 0) : [];

  const categoryData = stats?.complaintsByCategory
    ? Object.entries(stats.complaintsByCategory)
        .map(([k, v], i) => ({ name: k, complaints: v, fill: CAT_PALETTE[i % CAT_PALETTE.length] }))
        .sort((a, b) => b.complaints - a.complaints)
        .slice(0, 8)
    : [];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
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
                <h3 style={{ fontSize: "0.9375rem", marginBottom: "1.25rem", color: "var(--text-primary)" }}>Complaints by Status</h3>
                <div style={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={100} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                      <Legend formatter={(v, entry) => (
                        <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <span style={{ width: 10, height: 10, borderRadius: "50%", background: entry.color, display: "inline-block" }} />
                          {v}
                        </span>
                      )} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Bar: complaints by category */}
            {categoryData.length > 0 && (
              <div className="card-elevated">
                <h3 style={{ fontSize: "0.9375rem", marginBottom: "1.25rem", color: "var(--text-primary)" }}>Top Categories</h3>
                <div style={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} layout="vertical" margin={{ left: 10, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(14,165,233,0.08)" horizontal={false} />
                      <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                      <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                      <Bar dataKey="complaints" radius={[0, 4, 4, 0]}>
                        {categoryData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* Hostel stats */}
          {stats?.complaintsByHostel && Object.keys(stats.complaintsByHostel).length > 0 && (
            <div className="card-elevated">
              <h3 style={{ fontSize: "0.9375rem", marginBottom: "1.25rem", color: "var(--text-primary)" }}>Complaints per Hostel</h3>
              <div style={{ height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={Object.entries(stats.complaintsByHostel).map(([name, count]) => ({ name, count }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(14,165,233,0.08)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                    <Bar dataKey="count" fill="#38bdf8" radius={[4, 4, 0, 0]} />
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
