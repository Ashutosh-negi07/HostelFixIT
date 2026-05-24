"use client";
import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import {
  getAllAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  toggleAdmin,
} from "@/lib/api/superadmin.api";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import EmptyState from "@/components/shared/EmptyState";
import Pagination from "@/components/shared/Pagination";
import ConfirmModal from "@/components/shared/ConfirmModal";

const SA_COLOR = "#e11d48";

function defaultForm() {
  return { name: "", email: "", phone: "", password: "" };
}

export default function SuperAdminAdmins() {
  const [admins, setAdmins]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [modal, setModal]         = useState(null); // null | "create" | { admin }
  const [form, setForm]           = useState(defaultForm());
  const [saving, setSaving]       = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting]   = useState(false);
  const [toggling, setToggling]   = useState(null); // id being toggled

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllAdmins({ page, size: 15 });
      setAdmins(data.content || []);
      setTotalPages(data.totalPages || 0);
    } catch { } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm(defaultForm()); setModal("create"); };
  const openEdit   = (a) => { setForm({ name: a.name, email: a.email, phone: a.phone || "", password: "" }); setModal({ admin: a }); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim())  { toast.error("Name is required.");  return; }
    if (!form.email.trim()) { toast.error("Email is required."); return; }
    if (modal === "create" && !form.password) { toast.error("Password is required."); return; }
    setSaving(true);
    try {
      if (modal === "create") {
        await createAdmin(form);
        toast.success("Admin account created! 🛡️");
      } else {
        const payload = { name: form.name, phone: form.phone || undefined };
        if (form.password) payload.password = form.password;
        await updateAdmin(modal.admin.id, payload);
        toast.success("Admin updated!");
      }
      setModal(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed.");
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteAdmin(deleteConfirm.id);
      toast.success("Admin deleted. Their hostels are now unassigned.");
      setDeleteConfirm(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete admin.");
    } finally { setDeleting(false); }
  };

  const handleToggle = async (admin) => {
    setToggling(admin.id);
    try {
      await toggleAdmin(admin.id);
      toast.success(`Admin ${admin.isActive ? "deactivated" : "activated"}.`);
      load();
    } catch { toast.error("Failed to toggle admin status."); }
    finally { setToggling(null); }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">🛡️ Admin Accounts</h1>
          <p className="page-subtitle">
            Manage all hostel administrators. Each admin controls one hostel.
          </p>
        </div>
        <button
          id="create-admin-btn"
          className="btn btn-sm"
          style={{ background: SA_COLOR, color: "#fff", border: "none" }}
          onClick={openCreate}
        >
          ➕ Add Admin
        </button>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
          <LoadingSpinner size="lg" />
        </div>
      ) : admins.length === 0 ? (
        <EmptyState
          icon="🛡️"
          title="No admins yet"
          description="Create the first admin account to get started."
          action={
            <button
              className="btn btn-sm"
              style={{ background: SA_COLOR, color: "#fff", border: "none" }}
              onClick={openCreate}
            >
              Add Admin
            </button>
          }
        />
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Admin</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Hostel</th>
                <th>Status</th>
                <th>Joined</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                      <div
                        className="avatar"
                        style={{
                          width: 28,
                          height: 28,
                          fontSize: "0.75rem",
                          background: `linear-gradient(135deg, ${SA_COLOR}, #f59e0b)`,
                        }}
                      >
                        {(a.name || "A")[0].toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>{a.name}</span>
                    </div>
                  </td>
                  <td>{a.email}</td>
                  <td>{a.phone || "—"}</td>
                  <td>
                    {a.hostelName ? (
                      <span style={{ fontSize: "0.8125rem", color: "#f59e0b" }}>🏢 {a.hostelName}</span>
                    ) : (
                      <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Unassigned</span>
                    )}
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        padding: "0.2rem 0.5rem",
                        borderRadius: 999,
                        background: a.isActive ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
                        color: a.isActive ? "#4ade80" : "#f87171",
                      }}
                    >
                      {a.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>{a.createdAt ? new Date(a.createdAt).toLocaleDateString("en-IN") : "—"}</td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", gap: "0.375rem", justifyContent: "flex-end" }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(a)}>
                        Edit
                      </button>
                      <button
                        className={`btn btn-sm ${a.isActive ? "btn-danger" : "btn-success"}`}
                        disabled={toggling === a.id}
                        onClick={() => handleToggle(a)}
                      >
                        {toggling === a.id ? <LoadingSpinner size="sm" /> : a.isActive ? "Disable" : "Enable"}
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(a)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Create / Edit Modal */}
      {modal !== null && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <h3 className="modal-title">
                {modal === "create" ? "➕ Create Admin Account" : `✏️ Edit ${modal.admin?.name}`}
              </h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal(null)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="admin-name">Full Name *</label>
                    <input
                      id="admin-name"
                      className="form-input"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Admin's full name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="admin-phone">Phone</label>
                    <input
                      id="admin-phone"
                      className="form-input"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      placeholder="Phone number"
                    />
                  </div>
                </div>
                {modal === "create" && (
                  <div className="form-group">
                    <label className="form-label" htmlFor="admin-email">Email *</label>
                    <input
                      id="admin-email"
                      className="form-input"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="admin@hostel.edu"
                      required
                    />
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label" htmlFor="admin-password">
                    {modal === "create" ? "Password *" : "New Password (leave blank to keep)"}
                  </label>
                  <input
                    id="admin-password"
                    className="form-input"
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </div>
                {modal === "create" && (
                  <div
                    style={{
                      background: `${SA_COLOR}12`,
                      border: `1px solid ${SA_COLOR}25`,
                      borderRadius: 8,
                      padding: "0.75rem 1rem",
                      fontSize: "0.8125rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    💡 After creating the admin, go to <strong style={{ color: "var(--text-secondary)" }}>Hostels</strong> to assign them a hostel.
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(null)} disabled={saving}>
                  Cancel
                </button>
                <button
                  id="save-admin-btn"
                  type="submit"
                  className="btn btn-sm"
                  style={{ background: SA_COLOR, color: "#fff", border: "none" }}
                  disabled={saving}
                >
                  {saving ? <LoadingSpinner size="sm" /> : modal === "create" ? "Create Admin →" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <ConfirmModal
          title="Delete Admin?"
          message={`Delete "${deleteConfirm.name}"? Their assigned hostel will become unassigned. This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
