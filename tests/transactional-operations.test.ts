import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  executeServerOperation,
  shouldUseLocalCriticalFallback,
} from "../src/lib/data/critical-operations";

const migration = readFileSync("supabase/transactional-payments-inventory.sql", "utf8");
const criticalOperations = readFileSync("src/lib/data/critical-operations.ts", "utf8");
const orderStorage = readFileSync("src/lib/order/storage.ts", "utf8");

test("критические операции выполняются серверными функциями с блокировками", () => {
  for (const functionName of [
    "add_order_payment",
    "receive_inventory",
    "reserve_inventory_for_order",
    "write_off_inventory_reservation",
    "cancel_inventory_reservation",
  ]) {
    assert.match(migration, new RegExp(`function public\\.${functionName}\\(`));
    assert.match(criticalOperations, new RegExp(`"${functionName}"`));
  }

  assert.ok((migration.match(/for update;/g) ?? []).length >= 5);
  assert.match(migration, /operation_id uuid not null unique/);
  assert.match(migration, /where id = auth\.uid\(\) and active/);
  assert.match(migration, /security definer/g);
});

test("платежи и склад нельзя менять напрямую из клиентской роли", () => {
  assert.match(
    migration,
    /revoke insert, update, delete on table[\s\S]*public\.payments[\s\S]*public\.inventory_movements[\s\S]*from authenticated;/,
  );
  assert.doesNotMatch(orderStorage, /addStoredPayment\(/);
  assert.doesNotMatch(orderStorage, /saveStoredPayments\(/);
});

test("аудит хранит сотрудника, время и состояния до и после операции", () => {
  assert.match(migration, /create table if not exists public\.staff_action_log/);
  assert.match(migration, /staff_id uuid not null references public\.staff_profiles/);
  assert.match(migration, /before_state jsonb not null/);
  assert.match(migration, /after_state jsonb not null/);
  assert.match(migration, /created_at timestamptz not null default now\(\)/);
  assert.doesNotMatch(criticalOperations, /service.?role/i);
});

test("настроенный Supabase никогда не переключает критическую операцию на локальное сохранение", () => {
  assert.equal(shouldUseLocalCriticalFallback(true), false);
  assert.equal(shouldUseLocalCriticalFallback(false), true);
  assert.doesNotMatch(criticalOperations, /isCloudSyncEnabled/);
});

test("после серверного конфликта локальный кеш перечитывается до показа результата", async () => {
  const sequence: string[] = [];
  const response = await executeServerOperation(
    async () => {
      sequence.push("rpc");
      return { data: null, error: { message: "Заказ уже полностью оплачен" } };
    },
    async () => {
      sequence.push("refresh");
    },
  );

  sequence.push("result");
  assert.deepEqual(sequence, ["rpc", "refresh", "result"]);
  assert.equal(response.error?.message, "Заказ уже полностью оплачен");
});

test("платеж и резерв передают Supabase внутренний ключ заказа, а не отображаемый номер", () => {
  assert.match(criticalOperations, /const orderId = resolveOrderRecordId\(input\.orderId, getStoredOrders\(\)\)/);
  assert.equal((criticalOperations.match(/p_order_id: orderId/g) ?? []).length, 2);
});
