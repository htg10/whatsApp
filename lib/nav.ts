export type NavItem = {
  label: string;
  href: string;
  icon: string;
  /** Permission required to see this item. Omit = everyone (any signed-in user). */
  perm?: string;
  /** Optional visual group heading shown above the item. */
  group?: string;
};

// The full navigation. Items are filtered by the signed-in user's permissions
// in the app layout, so an agent sees only what their role allows.
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

/** Filter the nav for a user given their granted permissions. */
export function navFor(permissions: string[] | undefined): NavItem[] {
  const perms = new Set(permissions ?? []);
  return NAV.filter((item) => !item.perm || perms.has(item.perm));
}
