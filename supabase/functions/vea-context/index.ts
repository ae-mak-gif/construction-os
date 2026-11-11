import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return json({ error: "A valid user session is required." }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !anonKey) {
    return json({ error: "The VEA data service is not configured." }, 503);
  }

  // Use the caller's JWT, never the service-role key. Existing table RLS
  // remains the enforcement boundary for every BuildFlow record returned.
  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const token = authorization.slice("Bearer ".length).trim();
  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData.user) {
    return json({ error: "Your session is invalid or has expired." }, 401);
  }

  const { data: memberships, error: membershipError } = await supabase
    .from("organization_members")
    .select("organization_id, status")
    .eq("user_id", authData.user.id)
    .eq("status", "active")
    .limit(2);

  if (membershipError) {
    return json({ error: "Unable to verify your organisation access." }, 403);
  }
  if (!memberships?.length) {
    return json({ error: "No active BuildFlow organisation membership was found." }, 403);
  }
  if (memberships.length > 1) {
    return json({
      error: "Multiple organisation memberships were found. Select an organisation before using VEA.",
      code: "ORG_SELECTION_REQUIRED",
    }, 409);
  }

  const organizationId = memberships[0].organization_id;

  // These queries are read-only and run under the authenticated user's JWT.
  // The database's RLS policies enforce organisation boundaries.
  const [
    projectsResult,
    tasksResult,
    risksResult,
    purchasesResult,
    invoicesResult,
    eventsResult,
    projectCount,
    taskCount,
    riskCount,
    purchaseCount,
    invoiceCount,
  ] = await Promise.all([
    supabase.from("projects")
      .select("id, name, status, health_status, progress_percent, expected_completion_date, contract_value")
      .order("updated_at", { ascending: false }).limit(12),
    supabase.from("tasks")
      .select("id, title, status, priority, due_date, project_id")
      .order("updated_at", { ascending: false }).limit(12),
    supabase.from("risks")
      .select("id, title, status, likelihood, impact, due_date, project_id")
      .order("updated_at", { ascending: false }).limit(12),
    supabase.from("purchase_requests")
      .select("id, request_number, description, status, required_date, estimated_amount, project_id")
      .order("updated_at", { ascending: false }).limit(12),
    supabase.from("invoices")
      .select("id, invoice_number, status, due_date, total_amount")
      .order("updated_at", { ascending: false }).limit(12),
    supabase.from("calendar_events")
      .select("id, title, start_at, end_at, event_type, project_id")
      .gte("start_at", new Date().toISOString())
      .order("start_at", { ascending: true }).limit(12),
    supabase.from("projects").select("id", { count: "exact", head: true }),
    supabase.from("tasks").select("id", { count: "exact", head: true }),
    supabase.from("risks").select("id", { count: "exact", head: true }),
    supabase.from("purchase_requests").select("id", { count: "exact", head: true }),
    supabase.from("invoices").select("id", { count: "exact", head: true }),
  ]);

  const queryErrors = [
    projectsResult.error, tasksResult.error, risksResult.error,
    purchasesResult.error, invoicesResult.error, eventsResult.error,
    projectCount.error, taskCount.error, riskCount.error,
    purchaseCount.error, invoiceCount.error,
  ].filter(Boolean);

  if (queryErrors.length) {
    // Do not return partial business data: the dashboard must make it clear
    // when the live context is incomplete.
    return json({ error: "Unable to load a complete BuildFlow executive context." }, 502);
  }

  return json({
    source: "buildflow_live",
    generated_at: new Date().toISOString(),
    organization_id: organizationId,
    user_id: authData.user.id,
    summary: {
      projects: projectCount.count ?? 0,
      tasks: taskCount.count ?? 0,
      risks: riskCount.count ?? 0,
      purchase_requests: purchaseCount.count ?? 0,
      invoices: invoiceCount.count ?? 0,
    },
    projects: projectsResult.data ?? [],
    tasks: tasksResult.data ?? [],
    risks: risksResult.data ?? [],
    purchase_requests: purchasesResult.data ?? [],
    invoices: invoicesResult.data ?? [],
    calendar_events: eventsResult.data ?? [],
    permissions: {
      mode: "read_only",
      writes_enabled: false,
      approval_actions_enabled: false,
    },
  });
});
