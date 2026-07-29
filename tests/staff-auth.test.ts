import test from "node:test";
import assert from "node:assert/strict";
import { toStaffMember } from "../src/lib/auth/staff";

test("создает профиль сотрудника из данных Supabase", () => {
  const member = toStaffMember({ id: "staff-1", name: "Мария Иванова", email: "maria@example.com" });
  assert.equal(member.id, "staff-1");
  assert.equal(member.shortName, "МИ");
  assert.equal(member.active, true);
});

test("использует email как имя, если имя не задано", () => {
  const member = toStaffMember({ id: "staff-2", email: "manager@example.com" });
  assert.equal(member.name, "manager");
  assert.equal(member.shortName, "M");
});
