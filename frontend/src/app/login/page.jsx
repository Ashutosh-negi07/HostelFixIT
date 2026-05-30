"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { login } from "@/lib/api/auth.api";
import { saveAuth } from "@/lib/auth";
import useAuthStore from "@/store/authStore";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

const ROLE_ROUTES = {
  ADMIN:       "/admin",
  WARDEN:      "/warden",
  STUDENT:     "/student",
  WORKER:      "/worker",
  SUPER_ADMIN: "/superadmin",
};

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [form, setForm]       = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("Please enter both email and password.");
      return;
    }
    setLoading(true);
    try {
      const data = await login({ email: form.email.trim(), password: form.password });
      // Save to cookie + localStorage
      saveAuth(data);
      // Update Zustand
      setUser({ userId: data.userId, name: data.name, email: data.email, role: data.role });
      toast.success(`Welcome back, ${data.name}! 👋`);
      // Redirect by role
      router.replace(ROLE_ROUTES[data.role] || "/");
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || "Invalid email or password.";
      setError(typeof msg === "string" ? msg : "Login failed. Please try again.");
      toast.error("Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 50%, #e8f4fd 100%)",
        padding: "1.5rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient glow blobs */}
      <div
        style={{
          position: "absolute",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(14,165,233,0.1) 0%, transparent 70%)",
          top: -100,
          right: -100,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(56,189,248,0.08) 0%, transparent 70%)",
          bottom: -100,
          left: -100,
          pointerEvents: "none",
        }}
      />

      {/* Card */}
      <div
        className="glass animate-slide-up"
        style={{
          width: "100%",
          maxWidth: 420,
          padding: "2.25rem",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              width: 56,
              height: 56,
              background: "linear-gradient(135deg, #0ea5e9, #38bdf8)",
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1rem",
              boxShadow: "0 8px 24px rgba(14,165,233,0.3)",
            }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
          </div>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 800,
              background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              marginBottom: "0.25rem",
            }}
          >
            HostelFixIT
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Sign in to your account
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email Address</label>
            <input
              id="login-email"
              name="email"
              type="email"
              className={`form-input${error ? " form-input-error" : ""}`}
              placeholder="you@hostel.edu"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              autoFocus
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <div style={{ position: "relative" }}>
              <input
                id="login-password"
                name="password"
                type={showPass ? "text" : "password"}
                className={`form-input${error ? " form-input-error" : ""}`}
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                style={{ paddingRight: "3rem" }}
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                style={{
                  position: "absolute",
                  right: "0",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  lineHeight: 1,
                  padding: 0,
                  /* Minimum 44×44px touch target for iOS/Android */
                  width: "44px",
                  height: "44px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  WebkitTapHighlightColor: "transparent",
                }}
                aria-label={showPass ? "Hide password" : "Show password"}
              >
                {showPass ? (
                  /* Eye-off SVG */
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  /* Eye SVG */
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.25)",
                borderRadius: 8,
                padding: "0.625rem 0.875rem",
                fontSize: "0.875rem",
                color: "#f87171",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {/* Submit */}
          <button
            id="login-submit-btn"
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
            style={{ marginTop: "0.5rem", width: "100%" }}
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                Signing in…
              </>
            ) : (
              "Sign In →"
            )}
          </button>
        </form>

        {/* Footer note */}
        <p
          style={{
            textAlign: "center",
            marginTop: "1.75rem",
            fontSize: "0.8125rem",
            color: "var(--text-muted)",
          }}
        >
          Access is managed by your hostel administrator.
          <br />
          Contact them if you don't have an account.
        </p>

        {/* Role indicators */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "0.5rem",
            marginTop: "1.25rem",
            flexWrap: "wrap",
          }}
        >
          {[
            { label: "Student", color: "#0ea5e9" },
            { label: "Warden",  color: "#0284c7" },
            { label: "Worker",  color: "#06b6d4" },
            { label: "Admin",   color: "#f59e0b" },
          ].map(({ label, color }) => (
            <span
              key={label}
              style={{
                fontSize: "0.7rem",
                fontWeight: 600,
                color,
                background: `${color}18`,
                border: `1px solid ${color}30`,
                borderRadius: 999,
                padding: "0.2rem 0.6rem",
              }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
