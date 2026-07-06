import { brigades, statuses } from "@/data/mock-data";
import { getBrigadeById, getClientById, getOrderById } from "@/lib/crm-utils";
import { getStoredInstallationTasks } from "@/lib/storage";
import type { InstallationStatus } from "@/types/crm";

export type { InstallationStatus };

export interface InstallationJob {
  id: string;
  orderId: string;
  client: string;
  phone: string;
  cemetery: string;
  place: string;
  product: string;
  date: string;
  dateLabel: string;
  time: string;
  brigadeId: string;
  crew: string;
  status: InstallationStatus;
  comment: string;
}

export const installationStatuses: InstallationStatus[] = statuses.installation;
export const installationCrews = brigades.map((brigade) => `${brigade.name} — ${brigade.members}`);

export const installationStatusStyles: Record<InstallationStatus, string> = {
  "Не назначена": "bg-slate-100 text-slate-600 ring-slate-200",
  "Запланирована": "bg-blue-50 text-blue-700 ring-blue-200",
  "Выехали": "bg-cyan-50 text-cyan-700 ring-cyan-200",
  "Установлено": "bg-emerald-50 text-emerald-700 ring-emerald-200",
  "Перенос": "bg-orange-50 text-orange-700 ring-orange-200",
  "Проблема": "bg-red-50 text-red-700 ring-red-200",
};

function period(date: string) {
  if (date === "2026-06-16") return "Сегодня";
  if (date === "2026-06-17") return "Завтра";
  if (date <= "2026-06-22") return "Эта неделя";
  return "Следующая неделя";
}

export function getMockInstallations(): InstallationJob[] {
  return getStoredInstallationTasks().map((task) => {
  const order = getOrderById(task.orderId)!;
  const client = getClientById(order.clientId)!;
  const brigade = getBrigadeById(task.brigadeId);
  return {
    id: task.id,
    orderId: order.orderNumber,
    client: client.fullName,
    phone: client.phone,
    cemetery: order.cemetery,
    place: `уч. ${order.section} / ряд ${order.row} / место ${order.place}`,
    product: order.monumentType,
    date: task.date,
    dateLabel: period(task.date),
    time: task.time,
    brigadeId: task.brigadeId,
    crew: brigade ? `${brigade.name} — ${brigade.members}` : "Не назначена",
    status: task.status,
    comment: task.comment,
  };
  });
}

export const mockInstallations: InstallationJob[] = getMockInstallations();

export function getInstallationPeriod(job: InstallationJob): "Сегодня" | "Завтра" | "Эта неделя" | "Следующая неделя" {
  return job.dateLabel as "Сегодня" | "Завтра" | "Эта неделя" | "Следующая неделя";
}
