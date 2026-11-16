import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID") ?? "";
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET") ?? "";
const REDIRECT_URI = Deno.env.get("GOOGLE_REDIRECT_URI") ??
  "https://amqknbijdjpcapwkeyyh.supabase.co/functions/v1/google-oauth";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const providers = ["google_calendar", "google_drive"] as const;
type Provider = typeof providers[number];
const scopes: Record<Provider, string> = {
  google_calendar: "https://www.googleapis.com/auth/calendar.events",
  google_drive: "https://www.googleapis.com/auth/drive.file",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...cors, "Content-Type": "application/json" },
});
const hex = (bytes: Uint8Array) => Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
const sha256 = async (value: string) =>
  hex(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))));
const randomHex = (length: number) => {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return hex(bytes);
};
const base64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
const html = (message: string, ok: boolean) => new Response(
  `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>BuildFlow Google connection</title></head><body style="font:16px system-ui;max-width:560px;margin:12vh auto;padding:24px;color:#1f2937"><h2>${ok ? "Google account authorised" : "Google connection not completed"}</h2><p>${message}</p><p>You can close this tab and return to BuildFlow Settings, then refresh the connection status.</p></body></html>`,
  { status: ok ? 200 : 400, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } },
);

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Google redirects the user's browser to this public callback. State + PKCE
  // bind the callback to a short-lived, single-use organisation authorisation.
  if (request.method === "GET") {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state") ?? "";
    const providerError = url.searchParams.get("error");
    if (providerError) return html("Google did not grant the requested access. Return to BuildFlow and try again if appropriate.", false);
    if (!code || !state || state.length > 256) return html("The authorisation response was incomplete.", false);
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) return html("Google OAuth has not yet been configured by the BuildFlow platform administrator.", false);

    const stateHash = await sha256(state);
    const { data: pending, error: stateError } = await admin.rpc("google_oauth_state_consume", {
      target_state_hash: stateHash,
    });
    if (stateError || !pending) {
      return html("This authorisation request has expired or was already used. Start again from BuildFlow Settings.", false);
    }

    const provider = pending.provider as Provider;
    if (!providers.includes(provider)) return html("The requested Google service is not supported.", false);

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
        code_verifier: pending.code_verifier,
      }),
    });
    const tokens = await tokenResponse.json();
    if (!tokenResponse.ok || !tokens.access_token) {
      console.error("Google token exchange failed", tokenResponse.status, tokens.error);
      return html("Google could not complete the token exchange. Check the OAuth client configuration and authorised redirect URI.", false);
    }

    const profileResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const profile = profileResponse.ok ? await profileResponse.json() : {};
    const { data: existingSecret } = await admin.rpc("integration_secret_read", {
      target_organization_id: pending.organization_id,
      target_provider: provider,
    });
    let existing: Record<string, unknown> = {};
    try {
      const raw = typeof existingSecret === "string" ? existingSecret : existingSecret?.secret;
      if (raw) existing = JSON.parse(raw);
    } catch { existing = {}; }

    const credentialSet = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || existing.refresh_token || null,
      token_type: tokens.token_type || "Bearer",
      scope: tokens.scope || scopes[provider],
      expires_at: Date.now() + Number(tokens.expires_in || 3600) * 1000,
      account_email: typeof profile.email === "string" ? profile.email : null,
    };
    if (!credentialSet.refresh_token) {
      return html("Google authorised the session but did not return offline refresh access. Remove BuildFlow from your Google Account connections and reconnect, ensuring offline access is approved.", false);
    }

    const { error: vaultError } = await admin.rpc("integration_secret_store", {
      target_organization_id: pending.organization_id,
      target_provider: provider,
      target_secret: JSON.stringify(credentialSet),
    });
    if (vaultError) {
      console.error("Google credential vault write failed", vaultError.message);
      return html("Google authorised the account, but BuildFlow could not securely store the connection. Contact the platform administrator.", false);
    }

    const label = credentialSet.account_email || "Google account";
    const { error: upsertError } = await admin.from("organization_integrations").upsert({
      organization_id: pending.organization_id,
      provider,
      status: "connected",
      account_label: label,
      metadata: { scopes: [scopes[provider]], oauth_provider: "google" },
      last_tested_at: new Date().toISOString(),
      last_error: null,
      connected_by: pending.user_id,
      updated_at: new Date().toISOString(),
    }, { onConflict: "organization_id,provider" });
    if (upsertError) {
      console.error("Google integration registry update failed", upsertError.message);
      return html("Google authorised the account, but BuildFlow could not update the connection record.", false);
    }
    await admin.from("security_audit_events").insert({
      organization_id: pending.organization_id,
      actor_id: pending.user_id,
      action: "integration.google_authorised",
      target_type: "organization_integration",
      metadata: { provider, account_email: label },
    });
    return html(`BuildFlow has securely stored the ${provider === "google_calendar" ? "Google Calendar" : "Google Drive"} authorisation for ${label}.`, true);
  }

  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);
  const authorization = request.headers.get("Authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) return json({ error: "Authentication is required." }, 401);
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return json({ error: "Google OAuth is not configured yet. The platform OAuth client credentials must be added to Supabase Development secrets.", code: "GOOGLE_OAUTH_NOT_CONFIGURED" }, 503);
  }

  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: auth, error: authError } = await userClient.auth.getUser(authorization.slice(7));
  if (authError || !auth.user) return json({ error: "Your BuildFlow session is invalid or expired." }, 401);

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return json({ error: "Invalid JSON request." }, 400); }
  const organizationId = typeof body.organization_id === "string" ? body.organization_id : "";
  const provider = typeof body.provider === "string" ? body.provider as Provider : null;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(organizationId) ||
      !provider || !providers.includes(provider)) return json({ error: "A valid organisation and Google provider are required." }, 400);

  const { data: canManage, error: permissionError } = await userClient.rpc("user_can_manage_integrations", {
    target_organization_id: organizationId,
  });
  if (permissionError || canManage !== true) return json({ error: "You do not have permission to manage integrations for this organisation." }, 403);

  // PKCE and a one-time state value prevent intercepted/replayed callbacks.
  const state = randomHex(32);
  const verifier = randomHex(48);
  const challenge = base64url(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))));
  const stateHash = await sha256(state);
  const { error: insertError } = await admin.rpc("google_oauth_state_create", {
    target_state_hash: stateHash,
    target_organization_id: organizationId,
    target_provider: provider,
    target_user_id: auth.user.id,
    target_code_verifier: verifier,
    target_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  });
  if (insertError) return json({ error: "Could not initialise Google authorisation. " + insertError.message }, 500);

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: `openid email ${scopes[provider]}`,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });
  return json({ authorization_url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` });
});
