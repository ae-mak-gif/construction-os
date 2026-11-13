import {
  contextForVEAAgent,
  plannedCapabilityNotice,
  routeVEARequest,
  toolsForVEAAgent,
} from "./vea-routing.ts";

Deno.test("routes a project-only request to Project Intelligence", () => {
  const route = routeVEARequest("Which projects are delayed and which tasks are overdue?");
  if (route.specialistKeys.join(",") !== "project") throw new Error("Expected project route");
});

Deno.test("routes a cross-functional question to multiple specialists", () => {
  const route = routeVEARequest("Compare project delays with unpaid invoices and pending materials purchases");
  if (route.specialistKeys.join(",") !== "project,finance,procurement") {
    throw new Error("Expected project, finance and procurement routes");
  }
});

Deno.test("an executive briefing coordinates all first-wave specialists", () => {
  const route = routeVEARequest("Prepare my executive briefing");
  if (!route.isExecutiveBriefing || route.specialistKeys.length !== 3) {
    throw new Error("Expected all first-wave specialists");
  }
});

Deno.test("an unclassified request stays with the executive context", () => {
  const route = routeVEARequest("Hello, what can you help me with?");
  if (route.specialistKeys.length !== 0) throw new Error("Expected executive-only route");
});

Deno.test("planned capabilities are disclosed rather than fabricated", () => {
  const route = routeVEARequest("Find the latest contract and safety compliance report");
  if (!route.plannedCapabilities.includes("documents") || !route.plannedCapabilities.includes("risk_compliance")) {
    throw new Error("Expected planned capability markers");
  }
  if (!plannedCapabilityNotice(route.plannedCapabilities).includes("not yet connected")) {
    throw new Error("Expected explicit capability notice");
  }
});

Deno.test("specialists receive only their bounded context slices", () => {
  const context = {
    summary: { projects: 1 },
    projects: [{ id: "p1" }],
    tasks: [{ id: "t1" }],
    risks: [{ id: "r1" }],
    invoices: [{ id: "i1" }],
    purchase_requests: [{ id: "pr1" }],
    calendar_events: [{ id: "e1" }],
  };
  const finance = contextForVEAAgent(context, "finance");
  if (!("invoices" in finance) || "projects" in finance || "purchase_requests" in finance) {
    throw new Error("Finance context was not bounded correctly");
  }
});

Deno.test("tool allow-list remains read-only and specialist-specific", () => {
  const financeTools = toolsForVEAAgent("finance");
  if (financeTools.length !== 1 || financeTools[0] !== "buildflow.finance_invoices.read") {
    throw new Error("Unexpected finance tool access");
  }
});
