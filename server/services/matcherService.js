/**
 * Matcher Service for Skill Exchange
 * Provides deterministic multi-factor scoring (skills, bio/goal, availability, quality, budget/level)
 * and an optional Gemini LLM re-ranking & explanation layer.
 */

const crypto = require("crypto");

// ---------------------------------------------------------------------------
// 1. Scoring Weights Configuration
// ---------------------------------------------------------------------------
const MATCH_WEIGHTS = {
  skills: 40,
  goalSemantic: 20,
  availability: 15,
  quality: 15,
  budgetAndLevel: 10
};

// ---------------------------------------------------------------------------
// 2. Skill Synonyms & Canonical Mapping
// ---------------------------------------------------------------------------
const SKILL_SYNONYMS = {
  js: "javascript",
  javascript: "javascript",
  ts: "typescript",
  typescript: "typescript",
  react: "react",
  reactjs: "react",
  "react.js": "react",
  node: "nodejs",
  nodejs: "nodejs",
  "node.js": "nodejs",
  py: "python",
  python: "python",
  ml: "machine learning",
  "machine learning": "machine learning",
  ai: "artificial intelligence",
  "artificial intelligence": "artificial intelligence",
  cpp: "c++",
  "c++": "c++",
  cplusplus: "c++",
  csharp: "c#",
  "c#": "c#",
  cs: "c#",
  go: "golang",
  golang: "golang",
  mongo: "mongodb",
  mongodb: "mongodb",
  postgres: "postgresql",
  postgresql: "postgresql",
  sql: "sql",
  vue: "vue",
  vuejs: "vue",
  angular: "angular",
  angularjs: "angular",
  html: "html",
  html5: "html",
  css: "css",
  css3: "css",
  dsa: "data structures & algorithms",
  daa: "data structures & algorithms",
  algo: "data structures & algorithms",
  algorithms: "data structures & algorithms",
  "data structures": "data structures & algorithms",
  "data structures daa": "data structures & algorithms",
  "data structures & daa": "data structures & algorithms",
  "data structures algorithms": "data structures & algorithms",
  "data structures & algorithms": "data structures & algorithms",
  docker: "docker",
  k8s: "kubernetes",
  kubernetes: "kubernetes",
  aws: "aws",
  gcp: "gcp",
  azure: "azure",
  express: "express",
  expressjs: "express",
  "express.js": "express",
  next: "next.js",
  nextjs: "next.js",
  "next.js": "next.js"
};

/**
 * Normalizes a single skill string (lowercased, punctuation handled, mapped to synonym).
 */
