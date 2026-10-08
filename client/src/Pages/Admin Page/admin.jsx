import { useEffect, useMemo, useState } from "react";

import AdminOverview from "../../Components/admin/AdminOverview";
import AdminReports from "../../Components/admin/AdminReports";
import AdminSidebar from "../../Components/admin/AdminSidebar";
import AdminUserTable from "../../Components/admin/AdminUserTable";
import AdminPayments from "../../Components/admin/AdminPayments";
import AdminUserProfile from "../../Components/admin/AdminUserProfile";
import AdminSessions from "../../Components/admin/AdminSessions";
import ProfilePage from "../Profile Page/ProfilePage";
import CompleteProfile from "../Profile Page/CompleteProfile";

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

export default function AdminPage({ token, onLogout }) {
    const [activeSection, setActiveSection] = useState("overview");
    const [viewingUserId, setViewingUserId] = useState(null);
    const [toast, setToast] = useState(null);

    const [overview, setOverview] = useState(null);
    const [users, setUsers] = useState([]);
    const [reports, setReports] = useState(null);

    const [loading, setLoading] = useState(true);
    const [sectionLoading, setSectionLoading] = useState(false);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");

    const [busyUserId, setBusyUserId] = useState(null);

    const adminName = useMemo(() => getAdminName(token), [token]);
    const adminId = useMemo(() => getAdminId(token), [token]);

    function showToast(message, type = "success") {
        setToast({ message, type });
        setTimeout(() => {
            setToast((current) => (current?.message === message ? null : current));
        }, 4000);
    }

    function handleSectionChange(section, userId = null) {
        setActiveSection(section);
        if (section === "view-user" && userId) {
            setViewingUserId(userId);
            window.history.pushState(null, "", `/admin/users/${userId}`);
        } else if (section === "overview") {
            window.history.pushState(null, "", "/admin");
        } else {
            window.history.pushState(null, "", `/admin/${section}`);
        }
    }

    // URL router synchronization for direct links and browser back/forward
    useEffect(() => {
        function handleLocation() {
            const path = window.location.pathname;
            const match = path.match(/\/admin\/users\/([a-zA-Z0-9]+)/);
            if (match && match[1]) {
                setViewingUserId(match[1]);
                setActiveSection("view-user");
            } else if (path === "/admin/sessions") {
                setActiveSection("sessions");
            } else if (path === "/admin/payments") {
                setActiveSection("payments");
            } else if (path === "/admin/members") {
                setActiveSection("members");
            } else if (path === "/admin/profile") {
                setActiveSection("profile");
            }
        }

        handleLocation();
        window.addEventListener("popstate", handleLocation);
        return () => window.removeEventListener("popstate", handleLocation);
    }, []);

    async function loadOverview() {
        try {
            setLoading(true);
            setError("");

            const result = await getAdminOverview(token);
            setOverview(result);
        } catch (err) {
            console.error("Admin overview error:", err);
            setError(err?.message || "Unable to load admin overview.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (!token) return;
        loadOverview();
    }, [token]);

    async function loadUsers() {
        try {
            setSectionLoading(true);
            setError("");

            const result = await getAdminUsers(token, {
                search,
                role: roleFilter,
                status: statusFilter,
            });

            const userList = Array.isArray(result)
                ? result
                : Array.isArray(result?.users)
                ? result.users
                : Array.isArray(result?.data)
                ? result.data
                : [];

            setUsers(userList);
        } catch (err) {
            console.error("Admin users error:", err);
            setError(err?.message || "Unable to load community members.");
        } finally {
            setSectionLoading(false);
        }
    }

    async function loadReports() {
        try {
            setSectionLoading(true);
            setError("");

            const result = await getAdminReports(token);
            setReports(result);
        } catch (err) {
            console.error("Admin reports error:", err);
            setError(err?.message || "Unable to load reports.");
        } finally {
            setSectionLoading(false);
        }
    }

    useEffect(() => {
        if (!token) return;

        if (activeSection === "members") {
            loadUsers();
        }

        if (activeSection === "reports") {
            loadReports();
        }
    }, [activeSection, token]);

    useEffect(() => {
        if (!token || activeSection !== "members") return;

        const timer = setTimeout(() => {
            loadUsers();
        }, 300);

        return () => clearTimeout(timer);
    }, [search, roleFilter, statusFilter]);

    const filteredUsers = useMemo(() => {
        const query = search.trim().toLowerCase();

        return users.filter((user) => {
            // Exclude current admin
            if (adminId && String(user._id) === String(adminId)) {
                return false;
            }

            const matchesSearch =
                !query ||
                user.name?.toLowerCase().includes(query) ||
                user.email?.toLowerCase().includes(query);

            const matchesRole =
                roleFilter === "all" ||
                user.role?.toLowerCase() === roleFilter.toLowerCase();

            const isSuspended = user.isActive === false;

            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "active" && !isSuspended) ||
                (statusFilter === "suspended" && isSuspended);

            return matchesSearch && matchesRole && matchesStatus;
        });
    }, [users, search, roleFilter, statusFilter, adminId]);

    async function handleUpdateUser(userId, updates) {
        try {
            setBusyUserId(userId);
            setError("");

            const result = await updateAdminUser(token, userId, updates);

            const updated =
                result?.user ||
                result?.data?.user ||
                result;

            setUsers((current) =>
                current.map((user) =>
                    String(user._id) === String(userId)
                        ? {
                            ...user,
                            ...updated,
                        }
                        : user
                )
            );

            showToast(result?.message || "Member updated successfully", "success");
            await loadOverview();
        } catch (err) {
            console.error("Update admin user error:", err);
            setError(err?.message || "Unable to update member.");
            showToast(err?.message || "Unable to update member.", "error");
        } finally {
            setBusyUserId(null);
        }
    }

    async function handleDeleteUser(user) {
        const confirmed = window.confirm(
            `Delete ${
                user?.name || "this member"
            } permanently?\n\nThis action cannot be undone.`
        );

        if (!confirmed) return;

        try {
            setBusyUserId(user._id);
            setError("");

            await deleteAdminUser(token, user._id);

            setUsers((current) =>
                current.filter(
                    (item) => String(item._id) !== String(user._id)
                )
            );

            showToast("Member deleted successfully", "success");
            await loadOverview();
        } catch (err) {
            console.error("Delete admin user error:", err);
            setError(err?.message || "Unable to delete member.");
            showToast(err?.message || "Unable to delete member.", "error");
        } finally {
            setBusyUserId(null);
        }
    }

    async function handleRemovePhoto(user, reason) {
        try {
            setBusyUserId(user._id);
            setError("");

            await removeAdminUserPhoto(token, user._id, reason);

            setUsers((current) =>
                current.map((item) =>
                    String(item._id) === String(user._id)
                        ? {
                            ...item,
                            avatarUrl: "",
                            profilePhoto: "",
                            profileImage: "",
                        }
                        : item
                )
            );

            showToast("Profile photo removed successfully", "success");
            await loadOverview();
        } catch (err) {
            console.error("Remove profile photo error:", err);
            setError(err?.message || "Unable to remove profile photo.");
            showToast(err?.message || "Unable to remove profile photo.", "error");
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
                "Review accounts, update permissions and keep the community trusted and secure.",
        },
        reports: {
            eyebrow: "REPORTS & ANALYTICS",
            title: "Platform analytics",
            description:
                "Understand growth, participation and the skills being shared across the platform.",
        },
        payments: {
            eyebrow: "PAYMENT OPERATIONS",
            title: "Payments & Payouts",
            description:
                "Verify submitted UPI payments, manage mentor payouts and process booking refunds.",
        },
        sessions: {
            eyebrow: "SESSION MONITORING",
            title: "Platform sessions",
            description:
                "Review scheduled sessions, booking statuses, and session meeting links.",
        },
        profile: {
            eyebrow: "ADMIN PROFILE",
            title: "My profile",
            description:
                "View and edit your administrator profile details and avatar.",
        },
        "edit-profile": {
            eyebrow: "ADMIN PROFILE",
            title: "Edit profile",
            description:
                "Update your administrator details, profile photo, and bio.",
        },
        "view-user": {
            eyebrow: "MEMBER DOSSIER",
            title: "User Profile",
            description:
                "Comprehensive member details, activity records, and session history.",
        },
    };

    const meta = sectionMeta[activeSection] || sectionMeta.overview;

    return (
        <main className="admin-page">
            {toast && (
                <div className={`admin-toast-banner ${toast.type}`}>
                    <span className="toast-icon">{toast.type === "success" ? "✓" : "⚠"}</span>
                    <span className="toast-message">{toast.message}</span>
                    <button type="button" className="toast-close" onClick={() => setToast(null)}>×</button>
                </div>
            )}

            <AdminSidebar
                activeSection={activeSection}
                onSectionChange={handleSectionChange}
                onLogout={onLogout}
            />

            <section className="admin-workspace">
                {activeSection !== "profile" && activeSection !== "edit-profile" && (
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
                                {adminName.charAt(0).toUpperCase()}
                            </div>

                            <div>
                                <strong>{adminName}</strong>
                                <span>Administrator</span>
                            </div>
                        </div>
                    </header>
                )}

                {error && (
                    <div className="admin-error">
                        <span>!</span>
                        <p>{error}</p>
                        <button type="button" onClick={() => setError("")}>×</button>
                    </div>
                )}

                {activeSection === "overview" && (
                    loading ? (
                        <div className="admin-loading">
                            <div className="admin-spinner" />
                            <p>Loading platform data...</p>
                        </div>
                    ) : (
                        <AdminOverview
                            overview={overview}
                            token={token}
                            onOpenUsers={() => handleSectionChange("members")}
                            onOpenReports={() => handleSectionChange("reports")}
                            onOpenPayments={() => handleSectionChange("payments")}
                            onOpenSessions={() => handleSectionChange("sessions")}
                            onViewUser={(userId) => handleSectionChange("view-user", userId)}
                        />
                    )
                )}

                {activeSection === "members" && (
                    sectionLoading ? (
                        <div className="admin-loading">
                            <div className="admin-spinner" />
                            <p>Loading members...</p>
                        </div>
                    ) : (
                        <section className="admin-content-section">
                            <div className="admin-section-heading">
                                <div>
                                    <p className="admin-eyebrow">
                                        {filteredUsers.length} MEMBERS
                                    </p>
                                    <h2>Manage community</h2>
                                </div>

                                <button
                                    type="button"
                                    className="admin-outline-button"
                                    onClick={() => loadUsers()}
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
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                        />
                                    </label>

                                    <select
                                        value={roleFilter}
                                        onChange={(e) => setRoleFilter(e.target.value)}
                                    >
                                        <option value="all">All roles</option>
                                        <option value="learner">Learners</option>
                                        <option value="mentor">Mentors</option>
                                        <option value="admin">Admins</option>
                                    </select>

                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                    >
                                        <option value="all">All status</option>
                                        <option value="active">Active</option>
                                        <option value="suspended">Suspended</option>
                                    </select>
                                </div>

                                <AdminUserTable
                                    users={filteredUsers}
                                    currentUserId={adminId}
                                    busyUserId={busyUserId}
                                    onUpdate={handleUpdateUser}
                                    onDelete={handleDeleteUser}
                                    onRemovePhoto={handleRemovePhoto}
                                    onViewUser={(userId) => handleSectionChange("view-user", userId)}
                                />
                            </div>
                        </section>
                    )
                )}

                {activeSection === "view-user" && (
                    <AdminUserProfile
                        userId={viewingUserId}
                        token={token}
                        onBack={() => handleSectionChange("members")}
                        onUserDeleted={() => {
                            handleSectionChange("members");
                            loadUsers();
                            loadOverview();
                            showToast("Member deleted successfully", "success");
                        }}
                        onToast={showToast}
                    />
                )}

                {activeSection === "payments" && (
                    <AdminPayments token={token} />
                )}

                {activeSection === "sessions" && (
                    <AdminSessions
                        token={token}
                        onViewUser={(userId) => handleSectionChange("view-user", userId)}
                    />
                )}

                {activeSection === "reports" && (
                    sectionLoading ? (
                        <div className="admin-loading">
                            <div className="admin-spinner" />
                            <p>Loading analytics...</p>
                        </div>
                    ) : (
                        <AdminReports reports={reports} />
                    )
                )}

                {activeSection === "profile" && (
                    <div className="admin-profile-container">
                        <div style={{ marginBottom: "16px" }}>
                            <button
                                type="button"
                                className="admin-outline-button"
                                onClick={() => handleSectionChange("overview")}
                            >
                                ← Back to Dashboard
                            </button>
                        </div>
                        <ProfilePage
                            token={token}
                            onCompleteProfile={() => setActiveSection("edit-profile")}
                            onDashboard={() => handleSectionChange("overview")}
                            onLogout={onLogout}
                            onHome={() => handleSectionChange("overview")}
                        />
                    </div>
                )}

                {activeSection === "edit-profile" && (
                    <div className="admin-profile-container">
                        <div style={{ marginBottom: "16px" }}>
                            <button
                                type="button"
                                className="admin-outline-button"
                                onClick={() => setActiveSection("profile")}
                            >
                                ← Back to Profile
                            </button>
                        </div>
                        <CompleteProfile
                            token={token}
                            role="admin"
                            onComplete={() => {
                                showToast("Admin profile updated successfully!", "success");
                                setActiveSection("profile");
                            }}
                            onLater={() => setActiveSection("profile")}
                        />
                    </div>
                )}
            </section>
        </main>
    );
}
