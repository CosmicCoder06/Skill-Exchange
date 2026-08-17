function formatDate(date) {
  return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" }).format(new Date(date));
}

export default function AdminUserTable({ users, currentUserId, busyUserId, onUpdate, onDelete }) {
  if (users.length === 0) {
    return <div className="admin-empty-state"><span>⌕</span><h3>No members found</h3><p>Try changing the search or filter.</p></div>;
  }

  return (
    <div className="admin-table-wrap">
      <table className="admin-users-table">
        <thead><tr><th>Member</th><th>Role</th><th>Profile</th><th>Status</th><th>Joined</th><th><span className="sr-only">Actions</span></th></tr></thead>
        <tbody>
          {users.map((user) => {
            const isSelf = String(user._id) === String(currentUserId);
            const busy = busyUserId === user._id;
            const active = user.isActive !== false;
            return (
              <tr key={user._id}>
                <td><div className="admin-member-cell"><span className="admin-member-avatar">{user.name?.slice(0, 1).toUpperCase() || "?"}</span><div><strong>{user.name}</strong><span>{user.email}</span>{isSelf ? <small>You</small> : null}</div></div></td>
                <td>
                  <select aria-label={`Role for ${user.name}`} value={user.role} disabled={busy || isSelf} onChange={(event) => onUpdate(user._id, { role: event.target.value })}>
                    <option value="learner">Learner</option><option value="mentor">Mentor</option><option value="admin">Admin</option>
                  </select>
                </td>
                <td><span className={user.profileCompleted ? "admin-profile-state complete" : "admin-profile-state"}>{user.profileCompleted ? "Complete" : "In progress"}</span></td>
                <td><span className={active ? "admin-account-state active" : "admin-account-state suspended"}>{active ? "Active" : "Suspended"}</span></td>
                <td><time>{formatDate(user.createdAt)}</time></td>
                <td>
                  <div className="admin-row-actions">
                    <button type="button" disabled={busy} onClick={() => onUpdate(user._id, { isVerified: !user.isVerified })}>{user.isVerified ? "Unverify" : "Verify"}</button>
                    <button type="button" disabled={busy || isSelf} onClick={() => onUpdate(user._id, { isActive: !active })}>{active ? "Suspend" : "Activate"}</button>
                    <button type="button" className="danger" disabled={busy || isSelf} onClick={() => onDelete(user)}>Delete</button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

