import React from 'react';
import type { DangerFilterState } from '../App';

interface SidebarProps {
  filters: DangerFilterState;
  setFilters: React.Dispatch<React.SetStateAction<DangerFilterState>>;
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  user?: any;
}

export const Sidebar: React.FC<SidebarProps> = ({ filters, setFilters, activeTab, setActiveTab, user }) => {
  const toggleFilter = (key: keyof DangerFilterState) => {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const navItems = ['Deliveries', 'Planets', 'Crew', 'Clients'];

  const displayEmail = user?.email || 'Unknown User';
  const displayRole = user?.role ? user.role.toUpperCase() : 'CREW';
  const avatarSeed = displayEmail.split('@')[0];

  return (
    <aside className="sidebar-left">
      <div className="brand">
        <h1 className="brand-title">P. EXPRESS</h1>
        <div className="brand-subtitle">SYSTEM OP / V2.0</div>
      </div>

      <nav className="nav-menu">
        {navItems.map(item => (
          <div 
            key={item}
            className={`nav-item ${activeTab === item ? 'active' : ''}`}
            onClick={() => setActiveTab(item)}
          >
            {item}
          </div>
        ))}
      </nav>

      <div className="filter-section">
        <div className="filter-header">DANGER LEVEL FILTER</div>
        <div className="filter-options">
          <label className="filter-option">
            <input 
              type="checkbox" 
              checked={filters.low}
              onChange={() => toggleFilter('low')}
            />
            <span className="custom-checkbox"></span>
            Low
          </label>
          <label className="filter-option">
            <input 
              type="checkbox" 
              checked={filters.medium}
              onChange={() => toggleFilter('medium')}
            />
            <span className="custom-checkbox"></span>
            Medium / High
          </label>
          <label className="filter-option">
            <input 
              type="checkbox" 
              checked={filters.fatal}
              onChange={() => toggleFilter('fatal')}
            />
            <span className="custom-checkbox"></span>
            Fatal
          </label>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '32px', padding: '16px', background: 'var(--bg-panel)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
        <img 
          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}&backgroundColor=0B0D17`} 
          alt="User Profile" 
          style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid var(--accent-orange)' }}
        />
        <div style={{ overflow: 'hidden' }}>
          <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-main)', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>{displayEmail}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{displayRole}</div>
        </div>
      </div>
    </aside>
  );
};
