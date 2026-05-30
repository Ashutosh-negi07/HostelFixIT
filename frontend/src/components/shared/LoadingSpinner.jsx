export default function LoadingSpinner({ size = "md", className = "" }) {
  const sizes = { sm: 16, md: 24, lg: 40, xl: 56 };
  const px = sizes[size] || 24;
  return (
    <span
      className={className}
      style={{
        display: "inline-block",
        width: px,
        height: px,
        border: `2px solid rgba(14,165,233,0.18)`,
        borderTopColor: "var(--accent-primary)",
        borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
      }}
      aria-label="Loading"
    />
  );
}
