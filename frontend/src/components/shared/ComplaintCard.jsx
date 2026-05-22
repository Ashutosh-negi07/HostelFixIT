"use client";
import { useRouter } from "next/navigation";
import StatusBadge from "./StatusBadge";
import PriorityBadge from "./PriorityBadge";

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return "just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function ComplaintCard({ complaint, role = "STUDENT", onClick }) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) { onClick(complaint); return; }
    router.push(`/${role.toLowerCase()}/complaints/${complaint.id}`);
  };

  return (
    <div
      className="complaint-card animate-slide-up"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
    >
      {/* Top row */}
      <div className="complaint-card-top">
        <div>
          <div
            style={{
              fontSize: "0.8125rem",
              fontWeight: 600,
              color: "var(--accent-primary)",
              marginBottom: "0.25rem",
            }}
          >
            {complaint.categoryName || "Uncategorized"}
          </div>
          <div
            style={{
              fontSize: "0.8125rem",
              color: "var(--text-muted)",
            }}
          >
            {complaint.hostelName}
          </div>
        </div>
        <StatusBadge status={complaint.status} />
      </div>

      {/* Description */}
      <p className="complaint-card-desc">{complaint.description}</p>

      {/* Badges row */}
      <div className="complaint-card-meta">
        <PriorityBadge priority={complaint.priority} />
        {complaint.assignedWorkerName && (
          <span
            style={{
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
            }}
          >
            👷 {complaint.assignedWorkerName}
          </span>
        )}
        {complaint.photoUrl && (
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>📷 Photo</span>
        )}
      </div>

      {/* Footer */}
      <div className="complaint-card-footer">
        <span>🕑 {timeAgo(complaint.createdAt)}</span>
        {complaint.studentName && role !== "STUDENT" && (
          <span>👤 {complaint.studentName}</span>
        )}
        {complaint.resolvedAt && (
          <span style={{ color: "var(--status-resolved-text)" }}>
            ✅ Resolved {timeAgo(complaint.resolvedAt)}
          </span>
        )}
      </div>
    </div>
  );
}
