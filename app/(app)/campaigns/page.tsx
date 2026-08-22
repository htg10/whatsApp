"use client";
import { PageHeader } from "@/components/PageHeader";
import { ComingSoon } from "@/components/ComingSoon";

export default function CampaignsPage() {
  return (
    <>
      <PageHeader title="Campaigns" subtitle="Broadcast approved templates to your audience" />
      <ComingSoon feature="Campaigns" phase="Phase 12 (Campaigns)" />
    </>
  );
}
