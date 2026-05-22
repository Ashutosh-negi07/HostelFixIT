import { NextResponse } from "next/server";

// Routes that require no auth
const PUBLIC_ROUTES = ["/login"];

// Which roles are allowed on which route prefixes
const ROLE_PREFIXES = {
  STUDENT: "/student",
  WARDEN:  "/warden",
  WORKER:  "/worker",
  ADMIN:   "/admin",
};

export function proxy(request) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  // Read token from cookie
  const token = request.cookies.get("hf_token")?.value;

  // No token → redirect to login
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Decode JWT payload (base64url middle part) — edge runtime compatible
  let payload;
  try {
    const base64Payload = token.split(".")[1];
    const decoded = atob(base64Payload.replace(/-/g, "+").replace(/_/g, "/"));
    payload = JSON.parse(decoded);
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Expired token
  if (payload.exp && payload.exp * 1000 < Date.now()) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const role = payload.role; // e.g. "STUDENT"

  // Root redirect
  if (pathname === "/") {
    const dest = ROLE_PREFIXES[role] || "/login";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // Role-based route guard
  for (const [r, prefix] of Object.entries(ROLE_PREFIXES)) {
    if (pathname.startsWith(prefix) && role !== r) {
      const dest = ROLE_PREFIXES[role] || "/login";
      return NextResponse.redirect(new URL(dest, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
  ],
};
