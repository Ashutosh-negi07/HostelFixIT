"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import { getComplaint, assignWorker, reassignWorker, rejectComplaint, getComplaintHistory } from "@/lib/api/complaints.api";
import { getFeedback } from "@/lib/api/feedback.api";
import { getUsers } from "@/lib/api/users.api";
import StatusBadge from "@/components/shared/StatusBadge";
import PriorityBadge from "@/components/shared/PriorityBadge";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

function fmt(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const STATUS_ICONS = { PENDING: "🕐", ASSIGNED: "👷", IN_PROGRESS: "⚙️", RESOLVED: "✅", REJECTED: "❌" };

export default function WardenComplaintDetail() {
  const { id } = useParams();
  const router  = useRouter();
  const [complaint, setComplaint] = useState(null);
  const [history, setHistory]     = useState([]);
  const [feedback, setFeedback]   = useState(null);
  const [workers, setWorkers]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(null); // "assign" | "reassign" | "reject"
  const [selectedWorker, setSelectedWorker] = useState("");
  const [actionLoading, setActionLoading]   = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [c, h, w] = await Promise.all([
          getComplaint("WARDEN", id),
          getComplaintHistory("WARDEN", id),
          getUsers("WARDEN", "WORKER", { size: 50 }),
        ]);
        setComplaint(c);
        setHistory(h);
        setWorkers(w.content || []);
        try { setFeedback(await getFeedback("WARDEN", id)); } catch {}
      } catch {
        toast.error("Complaint not found.");
        router.push("/warden/complaints");
      } finally { setLoading(false); }
    }
    load();
  }, [id, router]);

  const doAssign = async () => {
    if (!selectedWorker) { toast.error("Select a worker."); return; }
    setActionLoading(true);
    try {
      const updated = modal === "assign"
        ? await assignWorker(id, selectedWorker)
        : await reassignWorker(id, selectedWorker);
      setComplaint(updated);
      toast.success(`Worker ${modal === "assign" ? "assigned" : "reassigned"}!`);
      setModal(null); setSelectedWorker("");
      const h = await getComplaintHistory("WARDEN", id);
      setHistory(h);
    } catch { toast.error("Action failed."); }
    finally { setActionLoading(false); }
  };

  const doReject = async () => {
    setActionLoading(true);
    try {
      const updated = await rejectComplaint(id);
      setComplaint(updated);
      toast.success("Complaint rejected.");
      setModal(null);
      const h = await getComplaintHistory("WARDEN", id);
      setHistory(h);
    } catch { toast.error("Action failed."); }
    finally { setActionLoading(false); }
  };

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}><LoadingSpinner size="xl" /></div>;
  if (!complaint) return null;

  const canAssign    = complaint.status === "PENDING";
  const canReassign  = complaint.status === "ASSIGNED" || complaint.status === "IN_PROGRESS";
  const canReject    = complaint.status === "PENDING";

  return (
    <div className="animate-fade-in" style={{ maxWidth: 760 }}>
      <Link href="/warden/complaints" style={{ color: "var(--text-muted)", fontSize: "0.875rem", display: "inline-flex", alignItems: "center", gap: "0.375rem", marginBottom: "1.25rem" }}>
        ← Back to complaints
      </Link>

      {/* Header */}
      <div className="card-elevated" style={{ marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: "0.875rem", color: "var(--accent-primary)", fontWeight: 600, marginBottom: "0.25rem" }}>{complaint.categoryName}</div>
            <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>{complaint.hostelName}</div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <StatusBadge status={complaint.status} />
            <PriorityBadge priority={complaint.priority} />
          </div>
        </div>
        <p style={{ color: "var(--text-primary)", lineHeight: 1.7, marginBottom: "1rem" }}>{complaint.description}</p>
        <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
          <span>👤 Student: <strong style={{ color: "var(--text-secondary)" }}>{complaint.studentName}</strong></span>
          {complaint.assignedWorkerName && <span>👷 Worker: <strong style={{ color: "var(--text-secondary)" }}>{complaint.assignedWorkerName}</strong></span>}
          <span>📅 Filed: {fmt(complaint.createdAt)}</span>
          {complaint.resolvedAt && <span>✅ Resolved: {fmt(complaint.resolvedAt)}</span>}
        </div>
      </div>

      {/* Actions */}
      {(canAssign || canReassign || canReject) && (
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
          {canAssign    && <button className="btn btn-primary" onClick={() => { setModal("assign");   setSelectedWorker(""); }}>👷 Assign Worker</button>}
          {canReassign  && <button className="btn btn-secondary" onClick={() => { setModal("reassign"); setSelectedWorker(""); }}>🔄 Reassign</button>}
          {canReject    && <button className="btn btn-danger" onClick={() => setModal("reject")}>❌ Reject</button>}
        </div>
      )}

      {/* Photo */}
      {complaint.photoUrl && (
        <div className="card-elevated" style={{ marginBottom: "1.25rem" }}>
          <h3 style={{ fontSize: "0.9375rem", marginBottom: "0.875rem" }}>📷 Photo</h3>
          <Image src={complaint.photoUrl.replace(/^http:\/\//, "https://")} alt="Complaint" width={720} height={360} style={{ borderRadius: 10, objectFit: "cover", width: "100%", height: "auto", maxHeight: 360 }} />
        </div>
      )}

      {/* Status history */}
      {history.length > 0 && (
        <div className="card-elevated" style={{ marginBottom: "1.25rem" }}>
          <h3 style={{ fontSize: "0.9375rem", marginBottom: "1rem" }}>📜 Status History</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {history.map((h) => (
              <div key={h.id} style={{ display: "flex", gap: "0.875rem", alignItems: "flex-start" }}>
                <div style={{ fontSize: "1.25rem", flexShrink: 0 }}>{STATUS_ICONS[h.newStatus] || "•"}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.875rem", color: "var(--text-primary)", fontWeight: 500 }}>
                    {h.oldStatus ? `${h.oldStatus.replace("_"," ")} → ${h.newStatus.replace("_"," ")}` : h.newStatus.replace("_"," ")}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    by {h.changedByName} · {fmt(h.changedAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feedback */}
      {feedback && (
        <div className="card-elevated">
          <h3 style={{ fontSize: "0.9375rem", marginBottom: "0.875rem" }}>⭐ Student Feedback</h3>
          <div style={{ display: "flex", gap: "0.25rem", marginBottom: "0.625rem" }}>
            {[1,2,3,4,5].map((s) => <span key={s} style={{ color: s <= feedback.rating ? "#fbbf24" : "var(--text-muted)", fontSize: "1.25rem" }}>★</span>)}
            <span style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginLeft: "0.5rem" }}>{feedback.rating}/5</span>
          </div>
          {feedback.comment && <p style={{ color: "var(--text-secondary)", fontStyle: "italic" }}>"{feedback.comment}"</p>}
        </div>
      )}

      {/* Assign / Reassign / Reject Modals */}
      {(modal === "assign" || modal === "reassign") && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">{modal === "assign" ? "Assign Worker" : "Reassign Worker"}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label" htmlFor="warden-worker-select">Select Worker</label>
                <select id="warden-worker-select" className="form-input" value={selectedWorker} onChange={(e) => setSelectedWorker(e.target.value)}>
                  <option value="">— Choose a worker —</option>
                  {workers.filter(w => w.isActive).map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(null)} disabled={actionLoading}>Cancel</button>
              <button className="btn btn-primary" onClick={doAssign} disabled={actionLoading}>
                {actionLoading ? <LoadingSpinner size="sm" /> : modal === "assign" ? "Assign →" : "Reassign →"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === "reject" && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3 className="modal-title">Reject Complaint?</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal(null)}>✕</button>
            </div>
            <p style={{ color: "var(--text-secondary)" }}>Are you sure you want to reject this complaint? The student will be notified.</p>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(null)} disabled={actionLoading}>Cancel</button>
              <button className="btn btn-danger" onClick={doReject} disabled={actionLoading}>
                {actionLoading ? <LoadingSpinner size="sm" /> : "Yes, Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
