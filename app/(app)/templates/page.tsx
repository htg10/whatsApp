"use client";
import { PageHeader } from "@/components/PageHeader";
import { ComingSoon } from "@/components/ComingSoon";

export default function TemplatesPage() {
  return (
    <>
      <PageHeader title="Templates" subtitle="WhatsApp message templates synced from Meta" />
      <ComingSoon feature="Template management" phase="Phase 11 (Templates)" />
    </>
  );
}
