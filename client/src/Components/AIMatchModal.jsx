import { useState, useEffect, useCallback, useId } from "react";
import {
  BrainCircuit,
  Sparkles,
  ArrowRight,
  Zap,
  Target,
  IndianRupee,
  Calendar,
  Star,
  CheckCircle,
  Eye,
  RefreshCw,
  X,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  XCircle
} from "lucide-react";
import { fetchMatches } from "../services/matchService.js";

const BRAND_GREEN = "#176b4e";
const BRAND_GREEN_LIGHT = "#e8f4ef";

export const AIMatchModal = ({
  isOpen,
  onClose,
  onSelectMentor,
  onViewProfile,
  token,
  apiUrl = import.meta.env.VITE_API_URL
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [matches, setMatches] = useState([]);
  const [isAiEnhanced, setIsAiEnhanced] = useState(false);
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const [suggestedSkills, setSuggestedSkills] = useState([]);
  const [learnerCriteria, setLearnerCriteria] = useState(null);

  // Filter overrides
  const [skillQuery, setSkillQuery] = useState("");
  const [maxBudget, setMaxBudget] = useState(1000);
  const [preferredSchedule, setPreferredSchedule] = useState("Any");
  const [minRating, setMinRating] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Expanded breakdown map: mentorId -> boolean
  const [expandedId, setExpandedId] = useState(null);

  // Hidden mentors dismissed as "Not relevant"
  const [hiddenIds, setHiddenIds] = useState(() => {
    try {
      const stored = localStorage.getItem("se_hidden_mentors");
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const dialogTitleId = useId();

  const handleDismissMentor = (mentorId) => {
    setHiddenIds((prev) => {
      const next = new Set(prev);
      next.add(String(mentorId));
      try {
        localStorage.setItem("se_hidden_mentors", JSON.stringify(Array.from(next)));
      } catch (e) {
        console.error("Failed to persist hidden mentor:", e);
      }
      return next;
    });
  };

  const loadMatches = useCallback(
    async (isRefresh = false) => {
      if (!token) return;
      setLoading(true);
      setError("");

      try {
        const data = await fetchMatches({
          api: apiUrl,
          token,
          skill: skillQuery,
          maxPrice: maxBudget,
          timing: preferredSchedule,
          minRating,
          refresh: isRefresh
        });

        if (data.profileIncomplete) {
          setProfileIncomplete(true);
          setMatches([]);
          setSuggestedSkills(data.suggestedSkills || []);
        } else {
          setProfileIncomplete(false);
          setMatches(data.matches || []);
          setIsAiEnhanced(Boolean(data.isAiEnhanced));
          setSuggestedSkills(data.suggestedSkills || []);
          setLearnerCriteria(data.learnerCriteria || null);
        }
      } catch (err) {
        setError(err.message || "Failed to load matching mentors. Please check your connection.");
      } finally {
        setLoading(false);
      }
    },
    [token, apiUrl, skillQuery, maxBudget, preferredSchedule, minRating]
  );

  useEffect(() => {
    if (isOpen) {
      loadMatches(false);
    }
  }, [isOpen, loadMatches]);

  if (!isOpen) return null;

  const visibleMatches = matches.filter(
    (item) => !hiddenIds.has(String(item.mentor?.id || item.mentor?._id))
  );

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    loadMatches(false);
  };

  const handleSelectSuggestedSkill = (skill) => {
    setSkillQuery(skill);
    // immediately trigger search with the clicked skill
    setLoading(true);
    fetchMatches({
      api: apiUrl,
      token,
      skill,
      maxPrice: maxBudget,
      timing: preferredSchedule,
      minRating
    })
      .then((data) => {
        setProfileIncomplete(false);
        setMatches(data.matches || []);
        setIsAiEnhanced(Boolean(data.isAiEnhanced));
        setSuggestedSkills(data.suggestedSkills || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  return (
    <div
      className="ai-match-dialog"
      role="presentation"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        background: "rgba(15, 23, 20, 0.72)",
        backdropFilter: "blur(5px)",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={dialogTitleId}
        style={{
          background: "#ffffff",
          width: "100%",
          maxWidth: "720px",
          borderRadius: "12px",
          border: "1px solid #d7e2da",
          boxShadow: "0 20px 48px rgba(0, 0, 0, 0.16)",
          display: "flex",
          flexDirection: "column",
          maxHeight: "90vh",
          overflow: "hidden",
          color: "#14221d"
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 24px",
            background: "#16382b",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid rgba(255,255,255,0.1)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "8px",
                background: "rgba(255,255,255,0.12)",
                display: "grid",
                placeItems: "center",
                color: "#a3e0c4"
              }}
            >
              <BrainCircuit size={20} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h2
                  id={dialogTitleId}
                  style={{ margin: 0, fontSize: "17px", fontWeight: 700, letterSpacing: "-0.01em" }}
                >
                  AI Smart Mentor Matcher
                </h2>
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: "999px",
                    background: isAiEnhanced ? "#8b5cf6" : BRAND_GREEN,
                    color: "#ffffff",
                    fontSize: "10px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "3px"
                  }}
                >
                  {isAiEnhanced ? (
                    <>
                      <Sparkles size={10} /> AI-enhanced
                    </>
                  ) : (
                    "Smart match"
                  )}
                </span>
              </div>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#b9d8ca" }}>
                Tailored to your profile skills, learning goals, availability, and budget.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              type="button"
              onClick={() => loadMatches(true)}
              title="Refresh matches"
              aria-label="Refresh matches"
              style={{
                border: "1px solid rgba(255,255,255,0.2)",
                background: "transparent",
                color: "#ffffff",
                width: "32px",
                height: "32px",
                borderRadius: "6px",
                cursor: "pointer",
                display: "grid",
                placeItems: "center"
              }}
            >
              <RefreshCw size={14} className={loading ? "spin-icon" : ""} />
            </button>
            <button
              type="button"
              aria-label="Close matcher dialog"
              onClick={onClose}
              style={{
                border: 0,
                background: "rgba(255,255,255,0.12)",
                color: "#ffffff",
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                cursor: "pointer",
                display: "grid",
                placeItems: "center",
                fontSize: "18px",
                lineHeight: 1
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: "20px 24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Collapsible Refine / Override Filters Form */}
          <form
            onSubmit={handleFilterSubmit}
            style={{
              padding: "16px",
              background: "#f8faf8",
              border: "1px solid #d7e2da",
              borderRadius: "8px",
              display: "flex",
              flexDirection: "column",
              gap: "12px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: BRAND_GREEN }}>
                <Target size={14} />
                <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Match Criteria & Overrides
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                style={{
                  background: "transparent",
                  border: 0,
                  fontSize: "12px",
                  color: BRAND_GREEN,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                <SlidersHorizontal size={12} />
                {showFilters ? "Simple View" : "Refine Filters"}
              </button>
            </div>

            {/* Target Skill Input */}
            <div>
              <input
                aria-label="Target skill or learning topic"
                type="text"
                value={skillQuery}
                disabled={loading}
                onChange={(e) => setSkillQuery(e.target.value)}
                placeholder="Override skill (e.g. React, Node.js, DSA, Python). Leave empty to use profile."
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "6px",
                  border: "1px solid #d7e2da",
                  background: "#ffffff",
                  fontSize: "13px",
                  boxSizing: "border-box",
                  outline: "none"
                }}
              />
            </div>

            {/* Extended Filters */}
            {showFilters && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "12px",
                  paddingTop: "6px"
                }}
              >
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, marginBottom: "4px", color: "#47544e" }}>
                    Max Budget: <strong style={{ color: BRAND_GREEN }}>₹{maxBudget}/hr</strong>
                  </label>
                  <input
                    aria-label="Max budget hourly rate"
                    type="range"
                    min="0"
                    max="2000"
                    step="50"
                    value={maxBudget}
                    disabled={loading}
                    onChange={(e) => setMaxBudget(Number(e.target.value))}
                    style={{ width: "100%", accentColor: BRAND_GREEN }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, marginBottom: "4px", color: "#47544e" }}>
                    Schedule
                  </label>
                  <select
                    aria-label="Preferred schedule"
                    value={preferredSchedule}
                    disabled={loading}
                    onChange={(e) => setPreferredSchedule(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "6px",
                      border: "1px solid #d7e2da",
                      background: "#ffffff",
                      fontSize: "12px",
                      outline: "none",
                      cursor: "pointer"
                    }}
                  >
                    <option value="Any">Any Timing</option>
                    <option value="Weekends">Weekends Only</option>
                    <option value="Weekdays">Weekdays</option>
                    <option value="Evenings">Evenings</option>
                    <option value="Mornings">Mornings</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, marginBottom: "4px", color: "#47544e" }}>
                    Minimum Rating
                  </label>
                  <select
                    aria-label="Minimum rating"
                    value={minRating}
                    disabled={loading}
                    onChange={(e) => setMinRating(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "6px",
                      border: "1px solid #d7e2da",
                      background: "#ffffff",
                      fontSize: "12px",
                      outline: "none",
                      cursor: "pointer"
                    }}
                  >
                    <option value="">Any Rating</option>
                    <option value="4.0">4.0 ★ & above</option>
                    <option value="4.5">4.5 ★ & above</option>
                    <option value="4.8">4.8 ★ & above</option>
                  </select>
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: "8px", marginTop: "2px" }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "9px 16px",
                  borderRadius: "6px",
                  border: 0,
                  background: BRAND_GREEN,
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px"
                }}
              >
                <Zap size={14} />
                {loading ? "Matching..." : "Apply & Search"}
              </button>

              {(skillQuery || minRating || preferredSchedule !== "Any" || maxBudget !== 1000) && (
                <button
                  type="button"
                  onClick={() => {
                    setSkillQuery("");
                    setMaxBudget(1000);
                    setPreferredSchedule("Any");
                    setMinRating("");
                  }}
                  style={{
                    padding: "9px 12px",
                    borderRadius: "6px",
                    border: "1px solid #d7e2da",
                    background: "#ffffff",
                    color: "#54655d",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Reset
                </button>
              )}
            </div>
          </form>

          {/* Loading Skeletons */}
          {loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  style={{
                    padding: "16px",
                    borderRadius: "8px",
                    border: "1px solid #e5ebe7",
                    background: "#fafbf9",
                    display: "flex",
                    gap: "14px",
                    alignItems: "center"
                  }}
                >
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      background: "#e4ebe6"
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ width: "40%", height: "14px", background: "#e4ebe6", borderRadius: "4px", marginBottom: "8px" }} />
                    <div style={{ width: "70%", height: "12px", background: "#e4ebe6", borderRadius: "4px", marginBottom: "6px" }} />
                    <div style={{ width: "50%", height: "10px", background: "#edf2ee", borderRadius: "4px" }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error Banner */}
          {!loading && error && (
            <div
              role="alert"
              style={{
                padding: "14px 16px",
                borderRadius: "8px",
                background: "#fef3f2",
                border: "1px solid #fee4e2",
                color: "#b42318",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => loadMatches(true)}
                style={{
                  padding: "5px 12px",
                  borderRadius: "4px",
                  border: "1px solid #fecdca",
                  background: "#ffffff",
                  color: "#b42318",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Incomplete Profile Banner */}
          {!loading && !error && profileIncomplete && (
            <div
              style={{
                padding: "18px",
                borderRadius: "8px",
                background: "#fcf8ee",
                border: "1px solid #f5e4bd",
                color: "#744210"
              }}
            >
              <h4 style={{ margin: "0 0 6px", fontSize: "14px", fontWeight: 700 }}>
                Set up your learning targets
              </h4>
              <p style={{ margin: "0 0 12px", fontSize: "13px", lineHeight: 1.5, color: "#8a581e" }}>
                You have not added any skills you want to learn to your profile yet. Pick a popular topic below or type in a target skill above:
              </p>
              {suggestedSkills.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {suggestedSkills.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => handleSelectSuggestedSkill(skill)}
                      style={{
                        padding: "5px 12px",
                        borderRadius: "999px",
                        border: "1px solid #e1be79",
                        background: "#fff9eb",
                        color: "#744210",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer"
                      }}
                    >
                      + {skill}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Empty Results */}
          {!loading && !error && !profileIncomplete && visibleMatches.length === 0 && (
            <div
              style={{
                padding: "32px 20px",
                textAlign: "center",
                borderRadius: "8px",
                border: "1px dashed #d7e2da",
                color: "#54655d"
              }}
            >
              <h4 style={{ margin: "0 0 6px", fontSize: "15px", color: "#14221d" }}>
                No matching mentors found
              </h4>
              <p style={{ margin: "0 0 16px", fontSize: "13px" }}>
                We couldn&apos;t find mentors matching your current filters. Try relaxing your budget or timing preferences.
              </p>
              {suggestedSkills.length > 0 && (
                <div>
                  <span style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "8px" }}>
                    Popular Skills on Skill Exchange:
                  </span>
                  <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px" }}>
                    {suggestedSkills.map((skill) => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => handleSelectSuggestedSkill(skill)}
                        style={{
                          padding: "4px 10px",
                          borderRadius: "999px",
                          border: "1px solid #d7e2da",
                          background: "#ffffff",
                          color: BRAND_GREEN,
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer"
                        }}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Results List */}
          {!loading && !error && visibleMatches.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "#54655d"
                  }}
                >
                  Matched Mentors ({visibleMatches.length})
                </span>
                {learnerCriteria?.targetSkills?.length > 0 && (
                  <span style={{ fontSize: "12px", color: BRAND_GREEN }}>
                    Target: {learnerCriteria.targetSkills.join(", ")}
                  </span>
                )}
              </div>

              {visibleMatches.map(({ mentor, matchScore, matchReasons, matchedSkills, missingSkills, availabilityOverlap, rating, ratingDisplay, reviewCount, completedSessions, breakdown }) => {
                const isExpanded = expandedId === String(mentor.id);
                return (
                  <div
                    key={mentor.id}
                    className="ai-result-row"
                    style={{
                      padding: "16px",
                      borderRadius: "8px",
                      border: "1px solid #d7e2da",
                      background: "#ffffff",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                      transition: "border-color 0.15s ease"
                    }}
                  >
                    {/* Top Row: Avatar, Info, Score, Price */}
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                      <div style={{ display: "flex", gap: "12px", flex: 1, minWidth: "240px" }}>
                        <img
                          src={
                            mentor.avatar ||
                            `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48"%3E%3Crect width="48" height="48" fill="%23d7e2da"/%3E%3Ctext x="50%25" y="55%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%23176b4e"%3E${encodeURIComponent(
                              (mentor.name || "M").charAt(0)
                            )}%3C/text%3E%3C/svg%3E`
                          }
                          alt={mentor.name}
                          style={{
                            width: "48px",
                            height: "48px",
                            borderRadius: "50%",
                            objectFit: "cover",
                            border: "1px solid #d7e2da"
                          }}
                        />

                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                            <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#14221d" }}>
                              {mentor.name}
                            </h4>
                            {mentor.isVerified && (
                              <span
                                title="Verified Mentor"
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "3px",
                                  fontSize: "11px",
                                  color: BRAND_GREEN,
                                  fontWeight: 600
                                }}
                              >
                                <CheckCircle size={13} /> Verified
                              </span>
                            )}
                            <span
                              style={{
                                padding: "2px 8px",
                                borderRadius: "999px",
                                background: BRAND_GREEN_LIGHT,
                                color: BRAND_GREEN,
                                fontSize: "11px",
                                fontWeight: 800
                              }}
                            >
                              {matchScore}% Match
                            </span>
                          </div>

                          {/* Rating & Sessions */}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              marginTop: "3px",
                              fontSize: "12px",
                              color: "#54655d"
                            }}
                          >
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}>
                              <Star size={13} fill={rating ? "#f59e0b" : "none"} color={rating ? "#f59e0b" : "#9ca3af"} />
                              {ratingDisplay}
                              {reviewCount > 0 ? ` (${reviewCount})` : ""}
                            </span>
                            <span>•</span>
                            <span>{completedSessions || 0} completed session{completedSessions === 1 ? "" : "s"}</span>
                            <span>•</span>
                            <span style={{ color: BRAND_GREEN, fontWeight: 600 }}>
                              {availabilityOverlap || mentor.availability || "Flexible"}
                            </span>
                          </div>

                          {/* Matched Skills Badges */}
                          {matchedSkills?.length > 0 && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "6px" }}>
                              {matchedSkills.map((s) => (
                                <span
                                  key={s}
                                  style={{
                                    padding: "2px 7px",
                                    borderRadius: "4px",
                                    background: "#edf4f0",
                                    color: "#165840",
                                    fontSize: "10px",
                                    fontWeight: 600
                                  }}
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right side: Price */}
                      <div style={{ textAlign: "right", minWidth: "100px" }}>
                        <span style={{ fontSize: "17px", fontWeight: 800, color: "#14221d" }}>
                          {mentor.hourlyRate === 0 ? "Free" : `₹${mentor.hourlyRate?.toLocaleString("en-IN")}`}
                        </span>
                        {mentor.hourlyRate > 0 && (
                          <span style={{ fontSize: "11px", color: "#54655d" }}> /hr</span>
                        )}
                      </div>
                    </div>

                    {/* Explanations & Match Reasons */}
                    {matchReasons?.length > 0 && (
                      <div
                        style={{
                          padding: "8px 12px",
                          borderRadius: "6px",
                          background: "#f9faf9",
                          borderLeft: `3px solid ${BRAND_GREEN}`,
                          fontSize: "12px",
                          color: "#384a42",
                          lineHeight: 1.5
                        }}
                      >
                        {matchReasons.map((r, i) => (
                          <div key={i}>• {r}</div>
                        ))}
                      </div>
                    )}

                    {/* Expandable Breakdown ("How we matched you") */}
                    {isExpanded && breakdown && (
                      <div
                        style={{
                          padding: "10px 14px",
                          background: "#f4f7f5",
                          borderRadius: "6px",
                          fontSize: "11px",
                          color: "#37473f",
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px"
                        }}
                      >
                        <div style={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "#14221d" }}>
                          Compatibility Breakdown:
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "8px" }}>
                          <div>Skills overlap: <strong>{breakdown.skillScore}/40 pts</strong></div>
                          <div>Goal & Bio fit: <strong>{breakdown.goalScore}/20 pts</strong></div>
                          <div>Schedule alignment: <strong>{breakdown.availScore}/15 pts</strong></div>
                          <div>Rating & Trust: <strong>{breakdown.qualityScore}/15 pts</strong></div>
                          <div>Budget fit: <strong>{breakdown.budgetScore}/10 pts</strong></div>
                        </div>

                        {missingSkills?.length > 0 && (
                          <div style={{ color: "#7a6730", marginTop: "2px" }}>
                            Uncovered target skills: {missingSkills.join(", ")}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Card Actions */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingTop: "6px",
                        borderTop: "1px solid #f0f3f1",
                        flexWrap: "wrap",
                        gap: "8px"
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : String(mentor.id))}
                        style={{
                          background: "transparent",
                          border: 0,
                          fontSize: "11px",
                          color: "#54655d",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                          padding: 0
                        }}
                      >
                        {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        {isExpanded ? "Hide breakdown" : "How we matched you"}
                      </button>

                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <button
                          type="button"
                          onClick={() => handleDismissMentor(mentor.id)}
                          title="Hide this mentor from future recommendations"
                          style={{
                            padding: "6px 10px",
                            borderRadius: "4px",
                            border: "1px solid #d7e2da",
                            background: "#ffffff",
                            color: "#6b7280",
                            fontSize: "11px",
                            fontWeight: 600,
                            cursor: "pointer"
                          }}
                        >
                          Not relevant
                        </button>

                        {onViewProfile && (
                          <button
                            type="button"
                            onClick={() => {
                              onViewProfile(mentor.id);
                              onClose();
                            }}
                            style={{
                              padding: "6px 12px",
                              borderRadius: "4px",
                              border: "1px solid #d7e2da",
                              background: "#ffffff",
                              color: BRAND_GREEN,
                              fontSize: "12px",
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                          >
                            <Eye size={12} /> View Profile
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            onSelectMentor(mentor);
                            onClose();
                          }}
                          style={{
                            padding: "6px 16px",
                            borderRadius: "999px",
                            border: 0,
                            background: BRAND_GREEN,
                            color: "#ffffff",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px"
                          }}
                        >
                          Book Session <ArrowRight size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
