import React, { useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { Building2, Mail, UserRound, LogOut } from 'lucide-react';
import { supabase, savedDisplayName, workspaceDetails } from '../auth';
import { ApiDocs } from './ApiDocs';

interface ProfileProps {
  user: User;
  onUserUpdated: (user: User) => void;
}

export const Profile: React.FC<ProfileProps> = ({ user, onUserUpdated }) => {
  const existingName = savedDisplayName(user);
  const [name, setName] = useState(existingName || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const email = user.email || '';
  const workspace = workspaceDetails(email);

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
  };

  const saveName = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase || name.trim().length < 2) {
      setError('Please enter at least two characters.');
      return;
    }
    setSaving(true);
    setError(null);
    const { data, error: updateError } = await supabase.auth.updateUser({ data: { display_name: name.trim() } });
    if (updateError || !data.user) setError(updateError?.message || 'Could not save your name.');
    else onUserUpdated(data.user);
    setSaving(false);
  };

  return <div>
    <div className="card" style={{ maxWidth: 720 }}>
      <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.35rem', margin: 0 }}>Profile & settings</h1>
        {!existingName && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleLogout}>
            <LogOut size={14} /> <span>Log out</span>
          </button>
        )}
      </div>
      {!existingName ? (
        <form onSubmit={saveName}>
          <p className="text-muted" style={{ marginBottom: '0.9rem' }}>Welcome! What should we call you?</p>
          {error && <p style={{ color: 'var(--danger)', marginBottom: '0.7rem' }}>{error}</p>}
          <div className="flex-gap"><input className="form-input" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" autoFocus /><button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save name'}</button></div>
        </form>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <UserRound size={19} className="text-emerald" />
              <div>
                <strong>{existingName}</strong>
                <div className="text-muted" style={{ fontSize: '0.875rem' }}>Your profile name</div>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleLogout}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <LogOut size={14} />
              <span>Log out</span>
            </button>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}><Mail size={19} className="text-emerald" /><div><strong>{email}</strong><div className="text-muted" style={{ fontSize: '0.875rem' }}>Verified sign-in email</div></div></div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}><Building2 size={19} className="text-emerald" /><div><strong>{workspace.label}</strong><div className="text-muted" style={{ fontSize: '0.875rem' }}>{workspace.description}</div></div></div>
        </div>
      )}
    </div>
    <section style={{ marginTop: '2rem' }}><h2 style={{ fontSize: '1.15rem', margin: '0 0 0.75rem' }}>API documentation</h2><ApiDocs /></section>
  </div>;
};
