import type { Metadata } from "next";
import { ClientDetails } from "@/components/client-details";
import { getClientById } from "@/lib/clients/mock-clients";

export const metadata: Metadata = {
  title: "Карточка клиента — ПАМЯТЬ CRM",
};

export default function ClientDetailsPage({ params }: { params: { id: string } }) {
  return <ClientDetails client={getClientById(params.id)} />;
}
