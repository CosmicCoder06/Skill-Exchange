const User = require("../Backend Configuration/Models/UserSchema/user");
const Review = require("../models/Review");
const Booking = require("../models/Booking");
const {
  parseSkills,
  scoreCandidate,
  reRankWithGemini,
  getCachedMatches,
  setCachedMatches,
  checkRateLimit
} = require("../services/matcherService");

/**
 * GET /api/matches
 * Returns ranked mentor recommendations with deterministic scoring and optional Gemini AI re-ranking.
 */
const getMatches = async (req, res) => {
  const startTime = Date.now();
  const learnerId = req.user?.id || req.user?._id;

  if (!learnerId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  // 1. Rate Limiting Check
  const rateLimitStatus = checkRateLimit(String(learnerId));
  if (!rateLimitStatus.allowed) {
    return res.status(429).json({
      message: "Too many matching requests. Please wait a moment before trying again.",
      retryAfterSeconds: Math.ceil((rateLimitStatus.retryAfterMs || 60000) / 1000)
    });
  }

  const {
    skill,
    minRating,
    maxPrice,
    availableOnly,
    timing,
    refresh,
    page = 1,
    limit = 10
  } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));

  const queryParams = {
    skill: skill?.trim() || "",
    minRating: minRating ? Number(minRating) : null,
    maxPrice: maxPrice ? Number(maxPrice) : null,
    availableOnly: availableOnly === "true",
    timing: timing?.trim() || "",
    limit: limitNum,
    page: pageNum
  };

  // 2. Cache check (unless refresh=true)
  if (refresh !== "true") {
    const cached = getCachedMatches(String(learnerId), queryParams);
    if (cached) {
      return res.json({
        ...cached,
        fromCache: true
      });
    }
  }

  try {
    // 3. Fetch logged-in learner's profile
    const learner = await User.findById(learnerId).select(
      "name bio skillsToLearn availability hourlyRate profileCompleted role"
    );

    if (!learner) {
      return res.status(404).json({ message: "Learner profile not found" });
    }

    // Determine target skills: query param overrides or complements learner profile
    const profileSkills = parseSkills(learner.skillsToLearn);
    const overrideSkills = parseSkills(queryParams.skill);
    const targetSkills = overrideSkills.length > 0 ? overrideSkills : profileSkills;

    // Check for incomplete profile if learner has no target skills and no search query
    const isProfileIncomplete = targetSkills.length === 0 && !learner.bio && !learner.profileCompleted;
    if (isProfileIncomplete) {
      const popularSkills = await User.distinct("skillsToTeach", {
        role: "mentor",
        isActive: true,
        profileCompleted: true
      });

      return res.json({
        profileIncomplete: true,
        message: "Your profile has no saved learning goals yet. Add skills to learn in your profile, or enter a target skill above to find matching mentors.",
        matches: [],
        total: 0,
        page: pageNum,
        limit: limitNum,
        totalPages: 0,
        suggestedSkills: (popularSkills || []).slice(0, 10)
      });
    }

    // 4. Candidate Mentor Discovery
    // Rules: Must be mentor, active (never suspended), profileCompleted, not self, has skills
    const mentorQuery = {
      role: "mentor",
      isActive: true,
      profileCompleted: true,
      _id: { $ne: learnerId },
      "skillsToTeach.0": { $exists: true }
    };

    if (queryParams.availableOnly) {
      mentorQuery["availability.0"] = { $exists: true };
    }

    if (queryParams.maxPrice !== null && !isNaN(queryParams.maxPrice)) {
      mentorQuery.hourlyRate = { $lte: queryParams.maxPrice };
    }

    const candidateMentors = await User.find(mentorQuery).select(
      "name role bio skillsToTeach teachingSkillLevels availability hourlyRate avatarUrl isVerified profileCompleted"
    );

    if (candidateMentors.length === 0) {
      const distinctSkills = await User.distinct("skillsToTeach", {
        role: "mentor",
        isActive: true,
        profileCompleted: true
      });

      return res.json({
        matches: [],
        total: 0,
        page: pageNum,
        limit: limitNum,
        totalPages: 0,
        message: "No mentors found matching your criteria. Try loosening budget or schedule filters.",
        suggestedSkills: (distinctSkills || []).slice(0, 8)
      });
    }

    // 5. Aggregate Ratings and Bookings in Single Pass (No N+1 queries)
    const mentorIds = candidateMentors.map((m) => m._id);

    const [reviewAgg, bookingAgg] = await Promise.all([
      Review.aggregate([
        { $match: { reviewee: { $in: mentorIds } } },
        {
          $group: {
            _id: "$reviewee",
            averageRating: { $avg: "$rating" },
            reviewCount: { $sum: 1 }
          }
        }
      ]),
      Booking.aggregate([
        { $match: { mentor: { $in: mentorIds }, status: "completed" } },
        {
          $group: {
            _id: "$mentor",
            completedSessions: { $sum: 1 }
          }
        }
      ])
    ]);

    const reviewMap = new Map();
    for (const r of reviewAgg) {
      reviewMap.set(String(r._id), {
        averageRating: Math.round(r.averageRating * 10) / 10,
        reviewCount: r.reviewCount
      });
    }

    const bookingMap = new Map();
    for (const b of bookingAgg) {
      bookingMap.set(String(b._id), b.completedSessions);
    }

    // 6. Deterministic Candidate Scoring
    const learnerBudget = queryParams.maxPrice !== null && !isNaN(queryParams.maxPrice)
      ? queryParams.maxPrice
      : (learner.hourlyRate || 1000);

    const scoredCandidates = [];

    for (const mentor of candidateMentors) {
      const rStats = reviewMap.get(String(mentor._id)) || { averageRating: 0, reviewCount: 0 };
      const completedSessions = bookingMap.get(String(mentor._id)) || 0;

      // Filter by minRating if requested
      if (queryParams.minRating !== null && !isNaN(queryParams.minRating)) {
        if (rStats.reviewCount === 0 || rStats.averageRating < queryParams.minRating) {
          continue;
        }
      }

      const scored = scoreCandidate({
        mentor,
        learnerSkills: targetSkills,
        learnerBio: learner.bio || "",
        learnerAvail: learner.availability || [],
        learnerBudget,
        preferredSchedule: queryParams.timing,
        reviewStats: rStats,
        completedSessions
      });

      scoredCandidates.push({
        mentor: {
          id: mentor._id,
          _id: mentor._id,
          name: mentor.name,
          bio: mentor.bio || "",
          skillsTeach: mentor.skillsToTeach || [],
          teachingSkillLevels: mentor.teachingSkillLevels || {},
          availability: Array.isArray(mentor.availability)
            ? mentor.availability.join(" / ")
            : mentor.availability || "",
          hourlyRate: Number(mentor.hourlyRate) || 0,
          avatar: mentor.avatarUrl || "",
          avatarUrl: mentor.avatarUrl || "",
          isVerified: Boolean(mentor.isVerified),
          profileCompleted: Boolean(mentor.profileCompleted)
        },
        matchScore: scored.matchScore,
        matchReasons: scored.matchReasons,
        matchedSkills: scored.matchedSkills,
        missingSkills: scored.missingSkills,
        availabilityOverlap: scored.availabilityOverlap,
        rating: scored.avgRating, // null if 0 reviews
        ratingDisplay: scored.avgRating ? scored.avgRating.toFixed(1) : "New",
        reviewCount: scored.reviewCount,
        completedSessions: scored.completedSessions,
        isVerified: Boolean(mentor.isVerified),
        breakdown: scored.breakdown,
        isAiEnhanced: false
      });
    }

    // Sort descending by matchScore
    scoredCandidates.sort((a, b) => b.matchScore - a.matchScore);

    // 7. Optional AI Re-ranking (Gemini)
    let finalCandidates = scoredCandidates;
    let pathUsed = "deterministic";

    if (process.env.GEMINI_API_KEY && scoredCandidates.length > 0) {
      try {
        const aiReRanked = await reRankWithGemini({
          learnerProfile: {
            skills: targetSkills,
            bio: learner.bio,
            budget: learnerBudget,
            schedule: queryParams.timing || (learner.availability ? learner.availability.join(", ") : "Any")
          },
          candidates: scoredCandidates,
          apiKey: process.env.GEMINI_API_KEY
        });

        if (aiReRanked) {
          finalCandidates = aiReRanked;
          pathUsed = "ai_enhanced";
        }
      } catch (aiErr) {
        console.warn(`[Matcher] AI re-ranking fallback: ${aiErr.message}`);
      }
    }

    const duration = Date.now() - startTime;
    console.log(
      `[Matcher] Found ${finalCandidates.length} matches in ${duration}ms (path: ${pathUsed}, user: ${learnerId})`
    );

    // 8. Pagination
    const total = finalCandidates.length;
    const totalPages = Math.ceil(total / limitNum);
    const paginatedMatches = finalCandidates.slice(
      (pageNum - 1) * limitNum,
      pageNum * limitNum
    );

    const resultPayload = {
      matches: paginatedMatches,
      isAiEnhanced: pathUsed === "ai_enhanced",
      pathUsed,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
      learnerCriteria: {
        targetSkills,
        budget: learnerBudget,
        preferredSchedule: queryParams.timing || "Any"
      }
    };

    // 9. Store in cache
    setCachedMatches(String(learnerId), queryParams, resultPayload);

    return res.json(resultPayload);
  } catch (error) {
    console.error("[Matcher] Error generating matches:", error);
    return res.status(500).json({
      message: "An error occurred while generating mentor matches. Please try again.",
      error: error.message
    });
  }
};

module.exports = { getMatches };
