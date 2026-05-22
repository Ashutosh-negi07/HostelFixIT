"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { getCategories } from "@/lib/api/categories.api";
import { createComplaint } from "@/lib/api/complaints.api";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

const PRIORITIES = [
  { value: "LOW",    label: "Low",    icon: "▽", desc: "Minor issue, no rush" },
  { value: "NORMAL", label: "Normal", icon: "◈", desc: "Should be fixed soon" },
  { value: "HIGH",   label: "High",   icon: "▲", desc: "Urgent — affecting daily life" },
];

export default function NewComplaint() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    categoryId: "",
    description: "",
    priority: "NORMAL",
  });
  const [photo, setPhoto]         = useState(null);
  const [preview, setPreview]     = useState(null);
  const [loading, setLoading]     = useState(false);
  const [catLoading, setCatLoading] = useState(true);
  const [errors, setErrors]       = useState({});
  const [dragOver, setDragOver]   = useState(false);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => toast.error("Failed to load categories"))
      .finally(() => setCatLoading(false));
  }, []);

  const handlePhotoChange = (file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Photo must be under 10MB");
      return;
    }
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  };

  const validate = () => {
    const e = {};
    if (!form.categoryId)  e.categoryId  = "Please select a category.";
    if (!form.description.trim()) e.description = "Please describe the issue.";
    if (form.description.length > 1000) e.description = "Max 1000 characters.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("categoryId",  form.categoryId);
      fd.append("description", form.description.trim());
      fd.append("priority",    form.priority);
      if (photo) fd.append("photo", photo);

      const data = await createComplaint(fd);
      toast.success("Complaint filed successfully! 🎉");
      router.push(`/student/complaints/${data.id}`);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to submit complaint.";
      toast.error(typeof msg === "string" ? msg : "Error submitting complaint.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">File a Complaint</h1>
          <p className="page-subtitle">Tell us about the maintenance issue in your hostel.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ maxWidth: 700 }}>
        {/* Category selector */}
        <div className="card-elevated" style={{ marginBottom: "1.25rem" }}>
          <h3 style={{ marginBottom: "1rem", fontSize: "1rem" }}>📂 Select Category</h3>
          {catLoading ? (
            <LoadingSpinner size="md" />
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                gap: "0.625rem",
              }}
            >
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  id={`cat-${cat.name.toLowerCase()}`}
                  onClick={() => {
                    setForm((f) => ({ ...f, categoryId: cat.id }));
                    setErrors((e) => ({ ...e, categoryId: "" }));
                  }}
                  style={{
                    padding: "0.75rem",
                    borderRadius: 10,
                    border: `2px solid ${form.categoryId === cat.id ? "var(--accent-primary)" : "var(--border)"}`,
                    background: form.categoryId === cat.id ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.03)",
                    color: form.categoryId === cat.id ? "var(--accent-primary)" : "var(--text-secondary)",
                    cursor: "pointer",
                    textAlign: "center",
                    fontSize: "0.875rem",
                    fontWeight: form.categoryId === cat.id ? 600 : 400,
                    transition: "all 0.15s",
                  }}
                >
                  {getCategoryIcon(cat.name)}<br />
                  <span style={{ marginTop: "0.375rem", display: "block" }}>{cat.name}</span>
                </button>
              ))}
            </div>
          )}
          {errors.categoryId && <p className="form-error" style={{ marginTop: "0.5rem" }}>⚠ {errors.categoryId}</p>}
        </div>

        {/* Description */}
        <div className="card-elevated" style={{ marginBottom: "1.25rem" }}>
          <div className="form-group">
            <label className="form-label" htmlFor="description">📝 Describe the Issue</label>
            <textarea
              id="description"
              className={`form-input${errors.description ? " form-input-error" : ""}`}
              placeholder="e.g. The bathroom tap has been leaking for 3 days. Water is dripping constantly and wasting water..."
              value={form.description}
              onChange={(e) => {
                setForm((f) => ({ ...f, description: e.target.value }));
                setErrors((err) => ({ ...err, description: "" }));
              }}
              rows={5}
              maxLength={1000}
            />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.25rem" }}>
              {errors.description
                ? <p className="form-error">⚠ {errors.description}</p>
                : <span />}
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                {form.description.length}/1000
              </span>
            </div>
          </div>
        </div>

        {/* Priority */}
        <div className="card-elevated" style={{ marginBottom: "1.25rem" }}>
          <h3 style={{ marginBottom: "1rem", fontSize: "1rem" }}>⚡ Priority Level</h3>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            {PRIORITIES.map((p) => (
              <button
                key={p.value}
                type="button"
                id={`priority-${p.value.toLowerCase()}`}
                onClick={() => setForm((f) => ({ ...f, priority: p.value }))}
                style={{
                  flex: 1,
                  minWidth: 120,
                  padding: "0.875rem",
                  borderRadius: 10,
                  border: `2px solid ${form.priority === p.value ? getPriorityColor(p.value) : "var(--border)"}`,
                  background: form.priority === p.value ? `${getPriorityColor(p.value)}18` : "rgba(255,255,255,0.03)",
                  color: form.priority === p.value ? getPriorityColor(p.value) : "var(--text-muted)",
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "all 0.15s",
                }}
              >
                <div style={{ fontSize: "1.25rem", marginBottom: "0.25rem" }}>{p.icon}</div>
                <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{p.label}</div>
                <div style={{ fontSize: "0.75rem", marginTop: "0.25rem", opacity: 0.8 }}>{p.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Photo upload */}
        <div className="card-elevated" style={{ marginBottom: "1.75rem" }}>
          <h3 style={{ marginBottom: "1rem", fontSize: "1rem" }}>📷 Photo (Optional)</h3>
          {preview ? (
            <div style={{ position: "relative", display: "inline-block" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Preview"
                style={{ maxWidth: "100%", maxHeight: 240, borderRadius: 10, objectFit: "cover" }}
              />
              <button
                type="button"
                onClick={() => { setPhoto(null); setPreview(null); }}
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  background: "rgba(0,0,0,0.6)",
                  border: "none",
                  color: "white",
                  borderRadius: "50%",
                  width: 28,
                  height: 28,
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ✕
              </button>
            </div>
          ) : (
            <label
              className={`upload-zone${dragOver ? " drag-over" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handlePhotoChange(e.dataTransfer.files[0]);
              }}
              style={{ cursor: "pointer" }}
            >
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => handlePhotoChange(e.target.files[0])}
              />
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📸</div>
              <div style={{ fontWeight: 500, marginBottom: "0.25rem" }}>
                Drop a photo here or <span style={{ color: "var(--accent-primary)" }}>browse</span>
              </div>
              <div style={{ fontSize: "0.8125rem" }}>PNG, JPG up to 10MB</div>
            </label>
          )}
        </div>

        {/* Submit */}
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            id="submit-complaint-btn"
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ flex: 1 }}
          >
            {loading ? <><LoadingSpinner size="sm" /> Submitting…</> : "Submit Complaint →"}
          </button>
        </div>
      </form>
    </div>
  );
}

function getCategoryIcon(name = "") {
  const icons = {
    Plumbing:    "🚿",
    Electrical:  "⚡",
    Cleaning:    "🧹",
    Furniture:   "🪑",
    Internet:    "🌐",
    Security:    "🔒",
    Maintenance: "🔧",
    Other:       "📌",
  };
  return icons[name] || "🏠";
}

function getPriorityColor(p) {
  return { LOW: "#22c55e", NORMAL: "#6366f1", HIGH: "#ef4444" }[p] || "#6366f1";
}
