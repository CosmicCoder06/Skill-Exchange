import { useEffect, useMemo, useState } from "react";

import AdminOverview from "../../Components/admin/AdminOverview";
import AdminReports from "../../Components/admin/AdminReports";
import AdminSidebar from "../../Components/admin/AdminSidebar";
import AdminUserTable from "../../Components/admin/AdminUserTable";

import {
    getAdminOverview,
    getAdminReports,
    getAdminUsers,
    updateAdminUser,
    deleteAdminUser,
    removeAdminUserPhoto,
} from "../../services/adminService";

import "./admin.css";

function getTokenPayload(token) {
    try {
        if (!token) return null;

        const part = token.split(".")[1];
        if (!part) return null;

        const normalized = part
            .replace(/-/g, "+")
            .replace(/_/g, "/");

        return JSON.parse(atob(normalized));
    } catch {
        return null;
    }
}

function getAdminName(token) {
    const payload = getTokenPayload(token);

    return (
        payload?.name ||
        payload?.user?.name ||
        payload?.username ||
        "Administrator"
    );
}

function getAdminId(token) {
    const payload = getTokenPayload(token);

    return (
        payload?.id ||
        payload?._id ||
        payload?.user?.id ||
        payload?.user?._id ||
        null
    );
}

export default function AdminPage({ token, onLogout })  {
    const [activeSection, setActiveSection] =
        useState("overview");

    const [overview, setOverview] = useState(null);
    const [users, setUsers] = useState([]);
    const [reports, setReports] = useState(null);

    const [loading, setLoading] = useState(true);
    const [sectionLoading, setSectionLoading] =
        useState(false);

    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [statusFilter, setStatusFilter] =
        useState("all");

    const [busyUserId, setBusyUserId] =
        useState(null);

    const adminName = useMemo(
        () => getAdminName(token),
        [token]
    );

    const adminId = useMemo(
        () => getAdminId(token),
        [token]
    );

    async function loadOverview() {
        try {
            setLoading(true);
            setError("");

            const result =
                await getAdminOverview(token);

            setOverview(result);
        } catch (err) {
            console.error(
                "Admin overview error:",
                err
            );

            setError(
                err?.message ||
                    "Unable to load admin overview."
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (!token) return;

        // The function performs remote data loading
        // and updates component state.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadOverview();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    useEffect(() => {
        let mounted = true;

        async function loadSection() {
            try {
                setSectionLoading(true);
                setError("");

                if (activeSection === "members") {
                    const result =
                        await getAdminUsers(token);

                    if (!mounted) return;

                    const userList =
                        Array.isArray(result)
                            ? result
                            : Array.isArray(
                                result?.users
                            )
                                ? result.users
                                : Array.isArray(
                                    result?.data?.users
                                )
                                    ? result.data.users
                                    : Array.isArray(
                                        result?.data
                                    )
                                        ? result.data
                                        : [];

                    setUsers(userList);
                }

                if (activeSection === "reports") {
                    const result =
                        await getAdminReports(token);

                    if (mounted) {
                        setReports(result);
                    }
                }
            } catch (err) {
                console.error(
                    "Admin section error:",
                    err
                );

                if (mounted) {
                    setError(
                        err?.message ||
                            "Unable to load this section."
                    );
                }
            } finally {
                if (mounted) {
                    setSectionLoading(false);
                }
            }
        }

        if (
            activeSection === "members" ||
            activeSection === "reports"
        ) {
            loadSection();
        }

        return () => {
            mounted = false;
        };
    }, [activeSection, token]);

    const filteredUsers = useMemo(() => {
        const query = search
            .trim()
            .toLowerCase();

        return users.filter((user) => {
            const name =
                user?.name?.toLowerCase() || "";

            const email =
                user?.email?.toLowerCase() || "";

            const matchesSearch =
                !query ||
                name.includes(query) ||
                email.includes(query);

            const matchesRole =
                roleFilter === "all" ||
                user?.role === roleFilter;

            const active =
                user?.isActive !== false;

            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "active" &&
                    active) ||
                (statusFilter === "suspended" &&
                    !active);

            return (
                matchesSearch &&
                matchesRole &&
                matchesStatus
            );
        });
    }, [
        users,
        search,
        roleFilter,
        statusFilter,
    ]);

    async function handleUpdateUser(
        userId,
        updates
    ) {
        try {
            setBusyUserId(userId);
            setError("");

            const result =
                await updateAdminUser(
                    token,
                    userId,
                    updates
                );

            const updated =
                result?.user ||
                result?.data?.user ||
                result;

            setUsers((current) =>
                current.map((user) =>
                    String(user._id) ===
                    String(userId)
                        ? {
                            ...user,
                            ...updated,
                        }
                        : user
                )
            );

            await loadOverview();
        } catch (err) {
            console.error(
                "Update admin user error:",
                err
            );

            setError(
                err?.message ||
                    "Unable to update member."
            );
        } finally {
            setBusyUserId(null);
        }
    }

    async function handleDeleteUser(user) {
        const confirmed =
            window.confirm(
                `Delete ${
                    user?.name ||
                    "this member"
                } permanently?\n\nThis action cannot be undone.`
            );

        if (!confirmed) return;

        try {
            setBusyUserId(user._id);
            setError("");

            await deleteAdminUser(
                token,
                user._id
            );

            setUsers((current) =>
                current.filter(
                    (item) =>
                        String(item._id) !==
                        String(user._id)
                )
            );

            await loadOverview();
        } catch (err) {
            console.error(
                "Delete admin user error:",
                err
            );

            setError(
                err?.message ||
                    "Unable to delete member."
            );
        } finally {
            setBusyUserId(null);
        }
    }

    async function handleRemovePhoto(
        user,
        reason
    ) {
        try {
            setBusyUserId(user._id);
            setError("");

            await removeAdminUserPhoto(
                token,
                user._id,
                reason
            );

            setUsers((current) =>
                current.map((item) =>
                    String(item._id) ===
                    String(user._id)
                        ? {
                            ...item,
                            avatarUrl: "",
                            profilePhoto: "",
                            profileImage: "",
                        }
                        : item
                )
            );

            await loadOverview();
        } catch (err) {
            console.error(
                "Remove profile photo error:",
                err
            );

            setError(
                err?.message ||
                    "Unable to remove profile photo."
            );

            throw err;
        } finally {
            setBusyUserId(null);
        }
    }

    const sectionMeta = {
        overview: {
            eyebrow: "ADMIN WORKSPACE",
            title: "Platform overview",
            description:
                "Keep an eye on the people, activity and health of your SkillExchange community.",
        },

        members: {
            eyebrow: "MEMBER MANAGEMENT",
            title: "Community members",
            description:
                "Review accounts, profile photos and access without touching the learner experience.",
        },

        reports: {
            eyebrow: "PLATFORM INSIGHTS",
            title: "Reports & analytics",
            description:
                "Understand growth, participation and the skills being shared across the platform.",
        },
    };

    const meta =
        sectionMeta[activeSection] ||
        sectionMeta.overview;

    return (
        <main className="admin-page">
            <AdminSidebar
                activeSection={activeSection}
                onSectionChange={
                    setActiveSection
                }
                onLogout={onLogout}
            />

            <section className="admin-workspace">
                <header className="admin-header">
                    <div className="admin-heading">
                        <p className="admin-eyebrow">
                            {meta.eyebrow}
                        </p>

                        <h1>{meta.title}</h1>

                        <p className="admin-description">
                            {meta.description}
                        </p>
                    </div>

                    <div className="admin-header-user">
                        <div className="admin-avatar">
                            {adminName
                                .charAt(0)
                                .toUpperCase()}
                        </div>

                        <div>
                            <strong>
                                {adminName}
                            </strong>

                            <span>
                                Administrator
                            </span>
                        </div>
                    </div>
                </header>

                {error && (
                    <div className="admin-error">
                        <span>!</span>

                        <p>{error}</p>

                        <button
                            type="button"
                            onClick={() =>
                                setError("")
                            }
                        >
                            ×
                        </button>
                    </div>
                )}

                {loading &&
                    activeSection ===
                        "overview" && (
                        <div className="admin-loading">
                            <div className="admin-spinner" />

                            <p>
                                Loading platform data...
                            </p>
                        </div>
                    )}

                {!loading &&
                    activeSection ===
                        "overview" && (
                        <AdminOverview
                            overview={overview}
                            onOpenUsers={() =>
                                setActiveSection(
                                    "members"
                                )
                            }
                            onOpenReports={() =>
                                setActiveSection(
                                    "reports"
                                )
                            }
                        />
                    )}

                {activeSection ===
                    "members" &&
                    (sectionLoading ? (
                        <div className="admin-loading">
                            <div className="admin-spinner" />

                            <p>
                                Loading members...
                            </p>
                        </div>
                    ) : (
                        <section className="admin-content-section">
                            <div className="admin-section-heading">
                                <div>
                                    <p className="admin-eyebrow">
                                        {
                                            filteredUsers.length
                                        }{" "}
                                        MEMBERS
                                    </p>

                                    <h2>
                                        Manage community
                                    </h2>
                                </div>

                                <button
                                    type="button"
                                    className="admin-outline-button"
                                    onClick={() =>
                                        setActiveSection(
                                            "members"
                                        )
                                    }
                                >
                                    ↻ Refresh
                                </button>
                            </div>

                            <div className="admin-users-panel">
                                <div className="admin-users-toolbar">
                                    <label className="admin-search">
                                        <span>⌕</span>

                                        <input
                                            type="search"
                                            placeholder="Search by name or email..."
                                            value={
                                                search
                                            }
                                            onChange={(
                                                e
                                            ) =>
                                                setSearch(
                                                    e
                                                        .target
                                                        .value
                                                )
                                            }
                                        />
                                    </label>

                                    <select
                                        value={
                                            roleFilter
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            setRoleFilter(
                                                e
                                                    .target
                                                    .value
                                            )
                                        }
                                    >
                                        <option value="all">
                                            All roles
                                        </option>

                                        <option value="learner">
                                            Learners
                                        </option>

                                        <option value="mentor">
                                            Mentors
                                        </option>

                                        <option value="admin">
                                            Admins
                                        </option>
                                    </select>

                                    <select
                                        value={
                                            statusFilter
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            setStatusFilter(
                                                e
                                                    .target
                                                    .value
                                            )
                                        }
                                    >
                                        <option value="all">
                                            All status
                                        </option>

                                        <option value="active">
                                            Active
                                        </option>

                                        <option value="suspended">
                                            Suspended
                                        </option>
                                    </select>
                                </div>

                                <AdminUserTable
                                    users={
                                        filteredUsers
                                    }
                                    currentUserId={
                                        adminId
                                    }
                                    busyUserId={
                                        busyUserId
                                    }
                                    onUpdate={
                                        handleUpdateUser
                                    }
                                    onDelete={
                                        handleDeleteUser
                                    }
                                    onRemovePhoto={
                                        handleRemovePhoto
                                    }
                                />
                            </div>
                        </section>
                    ))}

                {activeSection ===
                    "reports" &&
                    (sectionLoading ? (
                        <div className="admin-loading">
                            <div className="admin-spinner" />

                            <p>
                                Loading analytics...
                            </p>
                        </div>
                    ) : (
                        <AdminReports
                            reports={reports}
                        />
                    ))}
            </section>
        </main>
    );
}
// @teamcosmiccoders