function normalizeSkill(str) {
  if (!str || typeof str !== "string") return "";
  const cleaned = str
    .toLowerCase()
    .replace(/[^\p{L}\p{N}+#.]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");

  if (!cleaned) return "";
  return SKILL_SYNONYMS[cleaned] || cleaned;
}

/**
 * Parses mixed skills input (array, comma/slash separated string) into deduplicated normalized skills.
 */
function parseSkills(input) {
  if (!input) return [];
  const rawList = Array.isArray(input)
    ? input
    : String(input).split(/[,/|\n\r;]+/);

  const set = new Set();
  for (const item of rawList) {
    if (typeof item === "string") {
      const parts = item.split(/[,/|\n\r;]+/);
      for (const p of parts) {
        const norm = normalizeSkill(p);
        if (norm) set.add(norm);
      }
    }
  }
  return Array.from(set);
}

// ---------------------------------------------------------------------------
// 3. Availability Parsing & Overlap
// ---------------------------------------------------------------------------
const DAY_NAMES = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday"
];

function normalizeAvailability(avail) {
  if (!avail) return { tags: new Set(), raw: [], summary: "Flexible" };

  const rawList = Array.isArray(avail)
    ? avail.map(String)
    : String(avail).split(/[,/|\n\r;]+/);

  const combined = rawList.join(" ").toLowerCase();
  const tags = new Set();

  if (/weekend|sat|sun|saturday|sunday/.test(combined)) {
    tags.add("weekends");
  }
  if (/weekday|mon-fri|monday to friday|mon|tue|wed|thu|fri/.test(combined)) {
    tags.add("weekdays");
  }
  if (/evening|eve|night|\bpm\b|6pm|7pm|8pm|9pm|10pm/.test(combined)) {
    tags.add("evenings");
  }
  if (/morning|morn|\bam\b|8am|9am|10am|11am/.test(combined)) {
    tags.add("mornings");
  }
  if (/afternoon|noon|12pm|1pm|2pm|3pm|4pm/.test(combined)) {
    tags.add("afternoons");
  }

  for (const day of DAY_NAMES) {
    const regex = new RegExp(`\\b${day}\\b`, "i");
    if (regex.test(combined)) {
      tags.add(day);
    }
  }

  let summary = "Flexible";
  if (tags.size > 0) {
    const list = Array.from(tags).map((t) => t.charAt(0).toUpperCase() + t.slice(1));
    summary = list.slice(0, 3).join(", ");
  }

  return { tags, raw: rawList, summary };
}

function compareAvailability(learnerAvail, mentorAvail, preferredScheduleOverride) {
  // If schedule override is "Any", or learner has no preference
  const override = preferredScheduleOverride ? preferredScheduleOverride.trim().toLowerCase() : "";
  const mentorNorm = normalizeAvailability(mentorAvail);

  if (override === "any" || (!learnerAvail && !override)) {
    return {
      score: 1.0,
      overlapSummary: mentorNorm.summary ? `Available ${mentorNorm.summary}` : "Flexible schedule",
      hasOverlap: true
    };
  }

  // If learner provided an override
  let learnerNorm;
  if (override) {
    learnerNorm = normalizeAvailability(override);
  } else {
    learnerNorm = normalizeAvailability(learnerAvail);
  }

  if (learnerNorm.tags.size === 0) {
    return {
      score: 0.8,
      overlapSummary: mentorNorm.summary ? `Available ${mentorNorm.summary}` : "Open schedule",
      hasOverlap: true
    };
  }

  // Intersect tags
  const matched = [];
  for (const tag of learnerNorm.tags) {
    if (mentorNorm.tags.has(tag)) {
      matched.push(tag.charAt(0).toUpperCase() + tag.slice(1));
    }
  }

  if (matched.length > 0) {
    const score = Math.min(1.0, 0.6 + matched.length * 0.2);
    return {
      score,
      overlapSummary: `Both available: ${matched.join(", ")}`,
      hasOverlap: true
    };
  }

  // Fallback check: substring in raw text
  const mentorRaw = mentorNorm.raw.join(" ").toLowerCase();
  const learnerRaw = learnerNorm.raw.join(" ").toLowerCase();
  if (mentorRaw.includes(learnerRaw) || learnerRaw.includes(mentorRaw)) {
    return {
      score: 0.7,
      overlapSummary: "Matching schedule availability",
      hasOverlap: true
    };
  }

  return {
    score: 0.2,
    overlapSummary: mentorNorm.summary ? `Mentor available: ${mentorNorm.summary}` : "Limited slot overlap",
    hasOverlap: false
  };
}

// ---------------------------------------------------------------------------
// 4. Keyword / Bio Overlap (Token Matching)
// ---------------------------------------------------------------------------
const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "in", "on", "at", "to", "for", "of", "with",
  "is", "are", "was", "were", "be", "been", "being", "have", "has", "had",
  "do", "does", "did", "i", "my", "me", "you", "your", "we", "our", "he", "she",
  "it", "they", "them", "want", "learn", "teach", "skill", "looking", "mentor",
  "learner", "experience", "session", "exchange", "passionate", "help", "about"
]);

function extractTokens(text) {
  if (!text || typeof text !== "string") return new Set();
  const words = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .split(/\s+/);

  const tokens = new Set();
  for (const w of words) {
    if (w.length >= 3 && !STOP_WORDS.has(w)) {
      tokens.add(w);
    }
  }
  return tokens;
}

