import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const isVercel = Boolean(process.env.VERCEL);
const dataDir = process.env.DATA_DIR || (isVercel ? '/tmp/data' : path.join(__dirname, '../data'));

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'pastebin.db');
const db = new Database(dbPath);

try {
  db.pragma('journal_mode = WAL');
} catch (err) {
  // Fallback for environments where WAL mode is restricted
}

db.exec(`
  CREATE TABLE IF NOT EXISTS pastes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'plaintext',
    is_private INTEGER NOT NULL DEFAULT 0,
    burn_after_reading INTEGER NOT NULL DEFAULT 0,
    password_hash TEXT,
    delete_token TEXT NOT NULL,
    views INTEGER NOT NULL DEFAULT 0,
    expires_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_pastes_created ON pastes(created_at);
  CREATE INDEX IF NOT EXISTS idx_pastes_expires ON pastes(expires_at);
`);

const pasteColumns = db.prepare('PRAGMA table_info(pastes)').all() as Array<{ name: string }>;
if (!pasteColumns.some((column) => column.name === 'organization_id')) {
  db.exec('ALTER TABLE pastes ADD COLUMN organization_id TEXT');
  db.exec('CREATE INDEX IF NOT EXISTS idx_pastes_organization_created ON pastes(organization_id, created_at DESC)');
}

export interface Paste {
  id: string;
  title: string;
  content: string;
  language: string;
  is_private: number;
  burn_after_reading: number;
  password_hash: string | null;
  delete_token: string;
  views: number;
  expires_at: string | null;
  created_at: string;
  organization_id: string | null;
}

export function cleanupExpiredPastes(): number {
  const stmt = db.prepare(`
    DELETE FROM pastes 
    WHERE expires_at IS NOT NULL AND datetime(expires_at) <= datetime('now')
  `);
  const result = stmt.run();
  return result.changes;
}

export default db;
