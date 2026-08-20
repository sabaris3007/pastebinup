import React, { useState } from 'react';
import { Terminal, Copy, Check, Server } from 'lucide-react';

export const ApiDocs: React.FC = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<'curl' | 'javascript' | 'python'>('curl');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const base = window.location.origin;
  const TOKEN = '<YOUR_TOKEN>';

  const endpoints = [
    {
      method: 'POST', path: '/api/pastes',
      description: 'Create a new snippet within your workspace.',
      params: [
        { name: 'content', type: 'string', req: true, desc: 'Snippet body (Max 500KB)' },
        { name: 'title', type: 'string', req: true, desc: 'Snippet title' },
        { name: 'language', type: 'string', req: false, desc: 'javascript, python, html, sql, cpp…' },
        { name: 'ttl', type: 'string', req: false, desc: '"10m", "1h", "1d", "1w", "1m", "never"' },
        { name: 'burn_after_reading', type: 'boolean', req: false, desc: 'Self-destruct after 1 view' },
        { name: 'is_private', type: 'boolean', req: false, desc: 'Hide from public Explore listing' },
        { name: 'password', type: 'string', req: false, desc: 'Optional password protection' },
        { name: 'custom_id', type: 'string', req: false, desc: 'Custom short URL slug (3–32 chars)' },
      ],
      code: {
        curl: `curl -X POST "${base}/api/pastes" \\\n  -H "Authorization: Bearer ${TOKEN}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"title":"Hello","content":"console.log(\\"Hi\\");","language":"javascript","ttl":"1d"}'`,
        javascript: `const res = await fetch('${base}/api/pastes', {\n  method: 'POST',\n  headers: { 'Authorization': 'Bearer ${TOKEN}', 'Content-Type': 'application/json' },\n  body: JSON.stringify({ title: 'Hello', content: 'console.log("Hi");', language: 'javascript', ttl: '1d' })\n});\nconst { paste } = await res.json();\nconsole.log(paste.url, paste.delete_token);`,
        python: `import requests\nres = requests.post("${base}/api/pastes",\n    headers={"Authorization": "Bearer ${TOKEN}"},\n    json={"title": "Hello", "content": "print('Hi')", "language": "python", "ttl": "1d"})\nprint(res.json())`,
      },
    },
    {
      method: 'GET', path: '/api/pastes/:id',
      description: 'Retrieve snippet details and content by ID.',
      params: [
        { name: 'id', type: 'path', req: true, desc: 'Snippet ID or custom slug' },
        { name: 'x-paste-password', type: 'header', req: false, desc: 'Required for password-protected pastes' },
      ],
      code: {
        curl: `curl "${base}/api/pastes/a7x9q2" \\\n  -H "Authorization: Bearer ${TOKEN}"`,
        javascript: `const res = await fetch('${base}/api/pastes/a7x9q2', {\n  headers: { 'Authorization': 'Bearer ${TOKEN}' }\n});\nconsole.log((await res.json()).paste.content);`,
        python: `import requests\nres = requests.get("${base}/api/pastes/a7x9q2",\n    headers={"Authorization": "Bearer ${TOKEN}"})\nprint(res.json()["paste"]["content"])`,
      },
    },
    {
      method: 'GET', path: '/api/pastes/:id/raw',
      description: 'Raw plaintext content — ideal for terminal piping.',
      params: [
        { name: 'id', type: 'path', req: true, desc: 'Snippet ID' },
      ],
      code: {
        curl: `curl "${base}/api/pastes/a7x9q2/raw" \\\n  -H "Authorization: Bearer ${TOKEN}"`,
        javascript: `const text = await fetch('${base}/api/pastes/a7x9q2/raw', {\n  headers: { 'Authorization': 'Bearer ${TOKEN}' }\n}).then(r => r.text());\nconsole.log(text);`,
        python: `import requests\nres = requests.get("${base}/api/pastes/a7x9q2/raw",\n    headers={"Authorization": "Bearer ${TOKEN}"})\nprint(res.text)`,
      },
    },
    {
      method: 'DELETE', path: '/api/pastes/:id',
      description: 'Delete a paste using its secret deletion token.',
      params: [
        { name: 'x-delete-token', type: 'header', req: true, desc: 'Secret token returned at creation' },
      ],
      code: {
        curl: `curl -X DELETE "${base}/api/pastes/a7x9q2" \\\n  -H "Authorization: Bearer ${TOKEN}" \\\n  -H "x-delete-token: YOUR_DELETE_TOKEN"`,
        javascript: `await fetch('${base}/api/pastes/a7x9q2', {\n  method: 'DELETE',\n  headers: { 'Authorization': 'Bearer ${TOKEN}', 'x-delete-token': 'YOUR_DELETE_TOKEN' }\n});`,
        python: `import requests\nrequests.delete("${base}/api/pastes/a7x9q2",\n    headers={"Authorization": "Bearer ${TOKEN}", "x-delete-token": "YOUR_DELETE_TOKEN"})`,
      },
    },
  ];

  const copy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div>
      {/* CLI Quickstart */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
          <Terminal size={18} className="text-emerald" /> CLI — Easiest Way
        </h3>
        <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
          Authenticate once with email & password. No tokens to copy.
        </p>
        <div className="code-container" style={{ margin: 0 }}>
          <div className="code-header">
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>bash/zsh</span>
            <button className="btn btn-secondary btn-sm" onClick={() => copy('pastebin login', 999)}>
              {copiedIndex === 999 ? <Check size={14} className="text-emerald" /> : <Copy size={14} />}
              {copiedIndex === 999 ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="code-body" style={{ fontSize: '0.85rem', lineHeight: '1.8' }}>
            <span style={{ color: 'var(--text-subtle)' }}># Login once</span><br />
            pastebin login<br /><br />
            <span style={{ color: 'var(--text-subtle)' }}># Then pipe anything</span><br />
            $ cat app.log | pastebin --title "Logs" --lang plaintext<br />
            pastebin --file main.py --ttl 1d<br />
            pastebin get &lt;id&gt;
          </div>
        </div>
      </div>

      {/* REST API */}
      <div className="card">
        <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Server size={20} className="text-emerald" /> REST API Reference
            </h2>
            <p className="text-muted" style={{ fontSize: '0.875rem', marginTop: '0.2rem' }}>
              All endpoints require a Bearer session token. Run <code style={{ fontSize: '0.8rem' }}>pastebin login</code> once — it stores the token automatically for CLI use. For raw HTTP calls, pass it as <code style={{ fontSize: '0.8rem' }}>Authorization: Bearer &lt;token&gt;</code>.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: 'var(--bg-tertiary)', padding: '3px', borderRadius: 'var(--radius-sm)' }}>
            {(['curl', 'javascript', 'python'] as const).map(lang => (
              <button key={lang} className="btn btn-sm"
                style={{ background: selectedLanguage === lang ? 'var(--primary)' : 'transparent', color: selectedLanguage === lang ? '#FFF' : 'var(--text-muted)', border: 'none', textTransform: 'capitalize' }}
                onClick={() => setSelectedLanguage(lang)}>
                {lang}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {endpoints.map((ep, idx) => (
            <div key={idx} style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.6rem' }}>
                <span className={`badge ${ep.method === 'POST' ? 'badge-green' : ep.method === 'DELETE' ? 'badge-danger' : 'badge-gray'}`} style={{ fontSize: '0.85rem' }}>
                  {ep.method}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '0.95rem' }}>{ep.path}</span>
              </div>
              <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>{ep.description}</p>

              <div style={{ marginBottom: '1rem', overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                      {['Parameter', 'Type', 'Required', 'Description'].map(h => <th key={h} style={{ padding: '0.5rem 0' }}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {ep.params.map((p, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--bg-tertiary)' }}>
                        <td style={{ padding: '0.4rem 0', fontFamily: 'var(--font-mono)', color: 'var(--primary-hover)', fontWeight: 600 }}>{p.name}</td>
                        <td style={{ padding: '0.4rem 0', color: 'var(--text-subtle)' }}>{p.type}</td>
                        <td style={{ padding: '0.4rem 0' }}>
                          <span className={`badge ${p.req ? 'badge-warning' : 'badge-gray'}`} style={{ fontSize: '0.7rem' }}>{p.req ? 'Required' : 'Optional'}</span>
                        </td>
                        <td style={{ padding: '0.4rem 0', color: 'var(--text-muted)' }}>{p.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="code-container">
                <div className="code-header">
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Example ({selectedLanguage.toUpperCase()})</span>
                  <button className="btn btn-secondary btn-sm" onClick={() => copy(ep.code[selectedLanguage], idx)}>
                    {copiedIndex === idx ? <Check size={14} className="text-emerald" /> : <Copy size={14} />}
                    {copiedIndex === idx ? 'Copied' : 'Copy Code'}
                  </button>
                </div>
                <div className="code-body">{ep.code[selectedLanguage]}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
