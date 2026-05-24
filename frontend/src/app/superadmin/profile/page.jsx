"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import useAuthStore from "@/store/authStore";
import { getProfile, updateProfile } from "@/lib/api/users.api";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

const SA_COLOR = "#e11d48";

export default function SuperAdminProfile() {
  const { user, setUser } = useAuthStore();
  const [form, setForm]     = useState({ name: "", phone: "" });
  const [pwForm, setPwForm] = useState({ oldPassword: "", password: "", confirm: "" });
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    // SUPER_ADMIN uses /api/auth/me (same as ADMIN getProfile)
    getProfile("ADMIN")
      .then((d) => setForm({ name: d.name || "", phone: d.phone || "" }))
      .catch(() => toast.error("Failed to load profile."))
      .finally(() => setLoading(false));
  }, []);

  const handleSaveInfo = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Name is required."); return; }
    setSaving(true);
    try {
      // SUPER_ADMIN profile update goes through the same /api/auth/me or student path
      // Using "STUDENT" base as fallback since SUPER_ADMIN profile update needs custom handling
      const d = await updateProfile("STUDENT", { name: form.name.trim(), phone: form.phone || undefined });
      setUser({ ...user, name: d.name });
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to update profile.");
    } finally { setSaving(false); }
  };

  const handleSavePw = async (e) => {
    e.preventDefault();
    if (!pwForm.oldPassword) { toast.error("Enter your current password."); return; }
    if (pwForm.password.length < 6) { toast.error("New password must be at least 6 characters."); return; }
    if (pwForm.password !== pwForm.confirm) { toast.error("Passwords don't match."); return; }
    setSavingPw(true);
    try {
      await updateProfile("STUDENT", { oldPassword: pwForm.oldPassword, password: pwForm.password });
      setPwForm({ oldPassword: "", password: "", confirm: "" });
      toast.success("Password changed successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password.");
    } finally { setSavingPw(false); }
  };

  if (loading) {
    return <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: 560 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Update your display name, phone, or password.</p>
        </div>
      </div>

      {/* Avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
        <div
          className="avatar"
          style={{
            width: 56,
            height: 56,
            fontSize: "1.375rem",
            background: `linear-gradient(135deg, ${SA_COLOR}, #f59e0b)`,
          }}
        >
          {(user?.name || "S")[0].toUpperCase()}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: "1.0625rem" }}>{user?.name}</div>
          <div style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>{user?.email}</div>
          <div
            style={{
              fontSize: "0.75rem",
              color: SA_COLOR,
              fontWeight: 700,
              marginTop: "0.25rem",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            👑 Super Admin
          </div>
        </div>
      </div>

      {/* Info form */}
      <div className="card-elevated" style={{ marginBottom: "1.25rem" }}>
        <h3 style={{ fontSize: "0.9375rem", marginBottom: "1rem" }}>Personal Information</h3>
        <form onSubmit={handleSaveInfo} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="form-group">
            <label className="form-label" htmlFor="sa-name">Full Name</label>
            <input
              id="sa-name"
              className="form-input"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Your full name"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="sa-phone">Phone Number</label>
            <input
              id="sa-phone"
              className="form-input"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="e.g. 9876543210"
            />
          </div>
          <button
            type="submit"
            className="btn btn-sm"
            style={{ background: SA_COLOR, color: "#fff", border: "none", alignSelf: "flex-start" }}
            disabled={saving}
          >
            {saving ? <LoadingSpinner size="sm" /> : "Save Changes"}
          </button>
        </form>
      </div>

      {/* Password form */}
      <div className="card-elevated">
        <h3 style={{ fontSize: "0.9375rem", marginBottom: "1rem" }}>🔒 Change Password</h3>
        <form onSubmit={handleSavePw} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="form-group">
            <label className="form-label" htmlFor="sa-old-pw">Current Password</label>
            <input
              id="sa-old-pw"
              className="form-input"
              type="password"
              value={pwForm.oldPassword}
              onChange={(e) => setPwForm((f) => ({ ...f, oldPassword: e.target.value }))}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="sa-new-pw">New Password</label>
            <input
              id="sa-new-pw"
              className="form-input"
              type="password"
              value={pwForm.password}
              onChange={(e) => setPwForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="Min 6 characters"
              autoComplete="new-password"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="sa-confirm-pw">Confirm Password</label>
            <input
              id="sa-confirm-pw"
              className="form-input"
              type="password"
              value={pwForm.confirm}
              onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
              placeholder="Repeat new password"
              autoComplete="new-password"
            />
          </div>
          <button
            type="submit"
            className="btn btn-secondary btn-sm"
            style={{ alignSelf: "flex-start" }}
            disabled={savingPw}
          >
            {savingPw ? <LoadingSpinner size="sm" /> : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
