import assert from "node:assert/strict";
import test from "node:test";
import { registerCloudRefreshTriggers } from "../src/lib/data/cloud-refresh-triggers";

class FakeTarget {
  visibilityState = "visible";
  private listeners = new Map<string, Set<() => void>>();

  addEventListener(type: string, listener: () => void) {
    const listeners = this.listeners.get(type) ?? new Set();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type: string, listener: () => void) {
    this.listeners.get(type)?.delete(listener);
  }

  dispatch(type: string) {
    this.listeners.get(type)?.forEach((listener) => listener());
  }
}

test("refreshes cloud data when the employee returns to the browser", () => {
  const windowTarget = new FakeTarget();
  const documentTarget = new FakeTarget();
  let refreshes = 0;
  const cleanup = registerCloudRefreshTriggers({
    windowTarget,
    documentTarget,
    refresh: () => { refreshes += 1; },
  });

  windowTarget.dispatch("focus");
  windowTarget.dispatch("pageshow");
  windowTarget.dispatch("online");
  documentTarget.dispatch("visibilitychange");
  assert.equal(refreshes, 4);

  documentTarget.visibilityState = "hidden";
  documentTarget.dispatch("visibilitychange");
  assert.equal(refreshes, 4);

  cleanup();
  windowTarget.dispatch("focus");
  assert.equal(refreshes, 4);
});
