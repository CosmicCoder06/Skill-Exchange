import ThemeToggle from './ThemeToggle';
import { AIExtension } from '../AIExtension';
import { useState } from 'react';
import { Menu, X, ArrowUpRight, LogOut, UserRound, Settings } from 'lucide-react';

export default function TopNavigation({ activePage, onHome, onDiscover, onMessages, onBookings, onProfile, onDashboard, onAccount, onLogout, token, onSelectMentor }) {
  const [expanded, setExpanded] = useState(false);
  const items = [['home', 'Overview', onHome], ['discover', 'Discover', onDiscover], ['bookings', 'Sessions', onBookings], ['chat', 'Messages', onMessages], ['dashboard', 'Dashboard', onDashboard]];
  const go = action => { setExpanded(false); action?.(); };
  return <header className="premium-nav">
    <div className="premium-nav-inner">
      <button className="premium-brand" onClick={() => go(onHome)} aria-label="Skill Exchange home"><span className="premium-brand-mark"><ArrowUpRight size={23} /></span><span>Skill<span className="brand-light">Exchange</span></span></button>
      <button className="premium-menu-toggle" aria-label={expanded ? 'Close navigation' : 'Open navigation'} aria-expanded={expanded} aria-controls="primary-navigation" onClick={() => setExpanded(!expanded)}>{expanded ? <X size={22}/> : <Menu size={22}/>}</button>
      <nav id="primary-navigation" aria-label="Main navigation" className={`premium-links ${expanded ? 'is-open' : ''}`}>
        {items.map(([page, label, action]) => <button key={page} aria-current={(activePage === page || (page === 'dashboard' && activePage.endsWith('dashboard'))) ? 'page' : undefined} onClick={() => go(action)}>{label}</button>)}
      </nav>
      <div className="premium-account">
        <AIExtension token={token} onSelectMentor={onSelectMentor} />
        <button onClick={() => go(onAccount)} aria-label="Account settings" title="Account settings"><Settings size={19}/></button>
        <ThemeToggle />
        <button className="premium-profile" onClick={() => go(onProfile)} aria-label="Your profile" title="Your profile"><UserRound size={19}/></button>
        <button onClick={() => go(onLogout)} aria-label="Log out" title="Log out"><LogOut size={18}/></button>
      </div>
    </div>
  </header>;
}
