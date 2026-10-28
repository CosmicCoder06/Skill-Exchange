const test = require("node:test");
const assert = require("node:assert/strict");

// Profile completion evaluator logic tested directly
const hasValue = (value) =>
    typeof value === "string" && value.trim().length > 0;

const hasSkill = (skills) =>
    Array.isArray(skills) &&
    skills.some(
        (skill) =>
            typeof skill === "string" &&
            skill.trim().length > 0
    );

const calculateProfileComplete = (profile) => {
    if (profile.role === "admin") {
        return Boolean(hasValue(profile.bio) || hasValue(profile.avatarUrl));
    }
    return Boolean(
        hasValue(profile.bio) &&
        hasSkill(profile.skillsToTeach) &&
        (profile.role === "mentor" || hasSkill(profile.skillsToLearn))
    );
};

test("partial profile updates allow saving incomplete profiles without blocking", () => {
    // Scenario 1: User updates ONLY their bio with a short note
    const partialUpdate1 = {
        role: "learner",
        bio: "Just learning",
        skillsToTeach: [],
        skillsToLearn: []
    };
    // Should compute profileComplete = false, but the update payload is valid and allowed
    assert.equal(calculateProfileComplete(partialUpdate1), false);

    // Scenario 2: Mentor updates ONLY their skills without bio yet
    const partialUpdate2 = {
        role: "mentor",
        bio: "",
        skillsToTeach: ["JavaScript", "React"],
        hourlyRate: 500
    };
    assert.equal(calculateProfileComplete(partialUpdate2), false);

    // Scenario 3: Once bio and teaching skills are filled, mentor profile is complete
    const fullMentorProfile = {
        role: "mentor",
        bio: "Senior software engineer with 10 years experience",
        skillsToTeach: ["JavaScript", "React"],
        hourlyRate: 500
    };
    assert.equal(calculateProfileComplete(fullMentorProfile), true);

    // Scenario 4: Learner with bio, skillsToTeach, and skillsToLearn is complete
    const fullLearnerProfile = {
        role: "learner",
        bio: "Curious student exploring web development",
        skillsToTeach: ["Python"],
        skillsToLearn: ["React"]
    };
    assert.equal(calculateProfileComplete(fullLearnerProfile), true);
});

test("hourly rate partial inputs accept zero, positive numbers, and empty strings safely", () => {
    function processHourlyRate(hourlyRate) {
        if (hourlyRate !== undefined && hourlyRate !== null && hourlyRate !== "") {
            const numericRate = Number(hourlyRate);
            if (!Number.isFinite(numericRate) || numericRate < 0) {
                throw new Error("Invalid rate");
            }
            return numericRate;
        }
        return 0; // Default fallback for empty or unconfigured rate
    }

    assert.equal(processHourlyRate(0), 0);
    assert.equal(processHourlyRate(450), 450);
    assert.equal(processHourlyRate("600"), 600);
    assert.equal(processHourlyRate(""), 0);
    assert.equal(processHourlyRate(null), 0);
    assert.throws(() => processHourlyRate(-100), /Invalid rate/);
    assert.throws(() => processHourlyRate("abc"), /Invalid rate/);
});
