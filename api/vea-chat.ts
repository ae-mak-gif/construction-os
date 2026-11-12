export default async function handler(request: Request): Promise<Response> {
  const headers = { "Content-Type": "application/json", "Cache-Control": "no-store" };

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed." }), { status: 405, headers });
  }

  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const origin = request.headers.get("origin");
  if (!host || !origin) {
    return new Response(JSON.stringify({ error: "A same-origin browser request is required." }), { status: 403, headers });
  }

  try {
    if (new URL(origin).host.toLowerCase() !== host.toLowerCase()) {
      return new Response(JSON.stringify({ error: "Cross-origin requests are not permitted." }), { status: 403, headers });
    }
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request origin." }), { status: 403, headers });
  }

  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Sign in to use the Executive Assistant." }), { status: 401, headers });
  }

  // Vercel injects this deployment-scoped OIDC token for the function request.
  // It is forwarded server-to-server and is never returned to the browser.
  const oidcToken = request.headers.get("x-vercel-oidc-token");
  if (!oidcToken) {
    return new Response(JSON.stringify({ error: "The Preview deployment has no Vercel OIDC token. Check the project's OIDC configuration." }), { status: 503, headers });
  }

  const env = (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
  const supabaseUrl = env.VITE_SUPABASE_URL;
  const publishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !publishableKey) {
    return new Response(JSON.stringify({ error: "The VEA Preview environment is not configured." }), { status: 503, headers });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON request." }), { status: 400, headers });
  }

  const upstream = await fetch(supabaseUrl.replace(/\/$/, "") + "/functions/v1/vea-chat", {
    method: "POST",
    headers: {
      "Authorization": authorization,
      "apikey": publishableKey,
      "Content-Type": "application/json",
      "x-vercel-oidc-token": oidcToken,
    },
    body: JSON.stringify(body),
  });

  const responseBody = await upstream.text();
  return new Response(responseBody, {
    status: upstream.status,
    headers: {
      ...headers,
      "Content-Type": upstream.headers.get("content-type") || "application/json",
    },
  });
}
