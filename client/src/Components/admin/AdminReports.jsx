function labelMonth(key) {
  const [year, month] = key.split("-").map(Number);
  return new Intl.DateTimeFormat(undefined, { month: "short" }).format(new Date(year, month - 1, 1));
}

function labelDay(key) {
  return new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(new Date(`${key}T00:00:00Z`));
}

function BarChart({ rows, labelFormatter }) {
  const max = Math.max(...rows.map((row) => row.total), 1);
  return (
    <div className="admin-bar-chart">
      {rows.map((row) => (
        <div className="admin-bar-column" key={row._id || row.date}>
          <span className="admin-bar-value">{row.total}</span>
          <div className="admin-bar-track"><i style={{ height: `${Math.max((row.total / max) * 100, row.total ? 8 : 0)}%` }} /></div>
          <span>{labelFormatter(row._id || row.date)}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminReports({ reports }) {
  const roles = reports?.roleBreakdown || [];
  const roleTotal = roles.reduce((sum, role) => sum + role.total, 0) || 1;
  const completion = reports?.profileCompletion || { complete: 0, incomplete: 0 };
  const completionTotal = completion.complete + completion.incomplete || 1;

  return (
    <section className="admin-reports-grid">
      <article className="admin-panel admin-report-wide">
        <div className="admin-panel-heading"><div><p className="admin-eyebrow">MEMBER GROWTH</p><h2>New accounts over time</h2></div></div>
        <BarChart rows={reports?.userGrowth || []} labelFormatter={labelMonth} />
      </article>
      <article className="admin-panel">
        <div className="admin-panel-heading"><div><p className="admin-eyebrow">COMMUNITY MIX</p><h2>Members by role</h2></div></div>
        <div className="admin-role-report">
          {roles.map((role) => <div key={role._id}><span className={`admin-role-dot ${role._id}`} /><p><strong>{role._id || "Unassigned"}</strong><span>{Math.round((role.total / roleTotal) * 100)}% · {role.total} members</span></p></div>)}
        </div>
      </article>
      <article className="admin-panel">
        <div className="admin-panel-heading"><div><p className="admin-eyebrow">PROFILE READINESS</p><h2>Discovery-ready members</h2></div></div>
        <div className="admin-completion-report"><strong>{Math.round((completion.complete / completionTotal) * 100)}%</strong><p>of community profiles are complete</p><div><i style={{ width: `${(completion.complete / completionTotal) * 100}%` }} /></div><span>{completion.complete} complete · {completion.incomplete} in progress</span></div>
      </article>
      <article className="admin-panel admin-report-wide">
        <div className="admin-panel-heading"><div><p className="admin-eyebrow">MESSAGE ACTIVITY</p><h2>Last seven days</h2></div></div>
        <BarChart rows={reports?.messageActivity || []} labelFormatter={labelDay} />
      </article>
      <article className="admin-panel admin-top-skills">
        <div className="admin-panel-heading"><div><p className="admin-eyebrow">SKILLS IN DEMAND</p><h2>Most shared expertise</h2></div></div>
        <ol>{(reports?.topSkills || []).map((skill, index) => <li key={skill._id}><span>{String(index + 1).padStart(2, "0")}</span><strong>{skill._id}</strong><em>{skill.total} mentors</em></li>)}</ol>
        {!reports?.topSkills?.length ? <p className="admin-empty">Skills will appear as mentors complete their profiles.</p> : null}
      </article>
    </section>
  );
}

