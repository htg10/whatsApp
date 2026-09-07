export type NavItem = {
  label: string;
  href: string;
  icon: string;
  /** Permission required to see this item. Omit = everyone (any signed-in user). */
  perm?: string;
};

// Company/agent navigation. Filtered by the signed-in user's permissions.
export const NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "▤" },
  { label: "Inbox", href: "/inbox", icon: "✉", perm: "conversations.view" },
  { label: "Contacts", href: "/contacts", icon: "☰", perm: "contacts.view" },
  { label: "Black List", href: "/blacklist", icon: "🚫", perm: "contacts.view" },
  { label: "Campaigns", href: "/campaigns", icon: "📣", perm: "campaigns.view" },
  { label: "Social", href: "/social", icon: "📸", perm: "campaigns.view" },
  { label: "Automations", href: "/automations", icon: "⚙", perm: "workflows.view" },
  { label: "Chatbot", href: "/chatbot", icon: "🤖", perm: "bots.view" },
  { label: "Agents", href: "/agents", icon: "🎧", perm: "agents.view" },
  { label: "Templates", href: "/templates", icon: "▧", perm: "templates.view" },
  { label: "Analytics", href: "/analytics", icon: "▚", perm: "analytics.view" },
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

type NavUser = { is_super_admin?: boolean; permissions?: string[] };

/**
 * The nav appropriate for this user. Super admins get the platform nav
 * (Companies, Plans) PLUS every workspace feature — they can do everything an
 * Admin or Agent can. Everyone else gets a permission-filtered feature nav.
 */
export function navFor(user: NavUser): NavItem[] {
  if (user.is_super_admin) {
    const featureItems = NAV.filter((item) => item.href !== "/dashboard");
    return [...SUPER_ADMIN_NAV, ...featureItems];
  }
  const perms = new Set(user.permissions ?? []);
  return NAV.filter((item) => !item.perm || perms.has(item.perm));
}
