const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const http = require("http");
const compression = require("compression");
const { sanitizeUserMedia } = require("../Utils/mediaUrlHelper");

test("sanitizeUserMedia replaces data URI with cached avatar endpoint URL", () => {
  const user = {
    _id: "6aaac3d8b1dc0bda450f164e",
    name: "Demo-Mentor-1",
    avatarUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    coverImageUrl: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/",
    role: "mentor"
  };

  const sanitized = sanitizeUserMedia(user);
  assert.equal(sanitized.avatarUrl, "/api/users/6aaac3d8b1dc0bda450f164e/avatar");
  assert.equal(sanitized.coverImageUrl, "/api/users/6aaac3d8b1dc0bda450f164e/cover");
  assert.equal(sanitized.name, "Demo-Mentor-1");
});

test("sanitizeUserMedia preserves normal external URLs as-is", () => {
  const user = {
    _id: "6aaac3d8b1dc0bda450f164e",
    name: "Demo-Mentor-1",
    avatarUrl: "https://example.com/avatar.png",
    coverImageUrl: "https://example.com/cover.jpg",
    role: "mentor"
  };

  const sanitized = sanitizeUserMedia(user);
  assert.equal(sanitized.avatarUrl, "https://example.com/avatar.png");
  assert.equal(sanitized.coverImageUrl, "https://example.com/cover.jpg");
});

test("compression middleware compresses responses exceeding threshold", async () => {
  const app = express();
  app.use(compression({ threshold: 100 }));
  app.get("/test-large", (req, res) => {
    res.json({ data: "A".repeat(5000) });
  });

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  try {
    const res = await fetch(`http://127.0.0.1:${port}/test-large`, {
      headers: { "Accept-Encoding": "gzip", Connection: "close" }
    });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("content-encoding"), "gzip");
  } finally {
    if (server.closeAllConnections) server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});