function computeTextOverlap(text1, text2) {
  const tokens1 = extractTokens(text1);
  const tokens2 = extractTokens(text2);

  if (tokens1.size === 0 || tokens2.size === 0) return 0.2; // neutral base

  let matchCount = 0;
  for (const t of tokens1) {
    if (tokens2.has(t)) matchCount++;
  }

  const overlapRatio = matchCount / Math.min(tokens1.size, 10);
  return Math.min(1.0, Math.max(0.0, overlapRatio));
}

// ---------------------------------------------------------------------------
// 5. Deterministic Candidate Scoring
// ---------------------------------------------------------------------------
/**
 * Scores a single mentor against learner criteria.
 */
function scoreCandidate({
  mentor,
  learnerSkills,
  learnerBio,
  learnerAvail,
  learnerBudget,
  preferredSchedule,
  reviewStats = {},
  completedSessions = 0,
  weights = MATCH_WEIGHTS
}) {
  const mentorSkills = parseSkills(mentor.skillsToTeach);
  const targetSkills = learnerSkills.length > 0 ? learnerSkills : [];

  // A. SKILL MATCH (Weight: 40)
  let matchedSkills = [];
  let missingSkills = [];
  let skillRatio = 0;

  if (targetSkills.length > 0) {
    for (const target of targetSkills) {
      let isMatch = false;
      for (const mSkill of mentorSkills) {
        if (mSkill === target || mSkill.includes(target) || target.includes(mSkill)) {
          isMatch = true;
          if (!matchedSkills.includes(mSkill)) matchedSkills.push(mSkill);
        }
      }
      if (!isMatch) {
        missingSkills.push(target);
      }
    }
    const exactMatches = matchedSkills.length;
    skillRatio = Math.min(1.0, exactMatches / Math.max(1, targetSkills.length));
  } else {
    // If learner has no specified skills, score based on breadth of mentor skills
    skillRatio = mentorSkills.length > 0 ? 0.6 : 0.1;
    matchedSkills = mentorSkills.slice(0, 3);
  }

  const skillScore = skillRatio * weights.skills;

  // B. GOAL / BIO SEMANTIC OVERLAP (Weight: 20)
  const mentorCombinedText = `${mentor.bio || ""} ${mentor.skillsToTeach?.join(" ") || ""}`;
  const learnerCombinedText = `${learnerBio || ""} ${targetSkills.join(" ")}`;
  const textRatio = computeTextOverlap(learnerCombinedText, mentorCombinedText);
  const goalScore = textRatio * weights.goalSemantic;

  // C. AVAILABILITY OVERLAP (Weight: 15)
  const availComp = compareAvailability(learnerAvail, mentor.availability, preferredSchedule);
  const availScore = availComp.score * weights.availability;

  // D. QUALITY & TRUST (Weight: 15)
  // Real ratings from Review collection
  const avgRating = Number(reviewStats.averageRating) || 0;
  const reviewCount = Number(reviewStats.reviewCount) || 0;

  let qualityRatio = 0.5; // neutral for unreviewed "New" mentors
  if (reviewCount > 0) {
    // scale 1-5 to 0.2 - 1.0
    qualityRatio = Math.max(0.1, avgRating / 5.0);
    // boost with review count confidence
    const reviewBoost = Math.min(0.1, Math.log10(reviewCount + 1) * 0.05);
    qualityRatio = Math.min(1.0, qualityRatio + reviewBoost);
  }

  // Completed sessions boost (+0.05 to +0.1)
  if (completedSessions > 0) {
    qualityRatio = Math.min(1.0, qualityRatio + Math.min(0.1, completedSessions * 0.02));
  }

  // Verified boost
  if (mentor.isVerified) {
    qualityRatio = Math.min(1.0, qualityRatio + 0.1);
  }

  const qualityScore = qualityRatio * weights.quality;

  // E. BUDGET & LEVEL FIT (Weight: 10)
  const maxBudget = Number(learnerBudget) > 0 ? Number(learnerBudget) : 1000;
  const mentorRate = Number(mentor.hourlyRate) || 0;

  let budgetRatio = 1.0;
  if (mentorRate > maxBudget) {
    const overage = mentorRate - maxBudget;
    budgetRatio = Math.max(0.1, 1.0 - overage / maxBudget);
  } else if (mentorRate === 0) {
    budgetRatio = 1.0; // Free session is always perfect budget fit
  } else {
    budgetRatio = 1.0;
  }

  const budgetScore = budgetRatio * weights.budgetAndLevel;

  // Final aggregate score
  const totalScore = Math.min(99, Math.max(10, Math.round(
    skillScore + goalScore + availScore + qualityScore + budgetScore
  )));

  // Generate deterministic human-friendly reasons
  const matchReasons = [];
  if (matchedSkills.length > 0) {
    matchReasons.push(`Teaches ${matchedSkills.slice(0, 2).join(" & ")} matching your goals`);
  } else {
    matchReasons.push(`Broad expertise in ${mentorSkills.slice(0, 2).join(", ") || "mentorship"}`);
  }

  if (availComp.hasOverlap) {
    matchReasons.push(availComp.overlapSummary);
  }

  if (reviewCount > 0) {
    matchReasons.push(`${avgRating.toFixed(1)} ★ (${reviewCount} review${reviewCount === 1 ? "" : "s"})${completedSessions > 0 ? ` · ${completedSessions} completed sessions` : ""}`);
  } else {
    matchReasons.push("New mentor with verified profile");
  }

  if (mentorRate <= maxBudget) {
    matchReasons.push(mentorRate === 0 ? "Free sessions offered" : `Within budget: ₹${mentorRate}/hr`);
  }

  return {
    matchScore: totalScore,
    breakdown: {
      skillScore: Math.round(skillScore),
      goalScore: Math.round(goalScore),
      availScore: Math.round(availScore),
      qualityScore: Math.round(qualityScore),
      budgetScore: Math.round(budgetScore)
    },
    matchedSkills,
    missingSkills,
    availabilityOverlap: availComp.overlapSummary,
    matchReasons: matchReasons.slice(0, 2),
    avgRating: reviewCount > 0 ? avgRating : null,
    reviewCount,
    completedSessions
  };
}

