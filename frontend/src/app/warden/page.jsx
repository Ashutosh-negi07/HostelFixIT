"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import useAuthStore from "@/store/authStore";
import { getDashboardStats } from "@/lib/api/dashboard.api";
import { getComplaints, assignWorker, rejectComplaint } from "@/lib/api/complaints.api";
import { getUsers } from "@/lib/api/users.api";
import StatCard from "@/components/shared/StatCard";
import ComplaintCard from "@/components/shared/ComplaintCard";
import StatusBadge from "@/components/shared/StatusBadge";
import PriorityBadge from "@/components/shared/PriorityBadge";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import EmptyState from "@/components/shared/EmptyState";
import toast from "react-hot-toast";

export default function WardenDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats]   = useState(null);
  const [pending, setPending] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  // Assign modal state
  const [assignModal, setAssignModal] = useState(null); // { complaintId }
  const [selectedWorker, setSelectedWorker] = useState("");
  const [assigning, setAssigning] = useState(false);

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
      toast.success("Worker assigned! ✅");
      setPending((p) => p.filter((c) => c.id !== assignModal.complaintId));
      setAssignModal(null);
      setSelectedWorker("");
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
    { icon: "📋", label: "Total",       value: stats.totalComplaints,      color: "#6366f1" },
    { icon: "🕐", label: "Pending",     value: stats.pendingComplaints,    color: "#f59e0b" },
    { icon: "👷", label: "Assigned",    value: stats.assignedComplaints,   color: "#3b82f6" },
    { icon: "⚙️", label: "In Progress", value: stats.inProgressComplaints, color: "#8b5cf6" },
    { icon: "✅", label: "Resolved",    value: stats.resolvedComplaints,   color: "#22c55e" },
    { icon: "❌", label: "Rejected",    value: stats.rejectedComplaints,   color: "#ef4444" },
    { icon: "🎓", label: "Students",    value: stats.totalUsers - (stats.usersByRole?.WORKER || 0), color: "#06b6d4" },
    { icon: "⭐", label: "Avg Rating",  value: stats.averageRating ? stats.averageRating.toFixed(1) : "—", color: "#f59e0b" },
  ] : [];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Warden Dashboard 🏢</h1>
          <p className="page-subtitle">Manage complaints and staff for your hostel.</p>
        </div>
        <Link href="/warden/complaints" className="btn btn-secondary">View All Complaints →</Link>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}><LoadingSpinner size="lg" /></div>
      ) : (
        <div className="stat-grid" style={{ marginBottom: "2rem" }}>
          {statCards.map((c) => <StatCard key={c.label} {...c} />)}
        </div>
      )}

      {/* Pending complaints needing action */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 600 }}>
            🕐 Pending Review
            {pending.length > 0 && (
              <span style={{ marginLeft: "0.5rem", background: "rgba(245,158,11,0.15)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 999, fontSize: "0.75rem", padding: "0.15rem 0.5rem" }}>
                {pending.length}
              </span>
            )}
          </h2>
          <Link href="/warden/complaints?status=PENDING" style={{ fontSize: "0.875rem", color: "var(--text-link)" }}>View all →</Link>
        </div>

        {loading ? null : pending.length === 0 ? (
          <EmptyState icon="✅" title="All caught up!" description="No pending complaints require your attention right now." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {pending.map((c) => (
              <div
                key={c.id}
                className="card"
                style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}
              >
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.375rem", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--accent-primary)" }}>{c.categoryName}</span>
                    <PriorityBadge priority={c.priority} />
                  </div>
                  <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", margin: 0, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical" }}>
                    {c.description}
                  </p>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>👤 {c.studentName}</div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => { setAssignModal({ complaintId: c.id }); setSelectedWorker(""); }}
                  >
                    Assign Worker
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleReject(c.id)}
                  >
                    Reject
                  </button>
                  <Link href={`/warden/complaints/${c.id}`} className="btn btn-ghost btn-sm">View</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
                <select
                  id="assign-worker-select"
                  className="form-input"
                  value={selectedWorker}
                  onChange={(e) => setSelectedWorker(e.target.value)}
                >
                  <option value="">— Select a worker —</option>
                  {workers.map((w) => (
                    <option key={w.id} value={w.id}>{w.name} {w.isActive ? "" : "(Inactive)"}</option>
                  ))}
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
