import React, { useState } from 'react';
import { LogIn, UserPlus } from 'lucide-react';
import { supabase } from '../auth';

export const Login: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^a-zA-Z0-9]/.test(password) || password.length < 6) {
          setError('Password must be 6+ chars and contain uppercase, lowercase, number & symbol.');
          setLoading(false);
          return;
        }

        let res = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin },
        });

        // Auto-retry once on cold network drop
        if (res.error && res.error.message.toLowerCase().includes('failed')) {
          res = await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: { emailRedirectTo: window.location.origin },
          });
        }

        const { data, error: err } = res;

        if (err) {
          if (err.message.toLowerCase().includes('already registered') || err.message.toLowerCase().includes('already exists')) {
            setError('An account with this email already exists. Please sign in here.');
            setIsSignUp(false);
          } else {
            setError(err.message);
          }
        } else if (data.user && data.user.identities && data.user.identities.length === 0) {
          setError('An account with this email already exists. Please sign in here.');
          setIsSignUp(false);
        } else if (data.session) {
          setMessage('Account created and signed in!');
        } else {
          setMessage('Confirmation link sent! Check your inbox to activate your account.');
        }
      } else {
        let res = await supabase.auth.signInWithPassword({ email: email.trim(), password });

        // Auto-retry once on cold network drop
        if (res.error && res.error.message.toLowerCase().includes('failed')) {
          res = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        }

        const { error: err } = res;
        if (err) {
          setError(err.message.toLowerCase().includes('invalid login credentials')
            ? "Incorrect password or account doesn't exist. Please check your password or sign up."
            : err.message);
        }
      }
    } catch {
      setError('Connection issue. Please check your network and try again.');
    }
    setLoading(false);
  };

  return (
    <div className="card" style={{ maxWidth: 420, margin: '3rem auto' }}>
      <h1 style={{ fontSize: '1.35rem', textAlign: 'center' }}>
        {isSignUp ? 'Create your workspace account' : 'Sign in '}
      </h1>
      <p className="text-muted" style={{ textAlign: 'center', margin: '0.4rem 0 1.2rem' }}>
        {isSignUp ? 'Enter your email and set a password.' : 'Enter your email and password to continue.'}
      </p>

      {error && <p style={{ color: 'var(--danger)', marginBottom: '0.75rem', fontSize: '0.85rem' }}>{error}</p>}
      {message && <p style={{ color: 'var(--primary-hover)', marginBottom: '0.75rem', fontSize: '0.85rem' }}>{message}</p>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input className="form-input" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        </div>
        <div className="form-group">
          <input className="form-input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          {isSignUp && <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.35rem' }}>Requires 6+ chars, uppercase, lowercase, digit & symbol.</p>}
        </div>
        <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
          {isSignUp ? <UserPlus size={16} /> : <LogIn size={16} />}
          <span>{loading ? 'Please wait…' : isSignUp ? 'Create Account' : 'Sign In'}</span>
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem' }}>
        <button type="button" onClick={() => { setIsSignUp(!isSignUp); setError(null); setMessage(null); }} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}>
          {isSignUp ? 'Already have an account? Sign in' : 'First time here? Create an account'}
        </button>
      </div>
    </div>
  );
};
