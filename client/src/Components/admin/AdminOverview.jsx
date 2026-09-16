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

    const deactivatedAccounts = firstNumber(root.deactivatedAccounts);
    const verifiedUsers = firstNumber(root.verifiedUsers);
    const completedBookings = firstNumber(root.completedBookings);

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

                <StatCard value={verifiedUsers} title="Verified members" description="Trusted accounts ready for discovery" tone="tone-mint" onClick={onOpenUsers} />

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
                    value={completedBookings}
                    title="Sessions completed"
                    description="Successful exchanges delivered"
                    tone="tone-blue"
                    onClick={onOpenReports}
                />

                <StatCard
                    value={deactivatedAccounts}
                    title="Deactivated accounts"
                    description="Accounts currently paused"
                    tone="tone-lavender"
                    onClick={onOpenUsers}
                />
            </div>

        </section>
    );
}
// @teamcosmiccoders
