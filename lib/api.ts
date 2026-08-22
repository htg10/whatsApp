// Thin fetch wrapper around the Laravel API. Every response uses the
// { success, data } / { success, message, errors } envelope from the backend.

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1";

export type ApiError = {
  message: string;
  errors?: Record<string, string[]>;
  status: number;
};

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; token?: string | null } = {}
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  let json: any = null;
  try {
    json = await res.json();
  } catch {
    // non-JSON response
  }

  if (!res.ok || (json && json.success === false)) {
    const err: ApiError = {
      message: json?.message ?? `Request failed (${res.status})`,
      errors: json?.errors,
      status: res.status,
    };
    throw err;
  }

  return json.data as T;
}

export const api = {
  register: (body: {
    company_name: string;
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
  }) => request<AuthPayload>("/auth/register", { method: "POST", body }),

  login: (body: { email: string; password: string }) =>
    request<AuthPayload>("/auth/login", { method: "POST", body }),

  me: (token: string) => request<{ user: User }>("/auth/me", { token }),

  ping: (token: string) => request<{ pong: boolean; tenant_id: number }>("/ping", { token }),

  health: () => request<{ status: string }>("/health"),

  whatsapp: {
    config: (token: string) => request<WaConfig>("/whatsapp/config", { token }),
    numbers: (token: string) => request<{ numbers: WaNumber[] }>("/whatsapp/numbers", { token }),
    connectManual: (
      token: string,
      body: {
        waba_id: string;
        phone_number_id: string;
        display_phone_number: string;
        access_token: string;
        name?: string;
      }
    ) => request<{ number: WaNumber }>("/whatsapp/connect-manual", { method: "POST", body, token }),
    embeddedSignup: (
      token: string,
      body: { code: string; waba_id: string; phone_number_id: string | null }
    ) => request<{ account: unknown }>("/whatsapp/embedded-signup", { method: "POST", body, token }),
    sync: (token: string, id: string) =>
      request<{ number: WaNumber }>(`/whatsapp/numbers/${id}/sync`, { method: "POST", token }),
    sendTest: (
      token: string,
      id: string,
      body: { to: string; type?: "template" | "text"; body?: string; template?: string; language?: string }
    ) => request<{ wamid: string | null; to: string }>(`/whatsapp/numbers/${id}/send-test`, { method: "POST", body, token }),
    disconnect: (token: string, id: string) =>
      request<{ message: string }>(`/whatsapp/numbers/${id}`, { method: "DELETE", token }),
  },
};

export type WaNumber = {
  id: string;
  phone_number_id: string;
  display_phone_number: string;
  verified_name: string | null;
  quality_rating: string | null;
  status: string;
  is_default: boolean;
  is_registered: boolean;
  waba?: { id: string; name: string; waba_id: string; status: string };
  created_at: string | null;
};

export type WaConfig = {
  app_id: string | null;
  config_id: string | null;
  api_version: string;
  embedded_signup_configured: boolean;
};

export type Tenant = {
  id: string;
  name: string;
  company_name: string | null;
  status: string;
  trial_ends_at: string | null;
};

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  is_super_admin: boolean;
  status: string;
  email_verified: boolean;
  roles: string[];
  permissions: string[];
  tenant: Tenant | null;
  last_login_at: string | null;
};

export type AuthPayload = {
  user: User;
  token: string;
  token_type: string;
  expires_in: number;
};
