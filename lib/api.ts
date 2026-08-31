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

  contacts: {
    list: (token: string, params?: { search?: string; tag?: string; page?: number }) => {
      const qs = new URLSearchParams();
      if (params?.search) qs.set("search", params.search);
      if (params?.tag) qs.set("tag", params.tag);
      if (params?.page) qs.set("page", String(params.page));
      const q = qs.toString();
      return request<{ contacts: ContactItem[]; meta: PaginationMeta }>(
        `/contacts${q ? `?${q}` : ""}`, { token }
      );
    },
    get: (token: string, id: string) =>
      request<{ contact: ContactItem }>(`/contacts/${id}`, { token }),
    create: (token: string, body: { phone: string; name?: string; email?: string; company?: string; tags?: string[] }) =>
      request<{ contact: ContactItem }>("/contacts", { method: "POST", body, token }),
    update: (token: string, id: string, body: Record<string, unknown>) =>
      request<{ contact: ContactItem }>(`/contacts/${id}`, { method: "PUT", body, token }),
    remove: (token: string, id: string) =>
      request<{ message: string }>(`/contacts/${id}`, { method: "DELETE", token }),
    import: (token: string, contacts: { phone: string; name?: string; email?: string; company?: string; tags?: string[] }[]) =>
      request<{ created: number; updated: number; skipped: number; total: number }>("/contacts/import", { method: "POST", body: { contacts }, token }),
  },

  tags: {
    list: (token: string) =>
      request<{ tags: TagItem[] }>("/tags", { token }),
    create: (token: string, name: string, color?: string) =>
      request<{ tag: TagItem }>("/tags", { method: "POST", body: { name, color }, token }),
    remove: (token: string, id: string) =>
      request<{ message: string }>(`/tags/${id}`, { method: "DELETE", token }),
  },

  templates: {
    list: (token: string, params?: { search?: string; status?: string; category?: string }) => {
      const qs = new URLSearchParams();
      if (params?.search) qs.set("search", params.search);
      if (params?.status) qs.set("status", params.status);
      if (params?.category) qs.set("category", params.category);
      const q = qs.toString();
      return request<{ templates: TemplateItem[]; meta: PaginationMeta }>(
        `/templates${q ? `?${q}` : ""}`, { token }
      );
    },
    get: (token: string, id: string) =>
      request<{ template: TemplateItem }>(`/templates/${id}`, { token }),
    sync: (token: string) =>
      request<{ message: string; synced: number }>("/templates/sync", { method: "POST", token }),
  },

  bulk: {
    list: (token: string, page?: number) => {
      const qs = page ? `?page=${page}` : "";
      return request<{ bulk_sends: BulkSend[]; meta: { current_page: number; last_page: number; total: number } }>(
        `/whatsapp/bulk-sends${qs}`, { token }
      );
    },
    get: (token: string, id: string) =>
      request<{ bulk_send: BulkSendDetail }>(`/whatsapp/bulk-sends/${id}`, { token }),
    send: (token: string, body: { numbers: string[]; template: string; language?: string; variables?: string[] }) =>
      request<{ bulk_send: BulkSendDetail }>("/whatsapp/bulk-send", { method: "POST", body, token }),
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
    sendMedia: async (token: string, conversationId: string, file: File, mediaType: string, caption?: string) => {
      const form = new FormData();
      form.append("file", file);
      form.append("media_type", mediaType);
      if (caption) form.append("caption", caption);
      const res = await fetch(`${BASE}/whatsapp/conversations/${conversationId}/send-media`, {
        method: "POST",
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
        body: form,
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || (json && json.success === false)) {
        const err: ApiError = { message: json?.message ?? `Upload failed (${res.status})`, errors: json?.errors, status: res.status };
        throw err;
      }
      return json.data as { message: InboxMessage };
    },
    deleteMessage: (token: string, conversationId: string, messageId: string) =>
      request<{ message: string }>(`/whatsapp/conversations/${conversationId}/messages/${messageId}`, { method: "DELETE", token }),
  },

  campaigns: {
    list: (token: string, params?: { search?: string; status?: string; page?: number }) => {
      const qs = new URLSearchParams();
      if (params?.search) qs.set("search", params.search);
      if (params?.status) qs.set("status", params.status);
      if (params?.page) qs.set("page", String(params.page));
      const q = qs.toString();
      return request<{ campaigns: CampaignItem[]; meta: PaginationMeta }>(
        `/campaigns${q ? `?${q}` : ""}`, { token }
      );
    },
    get: (token: string, id: string) =>
      request<{ campaign: CampaignDetail }>(`/campaigns/${id}`, { token }),
    create: (token: string, body: { name: string; template_id: string; audience_filter?: { tags?: string[]; source?: string }; scheduled_at?: string }) =>
      request<{ campaign: CampaignItem }>("/campaigns", { method: "POST", body, token }),
    start: (token: string, id: string) =>
      request<{ campaign: CampaignItem }>(`/campaigns/${id}/start`, { method: "POST", token }),
    pause: (token: string, id: string) =>
      request<{ campaign: CampaignItem }>(`/campaigns/${id}/pause`, { method: "POST", token }),
    cancel: (token: string, id: string) =>
      request<{ campaign: CampaignItem }>(`/campaigns/${id}/cancel`, { method: "POST", token }),
    remove: (token: string, id: string) =>
      request<{ message: string }>(`/campaigns/${id}`, { method: "DELETE", token }),
  },

  analytics: {
    dashboard: (token: string) =>
      request<DashboardStats>("/analytics/dashboard", { token }),
    messages: (token: string, days?: number) => {
      const qs = days ? `?days=${days}` : "";
      return request<MessageStats>(`/analytics/messages${qs}`, { token });
    },
    campaigns: (token: string) =>
      request<{ campaigns: CampaignStat[] }>("/analytics/campaigns", { token }),
  },

  automations: {
    list: (token: string, params?: { search?: string; status?: string; page?: number }) => {
      const qs = new URLSearchParams();
      if (params?.search) qs.set("search", params.search);
      if (params?.status) qs.set("status", params.status);
      if (params?.page) qs.set("page", String(params.page));
      const q = qs.toString();
      return request<{ workflows: WorkflowItem[]; meta: PaginationMeta }>(
        `/automations${q ? `?${q}` : ""}`, { token }
      );
    },
    get: (token: string, id: string) =>
      request<{ workflow: WorkflowDetail }>(`/automations/${id}`, { token }),
    create: (token: string, body: { name: string; description?: string; trigger_type: string; trigger_config?: Record<string, unknown> }) =>
      request<{ workflow: WorkflowItem }>("/automations", { method: "POST", body, token }),
    update: (token: string, id: string, body: { name?: string; description?: string; trigger_type?: string; trigger_config?: Record<string, unknown> }) =>
      request<{ workflow: WorkflowItem }>(`/automations/${id}`, { method: "PUT", body, token }),
    remove: (token: string, id: string) =>
      request<{ message: string }>(`/automations/${id}`, { method: "DELETE", token }),
    saveCanvas: (token: string, id: string, body: { nodes: WfNodeData[]; edges: WfEdgeData[] }) =>
      request<{ workflow: WorkflowDetail }>(`/automations/${id}/canvas`, { method: "PUT", body, token }),
    activate: (token: string, id: string) =>
      request<{ workflow: WorkflowItem }>(`/automations/${id}/activate`, { method: "POST", token }),
    pause: (token: string, id: string) =>
      request<{ workflow: WorkflowItem }>(`/automations/${id}/pause`, { method: "POST", token }),
    executions: (token: string, id: string, page?: number) => {
      const qs = page ? `?page=${page}` : "";
      return request<{ executions: WfExecution[]; meta: PaginationMeta }>(
        `/automations/${id}/executions${qs}`, { token }
      );
    },
  },

  chatbot: {
    list: (token: string, params?: { search?: string; page?: number }) => {
      const qs = new URLSearchParams();
      if (params?.search) qs.set("search", params.search);
      if (params?.page) qs.set("page", String(params.page));
      const q = qs.toString();
      return request<{ chatbots: ChatbotItem[]; meta: PaginationMeta }>(
        `/chatbots${q ? `?${q}` : ""}`, { token }
      );
    },
    get: (token: string, id: string) =>
      request<{ chatbot: ChatbotDetail }>(`/chatbots/${id}`, { token }),
    create: (token: string, body: { name: string; phone_number_id?: string | null; welcome_message?: string | null; fallback_message?: string | null; is_active?: boolean }) =>
      request<{ chatbot: ChatbotItem }>("/chatbots", { method: "POST", body, token }),
    update: (token: string, id: string, body: Record<string, unknown>) =>
      request<{ chatbot: ChatbotItem }>(`/chatbots/${id}`, { method: "PUT", body, token }),
    remove: (token: string, id: string) =>
      request<{ message: string }>(`/chatbots/${id}`, { method: "DELETE", token }),
    toggle: (token: string, id: string) =>
      request<{ chatbot: ChatbotItem }>(`/chatbots/${id}/toggle`, { method: "POST", token }),
    addRule: (token: string, id: string, body: { keyword: string; match_type: string; response_text?: string | null; response_type?: string; template_name?: string | null; priority?: number; is_active?: boolean }) =>
      request<{ rule: ChatbotRuleItem }>(`/chatbots/${id}/rules`, { method: "POST", body, token }),
    updateRule: (token: string, botId: string, ruleId: string, body: Record<string, unknown>) =>
      request<{ rule: ChatbotRuleItem }>(`/chatbots/${botId}/rules/${ruleId}`, { method: "PUT", body, token }),
    deleteRule: (token: string, botId: string, ruleId: string) =>
      request<{ message: string }>(`/chatbots/${botId}/rules/${ruleId}`, { method: "DELETE", token }),
  },

  agents: {
    list: (token: string) =>
      request<{ agents: AgentItem[] }>("/agents", { token }),
    get: (token: string, id: string) =>
      request<{ agent: AgentDetail }>(`/agents/${id}`, { token }),
    assign: (token: string, body: { conversation_id: string; agent_id: string }) =>
      request<{ message: string }>("/agents/assign", { method: "POST", body, token }),
    unassign: (token: string, body: { conversation_id: string }) =>
      request<{ message: string }>("/agents/unassign", { method: "POST", body, token }),
    stats: (token: string) =>
      request<{ stats: AgentStat[] }>("/agents/stats", { token }),
  },

  billing: {
    overview: (token: string) =>
      request<{ subscription: SubscriptionItem2 | null; wallet: WalletInfo; tenant: { status: string | null; trial_ends_at: string | null } }>(
        "/billing", { token }
      ),
    plans: (token: string) =>
      request<{ plans: PlanItem[] }>("/billing/plans", { token }),
    wallet: (token: string) =>
      request<{ wallet: WalletInfo; transactions: WalletTxn[] }>("/billing/wallet", { token }),
    invoices: (token: string) =>
      request<{ invoices: InvoiceItem[]; meta: PaginationMeta }>("/billing/invoices", { token }),
    subscribe: (token: string, planId: string) =>
      request<{ subscription: SubscriptionItem2 }>("/billing/subscribe", { method: "POST", body: { plan_id: planId }, token }),
  },

  team: {
    list: (token: string) =>
      request<{ members: TeamMember[]; roles: RoleOption[]; features: FeatureOption[] }>("/team", { token }),
    create: (token: string, body: { name: string; email: string; password: string; role: string; features: string[] }) =>
      request<{ member: TeamMember }>("/team", { method: "POST", body, token }),
    update: (token: string, id: string, body: { name?: string; role?: string; features?: string[] }) =>
      request<{ member: TeamMember }>(`/team/${id}`, { method: "PUT", body, token }),
    toggle: (token: string, id: string) =>
      request<{ member: TeamMember }>(`/team/${id}/toggle`, { method: "POST", token }),
    remove: (token: string, id: string) =>
      request<{ message: string }>(`/team/${id}`, { method: "DELETE", token }),
  },
};

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  status: string;
  role: string;            // "admin" | "user"
  role_label: string;      // "Admin" | "User"
  features: string[];      // feature keys the user can access
  last_login_at: string | null;
  created_at: string | null;
};

