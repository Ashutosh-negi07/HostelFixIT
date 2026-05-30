"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import useAuthStore from "@/store/authStore";
import { getGlobalStats, getAllHostelsGlobal } from "@/lib/api/superadmin.api";
import StatCard from "@/components/shared/StatCard";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

/* ── Recharts (client-only) ── */
const ResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer), { ssr: false });
const PieChart   = dynamic(() => import("recharts").then((m) => m.PieChart),   { ssr: false });
const Pie        = dynamic(() => import("recharts").then((m) => m.Pie),        { ssr: false });
const Cell       = dynamic(() => import("recharts").then((m) => m.Cell),       { ssr: false });
const BarChart   = dynamic(() => import("recharts").then((m) => m.BarChart),   { ssr: false });
const Bar        = dynamic(() => import("recharts").then((m) => m.Bar),        { ssr: false });
const XAxis      = dynamic(() => import("recharts").then((m) => m.XAxis),      { ssr: false });
const YAxis      = dynamic(() => import("recharts").then((m) => m.YAxis),      { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then((m) => m.CartesianGrid), { ssr: false });
const Tooltip    = dynamic(() => import("recharts").then((m) => m.Tooltip),    { ssr: false });
const Legend     = dynamic(() => import("recharts").then((m) => m.Legend),     { ssr: false });

/* ── Icons ── */
const ShieldIcon  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const HostelIcon  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const UserIcon    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const WorkerIcon  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>;
const StudentsIcon= () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>;
const UsersIcon   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const PlusIcon    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;

const TOOLTIP_STYLE = {
  background: "#fff", border: "1px solid rgba(14,165,233,0.15)",
  borderRadius: 10, color: "#0f172a", fontSize: "0.8125rem",
  boxShadow: "0 4px 12px rgba(14,165,233,0.1)",
};

/* Distinct palette for roles */
const ROLE_PALETTE = [
  { name: "Wardens",  color: "#8b5cf6" },  // purple
  { name: "Workers",  color: "#f59e0b" },  // amber
  { name: "Students", color: "#0ea5e9" },  // sky blue
];

/* Distinct palette for admins */
const ADMIN_PALETTE = [
  "#0ea5e9",  // sky blue
  "#f59e0b",  // amber
  "#22c55e",  // green
  "#8b5cf6",  // purple
  "#ef4444",  // red
  "#06b6d4",  // cyan
];

export default function SuperAdminDashboard() {
  const { user } = useAuthStore();
  const [stats,   setStats]   = useState(null);
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getGlobalStats().catch(() => null),
      getAllHostelsGlobal().catch(() => []),
    ]).then(([s, h]) => {
      setStats(s);
      setHostels(Array.isArray(h) ? h : h?.content || []);
    }).finally(() => setLoading(false));
  }, []);

  const statCards = stats ? [
    { icon: <ShieldIcon />,   label: "Admins",    value: stats.totalAdmins,    color: "#0ea5e9" },
    { icon: <HostelIcon />,   label: "Hostels",   value: stats.totalHostels,   color: "#f59e0b" },
    { icon: <UserIcon />,     label: "Wardens",   value: stats.totalWardens,   color: "#8b5cf6" },
    { icon: <WorkerIcon />,   label: "Workers",   value: stats.totalWorkers,   color: "#06b6d4" },
    { icon: <StudentsIcon />, label: "Students",  value: stats.totalStudents,  color: "#0284c7" },
    { icon: <UsersIcon />,    label: "All Users", value: stats.totalUsers,     color: "#64748b" },
  ] : [];

  /* Donut chart: colors embedded in data */
  const userPieData = stats ? ROLE_PALETTE
    .map(r => ({ name: r.name, value: (r.name === "Wardens" ? stats.totalWardens : r.name === "Workers" ? stats.totalWorkers : stats.totalStudents) || 0, fill: r.color }))
    .filter(d => d.value > 0) : [];

  /* Bar chart: hostels per admin — each bar gets its own color */
  const adminHostelMap = {};
  hostels.forEach(h => {
    const aName = h.adminName || "Unassigned";
    adminHostelMap[aName] = (adminHostelMap[aName] || 0) + 1;
  });
  const hostelBarData = Object.entries(adminHostelMap).map(([name, count], i) => ({
    name, count, fill: ADMIN_PALETTE[i % ADMIN_PALETTE.length],
  }));

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Super Admin Dashboard</h1>
          <p className="page-subtitle">Platform-wide overview · Welcome back, {user?.name || "Super Admin"}</p>
        </div>
      </div>

      {/* Info banner */}
      <div style={{
        background: "linear-gradient(135deg, rgba(14,165,233,0.08), rgba(56,189,248,0.05))",
        border: "1px solid rgba(14,165,233,0.18)", borderRadius: 14,
        padding: "1.25rem 1.5rem", marginBottom: "2rem",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: "1rem",
      }}>
        <div>
          <div style={{ fontSize: "0.8rem", color: "#0ea5e9", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.25rem" }}>
            Platform Control Center
          </div>
          <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
            You have full access to all hostels, admins, and system settings.
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap" }}>
          <Link href="/superadmin/admins" className="btn btn-sm" style={{ background: "var(--accent-gradient)", color: "#fff", border: "none", gap: "0.375rem" }}>
            <PlusIcon /> Add Admin
          </Link>
          <Link href="/superadmin/hostels" className="btn btn-secondary btn-sm">Manage Hostels</Link>
        </div>
      </div>

      {/* Stat cards */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}><LoadingSpinner size="lg" /></div>
      ) : (
        <>
          <div className="stat-grid" style={{ marginBottom: "2.5rem" }}>
            {statCards.map((c) => <StatCard key={c.label} {...c} />)}
          </div>

          {/* Charts row */}
          {(userPieData.length > 0 || hostelBarData.length > 0) && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "2rem" }}>
              {/* Donut: user role distribution */}
              {userPieData.length > 0 && (
                <div className="card-elevated">
                  <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, marginBottom: "1.25rem", color: "var(--text-primary)" }}>
                    Platform Users by Role
                  </h3>
                  <div style={{ height: 280 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={userPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={105} paddingAngle={4} dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                          {userPieData.map((entry, i) => (
                            <Cell key={i} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(val, name) => [val, name]} />
                        <Legend
                          formatter={(v, entry) => (
                            <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: 4 }}>
                              <span style={{ width: 10, height: 10, borderRadius: "50%", background: entry.color, display: "inline-block" }} />
                              {v}
                            </span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Bar: hostels per admin */}
              {hostelBarData.length > 0 && (
                <div className="card-elevated">
                  <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, marginBottom: "1.25rem", color: "var(--text-primary)" }}>
                    Hostels per Admin
                  </h3>
                  <div style={{ height: 280 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={hostelBarData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(14,165,233,0.08)" vertical={false} />
                        <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                        <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Hostels">
                          {hostelBarData.map((entry, i) => (
                            <Cell key={i} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Platform summary table */}
          {stats && (
            <div className="card-elevated" style={{ marginBottom: "2rem" }}>
              <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, marginBottom: "1rem", color: "var(--text-primary)" }}>
                Platform Summary
              </h3>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(14,165,233,0.1)" }}>
                      {["Role", "Count", "% of Users"].map(h => (
                        <th key={h} style={{ textAlign: "left", padding: "0.625rem 1rem", color: "var(--text-muted)", fontWeight: 600, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { role: "Admins",   count: stats.totalAdmins,   color: "#0ea5e9" },
                      { role: "Wardens",  count: stats.totalWardens,  color: "#8b5cf6" },
                      { role: "Workers",  count: stats.totalWorkers,  color: "#06b6d4" },
                      { role: "Students", count: stats.totalStudents, color: "#0284c7" },
                    ].map(row => (
                      <tr key={row.role} style={{ borderBottom: "1px solid rgba(14,165,233,0.06)" }}>
                        <td style={{ padding: "0.75rem 1rem" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                            <span style={{ width: 10, height: 10, borderRadius: "50%", background: row.color, display: "inline-block" }} />
                            {row.role}
                          </span>
                        </td>
                        <td style={{ padding: "0.75rem 1rem", fontWeight: 600, color: "var(--text-primary)" }}>{row.count}</td>
                        <td style={{ padding: "0.75rem 1rem", color: "var(--text-muted)" }}>
                          {stats.totalUsers > 0 ? `${((row.count / stats.totalUsers) * 100).toFixed(1)}%` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Quick-action cards */}
          <h2 style={{ fontSize: "1.05rem", fontWeight: 600, marginBottom: "1rem", color: "var(--text-secondary)" }}>
            Quick Actions
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
            {[
              { href: "/superadmin/admins",  icon: <ShieldIcon />,  title: "Admin Accounts", desc: "Create, edit, enable or disable admin accounts. Each admin manages one or more hostels.", color: "#0ea5e9" },
              { href: "/superadmin/hostels", icon: <HostelIcon />,  title: "Global Hostels",  desc: "Create hostels and assign them to admins. Unassigned hostels are platform-level.", color: "#f59e0b" },
              { href: "/superadmin/profile", icon: <UserIcon />,    title: "My Profile",      desc: "Update your display name, phone number or change your password.", color: "#8b5cf6" },
            ].map((item) => (
              <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
                <div className="card" style={{ borderLeft: `3px solid ${item.color}`, height: "100%", cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.625rem" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: `${item.color}14`, border: `1px solid ${item.color}22`, display: "flex", alignItems: "center", justifyContent: "center", color: item.color }}>
                      {item.icon}
                    </div>
                    <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{item.title}</div>
                  </div>
                  <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.5, margin: 0 }}>{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
