"use client";
import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { getAllHostels, createHostel, updateHostel, deleteHostel } from "@/lib/api/hostels.api";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import EmptyState from "@/components/shared/EmptyState";
import ConfirmModal from "@/components/shared/ConfirmModal";

export default function AdminHostels() {
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(null); // null | "create" | { hostel }
  const [form, setForm]       = useState({ name: "", address: "" });
  const [saving, setSaving]   = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const d = await getAllHostels(); setHostels(Array.isArray(d) ? d : d.content || []); }
    catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm({ name: "", address: "" }); setModal("create"); };
  const openEdit   = (h) => { setForm({ name: h.name, address: h.address || "" }); setModal({ hostel: h }); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Name is required."); return; }
    setSaving(true);
    try {
      if (modal === "create") { await createHostel(form); toast.success("Hostel created!"); }
      else { await updateHostel(modal.hostel.id, form); toast.success("Hostel updated!"); }
      setModal(null); load();
    } catch { toast.error("Failed."); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await deleteHostel(deleteConfirm.id); toast.success("Hostel deleted."); setDeleteConfirm(null); load(); }
    catch { toast.error("Failed to delete."); } finally { setDeleting(false); }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div><h1 className="page-title">Hostels 🏢</h1><p className="page-subtitle">Manage all hostels in the system.</p></div>
        <button id="create-hostel-btn" className="btn btn-primary" onClick={openCreate}>➕ Add Hostel</button>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}><LoadingSpinner size="lg" /></div>
      ) : hostels.length === 0 ? (
        <EmptyState icon="🏢" title="No hostels yet" description="Add your first hostel to get started." action={<button className="btn btn-primary btn-sm" onClick={openCreate}>Add Hostel</button>} />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
          {hostels.map((h) => (
            <div key={h.id} className="card-elevated">
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "1.0625rem", color: "var(--text-primary)", marginBottom: "0.25rem" }}>{h.name}</div>
                  {h.address && <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>📍 {h.address}</div>}
                </div>
                <div style={{ display: "flex", gap: "0.375rem" }}>
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(h)} title="Edit">✏️</button>
                  <button className="btn btn-danger btn-sm btn-icon" onClick={() => setDeleteConfirm(h)} title="Delete">🗑</button>
                </div>
              </div>
              <div style={{ display: "flex", gap: "1rem", fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                {h.totalStudents !== undefined && <span>🎓 {h.totalStudents} students</span>}
                {h.totalWorkers  !== undefined && <span>👷 {h.totalWorkers} workers</span>}
                {h.totalComplaints !== undefined && <span>📋 {h.totalComplaints} complaints</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal !== null && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">{modal === "create" ? "Add New Hostel" : `Edit ${modal.hostel?.name}`}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal(null)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group"><label className="form-label" htmlFor="hostel-name">Name *</label><input id="hostel-name" className="form-input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Ganga Hostel" required /></div>
                <div className="form-group"><label className="form-label" htmlFor="hostel-address">Address</label><input id="hostel-address" className="form-input" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="Street address" /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(null)} disabled={saving}>Cancel</button>
                <button id="save-hostel-btn" type="submit" className="btn btn-primary" disabled={saving}>{saving ? <LoadingSpinner size="sm" /> : modal === "create" ? "Create →" : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <ConfirmModal title="Delete Hostel?" message={`Delete "${deleteConfirm.name}"? This may affect students, workers, and complaints linked to it.`} confirmLabel="Delete" onConfirm={handleDelete} onCancel={() => setDeleteConfirm(null)} loading={deleting} />
      )}
    </div>
  );
}
