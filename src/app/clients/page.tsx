import type { Metadata } from "next";
import { ClientsList } from "@/components/clients-list";

export const metadata: Metadata = {
  title: "Клиенты — ПАМЯТЬ CRM",
};

export default function ClientsPage() {
  return <ClientsList />;
}
