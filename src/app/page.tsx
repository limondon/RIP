import type { Metadata } from "next";
import { OperationsDashboard } from "@/components/operations-dashboard";

export const metadata: Metadata = {
  title: "Главная — ПАМЯТЬ CRM",
};

export default function HomePage() {
  return <OperationsDashboard />;
}
