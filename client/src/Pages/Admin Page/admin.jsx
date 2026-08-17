import { useEffect, useMemo, useState } from "react";
import AdminOverview from "../../Components/admin/AdminOverview";
import AdminReports from "../../Components/admin/AdminReports";
import AdminSidebar from "../../Components/admin/AdminSidebar";
import AdminUserTable from "../../Components/admin/AdminUserTable";
import {
  deleteAdminUser,
  fetchAdminOverview,
  fetchAdminReports,
  fetchAdminUsers,
  updateAdminUser,
} from "../../services/adminService";
import "./admin.css";

function getUserId(token) {
  try {
    return JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).id;
  } catch {
    return null;
  }
}

export default function AdminDashboard({ token, onHome, onLogout }) {
  const currentUserId = useMemo(() => getUserId(token), [token]);
  const [activeSection, setActiveSection] = useState("overview");
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyUserId, setBusyUserId] = useState(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    let active = true;
    Promise.all([
      fetchAdminOverview(token),
      fetchAdminUsers(token),
      fetchAdminReports(token),
    ])
      .then(([overviewData, userData, reportData]) => {
        if (!active) return;
        setOverview(overviewData);
        setUsers(userData.users);
        setReports(reportData);
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || "Unable to load the admin portal");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [token]);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch = !term || user.name?.toLowerCase().includes(term) || user.email?.toLowerCase().includes(term);
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const active = user.isActive !== false;
      const matchesStatus = statusFilter === "all" || statusFilter === "active" && active || statusFilter === "suspended" && !active;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [roleFilter, search, statusFilter, users]);

  async function refreshAnalytics() {
    const [nextOverview, nextReports] = await Promise.all([
      fetchAdminOverview(token),
      fetchAdminReports(token),
    ]);
    setOverview(nextOverview);
    setReports(nextReports);
  }

  async function handleUpdate(userId, updates) {
    try {
      setBusyUserId(userId);
      setError("");
      const updated = await updateAdminUser(token, userId, updates);
      setUsers((current) => current.map((user) => user._id === userId ? updated : user));
      setNotice("Member updated successfully");
      await refreshAnalytics();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to update member");
    } finally {
      setBusyUserId(null);
    }
  }

  async function handleDelete(user) {
    if (!window.confirm(`Delete ${user.name}'s account and related chat data? This cannot be undone.`)) return;
    try {
      setBusyUserId(user._id);
      setError("");
      await deleteAdminUser(token, user._id);
      setUsers((current) => current.filter((item) => item._id !== user._id));
      setNotice("Member deleted successfully");
      await refreshAnalytics();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to delete member");
    } finally {
      setBusyUserId(null);
    }
  }

  const sectionTitle = activeSection === "overview" ? "Community overview" : activeSection === "users" ? "Member management" : "Platform reports";
  const sectionDescription = activeSection === "overview" ? "A clear view of how people learn, teach, and connect." : activeSection === "users" ? "Review access, roles, verification, and account status." : "Understand growth, engagement, and the skills being shared.";

  return (
    <main className="admin-page">
      <AdminSidebar activeSection={activeSection} onSectionChange={setActiveSection} onHome={onHome} onLogout={onLogout} />
      <section className="admin-main">
        <header className="admin-topbar">
          <div><p className="admin-eyebrow">SKILL EXCHANGE ADMIN</p><h1>{sectionTitle}</h1><p>{sectionDescription}</p></div>
          <div className="admin-topbar-actions"><button type="button" onClick={onHome}>← Back to app</button><span className="admin-live-badge"><i /> Platform live</span></div>
        </header>

        {error ? <div className="admin-alert error" role="alert">{error}</div> : null}
        {notice ? <div className="admin-alert success" role="status">{notice}<button type="button" onClick={() => setNotice("")} aria-label="Dismiss notification">×</button></div> : null}
        {loading ? <div className="admin-loading"><span /><p>Preparing your admin workspace...</p></div> : null}

        {!loading && activeSection === "overview" ? <AdminOverview overview={overview} onOpenUsers={() => setActiveSection("users")} onOpenReports={() => setActiveSection("reports")} /> : null}

        {!loading && activeSection === "users" ? (
          <section className="admin-panel admin-users-panel">
            <div className="admin-users-toolbar">
              <label className="admin-search"><span aria-hidden="true">⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or email" aria-label="Search members" /></label>
              <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} aria-label="Filter by role"><option value="all">All roles</option><option value="learner">Learners</option><option value="mentor">Mentors</option><option value="admin">Admins</option></select>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter by status"><option value="all">All statuses</option><option value="active">Active</option><option value="suspended">Suspended</option></select>
              <span className="admin-result-count">{filteredUsers.length} members</span>
            </div>
            <AdminUserTable users={filteredUsers} currentUserId={currentUserId} busyUserId={busyUserId} onUpdate={handleUpdate} onDelete={handleDelete} />
          </section>
        ) : null}

        {!loading && activeSection === "reports" ? <AdminReports reports={reports} /> : null}
      </section>
    </main>
  );
}
