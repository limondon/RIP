import type { Metadata } from "next";
import { DocumentsDashboard } from "@/components/documents-dashboard";

export const metadata: Metadata = {
  title: "Документы — ПАМЯТЬ CRM",
};

export default function DocumentsPage() {
  return <DocumentsDashboard />;
}
