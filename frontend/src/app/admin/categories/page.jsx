"use client";
import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import {
  adminGetCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/api/categories.api";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import EmptyState from "@/components/shared/EmptyState";
import ConfirmModal from "@/components/shared/ConfirmModal";

const CATEGORY_ICONS = {
  Plumbing: "🚿", Electrical: "⚡", Cleaning: "🧹",
  Furniture: "🪑", Internet: "🌐", Security: "🔒",
  Maintenance: "🔧", Other: "📌",
};

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState(null); // null | "create" | { cat }
  const [form, setForm]             = useState({ name: "", description: "" });
  const [saving, setSaving]         = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting]           = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await adminGetCategories();
      setCategories(Array.isArray(d) ? d : d.content || []);
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm({ name: "", description: "" }); setModal("create"); };
  const openEdit   = (c) => { setForm({ name: c.name, description: c.description || "" }); setModal({ cat: c }); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Category name is required."); return; }
    setSaving(true);
    try {
      if (modal === "create") {
        await createCategory(form);
        toast.success("Category created! 🏷️");
      } else {
        await updateCategory(modal.cat.id, form);
        toast.success("Category updated!");
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
      await deleteCategory(deleteConfirm.id);
      toast.success("Category deleted.");
      setDeleteConfirm(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Cannot delete — complaints may be linked to this category.");
    } finally { setDeleting(false); }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Categories 🏷️</h1>
          <p className="page-subtitle">
            Manage complaint categories. {categories.length} categor{categories.length !== 1 ? "ies" : "y"} configured.
          </p>
        </div>
        <button id="create-category-btn" className="btn btn-primary" onClick={openCreate}>
          ➕ Add Category
        </button>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
          <LoadingSpinner size="lg" />
        </div>
      ) : categories.length === 0 ? (
        <EmptyState
          icon="🏷️"
          title="No categories yet"
          description="Add complaint categories so students can classify their issues."
          action={<button className="btn btn-primary btn-sm" onClick={openCreate}>Add First Category</button>}
        />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: "1rem",
          }}
        >
          {categories.map((cat) => (
            <div key={cat.id} className="card-elevated" style={{ position: "relative" }}>
              {/* Icon + Name */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", marginBottom: "0.75rem" }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: "rgba(99,102,241,0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.375rem",
                    flexShrink: 0,
                  }}
                >
                  {CATEGORY_ICONS[cat.name] || "📌"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: "1rem",
                      color: "var(--text-primary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {cat.name}
                  </div>
                  {cat.complaintCount !== undefined && (
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.125rem" }}>
                      📋 {cat.complaintCount} complaint{cat.complaintCount !== 1 ? "s" : ""}
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {cat.description && (
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--text-muted)",
                    lineHeight: 1.5,
                    marginBottom: "1rem",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {cat.description}
                </p>
              )}

              {/* Actions */}
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "auto" }}>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => openEdit(cat)}
                >
                  ✏️ Edit
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => setDeleteConfirm(cat)}
                >
                  🗑 Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modal !== null && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setModal(null)}
        >
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">
                {modal === "create" ? "Add Category" : `Edit "${modal.cat?.name}"`}
              </h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal(null)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label" htmlFor="cat-name">Category Name *</label>
                  <input
                    id="cat-name"
                    className="form-input"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Plumbing"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="cat-desc">Description</label>
                  <textarea
                    id="cat-desc"
                    className="form-input"
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Brief description of this category…"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setModal(null)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  id="save-category-btn"
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? (
                    <LoadingSpinner size="sm" />
                  ) : modal === "create" ? (
                    "Create →"
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <ConfirmModal
          title="Delete Category?"
          message={`Delete "${deleteConfirm.name}"? Complaints already in this category may be affected.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
