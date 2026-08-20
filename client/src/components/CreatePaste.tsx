import React, { useState } from 'react';
import { Send, Lock, Flame, EyeOff, ShieldCheck, Copy, Check, Key } from 'lucide-react';
import { CreatePastePayload, Paste } from '../types';
import { authenticatedFetch } from '../auth';

interface CreatePasteProps {
  onPasteCreated: (paste: Paste) => void;
}

const LANGUAGES = [
  { id: 'plaintext', name: 'Plain Text' },
  { id: 'javascript', name: 'JavaScript' },
  { id: 'python', name: 'Python' },
  { id: 'java', name: 'Java' },
  { id: 'cpp', name: 'C / C++' },
  { id: 'html', name: 'HTML' },
  { id: 'sql', name: 'SQL' },
];

const EXPIRATIONS = [
  { id: 'never', name: 'Never Expire' },
  { id: '10m', name: '10 Minutes' },
  { id: '1h', name: '1 Hour' },
  { id: '1d', name: '1 Day' },
  { id: '1w', name: '1 Week' },
  { id: '1m', name: '1 Month' },
];

export const CreatePaste: React.FC<CreatePasteProps> = ({ onPasteCreated }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [customId, setCustomId] = useState('');
  const [language, setLanguage] = useState('plaintext');
  const [ttl, setTtl] = useState('never');
  const [isPrivate, setIsPrivate] = useState(false);
  const [burnAfterReading, setBurnAfterReading] = useState(false);
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdResult, setCreatedResult] = useState<Paste | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!content.trim()) {
      setError('Snippet content cannot be empty.');
      return;
    }

    setLoading(true);
    setError(null);

    const payload: CreatePastePayload = {
      title: title.trim(),
      content,
      language,
      ttl,
      is_private: isPrivate,
      burn_after_reading: burnAfterReading,
      password: password ? password.trim() : undefined,
      custom_id: customId ? customId.trim() : undefined,
    };

    try {
      const response = await authenticatedFetch('/api/pastes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // Use text() first to safely handle empty or non-JSON responses
      const raw = await response.text();
      if (!raw || raw.trim() === '') {
        throw new Error('No response from server. Make sure the backend is running on port 4000.');
      }

      let data: any;
      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error('Unexpected server response. Is the backend running?');
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create snippet.');
      }

      setCreatedResult(data.paste);
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating the paste.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, isToken = false) => {
    navigator.clipboard.writeText(text);
    if (isToken) {
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  if (createdResult) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.75rem'
          }}>
            <ShieldCheck size={28} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Snippet Created Successfully!</h2>
          <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Your paste is live and ready to be shared.
          </p>
        </div>

        <div className="form-group">
          <label className="form-label">Share URL</label>
          <div className="flex-gap">
            <input className="form-input" readOnly value={createdResult.url || window.location.origin + '/paste/' + createdResult.id} />
            <button
              className="btn btn-primary"
              onClick={() => copyToClipboard(createdResult.url || window.location.origin + '/paste/' + createdResult.id)}
            >
              {copiedLink ? <Check size={16} /> : <Copy size={16} />}
              {copiedLink ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Secret Deletion Token</label>
          <div className="flex-gap">
            <input className="form-input" readOnly value={createdResult.delete_token || ''} />
            <button
              className="btn btn-secondary"
              onClick={() => copyToClipboard(createdResult.delete_token || '', true)}
            >
              {copiedToken ? <Check size={16} /> : <Key size={16} />}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', justifyContent: 'center' }}>
          <button
            className="btn btn-primary"
            onClick={() => onPasteCreated(createdResult)}
          >
            View Created Snippet
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setCreatedResult(null);
              setContent('');
              setTitle('');
              setCustomId('');
              setPassword('');
            }}
          >
            Create Another Snippet
          </button>
        </div>
      </div>
    );
  }

  const handleContentKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const tabSpaces = '    ';

      const newContent = content.substring(0, start) + tabSpaces + content.substring(end);
      setContent(newContent);

      requestAnimationFrame(() => {
        target.selectionStart = target.selectionEnd = start + tabSpaces.length;
      });
    }
  };

  return (
    <div className="card">
      <div style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>New Code or Text Snippet</h2>
        <p className="text-muted" style={{ fontSize: '0.875rem' }}>
          Paste text or code to create a shareable snippet.
        </p>
      </div>

      {error && (
        <div style={{
          backgroundColor: 'var(--danger-light)',
          color: 'var(--danger)',
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '1rem',
          fontSize: '0.875rem',
          border: '1px solid #FCA5A5'
        }}>
          {error}
        </div>
      )}

      {/* Hidden honeypot inputs to defeat browser autofill on optional password field */}
      <div style={{ display: 'none' }} aria-hidden="true">
        <input type="text" name="username" tabIndex={-1} />
        <input type="password" name="password" tabIndex={-1} />
      </div>
      <form onSubmit={handleSubmit} autoComplete="off">
        <div className="grid-2" style={{ marginBottom: '1rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <input
              type="text"
              className="form-input"
              placeholder="Title (e.g. notes.txt or main.py)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <input
              type="text"
              className="form-input"
              placeholder="Custom URL Slug (e.g. my-config)"
              value={customId}
              onChange={(e) => setCustomId(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <textarea
            className="form-textarea code-textarea"
            placeholder="// Type or paste your code or text here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleContentKeyDown}
            required
          />
        </div>

        <div className="grid-2" style={{ marginBottom: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Language</label>
            <select
              className="form-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              {LANGUAGES.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Expiration Time</label>
            <select
              className="form-select"
              value={ttl}
              onChange={(e) => setTtl(e.target.value)}
            >
              {EXPIRATIONS.map((exp) => (
                <option key={exp.id} value={exp.id}>{exp.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Security & Access Controls */}
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          padding: '1.25rem',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-color)',
          marginBottom: '1.5rem'
        }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Lock size={16} className="text-emerald" /> Security Options
          </h4>

          <div className="grid-3">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
              <input
                type="checkbox"
                checked={burnAfterReading}
                onChange={(e) => setBurnAfterReading(e.target.checked)}
              />
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Flame size={15} style={{ color: burnAfterReading ? 'var(--danger)' : 'inherit' }} />
                Burn after reading (Self-destruct)
              </span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
              />
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <EyeOff size={15} /> Unlisted (Hide from Explore)
              </span>
            </label>

            <div>
              <input
                type="password"
                className="form-input"
                name="paste-optional-pw-xk9"
                placeholder="Optional password (leave blank for public)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                style={{ padding: '0.4rem 0.65rem', fontSize: '0.85rem' }}
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            <Send size={16} />
            {loading ? 'Creating...' : 'Create Snippet'}
          </button>
        </div>
      </form>
    </div>
  );
};
