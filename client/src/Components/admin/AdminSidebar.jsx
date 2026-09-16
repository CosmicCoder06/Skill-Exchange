import ThemeToggle from '../ThemeToggle';
export default function AdminSidebar({ activeSection, onSectionChange, onLogout }) {
  return <header className="premium-admin-nav">
    <button className="premium-brand" onClick={() => onSectionChange('overview')}><span className="premium-brand-mark">↗</span>SkillExchange <small>ADMIN</small></button>
    <nav aria-label="Admin navigation">{['overview', 'members', 'reports'].map(section => <button key={section} aria-current={activeSection === section ? 'page' : undefined} onClick={() => onSectionChange(section)}>{section[0].toUpperCase() + section.slice(1)}</button>)}</nav>
    <ThemeToggle /><button className="premium-signout" onClick={onLogout}>Log out</button>
  </header>;
}
