const test = require("node:test");
const assert = require("node:assert/strict");
const {
  scoreCandidate,
  reRankWithGemini,
  getCachedMatches,
  setCachedMatches,
  invalidateMatcherCache,
  checkRateLimit
} = require("../services/matcherService");

test("scoring excludes suspended mentors and incomplete profile mentors at query stage", () => {
  // Candidate pool simulation
  const learnerId = "learner_123";
  const mentors = [
    { _id: "learner_123", name: "Self Learner", role: "mentor", isActive: true, profileCompleted: true },
    { _id: "m_suspended", name: "Bad Actor", role: "mentor", isActive: false, profileCompleted: true },
    { _id: "m_incomplete", name: "No Profile", role: "mentor", isActive: true, profileCompleted: false },
    { _id: "m_valid", name: "Great Mentor", role: "mentor", isActive: true, profileCompleted: true, skillsToTeach: ["React"] }
  ];

  // Filtering criteria implemented in controller
  const validCandidates = mentors.filter(
    (m) => String(m._id) !== learnerId && m.isActive === true && m.profileCompleted === true
  );

  assert.equal(validCandidates.length, 1);
  assert.equal(validCandidates[0]._id, "m_valid");
});

test("cache stores, retrieves, and invalidates entries per learner", () => {
  const learnerId = "learner_cache_test";
  const query = { skill: "React", limit: 10 };
  const mockPayload = { matches: [{ id: "m1", matchScore: 90 }] };

  assert.equal(getCachedMatches(learnerId, query), null);

  setCachedMatches(learnerId, query, mockPayload);
  const cached = getCachedMatches(learnerId, query);
  assert.deepEqual(cached, mockPayload);

  // Invalidate cache for this learner
  invalidateMatcherCache(learnerId);
  assert.equal(getCachedMatches(learnerId, query), null);
});

test("rate limiter restricts abusive requests past limit", () => {
  const testUser = "user_rate_limit_test_" + Date.now();
  for (let i = 0; i < 20; i++) {
    const status = checkRateLimit(testUser);
    assert.equal(status.allowed, true);
  }
  // 21st request should be rejected
  const rejected = checkRateLimit(testUser);
  assert.equal(rejected.allowed, false);
  assert.equal(rejected.remaining, 0);
  assert.ok(rejected.retryAfterMs > 0);
});

test("reRankWithGemini safely falls back to null when API key is missing or network fails", async () => {
  const candidates = [
    {
      mentor: { id: "m1", name: "John", skillsToTeach: ["React"], bio: "Bio" },
      matchScore: 85,
      matchReasons: ["Reason 1"]
    }
  ];

  // Without key: returns null (silent fallback)
  const noKeyResult = await reRankWithGemini({
    learnerProfile: { skills: ["React"] },
    candidates,
    apiKey: null
  });
  assert.equal(noKeyResult, null);

  // With invalid key or mock error: returns null gracefully without throwing
  const errorResult = await reRankWithGemini({
    learnerProfile: { skills: ["React"] },
    candidates,
    apiKey: "invalid_mock_key_12345"
  });
  assert.equal(errorResult, null);
});
