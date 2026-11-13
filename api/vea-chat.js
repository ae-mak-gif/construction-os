export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const authorization = req.headers.authorization;
  if (typeof authorization !== 'string' || !authorization.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'A valid BuildFlow session is required.' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !publishableKey) {
    return res.status(503).json({ error: 'The BuildFlow data connection is not configured for this deployment.' });
  }

  const body = typeof req.body === 'string' ? (() => {
    try { return JSON.parse(req.body); } catch { return null; }
  })() : req.body;
  if (!body || typeof body.message !== 'string' || !body.message.trim() || body.message.length > 4000) {
    return res.status(400).json({ error: 'Enter a message between 1 and 4000 characters.' });
  }

  try {
    const response = await fetch(supabaseUrl.replace(/\/$/, '') + '/functions/v1/vea-chat', {
      method: 'POST',
      headers: {
        Authorization: authorization,
        apikey: publishableKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: body.message.trim(),
        ...(typeof body.conversation_id === 'string' ? { conversation_id: body.conversation_id } : {}),
      }),
    });
    const payload = await response.json().catch(() => ({ error: 'The VEA service returned an invalid response.' }));
    return res.status(response.status).json(payload);
  } catch {
    return res.status(502).json({ error: 'Unable to reach the VEA service. Please try again.' });
  }
}
