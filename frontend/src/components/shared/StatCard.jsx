export default function StatCard({ icon, label, value, color = "#6366f1", trend }) {
  const bgColor = `${color}18`;
  return (
    <div className="stat-card animate-slide-up">
      <div className="stat-card-icon" style={{ background: bgColor, color }}>
        {icon}
      </div>
      <div className="stat-card-value">{value ?? "—"}</div>
      <div className="stat-card-label">{label}</div>
      {trend !== undefined && (
        <div
          style={{
            marginTop: "0.375rem",
            fontSize: "0.75rem",
            color: trend >= 0 ? "#4ade80" : "#f87171",
            display: "flex",
            alignItems: "center",
            gap: "0.2rem",
          }}
        >
          {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}% vs last week
        </div>
      )}
    </div>
  );
}
