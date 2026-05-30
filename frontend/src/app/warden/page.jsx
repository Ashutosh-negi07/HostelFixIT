"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import useAuthStore from "@/store/authStore";
import { getDashboardStats } from "@/lib/api/dashboard.api";
import { getComplaints, assignWorker, rejectComplaint } from "@/lib/api/complaints.api";
import { getUsers } from "@/lib/api/users.api";
import StatCard from "@/components/shared/StatCard";
import PriorityBadge from "@/components/shared/PriorityBadge";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import EmptyState from "@/components/shared/EmptyState";
import toast from "react-hot-toast";

/* ── Recharts (client-only) ── */
const ResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer), { ssr: false });
const PieChart    = dynamic(() => import("recharts").then((m) => m.PieChart),    { ssr: false });
const Pie         = dynamic(() => import("recharts").then((m) => m.Pie),         { ssr: false });
const Cell        = dynamic(() => import("recharts").then((m) => m.Cell),        { ssr: false });
const BarChart    = dynamic(() => import("recharts").then((m) => m.BarChart),    { ssr: false });
const Bar         = dynamic(() => import("recharts").then((m) => m.Bar),         { ssr: false });
const XAxis       = dynamic(() => import("recharts").then((m) => m.XAxis),       { ssr: false });
const YAxis       = dynamic(() => import("recharts").then((m) => m.YAxis),       { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then((m) => m.CartesianGrid), { ssr: false });
const Tooltip     = dynamic(() => import("recharts").then((m) => m.Tooltip),     { ssr: false });
const Legend      = dynamic(() => import("recharts").then((m) => m.Legend),      { ssr: false });
const RadialBarChart = dynamic(() => import("recharts").then((m) => m.RadialBarChart), { ssr: false });
const RadialBar      = dynamic(() => import("recharts").then((m) => m.RadialBar),      { ssr: false });

/* ── Icons ── */
const FileIcon  = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
const ClockIcon = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const ToolIcon  = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>;
const CheckIcon = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const XIcon     = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>;
const GradIcon  = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>;
const StarIcon  = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const UserIcon  = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;

const STATUS_COLORS = {
  PENDING: "#f59e0b", ASSIGNED: "#3b82f6",
  IN_PROGRESS: "#8b5cf6", RESOLVED: "#22c55e", REJECTED: "#ef4444",
};

const TOOLTIP_STYLE = {
  background: "#fff", border: "1px solid rgba(14,165,233,0.15)",
  borderRadius: 10, color: "#0f172a", fontSize: "0.8125rem",
  boxShadow: "0 4px 12px rgba(14,165,233,0.1)",
};

export default function WardenDashboard() {
  const { user } = useAuthStore();
  const [stats,   setStats]   = useState(null);
  const [pending, setPending] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignModal,    setAssignModal]    = useState(null);
  const [selectedWorker, setSelectedWorker] = useState("");
  const [assigning,      setAssigning]      = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [s, p, w] = await Promise.all([
          getDashboardStats(),
          getComplaints("WARDEN", { status: "PENDING", size: 8, sortBy: "createdAt", order: "asc" }),
          getUsers("WARDEN", "WORKER", { size: 50 }),
        ]);
        setStats(s);
        setPending(p.content || []);
        setWorkers(w.content || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const handleAssign = async () => {
    if (!selectedWorker) { toast.error("Select a worker first."); return; }
    setAssigning(true);
    try {
      await assignWorker(assignModal.complaintId, selectedWorker);
      toast.success("Worker assigned!");
      setPending((p) => p.filter((c) => c.id !== assignModal.complaintId));
      setAssignModal(null); setSelectedWorker("");
    } catch { toast.error("Failed to assign worker."); }
    finally { setAssigning(false); }
  };

  const handleReject = async (complaintId) => {
    if (!confirm("Reject this complaint?")) return;
    try {
      await rejectComplaint(complaintId);
      toast.success("Complaint rejected.");
      setPending((p) => p.filter((c) => c.id !== complaintId));
    } catch { toast.error("Failed to reject."); }
  };

  const statCards = stats ? [
    { icon: <FileIcon />,  label: "Total",       value: stats.totalComplaints,      color: "#0ea5e9" },
    { icon: <ClockIcon />, label: "Pending",      value: stats.pendingComplaints,    color: "#f59e0b" },
    { icon: <ToolIcon />,  label: "Assigned",     value: stats.assignedComplaints,   color: "#3b82f6" },
    { icon: <ToolIcon />,  label: "In Progress",  value: stats.inProgressComplaints, color: "#8b5cf6" },
    { icon: <CheckIcon />, label: "Resolved",     value: stats.resolvedComplaints,   color: "#16a34a" },
    { icon: <XIcon />,     label: "Rejected",     value: stats.rejectedComplaints,   color: "#dc2626" },
    { icon: <GradIcon />,  label: "Students",     value: stats.usersByRole?.STUDENT ?? (stats.totalUsers - (stats.usersByRole?.WORKER || 0)), color: "#06b6d4" },
    { icon: <StarIcon />,  label: "Avg Rating",   value: stats.averageRating ? `${stats.averageRating.toFixed(1)}/5` : "—", color: "#f59e0b" },
  ] : [];

  /* Pie: complaint status breakdown — embed fill in data */
  const pieData = stats ? [
    { name: "Pending",     value: stats.pendingComplaints    || 0, fill: STATUS_COLORS.PENDING     },
    { name: "Assigned",    value: stats.assignedComplaints   || 0, fill: STATUS_COLORS.ASSIGNED    },
    { name: "In Progress", value: stats.inProgressComplaints || 0, fill: STATUS_COLORS.IN_PROGRESS },
    { name: "Resolved",    value: stats.resolvedComplaints   || 0, fill: STATUS_COLORS.RESOLVED    },
    { name: "Rejected",    value: stats.rejectedComplaints   || 0, fill: STATUS_COLORS.REJECTED    },
  ].filter(d => d.value > 0) : [];

  /* Bar: resolution rate */
  const resolutionData = stats && stats.totalComplaints > 0 ? [
    { label: "Resolved",    pct: Math.round(((stats.resolvedComplaints  || 0) / stats.totalComplaints) * 100) },
    { label: "In Progress", pct: Math.round(((stats.inProgressComplaints || 0) / stats.totalComplaints) * 100) },
    { label: "Pending",     pct: Math.round(((stats.pendingComplaints   || 0) / stats.totalComplaints) * 100) },
    { label: "Rejected",    pct: Math.round(((stats.rejectedComplaints  || 0) / stats.totalComplaints) * 100) },
  ] : [];

  const resolvedPct = stats && stats.totalComplaints > 0
    ? Math.round(((stats.resolvedComplaints || 0) / stats.totalComplaints) * 100)
    : 0;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Warden Dashboard</h1>
          <p className="page-subtitle">Hostel complaint overview · {user?.name || "Warden"}</p>
        </div>
        <Link href="/warden/complaints" className="btn btn-secondary">View All Complaints →</Link>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}><LoadingSpinner size="lg" /></div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="stat-grid" style={{ marginBottom: "2rem" }}>
            {statCards.map((c) => <StatCard key={c.label} {...c} />)}
          </div>

          {/* Charts row */}
          {pieData.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "2rem" }}>
              {/* Donut: status breakdown */}
              <div className="card-elevated">
                <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, marginBottom: "1.25rem", color: "var(--text-primary)" }}>
                  Complaints by Status
                </h3>
                <div style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={3} dataKey="value"
                        label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                      </Pie>
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
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

              {/* Resolution progress + KPI panel */}
              <div className="card-elevated">
                <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, marginBottom: "1rem", color: "var(--text-primary)" }}>
                  Resolution Overview
                </h3>
                {/* Big resolution % circle */}
                <div style={{ display: "flex", alignItems: "center", gap: "2rem", flexWrap: "wrap" }}>
                  <div style={{ position: "relative", width: 120, height: 120, flexShrink: 0 }}>
                    <svg viewBox="0 0 120 120" style={{ transform: "rotate(-90deg)", width: "100%", height: "100%" }}>
                      <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(14,165,233,0.1)" strokeWidth="12" />
                      <circle cx="60" cy="60" r="50" fill="none" stroke="#22c55e" strokeWidth="12"
                        strokeDasharray={`${2 * Math.PI * 50}`}
                        strokeDashoffset={`${2 * Math.PI * 50 * (1 - resolvedPct / 100)}`}
                        strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s ease" }} />
                    </svg>
                    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "#22c55e" }}>{resolvedPct}%</span>
                      <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Resolved</span>
                    </div>
                  </div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                    {resolutionData.map(d => (
                      <div key={d.label}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: "0.25rem" }}>
                          <span style={{ color: "var(--text-secondary)" }}>{d.label}</span>
                          <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{d.pct}%</span>
                        </div>
                        <div style={{ height: 6, borderRadius: 999, background: "rgba(14,165,233,0.08)", overflow: "hidden" }}>
                          <div style={{ height: "100%", borderRadius: 999, width: `${d.pct}%`,
                            background: d.label === "Resolved" ? "#22c55e" : d.label === "In Progress" ? "#8b5cf6" : d.label === "Pending" ? "#f59e0b" : "#ef4444",
                            transition: "width 1s ease" }} />
                        </div>
                      </div>
                    ))}
                    {stats?.averageRating > 0 && (
                      <div style={{ marginTop: "0.5rem", padding: "0.625rem", background: "rgba(245,158,11,0.08)", borderRadius: 8, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <StarIcon />
                        <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                          Avg feedback rating: <strong style={{ color: "#f59e0b" }}>{stats.averageRating.toFixed(1)}/5.0</strong>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pending complaints needing action */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 600 }}>
                Pending Review
                {pending.length > 0 && (
                  <span style={{ marginLeft: "0.5rem", background: "rgba(245,158,11,0.15)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 999, fontSize: "0.75rem", padding: "0.15rem 0.5rem" }}>
                    {pending.length}
                  </span>
                )}
              </h2>
              <Link href="/warden/complaints?status=PENDING" style={{ fontSize: "0.875rem", color: "var(--text-link)" }}>View all →</Link>
            </div>

            {pending.length === 0 ? (
              <EmptyState title="All caught up!" description="No pending complaints require your attention right now." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {pending.map((c) => (
                  <div key={c.id} className="card" style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.375rem", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--accent-primary)" }}>{c.categoryName}</span>
                        <PriorityBadge priority={c.priority} />
                      </div>
                      <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", margin: 0, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical" }}>
                        {c.description}
                      </p>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <UserIcon /> {c.studentName}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button className="btn btn-primary btn-sm" onClick={() => { setAssignModal({ complaintId: c.id }); setSelectedWorker(""); }}>
                        Assign Worker
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleReject(c.id)}>Reject</button>
                      <Link href={`/warden/complaints/${c.id}`} className="btn btn-ghost btn-sm">View</Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Assign modal */}
      {assignModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setAssignModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Assign Worker</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setAssignModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Select a worker from your hostel to handle this complaint.</p>
              <div className="form-group">
                <label className="form-label" htmlFor="assign-worker-select">Worker</label>
                <select id="assign-worker-select" className="form-input" value={selectedWorker} onChange={(e) => setSelectedWorker(e.target.value)}>
                  <option value="">— Select a worker —</option>
                  {workers.map((w) => <option key={w.id} value={w.id}>{w.name} {w.isActive ? "" : "(Inactive)"}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setAssignModal(null)} disabled={assigning}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAssign} disabled={assigning}>
                {assigning ? <LoadingSpinner size="sm" /> : "Assign →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
