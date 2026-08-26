export type NavItem = { label: string; href: string; icon: string };

export const NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "▤" },
  { label: "Inbox", href: "/inbox", icon: "✉" },
  { label: "Contacts", href: "/contacts", icon: "☰" },
  { label: "Campaigns", href: "/campaigns", icon: "📣" },
  { label: "Automations", href: "/automations", icon: "⚙" },
  { label: "Chatbot", href: "/chatbot", icon: "🤖" },
  { label: "Agents", href: "/agents", icon: "🎧" },
  { label: "Templates", href: "/templates", icon: "▧" },
  { label: "Analytics", href: "/analytics", icon: "▚" },
  { label: "WhatsApp", href: "/whatsapp", icon: "✆" },
  { label: "Billing", href: "/billing", icon: "₹" },
];
