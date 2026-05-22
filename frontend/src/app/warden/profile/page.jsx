"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import useAuthStore from "@/store/authStore";
import { getProfile, updateProfile } from "@/lib/api/users.api";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

export default function WardenProfile() {
  const { user, setUser } = useAuthStore();
  const [form, setForm] = useState({ name: "", phone: "" });
  const [pwForm, setPwForm] = useState({ oldPassword: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    getProfile("WARDEN")
      .then((d) => setForm({ name: d.name || "", phone: d.phone || "" }))
      .catch(() => toast.error("Failed to load profile."))
      .finally(() => setLoading(false));
  }, []);

  const handleSaveInfo = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Name required."); return; }
    setSaving(true);
    try {
      const d = await updateProfile("WARDEN", { name: form.name.trim(), phone: form.phone || undefined });
      setUser({ ...user, name: d.name });
      toast.success("Profile updated!");
    } catch { toast.error("Failed to update."); } finally { setSaving(false); }
  };

  const handleSavePw = async (e) => {
    e.preventDefault();
    if (!pwForm.oldPassword) { toast.error("Enter current password."); return; }
    if (pwForm.password.length < 6) { toast.error("Min 6 characters."); return; }
    if (pwForm.password !== pwForm.confirm) { toast.error("Passwords don't match."); return; }
    setSavingPw(true);
    try {
      await updateProfile("WARDEN", { oldPassword: pwForm.oldPassword, password: pwForm.password });
      setPwForm({ oldPassword: "", password: "", confirm: "" });
      toast.success("Password changed!");
    } catch (err) { toast.error(err.response?.data?.message || "Failed."); } finally { setSavingPw(false); }
  };

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}><LoadingSpinner size="lg" /></div>;

  return (
    <div className="animate-fade-in" style={{ maxWidth: 560 }}>
      <div className="page-header">
        <div><h1 className="page-title">My Profile</h1><p className="page-subtitle">Manage your account details.</p></div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
        <div className="avatar" style={{ width: 56, height: 56, fontSize: "1.375rem", background: "linear-gradient(135deg, #8b5cf6, #6366f1)" }}>
          {(user?.name || "W")[0].toUpperCase()}
        </div>
        <div>
          <div style={{ fontWeight: 700 }}>{user?.name}</div>
          <div style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>{user?.email}</div>
          <div style={{ fontSize: "0.75rem", color: "#8b5cf6", fontWeight: 600, textTransform: "uppercase", marginTop: "0.25rem" }}>Warden</div>
        </div>
      </div>
      <div className="card-elevated" style={{ marginBottom: "1.25rem" }}>
        <h3 style={{ fontSize: "0.9375rem", marginBottom: "1rem" }}>Personal Information</h3>
        <form onSubmit={handleSaveInfo} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="form-group">
            <label className="form-label" htmlFor="warden-name">Name</label>
            <input id="warden-name" className="form-input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Full name" />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="warden-phone">Phone</label>
            <input id="warden-phone" className="form-input" type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="Phone" />
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <LoadingSpinner size="sm" /> : "Save"}</button>
        </form>
      </div>
      <div className="card-elevated">
        <h3 style={{ fontSize: "0.9375rem", marginBottom: "1rem" }}>🔒 Change Password</h3>
        <form onSubmit={handleSavePw} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="form-group"><label className="form-label" htmlFor="w-old-pw">Current Password</label><input id="w-old-pw" className="form-input" type="password" value={pwForm.oldPassword} onChange={(e) => setPwForm((f) => ({ ...f, oldPassword: e.target.value }))} placeholder="••••••••" /></div>
          <div className="form-group"><label className="form-label" htmlFor="w-new-pw">New Password</label><input id="w-new-pw" className="form-input" type="password" value={pwForm.password} onChange={(e) => setPwForm((f) => ({ ...f, password: e.target.value }))} placeholder="Min 6 chars" /></div>
          <div className="form-group"><label className="form-label" htmlFor="w-confirm-pw">Confirm</label><input id="w-confirm-pw" className="form-input" type="password" value={pwForm.confirm} onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))} placeholder="Repeat" /></div>
          <button type="submit" className="btn btn-secondary" disabled={savingPw}>{savingPw ? <LoadingSpinner size="sm" /> : "Update Password"}</button>
        </form>
      </div>
    </div>
  );
}