export type RoleOption = { value: string; label: string };
export type FeatureOption = { key: string; label: string };

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

export type PaginationMeta = { current_page: number; last_page: number; total: number };

export type ContactItem = {
  id: string;
  phone: string;
  wa_id: string;
  name: string | null;
  email: string | null;
  company: string | null;
  source: string | null;
  language: string | null;
  country: string | null;
  is_blocked: boolean;
  opted_out: boolean;
  last_interaction_at: string | null;
  tags?: TagItem[];
  assigned_agent?: { id: string; name: string } | null;
  conversations_count?: number;
  created_at: string | null;
};

export type TagItem = {
  id: string;
  name: string;
  color: string;
  contacts_count?: number;
};

export type TemplateItem = {
  id: string;
  name: string;
  language: string;
  category: string;
  status: string;
  rejection_reason: string | null;
  quality_score: string | null;
  last_synced_at: string | null;
  components?: { type: string; format: string | null; text: string | null; buttons: unknown[] | null }[];
  waba?: { id: string; name: string };
  created_at: string | null;
};

export type BulkSend = {
  id: number;
  uuid: string;
  template_name: string;
  language: string;
  status: string;
  total: number;
  sent_count: number;
  failed_count: number;
  phone_number?: { id: string; display_phone_number: string } | null;
  created_at: string | null;
};

