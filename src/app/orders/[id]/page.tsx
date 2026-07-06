import type { Metadata } from "next";
import { OrderDetails } from "@/components/order-details";
import { getOrderById } from "@/lib/order/mock-orders";

export const metadata: Metadata = {
  title: "Карточка заказа — ПАМЯТЬ CRM",
};

export default function OrderDetailsPage({ params }: { params: { id: string } }) {
  return <OrderDetails order={getOrderById(params.id)} />;
}
