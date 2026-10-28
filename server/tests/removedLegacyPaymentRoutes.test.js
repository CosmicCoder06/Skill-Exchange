const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const http = require("http");
const jwt = require("jsonwebtoken");

test("removed legacy payment routes return 404 Not Found", async () => {
  process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "testsecret1234567890";
  const adminToken = jwt.sign(
    { id: "admin123", role: "admin" },
    process.env.JWT_ACCESS_SECRET
  );

  const app = express();
  app.use(express.json());

  // Mount existing routers
  app.use("/api", require("../routes/bookingRoutes"));
  app.use("/api", require("../routes/paymentRoutes"));
  app.use("/api", require("../routes/adminRoutes"));

  // Start test server on dynamic port
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api`;

  try {
    // 1. GET /api/bookings/:id/payment-qr -> 404
    const qrRes = await fetch(`${baseUrl}/bookings/dummy-id-123/payment-qr`, {
      headers: { Connection: "close" }
    });
    assert.equal(qrRes.status, 404, "GET /api/bookings/:id/payment-qr must return 404");

    // 2. POST /api/bookings/:id/submit-payment -> 404
    const submitRes = await fetch(`${baseUrl}/bookings/dummy-id-123/submit-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Connection: "close" },
      body: JSON.stringify({ utr: "123456789012" })
    });
    assert.equal(submitRes.status, 404, "POST /api/bookings/:id/submit-payment must return 404");

    // 3. GET /api/bookings/:id/payment-proof -> 404
    const proofRes = await fetch(`${baseUrl}/bookings/dummy-id-123/payment-proof`, {
      headers: { Connection: "close" }
    });
    assert.equal(proofRes.status, 404, "GET /api/bookings/:id/payment-proof must return 404");

    // 4. GET /api/payment-settings -> 404
    const settingsRes = await fetch(`${baseUrl}/payment-settings`, {
      headers: { Connection: "close" }
    });
    assert.equal(settingsRes.status, 404, "GET /api/payment-settings must return 404");

    // 5. GET /api/admin/payments/pending -> 404 (with admin auth token)
    const pendingRes = await fetch(`${baseUrl}/admin/payments/pending`, {
      headers: { Authorization: `Bearer ${adminToken}`, Connection: "close" }
    });
    assert.equal(pendingRes.status, 404, "GET /api/admin/payments/pending must return 404");

    // 6. POST /api/admin/payments/:id/verify -> 404 (with admin auth token)
    const verifyRes = await fetch(`${baseUrl}/admin/payments/dummy-id-123/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
        Connection: "close"
      },
      body: JSON.stringify({ approve: true })
    });
    assert.equal(verifyRes.status, 404, "POST /api/admin/payments/:id/verify must return 404");
  } finally {
    if (typeof server.closeAllConnections === "function") {
      server.closeAllConnections();
    }
    await new Promise((resolve) => server.close(resolve));
  }
});
