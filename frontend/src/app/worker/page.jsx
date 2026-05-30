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

const ToolIcon  = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>;
const FileIcon  = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
const CheckIcon = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const UserIcon  = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const HomeIcon  = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;


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
      toast.success("Marked as In Progress");
      load();
    } catch { toast.error("Failed."); } finally { setActionId(null); }
  };

  const handleResolve = async (id) => {
    setActionId(id);
    try {
      await resolveComplaint(id);
      toast.success("Complaint Resolved!");
      load();
    } catch { toast.error("Failed."); } finally { setActionId(null); }
  };

  const statCards = [
    { icon: <ToolIcon />,  label: "Total Assigned", value: counts?.total,      color: "#06b6d4" },
    { icon: <FileIcon />,  label: "Assigned",       value: counts?.assigned,   color: "#3b82f6" },
    { icon: <ToolIcon />,  label: "In Progress",    value: counts?.inProgress, color: "#8b5cf6" },
    { icon: <CheckIcon />, label: "Resolved",       value: counts?.resolved,   color: "#16a34a" },
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Worker Dashboard</h1>
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
          <h2 style={{ fontSize: "1.125rem", fontWeight: 600 }}>Active Tasks</h2>
          {active.length > 0 && <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>{active.length} task{active.length > 1 ? "s" : ""}</span>}
        </div>

        {loading ? null : active.length === 0 ? (
          <EmptyState title="No active tasks!" description="You're all caught up. New tasks will appear here when assigned." />
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
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.375rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}><UserIcon /> {c.studentName}</span>
                    <span>·</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}><HomeIcon /> {c.hostelName}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {c.status === "ASSIGNED" && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleStart(c.id)}
                      disabled={actionId === c.id}
                    >
                      {actionId === c.id ? <LoadingSpinner size="sm" /> : "Start Work"}
                    </button>
                  )}
                  {c.status === "IN_PROGRESS" && (
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => handleResolve(c.id)}
                      disabled={actionId === c.id}
                    >
                      {actionId === c.id ? <LoadingSpinner size="sm" /> : "Mark Resolved"}
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
