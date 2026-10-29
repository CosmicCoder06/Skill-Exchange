const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const http = require("http");
const jwt = require("jsonwebtoken");

test("unauthenticated requests to user update and chat message edit/delete return 401", async () => {
    process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "testsecret1234567890";

    const app = express();
    app.use(express.json());

    // Mount userUpdateRoute and chatRoutes
    app.use("/api", require("../Backend Configuration/Routes/User Updation Route/userUpdateRoute"));
    app.use("/api", require("../routes/chatRoutes"));

    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}/api`;

    try {
        // Fix 1: PUT /api/user/update/:id without token -> 401
        const updateRes = await fetch(`${baseUrl}/user/update/user-123`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Connection: "close" },
            body: JSON.stringify({ name: "Updated Name" })
        });
        assert.equal(updateRes.status, 401, "PUT /api/user/update/:id without token must return 401");

        // Fix 2: PATCH /api/messages/:id without token -> 401
        const patchRes = await fetch(`${baseUrl}/messages/msg-123`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Connection: "close" },
            body: JSON.stringify({ content: "New content" })
        });
        assert.equal(patchRes.status, 401, "PATCH /api/messages/:id without token must return 401");

        // Fix 2: DELETE /api/messages/:id without token -> 401
        const deleteRes = await fetch(`${baseUrl}/messages/msg-123`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json", Connection: "close" },
            body: JSON.stringify({ mode: "everyone" })
        });
        assert.equal(deleteRes.status, 401, "DELETE /api/messages/:id without token must return 401");

        // Fix 1 Authorization check: Authenticated user attempting to update someone else -> 403
        const userAToken = jwt.sign(
            { id: "userA", role: "learner" },
            process.env.JWT_ACCESS_SECRET
        );
        const forbiddenRes = await fetch(`${baseUrl}/user/update/userB`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${userAToken}`,
                Connection: "close"
            },
            body: JSON.stringify({ name: "Hacked Name" })
        });
        assert.equal(forbiddenRes.status, 403, "PUT /api/user/update/:id by different non-admin user must return 403");

    } finally {
        if (typeof server.closeAllConnections === "function") {
            server.closeAllConnections();
        }
        await new Promise((resolve) => server.close(resolve));
    }
});
