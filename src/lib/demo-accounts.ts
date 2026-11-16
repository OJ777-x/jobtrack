// The demo always uses these three fixed login emails, no matter which
// industry template is currently active — that's what makes the "Log in as
// Manager / Worker / Customer" buttons work without change after a template switch.
export const DEMO_PASSWORD = process.env.DEMO_PASSWORD || "DemoPass123!";

export const DEMO_ACCOUNTS = {
  manager: "manager@demo.jobtrack",
  worker: "worker@demo.jobtrack",
  customer: "customer@demo.jobtrack",
} as const;
