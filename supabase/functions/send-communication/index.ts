import { createClient } from "npm:@supabase/supabase-js@2.57.4";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
const isUuid = (v: unknown): v is string => typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const safeText = (v: unknown, max: number) => typeof v === "string" ? v.trim().slice(0, max) : "";
const parseMessage = (v: string) => { const m = v.match(/^To:([^\r\n]+)\r?\n\r?\n([\s\S]*)$/); return m ? { recipient: m[1].trim(), content: m[2] } : null; };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);
  const authorization = req.headers.get("Authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) return json({ error: "Authentication is required." }, 401);
  const url = Deno.env.get("SUPABASE_URL"), anon = Deno.env.get("SUPABASE_ANON_KEY"), service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anon || !service) return json({ error: "Email delivery is not configured." }, 503);
  const userClient = createClient(url, anon, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false, autoRefreshToken: false } });
  const { data: auth, error: authError } = await userClient.auth.getUser(authorization.slice(7));
  if (authError || !auth.user) return json({ error: "Your BuildFlow session is invalid or expired." }, 401);
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON request." }, 400); }
  const orgId = body.organization_id;
  if (!isUuid(orgId)) return json({ error: "A valid organisation is required." }, 400);
  const { data: member } = await userClient.from("organization_members").select("id")
    .eq("organization_id", orgId).eq("user_id", auth.user.id).eq("status", "active").maybeSingle();
  if (!member) return json({ error: "Active organisation membership is required." }, 403);
  const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: integration, error: intError } = await admin.from("organization_integrations").select("status")
    .eq("organization_id", orgId).eq("provider", "resend_email").maybeSingle();
  if (intError || integration?.status !== "connected") return json({ error: "Email is not enabled. An organisation administrator must connect and verify Resend first." }, 409);
  const { data: stored, error: secretError } = await admin.rpc("integration_secret_read", { target_organization_id: orgId, target_provider: "resend_email" });
  if (secretError || !stored) return json({ error: "The organisation's Resend credentials are unavailable." }, 503);
  let creds: Record<string, unknown>;
  try { const raw = typeof stored === "string" ? stored : (stored as { secret?: string }).secret; creds = typeof raw === "string" ? JSON.parse(raw) : {}; }
  catch { return json({ error: "The organisation's Resend credentials could not be read." }, 500); }
  const apiKey = safeText(creds.apiKey, 500), from = safeText(creds.fromEmail, 320);
  const fromMatch = from.match(/<([^<>]+)>/), sender = (fromMatch?.[1] ?? from).trim();
  if (!apiKey.startsWith("re_") || !emailPattern.test(sender)) return json({ error: "The saved Resend sender configuration is invalid. Reconnect the provider." }, 409);

  let messageId: string | null = isUuid(body.message_id) ? body.message_id : null;
  let recipient = "", subject = "", content = "";
  if (messageId) {
    const { data: saved, error } = await admin.from("messages").select("id,sender_user_id,organization_id,message_type,status,subject,content")
      .eq("id", messageId).eq("organization_id", orgId).eq("sender_user_id", auth.user.id).maybeSingle();
    if (error || !saved) return json({ error: "The saved message could not be found." }, 404);
    if (saved.message_type !== "email") return json({ error: "Only saved email messages can be sent through this service." }, 400);
    if (["sent", "delivered", "read"].includes(saved.status)) return json({ success: true, status: saved.status, message_id: saved.id, message: "This email has already been sent." });
    const parsed = parseMessage(saved.content);
    if (!parsed) return json({ error: "The saved email is missing its recipient or content." }, 400);
    recipient = parsed.recipient; content = parsed.content; subject = saved.subject ?? "BuildFlow message";
  } else {
    recipient = safeText(body.recipient, 320); subject = safeText(body.subject, 200) || "BuildFlow message"; content = safeText(body.content, 10000);
    if (!emailPattern.test(recipient)) return json({ error: "Enter a valid recipient email address." }, 400);
    if (!content) return json({ error: "Enter a message before sending." }, 400);
    const { count, error } = await admin.from("messages").select("id", { count: "exact", head: true })
      .eq("organization_id", orgId).eq("sender_user_id", auth.user.id).eq("message_type", "email")
      .gte("created_at", new Date(Date.now() - 3600000).toISOString());
    if (error) return json({ error: "Unable to verify the sending limit. Try again later." }, 503);
    if ((count ?? 0) >= 30) return json({ error: "The hourly email sending limit has been reached. Try again later." }, 429);
    const { data: created, error: createError } = await admin.from("messages").insert({
      organization_id: orgId, sender_user_id: auth.user.id, subject, content: "To: " + recipient + "\n\n" + content, message_type: "email", status: "draft",
    }).select("id").single();
    if (createError || !created) return json({ error: "The email could not be saved to the organisation outbox." }, 500);
    messageId = created.id;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json", "Idempotency-Key": "buildflow-email-" + messageId },
    body: JSON.stringify({ from, to: [recipient], subject, text: content }),
    signal: AbortSignal.timeout(20000),
  }).catch(() => null);
  if (!response) {
    await admin.from("messages").update({ status: "failed", updated_at: new Date().toISOString() }).eq("id", messageId);
    await admin.from("communication_logs").insert({ organization_id: orgId, communication_type: "email", direction: "outbound", subject, content, status: "failed", created_by: auth.user.id });
    return json({ error: "The email provider could not be reached. You can retry this saved message safely.", message_id: messageId }, 502);
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || typeof payload.id !== "string") {
    await admin.from("messages").update({ status: "failed", updated_at: new Date().toISOString() }).eq("id", messageId);
    await admin.from("communication_logs").insert({ organization_id: orgId, communication_type: "email", direction: "outbound", subject, content, status: "failed", created_by: auth.user.id });
    return json({ error: typeof payload.message === "string" ? payload.message.slice(0, 220) : "Resend rejected the email request.", message_id: messageId }, 502);
  }
  const sentAt = new Date().toISOString();
  const { error: updateError } = await admin.from("messages").update({ status: "sent", updated_at: sentAt }).eq("id", messageId).eq("organization_id", orgId);
  await admin.from("communication_logs").insert({ organization_id: orgId, communication_type: "email", direction: "outbound", subject, content, external_reference: payload.id, communication_date: sentAt, status: "completed", created_by: auth.user.id });
  await admin.from("security_audit_events").insert({ organization_id: orgId, actor_id: auth.user.id, action: "communication.email_sent", target_type: "message", metadata: { message_id: messageId, provider: "resend_email", provider_message_id: payload.id } });
  if (updateError) return json({ error: "The provider accepted the email, but BuildFlow could not update its delivery record. Retrying is safe.", message_id: messageId }, 500);
  return json({ success: true, status: "sent", message_id: messageId, provider_message_id: payload.id });
});
