"use client";
import { PageHeader } from "@/components/PageHeader";
import { ComingSoon } from "@/components/ComingSoon";

export default function AnalyticsPage() {
  return (
    <>
      <PageHeader title="Analytics" subtitle="Delivery, read & reply rates, agent and campaign performance" />
      <ComingSoon feature="Analytics dashboards" phase="Phase 16 (Analytics)" />
    </>
  );
}
