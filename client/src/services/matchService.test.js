import test from "node:test";
import assert from "node:assert/strict";
import { fetchMatches } from "./matchService.js";

test("fetchMatches formats query params and authorization headers correctly", async () => {
  let capturedUrl = "";
  let capturedHeaders = {};

  const mockRequest = async (url, options) => {
    capturedUrl = url;
    capturedHeaders = options.headers;
    return {
      ok: true,
      status: 200,
      json: async () => ({
        matches: [{ mentor: { id: "m1", name: "Alice" }, matchScore: 95 }],
        isAiEnhanced: true,
        total: 1
      })
    };
  };

  const data = await fetchMatches({
    api: "https://example.com/api",
    token: "test_token_xyz",
    skill: "React",
    minRating: 4.5,
    maxPrice: 600,
    timing: "Weekends",
    refresh: true,
    request: mockRequest
  });

  assert.equal(capturedHeaders.Authorization, "Bearer test_token_xyz");
  assert.ok(capturedUrl.includes("skill=React"));
  assert.ok(capturedUrl.includes("minRating=4.5"));
  assert.ok(capturedUrl.includes("maxPrice=600"));
  assert.ok(capturedUrl.includes("timing=Weekends"));
  assert.ok(capturedUrl.includes("refresh=true"));
  assert.equal(data.matches.length, 1);
  assert.equal(data.isAiEnhanced, true);
});

test("fetchMatches throws helpful error on rate limit 429", async () => {
  const mockRequest = async () => ({
    ok: false,
    status: 429,
    json: async () => ({ message: "Too many matching requests. Please wait a moment." })
  });

  await assert.rejects(
    fetchMatches({ token: "tok", request: mockRequest }),
    /Too many matching requests/
  );
});
