import assert from "node:assert/strict";
import test from "node:test";

function setupStorage() {
  const store = new Map<string, string>();
  const localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };
  Object.defineProperty(globalThis, "window", { value: { localStorage }, configurable: true });
  return localStorage;
}

test("приход увеличивает складской остаток", async () => {
  setupStorage();
  const storage = await import("../src/lib/storage");
  const before = storage.getStoredInventoryItems().find((item) => item.id === "inv-001")!;

  const result = storage.receiveStoredInventoryItem("inv-001", 2, "Тестовая поставка");
  const after = storage.getStoredInventoryItems().find((item) => item.id === "inv-001")!;

  assert.equal(result.ok, true);
  assert.equal(after.onHand, before.onHand + 2);
  assert.equal(storage.getStoredInventoryMovements()[0].type, "Поступление");
});

test("резерв под заказ уменьшает доступный остаток и пишет событие", async () => {
  setupStorage();
  const storage = await import("../src/lib/storage");
  const before = storage.getStoredInventoryAvailable("inv-001");

  const result = storage.reserveStoredInventoryForOrder({ itemId: "inv-001", orderId: "zk-2026-0128", quantity: 1, comment: "Стела" });

  assert.equal(result.ok, true);
  assert.equal(storage.getStoredInventoryAvailable("inv-001"), before - 1);
  assert.equal(storage.getStoredInventoryReservations()[0].status, "Активен");
  assert.equal(storage.getStoredEventsByOrderId("zk-2026-0128")[0].type, "inventory");
});

test("списание резерва закрывает резерв и уменьшает фактический остаток", async () => {
  setupStorage();
  const storage = await import("../src/lib/storage");
  const before = storage.getStoredInventoryItems().find((item) => item.id === "inv-001")!;
  const reserve = storage.reserveStoredInventoryForOrder({ itemId: "inv-001", orderId: "zk-2026-0128", quantity: 1 });
  assert.equal(reserve.ok, true);

  const result = storage.writeOffStoredInventoryReservation(reserve.reservation.id, "Передано в производство");
  const after = storage.getStoredInventoryItems().find((item) => item.id === "inv-001")!;

  assert.equal(result.ok, true);
  assert.equal(after.onHand, before.onHand - 1);
  assert.equal(storage.getStoredInventoryReservations()[0].status, "Списан");
  assert.equal(storage.getStoredInventoryMovements()[0].type, "Списание");
});
