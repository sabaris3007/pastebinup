import React, { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { Navbar } from './components/Navbar';
import { CreatePaste } from './components/CreatePaste';
import { ViewPaste } from './components/ViewPaste';
import { PasteList } from './components/PasteList';
import { Login } from './components/Login';
import { Profile } from './components/Profile';
import { Paste } from './types';
import { isLoginConfigured, savedDisplayName, supabase } from './auth';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'create' | 'explore' | 'profile'>('create');
  const [viewPasteId, setViewPasteId] = useState<string | null>(null);
  // Increment every time Explore becomes active to force PasteList to remount & refetch fresh data
  const [exploreKey, setExploreKey] = useState(0);
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
      if (data.session?.user && !savedDisplayName(data.session.user)) setActiveTab('profile');
      setAuthChecked(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user && !savedDisplayName(session.user)) setActiveTab('profile');
      setAuthChecked(true);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // Check URL pathname for direct snippet links (e.g., /paste/a7x9q2)
  useEffect(() => {
    const path = window.location.pathname;
    const match = path.match(/^\/paste\/([a-zA-Z0-9_-]+)$/);
    if (match && match[1]) {
      setViewPasteId(match[1]);
    }

    const handlePopState = () => {
      const p = window.location.pathname;
      const m = p.match(/^\/paste\/([a-zA-Z0-9_-]+)$/);
      if (m && m[1]) {
        setViewPasteId(m[1]);
      } else {
        setViewPasteId(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSelectPaste = (id: string) => {
    setViewPasteId(id);
    window.history.pushState({}, '', `/paste/${id}`);
  };

  const handleBackToExplore = () => {
    setViewPasteId(null);
    setActiveTab('explore');
    setExploreKey((k) => k + 1);
    window.history.pushState({}, '', '/');
  };

  const handleClonePaste = (pasteToClone: Paste) => {
    setViewPasteId(null);
    setActiveTab('create');
    window.history.pushState({}, '', '/');
  };

  const handleSetTab = (tab: 'create' | 'explore' | 'profile') => {
    setViewPasteId(null);
    setActiveTab(tab);
    if (tab === 'explore') {
      setExploreKey((k) => k + 1);
    }
    window.history.pushState({}, '', '/');
  };

  if (!isLoginConfigured) {
    return <main className="main-content"><div className="card">Set the Supabase values in <code>client/.env</code> and <code>server/.env</code> to enable login.</div></main>;
  }

  if (!authChecked) {
    return <main className="main-content"><div className="card">Checking login…</div></main>;
  }

  if (!user) {
    return <main className="main-content"><Login /></main>;
  }

  return (
    <div className="app-container">
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleSetTab}
        user={user}
      />

      <main className="main-content">
        {viewPasteId ? (
          <ViewPaste
            pasteId={viewPasteId}
            onClonePaste={handleClonePaste}
            onBackToExplore={handleBackToExplore}
          />
        ) : activeTab === 'create' ? (
          <CreatePaste
            onPasteCreated={(p) => handleSelectPaste(p.id)}
          />
        ) : activeTab === 'explore' ? (
          <PasteList
            key={exploreKey}
            onSelectPaste={handleSelectPaste}
          />
        ) : <Profile user={user} onUserUpdated={setUser} />}
      </main>

      <footer className="footer">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary)', display: 'inline-block' }}></span>
          <span>PasteBin By Sabari &bull;</span>
        </div>
        <p style={{ color: 'var(--text-subtle)', fontSize: '0.8rem' }}>
          Lightweight snippet sharing platform for text, code, logs, and configs.
        </p>
      </footer>
    </div>
  );
};

export default App;
