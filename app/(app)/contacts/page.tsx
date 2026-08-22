"use client";
import { PageHeader } from "@/components/PageHeader";
import { ComingSoon } from "@/components/ComingSoon";

export default function ContactsPage() {
  return (
    <>
      <PageHeader title="Contacts" subtitle="Your CRM — leads, tags, custom fields" />
      <ComingSoon feature="Contacts & CRM" phase="Phase 10 (Contacts/CRM)" />
    </>
  );
}
