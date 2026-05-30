"use client";
import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import {
  getAllHostelsGlobal,
  createHostelGlobal,
  assignHostelToAdmin,
  unassignHostel,
  deleteHostelGlobal,
} from "@/lib/api/superadmin.api";
import { getAllAdmins } from "@/lib/api/superadmin.api";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import EmptyState from "@/components/shared/EmptyState";
import ConfirmModal from "@/components/shared/ConfirmModal";

const SA_COLOR = "#e11d48";

export default function SuperAdminHostels() {
  const [hostels, setHostels]   = useState([]);
  const [admins, setAdmins]     = useState([]);  // for assign dropdown
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null); // null | "create" | { hostel }
  const [assignModal, setAssignModal] = useState(null); // { hostel }
  const [form, setForm]         = useState({ name: "", address: "" });
  const [selectedAdmin, setSelectedAdmin] = useState("");
  const [saving, setSaving]     = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [h, a] = await Promise.all([
        getAllHostelsGlobal(),
        getAllAdmins({ page: 0, size: 100 }),
      ]);
      setHostels(Array.isArray(h) ? h : h.content || []);
      setAdmins((a.content || []).filter((ad) => ad.isActive));
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm({ name: "", address: "" }); setModal("create"); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Hostel name is required."); return; }
    setSaving(true);
    try {
      await createHostelGlobal(form);
      toast.success("Hostel created! 🏢");
      setModal(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create hostel.");
    } finally { setSaving(false); }
  };

  const openAssign = (hostel) => {
    setSelectedAdmin(hostel.adminId || "");
    setAssignModal({ hostel });
  };

  const handleAssign = async () => {
    if (!selectedAdmin && !assignModal.hostel.adminId) {
      toast.error("Select an admin to assign.");
      return;
    }
    setAssigning(true);
    try {
      if (selectedAdmin) {
        await assignHostelToAdmin(assignModal.hostel.id, selectedAdmin);
        toast.success("Hostel assigned to admin! ✅");
      } else {
        await unassignHostel(assignModal.hostel.id);
        toast.success("Hostel unassigned.");
      }
      setAssignModal(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update assignment.");
    } finally { setAssigning(false); }
  };

  const handleUnassign = async (hostel) => {
    try {
      await unassignHostel(hostel.id);
      toast.success("Hostel unassigned.");
      load();
    } catch { toast.error("Failed to unassign."); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteHostelGlobal(deleteConfirm.id);
      toast.success("Hostel deleted.");
      setDeleteConfirm(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete hostel.");
    } finally { setDeleting(false); }
  };

  const unassigned = hostels.filter((h) => !h.adminId);
  const assigned   = hostels.filter((h) => h.adminId);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">🏢 Global Hostels</h1>
          <p className="page-subtitle">
            {hostels.length} hostel{hostels.length !== 1 ? "s" : ""} total ·{" "}
            {unassigned.length} unassigned
          </p>
        </div>
        <button
          id="create-hostel-global-btn"
          className="btn btn-sm"
          style={{ background: SA_COLOR, color: "#fff", border: "none" }}
          onClick={openCreate}
        >
          ➕ New Hostel
        </button>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
          <LoadingSpinner size="lg" />
        </div>
      ) : hostels.length === 0 ? (
        <EmptyState
          icon="🏢"
          title="No hostels yet"
          description="Create the first hostel and assign it to an admin."
          action={
            <button
              className="btn btn-sm"
              style={{ background: SA_COLOR, color: "#fff", border: "none" }}
              onClick={openCreate}
            >
              New Hostel
            </button>
          }
        />
      ) : (
        <>
          {/* Unassigned section */}
          {unassigned.length > 0 && (
            <div style={{ marginBottom: "2rem" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "0.875rem",
                }}
              >
                <h2 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                  ⚠️ Unassigned Hostels
                </h2>
                <span
                  style={{
                    background: "rgba(239,68,68,0.12)",
                    color: "#f87171",
                    border: "1px solid rgba(239,68,68,0.25)",
                    borderRadius: 999,
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    padding: "0.15rem 0.5rem",
                  }}
                >
                  {unassigned.length}
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
                {unassigned.map((h) => <HostelCard key={h.id} hostel={h} onAssign={openAssign} onDelete={setDeleteConfirm} />)}
              </div>
            </div>
          )}

          {/* Assigned section */}
          {assigned.length > 0 && (
            <div>
              <h2 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.875rem" }}>
                ✅ Assigned Hostels ({assigned.length})
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
                {assigned.map((h) => (
                  <HostelCard
                    key={h.id}
                    hostel={h}
                    onAssign={openAssign}
                    onUnassign={handleUnassign}
                    onDelete={setDeleteConfirm}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Modal */}
      {modal === "create" && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">🏢 New Hostel</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal(null)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label" htmlFor="hostel-name-global">Name *</label>
                  <input
                    id="hostel-name-global"
                    className="form-input"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Ganga Hostel"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="hostel-address-global">Address</label>
                  <input
                    id="hostel-address-global"
                    className="form-input"
                    value={form.address}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                    placeholder="Street address"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(null)} disabled={saving}>
                  Cancel
                </button>
                <button
                  id="save-hostel-global-btn"
                  type="submit"
                  className="btn btn-sm"
                  style={{ background: SA_COLOR, color: "#fff", border: "none" }}
                  disabled={saving}
                >
                  {saving ? <LoadingSpinner size="sm" /> : "Create →"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Admin Modal */}
      {assignModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setAssignModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">
                Assign Admin — {assignModal.hostel.name}
              </h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setAssignModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
                Select an admin to manage this hostel, or leave empty to unassign.
              </p>
              <div className="form-group">
                <label className="form-label" htmlFor="assign-admin-select">Admin Account</label>
                <select
                  id="assign-admin-select"
                  className="form-input"
                  value={selectedAdmin}
                  onChange={(e) => setSelectedAdmin(e.target.value)}
                >
                  <option value="">— Unassigned (platform-level) —</option>
                  {admins.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.email}){a.hostelName ? ` · currently: ${a.hostelName}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setAssignModal(null)} disabled={assigning}>
                Cancel
              </button>
              <button
                id="confirm-assign-btn"
                className="btn btn-sm"
                style={{ background: SA_COLOR, color: "#fff", border: "none" }}
                onClick={handleAssign}
                disabled={assigning}
              >
                {assigning ? <LoadingSpinner size="sm" /> : "Confirm →"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <ConfirmModal
          title="Delete Hostel?"
          message={`Delete "${deleteConfirm.name}"? All students, workers, and complaints linked to it may be affected. This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}

function HostelCard({ hostel, onAssign, onUnassign, onDelete }) {
  const isAssigned = !!hostel.adminId;
  return (
    <div
      className="card-elevated"
      style={{
        borderLeft: isAssigned ? "3px solid #22c55e" : "3px solid #ef4444",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.625rem" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)" }}>{hostel.name}</div>
          {hostel.address && (
            <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
              📍 {hostel.address}
            </div>
          )}
        </div>
      </div>

      {/* Admin assignment badge */}
      <div style={{ marginBottom: "1rem" }}>
        {isAssigned ? (
          <span
            style={{
              fontSize: "0.8rem",
              background: "rgba(34,197,94,0.1)",
              color: "#4ade80",
              border: "1px solid rgba(34,197,94,0.2)",
              borderRadius: 999,
              padding: "0.2rem 0.625rem",
              fontWeight: 600,
            }}
          >
            🛡️ {hostel.adminName || "Assigned Admin"}
          </span>
        ) : (
          <span
            style={{
              fontSize: "0.8rem",
              background: "rgba(239,68,68,0.1)",
              color: "#f87171",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: 999,
              padding: "0.2rem 0.625rem",
              fontWeight: 600,
            }}
          >
            Unassigned
          </span>
        )}
      </div>

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => onAssign(hostel)}>
          🔗 {isAssigned ? "Reassign" : "Assign Admin"}
        </button>
        {isAssigned && onUnassign && (
          <button className="btn btn-secondary btn-sm" onClick={() => onUnassign(hostel)}>
            Unassign
          </button>
        )}
        <button className="btn btn-danger btn-sm" onClick={() => onDelete(hostel)}>
          🗑
        </button>
      </div>
    </div>
  );
}
