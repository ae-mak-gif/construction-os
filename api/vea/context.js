import { createClient } from '@supabase/supabase-js';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function handler(req, res) {
  const origin = req.headers.origin;
  const host = req.headers.host;

  if (origin) {
    try {
      const parsedOrigin = new URL(origin);
      if (parsedOrigin.host !== host) {
        return res.status(403).json({ error: 'Cross-origin requests are not allowed.' });
      }
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

  const authorization = req.headers.authorization ?? '';
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return res.status(401).json({ error: 'A valid BuildFlow session is required.' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const organizationId = body?.organization_id;
  if (typeof organizationId !== 'string' || !uuidPattern.test(organizationId)) {
    return res.status(400).json({ error: 'A valid organisation identifier is required.' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !publishableKey) {
    return res.status(503).json({ error: 'BuildFlow data access is not configured for this deployment.' });
  }

  const client = createClient(supabaseUrl, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: userResult, error: userError } = await client.auth.getUser(token);
  if (userError || !userResult.user) {
    return res.status(401).json({ error: 'The BuildFlow session is invalid or expired.' });
  }

  const { data: membership, error: membershipError } = await client
    .from('organization_members')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('user_id', userResult.user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (membershipError || !membership) {
    return res.status(403).json({ error: 'You do not have active access to this organisation.' });
  }

  const queries = await Promise.all([
    client.from('projects').select('id,name,project_code,status,health_status,progress_percent,expected_completion_date,contract_value,project_manager_id').eq('organization_id', organizationId).order('updated_at', { ascending: false }).limit(100),
    client.from('tasks').select('id,title,project_id,status,priority,assigned_to,due_date').eq('organization_id', organizationId).order('due_date', { ascending: true }).limit(200),
    client.from('risks').select('id,title,project_id,category,likelihood,impact,status,due_date').eq('organization_id', organizationId).order('updated_at', { ascending: false }).limit(100),
    client.from('purchase_requests').select('id,request_number,project_id,description,status,required_date,estimated_amount').eq('organization_id', organizationId).order('created_at', { ascending: false }).limit(100),
    client.from('purchase_orders').select('id,po_number,project_id,status,total_amount,expected_delivery_date').eq('organization_id', organizationId).order('created_at', { ascending: false }).limit(100),
    client.from('invoices').select('id,invoice_number,project_id,status,issue_date,due_date,total_amount').eq('organization_id', organizationId).order('created_at', { ascending: false }).limit(100),
    client.from('project_budgets').select('id,project_id,cost_code,description,budget_amount,committed_amount,actual_amount,forecast_amount,currency_code').eq('organization_id', organizationId).limit(200),
    client.from('project_costs').select('id,project_id,cost_type,description,amount,cost_date,reference_type').eq('organization_id', organizationId).order('cost_date', { ascending: false }).limit(200),
  ]);

  const failed = queries.find((result) => result.error);
  if (failed) {
    return res.status(502).json({ error: 'Some organisation records could not be retrieved. Check the BuildFlow data permissions.' });
  }

  const [projects, tasks, risks, purchaseRequests, purchaseOrders, invoices, budgets, costs] = queries.map((result) => result.data ?? []);
  return res.status(200).json({
    data: {
      generated_at: new Date().toISOString(),
      organization_id: organizationId,
      projects, tasks, risks,
      purchase_requests: purchaseRequests,
      purchase_orders: purchaseOrders,
      invoices, budgets, costs,
    },
  });
}
