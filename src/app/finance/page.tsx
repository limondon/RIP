import type { Metadata } from "next";
import { FinanceDashboard } from "@/components/finance-dashboard";

export const metadata: Metadata = {
  title: "Финансы — ПАМЯТЬ CRM",
};

export default function FinancePage() {
  return <FinanceDashboard />;
}
