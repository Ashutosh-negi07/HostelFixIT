"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import useAuthStore from "@/store/authStore";
import { getComplaintCounts, getComplaints } from "@/lib/api/complaints.api";
import StatCard from "@/components/shared/StatCard";
import ComplaintCard from "@/components/shared/ComplaintCard";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import EmptyState from "@/components/shared/EmptyState";

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const [counts, setCounts]     = useState(null);
  const [recent, setRecent]     = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [c, r] = await Promise.all([
          getComplaintCounts("STUDENT"),
          getComplaints("STUDENT", { size: 5, sortBy: "createdAt", order: "desc" }),
        ]);
        setCounts(c);
        setRecent(r.content || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const statCards = [
    { icon: "📋", label: "Total",       value: counts?.total,       color: "#6366f1" },
    { icon: "🕐", label: "Pending",     value: counts?.pending,     color: "#f59e0b" },
    { icon: "👷", label: "Assigned",    value: counts?.assigned,    color: "#3b82f6" },
    { icon: "⚙️", label: "In Progress", value: counts?.inProgress,  color: "#8b5cf6" },
    { icon: "✅", label: "Resolved",    value: counts?.resolved,    color: "#22c55e" },
  ];

  return (
    <div className="animate-fade-in">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {greeting()}, {user?.name?.split(" ")[0] || "Student"} 👋
          </h1>
          <p className="page-subtitle">Here's an overview of your maintenance complaints.</p>
        </div>
        <Link href="/student/complaints/new" className="btn btn-primary">
          ➕ New Complaint
        </Link>
      </div>

      {/* Stats */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="stat-grid" style={{ marginBottom: "2rem" }}>
          {statCards.map((c) => (
            <StatCard key={c.label} {...c} />
          ))}
        </div>
      )}

      {/* Recent complaints */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1rem",
          }}
        >
          <h2 style={{ fontSize: "1.125rem", fontWeight: 600 }}>Recent Complaints</h2>
          <Link
            href="/student/complaints"
            style={{ fontSize: "0.875rem", color: "var(--text-link)" }}
          >
            View all →
          </Link>
        </div>

        {loading ? null : recent.length === 0 ? (
          <EmptyState
            icon="📭"
            title="No complaints yet"
            description="Filed a maintenance issue? Let us know by raising a new complaint."
            action={
              <Link href="/student/complaints/new" className="btn btn-primary btn-sm">
                File First Complaint
              </Link>
            }
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {recent.map((c) => (
              <ComplaintCard key={c.id} complaint={c} role="STUDENT" />
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      {!loading && counts?.pending > 0 && (
        <div
          style={{
            marginTop: "1.5rem",
            padding: "1rem 1.25rem",
            background: "rgba(245,158,11,0.08)",
            border: "1px solid rgba(245,158,11,0.2)",
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: "1.25rem" }}>🕐</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: "#fbbf24", fontSize: "0.9375rem" }}>
              {counts.pending} complaint{counts.pending > 1 ? "s" : ""} awaiting review
            </div>
            <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
              Your warden will assign a worker soon.
            </div>
          </div>
          <Link href="/student/complaints?status=PENDING" className="btn btn-sm" style={{ background: "rgba(245,158,11,0.15)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.25)" }}>
            View Pending
          </Link>
        </div>
      )}
    </div>
  );
}
