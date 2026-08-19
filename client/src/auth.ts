import { createClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = url && anonKey ? createClient(url, anonKey) : null;
export const isLoginConfigured = Boolean(supabase);

const PUBLIC_EMAIL_DOMAINS = new Set(['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'icloud.com', 'proton.me']);

export function savedDisplayName(user: User) {
  const name = user.user_metadata?.display_name;
  return typeof name === 'string' && name.trim() ? name.trim() : null;
}

export function workspaceDetails(email: string) {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain || PUBLIC_EMAIL_DOMAINS.has(domain)) {
    return {
      label: 'Private workspace',
      orgName: null,
      description: 'Only you can access this workspace.',
      isCompany: false,
    };
  }
  const rawOrg = domain.split('.')[0] || domain;
  const capitalizedOrg = rawOrg.charAt(0).toUpperCase() + rawOrg.slice(1);
  return {
    label: capitalizedOrg,
    orgName: capitalizedOrg,
    description: `Shared with signed-in users from @${domain}.`,
    isCompany: true,
  };
}

export async function authenticatedFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const { data } = await supabase!.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Please sign in again.');
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}
