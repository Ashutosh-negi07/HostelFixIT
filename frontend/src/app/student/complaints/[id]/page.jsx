"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import { getComplaint, cancelComplaint } from "@/lib/api/complaints.api";
import { getFeedback, submitFeedback } from "@/lib/api/feedback.api";
import StatusBadge from "@/components/shared/StatusBadge";
import PriorityBadge from "@/components/shared/PriorityBadge";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import ConfirmModal from "@/components/shared/ConfirmModal";

const STATUS_STEPS = ["PENDING", "ASSIGNED", "IN_PROGRESS", "RESOLVED"];

function fmt(date) {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function StudentComplaintDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [complaint, setComplaint] = useState(null);
  const [feedback, setFeedback]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [cancelling, setCancelling]       = useState(false);
  const [feedbackForm, setFeedbackForm]   = useState({ rating: 0, comment: "" });
  const [hoverStar, setHoverStar]         = useState(0);
  const [submitFbLoading, setSubmitFbLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [c] = await Promise.all([getComplaint("STUDENT", id)]);
        setComplaint(c);
        // Try fetching feedback (may 404 if none yet)
        try {
          const fb = await getFeedback("STUDENT", id);
          setFeedback(fb);
        } catch {}
      } catch {
        toast.error("Complaint not found.");
        router.push("/student/complaints");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, router]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await cancelComplaint(id);
      toast.success("Complaint cancelled.");
      router.push("/student/complaints");
    } catch {
      toast.error("Failed to cancel complaint.");
    } finally {
      setCancelling(false);
      setCancelConfirm(false);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (feedbackForm.rating === 0) { toast.error("Please select a rating."); return; }
    setSubmitFbLoading(true);
    try {
      const fb = await submitFeedback({ complaintId: id, ...feedbackForm });
      setFeedback(fb);
      toast.success("Feedback submitted! Thank you 🙏");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit feedback.");
    } finally {
      setSubmitFbLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
        <LoadingSpinner size="xl" />
      </div>
    );
  }
  if (!complaint) return null;

  const canCancel   = complaint.status === "PENDING";
  const canFeedback = (complaint.status === "RESOLVED" || complaint.status === "REJECTED") && !feedback;
  const currentStep = STATUS_STEPS.indexOf(complaint.status);
  const isRejected  = complaint.status === "REJECTED";

  return (
    <div className="animate-fade-in" style={{ maxWidth: 760 }}>
      {/* Back link */}
      <Link
        href="/student/complaints"
        style={{ color: "var(--text-muted)", fontSize: "0.875rem", display: "inline-flex", alignItems: "center", gap: "0.375rem", marginBottom: "1.25rem" }}
      >
        ← Back to complaints
      </Link>

      {/* Header card */}
      <div className="card-elevated" style={{ marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: "0.875rem", color: "var(--accent-primary)", fontWeight: 600, marginBottom: "0.25rem" }}>
              {complaint.categoryName}
            </div>
            <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>{complaint.hostelName}</div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <StatusBadge status={complaint.status} />
            <PriorityBadge priority={complaint.priority} />
          </div>
        </div>

        <p style={{ color: "var(--text-primary)", lineHeight: 1.7, marginBottom: "1rem" }}>
          {complaint.description}
        </p>

        {/* Dates */}
        <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
          <span>📅 Filed: {fmt(complaint.createdAt)}</span>
          {complaint.resolvedAt && <span>✅ Resolved: {fmt(complaint.resolvedAt)}</span>}
          {complaint.assignedWorkerName && <span>👷 Worker: {complaint.assignedWorkerName}</span>}
        </div>
      </div>

      {/* Photo */}
      {complaint.photoUrl && (
        <div className="card-elevated" style={{ marginBottom: "1.25rem" }}>
          <h3 style={{ fontSize: "0.9375rem", marginBottom: "0.875rem" }}>📷 Photo</h3>
          <div style={{ borderRadius: 10, overflow: "hidden" }}>
            <Image
              src={complaint.photoUrl.replace(/^http:\/\//, "https://")}
              alt="Complaint photo"
              width={720}
              height={360}
              style={{ objectFit: "cover", width: "100%", height: "auto", maxHeight: 360 }}
            />
          </div>
        </div>
      )}

      {/* Status stepper */}
      <div className="card-elevated" style={{ marginBottom: "1.25rem" }}>
        <h3 style={{ fontSize: "0.9375rem", marginBottom: "1.25rem" }}>📊 Complaint Progress</h3>
        {isRejected ? (
          <div style={{ padding: "1rem", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, color: "#f87171", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            ❌ This complaint was <strong>rejected</strong> by the warden.
          </div>
        ) : (
          <div className="stepper">
            {STATUS_STEPS.map((step, i) => (
              <div key={step} className="step">
                <div className={`step-dot${i < currentStep ? " done" : i === currentStep ? " current" : ""}`}>
                  {i < currentStep ? "✓" : i + 1}
                </div>
                <div style={{ fontSize: "0.72rem", color: i <= currentStep ? "var(--text-primary)" : "var(--text-muted)", whiteSpace: "nowrap" }}>
                  {step.replace("_", " ")}
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <div className={`step-line${i < currentStep ? " done" : ""}`} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Feedback section */}
      {canFeedback && (
        <div className="card-elevated" style={{ marginBottom: "1.25rem" }}>
          <h3 style={{ fontSize: "0.9375rem", marginBottom: "0.875rem" }}>
            💬 Leave Feedback
          </h3>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
            How was the maintenance experience? Your feedback helps improve the system.
          </p>
          <form onSubmit={handleFeedbackSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <div className="form-label" style={{ marginBottom: "0.5rem" }}>Rating</div>
              <div className="star-rating">
                {[1, 2, 3, 4, 5].map((s) => (
                  <span
                    key={s}
                    className={`star${s <= (hoverStar || feedbackForm.rating) ? " active" : ""}`}
                    onClick={() => setFeedbackForm((f) => ({ ...f, rating: s }))}
                    onMouseEnter={() => setHoverStar(s)}
                    onMouseLeave={() => setHoverStar(0)}
                    role="button"
                    tabIndex={0}
                    aria-label={`${s} star`}
                    onKeyDown={(e) => e.key === "Enter" && setFeedbackForm((f) => ({ ...f, rating: s }))}
                  >
                    ★
                  </span>
                ))}
                {feedbackForm.rating > 0 && (
                  <span style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginLeft: "0.5rem" }}>
                    {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][feedbackForm.rating]}
                  </span>
                )}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="feedback-comment">Comment (optional)</label>
              <textarea
                id="feedback-comment"
                className="form-input"
                placeholder="Share your experience with the repair process…"
                value={feedbackForm.comment}
                onChange={(e) => setFeedbackForm((f) => ({ ...f, comment: e.target.value }))}
                rows={3}
              />
            </div>
            <button
              id="submit-feedback-btn"
              type="submit"
              className="btn btn-success"
              disabled={submitFbLoading}
            >
              {submitFbLoading ? <LoadingSpinner size="sm" /> : "Submit Feedback ✓"}
            </button>
          </form>
        </div>
      )}

      {/* Existing feedback */}
      {feedback && (
        <div className="card-elevated" style={{ marginBottom: "1.25rem" }}>
          <h3 style={{ fontSize: "0.9375rem", marginBottom: "0.875rem" }}>⭐ Your Feedback</h3>
          <div style={{ display: "flex", gap: "0.25rem", marginBottom: "0.625rem" }}>
            {[1,2,3,4,5].map((s) => (
              <span key={s} style={{ color: s <= feedback.rating ? "#fbbf24" : "var(--text-muted)", fontSize: "1.25rem" }}>★</span>
            ))}
            <span style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginLeft: "0.5rem" }}>
              {feedback.rating}/5
            </span>
          </div>
          {feedback.comment && (
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", fontStyle: "italic" }}>
              "{feedback.comment}"
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      {canCancel && (
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Link href="/student/complaints" className="btn btn-secondary">← Back</Link>
          <button
            id="cancel-complaint-btn"
            className="btn btn-danger"
            onClick={() => setCancelConfirm(true)}
          >
            🗑 Cancel Complaint
          </button>
        </div>
      )}

      {cancelConfirm && (
        <ConfirmModal
          title="Cancel Complaint?"
          message="This will permanently cancel your complaint. This action cannot be undone."
          confirmLabel="Yes, Cancel It"
          onConfirm={handleCancel}
          onCancel={() => setCancelConfirm(false)}
          loading={cancelling}
        />
      )}
    </div>
  );
}
