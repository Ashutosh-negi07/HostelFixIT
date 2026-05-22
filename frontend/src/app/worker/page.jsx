"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import useAuthStore from "@/store/authStore";
import { getComplaintCounts, getComplaints, startProgress, resolveComplaint } from "@/lib/api/complaints.api";
import StatCard from "@/components/shared/StatCard";
import StatusBadge from "@/components/shared/StatusBadge";
import PriorityBadge from "@/components/shared/PriorityBadge";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import EmptyState from "@/components/shared/EmptyState";
import toast from "react-hot-toast";

export default function WorkerDashboard() {
  const { user } = useAuthStore();
  const [counts, setCounts]   = useState(null);
  const [active, setActive]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  const load = async () => {
    try {
      const [c, a] = await Promise.all([
        getComplaintCounts("WORKER"),
        getComplaints("WORKER", { size: 10, sortBy: "createdAt", order: "asc" }),
      ]);
      setCounts(c);
      // Show ASSIGNED + IN_PROGRESS on dashboard
      setActive((a.content || []).filter((x) => x.status === "ASSIGNED" || x.status === "IN_PROGRESS"));
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleStart = async (id) => {
    setActionId(id);
    try {
      await startProgress(id);
      toast.success("Marked as In Progress ⚙️");
      load();
    } catch { toast.error("Failed."); } finally { setActionId(null); }
  };

  const handleResolve = async (id) => {
    setActionId(id);
    try {
      await resolveComplaint(id);
      toast.success("Complaint Resolved! ✅");
      load();
    } catch { toast.error("Failed."); } finally { setActionId(null); }
  };

  const statCards = [
    { icon: "🔧", label: "Total Assigned", value: counts?.total,      color: "#06b6d4" },
    { icon: "📋", label: "Assigned",       value: counts?.assigned,   color: "#3b82f6" },
    { icon: "⚙️", label: "In Progress",    value: counts?.inProgress, color: "#8b5cf6" },
    { icon: "✅", label: "Resolved",       value: counts?.resolved,   color: "#22c55e" },
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Worker Dashboard 🔧</h1>
          <p className="page-subtitle">Welcome back, {user?.name?.split(" ")[0]}. Here are your active tasks.</p>
        </div>
        <Link href="/worker/complaints" className="btn btn-secondary">All Tasks →</Link>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}><LoadingSpinner size="lg" /></div>
      ) : (
        <div className="stat-grid" style={{ marginBottom: "2rem" }}>
          {statCards.map((c) => <StatCard key={c.label} {...c} />)}
        </div>
      )}

      {/* Active tasks */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 600 }}>⚡ Active Tasks</h2>
          {active.length > 0 && <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>{active.length} task{active.length > 1 ? "s" : ""}</span>}
        </div>

        {loading ? null : active.length === 0 ? (
          <EmptyState icon="🎉" title="No active tasks!" description="You're all caught up. New tasks will appear here when assigned." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {active.map((c) => (
              <div key={c.id} className="card" style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.375rem", alignItems: "center", flexWrap: "wrap" }}>
                    <StatusBadge status={c.status} />
                    <PriorityBadge priority={c.priority} />
                    <span style={{ fontSize: "0.8125rem", color: "var(--accent-primary)", fontWeight: 500 }}>{c.categoryName}</span>
                  </div>
                  <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", margin: 0, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                    {c.description}
                  </p>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.375rem" }}>
                    👤 {c.studentName} · 🏢 {c.hostelName}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {c.status === "ASSIGNED" && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleStart(c.id)}
                      disabled={actionId === c.id}
                    >
                      {actionId === c.id ? <LoadingSpinner size="sm" /> : "Start Work ⚙️"}
                    </button>
                  )}
                  {c.status === "IN_PROGRESS" && (
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => handleResolve(c.id)}
                      disabled={actionId === c.id}
                    >
                      {actionId === c.id ? <LoadingSpinner size="sm" /> : "Mark Resolved ✅"}
                    </button>
                  )}
                  <Link href={`/worker/complaints/${c.id}`} className="btn btn-ghost btn-sm">View</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
