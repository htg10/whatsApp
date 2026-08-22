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
    register: (token: string, id: string, pin: string) =>
      request<{ number: WaNumber }>(`/whatsapp/numbers/${id}/register`, { method: "POST", body: { pin }, token }),
    disconnect: (token: string, id: string) =>
      request<{ message: string }>(`/whatsapp/numbers/${id}`, { method: "DELETE", token }),
  },

  inbox: {
    conversations: (token: string, params?: { status?: string; search?: string; page?: number }) => {
      const qs = new URLSearchParams();
      if (params?.status) qs.set("status", params.status);
      if (params?.search) qs.set("search", params.search);
      if (params?.page) qs.set("page", String(params.page));
      const q = qs.toString();
      return request<{ conversations: Conversation[]; meta: { current_page: number; last_page: number; total: number } }>(
        `/whatsapp/conversations${q ? `?${q}` : ""}`, { token }
      );
    },
    messages: (token: string, conversationId: string, cursor?: string) => {
      const qs = cursor ? `?cursor=${cursor}` : "";
      return request<{ messages: InboxMessage[]; next_cursor: string | null; has_more: boolean }>(
        `/whatsapp/conversations/${conversationId}/messages${qs}`, { token }
      );
    },
    markRead: (token: string, conversationId: string) =>
      request<{ message: string }>(`/whatsapp/conversations/${conversationId}/mark-read`, { method: "POST", token }),
    send: (token: string, conversationId: string, body: { type?: "text" | "template"; body?: string; template?: string; language?: string }) =>
      request<{ message: InboxMessage }>(`/whatsapp/conversations/${conversationId}/send`, { method: "POST", body, token }),
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

export type Conversation = {
  id: string;
  status: string;
  unread_count: number;
  is_bot_active: boolean;
  last_message_at: string | null;
  last_message_preview: string | null;
  window_expires_at: string | null;
  window_open: boolean;
  contact?: { id: string; name: string | null; phone: string | null; wa_id: string };
  phone_number?: { id: string; display_phone_number: string; verified_name: string | null };
  assigned_agent?: { id: string; name: string } | null;
  created_at: string | null;
};

export type InboxMessage = {
  id: string;
  direction: "inbound" | "outbound";
  type: string;
  body: string | null;
  status: string;
  external_message_id: string | null;
  sender?: { id: string; name: string } | null;
  attachments?: { type: string; mime_type: string | null; file_name: string | null; caption: string | null; url: string | null }[];
  error_code: string | null;
  error_message: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  failed_at: string | null;
  created_at: string | null;
};
