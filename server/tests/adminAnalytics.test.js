const test = require("node:test");
const assert = require("node:assert/strict");
const { escapeRegex, fillDailySeries } = require("../Utils/adminAnalytics");

test("escapeRegex makes user search safe", () => {
  assert.equal(escapeRegex("a+b@example.com"), "a\\+b@example\\.com");
});

test("fillDailySeries includes zero-value dates", () => {
  const now = new Date("2026-08-17T12:00:00.000Z");
  const result = fillDailySeries([{ _id: "2026-08-16", total: 4 }], 3, now);
  assert.deepEqual(result, [
    { date: "2026-08-15", total: 0 },
    { date: "2026-08-16", total: 4 },
    { date: "2026-08-17", total: 0 },
  ]);
});
