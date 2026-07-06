import type { Metadata } from "next";
import { WarehouseDashboard } from "@/components/warehouse-dashboard";

export const metadata: Metadata = {
  title: "Склад — ПАМЯТЬ CRM",
};

export default function WarehousePage() {
  return <WarehouseDashboard />;
}
