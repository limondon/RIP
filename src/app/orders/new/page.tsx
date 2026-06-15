import type { Metadata } from "next";
import { OrderForm } from "@/components/order-form";

export const metadata: Metadata = {
  title: "Новый заказ — ПАМЯТЬ CRM",
};

export default function NewOrderPage() {
  return <OrderForm />;
}
