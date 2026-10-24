import { test } from "node:test";
import assert from "node:assert/strict";
import { can, checkInvite, checkPlan, isPlanId } from "./plans.ts";

const now = new Date("2026-10-24T12:00:00Z");
const good = { name: "  Family retirement ", kind: "Family", currency: "USD", goalAmount: "1,200,000", goalDate: "2045-06-01" };

test("accepts a complete plan and tidies it", () => {
  assert.deepEqual(checkPlan(good, now), {
    kind: "ok",
    value: { name: "Family retirement", kind: "Family", currency: "USD", goalAmount: 1200000, goalDate: "2045-06-01" },
  });
});

test("goal amount and date are optional", () => {
  const r = checkPlan({ ...good, goalAmount: "", goalDate: "" }, now);
  assert.equal(r.kind, "ok");
  if (r.kind === "ok") assert.equal(r.value.goalAmount, null);
});

test("rejects missing names, unknown kinds and bad goals", () => {
  assert.equal(checkPlan({ ...good, name: "  " }, now).kind, "invalid");
  assert.equal(checkPlan({ ...good, kind: "Lottery" }, now).kind, "invalid");
  assert.equal(checkPlan({ ...good, currency: "XYZ" }, now).kind, "invalid");
  assert.equal(checkPlan({ ...good, goalAmount: "-5" }, now).kind, "invalid");
  assert.equal(checkPlan({ ...good, goalAmount: "lots" }, now).kind, "invalid");
  assert.equal(checkPlan({ ...good, goalDate: "2026-02-30" }, now).kind, "invalid");
  assert.equal(checkPlan({ ...good, goalDate: "2026-10-24" }, now).kind, "invalid");
  assert.equal(checkPlan({ ...good, goalDate: "2200-01-01" }, now).kind, "invalid");
});

test("invites need a real email, a role, and someone other than you", () => {
  assert.deepEqual(checkInvite({ email: " Sam@Example.com ", role: "viewer" }, "me@example.com"), {
    kind: "ok",
    value: { email: "sam@example.com", role: "viewer" },
  });
  assert.equal(checkInvite({ email: "nope", role: "viewer" }, "me@example.com").kind, "invalid");
  assert.equal(checkInvite({ email: "sam@example.com", role: "owner" }, "me@example.com").kind, "invalid");
  assert.equal(checkInvite({ email: "ME@example.com", role: "editor" }, "me@example.com").kind, "invalid");
});

test("roles: viewers see, editors edit, owners manage", () => {
  assert.deepEqual([can("viewer", "view"), can("viewer", "edit"), can("viewer", "manage")], [true, false, false]);
  assert.deepEqual([can("editor", "edit"), can("editor", "manage")], [true, false]);
  assert.equal(can("owner", "manage"), true);
});

test("plan ids must be uuids", () => {
  assert.equal(isPlanId("2f1c3a5e-8b2d-4c11-9a77-0e6c3d9b1f20"), true);
  assert.equal(isPlanId("1 or 1=1"), false);
});
