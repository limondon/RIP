import assert from "node:assert/strict";
import test from "node:test";
import { calculateItemTotal, calculateOrderTotals, calculateServiceTotal, toNonNegativeNumber, updateOrderItem } from "../src/lib/order/calculations";
import { createInitialOrderData } from "../src/lib/order/defaults";
import { validateOrder } from "../src/lib/order/validation";

test("считает только выбранные услуги", () => {
  const order = createInitialOrderData();
  assert.equal(calculateServiceTotal(order.services), 23000);
});

test("считает итог и остаток заказа", () => {
  const totals = calculateOrderTotals(createInitialOrderData());
  assert.deepEqual(totals, { serviceTotal: 23000, total: 112500, paid: 50000, remaining: 62500 });
});

test("не допускает отрицательные денежные значения", () => {
  assert.equal(toNonNegativeNumber(-100), 0);
  assert.equal(calculateItemTotal(-2, 5000), 0);
});

test("пересчитывает сумму строки комплектации", () => {
  const item = createInitialOrderData().items[0];
  assert.equal(updateOrderItem(item, { quantity: 2, price: 70000 }).total, 140000);
});

test("валидирует обязательные поля и превышение предоплаты", () => {
  const order = createInitialOrderData();
  order.customer.fullName = "";
  order.customer.phone = "";
  order.product.monumentType = "";
  order.product.material = "";
  order.payment.prepayment = 999999;

  assert.deepEqual(validateOrder(order), {
    fullName: "Укажите ФИО заказчика",
    phone: "Укажите номер телефона",
    monumentType: "Выберите тип памятника",
    material: "Выберите материал",
    prepayment: "Предоплата не может быть больше итоговой суммы",
  });
});