export type BulkSendRecipient = {
  id: number;
  phone: string;
  status: string;
  wamid: string | null;
  error_message: string | null;
  sent_at: string | null;
};

export type BulkSendDetail = BulkSend & {
  recipients: BulkSendRecipient[];
};

export type InboxMessage = {
  id: string;
  direction: "inbound" | "outbound";
  type: string;
  body: string | null;
  status: string;
  external_message_id: string | null;
  sender?: { id: string; name: string } | null;
  attachments?: { type: string; mime_type: string | null; file_name: string | null; file_size: number | null; caption: string | null; url: string | null }[];
  error_code: string | null;
  error_message: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  failed_at: string | null;
  created_at: string | null;
};

export type CampaignItem = {
  id: string;
  name: string;
  status: string;
  template?: { id: string; name: string; language: string } | null;
  phone_number?: { id: string; display_phone_number: string } | null;
  audience_filter: { tags?: string[]; source?: string } | null;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  total_recipients: number;
  sent_count: number;
  delivered_count: number;
  read_count: number;
  failed_count: number;
  replied_count: number;
  created_at: string | null;
};

export type CampaignContactItem = {
  id: number;
  contact: { id: string; name: string | null; phone: string };
  status: string;
  resolved_variables: Record<string, string> | null;
  created_at: string | null;
};

