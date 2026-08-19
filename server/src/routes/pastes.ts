import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import db, { Paste } from '../db';
import { requireLogin } from '../auth';

const router = Router();
router.use(requireLogin);

function generateId(length = 8): string {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}

function calculateExpiration(ttl?: string | number): string | null {
  if (!ttl || ttl === 'never') return null;
  const now = new Date();

  if (typeof ttl === 'number') {
    now.setMinutes(now.getMinutes() + ttl);
    return now.toISOString();
  }

  switch (ttl.toLowerCase()) {
    case '10m': now.setMinutes(now.getMinutes() + 10); break;
    case '1h':  now.setHours(now.getHours() + 1); break;
    case '1d':  now.setDate(now.getDate() + 1); break;
    case '1w':  now.setDate(now.getDate() + 7); break;
    case '1m':  now.setMonth(now.getMonth() + 1); break;
    default: return null;
  }
  return now.toISOString();
}

// Create a new paste
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, content, language, is_private, burn_after_reading, password, ttl, custom_id } = req.body;
    const organizationId = req.organizationId!;

    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ success: false, error: 'Content is required' });
    }

    if (content.length > 500000) {
      return res.status(400).json({ success: false, error: 'Content exceeds maximum size limit (500KB)' });
    }

    let pasteId: string;
    if (custom_id && typeof custom_id === 'string' && custom_id.trim()) {
      const trimmedCustomId = custom_id.trim();
      if (!/^[a-zA-Z0-9_-]{3,32}$/.test(trimmedCustomId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid custom ID. Must be 3-32 characters (letters, numbers, hyphens, underscores).'
        });
      }
      const existing = db.prepare('SELECT id FROM pastes WHERE id = ?').get(trimmedCustomId);
      if (existing) {
        return res.status(400).json({
          success: false,
          error: 'Custom ID is already taken.'
        });
      }
      pasteId = trimmedCustomId;
    } else {
      pasteId = generateId(8);
    }

    const pasteTitle = (title && typeof title === 'string' && title.trim()) ? title.trim() : 'Untitled Snippet';
    const pasteLang = (language && typeof language === 'string') ? language.trim().toLowerCase() : 'plaintext';
    const expiresAt = calculateExpiration(ttl);
    const deleteToken = crypto.randomBytes(16).toString('hex');

    let passwordHash: string | null = null;
    if (password && typeof password === 'string' && password.trim()) {
      passwordHash = await bcrypt.hash(password.trim(), 8);
    }

    const stmt = db.prepare(`
      INSERT INTO pastes (id, title, content, language, is_private, burn_after_reading, password_hash, delete_token, expires_at, organization_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      pasteId,
      pasteTitle,
      content,
      pasteLang,
      is_private ? 1 : 0,
      burn_after_reading ? 1 : 0,
      passwordHash,
      deleteToken,
      expiresAt,
      organizationId
    );

    const origin = req.get('origin');
    const host = req.get('x-forwarded-host') || req.get('host');
    const baseUrl = origin || `${req.protocol}://${host}`;

    return res.status(201).json({
      success: true,
      paste: {
        id: pasteId,
        title: pasteTitle,
        content,
        language: pasteLang,
        is_private: Boolean(is_private),
        burn_after_reading: Boolean(burn_after_reading),
        is_password_protected: Boolean(passwordHash),
        expires_at: expiresAt,
        delete_token: deleteToken,
        url: `${baseUrl}/paste/${pasteId}`,
        raw_url: `${baseUrl}/api/pastes/${pasteId}/raw`
      }
    });
  } catch (err) {
    console.error('Error creating paste:', err);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// Get list of public pastes
router.get('/', (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(500, Math.max(1, parseInt(req.query.limit as string) || 12));
    const offset = (page - 1) * limit;
    const search = req.query.search ? `%${(req.query.search as string).trim()}%` : null;
    const lang = req.query.lang ? (req.query.lang as string).trim().toLowerCase() : null;

    const organizationId = req.organizationId!;
    let countQuery = `
      SELECT COUNT(*) as total FROM pastes 
      WHERE organization_id = ?
        AND is_private = 0
        AND burn_after_reading = 0 
        AND password_hash IS NULL 
        AND (expires_at IS NULL OR datetime(expires_at) > datetime('now'))
    `;

    let dataQuery = `
      SELECT id, title, language, views, created_at, expires_at, LENGTH(content) as char_count 
      FROM pastes 
      WHERE organization_id = ?
        AND is_private = 0
        AND burn_after_reading = 0 
        AND password_hash IS NULL 
        AND (expires_at IS NULL OR datetime(expires_at) > datetime('now'))
    `;

    const params: any[] = [organizationId];
    if (search) {
      countQuery += ` AND (title LIKE ? OR content LIKE ?)`;
      dataQuery += ` AND (title LIKE ? OR content LIKE ?)`;
      params.push(search, search);
    }
    if (lang) {
      countQuery += ` AND language = ?`;
      dataQuery += ` AND language = ?`;
      params.push(lang);
    }

    dataQuery += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;

    const countResult = db.prepare(countQuery).get(...params) as { total: number };
    const pastes = db.prepare(dataQuery).all(...params, limit, offset);

    return res.json({
      success: true,
      pastes,
      pagination: {
        page,
        limit,
        total: countResult.total,
        total_pages: Math.ceil(countResult.total / limit)
      }
    });
  } catch (err) {
    console.error('Error fetching pastes:', err);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// Get paste by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const pasteId = req.params.id;
    const paste = db.prepare('SELECT * FROM pastes WHERE id = ? AND organization_id = ?').get(pasteId, req.organizationId) as Paste | undefined;

    if (!paste) {
      return res.status(404).json({ success: false, error: 'Paste not found or has expired' });
    }

    if (paste.expires_at && new Date(paste.expires_at) <= new Date()) {
      db.prepare('DELETE FROM pastes WHERE id = ?').run(pasteId);
      return res.status(404).json({ success: false, error: 'Paste has expired' });
    }

    if (paste.password_hash) {
      const providedPassword = req.headers['x-paste-password'] as string || req.query.password as string;
      if (!providedPassword) {
        return res.status(401).json({
          success: false,
          is_password_protected: true,
          error: 'Password required'
        });
      }
      const match = await bcrypt.compare(providedPassword, paste.password_hash);
      if (!match) {
        return res.status(401).json({
          success: false,
          is_password_protected: true,
          error: 'Incorrect password'
        });
      }
    }

    db.prepare('UPDATE pastes SET views = views + 1 WHERE id = ?').run(pasteId);

    if (paste.burn_after_reading === 1) {
      db.prepare('DELETE FROM pastes WHERE id = ?').run(pasteId);
    }

    return res.json({
      success: true,
      paste: {
        id: paste.id,
        title: paste.title,
        content: paste.content,
        language: paste.language,
        views: paste.views + 1,
        is_private: Boolean(paste.is_private),
        burn_after_reading: Boolean(paste.burn_after_reading),
        is_password_protected: Boolean(paste.password_hash),
        expires_at: paste.expires_at,
        created_at: paste.created_at
      }
    });
  } catch (err) {
    console.error('Error fetching paste:', err);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// Get raw paste text
router.get('/:id/raw', async (req: Request, res: Response) => {
  try {
    const pasteId = req.params.id;
    const paste = db.prepare('SELECT * FROM pastes WHERE id = ? AND organization_id = ?').get(pasteId, req.organizationId) as Paste | undefined;

    if (!paste) {
      return res.status(404).send('Paste not found or has expired.\n');
    }

    if (paste.expires_at && new Date(paste.expires_at) <= new Date()) {
      db.prepare('DELETE FROM pastes WHERE id = ?').run(pasteId);
      return res.status(404).send('Paste has expired.\n');
    }

    if (paste.password_hash) {
      const providedPassword = req.headers['x-paste-password'] as string || req.query.password as string;
      if (!providedPassword) {
        return res.status(401).send('Error: Password required.\n');
      }
      const match = await bcrypt.compare(providedPassword, paste.password_hash);
      if (!match) {
        return res.status(401).send('Error: Incorrect password.\n');
      }
    }

    db.prepare('UPDATE pastes SET views = views + 1 WHERE id = ?').run(pasteId);

    if (paste.burn_after_reading === 1) {
      db.prepare('DELETE FROM pastes WHERE id = ?').run(pasteId);
    }

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.send(paste.content);
  } catch (err) {
    return res.status(500).send('Internal Server Error\n');
  }
});

// Delete paste with deletion token
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const pasteId = req.params.id;
    const token = (req.headers['x-delete-token'] as string) || (req.query.delete_token as string) || req.body?.delete_token;

    if (!token) {
      return res.status(400).json({ success: false, error: 'Deletion token is required' });
    }

    const paste = db.prepare('SELECT delete_token FROM pastes WHERE id = ? AND organization_id = ?').get(pasteId, req.organizationId) as { delete_token: string } | undefined;

    if (!paste) {
      return res.status(404).json({ success: false, error: 'Paste not found' });
    }

    if (paste.delete_token !== token) {
      return res.status(403).json({ success: false, error: 'Invalid deletion token' });
    }

    db.prepare('DELETE FROM pastes WHERE id = ? AND organization_id = ?').run(pasteId, req.organizationId);
    return res.json({ success: true, message: 'Paste deleted successfully' });
  } catch (err) {
    console.error('Error deleting paste:', err);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

export default router;
