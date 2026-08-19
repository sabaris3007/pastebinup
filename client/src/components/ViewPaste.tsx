import React, { useState, useEffect, useRef } from 'react';
import {
  Copy, Check, Download, ExternalLink, Flame,
  Eye, Clock, Lock, Trash2, RefreshCw, FileText
} from 'lucide-react';
import { Paste } from '../types';
import { highlightCodeLine } from '../utils/highlighter';
import { authenticatedFetch } from '../auth';

interface ViewPasteProps {
  pasteId: string;
  onClonePaste: (paste: Paste) => void;
  onBackToExplore: () => void;
}

export const ViewPaste: React.FC<ViewPasteProps> = ({ pasteId, onClonePaste, onBackToExplore }) => {
  const [paste, setPaste] = useState<Paste | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isPasswordRequired, setIsPasswordRequired] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [copied, setCopied] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTokenInput, setDeleteTokenInput] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  const lastFetchedIdRef = useRef<string | null>(null);

  const fetchPaste = async (password?: string) => {
    setLoading(true);
    setError(null);
    setPasswordError(null);

    try {
      const headers: Record<string, string> = {};
      if (password) headers['x-paste-password'] = password;

      const res = await authenticatedFetch('/api/pastes/' + pasteId, { headers });

      const raw = await res.text();
      if (!raw || !raw.trim()) {
        throw new Error('No response from server. Check server connection.');
      }
      let data: any;
      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error('Invalid response from server.');
      }

      if (res.status === 401 && data.is_password_protected) {
        setIsPasswordRequired(true);
        if (password) setPasswordError('Incorrect password. Please try again.');
        setLoading(false);
        return;
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Paste not found or has expired.');
      }

      setPaste(data.paste);
      setIsPasswordRequired(false);
    } catch (err: any) {
      setError(err.message || 'Failed to load snippet.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (lastFetchedIdRef.current === pasteId) return;
    lastFetchedIdRef.current = pasteId;
    fetchPaste();
  }, [pasteId]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput.trim()) fetchPaste(passwordInput);
  };

  const handleCopy = () => {
    if (!paste?.content) return;
    navigator.clipboard.writeText(paste.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyUrl = () => {
    const url = window.location.origin + '/paste/' + pasteId;
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleDownload = () => {
    if (!paste?.content) return;
    const extMap: Record<string, string> = {
      javascript: 'js', python: 'py', html: 'html',
      cpp: 'cpp', java: 'java', sql: 'sql', plaintext: 'txt',
    };
    const ext = extMap[paste.language] || 'txt';
    const safeName = paste.title.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'snippet';
    const blob = new Blob([paste.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = safeName + '.' + ext;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteTokenInput.trim()) return;
    setDeleteError(null);
    try {
      const res = await authenticatedFetch('/api/pastes/' + pasteId, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delete_token: deleteTokenInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Invalid deletion token.');
      setDeleteSuccess(true);
      setTimeout(() => onBackToExplore(), 1500);
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete paste.');
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <RefreshCw size={24} className="text-emerald" />
        <p className="text-muted" style={{ marginTop: '0.75rem' }}>Loading snippet...</p>
      </div>
    );
  }

  if (isPasswordRequired) {
    return (
      <div className="card" style={{ maxWidth: '480px', margin: '2rem auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '50%',
            backgroundColor: 'var(--primary-light)', color: 'var(--primary)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '0.5rem'
          }}>
            <Lock size={22} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Password Protected</h3>
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>Enter password to unlock this snippet.</p>
        </div>

        {passwordError && (
          <div style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)', padding: '0.6rem 0.85rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'center' }}>
            {passwordError}
          </div>
        )}

        <form onSubmit={handlePasswordSubmit}>
          <div className="form-group">
            <input
              className="form-input"
              placeholder="Enter password..."
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              autoComplete="off"
              required
              autoFocus
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Unlock Snippet
          </button>
        </form>
      </div>
    );
  }

  if (error || !paste) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <FileText size={40} className="text-muted" style={{ margin: '0 auto 1rem' }} />
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Snippet Not Found</h3>
        <p className="text-muted" style={{ fontSize: '0.9rem', margin: '0.5rem 0 1.5rem' }}>
          {error || 'This snippet may have expired or been deleted.'}
        </p>
        <button className="btn btn-primary" onClick={onBackToExplore}>Back to Snippets</button>
      </div>
    );
  }

  const lines = paste.content ? paste.content.split('\n') : [];

  return (
    <div>
      {paste.burn_after_reading && (
        <div style={{
          backgroundColor: 'var(--danger-light)', color: 'var(--danger)',
          padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-md)',
          marginBottom: '1.25rem', display: 'flex', alignItems: 'center',
          gap: '0.6rem', border: '1px solid #FCA5A5', fontSize: '0.9rem', fontWeight: 600
        }}>
          <Flame size={20} />
          <span>Burn After Read: This snippet will be permanently deleted once you leave this page.</span>
        </div>
      )}

      <div className="card">
        <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700 }}>{paste.title}</h1>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
              <span className="badge badge-green">{paste.language}</span>
              <span className="badge badge-gray" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Eye size={12} /> {paste.views} views
              </span>
              <span className="badge badge-gray" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Clock size={12} /> {new Date(paste.created_at).toLocaleDateString()}
              </span>
              {paste.expires_at && (
                <span className="badge badge-warning">
                  Expires {new Date(paste.expires_at).toLocaleString()}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary btn-sm" onClick={handleCopy}>
              {copied ? <Check size={14} className="text-emerald" /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>

            <button className="btn btn-secondary btn-sm" onClick={handleCopyUrl}>
              {copiedUrl ? <Check size={14} className="text-emerald" /> : <ExternalLink size={14} />}
              {copiedUrl ? 'Link Copied!' : 'Share Link'}
            </button>

            <button className="btn btn-secondary btn-sm" onClick={handleDownload}>
              <Download size={14} /> Download
            </button>

            <button className="btn btn-secondary btn-sm" onClick={() => onClonePaste(paste)}>
              <FileText size={14} /> Clone
            </button>

            <button
              className="btn btn-secondary btn-sm"
              style={{ color: 'var(--danger)' }}
              onClick={() => setShowDeleteModal(true)}
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>

        <div className="code-container">
          <div className="code-header">
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {lines.length} lines &bull; {(paste.content || '').length} chars
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--primary-hover)', fontWeight: 600 }}>
              {paste.language.toUpperCase()}
            </span>
          </div>

          <div style={{ display: 'flex', backgroundColor: '#FFFFFF', overflowX: 'auto' }}>
            <div style={{
              padding: '1.25rem 0.75rem',
              backgroundColor: '#F9FAFB',
              borderRight: '1px solid var(--border-color)',
              color: 'var(--text-subtle)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
              textAlign: 'right',
              userSelect: 'none',
              lineHeight: '1.6',
              minWidth: '3rem'
            }}>
              {lines.map((_, i) => (
                <div key={i} style={{ lineHeight: '1.6' }}>{i + 1}</div>
              ))}
            </div>

            <div style={{
              flex: 1,
              padding: '1.25rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.875rem',
              lineHeight: '1.6',
              overflowX: 'auto'
            }}>
              {lines.map((line, idx) => (
                <div key={idx} style={{ whiteSpace: 'pre', minHeight: '1.6em' }}>
                  {highlightCodeLine(line, paste.language)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--danger)' }}>
              Delete Snippet
            </h3>
            <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
              Enter the deletion token you received when creating this snippet.
            </p>

            {deleteSuccess ? (
              <div style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary-hover)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                Deleted! Redirecting...
              </div>
            ) : (
              <form onSubmit={handleDelete}>
                {deleteError && (
                  <div style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                    {deleteError}
                  </div>
                )}
                <div className="form-group">
                  <input
                    className="form-input"
                    placeholder="Paste deletion token here..."
                    value={deleteTokenInput}
                    onChange={(e) => setDeleteTokenInput(e.target.value)}
                    autoComplete="off"
                    required
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-danger">Delete Snippet</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
