import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  CRITICAL_OPERATION_FEEDBACK_EVENT,
  publishCriticalOperationFeedback,
  type CriticalOperationFeedback,
} from "../src/lib/data/critical-operation-feedback";

test("сообщение критической операции отправляется на уровень выше обновляемой карточки", () => {
  let received: CriticalOperationFeedback | undefined;
  const originalWindow = globalThis.window;
  const originalCustomEvent = globalThis.CustomEvent;

  class TestCustomEvent<T> extends Event {
    detail: T;

    constructor(type: string, init: CustomEventInit<T>) {
      super(type);
      this.detail = init.detail as T;
    }
  }

  const target = new EventTarget();
  target.addEventListener(CRITICAL_OPERATION_FEEDBACK_EVENT, (event) => {
    received = (event as CustomEvent<CriticalOperationFeedback>).detail;
  });
  Object.defineProperty(globalThis, "window", { value: target, configurable: true });
  Object.defineProperty(globalThis, "CustomEvent", { value: TestCustomEvent, configurable: true });

  try {
    publishCriticalOperationFeedback("Заказ уже полностью оплачен", "error");
    assert.deepEqual(received, {
      message: "Заказ уже полностью оплачен",
      type: "error",
    });
  } finally {
    Object.defineProperty(globalThis, "window", { value: originalWindow, configurable: true });
    Object.defineProperty(globalThis, "CustomEvent", { value: originalCustomEvent, configurable: true });
  }
});

test("хост сообщения не пересоздается вместе с синхронизируемым содержимым", () => {
  const provider = readFileSync("src/components/cloud-data-provider.tsx", "utf8");
  const refreshedContent = provider.indexOf("<Fragment key={contentVersion}>{children}</Fragment>");
  const feedbackHost = provider.indexOf("{criticalFeedback && (", refreshedContent);

  assert.ok(refreshedContent >= 0);
  assert.ok(feedbackHost > refreshedContent);
});
