import type { Metadata } from "next";
import { OrdersList } from "@/components/orders-list";

export const metadata: Metadata = {
  title: "Заказы — ПАМЯТЬ CRM",
};

export default function OrdersPage() {
  return <OrdersList />;
}
