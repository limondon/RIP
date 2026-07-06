import { statuses } from "@/data/mock-data";
import { calculateOrderPaidAmount, getClientById, getMasterById, getOrderById } from "@/lib/crm-utils";
import { getStoredProductionTasks } from "@/lib/storage";
import type { ProductionStage } from "@/types/crm";

export type { ProductionStage };

export interface ProductionOrder {
  id: string;
  client: string;
  phone: string;
  product: string;
  material: string;
  steleSize: string;
  deadline: string;
  deadlineLabel: string;
  transferDate: string;
  masterId: string;
  master: string;
  amount: number;
  paid: number;
  stage: ProductionStage;
  comment: string;
}

export const productionStages: ProductionStage[] = statuses.production;

export function getMockProductionOrders(): ProductionOrder[] {
  return getStoredProductionTasks().map((task) => {
  const order = getOrderById(task.orderId)!;
  const client = getClientById(order.clientId)!;
  const master = getMasterById(task.masterId);
  return {
    id: order.orderNumber,
    client: client.fullName,
    phone: client.phone,
    product: order.monumentType,
    material: order.material,
    steleSize: order.steleSize,
    deadline: task.plannedReadyAt,
    deadlineLabel: new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" }).format(new Date(`${task.plannedReadyAt}T00:00:00`)),
    transferDate: new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${task.startedAt}T00:00:00`)).replace(/\sг\.$/, ""),
    masterId: task.masterId,
    master: master?.fullName ?? "Не назначен",
    amount: order.totalAmount,
    paid: calculateOrderPaidAmount(order.id),
    stage: task.stage,
    comment: task.comment,
  };
  });
}

export const mockProductionOrders: ProductionOrder[] = getMockProductionOrders();

export function daysUntil(deadline: string): number {
  const today = new Date("2026-06-16T00:00:00");
  const target = new Date(`${deadline}T00:00:00`);
  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
}

export function deadlineTone(order: ProductionOrder): "ready" | "overdue" | "soon" | "normal" {
  if (order.stage === "Готов") return "ready";
  const days = daysUntil(order.deadline);
  if (days < 0) return "overdue";
  if (days <= 3) return "soon";
  return "normal";
}
