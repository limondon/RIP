import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeOrderReference,
  resolveOrderRecordId,
} from "../src/lib/order/identifiers";

const orders = [
  { id: "zk-2026-0143", orderNumber: "ЗК-2026-0143" },
];

test("отображаемый номер заказа преобразуется во внутренний ключ Supabase", () => {
  assert.equal(resolveOrderRecordId("ЗК-2026-0143", orders), "zk-2026-0143");
  assert.equal(resolveOrderRecordId(encodeURIComponent("ЗК-2026-0143"), orders), "zk-2026-0143");
  assert.equal(resolveOrderRecordId("zk-2026-0143", orders), "zk-2026-0143");
});

test("нормализация сохраняет канонический формат неизвестного номера заказа", () => {
  assert.equal(normalizeOrderReference(" ЗК-2026-0999 "), "zk-2026-0999");
});
