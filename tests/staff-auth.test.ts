import test from "node:test";
import assert from "node:assert/strict";
import { findStaffByCredentials, findStaffById, staffMembers } from "../src/lib/auth/staff";

test("находит активного сотрудника по email и паролю", () => {
  const member = staffMembers[0];
  assert.equal(findStaffByCredentials(member.email.toUpperCase(), member.password)?.id, member.id);
  assert.equal(findStaffById(member.id)?.email, member.email);
});

test("не пускает сотрудника с неверным паролем", () => {
  const member = staffMembers[0];
  assert.equal(findStaffByCredentials(member.email, "wrong-password"), null);
});
