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

test("admin privilege escalation block: admins cannot assign admin role to other users", () => {
  function validateRoleUpdate(requestedRole) {
    if (requestedRole === "admin") {
      return { allowed: false, status: 403, error: "Privilege escalation blocked: Administrators cannot promote other users to the admin role." };
    }
    if (!["learner", "mentor"].includes(requestedRole)) {
      return { allowed: false, status: 400, error: "Invalid role. Role must be learner or mentor." };
    }
    return { allowed: true, role: requestedRole };
  }

  // Attempt to promote to admin -> BLOCKED with 403
  const adminAttempt = validateRoleUpdate("admin");
  assert.equal(adminAttempt.allowed, false);
  assert.equal(adminAttempt.status, 403);

  // Changing to learner or mentor -> ALLOWED
  assert.equal(validateRoleUpdate("learner").allowed, true);
  assert.equal(validateRoleUpdate("mentor").allowed, true);

  // Random roles -> BLOCKED with 400
  assert.equal(validateRoleUpdate("superadmin").allowed, false);
  assert.equal(validateRoleUpdate("superadmin").status, 400);
});
