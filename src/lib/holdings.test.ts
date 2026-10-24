import { test } from "node:test";
import assert from "node:assert/strict";
import { checkHolding, summarize, STYLE_FOR, ASSET_CLASSES, type HoldingInput } from "./holdings.ts";

const good = { name: " Apple ", symbol: "aapl", assetClass: "Stocks", quantity: "10", unitCost: "$150.25", unitPrice: "182.50" };

test("accepts a holding and tidies it", () => {
  const r = checkHolding(good);
  assert.deepEqual(r, {
    kind: "ok",
    value: { name: "Apple", symbol: "AAPL", assetClass: "Stocks", quantity: 10, unitCost: 150.25, unitPrice: 182.5 },
  });
});

test("price now defaults to what was paid, and the ticker is optional", () => {
  const r = checkHolding({ ...good, symbol: "", unitPrice: "" });
  assert.equal(r.kind, "ok");
  if (r.kind === "ok") {
    assert.equal(r.value.unitPrice, 150.25);
    assert.equal(r.value.symbol, null);
  }
});

test("rejects missing names, unknown kinds and bad numbers", () => {
  assert.equal(checkHolding({ ...good, name: " " }).kind, "invalid");
  assert.equal(checkHolding({ ...good, assetClass: "Beanie Babies" }).kind, "invalid");
  assert.equal(checkHolding({ ...good, quantity: "0" }).kind, "invalid");
  assert.equal(checkHolding({ ...good, quantity: "-3" }).kind, "invalid");
  assert.equal(checkHolding({ ...good, quantity: "ten" }).kind, "invalid");
  assert.equal(checkHolding({ ...good, unitCost: "" }).kind, "invalid");
  assert.equal(checkHolding({ ...good, unitPrice: "1e9" }).kind, "invalid");
  assert.equal(checkHolding({ ...good, symbol: "AA PL" }).kind, "invalid");
});

test("summarizes value, gain, mix and goal progress", () => {
  const hs: HoldingInput[] = [
    { name: "Apple", symbol: "AAPL", assetClass: "Stocks", quantity: 10, unitCost: 100, unitPrice: 150 },
    { name: "Fund", symbol: null, assetClass: "Funds and ETFs", quantity: 1, unitCost: 3000, unitPrice: 2500 },
  ];
  const s = summarize(hs, 8000);
  assert.equal(s.value, 4000);
  assert.equal(s.cost, 4000);
  assert.equal(s.gain, 0);
  assert.equal(s.gainPct, 0);
  assert.deepEqual(s.byClass.map((c) => [c.assetClass, c.share]), [["Funds and ETFs", 0.625], ["Stocks", 0.375]]);
  assert.equal(s.goalPct, 50);
  assert.equal(summarize(hs, 1000).goalPct, 100);
  assert.equal(summarize(hs, null).goalPct, null);
});

test("an empty kingdom sums to zero", () => {
  assert.deepEqual(summarize([], 1000), { value: 0, cost: 0, gain: 0, gainPct: null, byClass: [], goalPct: 0 });
});

test("every kind of holding has a building", () => {
  for (const c of ASSET_CLASSES) assert.ok(STYLE_FOR[c]);
});
