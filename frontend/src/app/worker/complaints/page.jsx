"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getComplaints, startProgress, resolveComplaint } from "@/lib/api/complaints.api";
import StatusBadge from "@/components/shared/StatusBadge";
import PriorityBadge from "@/components/shared/PriorityBadge";
import Pagination from "@/components/shared/Pagination";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import EmptyState from "@/components/shared/EmptyState";
import toast from "react-hot-toast";

const TABS = [
  { label: "All",         value: "" },
  { label: "Assigned",    value: "ASSIGNED" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Resolved",    value: "RESOLVED" },
];

export default function WorkerComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [tab, setTab]       = useState("");
  const [page, setPage]     = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, size: 10, sortBy: "createdAt", order: "desc", ...(tab && { status: tab }) };
      const data = await getComplaints("WORKER", params);
      setComplaints(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotal(data.totalElements || 0);
    } catch { } finally { setLoading(false); }
  }, [page, tab]);

  useEffect(() => { load(); }, [load]);

  const handleStart = async (id, e) => {
    e.preventDefault(); e.stopPropagation();
    setActionId(id);
    try { await startProgress(id); toast.success("In Progress ⚙️"); load(); }
    catch { toast.error("Failed."); } finally { setActionId(null); }
  };

  const handleResolve = async (id, e) => {
    e.preventDefault(); e.stopPropagation();
    setActionId(id);
    try { await resolveComplaint(id); toast.success("Resolved ✅"); load(); }
    catch { toast.error("Failed."); } finally { setActionId(null); }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div><h1 className="page-title">My Tasks 🔧</h1><p className="page-subtitle">{total} assigned complaint{total !== 1 ? "s" : ""}</p></div>
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t.value} className={`tab${tab === t.value ? " active" : ""}`} onClick={() => { setTab(t.value); setPage(0); }}>{t.label}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}><LoadingSpinner size="lg" /></div>
      ) : complaints.length === 0 ? (
        <EmptyState icon="📭" title="No tasks here" description="Nothing in this category." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {complaints.map((c) => (
            <Link key={c.id} href={`/worker/complaints/${c.id}`} style={{ textDecoration: "none" }}>
              <div className="card" style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap", cursor: "pointer" }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.375rem", flexWrap: "wrap", alignItems: "center" }}>
                    <StatusBadge status={c.status} />
                    <PriorityBadge priority={c.priority} />
                    <span style={{ fontSize: "0.8125rem", color: "var(--accent-primary)", fontWeight: 500 }}>{c.categoryName}</span>
                  </div>
                  <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", margin: 0, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{c.description}</p>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.375rem" }}>👤 {c.studentName}</div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }} onClick={(e) => e.preventDefault()}>
                  {c.status === "ASSIGNED"    && <button className="btn btn-primary btn-sm"  onClick={(e) => handleStart(c.id, e)}   disabled={actionId === c.id}>{actionId === c.id ? <LoadingSpinner size="sm" /> : "Start ⚙️"}</button>}
                  {c.status === "IN_PROGRESS" && <button className="btn btn-success btn-sm" onClick={(e) => handleResolve(c.id, e)} disabled={actionId === c.id}>{actionId === c.id ? <LoadingSpinner size="sm" /> : "Resolve ✅"}</button>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
