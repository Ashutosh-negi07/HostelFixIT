const PRIORITY_MAP = {
  LOW:    { label: "Low",    cls: "badge badge-low",    icon: "▽" },
  NORMAL: { label: "Normal", cls: "badge badge-normal", icon: "◈" },
  HIGH:   { label: "High",   cls: "badge badge-high",   icon: "▲" },
};

export default function PriorityBadge({ priority }) {
  const config = PRIORITY_MAP[priority] || { label: priority, cls: "badge", icon: "•" };
  return (
    <span className={config.cls}>
      {config.icon} {config.label}
    </span>
  );
}
