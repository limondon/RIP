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
}

test("создает документ по заказу и пишет событие", async () => {
  setupStorage();
  const storage = await import("../src/lib/storage");

  const result = storage.addStoredDocumentForOrder({ orderId: "zk-2026-0128", type: "Договор", date: "2026-07-06" });

  assert.equal(result.ok, true);
  assert.equal(result.document.type, "Договор");
  assert.equal(result.document.orderId, "zk-2026-0128");
  assert.match(result.document.number, /^DOG-2026-\d{4}$/);
  assert.equal(storage.getStoredDocumentsByOrderId("zk-2026-0128")[0].number, result.document.number);
  assert.equal(storage.getStoredEventsByOrderId("zk-2026-0128")[0].type, "document");
});
