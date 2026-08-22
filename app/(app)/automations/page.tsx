"use client";
import { PageHeader } from "@/components/PageHeader";
import { ComingSoon } from "@/components/ComingSoon";

export default function AutomationsPage() {
  return (
    <>
      <PageHeader title="Automations" subtitle="Visual workflow builder — triggers, conditions, actions" />
      <ComingSoon feature="The automation builder" phase="Phase 13 (Automation Engine)" />
    </>
  );
}
