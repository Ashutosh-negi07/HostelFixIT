export default function StatCard({ icon, label, value, color = "#0ea5e9", trend }) {
  const bgColor = `${color}12`;
  const borderColor = `${color}20`;
  return (
    <div className="stat-card animate-slide-up">
      <div
        className="stat-card-icon"
        style={{ background: bgColor, color, border: `1px solid ${borderColor}` }}
      >
        {icon}
      </div>
      <div className="stat-card-value">{value ?? "—"}</div>
      <div className="stat-card-label">{label}</div>
      {trend !== undefined && (
        <div
          style={{
            marginTop: "0.375rem",
            fontSize: "0.75rem",
            color: trend >= 0 ? "#16a34a" : "#dc2626",
            display: "flex",
            alignItems: "center",
            gap: "0.2rem",
            fontWeight: 500,
          }}
        >
          {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}% vs last week
        </div>
      )}
    </div>
  );
}
