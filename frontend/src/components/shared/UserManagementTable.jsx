"use client";
import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { getUsers, createUser, updateUser, deleteUser } from "@/lib/api/users.api";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import EmptyState from "@/components/shared/EmptyState";
import Pagination from "@/components/shared/Pagination";
import ConfirmModal from "@/components/shared/ConfirmModal";

/**
 * Reusable user management table for Warden's Students/Workers pages.
 * role: the actor's role ("WARDEN" | "ADMIN")
 * targetRole: "STUDENT" | "WORKER" | "WARDEN"
 */
export default function UserManagementTable({ actorRole, targetRole, canCreate = true }) {
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [modal, setModal]       = useState(null); // null | "create" | { user }
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm]         = useState(defaultForm(targetRole));

  function defaultForm(role) {
    return { name: "", email: "", phone: "", password: "", role };
  }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getUsers(actorRole, targetRole, { page, size: 15 });
      setUsers(data.content || []);
      setTotalPages(data.totalPages || 0);
    } catch { } finally { setLoading(false); }
  }, [actorRole, targetRole, page]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setForm(defaultForm(targetRole));
    setModal("create");
  };

  const openEdit = (user) => {
    setForm({ name: user.name, email: user.email, phone: user.phone || "", password: "", role: user.role });
    setModal({ user });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim())  { toast.error("Name is required.");     return; }
    if (!form.email.trim()) { toast.error("Email is required.");    return; }
    if (modal === "create" && !form.password) { toast.error("Password is required for new users."); return; }
    setSaving(true);
    try {
      if (modal === "create") {
        await createUser(actorRole, form);
        toast.success(`${targetRole.toLowerCase()} created!`);
      } else {
        const payload = { name: form.name, phone: form.phone || undefined };
        if (form.password) payload.password = form.password;
        await updateUser(actorRole, modal.user.id, payload);
        toast.success("User updated!");
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
      await deleteUser(actorRole, deleteConfirm.id);
      toast.success("User deleted.");
      setDeleteConfirm(null);
      load();
    } catch { toast.error("Failed to delete user."); }
    finally { setDeleting(false); }
  };

  return (
    <div>
      {canCreate && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
          <button id={`create-${targetRole.toLowerCase()}-btn`} className="btn btn-primary" onClick={openCreate}>
            ➕ Add {targetRole.charAt(0) + targetRole.slice(1).toLowerCase()}
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}><LoadingSpinner size="lg" /></div>
      ) : users.length === 0 ? (
        <EmptyState icon="👥" title={`No ${(targetRole || "user").toLowerCase()}s yet`} description={canCreate ? `Add a ${(targetRole || "user").toLowerCase()} to get started.` : ""} />
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Joined</th>
                {canCreate && <th style={{ textAlign: "right" }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="clickable" onClick={() => openEdit(u)}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                      <div className="avatar" style={{ width: 28, height: 28, fontSize: "0.75rem" }}>
                        {(u.name || "U")[0].toUpperCase()}
                      </div>
                      <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{u.name}</span>
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td>{u.phone || "—"}</td>
                  <td>
                    <span style={{
                      fontSize: "0.75rem", fontWeight: 600, padding: "0.2rem 0.5rem", borderRadius: 999,
                      background: u.isActive ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
                      color: u.isActive ? "#4ade80" : "#f87171",
                    }}>
                      {u.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-IN") : "—"}</td>
                  {canCreate && (
                    <td style={{ textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: "flex", gap: "0.375rem", justifyContent: "flex-end" }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(u)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(u)}>Delete</button>
                      </div>
                    </td>
                  )}
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
                {modal === "create" ? `Add New ${targetRole.charAt(0) + targetRole.slice(1).toLowerCase()}` : `Edit ${modal.user?.name}`}
              </h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal(null)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="user-name">Full Name *</label>
                    <input id="user-name" className="form-input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Full name" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="user-phone">Phone</label>
                    <input id="user-phone" className="form-input" type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="Phone number" />
                  </div>
                </div>
                {modal === "create" && (
                  <div className="form-group">
                    <label className="form-label" htmlFor="user-email">Email *</label>
                    <input id="user-email" className="form-input" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="user@hostel.edu" required />
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label" htmlFor="user-password">{modal === "create" ? "Password *" : "New Password (leave blank to keep)"}</label>
                  <input id="user-password" className="form-input" type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="••••••••" autoComplete="new-password" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(null)} disabled={saving}>Cancel</button>
                <button id="save-user-btn" type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <LoadingSpinner size="sm" /> : modal === "create" ? "Create →" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <ConfirmModal
          title="Delete User?"
          message={`Are you sure you want to delete "${deleteConfirm.name}"? This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
