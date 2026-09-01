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
];

type NavUser = { is_super_admin?: boolean; permissions?: string[] };

/** The nav appropriate for this user. Super admins get the platform nav. */
export function navFor(user: NavUser): NavItem[] {
  if (user.is_super_admin) return SUPER_ADMIN_NAV;
  const perms = new Set(user.permissions ?? []);
  return NAV.filter((item) => !item.perm || perms.has(item.perm));
}
