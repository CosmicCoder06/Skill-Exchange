function firstNumber(...values) {
    for (const value of values) {
        if (
            value !== undefined &&
            value !== null &&
            value !== ""
        ) {
            const number = Number(value);

            if (!Number.isNaN(number)) {
                return number;
            }
        }
    }

    return 0;
}

function StatCard({
    value,
    title,
    description,
    featured = false,
    tone = "",
    onClick,
}) {
    return (
        <button
            type="button"
            className={`admin-stat-card ${
                featured ? "featured" : ""
            } ${tone}`}
            onClick={onClick}
        >
            <span className="admin-stat-arrow">
                ↗
            </span>

            <strong>
                {Number(value) || 0}
            </strong>

            <div>
                <h3>{title}</h3>

                <p>
                    {description}
                </p>
            </div>
        </button>
    );
}

export default function AdminOverview({
    overview,
    onOpenUsers,
    onOpenReports,
}) {
    /*
     * Backend compatibility:
     *
     * {
     *   totalMembers: 6
     * }
     *
     * OR
     *
     * {
     *   overview: {...}
     * }
     *
     * OR
     *
     * {
     *   data: {...}
     * }
     *
     * OR
     *
     * {
     *   data: {
     *      overview: {...}
     *   }
     * }
     */

    const root =
        overview?.data?.overview ||
        overview?.data?.stats ||
        overview?.data ||
        overview?.overview ||
        overview?.stats ||
        overview ||
        {};

    const totalMembers = firstNumber(
        root.totalMembers,
        root.totalUsers,
        root.members,
        root.userCount,
        root.count
    );

    const mentors = firstNumber(
        root.mentors,
        root.totalMentors,
        root.mentorCount
    );

    const learners = firstNumber(
        root.learners,
        root.totalLearners,
        root.learnerCount
    );

    const conversations = firstNumber(
        root.conversations,
        root.totalConversations,
        root.conversationCount,
        root.matches
    );

    const messages = firstNumber(
        root.messages,
        root.totalMessages,
        root.messageCount
    );

    const completeProfiles = firstNumber(
        root.completeProfiles,
        root.completedProfiles,
        root.profileCompleted,
        root.completedProfileCount
    );

    return (
        <section className="admin-overview">

            <div className="admin-stats-grid">

                <StatCard
                    value={totalMembers}
                    title="Total members"
                    description="Everyone registered on SkillExchange"
                    featured
                    onClick={onOpenUsers}
                />

                <StatCard
                    value={mentors}
                    title="Mentors"
                    description="People currently sharing expertise"
                    tone="tone-mint"
                    onClick={onOpenUsers}
                />

                <StatCard
                    value={learners}
                    title="Learners"
                    description="People currently learning"
                    tone="tone-sand"
                    onClick={onOpenUsers}
                />

                <StatCard
                    value={conversations}
                    title="Conversations"
                    description="Learning connections started"
                    tone="tone-lavender"
                    onClick={onOpenReports}
                />

                <StatCard
                    value={messages}
                    title="Messages"
                    description="Knowledge exchanged"
                    tone="tone-blue"
                    onClick={onOpenReports}
                />

                <StatCard
                    value={completeProfiles}
                    title="Complete profiles"
                    description="Members ready for discovery"
                    tone="tone-soft"
                    onClick={onOpenUsers}
                />

            </div>

            <div className="admin-overview-lower">

                <div className="admin-overview-block">

                    <p className="admin-eyebrow">
                        COMMUNITY HEALTH
                    </p>

                    <h2>
                        Platform at a glance
                    </h2>

                    <p className="admin-overview-copy">
                        Keep member accounts,
                        participation and profile
                        readiness under control from
                        one protected workspace.
                    </p>

                    <button
                        type="button"
                        className="admin-text-button"
                        onClick={onOpenReports}
                    >
                        View reports →
                    </button>

                </div>

                <div className="admin-overview-block">

                    <p className="admin-eyebrow">
                        MEMBER MANAGEMENT
                    </p>

                    <h2>
                        Recently joined
                    </h2>

                    <p className="admin-overview-copy">
                        Review member accounts,
                        profile photos and access
                        permissions.
                    </p>

                    <button
                        type="button"
                        className="admin-text-button"
                        onClick={onOpenUsers}
                    >
                        Manage all →
                    </button>

                </div>

            </div>

        </section>
    );
}