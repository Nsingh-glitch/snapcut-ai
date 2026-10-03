import { createClient } from '@supabase/supabase-js';

export function getAdminClient() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('Server Supabase credentials are not configured.');
  }

  return createClient(url, serviceRoleKey);
}

export async function getAuthenticatedUser(req) {
  const authorization = req.headers.authorization || '';
  const token = authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : null;

  if (!token) {
    console.warn('[auth] missing bearer token', { authorizationPresent: Boolean(authorization) });
    const error = new Error('Authentication required.');
    error.statusCode = 401;
    throw error;
  }

  const { data, error } = await getAdminClient().auth.getUser(token);
  if (error || !data.user) {
    console.warn('[auth] token verification failed', { error: error?.message || 'user not found' });
    const authError = new Error('Invalid or expired session.');
    authError.statusCode = 401;
    throw authError;
  }

  console.info('[auth] user verified', { userId: data.user.id });
  return data.user;
}
