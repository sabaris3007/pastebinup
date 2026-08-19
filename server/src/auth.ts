import { createClient } from '@supabase/supabase-js';
import { NextFunction, Request, Response } from 'express';

declare global {
  namespace Express {
    interface Request {
      organizationId?: string;
    }
  }
}

// Public inboxes must not become one shared "gmail.com" workspace. A custom,
// verified domain is treated as a company; public-email users get a private space.
const PUBLIC_EMAIL_DOMAINS = new Set(['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'icloud.com', 'proton.me']);

export async function requireLogin(req: Request, res: Response, next: NextFunction) {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const token = req.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!url || !anonKey) return res.status(503).json({ success: false, error: 'Login is not configured yet.' });
  if (!token) return res.status(401).json({ success: false, error: 'Please sign in first.' });

  try {
    const supabase = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await supabase.auth.getUser(token);
    const email = data.user?.email?.toLowerCase();
    if (error || !data.user || !email) return res.status(401).json({ success: false, error: 'Your login has expired.' });

    const domain = email.split('@')[1];
    req.organizationId = !domain || PUBLIC_EMAIL_DOMAINS.has(domain) ? `user:${data.user.id}` : `domain:${domain}`;
    return next();
  } catch {
    return res.status(503).json({ success: false, error: 'Login service is temporarily unavailable.' });
  }
}
