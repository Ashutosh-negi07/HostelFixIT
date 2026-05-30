import axios from "axios";
import { getToken, clearAuth } from "@/lib/auth";

const api = axios.create({
  baseURL: "",          // use relative URLs — Next.js rewrites() proxy forwards to Spring Boot
  timeout: 60000,
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor ─────────────────────────────────
// Attach JWT Bearer token to every request
// For FormData uploads, delete Content-Type so the browser sets multipart/form-data with boundary
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});

// ── Response interceptor ────────────────────────────────
// On 401 → clear auth + redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuth();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
