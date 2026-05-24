import Cookies from "js-cookie";

const TOKEN_KEY = "hf_token";
const USER_KEY  = "hf_user";

/**
 * Saves the JWT token + decoded user info to cookie and localStorage.
 * Cookie is used by the Next.js middleware (server-readable).
 * localStorage is used by client components for quick access.
 */
export function saveAuth({ token, userId, name, email, role }) {
  // Cookie: 1-day expiry, SameSite Strict
  Cookies.set(TOKEN_KEY, token, { expires: 1, sameSite: "Strict" });
  // Store minimal user object in localStorage
  if (typeof window !== "undefined") {
    localStorage.setItem(USER_KEY, JSON.stringify({ userId, name, email, role }));
  }
}

/** Returns the raw JWT string, or null. */
export function getToken() {
  return Cookies.get(TOKEN_KEY) || null;
}

/** Returns the stored user object { userId, name, email, role } or null. */
export function getUser() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Clears token + user info on logout. */
export function clearAuth() {
  Cookies.remove(TOKEN_KEY);
  if (typeof window !== "undefined") {
    localStorage.removeItem(USER_KEY);
  }
}

/** Returns initials for avatar (e.g. "Ash Neg" → "AN") */
export function getInitials(name = "") {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

/** Role colour for sidebar accent */
export const ROLE_COLORS = {
  STUDENT:     "#6366f1",
  WARDEN:      "#8b5cf6",
  WORKER:      "#06b6d4",
  ADMIN:       "#f59e0b",
  SUPER_ADMIN: "#e11d48",
};

export const ROLE_LABELS = {
  STUDENT:     "Student",
  WARDEN:      "Warden",
  WORKER:      "Worker",
  ADMIN:       "Admin",
  SUPER_ADMIN: "Super Admin",
};
