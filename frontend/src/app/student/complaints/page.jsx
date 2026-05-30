"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getComplaints } from "@/lib/api/complaints.api";
import { getCategories } from "@/lib/api/categories.api";
import ComplaintCard from "@/components/shared/ComplaintCard";
import Pagination from "@/components/shared/Pagination";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import EmptyState from "@/components/shared/EmptyState";

const STATUSES   = ["", "PENDING", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "REJECTED"];
const PRIORITIES = ["", "LOW", "NORMAL", "HIGH"];

export default function StudentComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [page, setPage]             = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal]           = useState(0);
  const [filters, setFilters]       = useState({ status: "", priority: "", categoryId: "" });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        size: 10,
        sortBy: "createdAt",
        order: "desc",
        ...(filters.status     && { status:     filters.status }),
        ...(filters.priority   && { priority:   filters.priority }),
        ...(filters.categoryId && { categoryId: filters.categoryId }),
      };
      const data = await getComplaints("STUDENT", params);
      setComplaints(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotal(data.totalElements || 0);
    } catch (e) {
      console.error("Failed to load complaints:", e?.message || e);
      setError("Could not load complaints. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);

  const handleFilter = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(0);
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Complaints</h1>
          <p className="page-subtitle">
            {loading ? "Loading…" : `${total} total complaint${total !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Link href="/student/complaints/new" className="btn btn-primary">
          + New Complaint
        </Link>
      </div>

      {/* Filters */}
      <div className="filter-bar" style={{ marginBottom: "1.25rem" }}>
        <select
          className="filter-select"
          id="filter-status"
          value={filters.status}
          onChange={(e) => handleFilter("status", e.target.value)}
        >
          <option value="">All Statuses</option>
          {STATUSES.filter(Boolean).map((s) => (
            <option key={s} value={s}>{s.replace("_", " ")}</option>
          ))}
        </select>

        <select
          className="filter-select"
          id="filter-priority"
          value={filters.priority}
          onChange={(e) => handleFilter("priority", e.target.value)}
        >
          <option value="">All Priorities</option>
          {PRIORITIES.filter(Boolean).map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <select
          className="filter-select"
          id="filter-category"
          value={filters.categoryId}
          onChange={(e) => handleFilter("categoryId", e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        {(filters.status || filters.priority || filters.categoryId) && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => { setFilters({ status: "", priority: "", categoryId: "" }); setPage(0); }}
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", padding: "3rem" }}>
          <LoadingSpinner size="lg" />
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Loading your complaints… (this may take a moment)
          </p>
        </div>
      ) : error ? (
        <div style={{
          padding: "2rem",
          textAlign: "center",
          background: "rgba(239,68,68,0.06)",
          border: "1px solid rgba(239,68,68,0.15)",
          borderRadius: 12,
        }}>
          <p style={{ color: "#ef4444", marginBottom: "1rem" }}>{error}</p>
          <button className="btn btn-primary btn-sm" onClick={loadData}>
            Retry
          </button>
        </div>
      ) : complaints.length === 0 ? (
        <EmptyState
          icon="📭"
          title="No complaints found"
          description={
            filters.status || filters.priority || filters.categoryId
              ? "Try adjusting your filters."
              : "You haven't filed any complaints yet."
          }
          action={
            !filters.status && !filters.priority && !filters.categoryId ? (
              <Link href="/student/complaints/new" className="btn btn-primary btn-sm">
                File First Complaint
              </Link>
            ) : null
          }
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {complaints.map((c) => (
            <ComplaintCard key={c.id} complaint={c} role="STUDENT" />
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
