import type { OrderFormData } from "@/types/order";
import { calculateOrderTotals } from "./calculations";

export type OrderFormErrors = Partial<Record<"fullName" | "phone" | "monumentType" | "material" | "prepayment" | "total", string>>;

export function validateOrder(order: OrderFormData): OrderFormErrors {
  const errors: OrderFormErrors = {};
  const { total } = calculateOrderTotals(order);

  if (!order.customer.fullName.trim()) errors.fullName = "Укажите ФИО заказчика";
  if (!order.customer.phone.trim()) errors.phone = "Укажите номер телефона";
  if (!order.product.monumentType) errors.monumentType = "Выберите тип памятника";
  if (!order.product.material) errors.material = "Выберите материал";
  if (total < 0) errors.total = "Итоговая сумма не может быть меньше нуля";
  if (order.payment.prepayment > total) errors.prepayment = "Предоплата не может быть больше итоговой суммы";

  return errors;
}
