const STAT_CARDS = [
  { key: "totalUsers", label: "Total members", helper: "Everyone in the community", tone: "forest" },
  { key: "mentors", label: "Mentors", helper: "People sharing expertise", tone: "mint" },
  { key: "learners", label: "Learners", helper: "People building new skills", tone: "sand" },
  { key: "conversations", label: "Conversations", helper: "Learning connections started", tone: "sky" },
  { key: "messages", label: "Messages", helper: "Knowledge exchanged", tone: "lavender" },
  { key: "completedProfiles", label: "Complete profiles", helper: "Members ready to connect", tone: "rose" },
];

function formatDate(date) {
  return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" }).format(new Date(date));
}

export default function AdminOverview({ overview, onOpenUsers, onOpenReports }) {
  const stats = overview?.stats || {};
  const completionRate = stats.totalUsers
    ? Math.round((stats.completedProfiles / stats.totalUsers) * 100)
    : 0;

  return (
    <>
      <section className="admin-stat-grid" aria-label="Platform statistics">
        {STAT_CARDS.map((card) => (
          <article className={`admin-stat-card ${card.tone}`} key={card.key}>
            <span className="admin-stat-mark" aria-hidden="true">↗</span>
            <strong>{stats[card.key] ?? 0}</strong>
            <h3>{card.label}</h3>
            <p>{card.helper}</p>
          </article>
        ))}
      </section>

      <section className="admin-overview-grid">
        <article className="admin-panel admin-community-panel">
          <div className="admin-panel-heading">
            <div><p className="admin-eyebrow">COMMUNITY HEALTH</p><h2>Participation at a glance</h2></div>
            <button type="button" onClick={onOpenReports}>View reports →</button>
          </div>
          <div className="admin-health-row">
            <div className="admin-progress-ring" style={{ "--progress": `${completionRate * 3.6}deg` }}>
              <span>{completionRate}%</span>
            </div>
            <div>
              <h3>Profile completion</h3>
              <p>{stats.completedProfiles || 0} members have profiles ready for discovery and meaningful exchange.</p>
            </div>
          </div>
          <div className="admin-health-metrics">
            <div><span>Active accounts</span><strong>{stats.activeUsers || 0}</strong></div>
            <div><span>Verified accounts</span><strong>{stats.verifiedUsers || 0}</strong></div>
            <div><span>New this month</span><strong>{stats.newUsers30d || 0}</strong></div>
            <div><span>Active chats</span><strong>{stats.activeConversations30d || 0}</strong></div>
          </div>
        </article>

        <article className="admin-panel">
          <div className="admin-panel-heading">
            <div><p className="admin-eyebrow">NEW MEMBERS</p><h2>Recently joined</h2></div>
            <button type="button" onClick={onOpenUsers}>Manage all →</button>
          </div>
          <div className="admin-recent-list">
            {(overview?.recentUsers || []).map((user) => (
              <div className="admin-recent-user" key={user._id}>
                <span className="admin-member-avatar">{user.name?.slice(0, 1).toUpperCase() || "?"}</span>
                <div><strong>{user.name}</strong><span>{user.email}</span></div>
                <div className="admin-recent-meta"><span className={`admin-role ${user.role}`}>{user.role}</span><time>{formatDate(user.createdAt)}</time></div>
              </div>
            ))}
            {!overview?.recentUsers?.length ? <p className="admin-empty">No members have joined yet.</p> : null}
          </div>
        </article>
      </section>
    </>
  );
}

