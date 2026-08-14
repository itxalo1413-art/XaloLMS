import { API_BASE } from "@/lib/apiBase";
import { DEMO_STUDENT } from "@/lib/mockTestRequests";

export const AUTH_TOKEN_KEY = "xalo.auth.token";
export const AUTH_USER_KEY = "xalo.auth.user";

export type AuthRole = "HS" | "GV" | "ACA";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: AuthRole;
  status: string;
  createdAt: string;
};

export type LoginResponse = {
  access_token: string;
  user: AuthUser;
};

/** Tạm thời bỏ qua login — bật lại: đặt `NEXT_PUBLIC_AUTH_DISABLED=false` rồi build lại. */
export function isAuthDisabled(): boolean {
  const flag = process.env.NEXT_PUBLIC_AUTH_DISABLED;
  if (flag === "true") return true;
  return false;
}

export function getAuthBypassUser(): AuthUser {
  const cached = getCachedAuthUser();
  if (cached?.role === "HS") return cached;
  return {
    id: "6a0d62e43376dcbcd0b1d76f",
    email: "student.demo@xalo.local",
    name: DEMO_STUDENT.name,
    role: "HS",
    status: "active",
    createdAt: "2020-01-01T00:00:00.000Z",
  };
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

export function cacheAuthUser(user: AuthUser): void {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function hasAuthSession(): boolean {
  return Boolean(getAuthToken() && getCachedAuthUser());
}

export function getCachedAuthUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export class AuthSessionError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "AuthSessionError";
    this.status = status;
  }
}

export function isAuthSessionError(err: unknown): err is AuthSessionError {
  return err instanceof AuthSessionError;
}

export function authHeaders(extra?: HeadersInit): HeadersInit {
  const token = getAuthToken();
  return {
    ...(extra ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function apiFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = getAuthToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  try {
    return await fetch(`${API_BASE}${path}`, { ...init, headers });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Không kết nối được backend (${API_BASE}${path}). Kiểm tra NEXT_PUBLIC_BACKEND_URL và server API. Chi tiết: ${reason}`,
    );
  }
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    let message = "Email hoặc mật khẩu không đúng";
    try {
      const body = (await response.json()) as { message?: string | string[] };
      if (typeof body.message === "string") message = body.message;
      else if (Array.isArray(body.message)) message = body.message.join(", ");
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  return (await response.json()) as LoginResponse;
}

export async function fetchMe(): Promise<AuthUser> {
  const response = await apiFetch("/api/auth/me");
  if (response.status === 401 || response.status === 403) {
    throw new AuthSessionError(response.status, "Phiên đăng nhập không hợp lệ");
  }
  if (!response.ok) {
    throw new Error(`Không xác thực được phiên đăng nhập (${response.status})`);
  }
  const data = (await response.json()) as { user: AuthUser };
  return data.user;
}

export function homePathForRole(role: AuthRole): string {
  if (role === "ACA") return "/aca";
  if (role === "GV") return "/teacher";
  return "/";
}
