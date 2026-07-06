import type { Metadata } from "next";
import { OrderForm } from "@/components/order-form";

export const metadata: Metadata = {
  title: "Новый заказ — ПАМЯТЬ CRM",
};

export default function NewOrderPage({ searchParams }: { searchParams?: { edit?: string } }) {
  return <OrderForm editOrderId={searchParams?.edit ?? null} />;
}
