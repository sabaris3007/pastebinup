import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { requireLogin, getOrganizationIdForEmail } from '../auth';

const router = Router();

// Login endpoint for CLI and terminal tools
router.post('/login', async (req: Request, res: Response) => {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const { email, password } = req.body || {};

  if (!url || !anonKey) {
    return res.status(503).json({ success: false, error: 'Login service is not configured yet.' });
  }

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required.' });
  }

  try {
    const supabase = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await supabase.auth.signInWithPassword({
      email: String(email).trim(),
      password: String(password),
    });

    if (error || !data.session || !data.user?.email) {
      return res.status(401).json({
        success: false,
        error: error?.message || 'Invalid credentials or login failed.'
      });
    }

    const orgId = getOrganizationIdForEmail(data.user.email, data.user.id);

    return res.json({
      success: true,
      token: data.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        organization_id: orgId
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Authentication error.' });
  }
});

// Whoami endpoint to check current session info
router.get('/whoami', requireLogin, (req: Request, res: Response) => {
  res.json({
    success: true,
    organization_id: req.organizationId,
    email: req.userEmail || undefined
  });
});

export default router;
