export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const start = Math.max(0, page - 2);
  const end   = Math.min(totalPages - 1, page + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.375rem",
        marginTop: "1.5rem",
        flexWrap: "wrap",
      }}
    >
      <button
        className="btn btn-secondary btn-sm"
        disabled={page === 0}
        onClick={() => onPageChange(page - 1)}
      >
        ← Prev
      </button>

      {start > 0 && (
        <>
          <button className="btn btn-ghost btn-sm" onClick={() => onPageChange(0)}>1</button>
          {start > 1 && <span style={{ color: "var(--text-muted)" }}>…</span>}
        </>
      )}

      {pages.map((p) => (
        <button
          key={p}
          className={p === page ? "btn btn-primary btn-sm" : "btn btn-ghost btn-sm"}
          onClick={() => onPageChange(p)}
        >
          {p + 1}
        </button>
      ))}

      {end < totalPages - 1 && (
        <>
          {end < totalPages - 2 && <span style={{ color: "var(--text-muted)" }}>…</span>}
          <button className="btn btn-ghost btn-sm" onClick={() => onPageChange(totalPages - 1)}>
            {totalPages}
          </button>
        </>
      )}

      <button
        className="btn btn-secondary btn-sm"
        disabled={page >= totalPages - 1}
        onClick={() => onPageChange(page + 1)}
      >
        Next →
      </button>
    </div>
  );
}
