export type NavItem = {
  label: string;
  href: string;
  icon: string;
  /** Permission required to see this item. Omit = everyone (any signed-in user). */
  perm?: string;
  /** Plan feature key required. Omit = core feature, always available. */
  feature?: string;
};

// Company/agent navigation. Filtered by the signed-in user's permissions.
export const NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "▤" },
  { label: "Inbox", href: "/inbox", icon: "✉", perm: "conversations.view" },
  { label: "Contacts", href: "/contacts", icon: "☰", perm: "contacts.view" },
  { label: "Black List", href: "/blacklist", icon: "🚫", perm: "contacts.view" },
  { label: "Campaigns", href: "/campaigns", icon: "📣", perm: "campaigns.view" },
  { label: "Social", href: "/social", icon: "📸", perm: "campaigns.view", feature: "social" },
  { label: "Automations", href: "/automations", icon: "⚙", perm: "workflows.view", feature: "automations" },
  { label: "Chatbot", href: "/chatbot", icon: "🤖", perm: "bots.view", feature: "chatbot" },
  { label: "Agents", href: "/agents", icon: "🎧", perm: "agents.view" },
  { label: "Templates", href: "/templates", icon: "▧", perm: "templates.view" },
  { label: "Analytics", href: "/analytics", icon: "▚", perm: "analytics.view", feature: "reports" },
  { label: "WhatsApp", href: "/whatsapp", icon: "✆", perm: "whatsapp.view" },
  { label: "Team", href: "/team", icon: "👥", perm: "team.view" },
  { label: "Billing", href: "/billing", icon: "₹", perm: "billing.view" },
];

// Platform super-admin navigation.
export const SUPER_ADMIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "▤" },
  { label: "Companies", href: "/companies", icon: "🏢" },
  { label: "Plans", href: "/plans", icon: "💳" },
];

type NavUser = { is_super_admin?: boolean; permissions?: string[]; plan_features?: string[] | null };

/**
 * The nav appropriate for this user. Super admins get the platform nav
 * (Companies, Plans) PLUS every workspace feature — they can do everything an
 * Admin or Agent can. Everyone else gets a permission-filtered feature nav.
 */
export function navFor(user: NavUser): NavItem[] {
  // Super admin is a platform account (no tenant), so it only gets the platform
  // tools — Dashboard, Companies, Plans. Tenant feature pages would be empty for
  // it, so they're intentionally left out.
  if (user.is_super_admin) {
    return SUPER_ADMIN_NAV;
  }
  const perms = new Set(user.permissions ?? []);
  // plan_features null/undefined = no plan → no feature gating (all available).
  const planFeatures = user.plan_features == null ? null : new Set(user.plan_features);
  return NAV.filter((item) => {
    if (item.perm && !perms.has(item.perm)) return false;
    if (item.feature && planFeatures && !planFeatures.has(item.feature)) return false;
    return true;
  });
}
