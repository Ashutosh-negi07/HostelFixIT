"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import { getComplaint, startProgress, resolveComplaint } from "@/lib/api/complaints.api";
import { getFeedback } from "@/lib/api/feedback.api";
import StatusBadge from "@/components/shared/StatusBadge";
import PriorityBadge from "@/components/shared/PriorityBadge";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

function fmt(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function WorkerComplaintDetail() {
  const { id } = useParams();
  const router  = useRouter();
  const [complaint, setComplaint] = useState(null);
  const [feedback, setFeedback]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const c = await getComplaint("WORKER", id);
        setComplaint(c);
        try { setFeedback(await getFeedback("WORKER", id)); } catch {}
      } catch {
        toast.error("Complaint not found.");
        router.push("/worker/complaints");
      } finally { setLoading(false); }
    }
    load();
  }, [id, router]);

  const handleStart = async () => {
    setActionLoading(true);
    try {
      const updated = await startProgress(id);
      setComplaint(updated);
      toast.success("Marked as In Progress ⚙️");
    } catch { toast.error("Failed."); } finally { setActionLoading(false); }
  };

  const handleResolve = async () => {
    setActionLoading(true);
    try {
      const updated = await resolveComplaint(id);
      setComplaint(updated);
      toast.success("Complaint Resolved! ✅");
    } catch { toast.error("Failed."); } finally { setActionLoading(false); }
  };

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}><LoadingSpinner size="xl" /></div>;
  if (!complaint) return null;

  return (
    <div className="animate-fade-in" style={{ maxWidth: 720 }}>
      <Link href="/worker/complaints" style={{ color: "var(--text-muted)", fontSize: "0.875rem", display: "inline-flex", alignItems: "center", gap: "0.375rem", marginBottom: "1.25rem" }}>
        ← Back to tasks
      </Link>

      <div className="card-elevated" style={{ marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: "0.875rem", color: "var(--accent-primary)", fontWeight: 600, marginBottom: "0.25rem" }}>{complaint.categoryName}</div>
            <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>{complaint.hostelName}</div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <StatusBadge status={complaint.status} />
            <PriorityBadge priority={complaint.priority} />
          </div>
        </div>
        <p style={{ color: "var(--text-primary)", lineHeight: 1.7, marginBottom: "1rem" }}>{complaint.description}</p>
        <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
          <span>👤 Student: <strong style={{ color: "var(--text-secondary)" }}>{complaint.studentName}</strong></span>
          <span>📅 Filed: {fmt(complaint.createdAt)}</span>
          {complaint.resolvedAt && <span>✅ Resolved: {fmt(complaint.resolvedAt)}</span>}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem" }}>
        {complaint.status === "ASSIGNED" && (
          <button className="btn btn-primary" onClick={handleStart} disabled={actionLoading}>
            {actionLoading ? <LoadingSpinner size="sm" /> : "⚙️ Start Work"}
          </button>
        )}
        {complaint.status === "IN_PROGRESS" && (
          <button className="btn btn-success" onClick={handleResolve} disabled={actionLoading}>
            {actionLoading ? <LoadingSpinner size="sm" /> : "✅ Mark as Resolved"}
          </button>
        )}
      </div>

      {/* Photo */}
      {complaint.photoUrl && (
        <div className="card-elevated" style={{ marginBottom: "1.25rem" }}>
          <h3 style={{ fontSize: "0.9375rem", marginBottom: "0.875rem" }}>📷 Photo</h3>
          <Image src={complaint.photoUrl} alt="Complaint" width={720} height={360} style={{ borderRadius: 10, objectFit: "cover", width: "100%", height: "auto", maxHeight: 360 }} />
        </div>
      )}

      {/* Feedback */}
      {feedback && (
        <div className="card-elevated">
          <h3 style={{ fontSize: "0.9375rem", marginBottom: "0.875rem" }}>⭐ Student Feedback</h3>
          <div style={{ display: "flex", gap: "0.25rem", marginBottom: "0.5rem" }}>
            {[1,2,3,4,5].map((s) => <span key={s} style={{ color: s <= feedback.rating ? "#fbbf24" : "var(--text-muted)", fontSize: "1.25rem" }}>★</span>)}
          </div>
          {feedback.comment && <p style={{ color: "var(--text-secondary)", fontStyle: "italic" }}>"{feedback.comment}"</p>}
        </div>
      )}
    </div>
  );
}
