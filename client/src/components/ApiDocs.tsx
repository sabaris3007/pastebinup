import React, { useState, useEffect } from 'react';
import { Terminal, Copy, Check, Code, Server, Key, Shield } from 'lucide-react';
import { supabase } from '../auth';

export const ApiDocs: React.FC = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<'curl' | 'javascript' | 'python'>('curl');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [token, setToken] = useState<string>('YOUR_SESSION_TOKEN');

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.access_token) {
        setToken(data.session.access_token);
      }
    });
  }, []);

  const baseUrl = window.location.origin;

  const endpoints = [
    {
      method: 'POST',
      path: '/api/pastes',
      description: 'Create a new text or code snippet within your workspace scope.',
      params: [
        { name: 'content', type: 'string', required: true, desc: 'The text or code snippet body (Max 500KB)' },
        { name: 'title', type: 'string', required: false, desc: 'Title of the snippet (Default: "Untitled Snippet")' },
        { name: 'language', type: 'string', required: false, desc: 'Syntax highlighting (javascript, python, html, etc.)' },
        { name: 'ttl', type: 'string', required: false, desc: 'Expiration: "10m", "1h", "1d", "1w", "1m", "never"' },
        { name: 'burn_after_reading', type: 'boolean', required: false, desc: 'Self-destruct paste after 1 view' },
        { name: 'is_private', type: 'boolean', required: false, desc: 'Hide paste from public Explore listing' },
        { name: 'password', type: 'string', required: false, desc: 'Optional password protection lock' },
        { name: 'custom_id', type: 'string', required: false, desc: 'Custom short URL slug (3-32 alphanumeric chars)' }
      ],
      code: {
        curl: `curl -X POST "${baseUrl}/api/pastes" \\
  -H "Authorization: Bearer ${token}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Hello World",
    "content": "console.log(\\"Hello from cURL!\\");",
    "language": "javascript",
    "ttl": "1d"
  }'`,
        javascript: `const res = await fetch('${baseUrl}/api/pastes', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${token}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Hello World',
    content: 'console.log("Hello World!");',
    language: 'javascript',
    ttl: '1d'
  })
});
const data = await res.json();
console.log(data.paste.url, data.paste.delete_token);`,
        python: `import requests

headers = {
    "Authorization": "Bearer ${token}"
}
payload = {
    "title": "Hello World",
    "content": "print('Hello from Python!')",
    "language": "python",
    "ttl": "1d"
}

res = requests.post("${baseUrl}/api/pastes", headers=headers, json=payload)
print(res.json())`
      }
    },
    {
      method: 'GET',
      path: '/api/pastes/:id',
      description: 'Retrieve snippet details and content by ID.',
      params: [
        { name: 'id', type: 'string', required: true, desc: 'Snippet unique ID or custom slug' },
        { name: 'x-paste-password', type: 'header', required: false, desc: 'Header for password-protected pastes' }
      ],
      code: {
        curl: `curl "${baseUrl}/api/pastes/a7x9q2" \\
  -H "Authorization: Bearer ${token}"`,
        javascript: `const res = await fetch('${baseUrl}/api/pastes/a7x9q2', {
  headers: { 'Authorization': 'Bearer ${token}' }
});
const data = await res.json();
console.log(data.paste.content);`,
        python: `import requests

headers = {"Authorization": "Bearer ${token}"}
res = requests.get("${baseUrl}/api/pastes/a7x9q2", headers=headers)
print(res.json()["paste"]["content"])`
      }
    },
    {
      method: 'GET',
      path: '/api/pastes/:id/raw',
      description: 'Fetch raw plaintext snippet content directly (Perfect for terminal & piping).',
      params: [
        { name: 'id', type: 'string', required: true, desc: 'Snippet unique ID' }
      ],
      code: {
        curl: `curl "${baseUrl}/api/pastes/a7x9q2/raw" \\
  -H "Authorization: Bearer ${token}"`,
        javascript: `const res = await fetch('${baseUrl}/api/pastes/a7x9q2/raw', {
  headers: { 'Authorization': 'Bearer ${token}' }
});
const text = await res.text();
console.log(text);`,
        python: `import requests

headers = {"Authorization": "Bearer ${token}"}
res = requests.get("${baseUrl}/api/pastes/a7x9q2/raw", headers=headers)
print(res.text)`
      }
    },
    {
      method: 'DELETE',
      path: '/api/pastes/:id',
      description: 'Delete a paste using its secret deletion token.',
      params: [
        { name: 'x-delete-token', type: 'header', required: true, desc: 'Secret deletion token returned at creation' }
      ],
      code: {
        curl: `curl -X DELETE "${baseUrl}/api/pastes/a7x9q2" \\
  -H "Authorization: Bearer ${token}" \\
  -H "x-delete-token: YOUR_SECRET_DELETE_TOKEN"`,
        javascript: `await fetch('${baseUrl}/api/pastes/a7x9q2', {
  method: 'DELETE',
  headers: {
    'Authorization': 'Bearer ${token}',
    'x-delete-token': 'YOUR_SECRET_DELETE_TOKEN'
  }
});`,
        python: `import requests

headers = {
    "Authorization": "Bearer ${token}",
    "x-delete-token": "YOUR_SECRET_DELETE_TOKEN"
}
res = requests.delete("${baseUrl}/api/pastes/a7x9q2", headers=headers)
print(res.json())`
      }
    }
  ];

  const handleCopyCode = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div>
      {/* CLI Section Card */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Terminal size={20} className="text-emerald" /> Terminal CLI Tool (`bin/pastebin`)
        </h3>
        <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
          Authenticate from your terminal with your email and password, then pipe files or outputs directly into PasteBin.
        </p>

        <div className="code-container" style={{ margin: 0 }}>
          <div className="code-header">
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>CLI Quickstart</span>
            <button className="btn btn-secondary btn-sm" onClick={() => handleCopyCode(`pastebin login\ncat file.txt | pastebin --title "Notes"`, 999)}>
              {copiedIndex === 999 ? <Check size={14} className="text-emerald" /> : <Copy size={14} />}
              {copiedIndex === 999 ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="code-body" style={{ fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-subtle)' }}># 1. Login once with your email & password (Unix style)</span><br />
            <strong>$ pastebin login</strong><br /><br />
            <span style={{ color: 'var(--text-subtle)' }}># 2. Pipe files or scripts straight to PasteBin</span><br />
            <strong>$ cat app.log | pastebin --title "Server Logs" --lang plaintext</strong><br />
            <strong>$ pastebin --file main.py --ttl 1d</strong><br />
            <strong>$ pastebin get &lt;id&gt;</strong>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Server size={22} className="text-emerald" /> REST API Reference
            </h2>
            <p className="text-muted" style={{ fontSize: '0.875rem', marginTop: '0.2rem' }}>
              All endpoints require your Bearer session token.
            </p>
          </div>

          {/* Language Selector Tabs */}
          <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: 'var(--bg-tertiary)', padding: '3px', borderRadius: 'var(--radius-sm)' }}>
            {(['curl', 'javascript', 'python'] as const).map((lang) => (
              <button
                key={lang}
                className={`btn btn-sm ${selectedLanguage === lang ? 'btn-primary' : ''}`}
                style={{
                  background: selectedLanguage === lang ? 'var(--primary)' : 'transparent',
                  color: selectedLanguage === lang ? '#FFF' : 'var(--text-muted)',
                  border: 'none',
                  textTransform: 'capitalize'
                }}
                onClick={() => setSelectedLanguage(lang)}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {endpoints.map((ep, idx) => (
            <div key={idx} style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <span className={`badge ${ep.method === 'POST' ? 'badge-green' : ep.method === 'DELETE' ? 'badge-danger' : 'badge-gray'}`} style={{ fontSize: '0.85rem' }}>
                  {ep.method}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '0.95rem' }}>
                  {ep.path}
                </span>
              </div>

              <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
                {ep.description}
              </p>

              {/* Request Parameters Table */}
              <div style={{ marginBottom: '1rem', overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.5rem 0' }}>Parameter</th>
                      <th style={{ padding: '0.5rem 0' }}>Type</th>
                      <th style={{ padding: '0.5rem 0' }}>Required</th>
                      <th style={{ padding: '0.5rem 0' }}>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ep.params.map((p, pIdx) => (
                      <tr key={pIdx} style={{ borderBottom: '1px solid var(--bg-tertiary)' }}>
                        <td style={{ padding: '0.4rem 0', fontFamily: 'var(--font-mono)', color: 'var(--primary-hover)', fontWeight: 600 }}>{p.name}</td>
                        <td style={{ padding: '0.4rem 0', color: 'var(--text-subtle)' }}>{p.type}</td>
                        <td style={{ padding: '0.4rem 0' }}>
                          <span className={`badge ${p.required ? 'badge-warning' : 'badge-gray'}`} style={{ fontSize: '0.7rem' }}>
                            {p.required ? 'Required' : 'Optional'}
                          </span>
                        </td>
                        <td style={{ padding: '0.4rem 0', color: 'var(--text-muted)' }}>{p.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Code Snippet Box */}
              <div className="code-container">
                <div className="code-header">
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Example ({selectedLanguage.toUpperCase()})
                  </span>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleCopyCode(ep.code[selectedLanguage], idx)}>
                    {copiedIndex === idx ? <Check size={14} className="text-emerald" /> : <Copy size={14} />}
                    {copiedIndex === idx ? 'Copied' : 'Copy Code'}
                  </button>
                </div>
                <div className="code-body">
                  {ep.code[selectedLanguage]}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
