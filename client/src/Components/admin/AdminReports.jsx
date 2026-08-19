function getReportData(reports) {
    return (
        reports?.data?.reports ||
        reports?.data ||
        reports?.reports ||
        reports ||
        {}
    );
}

function labelMonth(key) {
    if (!key) return "";

    const parts = String(key)
        .split("-")
        .map(Number);

    const year = parts[0];
    const month = parts[1];

    if (!year || !month) {
        return String(key);
    }

    return new Intl.DateTimeFormat(
        "en-IN",
        {
            month: "short",
        }
    ).format(
        new Date(
            year,
            month - 1,
            1
        )
    );
}

function labelDay(key) {
    if (!key) return "";

    const date = new Date(
        `${key}T00:00:00`
    );

    if (Number.isNaN(date.getTime())) {
        return String(key);
    }

    return new Intl.DateTimeFormat(
        "en-IN",
        {
            weekday: "short",
        }
    ).format(date);
}

function BarChart({
    rows = [],
    labelFormatter,
}) {
    const safeRows = Array.isArray(rows)
        ? rows
        : [];

    const max = Math.max(
        ...safeRows.map(
            (row) =>
                Number(row?.total) || 0
        ),
        1
    );

    if (!safeRows.length) {
        return (
            <div className="admin-chart-empty">
                <span>↗</span>

                <p>
                    Not enough activity data yet.
                </p>
            </div>
        );
    }

    return (
        <div className="admin-bar-chart">

            {safeRows.map(
                (row, index) => {
                    const value =
                        Number(
                            row?.total
                        ) || 0;

                    const height = value
                        ? Math.max(
                            (value / max) *
                                100,
                            7
                        )
                        : 0;

                    const key =
                        row?._id ||
                        row?.date ||
                        index;

                    return (
                        <div
                            className="admin-bar-column"
                            key={key}
                        >
                            <span className="admin-bar-value">
                                {value}
                            </span>

                            <div className="admin-bar-track">
                                <i
                                    style={{
                                        height: `${height}%`,
                                    }}
                                />
                            </div>

                            <span>
                                {labelFormatter(
                                    row?._id ||
                                    row?.date
                                )}
                            </span>
                        </div>
                    );
                }
            )}

        </div>
    );
}

export default function AdminReports({
    reports,
}) {
    const data =
        getReportData(reports);

    const roles =
        data?.roleBreakdown ||
        data?.roles ||
        [];

    const roleTotal =
        roles.reduce(
            (sum, role) =>
                sum +
                (Number(
                    role?.total
                ) || 0),
            0
        ) || 1;

    const completion =
        data?.profileCompletion ||
        data?.completion ||
        {
            complete: 0,
            incomplete: 0,
        };

    const complete =
        Number(
            completion?.complete
        ) || 0;

    const incomplete =
        Number(
            completion?.incomplete
        ) || 0;

    const total =
        complete +
            incomplete || 1;

    const completionPercent =
        Math.round(
            (complete / total) *
                100
        );

    return (
        <section className="admin-reports">

            <article className="admin-report-block admin-report-wide">

                <div className="admin-block-heading">
                    <p className="admin-eyebrow">
                        MEMBER GROWTH
                    </p>

                    <h2>
                        New accounts over time
                    </h2>
                </div>

                <BarChart
                    rows={
                        data?.userGrowth ||
                        data?.memberGrowth ||
                        []
                    }
                    labelFormatter={
                        labelMonth
                    }
                />

            </article>

            <article className="admin-report-block">

                <div className="admin-block-heading">
                    <p className="admin-eyebrow">
                        COMMUNITY MIX
                    </p>

                    <h2>
                        Members by role
                    </h2>
                </div>

                <div className="admin-role-report">

                    {roles.map(
                        (role) => (
                            <div
                                key={
                                    role?._id
                                }
                            >
                                <span
                                    className={`admin-role-dot ${
                                        role?._id ||
                                        ""
                                    }`}
                                />

                                <p>
                                    <strong>
                                        {role?._id ||
                                            "Unassigned"}
                                    </strong>

                                    <span>
                                        {Math.round(
                                            ((Number(
                                                role?.total
                                            ) ||
                                                0) /
                                                roleTotal) *
                                                100
                                        )}
                                        % ·{" "}
                                        {role?.total ||
                                            0}{" "}
                                        members
                                    </span>
                                </p>
                            </div>
                        )
                    )}

                    {!roles.length && (
                        <p className="admin-empty">
                            No role data available yet.
                        </p>
                    )}

                </div>

            </article>

            <article className="admin-report-block">

                <div className="admin-block-heading">
                    <p className="admin-eyebrow">
                        PROFILE READINESS
                    </p>

                    <h2>
                        Discovery-ready members
                    </h2>
                </div>

                <div className="admin-completion-report">

                    <strong>
                        {completionPercent}%
                    </strong>

                    <p>
                        of community profiles
                        are complete
                    </p>

                    <div>
                        <i
                            style={{
                                width: `${completionPercent}%`,
                            }}
                        />
                    </div>

                    <span>
                        {complete} complete ·{" "}
                        {incomplete} in progress
                    </span>

                </div>

            </article>

            <article className="admin-report-block admin-report-wide">

                <div className="admin-block-heading">
                    <p className="admin-eyebrow">
                        MESSAGE ACTIVITY
                    </p>

                    <h2>
                        Last seven days
                    </h2>
                </div>

                <BarChart
                    rows={
                        data?.messageActivity ||
                        data?.messagesByDay ||
                        []
                    }
                    labelFormatter={
                        labelDay
                    }
                />

            </article>

            <article className="admin-report-block admin-top-skills">

                <div className="admin-block-heading">
                    <p className="admin-eyebrow">
                        SKILLS IN DEMAND
                    </p>

                    <h2>
                        Most shared expertise
                    </h2>
                </div>

                <ol>
                    {(data?.topSkills ||
                        []).map(
                        (
                            skill,
                            index
                        ) => (
                            <li
                                key={
                                    skill?._id ||
                                    index
                                }
                            >
                                <span>
                                    {String(
                                        index +
                                            1
                                    ).padStart(
                                        2,
                                        "0"
                                    )}
                                </span>

                                <strong>
                                    {skill?._id ||
                                        "Unknown skill"}
                                </strong>

                                <em>
                                    {skill?.total ||
                                        0}{" "}
                                    mentors
                                </em>
                            </li>
                        )
                    )}
                </ol>

                {!data?.topSkills
                    ?.length && (
                    <p className="admin-empty">
                        Skills will appear as
                        mentors complete their
                        profiles.
                    </p>
                )}

            </article>

        </section>
    );
}