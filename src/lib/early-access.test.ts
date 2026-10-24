import { test } from "node:test";
import assert from "node:assert/strict";
import { checkSignup } from "./early-access.ts";

const good = { name: " Maya ", email: "Maya@Example.com", phone: "+1 555 010 0000", invests: ["Stocks", "Hacks"], consent: true, website: "" };

test("accepts a complete signup and tidies it", () => {
  const r = checkSignup(good, new Date("2026-10-24T00:00:00Z"));
  assert.equal(r.kind, "ok");
  if (r.kind !== "ok") return;
  assert.equal(r.signup.name, "Maya");
  assert.equal(r.signup.email, "maya@example.com");
  assert.deepEqual(r.signup.invests, ["Stocks"]);
  assert.equal(r.signup.signedUpAt, "2026-10-24T00:00:00.000Z");
});

test("phone is optional", () => {
  assert.equal(checkSignup({ ...good, phone: "" }).kind, "ok");
});

test("rejects a bad email, a bad phone and missing consent", () => {
  assert.deepEqual(checkSignup({ ...good, email: "nope" }), { kind: "invalid", error: "That email doesn't look right." });
  assert.deepEqual(checkSignup({ ...good, phone: "12" }), { kind: "invalid", error: "That phone number doesn't look right." });
  assert.deepEqual(checkSignup({ ...good, consent: false }), { kind: "invalid", error: "Consent is required." });
});

test("treats a filled trap field as spam", () => {
  assert.deepEqual(checkSignup({ ...good, website: "http://spam.example" }), { kind: "spam" });
});
