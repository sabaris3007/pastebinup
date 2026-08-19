import React, { useState, useEffect } from 'react';
import { Search, Eye, Clock, FileCode } from 'lucide-react';
import { Paste } from '../types';
import { authenticatedFetch } from '../auth';

interface PasteListProps {
  onSelectPaste: (id: string) => void;
}

export const PasteList: React.FC<PasteListProps> = ({ onSelectPaste }) => {
  const [pastes, setPastes] = useState<Paste[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);

  const fetchPublicPastes = async (searchTerm?: string) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: '1',
        limit: '100',
      });
      const term = searchTerm !== undefined ? searchTerm : search;
      if (term.trim()) queryParams.append('search', term.trim());

      const res = await authenticatedFetch(`/api/pastes?${queryParams.toString()}`);
      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }
      const data = await res.json();

      if (data.success) {
        setPastes(data.pastes);
        setTotal(data.pagination.total || 0);
      }
    } catch (err) {
      console.error('Error fetching pastes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicPastes();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPublicPastes(search);
  };

  const handleSearchClear = () => {
    setSearch('');
    fetchPublicPastes('');
  };

  return (
    <div>
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Explore Public Snippets</h2>
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>
            Discover public pastes and code snippets shared by the community.
            <br />
            Password-protected snippets are not displayed here.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Search by title or snippet content..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
            Search
          </button>
          {search && (
            <button type="button" className="btn btn-secondary" onClick={handleSearchClear} style={{ whiteSpace: 'nowrap' }}>
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Snippets Grid */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p className="text-muted">Loading snippets...</p>
        </div>
      ) : pastes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <FileCode size={36} className="text-muted" style={{ margin: '0 auto 0.75rem' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>No Snippets Found</h3>
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>
            {search ? 'No results for your search. Try different keywords.' : 'Be the first to create a snippet!'}
          </p>
        </div>
      ) : (
        <>
          {total > 0 && (
            <p className="text-muted" style={{ fontSize: '0.825rem', marginBottom: '1rem' }}>
              Showing {pastes.length} of {total} snippet{total !== 1 ? 's' : ''}
              {search && ` matching "${search}"`}
            </p>
          )}
          <div className="grid-3">
            {pastes.map((p) => (
              <div
                key={p.id}
                className="card"
                onClick={() => onSelectPaste(p.id)}
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  marginBottom: 0
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                }}
              >
                <div>
                  <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                    <span className="badge badge-green">{p.language}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                      {p.char_count || 0} chars
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem', wordBreak: 'break-word' }}>
                    {p.title}
                  </h3>
                </div>

                <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Eye size={13} /> {p.views} views
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Clock size={13} /> {new Date(p.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