export type CampaignDetail = CampaignItem & {
  contacts?: CampaignContactItem[];
  contacts_meta?: PaginationMeta;
};

export type DashboardStats = {
  total_contacts: number;
  total_conversations: number;
  open_conversations: number;
  messages_today: number;
  messages_this_week: number;
  messages_this_month: number;
  outbound_today: number;
  inbound_today: number;
  templates_approved: number;
  active_campaigns: number;
  total_campaigns: number;
};

export type DailyMessageStat = {
  date: string;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  inbound: number;
};

export type MessageStats = {
  daily: DailyMessageStat[];
  totals: {
    total_sent: number;
    total_delivered: number;
    total_read: number;
    total_failed: number;
    total_inbound: number;
    delivery_rate: number;
    read_rate: number;
  };
};

export type CampaignStat = {
  name: string;
  status: string;
  total_recipients: number;
  sent_count: number;
  delivered_count: number;
  read_count: number;
  failed_count: number;
  delivery_rate: number;
  read_rate: number;
};

export type WfNodeData = {
  node_key: string;
  family: "trigger" | "condition" | "action" | "wait";
  type: string;
  config?: Record<string, unknown>;
  position_x: number;
  position_y: number;
  is_entry?: boolean;
};

export type WfEdgeData = {
  source_node_key: string;
  target_node_key: string;
  branch?: string;
  condition?: Record<string, unknown>;
};

export type WorkflowItem = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  trigger_type: string;
  trigger_config: Record<string, unknown> | null;
  version: number;
  activated_at: string | null;
  nodes_count?: number;
  executions_count?: number;
  created_at: string | null;
};

export type WorkflowDetail = WorkflowItem & {
  nodes: WfNodeData[];
  edges: WfEdgeData[];
};

export type WfExecution = {
  id: string;
  status: string;
  current_node_key: string | null;
  contact?: { id: string; name: string | null; phone: string } | null;
  started_at: string | null;
  finished_at: string | null;
  error_message: string | null;
  created_at: string | null;
};

// Phase 14: Chatbot
export type ChatbotRuleItem = {
  id: string;
  keyword: string;
  match_type: string;
  response_text: string | null;
  response_type: string;
  template_name: string | null;
  priority: number;
  is_active: boolean;
};

export type ChatbotItem = {
  id: string;
  name: string;
  is_active: boolean;
  welcome_message: string | null;
  fallback_message: string | null;
  phone_number?: { id: string; display_phone_number: string } | null;
  rules_count?: number;
  created_at: string | null;
};

export type ChatbotDetail = ChatbotItem & {
  rules: ChatbotRuleItem[];
};

// Phase 15: Agents
export type AgentItem = {
  id: string;
  name: string;
  email: string;
  roles: string[];
  active_conversations_count: number;
  total_handled: number;
};

export type AgentDetail = AgentItem & {
  conversations?: { id: string; contact_name: string | null; contact_phone: string; status: string; last_message_at: string | null }[];
};

export type AgentStat = {
  id: string;
  name: string;
  open: number;
  pending: number;
  resolved: number;
  closed: number;
  total: number;
};

// Phase 17: Billing
export type PlanItem = {
  id: string;
  name: string;
  description: string | null;
  billing_period: string;
  price: number;
  price_display: string;
  currency: string;
  trial_days: number;
  features: string[];
  limits: Record<string, unknown>;
};

export type SubscriptionItem2 = {
  id: string;
  status: string;
  plan: PlanItem | null;
  trial_ends_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancelled_at: string | null;
};

export type WalletInfo = {
  balance: string;
  balance_minor: number;
  reserved: string;
  currency: string;
  auto_recharge: boolean;
};

export type WalletTxn = {
  id: string;
  type: string;
  amount: string;
  amount_minor: number;
  balance_after: string;
  description: string | null;
  created_at: string | null;
};

export type InvoiceItem = {
  id: string;
  number: string | null;
  status: string;
  total: string;
  currency: string;
  issued_at: string | null;
  paid_at: string | null;
  due_at: string | null;
};
