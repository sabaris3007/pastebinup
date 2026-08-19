import React from 'react';
import type { User } from '@supabase/supabase-js';
import { Code2, PlusCircle, Globe, UserRound } from 'lucide-react';
import { workspaceDetails } from '../auth';

interface NavbarProps {
  activeTab: 'create' | 'explore' | 'profile';
  setActiveTab: (tab: 'create' | 'explore' | 'profile') => void;
  user?: User | null;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, user }) => {
  const orgName = user?.email ? workspaceDetails(user.email).orgName : null;

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="brand" onClick={() => setActiveTab('create')}>
          <div className="brand-icon">
            <Code2 size={20} />
          </div>
          <span>PasteBin</span>
          {orgName && <span className="brand-tag">{orgName}</span>}
        </div>

        <nav className="nav-links">
          <button
            className={`nav-btn ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            <PlusCircle size={17} />
            <span>New Snippet</span>
          </button>

          <button
            className={`nav-btn ${activeTab === 'explore' ? 'active' : ''}`}
            onClick={() => setActiveTab('explore')}
          >
            <Globe size={17} />
            <span>Explore</span>
          </button>

          <button
            className={`nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <UserRound size={17} />
            <span>Profile</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
