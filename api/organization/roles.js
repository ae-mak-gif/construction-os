import { createClient } from '@supabase/supabase-js';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function handler(req, res) {
  const origin = req.headers.origin;
  if (origin) {
    try {
      const parsed = new URL(origin);
      if (parsed.host !== req.headers.host) return res.status(403).json({ error: 'Cross-origin requests are not allowed.' });
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
    } catch {
      return res.status(400).json({ error: 'Invalid request origin.' });
    }
  }
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    return res.status(204).end();
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const token = (req.headers.authorization ?? '').match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return res.status(401).json({ error: 'A valid BuildFlow session is required.' });
  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'The request body must be valid JSON.' });
  }

  const organizationId = body?.organization_id;
  if (typeof organizationId !== 'string' || !uuidPattern.test(organizationId)) {
    return res.status(400).json({ error: 'A valid organisation identifier is required.' });
  }
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return res.status(503).json({ error: 'BuildFlow data access is not configured.' });

  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: authData, error: authError } = await client.auth.getUser(token);
  if (authError || !authData.user) return res.status(401).json({ error: 'The BuildFlow session is invalid or expired.' });

  const { data: membership, error: membershipError } = await client.from('organization_members')
    .select('id').eq('organization_id', organizationId).eq('user_id', authData.user.id).eq('status', 'active').maybeSingle();
  if (membershipError || !membership) return res.status(403).json({ error: 'You do not have active access to this organisation.' });

  const action = body?.action;
  if (action === 'list') {
    const { data, error } = await client.rpc('get_org_roles_permissions', { target_organization_id: organizationId });
    if (error) return res.status(error.code === '42501' ? 403 : 502).json({ error: error.code === '42501' ? 'You do not have permission to manage organisation roles.' : 'Role permissions could not be loaded.' });
    return res.status(200).json({ data });
  }

  if (action === 'create') {
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    if (name.length < 2 || name.length > 60) return res.status(400).json({ error: 'Role name must be between 2 and 60 characters.' });
    const { data, error } = await client.rpc('create_org_role', {
      target_organization_id: organizationId,
      target_name: name,
      target_description: description || null,
    });
    if (error) return res.status(error.code === '42501' ? 403 : 400).json({ error: error.message || 'Role could not be created.' });
    return res.status(201).json({ data: { role_id: data } });
  }

  if (action === 'set_permission') {
    const roleId = body.role_id;
    const permissionKey = body.permission_key;
    const allowed = body.allowed;
    if (typeof roleId !== 'string' || !uuidPattern.test(roleId) || typeof permissionKey !== 'string' || !/^[a-z_]+\.[a-z_]+$/.test(permissionKey) || typeof allowed !== 'boolean') {
      return res.status(400).json({ error: 'A valid role, permission and boolean access value are required.' });
    }
    const { data, error } = await client.rpc('set_org_role_permission', {
      target_organization_id: organizationId,
      target_role_id: roleId,
      target_permission_key: permissionKey,
      target_allowed: allowed,
    });
    if (error) return res.status(error.code === '42501' ? 403 : 400).json({ error: error.message || 'Permission could not be updated.' });
    return res.status(200).json({ data: { updated: data === true } });
  }

  return res.status(400).json({ error: 'Unknown role management action.' });
}
