import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const providers = ["resend_email", "meta_whatsapp", "paynow_sms", "google_calendar", "google_drive", "paynow_payments"] as const;
type Provider = typeof providers[number];
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...cors, "Content-Type": "application/json" },
});
const validEmail = (value: unknown) => typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const required = (value: unknown, label: string) => {
  if (typeof value !== "string" || value.trim().length < 3) throw new Error(label + " is required.");
  return value.trim();
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);
  const authorization = request.headers.get("Authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) return json({ error: "Authentication is required." }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) return json({ error: "Integration service is not configured." }, 503);

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const token = authorization.slice(7);
  const { data: auth, error: authError } = await userClient.auth.getUser(token);
  if (authError || !auth.user) return json({ error: "Your BuildFlow session is invalid or expired." }, 401);

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return json({ error: "Invalid JSON request." }, 400); }
  const organizationId = typeof body.organization_id === "string" ? body.organization_id : "";
  const action = typeof body.action === "string" ? body.action : "";
  const provider = typeof body.provider === "string" ? body.provider as Provider : null;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(organizationId)) {
    return json({ error: "A valid organisation is required." }, 400);
  }
  if (provider && !providers.includes(provider)) return json({ error: "Unsupported provider." }, 400);

  const { data: canManage, error: permissionError } = await userClient.rpc("user_can_manage_integrations", {
    target_organization_id: organizationId,
  });
  if (permissionError || canManage !== true) return json({ error: "You do not have permission to manage integrations for this organisation." }, 403);

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (action === "list") {
    const { data, error } = await admin.from("organization_integrations")
      .select("id, organization_id, provider, status, account_label, metadata, last_tested_at, last_error, connected_by, created_at, updated_at")
      .eq("organization_id", organizationId).order("provider");
    if (error) return json({ error: "Could not load integration status." }, 500);
    return json({ integrations: data ?? [] });
  }

  if (action === "save_credentials") {
    if (!provider || !body.credentials || typeof body.credentials !== "object" || Array.isArray(body.credentials)) {
      return json({ error: "Provider credentials are required." }, 400);
    }
    const credentials = body.credentials as Record<string, unknown>;
    let accountLabel = "";
    try {
      switch (provider) {
        case "resend_email":
          if (!required(credentials.apiKey, "Resend API key").startsWith("re_")) throw new Error("Enter a valid Resend API key.");
          if (!validEmail(credentials.fromEmail)) throw new Error("Enter a valid verified sender email address.");
          accountLabel = String(credentials.fromEmail);
          break;
        case "meta_whatsapp":
          required(credentials.accessToken, "Meta access token");
          accountLabel = "WhatsApp Business · " + required(credentials.phoneNumberId, "Phone number ID");
          break;
        case "paynow_sms":
          required(credentials.username, "TXT API username");
          required(credentials.password, "TXT API password");
          if (!["usd.txt.co.zw", "www.txt.co.zw"].includes(String(credentials.host))) throw new Error("Choose the correct Paynow TXT host.");
          accountLabel = "Paynow TXT · " + String(credentials.host);
          break;
        case "paynow_payments":
          required(credentials.integrationId, "Paynow integration ID");
          required(credentials.integrationKey, "Paynow integration key");
          accountLabel = "Paynow merchant integration";
          break;
        case "google_calendar":
        case "google_drive":
          return json({ error: "Google connections use organisation-authorised OAuth. Configure the Google OAuth application first; do not enter a Google password or client secret here.", code: "OAUTH_REQUIRED" }, 409);
      }
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : "Invalid provider credentials." }, 400);
    }

    const { error: secretError } = await admin.rpc("integration_secret_store", {
      target_organization_id: organizationId,
      target_provider: provider,
      target_secret: JSON.stringify(credentials),
    });
    if (secretError) return json({ error: "Credentials could not be stored securely. " + secretError.message }, 500);

    const { error: upsertError } = await admin.from("organization_integrations").upsert({
      organization_id: organizationId,
      provider,
      status: "pending_setup",
      account_label: accountLabel,
      metadata: { credential_saved: true, activation_requires_test: true },
      last_error: null,
      connected_by: auth.user.id,
      updated_at: new Date().toISOString(),
    }, { onConflict: "organization_id,provider" });
    if (upsertError) return json({ error: "Credentials were stored, but the connection status could not be updated." }, 500);

    await admin.from("security_audit_events").insert({
      organization_id: organizationId,
      actor_id: auth.user.id,
      action: "integration.credentials_saved",
      target_type: "organization_integration",
      metadata: { provider, status: "pending_setup" },
    });
    return json({ success: true, status: "pending_setup", message: "Credentials encrypted and saved. The provider still needs a connection test before it can be marked active." });
  }

  if (action === "disconnect") {
    if (!provider) return json({ error: "Choose a provider to disconnect." }, 400);
    const { error: secretError } = await admin.rpc("integration_secret_delete", {
      target_organization_id: organizationId,
      target_provider: provider,
    });
    if (secretError) return json({ error: "Stored credentials could not be removed." }, 500);
    const { error } = await admin.from("organization_integrations").upsert({
      organization_id: organizationId, provider, status: "disconnected",
      account_label: null, metadata: {}, last_error: null, connected_by: auth.user.id,
      updated_at: new Date().toISOString(),
    }, { onConflict: "organization_id,provider" });
    if (error) return json({ error: "Provider was disconnected but status could not be updated." }, 500);
    return json({ success: true, status: "disconnected" });
  }

  return json({ error: "Unknown integration action." }, 400);
});