// ---------------------------------------------------------------------------
// 6. Optional Gemini AI Layer
// ---------------------------------------------------------------------------
/**
 * Calls Google Gemini API to re-rank top 10 candidates and provide tailored 1-line reasons.
 * Safe fallback: silently falls back if key missing, timeout occurs, or response malformed.
 */
async function reRankWithGemini({
  learnerProfile,
  candidates,
  apiKey,
  model = "gemini-2.5-flash"
}) {
  if (!apiKey || !Array.isArray(candidates) || candidates.length === 0) {
    return null;
  }

  // Send only top 10 candidates to limit tokens & latency
  const top10 = candidates.slice(0, 10);
  const candidateMap = new Map(top10.map((c) => [String(c.mentor._id || c.mentor.id), c]));

  // Build sanitized, PII-free candidate data
  const candidatePayload = top10.map((c) => ({
    id: String(c.mentor._id || c.mentor.id),
    name: c.mentor.name,
    skills: c.mentor.skillsToTeach || [],
    bioSnippet: (c.mentor.bio || "").slice(0, 140),
    availability: c.mentor.availability || [],
    hourlyRate: c.mentor.hourlyRate,
    rating: c.avgRating ? c.avgRating.toFixed(1) : "New",
    deterministicScore: c.matchScore
  }));

  const prompt = `You are an expert mentor matching assistant for Skill Exchange.
Learner requirements:
- Wanted skills: ${JSON.stringify(learnerProfile.skills || [])}
- Learning goal/bio: "${(learnerProfile.bio || "").slice(0, 200)}"
- Budget: ₹${learnerProfile.budget}/hr
- Preferred schedule: "${learnerProfile.schedule || "Any"}"

Mentors:
${JSON.stringify(candidatePayload, null, 2)}

Task:
Re-rank these mentors based on learning suitability, schedule fit, and value. For each mentor, provide:
1. "id": exact mentor ID from the input
2. "reRankScore": an integer 0-99
3. "aiReason": a concise, compelling 1-line explanation of why this mentor fits the learner (e.g. "Matches your React + Node goal, available weekends, 4.8 rating").

Return ONLY a strict valid JSON object in this format:
{
  "matches": [
    {
      "id": "string",
      "reRankScore": 92,
      "aiReason": "string"
    }
  ]
}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s strict timeout

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json"
        }
      })
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`[Matcher] Gemini API returned status ${res.status}`);
      return null;
    }

    const json = await res.json();
    const candidateText = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) return null;

    let parsed;
    try {
      parsed = JSON.parse(candidateText);
    } catch {
      // Strip potential markdown code block
      const cleaned = candidateText.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      parsed = JSON.parse(cleaned);
    }

    if (!parsed || !Array.isArray(parsed.matches) || parsed.matches.length === 0) {
      return null;
    }

    // Validate that IDs match known candidate IDs
    const reRanked = [];
    const seenIds = new Set();

    for (const match of parsed.matches) {
      const original = candidateMap.get(String(match.id));
      if (original && !seenIds.has(String(match.id))) {
        seenIds.add(String(match.id));
        const aiScore = Number.isInteger(match.reRankScore)
          ? Math.min(99, Math.max(10, match.reRankScore))
          : original.matchScore;

        reRanked.push({
          ...original,
          matchScore: aiScore,
          matchReasons: match.aiReason
            ? [match.aiReason, ...original.matchReasons.slice(1)]
            : original.matchReasons,
          isAiEnhanced: true
        });
      }
    }

    // Include any candidates not mentioned by AI in original order
    for (const orig of top10) {
      if (!seenIds.has(String(orig.mentor._id || orig.mentor.id))) {
        reRanked.push({ ...orig, isAiEnhanced: false });
      }
    }

    // Sort re-ranked top 10
    reRanked.sort((a, b) => b.matchScore - a.matchScore);

    // Append the remainder of candidates (rank 11+)
    return [...reRanked, ...candidates.slice(10)];
  } catch (err) {
    console.warn(`[Matcher] Gemini AI re-ranking failed: ${err.message}. Using deterministic fallback.`);
    return null;
  }
}

// ---------------------------------------------------------------------------
// 7. In-Memory Cache & Rate Limiting
// ---------------------------------------------------------------------------
const matcherCache = new Map();
const CACHE_TTL_MS = 12 * 60 * 1000; // 12 minutes

function getCacheKey(learnerId, params = {}) {
  const normParams = JSON.stringify(params);
  return `${learnerId}:${crypto.createHash("md5").update(normParams).digest("hex")}`;
}

function getCachedMatches(learnerId, params) {
  const key = getCacheKey(learnerId, params);
  const entry = matcherCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    matcherCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCachedMatches(learnerId, params, data) {
  const key = getCacheKey(learnerId, params);
  matcherCache.set(key, {
    data,
    expiresAt: Date.now() + CACHE_TTL_MS
  });
}

function invalidateMatcherCache(learnerId) {
  const prefix = `${learnerId}:`;
  for (const key of matcherCache.keys()) {
    if (key.startsWith(prefix)) {
      matcherCache.delete(key);
    }
  }
}

// Simple sliding window rate limiter: 20 requests per 10 minutes per user
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 20;

function checkRateLimit(userId) {
  const now = Date.now();
  let userRecord = rateLimitStore.get(userId);
  if (!userRecord || now - userRecord.startTime > RATE_LIMIT_WINDOW_MS) {
    userRecord = { startTime: now, count: 1 };
    rateLimitStore.set(userId, userRecord);
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }

  if (userRecord.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, retryAfterMs: RATE_LIMIT_WINDOW_MS - (now - userRecord.startTime) };
  }

  userRecord.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - userRecord.count };
}

module.exports = {
  MATCH_WEIGHTS,
  SKILL_SYNONYMS,
  normalizeSkill,
  parseSkills,
  normalizeAvailability,
  compareAvailability,
  extractTokens,
  computeTextOverlap,
  scoreCandidate,
  reRankWithGemini,
  getCachedMatches,
  setCachedMatches,
  invalidateMatcherCache,
  checkRateLimit
};
