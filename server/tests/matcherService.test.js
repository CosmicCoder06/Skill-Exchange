const test = require("node:test");
const assert = require("node:assert/strict");
const {
  normalizeSkill,
  parseSkills,
  normalizeAvailability,
  compareAvailability,
  extractTokens,
  computeTextOverlap,
  scoreCandidate
} = require("../services/matcherService");

test("skill normalizer handles case, symbols, and canonical synonyms", () => {
  assert.equal(normalizeSkill("  JS  "), "javascript");
  assert.equal(normalizeSkill("ReactJS"), "react");
  assert.equal(normalizeSkill("React.js"), "react");
  assert.equal(normalizeSkill("Node.js"), "nodejs");
  assert.equal(normalizeSkill("TS"), "typescript");
  assert.equal(normalizeSkill("C++"), "c++");
  assert.equal(normalizeSkill("C#"), "c#");
  assert.equal(normalizeSkill("golang"), "golang");
  assert.equal(normalizeSkill("DSA"), "data structures & algorithms");
  assert.equal(normalizeSkill("Data Structures & DAA"), "data structures & algorithms");
});

test("parseSkills handles arrays and messy multi-delimiter string inputs", () => {
  const result = parseSkills("React, Node.js / TypeScript ; Python\nDocker, AWS");
  assert.deepEqual(result.sort(), [
    "aws",
    "docker",
    "nodejs",
    "python",
    "react",
    "typescript"
  ].sort());
});

test("availability normalizer extracts weekends, weekdays, evenings, and days from messy strings", () => {
  const weekend = normalizeAvailability("Available on weekends, Sat-Sun 6pm to 9pm");
  assert.ok(weekend.tags.has("weekends"));
  assert.ok(weekend.tags.has("evenings"));
  assert.ok(weekend.tags.has("saturday") || weekend.tags.has("sunday") || weekend.tags.has("weekends"));

  const weekday = normalizeAvailability(["Mon-Fri 7pm-10pm"]);
  assert.ok(weekday.tags.has("weekdays"));
  assert.ok(weekday.tags.has("evenings"));

  const morning = normalizeAvailability("Tuesday mornings 9am-12pm");
  assert.ok(morning.tags.has("mornings"));
  assert.ok(morning.tags.has("tuesday"));
});

test("compareAvailability calculates overlap between learner and mentor", () => {
  const overlap = compareAvailability("Weekends", "Saturday and Sunday mornings");
  assert.equal(overlap.hasOverlap, true);
  assert.ok(overlap.score >= 0.7);

  const noOverlap = compareAvailability("Weekdays 9am", "Weekends only");
  assert.equal(noOverlap.hasOverlap, false);

  const anyChoice = compareAvailability(null, "Mon-Fri", "Any");
  assert.equal(anyChoice.hasOverlap, true);
  assert.equal(anyChoice.score, 1.0);
});

test("computeTextOverlap filters stop words and computes meaningful token overlap", () => {
  const overlap = computeTextOverlap(
    "I want to learn React, building frontend modern dashboards",
    "Experienced mentor teaching React and frontend web architectures"
  );
  assert.ok(overlap > 0.3);

  const unrelated = computeTextOverlap(
    "Want to learn cooking Italian pasta",
    "Teaching Kubernetes and cloud architecture"
  );
  assert.ok(unrelated <= 0.2);
});

test("scoreCandidate gives higher score to matching skills and quality without fake 4.5 rating", () => {
  const learnerSkills = ["react", "nodejs"];
  const strongMentor = {
    _id: "m1",
    name: "Alex",
    skillsToTeach: ["React", "Node.js", "Docker"],
    bio: "Full stack web developer specialized in React and Node.js",
    availability: ["Weekends", "Evenings"],
    hourlyRate: 500,
    isVerified: true
  };

  const scoredStrong = scoreCandidate({
    mentor: strongMentor,
    learnerSkills,
    learnerBio: "Looking to master React and build backend APIs with Node",
    learnerAvail: "Weekends",
    learnerBudget: 600,
    reviewStats: { averageRating: 4.9, reviewCount: 8 },
    completedSessions: 5
  });

  assert.ok(scoredStrong.matchScore >= 80);
  assert.equal(scoredStrong.avgRating, 4.9);
  assert.equal(scoredStrong.reviewCount, 8);
  assert.equal(scoredStrong.completedSessions, 5);
  assert.ok(scoredStrong.matchedSkills.length >= 2);

  // New mentor with zero reviews gets neutral score and null avgRating (shows 'New')
  const newMentor = {
    _id: "m2",
    name: "Sam",
    skillsToTeach: ["React"],
    bio: "Junior developer",
    availability: ["Weekends"],
    hourlyRate: 300,
    isVerified: false
  };

  const scoredNew = scoreCandidate({
    mentor: newMentor,
    learnerSkills,
    learnerBio: "Looking to learn React",
    learnerAvail: "Weekends",
    learnerBudget: 600,
    reviewStats: { averageRating: 0, reviewCount: 0 },
    completedSessions: 0
  });

  assert.equal(scoredNew.avgRating, null);
  assert.equal(scoredNew.reviewCount, 0);
  assert.ok(scoredNew.matchScore > 40);
  assert.ok(scoredNew.matchScore < scoredStrong.matchScore);
});
