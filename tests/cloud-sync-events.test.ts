import assert from "node:assert/strict";
import test from "node:test";
import { createCloudMutation } from "../src/lib/data/cloud-sync-events";

test("отправляет только измененные и новые записи", () => {
  const mutation = createCloudMutation(
    "orders",
    [{ id: "order-1", status: "Новый" }, { id: "order-2", status: "Макет" }],
    [{ id: "order-1", status: "Готов" }, { id: "order-2", status: "Макет" }, { id: "order-3", status: "Новый" }],
  );

  assert.deepEqual(mutation, {
    table: "orders",
    upserts: [{ id: "order-1", status: "Готов" }, { id: "order-3", status: "Новый" }],
    deletes: [],
  });
});

test("отправляет удаление только отсутствующей записи", () => {
  const mutation = createCloudMutation(
    "payments",
    [{ id: "pay-1", amount: 1000 }, { id: "pay-2", amount: 2000 }],
    [{ id: "pay-2", amount: 2000 }],
  );

  assert.deepEqual(mutation, {
    table: "payments",
    upserts: [],
    deletes: ["pay-1"],
  });
});

test("не создает событие без изменений", () => {
  assert.equal(
    createCloudMutation("clients", [{ id: "client-1", name: "Иванов" }], [{ id: "client-1", name: "Иванов" }]),
    null,
  );
});
