"use client";
import { useRouter } from "next/navigation";
import StatusBadge from "./StatusBadge";
import PriorityBadge from "./PriorityBadge";

const WorkerIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
  </svg>
);
const PhotoIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
);
const ClockIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);
const UserIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

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
          <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--accent-primary)", marginBottom: "0.25rem" }}>
            {complaint.categoryName || "Uncategorized"}
          </div>
          <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
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
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <WorkerIcon /> {complaint.assignedWorkerName}
          </span>
        )}
        {complaint.photoUrl && (
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <PhotoIcon /> Photo
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="complaint-card-footer">
        <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
          <ClockIcon /> {timeAgo(complaint.createdAt)}
        </span>
        {complaint.studentName && role !== "STUDENT" && (
          <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <UserIcon /> {complaint.studentName}
          </span>
        )}
        {complaint.resolvedAt && (
          <span style={{ color: "var(--status-resolved-text)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <CheckIcon /> Resolved {timeAgo(complaint.resolvedAt)}
          </span>
        )}
      </div>
    </div>
  );
}
