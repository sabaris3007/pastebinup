import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import { supabase } from '../auth';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: email.trim(), options: { emailRedirectTo: window.location.origin }
    });
    if (signInError) setError(signInError.message);
    else setMessage('Check your email for your sign-in link.');
  };

  return <div className="card" style={{ maxWidth: 420, margin: '3rem auto' }}>
    <h1 style={{ fontSize: '1.35rem', textAlign: 'center' }}>Sign in to your company workspace</h1>
    <p className="text-muted" style={{ textAlign: 'center', margin: '0.5rem 0 1.25rem' }}>Use your work email to enter your company’s snippets.</p>
    {error && <p style={{ color: 'var(--danger)', marginBottom: '0.75rem' }}>{error}</p>}
    {message && <p style={{ color: 'var(--primary-hover)', marginBottom: '0.75rem' }}>{message}</p>}
    <form onSubmit={submit}>
      <div className="form-group"><input className="form-input" type="email" placeholder="you@company.com" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
      <button className="btn btn-primary" style={{ width: '100%' }}><Mail size={16} /> Email me a login link</button>
    </form>
  </div>;
};
