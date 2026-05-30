const STATUS_MAP = {
  PENDING:     { label: "Pending",     cls: "badge badge-pending",    icon: "🕐" },
  ASSIGNED:    { label: "Assigned",    cls: "badge badge-assigned",   icon: "👷" },
  IN_PROGRESS: { label: "In Progress", cls: "badge badge-inprogress", icon: "⚙️" },
  RESOLVED:    { label: "Resolved",    cls: "badge badge-resolved",   icon: "✅" },
  REJECTED:    { label: "Rejected",    cls: "badge badge-rejected",   icon: "❌" },
};

export default function StatusBadge({ status }) {
  const config = STATUS_MAP[status] || { label: status, cls: "badge", icon: "•" };
  return (
    <span className={config.cls}>
      {config.icon} {config.label}
    </span>
  );
}
